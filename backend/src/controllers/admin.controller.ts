import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../prisma/client';
import { sendSuccess } from '../utils/response';

// GET /api/admin/users
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const role  = (req.query.role as string) || '';
  const page  = parseInt(req.query.page as string) || 1;
  const limit = 20;
  const skip  = (page - 1) * limit;

  const where: any = {};
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, email: true, role: true, isBlocked: true, isVerified: true, createdAt: true,
        storeOwner: { select: { storeName: true, phone: true, address: true } },
        distributor: { select: { companyName: true, phone: true, isVerified: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  sendSuccess(res, { users, total, page }, 'Foydalanuvchilar', 200);
});

// PATCH /api/admin/users/:id/block
export const blockUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isBlocked: true },
    select: { id: true, email: true, isBlocked: true },
  });
  sendSuccess(res, user, 'Foydalanuvchi bloklandi', 200);
});

// PATCH /api/admin/users/:id/unblock
export const unblockUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isBlocked: false },
    select: { id: true, email: true, isBlocked: true },
  });
  sendSuccess(res, user, 'Foydalanuvchi blokdan chiqarildi', 200);
});

// PATCH /api/admin/distributors/:id/verify
export const verifyDistributor = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.update({
    where: { id: req.params.id },
    data: { isVerified: true },
    select: { id: true, companyName: true, isVerified: true },
  });
  sendSuccess(res, dist, 'Distribyutor tasdiqlandi', 200);
});

// GET /api/admin/products
export const getAdminProducts = asyncHandler(async (req: Request, res: Response) => {
  const page  = parseInt(req.query.page as string) || 1;
  const limit = 20;
  const skip  = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      include: { distributor: { select: { companyName: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.product.count(),
  ]);

  sendSuccess(res, { products, total, page }, 'Mahsulotlar', 200);
});

// PATCH /api/admin/products/:id/deactivate
export const deactivateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive: false },
    select: { id: true, name: true, isActive: true },
  });
  sendSuccess(res, product, 'Mahsulot deaktiv qilindi', 200);
});

// GET /api/admin/orders
export const getAdminOrders = asyncHandler(async (req: Request, res: Response) => {
  const status = (req.query.status as string) || '';
  const page   = parseInt(req.query.page as string) || 1;
  const limit  = 20;
  const skip   = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        storeOwner: { select: { storeName: true } },
        distributor: { select: { companyName: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  sendSuccess(res, { orders, total, page }, 'Buyurtmalar', 200);
});
