import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getClientDashboard = async (req: Request, res: Response) => {
  const clientId = req.user?.clientId;

  const [activeOrder, recentOrders, client] = await Promise.all([
    prisma.order.findFirst({
      where: {
        clientId: clientId!,
        status: { in: ['NEW', 'ACCEPTED', 'ASSIGNED', 'PICKED', 'IN_TRANSIT'] as any },
      },
      include: {
        distributor: true,
        driver: { include: { user: true } },
        items: { include: { product: true } },
      },
    }),
    prisma.order.findMany({
      where: { clientId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        distributor: true,
        items: { include: { product: true } },
      },
    }),
    prisma.client.findUnique({
      where: { id: clientId },
      include: { user: true },
    }),
  ]);

  res.json({
    activeOrder,
    recentOrders,
    client,
  });
};

export const getProducts = async (req: Request, res: Response) => {
  const clientId = req.user?.clientId;
  const { categoryId, search, distributorId, brandId, minPrice, maxPrice, sort } = req.query;

  const where: any = {
    status: 'ACTIVE',
    distributor: { isVerified: true }
  };

  if (categoryId) where.categoryId = categoryId as string;
  if (brandId) where.brandId = brandId as string;
  if (distributorId) {
    where.distributorId = distributorId as string;
  }
  
  if (minPrice || maxPrice) {
    where.wholesalePrice = {
      ...(minPrice ? { gte: parseFloat(minPrice as string) } : {}),
      ...(maxPrice ? { lte: parseFloat(maxPrice as string) } : {}),
    };
  }

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { sku: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      distributor: { select: { id: true, companyName: true, phone: true } },
      category: true,
      brand: true,
      images: { where: { isCover: true }, take: 1 },
      bulkRules: true,
      priceRules: {
        where: { clientId: clientId }
      }
    },
    orderBy: sort === 'price_asc' ? { wholesalePrice: 'asc' } :
             sort === 'price_desc' ? { wholesalePrice: 'desc' } :
             { createdAt: 'desc' }
  });

  res.json(products);
};

export const getDistributors = async (req: Request, res: Response) => {
  const clientId = req.user?.clientId;
  const { region, search } = req.query;

  const where: any = {};
  if (region) where.region = region;
  if (search) {
    where.OR = [
      { companyName: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const distributors = await prisma.distributor.findMany({
    where,
    include: {
      user: { select: { name: true, avatar: true } },
      storeLinks: {
        where: { storeOwnerId: clientId }
      }
    } as any
  });

  const formatted = distributors.map((d: any) => ({
    id: d.id,
    companyName: d.companyName,
    logo: d.logo,
    region: d.address,
    rating: d.rating,
    isVerified: d.isVerified,
    linkStatus: d.storeLinks[0]?.status || 'NONE'
  }));

  res.json(formatted);
};

export const connectDistributor = async (req: Request, res: Response) => {
  const clientId = req.user?.clientId;
  const { distributorId } = req.params;

  const existingLink = await (prisma as any).storeDistributorLink.findUnique({
    where: {
      storeOwnerId_distributorId: {
        storeOwnerId: clientId!,
        distributorId
      }
    }
  });

  if (existingLink) {
    return res.status(400).json({ error: 'Connection request already exists or established' });
  }

  const link = await (prisma as any).storeDistributorLink.create({
    data: {
      storeOwnerId: clientId!,
      distributorId,
      status: 'PENDING'
    }
  });

  res.status(201).json(link);
};

export const getFinanceSummary = async (req: Request, res: Response) => {
  const clientId = req.user?.clientId;

  const [debts, totalSpent] = await Promise.all([
    (prisma as any).debt.findMany({
      where: { clientId, status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] } }
    }),
    prisma.order.aggregate({
      where: { clientId, status: 'DELIVERED' },
      _sum: { totalAmount: true }
    })
  ]);

  const totalDebt = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
  
  // Actually need to check overdue by date
  const now = new Date();
  const overdueDebt = debts
    .filter(d => d.dueDate && d.dueDate < now)
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  res.json({
    totalDebt,
    overdueDebt,
    totalSpent: totalSpent._sum.totalAmount || 0,
    activeDebtsCount: debts.length
  });
};

export const createOrder = async (req: Request, res: Response) => {
  const clientId = req.user?.clientId;
  const { distributorId, items, deliveryAddress, deliveryTimeSlot, notes } = req.body;

  // Calculate total
  const productIds = items.map((item: any) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const totalAmount = items.reduce((sum: number, item: any) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + (product?.wholesalePrice || 0) * item.quantity;
  }, 0);

  // Create order
  const order = await prisma.order.create({
    data: {
      clientId: clientId!,
      distributorId,
      totalAmount,
      deliveryAddress,
      deliveryTimeSlot,
      notes,
      items: {
        create: items.map((item: any) => {
          const product = products.find((p) => p.id === item.productId);
          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product?.wholesalePrice || 0,
          };
        }),
      },
    },
    include: {
      items: { include: { product: true } },
      distributor: true,
    },
  });

  await prisma.orderStatusHistory.create({
    data: {
      orderId: order.id,
      status: 'NEW',
    },
  });

  // Emit socket event to distributor
  req.app.get('io').emit('order:new', {
    orderId: order.id,
    distributorId,
  });

  res.status(201).json(order);
};

export const getOrderTracking = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const clientId = req.user?.clientId;

  const order = await prisma.order.findFirst({
    where: { id: orderId, clientId },
    include: {
      distributor: true,
      driver: { include: { user: true } },
      items: { include: { product: true } },
      statusHistory: { orderBy: { timestamp: 'asc' } },
      delivery: true,
    },
  });

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json(order);
};

export const getOrderHistory = async (req: Request, res: Response) => {
  const clientId = req.user?.clientId;

  const orders = await prisma.order.findMany({
    where: { clientId },
    include: {
      distributor: true,
      items: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(orders);
};

export const getOrderStats = async (req: Request, res: Response) => {
  const clientId = req.user?.clientId;

  const stats = await prisma.order.groupBy({
    by: ['status'],
    where: { clientId },
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
      clientId,
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
};

export const rateDelivery = async (req: Request, res: Response) => {
  const clientId = req.user?.clientId;
  const { orderId } = req.params;
  const { rating, comment } = req.body;

  const order = await prisma.order.findFirst({
    where: { id: orderId, clientId, status: 'DELIVERED' },
  });

  if (!order || !order.driverId) {
    return res.status(400).json({ error: 'Cannot rate this order' });
  }

  const deliveryRating = await prisma.deliveryRating.create({
    data: {
      clientId: clientId!,
      driverId: order.driverId,
      orderId,
      rating,
      comment,
    },
  });

  // Update driver rating
  const allRatings = await prisma.deliveryRating.findMany({
    where: { driverId: order.driverId },
  });

  const avgRating =
    allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

  await prisma.driver.update({
    where: { id: order.driverId },
    data: { rating: avgRating },
  });

  res.json(deliveryRating);
};
