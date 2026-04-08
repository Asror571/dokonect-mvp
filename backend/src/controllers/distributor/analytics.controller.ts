import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, format } from 'date-fns';

const prisma = new PrismaClient();

// ============================================
// ANALYTICS & DASHBOARD - DISTRIBUTOR
// ============================================

// ANA-01: Dashboard Overview
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const today = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  // Today's sales
  const todaySales = await prisma.order.aggregate({
    where: {
      distributorId,
      createdAt: {
        gte: today,
        lte: todayEnd
      },
      status: { not: 'CANCELLED' }
    },
    _sum: { totalAmount: true },
    _count: { id: true }
  });

  // Orders by status
  const ordersByStatus = await prisma.order.groupBy({
    by: ['status'],
    where: { distributorId },
    _count: { id: true }
  });

  const statusCounts = ordersByStatus.reduce((acc: any, item) => {
    acc[item.status] = item._count.id;
    return acc;
  }, {});

  // Low stock alerts
  const allInventory = await prisma.inventory.findMany({
    where: {
      product: { distributorId }
    },
    include: {
      product: {
        include: {
          images: { take: 1 }
        }
      }
    }
  });

  const lowStockCount = allInventory.filter(
    inv => (inv.quantity - inv.reserved) <= inv.minThreshold
  ).length;

  // Active drivers
  const activeDrivers = await prisma.driver.count({
    where: {
      status: 'ACTIVE',
      isOnline: true
    }
  });

  // Orders in transit
  const inTransit = await prisma.order.count({
    where: {
      distributorId,
      status: 'IN_TRANSIT'
    }
  });

  // Sales trend (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return {
      date: startOfDay(date),
      dateEnd: endOfDay(date),
      label: format(date, 'MMM dd')
    };
  });

  const salesTrend = await Promise.all(
    last7Days.map(async ({ date, dateEnd, label }) => {
      const result = await prisma.order.aggregate({
        where: {
          distributorId,
          createdAt: { gte: date, lte: dateEnd },
          status: { not: 'CANCELLED' }
        },
        _sum: { totalAmount: true },
        _count: { id: true }
      });

      return {
        date: label,
        sales: result._sum.totalAmount || 0,
        orders: result._count.id
      };
    })
  );

  // Top 5 products
  const topProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        distributorId,
        status: { not: 'CANCELLED' }
      }
    },
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { total: 'desc' } },
    take: 5
  });

  const topProductsDetails = await Promise.all(
    topProducts.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          images: { take: 1 }
        }
      });
      return {
        product,
        quantity: item._sum.quantity,
        revenue: item._sum.total
      };
    })
  );

  res.json({
    success: true,
    data: {
      todaySales: {
        amount: todaySales._sum.totalAmount || 0,
        count: todaySales._count.id
      },
      orders: {
        new: statusCounts.NEW || 0,
        inProgress: (statusCounts.ACCEPTED || 0) + (statusCounts.ASSIGNED || 0),
        delivered: statusCounts.DELIVERED || 0,
        total: Object.values(statusCounts).reduce((a: any, b: any) => a + b, 0)
      },
      lowStockAlerts: lowStockCount,
      activeDrivers,
      inTransit,
      salesTrend,
      topProducts: topProductsDetails
    }
  });
});

// ANA-02: Sales Reports
export const getSalesReport = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const {
    startDate,
    endDate,
    clientId,
    categoryId,
    groupBy = 'day' // day, week, month
  } = req.query;

  const where: any = {
    distributorId,
    status: { not: 'CANCELLED' }
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate as string);
    if (endDate) where.createdAt.lte = new Date(endDate as string);
  }

  if (clientId) where.clientId = clientId;

  // Overall stats
  const overall = await prisma.order.aggregate({
    where,
    _sum: { totalAmount: true, discount: true },
    _count: { id: true },
    _avg: { totalAmount: true }
  });

  // Orders by status
  const byStatus = await prisma.order.groupBy({
    by: ['status'],
    where,
    _count: { id: true },
    _sum: { totalAmount: true }
  });

  // Top clients
  const topClients = await prisma.order.groupBy({
    by: ['clientId'],
    where,
    _sum: { totalAmount: true },
    _count: { id: true },
    orderBy: { _sum: { totalAmount: 'desc' } },
    take: 10
  });

  const topClientsDetails = await Promise.all(
    topClients.map(async (item) => {
      const client = await prisma.client.findUnique({
        where: { id: item.clientId },
        include: {
          user: {
            select: { name: true, phone: true }
          }
        }
      });
      return {
        client,
        totalAmount: item._sum.totalAmount,
        orderCount: item._count.id
      };
    })
  );

  // Top products
  const topProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: where
    },
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { total: 'desc' } },
    take: 10
  });

  const topProductsDetails = await Promise.all(
    topProducts.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          images: { take: 1 },
          category: true
        }
      });
      return {
        product,
        quantity: item._sum.quantity,
        revenue: item._sum.total
      };
    })
  );

  // Returns/Cancellations
  const returns = await prisma.order.count({
    where: { ...where, status: 'RETURNED' }
  });

  const cancelled = await prisma.order.count({
    where: { ...where, status: 'CANCELLED' }
  });

  res.json({
    success: true,
    data: {
      overall: {
        totalSales: overall._sum.totalAmount || 0,
        totalOrders: overall._count.id,
        averageOrderValue: overall._avg.totalAmount || 0,
        totalDiscount: overall._sum.discount || 0,
        returns,
        cancelled,
        returnRate: overall._count.id > 0 ? (returns / overall._count.id) * 100 : 0
      },
      byStatus,
      topClients: topClientsDetails,
      topProducts: topProductsDetails
    }
  });
});

