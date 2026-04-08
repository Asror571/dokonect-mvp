import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/notifications
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const page  = parseInt(req.query.page as string) || 1;
  const limit = 20;
  const skip  = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId: req.user!.userId } }),
  ]);

  res.json({ success: true, data: { notifications, total, page } });
});

// GET /api/notifications/unread-count
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await prisma.notification.count({
    where: { userId: req.user!.userId, isRead: false },
  });
  res.json({ success: true, data: { count } });
});

// PATCH /api/notifications/:id/read
export const markRead = asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.userId },
    data: { isRead: true },
  });
  res.json({ success: true, message: 'Marked as read' });
});

// PATCH /api/notifications/read-all
export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, isRead: false },
    data: { isRead: true },
  });
  res.json({ success: true, message: 'All marked as read' });
});
