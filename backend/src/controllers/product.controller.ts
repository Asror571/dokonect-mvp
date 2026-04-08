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
    status: 'ACTIVE',
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
    where.wholesalePrice = {};
    if (minPrice !== undefined) where.wholesalePrice.gte = minPrice;
    if (maxPrice !== undefined) where.wholesalePrice.lte = maxPrice;
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
      include: { 
        distributor: { select: { id: true, companyName: true, phone: true } },
        images: { where: { isCover: true }, take: 1 }
      },
    }),
    prisma.product.count({ where }),
  ]);

  const formattedProducts = products.map((product: any) => ({
    ...product,
    imageUrl: product.images?.[0]?.url || null
  }));

  sendSuccess(res, { products: formattedProducts, total, page, limit }, 'Mahsulotlar', 200);
});

// GET /api/products/categories
export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    select: { name: true },
    orderBy: { name: 'asc' },
  });
  const categoryNames = categories.map((c: any) => c.name);
  sendSuccess(res, categoryNames, 'Kategoriyalar', 200);
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
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.userId } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const products = await prisma.product.findMany({
    where: { distributorId: dist.id },
    include: { images: { where: { isCover: true }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  });
  
  const formattedProducts = products.map((product: any) => ({
    ...product,
    imageUrl: product.images?.[0]?.url || null
  }));
  
  sendSuccess(res, formattedProducts, 'Sizning mahsulotlaringiz', 200);
});

// POST /api/distributor/products
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.userId } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const name = String(req.body.name || '');
  const wholesalePrice = String(req.body.wholesalePrice || '0');
  const description = String(req.body.description || '');
  const categoryId = String(req.body.categoryId || '');
  const unit = String(req.body.unit || 'dona');

  if (!name || !wholesalePrice || !categoryId) {
    res.status(400); throw new Error('Nom, narx va kategoriya kiritilishi shart');
  }

  let imageUrl: string | null = null;
  if (req.file) imageUrl = await uploadToCloudinary(req.file.path);

  const product = await prisma.product.create({
    data: {
      distributorId: dist.id,
      name,
      wholesalePrice: parseFloat(wholesalePrice),
      description,
      categoryId,
      unit,
      sku: `PRD-${Date.now()}`,
      status: 'ACTIVE',
    },
  });

  if (imageUrl) {
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: imageUrl,
        isCover: true,
      },
    });
  }

  sendSuccess(res, product, 'Mahsulot qo\'shildi', 201);
});

// PUT /api/distributor/products/:id
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const productId = String(req.params.id);
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.userId } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const existing = await prisma.product.findFirst({ where: { id: productId, distributorId: dist.id } });
  if (!existing) { res.status(404); throw new Error('Mahsulot topilmadi'); }

  const name = req.body.name ? String(req.body.name) : undefined;
  const wholesalePrice = req.body.wholesalePrice ? String(req.body.wholesalePrice) : undefined;
  const description = req.body.description !== undefined ? String(req.body.description) : undefined;
  const categoryId = req.body.categoryId ? String(req.body.categoryId) : undefined;
  const unit = req.body.unit ? String(req.body.unit) : undefined;

  const updateData: any = {};
  if (name) updateData.name = name;
  if (wholesalePrice) updateData.wholesalePrice = parseFloat(wholesalePrice);
  if (description !== undefined) updateData.description = description;
  if (categoryId) updateData.categoryId = categoryId;
  if (unit) updateData.unit = unit;

  if (req.file) {
    const imageUrl = await uploadToCloudinary(req.file.path);
    if (imageUrl) {
      const existingImage = await prisma.productImage.findFirst({ 
        where: { productId, isCover: true } 
      });
      
      if (existingImage) {
        await prisma.productImage.update({
          where: { id: existingImage.id },
          data: { url: imageUrl },
        });
      } else {
        await prisma.productImage.create({
          data: { productId, url: imageUrl, isCover: true },
        });
      }
    }
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data: updateData,
  });

  sendSuccess(res, product, 'Mahsulot yangilandi', 200);
});

// DELETE /api/distributor/products/:id
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const productId = String(req.params.id);
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.userId } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const existing = await prisma.product.findFirst({ where: { id: productId, distributorId: dist.id } });
  if (!existing) { res.status(404); throw new Error('Mahsulot topilmadi'); }

  await prisma.product.update({ where: { id: productId }, data: { status: 'DRAFT' } });
  sendSuccess(res, null, 'Mahsulot o\'chirildi', 200);
});

// PATCH /api/distributor/products/:id/stock
export const updateProductStock = asyncHandler(async (req: Request, res: Response) => {
  const productId = String(req.params.id);
  const { quantity } = req.body;
  if (quantity === undefined) { res.status(400); throw new Error('Stok kiritilishi shart'); }

  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.userId } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const product = await prisma.product.findFirst({ where: { id: productId, distributorId: dist.id } });
  if (!product) { res.status(404); throw new Error('Mahsulot topilmadi'); }

  const inventory = await prisma.inventory.findFirst({
    where: { productId }
  });

  if (inventory) {
    await prisma.inventory.update({
      where: { id: inventory.id },
      data: { quantity: parseInt(String(quantity)) },
    });
  } else {
    await prisma.inventory.create({
      data: {
        productId,
        warehouseId: 'default-warehouse',
        quantity: parseInt(String(quantity)),
      },
    });
  }

  sendSuccess(res, { quantity: parseInt(String(quantity)) }, 'Stok yangilandi', 200);
});