// ANA-03: Profit/Loss Report
export const getProfitReport = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const {
    startDate,
    endDate,
  } = req.query;

  const where: any = {
    distributorId,
    status: 'DELIVERED'
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate as string);
    if (endDate) where.createdAt.lte = new Date(endDate as string);
  }

  // Get delivered orders
  const orders = await prisma.order.findMany({
    where,
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  let totalRevenue = 0;
  let totalCost = 0;
  let totalProfit = 0;

  const productProfits: any = {};

  orders.forEach(order => {
    order.items.forEach(item => {
      const revenue = item.total;
      const cost = (item.product.costPrice || 0) * item.quantity;
      const profit = revenue - cost;

      totalRevenue += revenue;
      totalCost += cost;
      totalProfit += profit;

      if (!productProfits[item.productId]) {
        productProfits[item.productId] = {
          product: item.product,
          revenue: 0,
          cost: 0,
          profit: 0,
          quantity: 0
        };
      }

      productProfits[item.productId].revenue += revenue;
      productProfits[item.productId].cost += cost;
      productProfits[item.productId].profit += profit;
      productProfits[item.productId].quantity += item.quantity;
    });
  });

  // Sort by profit
  const topProfitProducts = Object.values(productProfits)
    .sort((a: any, b: any) => b.profit - a.profit)
    .slice(0, 10);

  // Monthly profit trend (last 6 months)
  const monthlyProfit = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subDays(new Date(), i * 30));
    const monthEnd = endOfMonth(monthStart);

    const monthOrders = await prisma.order.findMany({
      where: {
        distributorId,
        status: 'DELIVERED',
        createdAt: { gte: monthStart, lte: monthEnd }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    let monthRevenue = 0;
    let monthCost = 0;

    monthOrders.forEach(order => {
      order.items.forEach(item => {
        monthRevenue += item.total;
        monthCost += (item.product.costPrice || 0) * item.quantity;
      });
    });

    monthlyProfit.push({
      month: format(monthStart, 'MMM yyyy'),
      revenue: monthRevenue,
      cost: monthCost,
      profit: monthRevenue - monthCost
    });
  }

  res.json({
    success: true,
    data: {
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
      },
      topProfitProducts,
      monthlyTrend: monthlyProfit
    }
  });
});

// Inventory Analytics
export const getInventoryAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const inventory = await prisma.inventory.findMany({
    where: {
      product: { distributorId }
    },
    include: {
      product: {
        include: {
          images: { take: 1 }
        }
      },
      warehouse: true
    }
  });

  const totalProducts = await prisma.product.count({
    where: { distributorId }
  });

  const totalStock = inventory.reduce((sum, inv) => sum + inv.quantity, 0);
  const totalReserved = inventory.reduce((sum, inv) => sum + inv.reserved, 0);
  const totalAvailable = totalStock - totalReserved;

  const lowStock = inventory.filter(
    inv => (inv.quantity - inv.reserved) <= inv.minThreshold
  );

  const outOfStock = inventory.filter(inv => inv.quantity === 0);

  // Stock value
  const stockValue = await Promise.all(
    inventory.map(async (inv) => {
      const product = await prisma.product.findUnique({
        where: { id: inv.productId }
      });
      return (product?.wholesalePrice || 0) * inv.quantity;
    })
  );

  const totalStockValue = stockValue.reduce((sum, val) => sum + val, 0);

  res.json({
    success: true,
    data: {
      summary: {
        totalProducts,
        totalStock,
        totalReserved,
        totalAvailable,
        totalStockValue,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length
      },
      lowStock: lowStock.map(inv => ({
        ...inv,
        available: inv.quantity - inv.reserved,
        deficit: inv.minThreshold - (inv.quantity - inv.reserved)
      })),
      outOfStock
    }
  });
});
