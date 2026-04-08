import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import prisma from '../prisma/client';
import { sendSuccess } from '../utils/response';
import { notifyOrderStatus } from '../services/notification.service';
import { OrderStatus } from '@prisma/client';

const createOrderSchema = z.object({
  distributorId: z.string(),
  deliveryAddress: z.string().min(1),
  notes: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'CREDIT', 'BANK_TRANSFER']).optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
  })).min(1),
});

// POST /api/orders - Create order (Client/Store Owner)
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const client = await prisma.client.findUnique({ where: { userId: req.user!.userId } });
  if (!client) { res.status(403); throw new Error('Do\'kon egasi profili topilmadi'); }

  const result = createOrderSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400); throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const { distributorId, deliveryAddress, notes, items, paymentMethod } = result.data;

  let totalAmount = 0;
  const orderItems: { productId: string; quantity: number; unitPrice: number }[] = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: { inventory: true }
    });
    if (!product || product.status !== 'ACTIVE') {
      res.status(404); throw new Error(`Mahsulot topilmadi: ${item.productId}`);
    }
    if (product.distributorId !== distributorId) {
      res.status(400); throw new Error('Mahsulot tanlangan distribyutorga tegishli emas');
    }

    // Check inventory
    const totalInventory = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
    if (totalInventory < item.quantity) {
      res.status(400); throw new Error(`${product.name} uchun yetarli stok yo'q`);
    }

    totalAmount += product.wholesalePrice * item.quantity;
    orderItems.push({ productId: product.id, quantity: item.quantity, unitPrice: product.wholesalePrice });
  }

  const order = await prisma.order.create({
    data: {
      clientId: client.id,
      distributorId,
      deliveryAddress,
      notes,
      totalAmount,
      paymentMethod: paymentMethod || 'CASH',
      items: {
        create: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice
        }))
      },
    },
    include: { items: { include: { product: true } }, distributor: true },
  });

  // Create order status history
  await prisma.orderStatusHistory.create({
    data: {
      orderId: order.id,
      status: 'NEW',
      note: 'Buyurtma yaratildi'
    }
  });

  // Auto-create chat room
  await prisma.chatRoom.upsert({
    where: { storeOwnerId_distributorId: { storeOwnerId: client.id, distributorId } },
    create: { storeOwnerId: client.id, distributorId },
    update: {},
  });

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.emit('order:new', { orderId: order.id, distributorId });
  }

  sendSuccess(res, order, 'Buyurtma qabul qilindi', 201);
});

// GET /api/orders - Get my orders (Client)
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const client = await prisma.client.findUnique({ where: { userId: req.user!.userId } });
  if (!client) { res.status(403); throw new Error('Do\'kon egasi profili topilmadi'); }

  const { status } = req.query;
  const where: any = { clientId: client.id };
  if (status && status !== 'ALL') {
    where.status = status as OrderStatus;
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      distributor: { select: { id: true, companyName: true, phone: true } },
      items: { include: { product: { select: { id: true, name: true, images: { take: 1 } } } } },
      debt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, orders, 'Buyurtmalar', 200);
});

// GET /api/orders/:id - Get order by ID (Client)
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const orderId = String(req.params.id);
  const client = await prisma.client.findUnique({ where: { userId: req.user!.userId } });
  const order = await prisma.order.findFirst({
    where: { id: orderId, clientId: client?.id },
    include: {
      distributor: { select: { id: true, companyName: true, phone: true } },
      items: { include: { product: true } },
      statusHistory: { orderBy: { timestamp: 'desc' } },
      debt: true,
    },
  });
  if (!order) { res.status(404); throw new Error('Buyurtma topilmadi'); }
  sendSuccess(res, order, 'Buyurtma', 200);
});

// GET /api/orders/distributor/orders - Get distributor orders
export const getDistributorOrders = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.userId } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const { status } = req.query;
  const where: any = { distributorId: dist.id };
  if (status && status !== 'ALL') {
    where.status = status as OrderStatus;
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      client: {
        include: {
          user: { select: { name: true, phone: true } }
        }
      },
      items: { include: { product: { select: { id: true, name: true, images: { take: 1 } } } } },
      debt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, orders, 'Buyurtmalar', 200);
});

