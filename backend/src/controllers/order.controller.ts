import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import { z } from 'zod';
import Order from '../models/Order';
import Product from '../models/Product';
import StoreOwner from '../models/StoreOwner';
import Distributor from '../models/Distributor';
import { sendSuccess } from '../utils/response';

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
  const storeOwner = await StoreOwner.findOne({ userId: req.user!._id });
  if (!storeOwner) { res.status(403); throw new Error('Do\'kon egasi profili topilmadi'); }

  const result = createOrderSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400); throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const { distributorId, address, note, items } = result.data;

  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isActive) {
      res.status(404); throw new Error(`Mahsulot topilmadi: ${item.productId}`);
    }
    if (product.distributorId.toString() !== distributorId) {
      res.status(400); throw new Error('Mahsulot tanlangan distribyutorga tegishli emas');
    }
    if (product.stock < item.quantity) {
      res.status(400); throw new Error(`${product.name} uchun yetarli stok yo'q`);
    }
    totalAmount += product.price * item.quantity;
    orderItems.push({ productId: product._id, quantity: item.quantity, price: product.price });
  }

  // Reduce stock
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
  }

  const order = await Order.create({
    storeOwnerId:  storeOwner._id,
    distributorId: new mongoose.Types.ObjectId(distributorId),
    address,
    note,
    totalAmount,
    items: orderItems,
  });

  sendSuccess(res, formatOrder(order), 'Buyurtma qabul qilindi', 201);
});

// GET /api/orders
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const storeOwner = await StoreOwner.findOne({ userId: req.user!._id });
  if (!storeOwner) { res.status(403); throw new Error('Do\'kon egasi profili topilmadi'); }

  const orders = await Order.find({ storeOwnerId: storeOwner._id })
    .populate({ path: 'distributorId', select: 'companyName phone' })
    .populate({ path: 'items.productId', select: 'name imageUrl' })
    .sort({ createdAt: -1 })
    .lean();

  sendSuccess(res, orders.map(mapOrder), 'Buyurtmalar', 200);
});

// GET /api/orders/:id
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const storeOwner = await StoreOwner.findOne({ userId: req.user!._id });
  const order = await Order.findById(req.params.id)
    .populate('distributorId', 'companyName phone')
    .populate('items.productId', 'name imageUrl')
    .lean();

  if (!order || order.storeOwnerId.toString() !== storeOwner?._id.toString()) {
    res.status(404); throw new Error('Buyurtma topilmadi');
  }
  sendSuccess(res, mapOrder(order), 'Buyurtma', 200);
});

// GET /api/distributor/orders
export const getDistributorOrders = asyncHandler(async (req: Request, res: Response) => {
  const dist = await Distributor.findOne({ userId: req.user!._id });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const orders = await Order.find({ distributorId: dist._id })
    .populate({ path: 'storeOwnerId', select: 'storeName phone' })
    .populate({ path: 'items.productId', select: 'name imageUrl' })
    .sort({ createdAt: -1 })
    .lean();

  sendSuccess(res, orders.map(mapDistOrder), 'Buyurtmalar', 200);
});

// GET /api/distributor/orders/:id
export const getDistributorOrderById = asyncHandler(async (req: Request, res: Response) => {
  const dist = await Distributor.findOne({ userId: req.user!._id });
  const order = await Order.findById(req.params.id)
    .populate('storeOwnerId', 'storeName phone')
    .populate('items.productId', 'name imageUrl')
    .lean();

  if (!order || order.distributorId.toString() !== dist?._id.toString()) {
    res.status(404); throw new Error('Buyurtma topilmadi');
  }
  sendSuccess(res, mapDistOrder(order), 'Buyurtma', 200);
});

// PATCH /api/distributor/orders/:id/status
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  if (!status) { res.status(400); throw new Error('Status kiritilishi shart'); }

  const dist = await Distributor.findOne({ userId: req.user!._id });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const order = await Order.findOne({ _id: req.params.id, distributorId: dist._id });
  if (!order) { res.status(404); throw new Error('Buyurtma topilmadi'); }

  // Restore stock on cancel
  if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
    }
  }

  order.status = status;
  await order.save();
  sendSuccess(res, formatOrder(order), 'Holat yangilandi', 200);
});

// Helpers — map _id to id, rename refs for frontend
function formatOrder(order: any) {
  return { ...order.toObject?.() ?? order, id: order._id };
}

function mapOrder(order: any) {
  return {
    ...order,
    id:          order._id,
    distributor: order.distributorId,
    items: (order.items || []).map((item: any) => ({
      ...item,
      id:      item._id,
      product: item.productId,
      price:   item.price,
    })),
  };
}

function mapDistOrder(order: any) {
  return {
    ...order,
    id:         order._id,
    storeOwner: order.storeOwnerId,
    items: (order.items || []).map((item: any) => ({
      ...item,
      id:      item._id,
      product: item.productId,
      price:   item.price,
    })),
  };
}
