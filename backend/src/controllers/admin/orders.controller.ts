import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../prisma/client';
import { sendSuccess } from '../../utils/response';

// GET /api/admin/orders - Get all orders (global view)
export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status, distributorId, region, search, page = '1', limit = '50' } = req.query;

  const where: any = {};
  
  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (distributorId) {
    where.distributorId = distributorId;
  }

  if (region) {
    where.client = { region };
  }

  if (search) {
    where.OR = [
      { id: { contains: search as string } },
      { client: { storeName: { contains: search as string, mode: 'insensitive' } } },
      { client: { user: { phone: { contains: search as string } } } }
    ];
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          include: {
            user: { select: { name: true, phone: true } }
          }
        },
        distributor: {
          include: {
            user: { select: { name: true } }
          }
        },
        driver: {
          include: {
            user: { select: { name: true, phone: true } }
          }
        },
        items: {
          include: {
            product: { select: { name: true, sku: true } }
          }
        }
      }
    }),
    prisma.order.count({ where })
  ]);

  sendSuccess(res, {
    orders,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string))
    }
  }, 'Orders retrieved', 200);
});

// GET /api/admin/orders/:id - Get order details
export const getOrderDetails = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      client: {
        include: {
          user: true
        }
      },
      distributor: {
        include: {
          user: true
        }
      },
      driver: {
        include: {
          user: true
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
      },
      statusHistory: {
        orderBy: { timestamp: 'desc' }
      },
      delivery: true,
      debt: true
    }
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  sendSuccess(res, order, 'Order details', 200);
});

// PATCH /api/admin/orders/:id/cancel - Cancel order (admin override)
export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await prisma.order.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      rejectionReason: reason
    },
    include: {
      client: { include: { user: true } },
      distributor: { include: { user: true } }
    }
  });

  // Add to status history
  await prisma.orderStatusHistory.create({
    data: {
      orderId: id,
      status: 'CANCELLED',
      note: `Admin cancelled: ${reason}`
    }
  });

  // Notify client and distributor
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: order.client.userId,
        type: 'ORDER_CANCELLED',
        title: 'Buyurtma bekor qilindi',
        body: `Buyurtma admin tomonidan bekor qilindi: ${reason}`
      }
    }),
    prisma.notification.create({
      data: {
        userId: order.distributor.userId,
        type: 'ORDER_CANCELLED',
        title: 'Buyurtma bekor qilindi',
        body: `Buyurtma admin tomonidan bekor qilindi: ${reason}`
      }
    })
  ]);

  sendSuccess(res, order, 'Order cancelled', 200);
});

// GET /api/admin/orders/suspicious - Get suspicious orders
export const getSuspiciousOrders = asyncHandler(async (req: Request, res: Response) => {
  // Find orders with unusual patterns
  const suspiciousOrders = await prisma.order.findMany({
    where: {
      OR: [
        // Very high amount
        { totalAmount: { gte: 10000000 } },
        // Multiple orders from same client in short time
        // This would need more complex logic
      ]
    },
    include: {
      client: {
        include: {
          user: { select: { name: true, phone: true } }
        }
      },
      distributor: {
        include: {
          user: { select: { name: true } }
        }
      },
      items: true
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  sendSuccess(res, suspiciousOrders, 'Suspicious orders', 200);
});

// GET /api/admin/orders/stats - Get order statistics
export const getOrderStats = asyncHandler(async (req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalOrders,
    todayOrders,
    statusBreakdown,
    regionBreakdown
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { id: true }
    }),
    prisma.order.findMany({
      include: {
        client: { select: { region: true } }
      }
    })
  ]);

  // Group by region
  const regionStats: any = {};
  regionBreakdown.forEach(order => {
    const region = order.client.region || 'Unknown';
    if (!regionStats[region]) {
      regionStats[region] = { count: 0, revenue: 0 };
    }
    regionStats[region].count += 1;
    regionStats[region].revenue += order.totalAmount;
  });

  sendSuccess(res, {
    total: totalOrders,
    today: todayOrders,
    byStatus: statusBreakdown,
    byRegion: Object.entries(regionStats).map(([region, stats]) => ({
      region,
      ...stats
    }))
  }, 'Order stats', 200);
});
