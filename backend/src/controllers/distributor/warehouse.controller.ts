import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// WAREHOUSE MANAGEMENT - DISTRIBUTOR
// ============================================

const warehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name required'),
  address: z.string().min(1, 'Address required'),
  region: z.string().min(1, 'Region required'),
  managerId: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Create Warehouse
export const createWarehouse = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const result = warehouseSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const warehouse = await prisma.warehouse.create({
    data: {
      ...result.data,
      distributorId,
    }
  });

  res.status(201).json({
    success: true,
    message: 'Warehouse created successfully',
    data: warehouse
  });
});

// Get Warehouses
export const getWarehouses = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const { isActive } = req.query;

  const where: any = { distributorId };
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  const warehouses = await prisma.warehouse.findMany({
    where,
    include: {
      _count: {
        select: { inventory: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: warehouses
  });
});

// Get Single Warehouse
export const getWarehouse = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const warehouse = await prisma.warehouse.findFirst({
    where: { id, distributorId },
    include: {
      inventory: {
        include: {
          product: {
            include: {
              images: { take: 1 }
            }
          },
          variant: true,
        },
        take: 20,
      },
      _count: {
        select: { inventory: true }
      }
    }
  });

  if (!warehouse) {
    res.status(404);
    throw new Error('Warehouse not found');
  }

  res.json({
    success: true,
    data: warehouse
  });
});

// Update Warehouse
export const updateWarehouse = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const warehouse = await prisma.warehouse.findFirst({
    where: { id, distributorId }
  });

  if (!warehouse) {
    res.status(404);
    throw new Error('Warehouse not found');
  }

  const result = warehouseSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const updated = await prisma.warehouse.update({
    where: { id },
    data: result.data
  });

  res.json({
    success: true,
    message: 'Warehouse updated successfully',
    data: updated
  });
});

// Delete Warehouse
export const deleteWarehouse = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const warehouse = await prisma.warehouse.findFirst({
    where: { id, distributorId },
    include: {
      _count: {
        select: { inventory: true }
      }
    }
  });

  if (!warehouse) {
    res.status(404);
    throw new Error('Warehouse not found');
  }

  if (warehouse._count.inventory > 0) {
    res.status(400);
    throw new Error('Cannot delete warehouse with inventory. Transfer items first.');
  }

  await prisma.warehouse.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Warehouse deleted successfully'
  });
});

// Transfer Stock Between Warehouses
const transferSchema = z.object({
  sourceWarehouseId: z.string(),
  destWarehouseId: z.string(),
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1),
  note: z.string().optional(),
});

export const transferStock = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const result = transferSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const { sourceWarehouseId, destWarehouseId, productId, variantId, quantity, note } = result.data;

  if (sourceWarehouseId === destWarehouseId) {
    res.status(400);
    throw new Error('Source and destination warehouses must be different');
  }

  // Verify warehouses belong to distributor
  const [sourceWarehouse, destWarehouse] = await Promise.all([
    prisma.warehouse.findFirst({ where: { id: sourceWarehouseId, distributorId } }),
    prisma.warehouse.findFirst({ where: { id: destWarehouseId, distributorId } })
  ]);

  if (!sourceWarehouse || !destWarehouse) {
    res.status(404);
    throw new Error('Warehouse not found');
  }

  // Check source inventory
  const sourceInventory = await prisma.inventory.findFirst({
    where: {
      productId,
      variantId: variantId || null,
      warehouseId: sourceWarehouseId,
    }
  });

  if (!sourceInventory || (sourceInventory.quantity - sourceInventory.reserved) < quantity) {
    res.status(400);
    throw new Error('Insufficient stock in source warehouse');
  }

  // Create transfer record
  const transfer = await prisma.warehouseTransfer.create({
    data: {
      sourceWarehouseId,
      destWarehouseId,
      productId,
      variantId,
      quantity,
      note,
      status: 'COMPLETED',
      completedAt: new Date(),
    }
  });

  // Update source inventory
  await prisma.inventory.update({
    where: { id: sourceInventory.id },
    data: {
      quantity: sourceInventory.quantity - quantity
    }
  });

  // Update or create destination inventory
  const destInventory = await prisma.inventory.findFirst({
    where: {
      productId,
      variantId: variantId || null,
      warehouseId: destWarehouseId,
    }
  });

  if (destInventory) {
    await prisma.inventory.update({
      where: { id: destInventory.id },
      data: {
        quantity: destInventory.quantity + quantity
      }
    });
  } else {
    await prisma.inventory.create({
      data: {
        productId,
        variantId,
        warehouseId: destWarehouseId,
        quantity,
        reserved: 0,
        minThreshold: 5,
      }
    });
  }

  // Create stock logs
  await Promise.all([
    prisma.stockLog.create({
      data: {
        productId,
        variantId,
        distributorId,
        warehouseId: sourceWarehouseId,
        type: 'OUT',
        reason: 'TRANSFER',
        quantity,
        note: `Transfer to ${destWarehouse.name}`,
      }
    }),
    prisma.stockLog.create({
      data: {
        productId,
        variantId,
        distributorId,
        warehouseId: destWarehouseId,
        type: 'IN',
        reason: 'TRANSFER',
        quantity,
        note: `Transfer from ${sourceWarehouse.name}`,
      }
    })
  ]);

  res.json({
    success: true,
    message: 'Stock transferred successfully',
    data: transfer
  });
});

// Get Transfer History
export const getTransferHistory = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const {
    page = '1',
    limit = '50',
    warehouseId,
    status,
  } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const where: any = {
    OR: [
      { sourceWarehouse: { distributorId } },
      { destWarehouse: { distributorId } }
    ]
  };

  if (warehouseId) {
    where.OR = [
      { sourceWarehouseId: warehouseId },
      { destWarehouseId: warehouseId }
    ];
  }

  if (status) where.status = status;

  const [transfers, total] = await Promise.all([
    prisma.warehouseTransfer.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        sourceWarehouse: true,
        destWarehouse: true,
      }
    }),
    prisma.warehouseTransfer.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      transfers,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    }
  });
});
