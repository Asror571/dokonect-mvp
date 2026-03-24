import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod/v4';
import prisma from '../prisma/client';
import { sendSuccess } from '../utils/response';
import { notifyOrderStatus } from '../services/notification.service';

const createOrderSchema = z.object({
  distributorId: z.string(),
  address:       z.string().min(1),
  note:          z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity:  z.number().min(1),
  })).min(1),
});

// POST /api/orders
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const storeOwner = await prisma.storeOwner.findUnique({ where: { userId: req.user!.id } });
  if (!storeOwner) { res.status(403); throw new Error('Do\'kon egasi profili topilmadi'); }

  const result = createOrderSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400); throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const { distributorId, address, note, items } = result.data;

  let totalAmount = 0;
  const orderItems: { productId: string; quantity: number; price: number }[] = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product || !product.isActive) {
      res.status(404); throw new Error(`Mahsulot topilmadi: ${item.productId}`);
    }
    if (product.distributorId !== distributorId) {
      res.status(400); throw new Error('Mahsulot tanlangan distribyutorga tegishli emas');
    }
    if (product.stock < item.quantity) {
      res.status(400); throw new Error(`${product.name} uchun yetarli stok yo'q`);
    }
    totalAmount += product.price * item.quantity;
    orderItems.push({ productId: product.id, quantity: item.quantity, price: product.price });
  }

  const order = await prisma.order.create({
    data: {
      storeOwnerId: storeOwner.id,
      distributorId,
      address,
      note,
      totalAmount,
      items: { create: orderItems },
    },
    include: { items: { include: { product: true } }, distributor: true },
  });

  // Auto-create chat room
  await prisma.chatRoom.upsert({
    where: { storeOwnerId_distributorId: { storeOwnerId: storeOwner.id, distributorId } },
    create: { storeOwnerId: storeOwner.id, distributorId },
    update: {},
  });

  sendSuccess(res, order, 'Buyurtma qabul qilindi', 201);
});

// GET /api/orders
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const storeOwner = await prisma.storeOwner.findUnique({ where: { userId: req.user!.id } });
  if (!storeOwner) { res.status(403); throw new Error('Do\'kon egasi profili topilmadi'); }

  const orders = await prisma.order.findMany({
    where: { storeOwnerId: storeOwner.id },
    include: {
      distributor: { select: { id: true, companyName: true, phone: true } },
      items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, orders, 'Buyurtmalar', 200);
});

// GET /api/orders/:id
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const orderId = String(req.params.id);
  const storeOwner = await prisma.storeOwner.findUnique({ where: { userId: req.user!.id } });
  const order = await prisma.order.findFirst({
    where: { id: orderId, storeOwnerId: storeOwner?.id },
    include: {
      distributor: { select: { id: true, companyName: true, phone: true } },
      items: { include: { product: true } },
    },
  });
  if (!order) { res.status(404); throw new Error('Buyurtma topilmadi'); }
  sendSuccess(res, order, 'Buyurtma', 200);
});

// GET /api/distributor/orders
export const getDistributorOrders = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.id } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const orders = await prisma.order.findMany({
    where: { distributorId: dist.id },
    include: {
      storeOwner: { select: { id: true, storeName: true, phone: true } },
      items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, orders, 'Buyurtmalar', 200);
});

// GET /api/distributor/orders/:id
export const getDistributorOrderById = asyncHandler(async (req: Request, res: Response) => {
  const orderId = String(req.params.id);
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.id } });
  const order = await prisma.order.findFirst({
    where: { id: orderId, distributorId: dist?.id },
    include: {
      storeOwner: { select: { id: true, storeName: true, phone: true } },
      items: { include: { product: true } },
    },
  });
  if (!order) { res.status(404); throw new Error('Buyurtma topilmadi'); }
  sendSuccess(res, order, 'Buyurtma', 200);
});

// PATCH /api/distributor/orders/:id/status
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const orderId = String(req.params.id);
  const { status } = req.body;
  if (!status) { res.status(400); throw new Error('Status kiritilishi shart'); }

  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.id } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const order = await prisma.order.findFirst({ where: { id: orderId, distributorId: dist.id } });
  if (!order) { res.status(404); throw new Error('Buyurtma topilmadi'); }
  if (order.status === 'DELIVERED') { res.status(400); throw new Error('Yetkazilgan buyurtmani o\'zgartirib bo\'lmaydi'); }

  // Stock logic
  if (status === 'CONFIRMED' && order.status === 'PENDING') {
    const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  }
  if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
    const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: status as any },
    include: { items: { include: { product: true } } },
  });

  await notifyOrderStatus(order.id, status, order.storeOwnerId, dist.userId);

  sendSuccess(res, updated, 'Holat yangilandi', 200);
});
