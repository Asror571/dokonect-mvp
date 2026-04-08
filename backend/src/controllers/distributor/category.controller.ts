import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

// ============================================
// CATEGORY MANAGEMENT - DISTRIBUTOR
// ============================================

const categorySchema = z.object({
  name: z.string().min(1, 'Category name required'),
  parentId: z.string().optional(),
  image: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().default(0),
});

// Create Category
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const result = categorySchema.safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const { name, parentId, image, icon, order } = result.data;
  const slug = slugify(name, { lower: true, strict: true });

  // Check slug uniqueness for this distributor
  const existing = await prisma.category.findFirst({
    where: { distributorId, slug }
  });

  if (existing) {
    res.status(400);
    throw new Error('Category with this name already exists');
  }

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      parentId,
      image,
      icon,
      order: order || 0,
      distributorId,
    },
    include: {
      parent: true,
      children: true,
    }
  });

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category
  });
});

// Get Categories Tree
export const getCategoriesTree = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  // Get all categories
  const categories = await prisma.category.findMany({
    where: { distributorId },
    orderBy: { order: 'asc' },
    include: {
      children: {
        include: {
          children: true,
        }
      },
      _count: {
        select: { products: true }
      }
    }
  });

  // Filter root categories (no parent)
  const tree = categories.filter(cat => !cat.parentId);

  res.json({
    success: true,
    data: tree
  });
});

// Get All Categories (flat list)
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const categories = await prisma.category.findMany({
    where: { distributorId },
    orderBy: { order: 'asc' },
    include: {
      parent: true,
      _count: {
        select: { products: true, children: true }
      }
    }
  });

  res.json({
    success: true,
    data: categories
  });
});

// Get Single Category
export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const category = await prisma.category.findFirst({
    where: { id, distributorId },
    include: {
      parent: true,
      children: true,
      products: {
        take: 10,
        include: {
          images: { take: 1 }
        }
      },
      _count: {
        select: { products: true }
      }
    }
  });

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  res.json({
    success: true,
    data: category
  });
});

// Update Category
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const category = await prisma.category.findFirst({
    where: { id, distributorId }
  });

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const result = categorySchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const data = result.data;
  if (data.name) {
    data.slug = slugify(data.name, { lower: true, strict: true });
  }

  const updated = await prisma.category.update({
    where: { id },
    data,
    include: {
      parent: true,
      children: true,
    }
  });

  res.json({
    success: true,
    message: 'Category updated successfully',
    data: updated
  });
});

// Delete Category
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const category = await prisma.category.findFirst({
    where: { id, distributorId },
    include: {
      products: true,
      children: true,
    }
  });

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  // Move products to "Uncategorized" (null category)
  if (category.products.length > 0) {
    await prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null }
    });
  }

  // Move children to parent or root
  if (category.children.length > 0) {
    await prisma.category.updateMany({
      where: { parentId: id },
      data: { parentId: category.parentId }
    });
  }

  await prisma.category.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
});

// Reorder Categories
export const reorderCategories = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const { categories } = req.body; // Array of { id, order }

  if (!Array.isArray(categories)) {
    res.status(400);
    throw new Error('Categories array required');
  }

  // Update order for each category
  await Promise.all(
    categories.map((cat: any) =>
      prisma.category.update({
        where: { id: cat.id },
        data: { order: cat.order }
      })
    )
  );

  res.json({
    success: true,
    message: 'Categories reordered successfully'
  });
});
