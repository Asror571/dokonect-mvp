import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../prisma/client';
import { sendSuccess } from '../../utils/response';

// GET /api/admin/shops - Get all shops/clients
export const getAllShops = asyncHandler(async (req: Request, res: Response) => {
  const { status, riskLevel, search } = req.query;

  const where: any = {};
  
  if (status && status !== 'ALL') {
    where.user = { status };
  }

  if (search) {
    where.OR = [
      { storeName: { contains: search as string, mode: 'insensitive' } },
      { user: { name: { contains: search as string, mode: 'insensitive' } } },
      { user: { phone: { contains: search as string } } }
    ];
  }

  const shops = await prisma.client.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          status: true,
          createdAt: true,
          lastLogin: true
        }
      },
      _count: {
        select: {
          orders: true,
          debts: true
        }
      }
    },
    orderBy: { user: { createdAt: 'desc' } }
  });

  // Calculate stats for each shop
  const shopsWithStats = await Promise.all(
    shops.map(async (shop) => {
      const [totalSpent, totalDebt, overdueDebt] = await Promise.all([
        prisma.order.aggregate({
          where: {
            clientId: shop.id,
            status: { in: ['DELIVERED'] }
          },
          _sum: { totalAmount: true }
        }),
        prisma.debt.aggregate({
          where: {
            clientId: shop.id,
            status: { in: ['UNPAID', 'PARTIAL'] }
          },
          _sum: { remainingAmount: true }
        }),
        prisma.debt.aggregate({
          where: {
            clientId: shop.id,
            status: { in: ['UNPAID', 'PARTIAL'] },
            dueDate: { lt: new Date() }
          },
          _sum: { remainingAmount: true }
        })
      ]);

      // Calculate risk level
      const debtAmount = totalDebt._sum.remainingAmount || 0;
      const overdueAmount = overdueDebt._sum.remainingAmount || 0;
      const spentAmount = totalSpent._sum.totalAmount || 0;
      
      let riskLevel = 'LOW';
      if (overdueAmount > 0) {
        if (overdueAmount > spentAmount * 0.5) {
          riskLevel = 'HIGH';
        } else if (overdueAmount > spentAmount * 0.2) {
          riskLevel = 'MEDIUM';
        }
      } else if (debtAmount > spentAmount * 0.7) {
        riskLevel = 'MEDIUM';
      }

      return {
        ...shop,
        totalSpent: spentAmount,
        totalDebt: debtAmount,
        overdueDebt: overdueAmount,
        ordersCount: shop._count.orders,
        debtsCount: shop._count.debts,
        riskLevel
      };
    })
  );

  // Filter by risk level if specified
  let filteredShops = shopsWithStats;
  if (riskLevel && riskLevel !== 'ALL') {
    filteredShops = shopsWithStats.filter(s => s.riskLevel === riskLevel);
  }

  sendSuccess(res, filteredShops, 'Shops retrieved', 200);
});

// GET /api/admin/shops/:id - Get shop details
export const getShopDetails = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const shop = await prisma.client.findUnique({
    where: { id },
    include: {
      user: true,
      orders: {
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          distributor: { include: { user: { select: { name: true } } } },
          items: { include: { product: { select: { name: true } } } }
        }
      },
      debts: {
        orderBy: { createdAt: 'desc' },
        include: {
          distributor: { select: { companyName: true } },
          order: { select: { id: true, createdAt: true } }
        }
      },
      _count: {
        select: {
          orders: true,
          debts: true
        }
      }
    }
  });

  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }

  // Calculate stats
  const [totalSpent, totalDebt, overdueDebt, activeOrders] = await Promise.all([
    prisma.order.aggregate({
      where: {
        clientId: id,
        status: { in: ['DELIVERED'] }
      },
      _sum: { totalAmount: true }
    }),
    prisma.debt.aggregate({
      where: {
        clientId: id,
        status: { in: ['UNPAID', 'PARTIAL'] }
      },
      _sum: { remainingAmount: true }
    }),
    prisma.debt.aggregate({
      where: {
        clientId: id,
        status: { in: ['UNPAID', 'PARTIAL'] },
        dueDate: { lt: new Date() }
      },
      _sum: { remainingAmount: true }
    }),
    prisma.order.count({
      where: {
        clientId: id,
        status: { in: ['NEW', 'ACCEPTED', 'ASSIGNED', 'IN_TRANSIT'] }
      }
    })
  ]);

  // Calculate risk level
  const debtAmount = totalDebt._sum.remainingAmount || 0;
  const overdueAmount = overdueDebt._sum.remainingAmount || 0;
  const spentAmount = totalSpent._sum.totalAmount || 0;
  
  let riskLevel = 'LOW';
  let riskScore = 0;
  
  if (overdueAmount > 0) {
    if (overdueAmount > spentAmount * 0.5) {
      riskLevel = 'HIGH';
      riskScore = 80;
    } else if (overdueAmount > spentAmount * 0.2) {
      riskLevel = 'MEDIUM';
      riskScore = 50;
    } else {
      riskScore = 30;
    }
  } else if (debtAmount > spentAmount * 0.7) {
    riskLevel = 'MEDIUM';
    riskScore = 40;
  } else {
    riskScore = 10;
  }

  sendSuccess(res, {
    ...shop,
    stats: {
      totalSpent: spentAmount,
      totalDebt: debtAmount,
      overdueDebt: overdueAmount,
      activeOrders,
      ordersCount: shop._count.orders,
      debtsCount: shop._count.debts,
      riskLevel,
      riskScore
    }
  }, 'Shop details', 200);
});

