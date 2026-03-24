import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { subDays, startOfDay } from 'date-fns';
import prisma from '../prisma/client';
import { sendSuccess } from '../utils/response';

function getPeriodDate(period: string): Date {
  const days = period === '90d' ? 90 : period === '30d' ? 30 : 7;
  return startOfDay(subDays(new Date(), days));
}

// GET /api/analytics/distributor/overview
export const distributorOverview = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.id } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const [totalOrders, totalRevenue, totalProducts, pendingOrders] = await Promise.all([
    prisma.order.count({ where: { distributorId: dist.id } }),
    prisma.order.aggregate({
      where: { distributorId: dist.id, status: 'DELIVERED' },
      _sum: { totalAmount: true },
    }),
    prisma.product.count({ where: { distributorId: dist.id, isActive: true } }),
    prisma.order.count({ where: { distributorId: dist.id, status: 'PENDING' } }),
  ]);

  sendSuccess(res, {
    totalOrders,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    totalProducts,
    pendingOrders,
  }, 'Umumiy statistika', 200);
});

// GET /api/analytics/distributor/sales
export const distributorSales = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.id } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const period = (req.query.period as string) || '7d';
  const since  = getPeriodDate(period);

  const orders = await prisma.order.findMany({
    where: { distributorId: dist.id, status: 'DELIVERED', createdAt: { gte: since } },
    select: { totalAmount: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date
  const grouped: Record<string, number> = {};
  for (const o of orders) {
    const date = o.createdAt.toISOString().split('T')[0];
    grouped[date] = (grouped[date] || 0) + o.totalAmount;
  }

  const data = Object.entries(grouped).map(([date, revenue]) => ({ date, revenue }));
  sendSuccess(res, data, 'Sotuv statistikasi', 200);
});

// GET /api/analytics/distributor/top-products
export const distributorTopProducts = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.id } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const limit = parseInt(req.query.limit as string) || 5;

  const items = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: { order: { distributorId: dist.id, status: 'DELIVERED' } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });

  const products = await Promise.all(
    items.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, imageUrl: true, price: true },
      });
      return { ...product, totalSold: item._sum.quantity || 0 };
    })
  );

  sendSuccess(res, products, 'Top mahsulotlar', 200);
});

// GET /api/analytics/distributor/top-stores
export const distributorTopStores = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.id } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const limit = parseInt(req.query.limit as string) || 5;

  const orders = await prisma.order.groupBy({
    by: ['storeOwnerId'],
    where: { distributorId: dist.id, status: 'DELIVERED' },
    _sum: { totalAmount: true },
    _count: { id: true },
    orderBy: { _sum: { totalAmount: 'desc' } },
    take: limit,
  });

  const stores = await Promise.all(
    orders.map(async (o) => {
      const store = await prisma.storeOwner.findUnique({
        where: { id: o.storeOwnerId },
        select: { id: true, storeName: true, address: true },
      });
      return { ...store, totalRevenue: o._sum.totalAmount || 0, orderCount: o._count.id };
    })
  );

  sendSuccess(res, stores, 'Top do\'konlar', 200);
});

// GET /api/analytics/admin/overview
export const adminOverview = asyncHandler(async (_req: Request, res: Response) => {
  const [totalUsers, totalOrders, totalRevenue, totalProducts, distributors] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.aggregate({ where: { status: 'DELIVERED' }, _sum: { totalAmount: true } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.distributor.count({ where: { isVerified: true } }),
  ]);

  sendSuccess(res, {
    totalUsers,
    totalOrders,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    totalProducts,
    verifiedDistributors: distributors,
  }, 'Admin statistika', 200);
});

// GET /api/analytics/admin/orders
export const adminOrders = asyncHandler(async (req: Request, res: Response) => {
  const period = (req.query.period as string) || '30d';
  const since  = getPeriodDate(period);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    select: { totalAmount: true, status: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const grouped: Record<string, { count: number; revenue: number }> = {};
  for (const o of orders) {
    const date = o.createdAt.toISOString().split('T')[0];
    if (!grouped[date]) grouped[date] = { count: 0, revenue: 0 };
    grouped[date].count++;
    if (o.status === 'DELIVERED') grouped[date].revenue += o.totalAmount;
  }

  const data = Object.entries(grouped).map(([date, v]) => ({ date, ...v }));
  sendSuccess(res, data, 'Buyurtmalar statistikasi', 200);
});

// GET /api/analytics/admin/revenue
export const adminRevenue = asyncHandler(async (req: Request, res: Response) => {
  const period = (req.query.period as string) || '30d';
  const since  = getPeriodDate(period);

  const orders = await prisma.order.findMany({
    where: { status: 'DELIVERED', createdAt: { gte: since } },
    select: { totalAmount: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const grouped: Record<string, number> = {};
  for (const o of orders) {
    const date = o.createdAt.toISOString().split('T')[0];
    grouped[date] = (grouped[date] || 0) + o.totalAmount;
  }

  const data = Object.entries(grouped).map(([date, revenue]) => ({ date, revenue }));
  sendSuccess(res, data, 'Daromad statistikasi', 200);
});

// GET /api/analytics/admin/users
export const adminUsers = asyncHandler(async (req: Request, res: Response) => {
  const period = (req.query.period as string) || '30d';
  const since  = getPeriodDate(period);

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, role: true },
    orderBy: { createdAt: 'asc' },
  });

  const grouped: Record<string, number> = {};
  for (const u of users) {
    const date = u.createdAt.toISOString().split('T')[0];
    grouped[date] = (grouped[date] || 0) + 1;
  }

  const data = Object.entries(grouped).map(([date, count]) => ({ date, count }));
  sendSuccess(res, data, 'Foydalanuvchilar statistikasi', 200);
});
