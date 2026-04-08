import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const prisma = new PrismaClient();

// ============================================
// DRIVER MANAGEMENT - DISTRIBUTOR (DRV-01)
// ============================================

const createDriverSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(9, 'Phone number required'),
  vehicleType: z.string().min(2, 'Vehicle type required'),
  vehicleNumber: z.string().min(2, 'Vehicle number required'),
  licenseNumber: z.string().min(2, 'License number required'),
  passportNumber: z.string().optional(),
  zones: z.array(z.string()).optional(), // Array of zone IDs
});

// Create Driver
export const createDriver = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const result = createDriverSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join(', '));
  }

  const { name, phone, vehicleType, vehicleNumber, licenseNumber, passportNumber, zones } = result.data;

  // Check if phone already exists
  const existingUser = await prisma.user.findUnique({
    where: { phone }
  });

  if (existingUser) {
    res.status(400);
    throw new Error('Phone number already registered');
  }

  // Generate random password
  const password = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user and driver in transaction
  const driver = await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        name,
        phone,
        password: hashedPassword,
        role: 'DRIVER',
        status: 'ACTIVE',
      }
    });

    // Create driver profile
    const driverProfile = await tx.driver.create({
      data: {
        userId: user.id,
        vehicleType,
        vehicleNumber,
        licenseNumber,
        passportNumber,
        status: 'ACTIVE',
      }
    });

    // Assign zones if provided
    if (zones && zones.length > 0) {
      await tx.driverZone.createMany({
        data: zones.map(zoneId => ({
          driverId: driverProfile.id,
          zoneId
        }))
      });
    }

    return driverProfile;
  });

  // TODO: Send SMS with login credentials
  console.log(`📱 SMS: Driver ${name} created. Phone: ${phone}, Password: ${password}`);

  res.status(201).json({
    success: true,
    message: 'Driver created successfully',
    data: {
      driver,
      credentials: {
        phone,
        password // In production, this should be sent via SMS only
      }
    }
  });
});

// Get All Drivers
export const getDrivers = asyncHandler(async (req: Request, res: Response) => {
  // Distributor can view all drivers in the system
  const {
    page = '1',
    limit = '20',
    status,
    search,
    zoneId
  } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.user = {
      OR: [
        { name: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } }
      ]
    };
  }

  // Remove zoneId filter for now - it's causing issues
  // if (zoneId) {
  //   where.zones = {
  //     some: {
  //       zoneId: zoneId as string
  //     }
  //   };
  // }

  const [drivers, total] = await Promise.all([
    prisma.driver.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatar: true,
            createdAt: true
          }
        }
      },
      orderBy: { user: { createdAt: 'desc' } }
    }),
    prisma.driver.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      drivers,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    }
  });
});

// Get Driver by ID
export const getDriver = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const driver = await prisma.driver.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          avatar: true,
          lastLogin: true
        }
      },
      zones: {
        include: {
          zone: true
        }
      },
      orders: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            include: {
              user: {
                select: { name: true, phone: true }
              }
            }
          }
        }
      },
      _count: {
        select: {
          orders: true,
          deliveries: true
        }
      }
    }
  });

  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }

  res.json({
    success: true,
    data: driver
  });
});

// Update Driver
export const updateDriver = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const { id } = req.params;
  const {
    name,
    vehicleType,
    vehicleNumber,
    licenseNumber,
    passportNumber,
    status,
    zones
  } = req.body;

  const driver = await prisma.driver.findUnique({
    where: { id },
    include: { user: true }
  });

  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }

  // Update in transaction
  const updated = await prisma.$transaction(async (tx) => {
    // Update user if name changed
    if (name) {
      await tx.user.update({
        where: { id: driver.userId },
        data: { name }
      });
    }

    // Update driver
    const updatedDriver = await tx.driver.update({
      where: { id },
      data: {
        vehicleType,
        vehicleNumber,
        licenseNumber,
        passportNumber,
        status
      }
    });

    // Update zones if provided
    if (zones) {
      // Delete existing zones
      await tx.driverZone.deleteMany({
        where: { driverId: id }
      });

      // Create new zones
      if (zones.length > 0) {
        await tx.driverZone.createMany({
          data: zones.map((zoneId: string) => ({
            driverId: id,
            zoneId
          }))
        });
      }
    }

    return updatedDriver;
  });

  res.json({
    success: true,
    message: 'Driver updated successfully',
    data: updated
  });
});

