import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../prisma/client';
import { sendSuccess } from '../utils/response';
import { uploadToCloudinary } from '../services/cloudinary.service';

// GET /api/products
export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
  const search       = typeof req.query.search === 'string' ? req.query.search : '';
  const category     = typeof req.query.category === 'string' ? req.query.category : '';
  const minPrice     = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
  const maxPrice     = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
  const distributorId = typeof req.query.distributorId === 'string' ? req.query.distributorId : '';
  const minRating    = req.query.minRating ? parseFloat(req.query.minRating as string) : undefined;
  const inStock      = req.query.inStock === 'true';
  const sortBy       = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'newest';
  const order        = typeof req.query.order === 'string' && req.query.order === 'asc' ? 'asc' : 'desc';
  const page         = parseInt((req.query.page as string) || '1');
  const limit        = parseInt((req.query.limit as string) || '20');
  const skip         = (page - 1) * limit;

  const where: any = {
    isActive: true,
    distributor: { isVerified: true },
  };

  if (search) {
    where.OR = [
      { name:        { contains: search, mode: 'insensitive' } },
      { category:    { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (category)     where.category     = { contains: category, mode: 'insensitive' };
  if (distributorId) where.distributorId = distributorId;
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }
  if (minRating !== undefined) where.avgRating = { gte: minRating };
  if (inStock) where.stock = { gt: 0 };

  const orderBy: any =
    sortBy === 'price'   ? { price: order } :
    sortBy === 'rating'  ? { avgRating: order } :
    sortBy === 'popular' ? { reviewCount: order } :
    { createdAt: 'desc' };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where, orderBy, skip, take: limit,
      include: { distributor: { select: { id: true, companyName: true, phone: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  sendSuccess(res, { products, total, page, limit }, 'Mahsulotlar', 200);
});

// GET /api/products/categories
export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });
  sendSuccess(res, products.map(p => p.category), 'Kategoriyalar', 200);
});

// GET /api/products/:id
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const productId = String(req.params.id);
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { distributor: { select: { id: true, companyName: true, phone: true } } },
  });
  if (!product) { res.status(404); throw new Error('Mahsulot topilmadi'); }
  sendSuccess(res, product, 'Mahsulot', 200);
});

// GET /api/distributor/products
export const getDistributorProducts = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.id } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const products = await prisma.product.findMany({
    where: { distributorId: dist.id },
    orderBy: { createdAt: 'desc' },
  });
  sendSuccess(res, products, 'Sizning mahsulotlaringiz', 200);
});

// POST /api/distributor/products
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.id } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const name = String(req.body.name || '');
  const price = String(req.body.price || '0');
  const description = String(req.body.description || '');
  const category = String(req.body.category || '');
  const unit = String(req.body.unit || 'dona');
  const stock = String(req.body.stock || '0');

  if (!name || !price || !category) {
    res.status(400); throw new Error('Nom, narx va kategoriya kiritilishi shart');
  }

  let imageUrl: string | null = null;
  if (req.file) imageUrl = await uploadToCloudinary(req.file.path);

  const product = await prisma.product.create({
    data: {
      distributorId: dist.id,
      name,
      price: parseFloat(price),
      description,
      category,
      unit,
      stock: parseInt(stock),
      imageUrl,
    },
  });

  sendSuccess(res, product, 'Mahsulot qo\'shildi', 201);
});

// PUT /api/distributor/products/:id
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const productId = String(req.params.id);
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.id } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const existing = await prisma.product.findFirst({ where: { id: productId, distributorId: dist.id } });
  if (!existing) { res.status(404); throw new Error('Mahsulot topilmadi'); }

  const name = req.body.name ? String(req.body.name) : undefined;
  const price = req.body.price ? String(req.body.price) : undefined;
  const description = req.body.description !== undefined ? String(req.body.description) : undefined;
  const category = req.body.category ? String(req.body.category) : undefined;
  const unit = req.body.unit ? String(req.body.unit) : undefined;
  const stock = req.body.stock !== undefined ? String(req.body.stock) : undefined;

  let imageUrl = existing.imageUrl;
  if (req.file) imageUrl = await uploadToCloudinary(req.file.path) || imageUrl;

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      name:        name        || existing.name,
      price:       price       ? parseFloat(price) : existing.price,
      description: description ?? existing.description,
      category:    category    || existing.category,
      unit:        unit        || existing.unit,
      stock:       stock !== undefined ? parseInt(stock) : existing.stock,
      imageUrl,
    },
  });

  sendSuccess(res, product, 'Mahsulot yangilandi', 200);
});

// DELETE /api/distributor/products/:id
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const productId = String(req.params.id);
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.id } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const existing = await prisma.product.findFirst({ where: { id: productId, distributorId: dist.id } });
  if (!existing) { res.status(404); throw new Error('Mahsulot topilmadi'); }

  await prisma.product.update({ where: { id: productId }, data: { isActive: false } });
  sendSuccess(res, null, 'Mahsulot o\'chirildi', 200);
});

// PATCH /api/distributor/products/:id/stock
export const updateProductStock = asyncHandler(async (req: Request, res: Response) => {
  const productId = String(req.params.id);
  const stock = req.body.stock;
  if (stock === undefined) { res.status(400); throw new Error('Stok kiritilishi shart'); }

  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.id } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const product = await prisma.product.findFirst({ where: { id: productId, distributorId: dist.id } });
  if (!product) { res.status(404); throw new Error('Mahsulot topilmadi'); }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { stock: parseInt(String(stock)) },
  });

  sendSuccess(res, updated, 'Stok yangilandi', 200);
});
