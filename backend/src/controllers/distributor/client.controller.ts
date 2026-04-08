import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../prisma/client';
import { sendSuccess } from '../../utils/response';

// GET /api/distributor/clients - Get all clients (stores) for distributor
export const getClients = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.userId } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const { search, status, sortBy = 'name', order = 'asc' } = req.query;

  // Get approved store links
  const where: any = {
    distributorId: dist.id,
    status: 'APPROVED'
  };

  const storeLinks = await prisma.storeDistributorLink.findMany({
    where,
    include: {
      storeOwner: {
        include: {
          user: {
            select: { id: true, name: true, phone: true, email: true, avatar: true, createdAt: true }
          },
          orders: {
            where: { distributorId: dist.id },
            select: { id: true, totalAmount: true, status: true, createdAt: true }
          },
          debts: {
            where: { distributorId: dist.id },
            select: { remainingAmount: true, status: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Format client data
  let clients = storeLinks.map(link => {
    const client = link.storeOwner;
    const totalOrders = client.orders.length;
    const totalSpent = client.orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalDebt = client.debts
      .filter(d => d.status !== 'PAID')
      .reduce((sum, d) => sum + d.remainingAmount, 0);
    const lastOrder = client.orders.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    return {
      id: client.id,
      userId: client.userId,
      name: client.user.name,
      phone: client.user.phone,
      email: client.user.email,
      avatar: client.user.avatar,
      storeName: client.storeName,
      region: client.region,
      tier: client.tier,
      totalOrders,
      totalSpent,
      totalDebt,
      lastOrderDate: lastOrder?.createdAt || null,
      joinedAt: link.approvedAt || link.createdAt,
      loyaltyPoints: client.loyaltyPoints
    };
  });

  // Apply search filter
  if (search) {
    const searchLower = String(search).toLowerCase();
    clients = clients.filter(c =>
      c.name?.toLowerCase().includes(searchLower) ||
      c.storeName?.toLowerCase().includes(searchLower) ||
      c.phone?.includes(String(search))
    );
  }

  // Apply sorting
  clients.sort((a, b) => {
    const aValue = a[sortBy as keyof typeof a] || 0;
    const bValue = b[sortBy as keyof typeof b] || 0;
    if (order === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  sendSuccess(res, clients, 'Klientlar', 200);
});

// GET /api/distributor/clients/:id - Get single client details
export const getClientById = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.userId } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const { id } = req.params;

  // Verify client is linked to this distributor
  const link = await prisma.storeDistributorLink.findFirst({
    where: {
      storeOwnerId: id,
      distributorId: dist.id,
      status: 'APPROVED'
    }
  });

  if (!link) {
    res.status(404);
    throw new Error('Klient topilmadi');
  }

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, phone: true, email: true, avatar: true, createdAt: true }
      },
      orders: {
        where: { distributorId: dist.id },
        include: {
          items: { include: { product: { select: { name: true, images: { take: 1 } } } } }
        },
        orderBy: { createdAt: 'desc' }
      },
      debts: {
        where: { distributorId: dist.id },
        include: { order: { select: { id: true, createdAt: true } } }
      },
      priceRules: {
        where: { clientId: id },
        include: { product: { select: { name: true } } }
      }
    }
  });

  if (!client) {
    res.status(404);
    throw new Error('Klient topilmadi');
  }

  // Calculate stats
  const totalOrders = client.orders.length;
  const totalSpent = client.orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const deliveredOrders = client.orders.filter(o => o.status === 'DELIVERED').length;
  const cancelledOrders = client.orders.filter(o => o.status === 'CANCELLED').length;

  const totalDebt = client.debts
    .filter(d => d.status !== 'PAID')
    .reduce((sum, d) => sum + d.remainingAmount, 0);
  const overdueDebt = client.debts
    .filter(d => d.status === 'OVERDUE')
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  // Get favorite products (most ordered)
  const productCounts: Record<string, { count: number; product: any }> = {};
  client.orders.forEach(order => {
    order.items.forEach(item => {
      if (!productCounts[item.productId]) {
        productCounts[item.productId] = { count: 0, product: item.product };
      }
      productCounts[item.productId].count += item.quantity;
    });
  });

  const favoriteProducts = Object.values(productCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  sendSuccess(res, {
    id: client.id,
    user: client.user,
    storeName: client.storeName,
    region: client.region,
    addresses: client.addresses,
    tier: client.tier,
    loyaltyPoints: client.loyaltyPoints,
    taxId: client.taxId,
    stats: {
      totalOrders,
      totalSpent,
      deliveredOrders,
      cancelledOrders,
      averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0,
      successRate: totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0
    },
    debt: {
      totalDebt,
      overdueDebt,
      activeDebts: client.debts.filter(d => d.status !== 'PAID').length
    },
    orders: client.orders.slice(0, 10), // Last 10 orders
    debts: client.debbs,
    priceRules: client.priceRules,
    favoriteProducts
  }, 'Klient ma\'lumotlari', 200);
});

// GET /api/distributor/clients/:id/orders - Get client order history
export const getClientOrders = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.userId } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const { id } = req.params;
  const { status, page = '1', limit = '20' } = req.query;

  // Verify client is linked
  const link = await prisma.storeDistributorLink.findFirst({
    where: {
      storeOwnerId: id,
      distributorId: dist.id,
      status: 'APPROVED'
    }
  });

  if (!link) {
    res.status(404);
    throw new Error('Klient topilmadi');
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const where: any = {
    clientId: id,
    distributorId: dist.id
  };

  if (status && status !== 'ALL') {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, images: { take: 1 } } },
            variant: true
          }
        },
        debt: true,
        driver: {
          include: { user: { select: { name: true, phone: true } } }
        },
        delivery: true
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
      pages: Math.ceil(total / take)
    }
  }, 'Buyurtmalar', 200);
});

