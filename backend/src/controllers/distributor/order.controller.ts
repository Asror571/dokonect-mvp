import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// ORDER MANAGEMENT - DISTRIBUTOR
// ============================================

// Get Orders List with Filters
export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const {
    page = '1',
    limit = '20',
    status,
    clientId,
    driverId,
    paymentStatus,
    startDate,
    endDate,
    search,
  } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const where: any = { distributorId };

  if (status) {
    if (Array.isArray(status)) {
      where.status = { in: status };
    } else {
      where.status = status;
    }
  }

  if (clientId) where.clientId = clientId as string;
  if (driverId) where.driverId = driverId as string;
  if (paymentStatus) where.paymentStatus = paymentStatus;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate as string);
    if (endDate) where.createdAt.lte = new Date(endDate as string);
  }

  if (search) {
    where.OR = [
      { id: { contains: search as string, mode: 'insensitive' } },
      { client: { storeName: { contains: search as string, mode: 'insensitive' } } },
      { client: { user: { phone: { contains: search as string } } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          include: {
            user: {
              select: { id: true, name: true, phone: true, email: true }
            }
          }
        },
        driver: {
          include: {
            user: {
              select: { id: true, name: true, phone: true }
            }
          }
        },
        items: {
          include: {
            product: {
              include: {
                images: { take: 1 }
              }
            },
            variant: true,
          }
        },
        delivery: true,
      }
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

// Get Order Statistics
export const getOrderStats = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const stats = await prisma.order.groupBy({
    by: ['status'],
    where: { distributorId },
    _count: { id: true },
    _sum: { totalAmount: true }
  });

  const formatted = stats.reduce((acc: any, stat) => {
    acc[stat.status] = {
      count: stat._count.id,
      total: stat._sum.totalAmount || 0
    };
    return acc;
  }, {});

  // Today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStats = await prisma.order.aggregate({
    where: {
      distributorId,
      createdAt: { gte: today }
    },
    _count: { id: true },
    _sum: { totalAmount: true }
  });

  res.json({
    success: true,
    data: {
      byStatus: formatted,
      today: {
        count: todayStats._count.id,
        total: todayStats._sum.totalAmount || 0
      }
    }
  });
});

// Get Single Order
export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const order = await prisma.order.findFirst({
    where: { id: id as string, distributorId },
    include: {
      client: {
        include: {
          user: {
            select: { id: true, name: true, phone: true, email: true, avatar: true }
          }
        }
      },
      driver: {
        include: {
          user: {
            select: { id: true, name: true, phone: true, avatar: true }
          }
        }
      },
      items: {
        include: {
          product: {
            include: {
              images: { take: 1 }
            }
          },
          variant: true,
        }
      },
      delivery: true,
      statusHistory: {
        orderBy: { timestamp: 'desc' }
      }
    }
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  res.json({
    success: true,
    data: order
  });
});

// Accept Order
export const acceptOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const order = await prisma.order.findFirst({
    where: { id: id as string, distributorId },
    include: {
      items: { include: { product: true } },
      client: {
        include: { user: true }
      }
    }
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.status !== 'NEW') {
    res.status(400);
    throw new Error('Only NEW orders can be accepted');
  }

  // Check stock availability
  for (const item of order.items) {
    const inventory = await prisma.inventory.aggregate({
      where: {
        productId: item.productId,
        variantId: item.variantId,
      },
      _sum: {
        quantity: true,
        reserved: true,
      }
    });

    const available = (inventory._sum.quantity || 0) - (inventory._sum.reserved || 0);
    if (available < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${item.product?.name || 'product'}`);
    }
  }

  // Reserve stock
  for (const item of order.items) {
    const inventories = await prisma.inventory.findMany({
      where: {
        productId: item.productId,
        variantId: item.variantId,
      },
      orderBy: { quantity: 'desc' }
    });

    let remaining = item.quantity;
    for (const inv of inventories) {
      if (remaining <= 0) break;
      const available = inv.quantity - inv.reserved;
      const toReserve = Math.min(available, remaining);
      
      if (toReserve > 0) {
        await prisma.inventory.update({
          where: { id: inv.id },
          data: { reserved: inv.reserved + toReserve }
        });
        remaining -= toReserve;
      }
    }
  }

  // Update order status
  const updated = await prisma.order.update({
    where: { id: id as string },
    data: { status: 'ACCEPTED' },
    include: {
      client: { include: { user: true } },
      items: { include: { product: true } }
    }
  });

  // Create status history
  await prisma.orderStatusHistory.create({
    data: {
      orderId: id as string,
      status: 'ACCEPTED',
      note: 'Order accepted by distributor'
    }
  });

  // Send notification to client
  await prisma.notification.create({
    data: {
      userId: order.client.userId,
      type: 'ORDER_ACCEPTED',
      title: 'Order Accepted',
      body: `Your order #${order.id.slice(0, 8)} has been accepted`,
      metadata: { orderId: order.id }
    }
  });

  res.json({
    success: true,
    message: 'Order accepted successfully',
    data: updated
  });
});

