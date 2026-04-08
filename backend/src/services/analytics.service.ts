import { PrismaClient } from '@prisma/client';
import { DashboardStats } from '../types/distributor.types';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';

const prisma = new PrismaClient();

export class AnalyticsService {
  // ANA-01: Dashboard stats
  async getDashboardStats(distributorId: string): Promise<DashboardStats> {
    const today = new Date();
    const startToday = startOfDay(today);
    const endToday = endOfDay(today);

    // Today's sales
    const todayOrders = await prisma.order.findMany({
      where: {
        distributorId,
        createdAt: { gte: startToday, lte: endToday },
        status: { in: ['DELIVERED', 'PAID'] }
      }
    });

    const todaySales = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Order stats by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: { distributorId },
      _count: true
    });

    const orderStats: any = {
      new: 0,
      accepted: 0,
      assigned: 0,
      in_transit: 0,
      delivered: 0,
      cancelled: 0,
      rejected: 0
    };

    ordersByStatus.forEach(s => {
      const key = s.status.toLowerCase();
      orderStats[key] = s._count;
    });

    // Low stock count
    const inventory = await prisma.inventory.findMany({
      where: { product: { distributorId } }
    });

    const lowStockCount = inventory.filter(
      inv => (inv.quantity - inv.reserved) <= inv.minThreshold
    ).length;

    // Active drivers
    const activeDrivers = await prisma.driver.count({
      where: {
        isOnline: true,
        status: 'ACTIVE'
      }
    });

    return {
      todaySales,
      orderStats,
      lowStockCount,
      activeDrivers
    };
  }

  // ANA-02: Sales report
  async getSalesReport(distributorId: string, filters: any) {
    const { startDate, endDate, clientId, categoryId, warehouseId } = filters;

    const where: any = {
      distributorId,
      status: { in: ['DELIVERED', 'PAID'] }
    };

    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    if (clientId) where.clientId = clientId;

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: { category: true }
            }
          }
        },
        client: {
          include: { user: { select: { name: true } } }
        }
      }
    });

    // Calculate metrics
    const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Top products
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.product.name,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.total;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Returns
    const returns = await prisma.order.count({
      where: {
        ...where,
        status: 'RETURNED'
      }
    });

    const returnRate = totalOrders > 0 ? (returns / totalOrders) * 100 : 0;

    return {
      totalSales,
      totalOrders,
      avgOrderValue,
      topProducts,
      returns,
      returnRate
    };
  }

  // ANA-02: Sales trend (daily/weekly/monthly)
  async getSalesTrend(distributorId: string, period: 'day' | 'week' | 'month') {
    const now = new Date();
    let days = 7;

    switch (period) {
      case 'day':
        days = 7;
        break;
      case 'week':
        days = 28;
        break;
      case 'month':
        days = 365;
        break;
    }

    const startDate = subDays(now, days);

    const orders = await prisma.order.findMany({
      where: {
        distributorId,
        status: { in: ['DELIVERED', 'PAID'] },
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true,
        totalAmount: true
      }
    });

    // Group by date
    const salesByDate: Record<string, number> = {};

    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      salesByDate[date] = (salesByDate[date] || 0) + order.totalAmount;
    });

    return Object.entries(salesByDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // ANA-03: Profit/Loss report
  async getProfitLossReport(distributorId: string, filters: any) {
    const { startDate, endDate } = filters;

    const where: any = {
      distributorId,
      status: { in: ['DELIVERED', 'PAID'] }
    };

    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: { select: { costPrice: true, wholesalePrice: true } }
          }
        }
      }
    });

    let totalRevenue = 0;
    let totalCost = 0;

    orders.forEach(order => {
      totalRevenue += order.totalAmount;
      order.items.forEach(item => {
        const cost = item.product.costPrice || 0;
        totalCost += cost * item.quantity;
      });
    });

    const profit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    // Losses (cancelled/returned orders)
    const losses = await prisma.order.findMany({
      where: {
        distributorId,
        status: { in: ['CANCELLED', 'RETURNED'] },
        createdAt: where.createdAt
      }
    });

    const totalLoss = losses.reduce((sum, order) => sum + order.totalAmount, 0);

    return {
      totalRevenue,
      totalCost,
      profit,
      profitMargin,
      totalLoss,
      netProfit: profit - totalLoss
    };
  }

  // Delivery statistics
  async getDeliveryStats(distributorId: string) {
    const orders = await prisma.order.findMany({
      where: {
        distributorId,
        status: 'DELIVERED'
      },
      include: {
        statusHistory: {
          where: {
            status: { in: ['ACCEPTED', 'DELIVERED'] }
          }
        }
      }
    });

    let totalTime = 0;
    let count = 0;

    orders.forEach(order => {
      const accepted = order.statusHistory.find(h => h.status === 'ACCEPTED');
      const delivered = order.statusHistory.find(h => h.status === 'DELIVERED');

      if (accepted && delivered) {
        const diff = delivered.timestamp.getTime() - accepted.timestamp.getTime();
        totalTime += diff;
        count++;
      }
    });

    const avgDeliveryTime = count > 0 ? Math.round(totalTime / count / 60000) : 0; // minutes

    // Peak hours
    const ordersByHour: Record<number, number> = {};

    orders.forEach(order => {
      const hour = order.createdAt.getHours();
      ordersByHour[hour] = (ordersByHour[hour] || 0) + 1;
    });

    const peakHours = Object.entries(ordersByHour)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      avgDeliveryTime,
      peakHours,
      totalDelivered: orders.length
    };
  }
}
