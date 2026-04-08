import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

// ============================================
// PRODUCT MANAGEMENT - DISTRIBUTOR
// ============================================

const productSchema = z.object({
  name: z.string().min(1, 'Product name required').max(255),
  sku: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  description: z.string().optional(),
  youtubeUrl: z.string().url().optional().or(z.literal('')),
  wholesalePrice: z.number().min(0),
  retailPrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  discountType: z.enum(['PERCENT', 'FIXED']).optional(),
  discountValue: z.number().min(0).optional(),
  unit: z.string().default('pcs'),
  status: z.enum(['ACTIVE', 'DRAFT', 'OUT_OF_STOCK']).default('DRAFT'),
});

// PROD-01: Create Product
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const result = productSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const data = result.data;

  // Generate SKU if not provided
  const sku = data.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Check SKU uniqueness
  const existing = await prisma.product.findUnique({ where: { sku } });
  if (existing) {
    res.status(400);
    throw new Error('SKU already exists');
  }

  const product = await prisma.product.create({
    data: {
      ...data,
      sku,
      distributorId,
    },
    include: {
      category: true,
      brand: true,
      images: true,
    }
  });

  // Create initial inventory record (stock: 0)
  const warehouses = await prisma.warehouse.findMany({
    where: { distributorId, isActive: true }
  });

  if (warehouses.length > 0) {
    await prisma.inventory.create({
      data: {
        productId: product.id,
        warehouseId: warehouses[0].id,
        quantity: 0,
        reserved: 0,
        minThreshold: 5,
      }
    });
  }

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product
  });
});

// Get Products List with filters
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const {
    page = '1',
    limit = '20',
    status,
    categoryId,
    brandId,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const where: any = { distributorId };

  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (brandId) where.brandId = brandId;
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { sku: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy as string]: sortOrder },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { order: 'asc' } },
        variants: true,
        inventory: {
          include: { warehouse: true }
        }
      }
    }),
    prisma.product.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    }
  });
});

// Get Single Product
export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const product = await prisma.product.findFirst({
    where: { id: id as string, distributorId },
    include: {
      category: true,
      brand: true,
      images: { orderBy: { order: 'asc' } },
      variants: {
        include: {
          inventory: { include: { warehouse: true } }
        }
      },
      inventory: {
        include: { warehouse: true }
      },
      priceRules: true,
      bulkRules: { orderBy: { minQuantity: 'asc' } },
    }
  });

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json({
    success: true,
    data: product
  });
});

// Update Product
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const product = await prisma.product.findFirst({
    where: { id, distributorId }
  });

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const result = productSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const updated = await prisma.product.update({
    where: { id },
    data: result.data,
    include: {
      category: true,
      brand: true,
      images: true,
      variants: true,
    }
  });

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: updated
  });
});

// Delete Product (soft delete)
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const product = await prisma.product.findFirst({
    where: { id, distributorId }
  });

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Soft delete by setting status to OUT_OF_STOCK
  await prisma.product.update({
    where: { id },
    data: { status: 'OUT_OF_STOCK' }
  });

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// PROD-02: Product Variants
const variantSchema = z.object({
  color: z.string().optional(),
  size: z.string().optional(),
  model: z.string().optional(),
  skuVariant: z.string().optional(),
  priceOverride: z.number().min(0).optional(),
});

export const createVariant = asyncHandler(async (req: Request, res: Response) => {
  const { id: productId } = req.params;
  const distributorId = req.user?.distributorId;

  const product = await prisma.product.findFirst({
    where: { id: productId as string, distributorId }
  });

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const result = variantSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const data = result.data;

  // Generate SKU variant
  const skuVariant = data.skuVariant || 
    `${product.sku}-${data.color || ''}-${data.size || ''}-${data.model || ''}`.toUpperCase();

  // Check uniqueness
  const existing = await prisma.productVariant.findUnique({
    where: { skuVariant }
  });

  if (existing) {
    res.status(400);
    throw new Error('Variant SKU already exists');
  }

  const variant = await prisma.productVariant.create({
    data: {
      ...data,
      skuVariant,
      productId,
    }
  });

  // Create inventory for variant
  const warehouses = await prisma.warehouse.findMany({
    where: { distributorId, isActive: true }
  });

  if (warehouses.length > 0) {
    await prisma.inventory.create({
      data: {
        productId,
        variantId: variant.id,
        warehouseId: warehouses[0].id,
        quantity: 0,
        reserved: 0,
        minThreshold: 5,
      }
    });
  }

  res.status(201).json({
    success: true,
    message: 'Variant created successfully',
    data: variant
  });
});

export const getVariants = asyncHandler(async (req: Request, res: Response) => {
  const { id: productId } = req.params;
  const distributorId = req.user?.distributorId;

  const product = await prisma.product.findFirst({
    where: { id: productId as string, distributorId }
  });

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const variants = await prisma.productVariant.findMany({
    where: { productId },
    include: {
      inventory: { include: { warehouse: true } }
    }
  });

  res.json({
    success: true,
    data: variants
  });
});

export const updateVariant = asyncHandler(async (req: Request, res: Response) => {
  const { id: productId, variantId } = req.params;
  const distributorId = req.user?.distributorId;

  const product = await prisma.product.findFirst({
    where: { id: productId as string, distributorId }
  });

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const result = variantSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const variant = await prisma.productVariant.update({
    where: { id: variantId as string },
    data: result.data
  });

  res.json({
    success: true,
    message: 'Variant updated successfully',
    data: variant
  });
});

// ...

export const uploadProductImages = asyncHandler(async (req: Request, res: Response) => {
  const { id: productId } = req.params;
  const distributorId = req.user?.distributorId;

  const product = await prisma.product.findFirst({
    where: { id: productId as string, distributorId }
  });

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const { images } = req.body; // Array of { url, order, isCover }

  if (!Array.isArray(images) || images.length === 0) {
    res.status(400);
    throw new Error('Images array required');
  }

  // Delete existing images
  await prisma.productImage.deleteMany({
    where: { productId: productId as string }
  });

  // Create new images
  const created = await prisma.productImage.createMany({
    data: images.map((img: any, index: number) => ({
      productId: productId as string,
      url: img.url,
      order: img.order ?? index,
      isCover: img.isCover ?? (index === 0),
    }))
  });

  const updatedImages = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { order: 'asc' }
  });

  res.json({
    success: true,
    message: 'Images uploaded successfully',
    data: updatedImages
  });
});