// Reject Order
const rejectSchema = z.object({
  reason: z.string().min(1, 'Rejection reason required'),
});

export const rejectOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const result = rejectSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const { reason } = result.data;

  const order = await prisma.order.findFirst({
    where: { id: id as string, distributorId },
    include: {
      client: { include: { user: true } }
    }
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!['NEW', 'ACCEPTED'].includes(order.status)) {
    res.status(400);
    throw new Error('Cannot reject order in current status');
  }

  // Release reserved stock if accepted
  if (order.status === 'ACCEPTED') {
    const items = await prisma.orderItem.findMany({
      where: { orderId: id as string }
    });

    for (const item of items) {
      const inventories = await prisma.inventory.findMany({
        where: {
          productId: item.productId,
          variantId: item.variantId,
          reserved: { gt: 0 }
        }
      });

      let remaining = item.quantity;
      for (const inv of inventories) {
        if (remaining <= 0) break;
        const toRelease = Math.min(inv.reserved, remaining);
        
        await prisma.inventory.update({
          where: { id: inv.id },
          data: { reserved: inv.reserved - toRelease }
        });
        remaining -= toRelease;
      }
    }
  }

  // Update order
  const updated = await prisma.order.update({
    where: { id: id as string },
    data: {
      status: 'REJECTED',
      rejectionReason: reason
    }
  });

  // Create status history
  await prisma.orderStatusHistory.create({
    data: {
      orderId: id as string,
      status: 'REJECTED',
      note: reason
    }
  });

  // Send notification
  await prisma.notification.create({
    data: {
      userId: order.client.userId,
      type: 'ORDER_REJECTED',
      title: 'Order Rejected',
      body: `Your order #${order.id.slice(0, 8)} was rejected: ${reason}`,
      metadata: { orderId: order.id, reason }
    }
  });

  res.json({
    success: true,
    message: 'Order rejected',
    data: updated
  });
});

// Assign Driver
const assignSchema = z.object({
  driverId: z.string(),
});

export const assignDriver = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const result = assignSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const { driverId } = result.data;

  const order = await prisma.order.findFirst({
    where: { id: id as string, distributorId }
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.status !== 'ACCEPTED') {
    res.status(400);
    throw new Error('Only ACCEPTED orders can be assigned');
  }

  // Verify driver exists and is active
  const driver = await prisma.driver.findFirst({
    where: { id: driverId as string, status: 'ACTIVE' },
    include: { user: true }
  });

  if (!driver) {
    res.status(404);
    throw new Error('Driver not found or inactive');
  }

  // Update order
  const updated = await prisma.order.update({
    where: { id: id as string },
    data: {
      driverId: driverId as string,
      status: 'ASSIGNED'
    },
    include: {
      driver: { include: { user: true } },
      client: { include: { user: true } }
    }
  });

  // Create status history
  await prisma.orderStatusHistory.create({
    data: {
      orderId: id as string,
      status: 'ASSIGNED',
      note: `Assigned to driver ${driver.user.name}`
    }
  });

  // Send notification to driver
  await prisma.notification.create({
    data: {
      userId: driver.userId,
      type: 'DRIVER_ASSIGNED',
      title: 'New Delivery',
      body: `You have been assigned order #${order.id.slice(0, 8)}`,
      metadata: { orderId: order.id }
    }
  });

  res.json({
    success: true,
    message: 'Driver assigned successfully',
    data: updated
  });
});