// GET /api/orders/distributor/orders/:id - Get distributor order by ID
export const getDistributorOrderById = asyncHandler(async (req: Request, res: Response) => {
  const orderId = String(req.params.id);
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.userId } });
  const order = await prisma.order.findFirst({
    where: { id: orderId, distributorId: dist?.id },
    include: {
      client: {
        include: {
          user: { select: { name: true, phone: true } },
          debts: { where: { status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] } } }
        }
      },
      items: { include: { product: true } },
      statusHistory: { orderBy: { timestamp: 'desc' } },
      debt: true,
      delivery: { include: { driver: { include: { user: { select: { name: true, phone: true } } } } } },
    },
  });
  if (!order) { res.status(404); throw new Error('Buyurtma topilmadi'); }
  sendSuccess(res, order, 'Buyurtma', 200);
});

// PATCH /api/orders/distributor/orders/:id/status - Update order status
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const orderId = String(req.params.id);
  const { status, rejectionReason } = req.body;
  if (!status) { res.status(400); throw new Error('Status kiritilishi shart'); }

  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.userId } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const order = await prisma.order.findFirst({
    where: { id: orderId, distributorId: dist.id },
    include: { items: true }
  });
  if (!order) { res.status(404); throw new Error('Buyurtma topilmadi'); }
  if (order.status === 'DELIVERED') { res.status(400); throw new Error('Yetkazilgan buyurtmani o\'zgartirib bo\'lmaydi'); }

  // Status transition validation
  const validTransitions: Record<string, string[]> = {
    'NEW': ['ACCEPTED', 'REJECTED'],
    'ACCEPTED': ['ASSIGNED', 'CANCELLED'],
    'ASSIGNED': ['PICKED', 'CANCELLED'],
    'PICKED': ['IN_TRANSIT'],
    'IN_TRANSIT': ['DELIVERED', 'RETURNED'],
    'REJECTED': [],
    'DELIVERED': [],
    'CANCELLED': [],
    'RETURNED': [],
  };

  if (!validTransitions[order.status]?.includes(status)) {
    res.status(400); throw new Error(`Noto'g'ri status o'tishi: ${order.status} -> ${status}`);
  }

  // Stock management on ACCEPTED
  if (status === 'ACCEPTED') {
    for (const item of order.items) {
      const inventory = await prisma.inventory.findFirst({
        where: { productId: item.productId },
        orderBy: { quantity: 'desc' }
      });
      if (inventory) {
        await prisma.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: { decrement: item.quantity },
            reserved: { increment: item.quantity }
          },
        });
      }
    }
  }

  // Stock management on CANCELLED or REJECTED
  if ((status === 'CANCELLED' || status === 'REJECTED') &&
      (order.status === 'ACCEPTED' || order.status === 'ASSIGNED')) {
    for (const item of order.items) {
      const inventory = await prisma.inventory.findFirst({
        where: { productId: item.productId },
        orderBy: { quantity: 'desc' }
      });
      if (inventory) {
        await prisma.inventory.update({
          where: { id: inventory.id },
          data: {
            reserved: { decrement: item.quantity }
          },
        });
      }
    }
  }

  // Create debt if payment method is CREDIT (nasiya)
  if (status === 'DELIVERED' && order.paymentMethod === 'CREDIT') {
    const existingDebt = await prisma.debt.findUnique({ where: { orderId: order.id } });
    if (!existingDebt) {
      await prisma.debt.create({
        data: {
          orderId: order.id,
          clientId: order.clientId,
          distributorId: dist.id,
          originalAmount: order.totalAmount,
          remainingAmount: order.totalAmount,
          status: 'UNPAID',
        }
      });
    }
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: status as OrderStatus,
      rejectionReason: status === 'REJECTED' ? rejectionReason : undefined
    },
    include: { items: { include: { product: true } }, debt: true },
  });

  // Create status history
  await prisma.orderStatusHistory.create({
    data: {
      orderId: order.id,
      status: status as OrderStatus,
      note: rejectionReason || `Status o'zgartirildi: ${order.status} -> ${status}`
    }
  });

  await notifyOrderStatus(order.id, status, order.clientId, dist.userId);

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.emit('order:status:updated', { orderId: order.id, status, clientId: order.clientId });
  }

  sendSuccess(res, updated, 'Holat yangilandi', 200);
});
