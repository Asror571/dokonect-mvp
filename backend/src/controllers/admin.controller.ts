import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const [
    totalOrders,
    todayOrders,
    yesterdayOrders,
    revenue,
    todayRevenue,
    yesterdayRevenue,
    activeDrivers,
    pendingDeliveries,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
    prisma.order.aggregate({ _sum: { totalAmount: true } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: yesterday, lt: today } },
      _sum: { totalAmount: true },
    }),
    prisma.driver.count({ where: { isOnline: true } }),
    prisma.order.count({
      where: { status: { in: ['NEW', 'ACCEPTED', 'IN_TRANSIT'] } },
    }),
  ]);

  const ordersTrend = yesterdayOrders > 0
    ? ((todayOrders - yesterdayOrders) / yesterdayOrders) * 100
    : 0;

  const yesterdayRevenueSum = yesterdayRevenue._sum.totalAmount || 0;
  const todayRevenueSum = todayRevenue._sum.totalAmount || 0;

  const revenueTrend = yesterdayRevenueSum > 0
    ? ((todayRevenueSum - yesterdayRevenueSum) / yesterdayRevenueSum) * 100
    : 0;

  res.json({
    totalOrders,
    ordersTrend: Math.round(ordersTrend),
    revenue: revenue._sum.totalAmount || 0,
    revenueTrend: Math.round(revenueTrend),
    activeDrivers,
    pendingDeliveries,
  });
};

export const getRecentOrders = async (req: Request, res: Response) => {
  const { status } = req.query;
  
  const where: any = {};
  if (status && status !== 'ALL') {
    where.status = status;
  }

  const orders = await prisma.order.findMany({
    where,
    take: status ? undefined : 10,
    orderBy: { createdAt: 'desc' },
    include: {
      client: { include: { user: true } },
      distributor: true,
      driver: { include: { user: true } },
      items: { include: { product: true } },
    },
  });

  res.json(orders);
};

export const getActiveDrivers = async (req: Request, res: Response) => {
  const drivers = await prisma.driver.findMany({
    where: { isOnline: true },
    include: { user: true },
    orderBy: { rating: 'desc' },
  });

  res.json(drivers);
};

export const getAllUsers = async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    include: {
      client: true,
      distributor: true,
      driver: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(users);
};

export const updateUserStatus = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { status } = req.body;

  const user = await prisma.user.update({
    where: { id: userId as string },
    data: { status },
  });

  res.json(user);
};

export const getAnalytics = async (req: Request, res: Response) => {
  const { period = '7d' } = req.query;
  
  const days = period === '30d' ? 30 : period === '7d' ? 7 : 1;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: startDate } },
    include: { items: true },
  });

  const revenueByDay = orders.reduce((acc: any, order) => {
    const date = order.createdAt.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + order.totalAmount;
    return acc;
  }, {});

  res.json({
    revenueByDay,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
  });
};
