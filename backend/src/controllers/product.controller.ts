import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Product from '../models/Product';
import Distributor from '../models/Distributor';
import { sendSuccess } from '../utils/response';
import { uploadToCloudinary } from '../services/cloudinary.service';

// GET /api/products
export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
  const search   = typeof req.query.search === 'string' ? req.query.search : '';
  const category = typeof req.query.category === 'string' ? req.query.category : '';
  const page     = parseInt(req.query.page as string) || 1;
  const limit    = parseInt(req.query.limit as string) || 20;
  const skip     = (page - 1) * limit;

  const filter: any = { isActive: true };
  if (search) {
    filter.$or = [
      { name:        { $regex: search, $options: 'i' } },
      { category:    { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  if (category) filter.category = { $regex: `^${category}$`, $options: 'i' };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('distributorId', 'companyName phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  // Rename distributorId -> distributor for frontend compatibility
  const mapped = products.map((p: any) => ({
    ...p,
    id: p._id,
    distributor: p.distributorId,
    distributorId: p.distributorId?._id || p.distributorId,
  }));

  sendSuccess(res, { products: mapped, total, page, limit }, 'Mahsulotlar', 200);
});

// GET /api/products/categories
export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Product.distinct('category', { isActive: true });
  sendSuccess(res, categories.sort(), 'Kategoriyalar', 200);
});

// GET /api/products/:id
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id)
    .populate('distributorId', 'companyName phone')
    .lean();
  if (!product) { res.status(404); throw new Error('Mahsulot topilmadi'); }
  sendSuccess(res, { ...product, id: (product as any)._id }, 'Mahsulot', 200);
});

// GET /api/distributor/products
export const getDistributorProducts = asyncHandler(async (req: Request, res: Response) => {
  const dist = await Distributor.findOne({ userId: req.user!._id });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const products = await Product.find({ distributorId: dist._id }).sort({ createdAt: -1 }).lean();
  const mapped = products.map((p: any) => ({ ...p, id: p._id }));
  sendSuccess(res, mapped, 'Sizning mahsulotlaringiz', 200);
});

// POST /api/distributor/products
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const dist = await Distributor.findOne({ userId: req.user!._id });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const { name, price, description, category, unit, stock } = req.body;
  if (!name || !price || !category) {
    res.status(400); throw new Error('Nom, narx va kategoriya kiritilishi shart');
  }

  let imageUrl: string | null = null;
  if (req.file) {
    imageUrl = await uploadToCloudinary(req.file.path);
  }

  const product = await Product.create({
    distributorId: dist._id,
    name,
    price:       parseFloat(price),
    description: description || '',
    category,
    unit:        unit || 'dona',
    stock:       parseInt(stock) || 0,
    imageUrl,
  });

  sendSuccess(res, { ...product.toObject(), id: product._id }, 'Mahsulot qo\'shildi', 201);
});

// PUT /api/distributor/products/:id
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const dist = await Distributor.findOne({ userId: req.user!._id });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const product = await Product.findOne({ _id: req.params.id, distributorId: dist._id });
  if (!product) { res.status(404); throw new Error('Mahsulot topilmadi'); }

  const { name, price, description, category, unit, stock } = req.body;
  let imageUrl = product.imageUrl;
  if (req.file) imageUrl = await uploadToCloudinary(req.file.path) || imageUrl;

  product.name        = name        || product.name;
  product.price       = price       ? parseFloat(price) : product.price;
  product.description = description ?? product.description;
  product.category    = category    || product.category;
  product.unit        = unit        || product.unit;
  product.stock       = stock       !== undefined ? parseInt(stock) : product.stock;
  product.imageUrl    = imageUrl    ?? product.imageUrl;

  await product.save();
  sendSuccess(res, { ...product.toObject(), id: product._id }, 'Mahsulot yangilandi', 200);
});

// DELETE /api/distributor/products/:id
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const dist = await Distributor.findOne({ userId: req.user!._id });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const product = await Product.findOne({ _id: req.params.id, distributorId: dist._id });
  if (!product) { res.status(404); throw new Error('Mahsulot topilmadi'); }

  product.isActive = false;
  await product.save();
  sendSuccess(res, null, 'Mahsulot o\'chirildi', 200);
});

// PATCH /api/distributor/products/:id/stock
export const updateProductStock = asyncHandler(async (req: Request, res: Response) => {
  const { stock } = req.body;
  if (stock === undefined) { res.status(400); throw new Error('Stok kiritilishi shart'); }

  const dist = await Distributor.findOne({ userId: req.user!._id });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, distributorId: dist._id },
    { stock: parseInt(stock) },
    { new: true }
  );
  if (!product) { res.status(404); throw new Error('Mahsulot topilmadi'); }

  sendSuccess(res, { ...product.toObject(), id: product._id }, 'Stok yangilandi', 200);
});
