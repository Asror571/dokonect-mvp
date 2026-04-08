import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// ============================================
// ZONE MANAGEMENT - DISTRIBUTOR (DRV-03)
// ============================================

const createZoneSchema = z.object({
  name: z.string().min(2, 'Zone name required'),
  region: z.string().min(2, 'Region required'),
});

// Create Zone
export const createZone = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const result = createZoneSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join(', '));
  }

  const { name, region } = result.data;

  const zone = await prisma.zone.create({
    data: {
      name,
      region
    }
  });

  res.status(201).json({
    success: true,
    message: 'Zone created successfully',
    data: zone
  });
});

// Get All Zones
export const getZones = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const { region } = req.query;

  const where: any = {};
  if (region) {
    where.region = region;
  }

  const zones = await prisma.zone.findMany({
    where,
    include: {
      drivers: {
        include: {
          driver: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true
                }
              }
            }
          }
        }
      },
      _count: {
        select: {
          drivers: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  res.json({
    success: true,
    data: zones
  });
});

// Get Zone by ID
export const getZone = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const { id } = req.params;

  const zone = await prisma.zone.findUnique({
    where: { id },
    include: {
      drivers: {
        include: {
          driver: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  avatar: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!zone) {
    res.status(404);
    throw new Error('Zone not found');
  }

  res.json({
    success: true,
    data: zone
  });
});

// Update Zone
export const updateZone = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const { id } = req.params;
  const { name, region } = req.body;

  const zone = await prisma.zone.findUnique({
    where: { id }
  });

  if (!zone) {
    res.status(404);
    throw new Error('Zone not found');
  }

  const updated = await prisma.zone.update({
    where: { id },
    data: {
      name,
      region
    }
  });

  res.json({
    success: true,
    message: 'Zone updated successfully',
    data: updated
  });
});

// Delete Zone
export const deleteZone = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const { id } = req.params;

  const zone = await prisma.zone.findUnique({
    where: { id },
    include: {
      _count: {
        select: { drivers: true }
      }
    }
  });

  if (!zone) {
    res.status(404);
    throw new Error('Zone not found');
  }

  if (zone._count.drivers > 0) {
    res.status(400);
    throw new Error('Cannot delete zone with assigned drivers');
  }

  await prisma.zone.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Zone deleted successfully'
  });
});

// Assign Drivers to Zone
export const assignDriversToZone = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const { id } = req.params;
  const { driverIds } = req.body;

  if (!Array.isArray(driverIds)) {
    res.status(400);
    throw new Error('driverIds must be an array');
  }

  const zone = await prisma.zone.findUnique({
    where: { id }
  });

  if (!zone) {
    res.status(404);
    throw new Error('Zone not found');
  }

  // Remove existing assignments
  await prisma.driverZone.deleteMany({
    where: { zoneId: id }
  });

  // Create new assignments
  if (driverIds.length > 0) {
    await prisma.driverZone.createMany({
      data: driverIds.map((driverId: string) => ({
        driverId,
        zoneId: id
      })),
      skipDuplicates: true
    });
  }

  const updated = await prisma.zone.findUnique({
    where: { id },
    include: {
      drivers: {
        include: {
          driver: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true
                }
              }
            }
          }
        }
      }
    }
  });

  res.json({
    success: true,
    message: 'Drivers assigned successfully',
    data: updated
  });
});

// Get Available Drivers for Zone
export const getAvailableDriversForZone = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const { id } = req.params;

  // Get all active drivers
  const allDrivers = await prisma.driver.findMany({
    where: {
      status: 'ACTIVE'
    },
    include: {
      user: {
        select: {
          name: true,
          phone: true
        }
      },
      zones: {
        where: {
          zoneId: id
        }
      }
    }
  });

  // Separate assigned and unassigned
  const assigned = allDrivers.filter(d => d.zones.length > 0);
  const available = allDrivers.filter(d => d.zones.length === 0);

  res.json({
    success: true,
    data: {
      assigned,
      available
    }
  });
});
