import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../prisma/client';
import { sendSuccess } from '../utils/response';

// GET /api/notifications
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const page  = parseInt(req.query.page as string) || 1;
  const limit = 20;
  const skip  = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId: req.user!.id } }),
  ]);

  sendSuccess(res, { notifications, total, page }, 'Bildirishnomalar', 200);
});

// GET /api/notifications/unread-count
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await prisma.notification.count({
    where: { userId: req.user!.id, isRead: false },
  });
  sendSuccess(res, { count }, 'O\'qilmagan bildirishnomalar', 200);
});

// PATCH /api/notifications/:id/read
export const markRead = asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: { isRead: true },
  });
  sendSuccess(res, null, 'O\'qildi', 200);
});

// PATCH /api/notifications/read-all
export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true },
  });
  sendSuccess(res, null, 'Hammasi o\'qildi', 200);
});
