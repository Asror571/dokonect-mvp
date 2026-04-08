import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDriverDashboard = async (req: Request, res: Response) => {
  const driverId = req.user?.driverId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [driver, todayOrders, todayEarnings, activeOrder] = await Promise.all([
    prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true },
    }),
    prisma.order.count({
      where: {
        driverId,
        status: 'DELIVERED',
        updatedAt: { gte: today },
      },
    }),
    prisma.driverEarning.aggregate({
      where: {
        driverId,
        date: { gte: today },
      },
      _sum: { amount: true, bonus: true },
    }),
    prisma.order.findFirst({
      where: {
        driverId,
        status: { in: ['PICKED_UP', 'IN_TRANSIT', 'ARRIVED'] },
      },
      include: {
        client: { include: { user: true } },
        items: { include: { product: true } },
      },
    }),
  ]);

  res.json({
    driver,
    todayOrders,
    todayEarnings: (todayEarnings._sum.amount || 0) + (todayEarnings._sum.bonus || 0),
    activeOrder,
  });
};

export const updateDriverLocation = async (req: Request, res: Response) => {
  const driverId = req.user?.driverId;
  const { lat, lng } = req.body;

  await Promise.all([
    prisma.driver.update({
      where: { id: driverId },
      data: { currentLat: lat, currentLng: lng },
    }),
    prisma.driverLocation.create({
      data: { driverId, lat, lng },
    }),
  ]);

  // Emit socket event for real-time tracking
  req.app.get('io').emit('driver:location', { driverId, lat, lng });

  res.json({ success: true });
};

export const updateDriverStatus = async (req: Request, res: Response) => {
  const driverId = req.user?.driverId;
  const { isOnline } = req.body;

  const driver = await prisma.driver.update({
    where: { id: driverId },
    data: { isOnline },
  });

  res.json(driver);
};

export const acceptOrder = async (req: Request, res: Response) => {
  const driverId = req.user?.driverId;
  const { orderId } = req.params;

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      driverId,
      status: 'PICKED_UP',
    },
    include: {
      client: { include: { user: true } },
      distributor: true,
    },
  });

  await prisma.orderStatusHistory.create({
    data: {
      orderId,
      status: 'PICKED_UP',
    },
  });

  // Notify client
  req.app.get('io').to(order.clientId).emit('order:status_update', order);

  res.json(order);
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { status, photoProof, signature, problemReport } = req.body;

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      client: { include: { user: true } },
      delivery: true,
    },
  });

  await prisma.orderStatusHistory.create({
    data: { orderId, status },
  });

  if (status === 'DELIVERED') {
    await prisma.delivery.update({
      where: { orderId },
      data: {
        deliveryTime: new Date(),
        photoProof,
        signature,
      },
    });

    // Calculate earnings
    const baseAmount = order.totalAmount * 0.1; // 10% commission
    await prisma.driverEarning.create({
      data: {
        driverId: req.user?.driverId!,
        orderId,
        amount: baseAmount,
      },
    });
  }

  if (problemReport) {
    await prisma.delivery.update({
      where: { orderId },
      data: { problemReport },
    });
  }

  // Emit real-time update
  req.app.get('io').to(order.clientId).emit('order:status_update', order);

  res.json(order);
};

export const getDriverEarnings = async (req: Request, res: Response) => {
  const driverId = req.user?.driverId;
  const { period = 'today' } = req.query;

  let startDate = new Date();
  if (period === 'today') {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(startDate.getMonth() - 1);
  }

  const earnings = await prisma.driverEarning.findMany({
    where: {
      driverId,
      date: { gte: startDate },
    },
    orderBy: { date: 'desc' },
  });

  const total = earnings.reduce((sum, e) => sum + e.amount + e.bonus, 0);

  res.json({ earnings, total });
};
