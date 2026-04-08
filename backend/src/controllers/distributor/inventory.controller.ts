import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// INVENTORY MANAGEMENT - DISTRIBUTOR
// ============================================

// Get Inventory List
export const getInventory = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const {
    page = '1',
    limit = '50',
    warehouseId,
    lowStock,
    search,
  } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const where: any = {
    product: { distributorId }
  };

  if (warehouseId) where.warehouseId = warehouseId;
  if (search) {
    where.product = {
      ...where.product,
      OR: [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ]
    };
  }

  let inventory = await prisma.inventory.findMany({
    where,
    skip,
    take,
    include: {
      product: {
        include: {
          images: { take: 1 },
          category: true,
        }
      },
      variant: true,
      warehouse: true,
    },
    orderBy: { lastUpdated: 'desc' }
  });

  // Filter low stock if requested
  if (lowStock === 'true') {
    inventory = inventory.filter(inv => 
      (inv.quantity - inv.reserved) <= inv.minThreshold
    );
  }

  // Calculate available stock
  const inventoryWithAvailable = inventory.map(inv => ({
    ...inv,
    available: inv.quantity - inv.reserved,
    isLowStock: (inv.quantity - inv.reserved) <= inv.minThreshold,
  }));

  const total = await prisma.inventory.count({ where });

  res.json({
    success: true,
    data: {
      inventory: inventoryWithAvailable,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    }
  });
});

// Get Low Stock Alerts
export const getLowStockAlerts = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const inventory = await prisma.inventory.findMany({
    where: {
      product: { distributorId }
    },
    include: {
      product: {
        include: {
          images: { take: 1 },
        }
      },
      variant: true,
      warehouse: true,
    }
  });

  // Filter low stock items
  const lowStock = inventory
    .filter(inv => (inv.quantity - inv.reserved) <= inv.minThreshold)
    .map(inv => ({
      ...inv,
      available: inv.quantity - inv.reserved,
      deficit: inv.minThreshold - (inv.quantity - inv.reserved),
    }))
    .sort((a, b) => a.available - b.available);

  res.json({
    success: true,
    data: {
      count: lowStock.length,
      items: lowStock
    }
  });
});

// Get Inventory by Product
export const getProductInventory = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const distributorId = req.user?.distributorId;

  const product = await prisma.product.findFirst({
    where: { id: productId, distributorId }
  });

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const inventory = await prisma.inventory.findMany({
    where: { productId },
    include: {
      variant: true,
      warehouse: true,
    }
  });

  const inventoryWithAvailable = inventory.map(inv => ({
    ...inv,
    available: inv.quantity - inv.reserved,
    isLowStock: (inv.quantity - inv.reserved) <= inv.minThreshold,
  }));

  res.json({
    success: true,
    data: inventoryWithAvailable
  });
});

// Manual Stock Adjustment (INV-03)
const adjustmentSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  warehouseId: z.string(),
  quantity: z.number().int(),
  reason: z.enum(['PURCHASE', 'RETURN', 'ADJUSTMENT', 'DAMAGE', 'SALE', 'TRANSFER']),
  note: z.string().optional(),
  document: z.string().optional(),
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const result = adjustmentSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const { productId, variantId, warehouseId, quantity, reason, note, document } = result.data;

  // Verify product belongs to distributor
  const product = await prisma.product.findFirst({
    where: { id: productId, distributorId }
  });

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Find or create inventory record
  let inventory = await prisma.inventory.findFirst({
    where: {
      productId,
      variantId: variantId || null,
      warehouseId,
    }
  });

  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: {
        productId,
        variantId,
        warehouseId,
        quantity: 0,
        reserved: 0,
        minThreshold: 5,
      }
    });
  }

  // Calculate new quantity
  const newQuantity = Math.max(0, inventory.quantity + quantity);

  // Update inventory
  const updated = await prisma.inventory.update({
    where: { id: inventory.id },
    data: { quantity: newQuantity },
    include: {
      product: true,
      variant: true,
      warehouse: true,
    }
  });

  // Create stock log
  await prisma.stockLog.create({
    data: {
      productId,
      variantId,
      distributorId,
      warehouseId,
      type: quantity > 0 ? 'IN' : 'OUT',
      reason,
      quantity: Math.abs(quantity),
      note,
      document,
    }
  });

  // Update product status based on stock
  const totalStock = await prisma.inventory.aggregate({
    where: { productId },
    _sum: { quantity: true }
  });

  if (totalStock._sum.quantity === 0) {
    await prisma.product.update({
      where: { id: productId },
      data: { status: 'OUT_OF_STOCK' }
    });
  } else if (product.status === 'OUT_OF_STOCK') {
    await prisma.product.update({
      where: { id: productId },
      data: { status: 'ACTIVE' }
    });
  }

  res.json({
    success: true,
    message: 'Stock adjusted successfully',
    data: {
      ...updated,
      available: updated.quantity - updated.reserved,
    }
  });
});

// Get Stock Adjustment History
export const getStockHistory = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const {
    page = '1',
    limit = '50',
    productId,
    warehouseId,
    reason,
    startDate,
    endDate,
  } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const where: any = { distributorId };

  if (productId) where.productId = productId;
  if (warehouseId) where.warehouseId = warehouseId;
  if (reason) where.reason = reason;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate as string);
    if (endDate) where.createdAt.lte = new Date(endDate as string);
  }

  const [logs, total] = await Promise.all([
    prisma.stockLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          include: {
            images: { take: 1 }
          }
        },
      }
    }),
    prisma.stockLog.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    }
  });
});

// Update Min Threshold
export const updateMinThreshold = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { minThreshold } = req.body;

  if (typeof minThreshold !== 'number' || minThreshold < 0) {
    res.status(400);
    throw new Error('Valid minThreshold required');
  }

  const inventory = await prisma.inventory.update({
    where: { id },
    data: { minThreshold },
    include: {
      product: true,
      warehouse: true,
    }
  });

  res.json({
    success: true,
    message: 'Min threshold updated successfully',
    data: inventory
  });
});
