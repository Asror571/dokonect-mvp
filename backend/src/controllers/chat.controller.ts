import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../prisma/client';
import { sendSuccess } from '../utils/response';

// GET /api/chat/rooms
export const getChatRooms = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  let rooms: any[];

  if (user.role === 'STORE_OWNER') {
    const storeOwner = await prisma.storeOwner.findUnique({ where: { userId: user.id } });
    if (!storeOwner) { res.status(403); throw new Error('Profil topilmadi'); }

    rooms = await prisma.chatRoom.findMany({
      where: { storeOwnerId: storeOwner.id },
      include: {
        distributor: { select: { id: true, companyName: true, logoUrl: true, user: { select: { id: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  } else {
    const dist = await prisma.distributor.findUnique({ where: { userId: user.id } });
    if (!dist) { res.status(403); throw new Error('Profil topilmadi'); }

    rooms = await prisma.chatRoom.findMany({
      where: { distributorId: dist.id },
      include: {
        storeOwner: { select: { id: true, storeName: true, user: { select: { id: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  // Unread count per room
  const roomsWithUnread = await Promise.all(
    rooms.map(async (room) => {
      const unreadCount = await prisma.message.count({
        where: { chatRoomId: room.id, isRead: false, senderId: { not: user.id } },
      });
      return { ...room, unreadCount };
    })
  );

  sendSuccess(res, roomsWithUnread, 'Chat xonalari', 200);
});

// POST /api/chat/rooms
export const createChatRoom = asyncHandler(async (req: Request, res: Response) => {
  const storeOwner = await prisma.storeOwner.findUnique({ where: { userId: req.user!.id } });
  if (!storeOwner) { res.status(403); throw new Error('Do\'kon egasi profili topilmadi'); }

  const { distributorId } = req.body;
  if (!distributorId) { res.status(400); throw new Error('distributorId kiritilishi shart'); }

  const room = await prisma.chatRoom.upsert({
    where: { storeOwnerId_distributorId: { storeOwnerId: storeOwner.id, distributorId } },
    create: { storeOwnerId: storeOwner.id, distributorId },
    update: {},
    include: {
      distributor: { select: { id: true, companyName: true, logoUrl: true } },
    },
  });

  sendSuccess(res, room, 'Chat xonasi', 201);
});

// GET /api/chat/rooms/:roomId/messages
export const getRoomMessages = asyncHandler(async (req: Request, res: Response) => {
  const roomId = String(req.params.roomId);
  if (!roomId || roomId === 'undefined') {
    res.status(400); throw new Error('roomId kiritilishi shart');
  }

  const page  = parseInt(req.query.page as string) || 1;
  const limit = 30;
  const skip  = (page - 1) * limit;

  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room) { res.status(404); throw new Error('Chat xonasi topilmadi'); }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { chatRoomId: roomId },
      include: { sender: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.message.count({ where: { chatRoomId: roomId } }),
  ]);

  sendSuccess(res, { messages: messages.reverse(), total, page }, 'Xabarlar', 200);
});

// PATCH /api/chat/rooms/:roomId/read
export const markRoomRead = asyncHandler(async (req: Request, res: Response) => {
  const roomId = String(req.params.roomId);
  if (!roomId || roomId === 'undefined') {
    res.status(400); throw new Error('roomId kiritilishi shart');
  }

  await prisma.message.updateMany({
    where: { chatRoomId: roomId, senderId: { not: req.user!.id }, isRead: false },
    data: { isRead: true },
  });

  sendSuccess(res, null, 'O\'qildi', 200);
});
