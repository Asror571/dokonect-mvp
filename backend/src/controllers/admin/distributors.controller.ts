import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../prisma/client';
import { sendSuccess } from '../../utils/response';

// GET /api/admin/distributors - Get all distributors
export const getAllDistributors = asyncHandler(async (req: Request, res: Response) => {
  const { status, search } = req.query;

  const where: any = {};
  
  if (status && status !== 'ALL') {
    if (status === 'ACTIVE') {
      where.isVerified = true;
      where.user = { status: 'ACTIVE' };
    } else if (status === 'BLOCKED') {
      where.user = { status: 'SUSPENDED' };
    } else if (status === 'PENDING') {
      where.isVerified = false;
    }
  }

  if (search) {
    where.OR = [
      { companyName: { contains: search as string, mode: 'insensitive' } },
      { user: { name: { contains: search as string, mode: 'insensitive' } } },
      { user: { phone: { contains: search as string } } }
    ];
  }

  const distributors = await prisma.distributor.findMany({
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
          products: true,
          orders: true
        }
      }
    },
    orderBy: { user: { createdAt: 'desc' } }
  });

  // Calculate revenue for each distributor
  const distributorsWithStats = await Promise.all(
    distributors.map(async (dist) => {
      const revenue = await prisma.order.aggregate({
        where: {
          distributorId: dist.id,
          status: { in: ['DELIVERED', 'ACCEPTED', 'IN_TRANSIT'] }
        },
        _sum: { totalAmount: true }
      });

      return {
        ...dist,
        revenue: revenue._sum.totalAmount || 0,
        productsCount: dist._count.products,
        ordersCount: dist._count.orders
      };
    })
  );

  sendSuccess(res, distributorsWithStats, 'Distributors retrieved', 200);
});

// GET /api/admin/distributors/:id - Get distributor details
export const getDistributorDetails = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const distributor = await prisma.distributor.findUnique({
    where: { id },
    include: {
      user: true,
      products: {
        take: 10,
        orderBy: { createdAt: 'desc' }
      },
      orders: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { include: { user: { select: { name: true } } } }
        }
      },
      _count: {
        select: {
          products: true,
          orders: true,
          warehouses: true
        }
      }
    }
  });

  if (!distributor) {
    res.status(404);
    throw new Error('Distributor not found');
  }

  // Calculate stats
  const [revenue, activeOrders, totalDebt] = await Promise.all([
    prisma.order.aggregate({
      where: {
        distributorId: id,
        status: { in: ['DELIVERED', 'ACCEPTED', 'IN_TRANSIT'] }
      },
      _sum: { totalAmount: true }
    }),
    prisma.order.count({
      where: {
        distributorId: id,
        status: { in: ['NEW', 'ACCEPTED', 'ASSIGNED', 'IN_TRANSIT'] }
      }
    }),
    prisma.debt.aggregate({
      where: {
        distributorId: id,
        status: { in: ['UNPAID', 'PARTIAL'] }
      },
      _sum: { remainingAmount: true }
    })
  ]);

  sendSuccess(res, {
    ...distributor,
    stats: {
      revenue: revenue._sum.totalAmount || 0,
      activeOrders,
      totalDebt: totalDebt._sum.remainingAmount || 0,
      productsCount: distributor._count.products,
      ordersCount: distributor._count.orders,
      warehousesCount: distributor._count.warehouses
    }
  }, 'Distributor details', 200);
});

// PATCH /api/admin/distributors/:id/verify - Verify distributor
export const verifyDistributor = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const distributor = await prisma.distributor.update({
    where: { id },
    data: { isVerified: true },
    include: { user: true }
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: distributor.userId,
      type: 'ORDER_NEW',
      title: 'Akkaunt tasdiqlandi',
      body: 'Sizning distributor akkauntingiz tasdiqlandi!'
    }
  });

  sendSuccess(res, distributor, 'Distributor verified', 200);
});

// PATCH /api/admin/distributors/:id/block - Block/Unblock distributor
export const toggleDistributorBlock = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const distributor = await prisma.distributor.findUnique({
    where: { id },
    include: { user: true }
  });

  if (!distributor) {
    res.status(404);
    throw new Error('Distributor not found');
  }

  const newStatus = distributor.user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

  const updated = await prisma.user.update({
    where: { id: distributor.userId },
    data: { status: newStatus }
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: distributor.userId,
      type: 'ORDER_CANCELLED',
      title: newStatus === 'SUSPENDED' ? 'Akkaunt bloklandi' : 'Akkaunt aktivlashtirildi',
      body: reason || (newStatus === 'SUSPENDED' ? 'Sizning akkauntingiz bloklandi' : 'Sizning akkauntingiz aktivlashtirildi')
    }
  });

  sendSuccess(res, updated, `Distributor ${newStatus === 'SUSPENDED' ? 'blocked' : 'unblocked'}`, 200);
});

// DELETE /api/admin/distributors/:id - Delete distributor
export const deleteDistributor = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const distributor = await prisma.distributor.findUnique({
    where: { id },
    include: { user: true }
  });

  if (!distributor) {
    res.status(404);
    throw new Error('Distributor not found');
  }

  // Delete user (cascade will delete distributor)
  await prisma.user.delete({
    where: { id: distributor.userId }
  });

  sendSuccess(res, null, 'Distributor deleted', 200);
});
