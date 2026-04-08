import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

// ============================================
// BRAND MANAGEMENT - DISTRIBUTOR
// ============================================

const brandSchema = z.object({
  name: z.string().min(1, 'Brand name required'),
  logo: z.string().optional(),
});

export const createBrand = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const result = brandSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const { name, logo } = result.data;
  const slug = slugify(name, { lower: true, strict: true });

  const existing = await prisma.brand.findFirst({
    where: { distributorId, slug }
  });

  if (existing) {
    res.status(400);
    throw new Error('Brand with this name already exists');
  }

  const brand = await prisma.brand.create({
    data: {
      name,
      slug,
      logo,
      distributorId,
    }
  });

  res.status(201).json({
    success: true,
    message: 'Brand created successfully',
    data: brand
  });
});

export const getBrands = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const brands = await prisma.brand.findMany({
    where: { distributorId },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  res.json({
    success: true,
    data: brands
  });
});

export const getBrand = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const brand = await prisma.brand.findFirst({
    where: { id, distributorId },
    include: {
      products: {
        take: 20,
        include: {
          images: { take: 1 }
        }
      },
      _count: {
        select: { products: true }
      }
    }
  });

  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }

  res.json({
    success: true,
    data: brand
  });
});

export const updateBrand = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const brand = await prisma.brand.findFirst({
    where: { id, distributorId }
  });

  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }

  const result = brandSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const data = result.data;
  if (data.name) {
    data.slug = slugify(data.name, { lower: true, strict: true });
  }

  const updated = await prisma.brand.update({
    where: { id },
    data
  });

  res.json({
    success: true,
    message: 'Brand updated successfully',
    data: updated
  });
});

export const deleteBrand = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const brand = await prisma.brand.findFirst({
    where: { id, distributorId },
    include: {
      products: true
    }
  });

  if (!brand) {
    res.status(404);
    throw new Error('Brand not found');
  }

  // Set products' brand to null
  if (brand.products.length > 0) {
    await prisma.product.updateMany({
      where: { brandId: id },
      data: { brandId: null }
    });
  }

  await prisma.brand.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Brand deleted successfully'
  });
});
