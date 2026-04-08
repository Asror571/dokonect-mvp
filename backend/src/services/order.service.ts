import { PrismaClient, OrderStatus } from '@prisma/client';
import { OrderStats } from '../types/distributor.types';

const prisma = new PrismaClient();

export class OrderService {
  // ORD-02: List orders with filters
  async listOrders(distributorId: string, filters: any) {
    const {
      page = 1,
      limit = 20,
      status,
      clientId,
      driverId,
      warehouseId,
      paymentStatus,
      startDate,
      endDate,
      search
    } = filters;

    const where: any = { distributorId };

    if (status) {
      if (Array.isArray(status)) {
        where.status = { in: status };
      } else {
        where.status = status;
      }
    }

    if (clientId) where.clientId = clientId;
    if (driverId) where.driverId = driverId;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { client: { storeName: { contains: search, mode: 'insensitive' } } },
        { client: { user: { phone: { contains: search } } } }
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          client: {
            include: { user: { select: { name: true, phone: true } } }
          },
          driver: {
            include: { user: { select: { name: true, phone: true } } }
          },
          items: {
            include: {
              product: {
                include: { images: { where: { isCover: true } } }
              },
              variant: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // ORD-03: Get order details
  async getOrderById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            user: { select: { name: true, phone: true, email: true } },
            orders: {
              where: { status: OrderStatus.DELIVERED },
              select: { id: true, createdAt: true, totalAmount: true }
            }
          }
        },
        driver: {
          include: { user: { select: { name: true, phone: true } } }
        },
        items: {
          include: {
            product: {
              include: { images: { where: { isCover: true } } }
            },
            variant: true
          }
        },
        statusHistory: {
          orderBy: { timestamp: 'desc' }
        },
        delivery: true
      }
    });
  }

  // ORD-04: Accept order
  async acceptOrder(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) throw new Error('Buyurtma topilmadi');
    if (order.status !== OrderStatus.NEW) {
      throw new Error('Faqat yangi buyurtmalarni qabul qilish mumkin');
    }

    // Reserve inventory
    for (const item of order.items) {
      const inventory = await prisma.inventory.findFirst({
        where: {
          productId: item.productId,
          variantId: item.variantId
        }
      });

      if (inventory) {
        await prisma.inventory.update({
          where: { id: inventory.id },
          data: { reserved: inventory.reserved + item.quantity }
        });
      }
    }

    // Update order status
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.ACCEPTED }
    });

    // Log status change
    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: OrderStatus.ACCEPTED,
        note: 'Buyurtma qabul qilindi'
      }
    });

    // Send notification to client
    await prisma.notification.create({
      data: {
        userId: order.client.userId,
        type: 'ORDER_ACCEPTED',
        title: 'Buyurtma qabul qilindi',
        body: `Buyurtma #${orderId.slice(0, 8)} qabul qilindi`,
        metadata: { orderId }
      }
    });

    return updated;
  }

  // ORD-04: Reject order
  async rejectOrder(orderId: string, reason: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) throw new Error('Buyurtma topilmadi');

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.REJECTED,
        rejectionReason: reason
      }
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: OrderStatus.REJECTED,
        note: reason
      }
    });

    // Send notification
    await prisma.notification.create({
      data: {
        userId: order.clientId,
        type: 'ORDER_REJECTED',
        title: 'Buyurtma rad etildi',
        body: `Buyurtma #${orderId.slice(0, 8)} rad etildi: ${reason}`,
        metadata: { orderId, reason }
      }
    });

    return updated;
  }

  // ORD-04: Assign driver
  async assignDriver(orderId: string, driverId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) throw new Error('Buyurtma topilmadi');

    // Check driver availability
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        orders: {
          where: {
            status: { in: [OrderStatus.ASSIGNED, OrderStatus.IN_TRANSIT] }
          }
        }
      }
    });

    if (!driver) throw new Error('Haydovchi topilmadi');
    if (driver.status !== 'ACTIVE') throw new Error('Haydovchi faol emas');
    if (driver.orders.length >= 10) throw new Error('Haydovchi band');

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        driverId,
        status: OrderStatus.ASSIGNED
      }
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: OrderStatus.ASSIGNED,
        note: `Haydovchiga tayinlandi: ${driver.user.name}`
      }
    });

    // Send notification to driver
    await prisma.notification.create({
      data: {
        userId: driver.userId,
        type: 'DRIVER_ASSIGNED',
        title: 'Yangi buyurtma',
        body: `Sizga yangi buyurtma tayinlandi #${orderId.slice(0, 8)}`,
        metadata: { orderId }
      }
    });

    return updated;
  }

  // ORD-04: Update order status
  async updateOrderStatus(orderId: string, status: OrderStatus, note?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) throw new Error('Buyurtma topilmadi');

    // If delivered, update inventory
    if (status === OrderStatus.DELIVERED) {
      for (const item of order.items) {
        const inventory = await prisma.inventory.findFirst({
          where: {
            productId: item.productId,
            variantId: item.variantId
          }
        });

        if (inventory) {
          await prisma.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: inventory.quantity - item.quantity,
              reserved: inventory.reserved - item.quantity
            }
          });
        }
      }
    }

    // If cancelled, release reserved inventory
    if (status === OrderStatus.CANCELLED) {
      for (const item of order.items) {
        const inventory = await prisma.inventory.findFirst({
          where: {
            productId: item.productId,
            variantId: item.variantId
          }
        });

        if (inventory) {
          await prisma.inventory.update({
            where: { id: inventory.id },
            data: { reserved: inventory.reserved - item.quantity }
          });
        }
      }
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });

    await prisma.orderStatusHistory.create({
      data: { orderId, status, note }
    });

    return updated;
  }

  // ORD-02: Get order statistics
  async getOrderStats(distributorId: string): Promise<OrderStats> {
    const statuses = await prisma.order.groupBy({
      by: ['status'],
      where: { distributorId },
      _count: true
    });

    const stats: OrderStats = {
      new: 0,
      accepted: 0,
      assigned: 0,
      in_transit: 0,
      delivered: 0,
      cancelled: 0,
      rejected: 0
    };

    statuses.forEach(s => {
      const key = s.status.toLowerCase() as keyof OrderStats;
      stats[key] = s._count;
    });

    return stats;
  }

  // ORD-05: Create order (by distributor)
  async createOrder(distributorId: string, data: any) {
    const { clientId, items, deliveryAddress, notes, paymentMethod } = data;

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { priceRules: { where: { clientId } } }
      });

      if (!product) throw new Error(`Mahsulot topilmadi: ${item.productId}`);

      // Get price (custom or default)
      let price = product.wholesalePrice;
      if (product.priceRules.length > 0) {
        price = product.priceRules[0].price;
      }

      const total = price * item.quantity;
      subtotal += total;

      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: price,
        discount: 0,
        total
      });
    }

    const order = await prisma.order.create({
      data: {
        distributorId,
        clientId,
        status: OrderStatus.NEW,
        subtotal,
        deliveryFee: 0,
        discount: 0,
        totalAmount: subtotal,
        deliveryAddress,
        notes,
        paymentMethod,
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        }
      }
    });

    return order;
  }
}
