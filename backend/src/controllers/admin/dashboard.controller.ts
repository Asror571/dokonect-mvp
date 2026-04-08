import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../prisma/client';
import { sendSuccess } from '../../utils/response';

// GET /api/admin/dashboard - Global platform analytics
export const getGlobalDashboard = asyncHandler(async (req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    // GMV (Gross Merchandise Value)
    totalGMV,
    todayGMV,
    monthGMV,

    // Orders
    totalOrders,
    todayOrders,
    activeOrders,

    // Users
    totalDistributors,
    activeDistributors,
    totalShops,
    activeShops,
    totalDrivers,
    onlineDrivers,

    // Debts
    totalDebt,
    overdueDebt,

    // Products
    totalProducts,
    lowStockProducts,

    // Recent activity
    recentOrders,
    recentUsers,
  ] = await Promise.all([
    // GMV calculations
    prisma.order.aggregate({
      where: { status: { in: ['DELIVERED', 'ACCEPTED', 'IN_TRANSIT'] } },
      _sum: { totalAmount: true }
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: today },
        status: { in: ['DELIVERED', 'ACCEPTED', 'IN_TRANSIT'] }
      },
      _sum: { totalAmount: true }
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { in: ['DELIVERED', 'ACCEPTED', 'IN_TRANSIT'] }
      },
      _sum: { totalAmount: true }
    }),

    // Orders
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({
      where: { status: { in: ['NEW', 'ACCEPTED', 'ASSIGNED', 'IN_TRANSIT'] } }
    }),

    // Users
    prisma.distributor.count(),
    prisma.distributor.count({ where: { isVerified: true } }),
    prisma.client.count(),
    prisma.user.count({ where: { role: 'CLIENT', status: 'ACTIVE' } }),
    prisma.driver.count(),
    prisma.driver.count({ where: { isOnline: true } }),

    // Debts
    prisma.debt.aggregate({
      where: { status: { in: ['UNPAID', 'PARTIAL'] } },
      _sum: { remainingAmount: true }
    }),
    prisma.debt.aggregate({
      where: {
        status: { in: ['UNPAID', 'PARTIAL'] },
        dueDate: { lt: new Date() }
      },
      _sum: { remainingAmount: true }
    }),

    // Products
    prisma.product.count(),
    prisma.inventory.count({ where: { quantity: { lte: prisma.inventory.fields.minThreshold } } }),

    // Recent activity
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { include: { user: { select: { name: true, phone: true } } } },
        distributor: { include: { user: { select: { name: true } } } }
      }
    }),
    prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true
      }
    })
  ]);

  // Calculate growth trends
  const yesterdayStart = new Date(today);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  
  const yesterdayGMV = await prisma.order.aggregate({
    where: {
      createdAt: { gte: yesterdayStart, lt: today },
      status: { in: ['DELIVERED', 'ACCEPTED', 'IN_TRANSIT'] }
    },
    _sum: { totalAmount: true }
  });

  const gmvGrowth = yesterdayGMV._sum.totalAmount
    ? ((todayGMV._sum.totalAmount || 0) - yesterdayGMV._sum.totalAmount) / yesterdayGMV._sum.totalAmount * 100
    : 0;

  // Platform commission (5% example)
  const platformCommission = 0.05;
  const platformRevenue = (totalGMV._sum.totalAmount || 0) * platformCommission;

  sendSuccess(res, {
    gmv: {
      total: totalGMV._sum.totalAmount || 0,
      today: todayGMV._sum.totalAmount || 0,
      month: monthGMV._sum.totalAmount || 0,
      growth: Math.round(gmvGrowth * 100) / 100
    },
    orders: {
      total: totalOrders,
      today: todayOrders,
      active: activeOrders
    },
    users: {
      distributors: {
        total: totalDistributors,
        active: activeDistributors
      },
      shops: {
        total: totalShops,
        active: activeShops
      },
      drivers: {
        total: totalDrivers,
        online: onlineDrivers
      }
    },
    debt: {
      total: totalDebt._sum.remainingAmount || 0,
      overdue: overdueDebt._sum.remainingAmount || 0
    },
    products: {
      total: totalProducts,
      lowStock: lowStockProducts
    },
    platform: {
      commission: platformCommission * 100,
      revenue: platformRevenue
    },
    recentOrders,
    recentUsers
  }, 'Global dashboard', 200);
});

// GET /api/admin/dashboard/growth - Growth chart data
export const getGrowthChart = asyncHandler(async (req: Request, res: Response) => {
  const { period = '30' } = req.query;
  const days = parseInt(period as string);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate },
      status: { in: ['DELIVERED', 'ACCEPTED', 'IN_TRANSIT'] }
    },
    select: {
      createdAt: true,
      totalAmount: true
    }
  });

  // Group by date
  const chartData: any = {};
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];
    chartData[dateKey] = { date: dateKey, gmv: 0, orders: 0 };
  }

  orders.forEach(order => {
    const dateKey = order.createdAt.toISOString().split('T')[0];
    if (chartData[dateKey]) {
      chartData[dateKey].gmv += order.totalAmount;
      chartData[dateKey].orders += 1;
    }
  });

  sendSuccess(res, Object.values(chartData), 'Growth chart', 200);
});
