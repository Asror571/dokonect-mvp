import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDistributorDashboard = async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [incomingOrders, readyOrders, shippedOrders, lowStockProducts, revenue] =
    await Promise.all([
      prisma.order.count({
        where: { distributorId, status: 'PENDING' },
      }),
      prisma.order.count({
        where: { distributorId, status: 'READY_FOR_PICKUP' },
      }),
      prisma.order.count({
        where: {
          distributorId,
          status: { in: ['PICKED_UP', 'IN_TRANSIT', 'DELIVERED'] },
          createdAt: { gte: today },
        },
      }),
      prisma.product.count({
        where: {
          distributorId,
          stockQty: { lte: prisma.product.fields.minStock },
        },
      }),
      prisma.order.aggregate({
        where: {
          distributorId,
          createdAt: { gte: today },
        },
        _sum: { totalAmount: true },
      }),
    ]);

  res.json({
    incomingOrders,
    readyOrders,
    shippedOrders,
    lowStockProducts,
    revenue: revenue._sum.totalAmount || 0,
  });
};

export const getDistributorOrders = async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  const { status, search } = req.query;

  const where: any = { distributorId };
  if (status) where.status = status;

  const orders = await prisma.order.findMany({
    where,
    include: {
      client: { include: { user: true } },
      driver: { include: { user: true } },
      items: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(orders);
};

export const acceptOrder = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: 'ACCEPTED' },
    include: {
      client: { include: { user: true } },
      items: { include: { product: true } },
    },
  });

  await prisma.orderStatusHistory.create({
    data: { orderId, status: 'ACCEPTED' },
  });

  // Notify client
  req.app.get('io').to(order.clientId).emit('order:accepted', order);

  res.json(order);
};

export const rejectOrder = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: 'CANCELLED' },
  });

  await prisma.orderStatusHistory.create({
    data: { orderId, status: 'CANCELLED', note: reason },
  });

  req.app.get('io').to(order.clientId).emit('order:cancelled', { order, reason });

  res.json(order);
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });

  await prisma.orderStatusHistory.create({
    data: { orderId, status },
  });

  req.app.get('io').to(order.clientId).emit('order:status_update', order);

  res.json(order);
};

export const getProducts = async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;

  const products = await prisma.product.findMany({
    where: { distributorId },
    orderBy: { createdAt: 'desc' },
  });

  res.json(products);
};

export const createProduct = async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  const { name, sku, description, price, unit, stockQty, minStock, category, photo } =
    req.body;

  const product = await prisma.product.create({
    data: {
      distributorId: distributorId!,
      name,
      sku,
      description,
      price,
      unit,
      stockQty,
      minStock,
      category,
      photo,
    },
  });

  res.status(201).json(product);
};

export const updateProduct = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const data = req.body;

  const product = await prisma.product.update({
    where: { id: productId },
    data,
  });

  res.json(product);
};

export const updateStock = async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  const { productId } = req.params;
  const { quantity, type, note } = req.body;

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const newQty =
    type === 'IN'
      ? product.stockQty + quantity
      : type === 'OUT'
      ? product.stockQty - quantity
      : quantity;

  const [updatedProduct] = await Promise.all([
    prisma.product.update({
      where: { id: productId },
      data: { stockQty: newQty },
    }),
    prisma.stockLog.create({
      data: {
        productId,
        distributorId: distributorId!,
        type,
        quantity,
        note,
      },
    }),
  ]);

  // Check for low stock alert
  if (updatedProduct.stockQty <= updatedProduct.minStock) {
    req.app.get('io').to(distributorId).emit('stock:low_alert', {
      product: updatedProduct,
    });
  }

  res.json(updatedProduct);
};

export const getStockLogs = async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;

  const logs = await prisma.stockLog.findMany({
    where: { distributorId },
    include: { product: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  res.json(logs);
};