// Update Order Status
const statusSchema = z.object({
  status: z.enum(['NEW', 'ACCEPTED', 'REJECTED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'CANCELLED', 'PAID']),
  note: z.string().optional(),
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const result = statusSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const { status, note } = result.data;

  const order = await prisma.order.findFirst({
    where: { id: id as string, distributorId },
    include: {
      items: { include: { product: true } },
      client: { include: { user: true } }
    }
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Handle DELIVERED status - deduct from inventory
  if (status === 'DELIVERED' && order.status !== 'DELIVERED') {
    for (const item of order.items) {
      const inventories = await prisma.inventory.findMany({
        where: {
          productId: item.productId,
          variantId: item.variantId,
        },
        orderBy: { quantity: 'desc' }
      });

      let remaining = item.quantity;
      for (const inv of inventories) {
        if (remaining <= 0) break;
        
        const toDeduct = Math.min(inv.quantity, remaining);
        const reservedDeduct = Math.min(inv.reserved, toDeduct);
        
        await prisma.inventory.update({
          where: { id: inv.id },
          data: {
            quantity: inv.quantity - toDeduct,
            reserved: inv.reserved - reservedDeduct
          }
        });
        
        remaining -= toDeduct;
      }
    }
  }

  // Update order
  const updated = await prisma.order.update({
    where: { id: id as string },
    data: { status },
    include: {
      client: { include: { user: true } },
      driver: { include: { user: true } },
      items: { include: { product: true } }
    }
  });

  // Create status history
  await prisma.orderStatusHistory.create({
    data: {
      orderId: id as string,
      status,
      note
    }
  });

  // Send notification
  await prisma.notification.create({
    data: {
      userId: order.client.userId,
      type: 'ORDER_STATUS_UPDATE',
      title: 'Order Status Updated',
      body: `Your order #${order.id.slice(0, 8)} is now ${status}`,
      metadata: { orderId: order.id, status }
    }
  });

  res.json({
    success: true,
    message: 'Order status updated',
    data: updated
  });
});

// Add Internal Note
export const addInternalNote = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { note } = req.body;
  const distributorId = req.user?.distributorId;

  if (!note) {
    res.status(400);
    throw new Error('Note required');
  }

  const order = await prisma.order.findFirst({
    where: { id: id as string, distributorId }
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const updated = await prisma.order.update({
    where: { id: id as string },
    data: { internalNote: note }
  });

  res.json({
    success: true,
    message: 'Note added successfully',
    data: updated
  });
});

// Create Order (Distributor Side) - ORD-05
const createOrderSchema = z.object({
  clientId: z.string().min(1, 'Client ID required'),
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
  })).min(1, 'At least one item required'),
  deliveryAddress: z.object({
    address: z.string(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
  deliveryTimeSlot: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'CREDIT', 'BANK_TRANSFER']).optional(),
  promoCode: z.string().optional(),
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const result = createOrderSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const { clientId, items, deliveryAddress, deliveryTimeSlot, notes, paymentMethod, promoCode } = result.data;

  // Verify client belongs to this distributor
  const client = await prisma.client.findFirst({
    where: { id: clientId },
    include: { user: true }
  });

  if (!client) {
    res.status(404);
    throw new Error('Client not found');
  }

  // Check if client is linked to this distributor
  const link = await prisma.storeDistributorLink.findFirst({
    where: {
      storeOwnerId: clientId,
      distributorId,
      status: 'APPROVED'
    }
  });

  // Calculate order totals
  let subtotal = 0;
  const orderItems: any[] = [];

  for (const item of items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, distributorId }
    });

    if (!product) {
      res.status(404);
      throw new Error(`Product ${item.productId} not found`);
    }

    // Check stock availability
    const inventory = await prisma.inventory.findFirst({
      where: {
        productId: item.productId,
        variantId: item.variantId || null,
      }
    });

    if (!inventory || (inventory.quantity - inventory.reserved) < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for product ${product.name}`);
    }

    // Get price (apply price rules if any)
    let unitPrice = product.wholesalePrice;

    // Check for client-specific price rules
    const priceRule = await prisma.priceRule.findFirst({
      where: {
        productId: item.productId,
        variantId: item.variantId || null,
        clientId,
        OR: [
          { validFrom: null },
          { validFrom: { lte: new Date() } }
        ],
        OR: [
          { validTo: null },
          { validTo: { gte: new Date() } }
        ]
      }
    });

    if (priceRule) {
      unitPrice = priceRule.price;
    }

    // Check for variant price override
    if (item.variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId }
      });
      if (variant?.priceOverride) {
        unitPrice = variant.priceOverride;
      }
    }

    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;

    orderItems.push({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice,
      total: itemTotal,
    });
  }

  // Apply bulk discounts
  let totalDiscount = 0;
  for (const item of items) {
    const bulkRules = await prisma.bulkRule.findMany({
      where: { productId: item.productId },
      orderBy: { minQuantity: 'asc' }
    });

    for (const rule of bulkRules) {
      if (item.quantity >= rule.minQuantity && (!rule.maxQuantity || item.quantity <= rule.maxQuantity)) {
        const itemData = orderItems.find(oi => oi.productId === item.productId && oi.variantId === item.variantId);
        if (itemData) {
          if (rule.discountType === 'PERCENT') {
            totalDiscount += (itemData.total * rule.discountValue) / 100;
          } else {
            totalDiscount += rule.discountValue * item.quantity;
          }
        }
        break;
      }
    }
  }

  // Apply promo code
  let promoDiscount = 0;
  if (promoCode) {
    const promo = await prisma.promoCode.findFirst({
      where: {
        code: promoCode,
        distributorId,
        validFrom: { lte: new Date() },
        validTo: { gte: new Date() }
      }
    });

    if (promo) {
      const usageCount = await prisma.promoUsage.count({
        where: { promoCodeId: promo.id }
      });

      if (!promo.maxUses || usageCount < promo.maxUses) {
        if (promo.discountType === 'PERCENT') {
          promoDiscount = (subtotal * promo.discountValue) / 100;
        } else {
          promoDiscount = promo.discountValue;
        }
      }
    }
  }

  const totalAmount = subtotal - totalDiscount - promoDiscount;
  const deliveryFee = 0; // Can be calculated based on zone

  // Create order with transaction
  const order = await prisma.$transaction(async (tx) => {
    // Create order
    const newOrder = await tx.order.create({
      data: {
        clientId,
        distributorId,
        status: 'ACCEPTED', // Auto-accept since distributor created it
        totalAmount,
        subtotal,
        discount: totalDiscount + promoDiscount,
        deliveryFee,
        deliveryAddress,
        deliveryTimeSlot,
        notes,
        paymentMethod: paymentMethod || 'CASH',
        paymentStatus: 'UNPAID',
      }
    });

    // Create order items
    await tx.orderItem.createMany({
      data: orderItems.map(item => ({
        orderId: newOrder.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: 0,
        total: item.total,
      }))
    });

    // Reserve inventory
    for (const item of items) {
      const inventories = await tx.inventory.findMany({
        where: {
          productId: item.productId,
          variantId: item.variantId || null,
        },
        orderBy: { quantity: 'desc' }
      });

      let remaining = item.quantity;
      for (const inv of inventories) {
        if (remaining <= 0) break;
        const available = inv.quantity - inv.reserved;
        const toReserve = Math.min(available, remaining);

        if (toReserve > 0) {
          await tx.inventory.update({
            where: { id: inv.id },
            data: { reserved: inv.reserved + toReserve }
          });
          remaining -= toReserve;
        }
      }
    }

    // Create status history
    await tx.orderStatusHistory.create({
      data: {
        orderId: newOrder.id,
        status: 'NEW',
        note: 'Order created by distributor'
      }
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: newOrder.id,
        status: 'ACCEPTED',
        note: 'Order auto-accepted'
      }
    });

    // Apply promo usage if applicable
    if (promoCode && promoDiscount > 0) {
      const promo = await tx.promoCode.findFirst({
        where: { code: promoCode, distributorId }
      });
      if (promo) {
        await tx.promoUsage.create({
          data: {
            promoCodeId: promo.id,
            clientId,
            orderId: newOrder.id,
          }
        });
      }
    }

    return newOrder;
  });

  // Send notification to client
  await prisma.notification.create({
    data: {
      userId: client.userId,
      type: 'ORDER_ACCEPTED',
      title: 'New Order Created',
      body: `A new order #${order.id.slice(0, 8)} has been created for you`,
      metadata: { orderId: order.id }
    }
  });

  // Return full order details
  const fullOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      client: {
        include: {
          user: { select: { id: true, name: true, phone: true, email: true } }
        }
      },
      items: {
        include: {
          product: { include: { images: { take: 1 } } },
          variant: true
        }
      },
      statusHistory: { orderBy: { timestamp: 'desc' } }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: fullOrder
  });
});
