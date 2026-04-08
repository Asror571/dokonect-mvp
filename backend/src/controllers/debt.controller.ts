import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../prisma/client';
import { sendSuccess } from '../utils/response';
import { DebtStatus } from '@prisma/client';

// GET /api/debts/distributor - Get all debts for distributor
export const getDistributorDebts = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.userId } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const { status, overdue } = req.query;

  const where: any = { distributorId: dist.id };
  if (status && status !== 'ALL') {
    where.status = status as DebtStatus;
  }

  const debts = await prisma.debt.findMany({
    where,
    include: {
      client: {
        include: {
          user: { select: { name: true, phone: true } }
        }
      },
      order: {
        include: {
          items: { include: { product: { select: { name: true } } } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate overdue status
  const now = new Date();
  const debtsWithOverdue = debts.map(debt => ({
    ...debt,
    isOverdue: debt.dueDate && debt.dueDate < now && debt.status !== 'PAID',
    daysOverdue: debt.dueDate && debt.dueDate < now && debt.status !== 'PAID'
      ? Math.floor((now.getTime() - debt.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0
  }));

  // Filter by overdue if requested
  let filteredDebts = debtsWithOverdue;
  if (overdue === 'true') {
    filteredDebts = debtsWithOverdue.filter(d => d.isOverdue);
  }

  // Calculate summary
  const summary = {
    totalDebt: debts.reduce((sum, d) => sum + d.remainingAmount, 0),
    totalPaid: debts.reduce((sum, d) => sum + d.paidAmount, 0),
    overdueCount: debtsWithOverdue.filter(d => d.isOverdue).length,
    overdueAmount: debtsWithOverdue
      .filter(d => d.isOverdue)
      .reduce((sum, d) => sum + d.remainingAmount, 0),
  };

  sendSuccess(res, { debts: filteredDebts, summary }, 'Nasiyalar', 200);
});

// GET /api/debts/distributor/clients/:clientId - Get client debt details
export const getClientDebts = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.userId } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const { clientId } = req.params;

  const debts = await prisma.debt.findMany({
    where: {
      distributorId: dist.id,
      clientId
    },
    include: {
      order: {
        include: {
          items: { include: { product: { select: { name: true, images: { take: 1 } } } } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate totals
  const totalDebt = debts.reduce((sum, d) => sum + d.originalAmount, 0);
  const totalPaid = debts.reduce((sum, d) => sum + d.paidAmount, 0);
  const remaining = debts.reduce((sum, d) => sum + d.remainingAmount, 0);

  sendSuccess(res, {
    debts,
    summary: {
      totalDebt,
      totalPaid,
      remaining,
      debtCount: debts.length
    }
  }, 'Klient nasiyalari', 200);
});

// POST /api/debts/:id/payment - Record a payment for debt
export const recordDebtPayment = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.userId } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const { id } = req.params;
  const { amount, note } = req.body;

  if (!amount || amount <= 0) {
    res.status(400); throw new Error('To\'lov summasi noto\'g\'ri');
  }

  const debt = await prisma.debt.findFirst({
    where: { id, distributorId: dist.id }
  });

  if (!debt) { res.status(404); throw new Error('Nasiya topilmadi'); }
  if (debt.status === 'PAID') { res.status(400); throw new Error('Bu nasiya allaqachon to\'langan'); }

  const newPaidAmount = debt.paidAmount + parseFloat(amount);
  const newRemainingAmount = debt.originalAmount - newPaidAmount;

  let newStatus: DebtStatus = 'PARTIAL';
  if (newRemainingAmount <= 0) {
    newStatus = 'PAID';
  }

  const updatedDebt = await prisma.debt.update({
    where: { id },
    data: {
      paidAmount: newPaidAmount,
      remainingAmount: Math.max(0, newRemainingAmount),
      status: newStatus,
      paidAt: newStatus === 'PAID' ? new Date() : debt.paidAt,
    },
    include: {
      client: {
        include: {
          user: { select: { name: true, phone: true } }
        }
      },
      order: true
    }
  });

  // Update order payment status
  if (newStatus === 'PAID') {
    await prisma.order.update({
      where: { id: debt.orderId },
      data: { paymentStatus: 'PAID' }
    });
  } else {
    await prisma.order.update({
      where: { id: debt.orderId },
      data: { paymentStatus: 'PARTIAL' }
    });
  }

  // TODO: Create payment record in a payments table if needed

  sendSuccess(res, updatedDebt, 'To\'lov qayd etildi', 200);
});

// GET /api/debts/distributor/summary - Get debt summary/stats
export const getDebtSummary = asyncHandler(async (req: Request, res: Response) => {
  const dist = await prisma.distributor.findUnique({ where: { userId: req.user!.userId } });
  if (!dist) { res.status(403); throw new Error('Distribyutor profili topilmadi'); }

  const now = new Date();

  const [
    totalDebts,
    unpaidDebts,
    overdueDebts,
    paidDebts,
    todayPayments
  ] = await Promise.all([
    // Total debts
    prisma.debt.aggregate({
      where: { distributorId: dist.id },
      _sum: { originalAmount: true, remainingAmount: true, paidAmount: true },
      _count: { id: true }
    }),
    // Unpaid debts
    prisma.debt.aggregate({
      where: { distributorId: dist.id, status: { in: ['UNPAID', 'PARTIAL'] } },
      _sum: { remainingAmount: true },
      _count: { id: true }
    }),
    // Overdue debts
    prisma.debt.findMany({
      where: {
        distributorId: dist.id,
        status: { in: ['UNPAID', 'PARTIAL'] },
        dueDate: { lt: now }
      }
    }),
    // Paid debts this month
    prisma.debt.aggregate({
      where: {
        distributorId: dist.id,
        status: 'PAID',
        paidAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
      },
      _sum: { originalAmount: true },
      _count: { id: true }
    }),
    // Today's payments (calculated from debt updates)
    prisma.debt.findMany({
      where: {
        distributorId: dist.id,
        updatedAt: {
          gte: new Date(now.setHours(0, 0, 0, 0))
        },
        paidAmount: { gt: 0 }
      }
    })
  ]);

  const overdueAmount = overdueDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const todayCollected = todayPayments.reduce((sum, d) => {
    // This is an approximation - ideally we'd have a separate payments table
    return sum + d.paidAmount;
  }, 0);

  sendSuccess(res, {
    total: {
      count: totalDebts._count.id,
      amount: totalDebts._sum.originalAmount || 0,
      paid: totalDebts._sum.paidAmount || 0,
      remaining: totalDebts._sum.remainingAmount || 0
    },
    unpaid: {
      count: unpaidDebts._count.id,
      amount: unpaidDebts._sum.remainingAmount || 0
    },
    overdue: {
      count: overdueDebts.length,
      amount: overdueAmount
    },
    paidThisMonth: {
      count: paidDebts._count.id,
      amount: paidDebts._sum.originalAmount || 0
    },
    todayCollected
  }, 'Nasiya statistikasi', 200);
});

// Client side - GET /api/debts/my - Get my debts (for store owner)
export const getMyDebts = asyncHandler(async (req: Request, res: Response) => {
  const client = await prisma.client.findUnique({ where: { userId: req.user!.userId } });
  if (!client) { res.status(403); throw new Error('Klient profili topilmadi'); }

  const debts = await prisma.debt.findMany({
    where: { clientId: client.id },
    include: {
      distributor: {
        select: { companyName: true, phone: true }
      },
      order: {
        include: {
          items: { include: { product: { select: { name: true } } } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();
  const debtsWithOverdue = debts.map(debt => ({
    ...debt,
    isOverdue: debt.dueDate && debt.dueDate < now && debt.status !== 'PAID',
    daysOverdue: debt.dueDate && debt.dueDate < now && debt.status !== 'PAID'
      ? Math.floor((now.getTime() - debt.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0
  }));

  const totalRemaining = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalOverdue = debtsWithOverdue
    .filter(d => d.isOverdue)
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  sendSuccess(res, {
    debts: debtsWithOverdue,
    summary: {
      totalDebt: debts.reduce((sum, d) => sum + d.originalAmount, 0),
      totalPaid: debts.reduce((sum, d) => sum + d.paidAmount, 0),
      totalRemaining,
      totalOverdue,
      overdueCount: debtsWithOverdue.filter(d => d.isOverdue).length
    }
  }, 'Mening nasiyalarim', 200);
});