// Delete Driver (soft delete - set to INACTIVE)
export const deleteDriver = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const { id } = req.params;

  const driver = await prisma.driver.findUnique({
    where: { id }
  });

  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }

  // Check if driver has active orders
  const activeOrders = await prisma.order.count({
    where: {
      driverId: id,
      status: { in: ['ASSIGNED', 'IN_TRANSIT'] }
    }
  });

  if (activeOrders > 0) {
    res.status(400);
    throw new Error(`Cannot delete driver with ${activeOrders} active orders`);
  }

  // Set to inactive
  await prisma.driver.update({
    where: { id },
    data: { status: 'INACTIVE' }
  });

  res.json({
    success: true,
    message: 'Driver deactivated successfully'
  });
});

// Get Driver Orders
export const getDriverOrders = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const { id } = req.params;
  const {
    page = '1',
    limit = '20',
    status
  } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const where: any = {
    driverId: id,
    distributorId
  };

  if (status) {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      include: {
        client: {
          include: {
            user: {
              select: { name: true, phone: true }
            }
          }
        },
        items: {
          include: {
            product: {
              include: {
                images: { take: 1 }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.order.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    }
  });
});

// Get Driver Statistics (DRV-04)
export const getDriverStats = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const { id } = req.params;
  const { period = 'month' } = req.query; // day, week, month

  const driver = await prisma.driver.findUnique({
    where: { id }
  });

  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }

  // Calculate date range
  const now = new Date();
  let startDate = new Date();
  
  if (period === 'day') {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    startDate.setDate(now.getDate() - 7);
  } else {
    startDate.setMonth(now.getMonth() - 1);
  }

  // Get orders in period
  const orders = await prisma.order.findMany({
    where: {
      driverId: id,
      distributorId,
      createdAt: { gte: startDate }
    }
  });

  const totalOrders = orders.length;
  const delivered = orders.filter(o => o.status === 'DELIVERED').length;
  const cancelled = orders.filter(o => o.status === 'CANCELLED').length;
  const returned = orders.filter(o => o.status === 'RETURNED').length;

  // Calculate average delivery time
  const deliveredOrders = await prisma.order.findMany({
    where: {
      driverId: id,
      status: 'DELIVERED',
      createdAt: { gte: startDate }
    },
    include: {
      statusHistory: true
    }
  });

  let totalDeliveryTime = 0;
  let deliveryCount = 0;

  deliveredOrders.forEach(order => {
    const assigned = order.statusHistory.find(h => h.status === 'ASSIGNED');
    const deliveredStatus = order.statusHistory.find(h => h.status === 'DELIVERED');
    
    if (assigned && deliveredStatus) {
      const time = deliveredStatus.timestamp.getTime() - assigned.timestamp.getTime();
      totalDeliveryTime += time;
      deliveryCount++;
    }
  });

  const avgDeliveryTime = deliveryCount > 0 
    ? Math.round(totalDeliveryTime / deliveryCount / 1000 / 60) // minutes
    : 0;

  res.json({
    success: true,
    data: {
      period,
      totalOrders,
      delivered,
      cancelled,
      returned,
      successRate: totalOrders > 0 ? (delivered / totalOrders) * 100 : 0,
      avgDeliveryTime, // in minutes
      rating: driver.rating,
      totalDeliveries: driver.totalDeliveries
    }
  });
});