// PATCH /api/admin/shops/:id/block - Block/Unblock shop
export const toggleShopBlock = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const shop = await prisma.client.findUnique({
    where: { id },
    include: { user: true }
  });

  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }

  const newStatus = shop.user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

  const updated = await prisma.user.update({
    where: { id: shop.userId },
    data: { status: newStatus }
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: shop.userId,
      type: 'ORDER_CANCELLED',
      title: newStatus === 'SUSPENDED' ? 'Akkaunt bloklandi' : 'Akkaunt aktivlashtirildi',
      body: reason || (newStatus === 'SUSPENDED' ? 'Sizning akkauntingiz bloklandi' : 'Sizning akkauntingiz aktivlashtirildi')
    }
  });

  sendSuccess(res, updated, `Shop ${newStatus === 'SUSPENDED' ? 'blocked' : 'unblocked'}`, 200);
});

// PATCH /api/admin/shops/:id/credit-limit - Set credit limit
export const setShopCreditLimit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { creditLimit } = req.body;

  if (!creditLimit || creditLimit < 0) {
    res.status(400);
    throw new Error('Invalid credit limit');
  }

  // Store in client metadata (you might want to add a creditLimit field to Client model)
  const shop = await prisma.client.update({
    where: { id },
    data: {
      // Add creditLimit field to schema if needed
      // creditLimit: parseFloat(creditLimit)
    }
  });

  sendSuccess(res, shop, 'Credit limit updated', 200);
});

// GET /api/admin/shops/risky - Get risky shops
export const getRiskyShops = asyncHandler(async (req: Request, res: Response) => {
  const shops = await prisma.client.findMany({
    include: {
      user: { select: { name: true, phone: true, status: true } },
      debts: {
        where: {
          status: { in: ['UNPAID', 'PARTIAL'] },
          dueDate: { lt: new Date() }
        }
      }
    }
  });

  // Filter and calculate risk
  const riskyShops = await Promise.all(
    shops
      .filter(shop => shop.debts.length > 0)
      .map(async (shop) => {
        const [totalSpent, overdueDebt] = await Promise.all([
          prisma.order.aggregate({
            where: { clientId: shop.id, status: 'DELIVERED' },
            _sum: { totalAmount: true }
          }),
          prisma.debt.aggregate({
            where: {
              clientId: shop.id,
              status: { in: ['UNPAID', 'PARTIAL'] },
              dueDate: { lt: new Date() }
            },
            _sum: { remainingAmount: true }
          })
        ]);

        const overdueAmount = overdueDebt._sum.remainingAmount || 0;
        const spentAmount = totalSpent._sum.totalAmount || 1;
        const riskScore = Math.min(100, Math.round((overdueAmount / spentAmount) * 100));

        return {
          ...shop,
          overdueAmount,
          totalSpent: spentAmount,
          riskScore,
          overdueDebtsCount: shop.debts.length
        };
      })
  );

  // Sort by risk score
  riskyShops.sort((a, b) => b.riskScore - a.riskScore);

  sendSuccess(res, riskyShops, 'Risky shops', 200);
});