// GET /api/distributor/clients/:id/debts - Get client debt history
export const getClientDebts = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.userId } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const { id } = req.params;

  // Verify client is linked
  const link = await prisma.storeDistributorLink.findFirst({
    where: {
      storeOwnerId: id,
      distributorId: dist.id,
      status: 'APPROVED'
    }
  });

  if (!link) {
    res.status(404);
    throw new Error('Klient topilmadi');
  }

  const debts = await prisma.debt.findMany({
    where: {
      clientId: id,
      distributorId: dist.id
    },
    include: {
      order: {
        include: {
          items: {
            include: { product: { select: { name: true } } }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const now = new Date();
  const debtsWithOverdue = debts.map(debt => ({
    ...debt,
    isOverdue: debt.dueDate && debt.dueDate < now && debt.status !== 'PAID',
    daysOverdue: debt.dueDate && debt.dueDate < now && debt.status !== 'PAID'
      ? Math.floor((now.getTime() - debt.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0
  }));

  sendSuccess(res, debtsWithOverdue, 'Nasiyalar', 200);
});

// PATCH /api/distributor/clients/:id - Update client info (tier, notes, etc)
export const updateClient = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.userId } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const { id } = req.params;
  const { tier, notes } = req.body;

  // Verify client is linked
  const link = await prisma.storeDistributorLink.findFirst({
    where: {
      storeOwnerId: id,
      distributorId: dist.id,
      status: 'APPROVED'
    }
  });

  if (!link) {
    res.status(404);
    throw new Error('Klient topilmadi');
  }

  const updateData: any = {};
  if (tier) updateData.tier = tier;
  // Note: Custom price rules or notes can be stored in the link

  const updated = await prisma.client.update({
    where: { id },
    data: updateData,
    include: {
      user: { select: { name: true, phone: true } }
    }
  });

  sendSuccess(res, updated, 'Klient yangilandi', 200);
});

// GET /api/distributor/pending-clients - Get pending connection requests
export const getPendingClients = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.userId } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const pendingLinks = await prisma.storeDistributorLink.findMany({
    where: {
      distributorId: dist.id,
      status: 'PENDING'
    },
    include: {
      storeOwner: {
        include: {
          user: { select: { name: true, phone: true, email: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  sendSuccess(res, pendingLinks.map(link => ({
    id: link.id,
    clientId: link.storeOwnerId,
    name: link.storeOwner.user.name,
    phone: link.storeOwner.user.phone,
    email: link.storeOwner.user.email,
    storeName: link.storeOwner.storeName,
    region: link.storeOwner.region,
    requestedAt: link.createdAt
  })), 'Kutilayotgan so\'rovlar', 200);
});

// POST /api/distributor/pending-clients/:id/approve - Approve client connection
export const approveClient = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.userId } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const { id } = req.params;

  const link = await prisma.storeDistributorLink.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedAt: new Date()
    },
    include: {
      storeOwner: {
        include: { user: { select: { id: true, name: true } } }
      }
    }
  });

  // Create notification for client
  await prisma.notification.create({
    data: {
      userId: link.storeOwner.userId,
      type: 'NEW_MESSAGE',
      title: 'Ulanish tasdiqlandi',
      body: `${dist.companyName} sizning so'rovingizni tasdiqladi`,
      metadata: { distributorId: dist.id }
    }
  });

  sendSuccess(res, link, 'So\'rov tasdiqlandi', 200);
});

// POST /api/distributor/pending-clients/:id/reject - Reject client connection
export const rejectClient = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.userId } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const { id } = req.params;

  const link = await prisma.storeDistributorLink.update({
    where: { id },
    data: { status: 'REJECTED' }
  });

  sendSuccess(res, link, 'So\'rov rad etildi', 200);
});
