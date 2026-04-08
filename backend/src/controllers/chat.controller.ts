import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../prisma/client';
import { sendSuccess } from '../utils/response';

// GET /api/chat/rooms - Get all chat rooms for the current user
export const getChatRooms = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;

  let rooms: any[] = [];

  if (user.role === 'DISTRIBUTOR') {
    // Distributor sees rooms where they are the distributor
    rooms = await prisma.chatRoom.findMany({
      where: { distributorId: user.distributorId },
      include: {
        storeOwner: {
          include: {
            user: { select: { id: true, name: true, phone: true, avatar: true } }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true, senderId: true }
        },
        _count: { select: { messages: { where: { isRead: false, sender: { role: 'CLIENT' } } } } }
      },
      orderBy: { lastMessageAt: 'desc' }
    });
  } else if (user.role === 'CLIENT') {
    // Client sees rooms where they are the store owner
    rooms = await prisma.chatRoom.findMany({
      where: { storeOwnerId: user.clientId },
      include: {
        distributor: {
          include: {
            user: { select: { id: true, name: true, phone: true, avatar: true } }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true, senderId: true }
        },
        _count: { select: { messages: { where: { isRead: false, sender: { role: 'DISTRIBUTOR' } } } } }
      },
      orderBy: { lastMessageAt: 'desc' }
    });
  }

  // Format rooms for frontend
  const formattedRooms = rooms.map(room => ({
    id: room.id,
    storeOwner: user.role === 'DISTRIBUTOR' ? {
      id: room.storeOwner.id,
      storeName: room.storeOwner.storeName,
      user: room.storeOwner.user
    } : undefined,
    distributor: user.role === 'CLIENT' ? {
      id: room.distributor.id,
      companyName: room.distributor.companyName,
      logo: room.distributor.logo,
      user: room.distributor.user
    } : undefined,
    lastMessage: room.messages[0]?.content || null,
    lastMessageAt: room.messages[0]?.createdAt || room.createdAt,
    unreadCount: room._count.messages
  }));

  sendSuccess(res, formattedRooms, 'Chat rooms retrieved', 200);
});

// POST /api/chat/rooms - Create a new chat room
export const createChatRoom = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { storeOwnerId, distributorId } = req.body;

  let roomData: any = {};

  if (user.role === 'DISTRIBUTOR') {
    // Distributor initiates chat with a store owner
    if (!storeOwnerId) {
      res.status(400);
      throw new Error('storeOwnerId is required');
    }
    roomData = {
      storeOwnerId,
      distributorId: user.distributorId
    };
  } else if (user.role === 'CLIENT') {
    // Client initiates chat with a distributor
    if (!distributorId) {
      res.status(400);
      throw new Error('distributorId is required');
    }
    roomData = {
      storeOwnerId: user.clientId,
      distributorId
    };
  } else {
    res.status(403);
    throw new Error('Only distributors and clients can create chat rooms');
  }

  // Check if room already exists
  const existingRoom = await prisma.chatRoom.findUnique({
    where: {
      storeOwnerId_distributorId: {
        storeOwnerId: roomData.storeOwnerId,
        distributorId: roomData.distributorId
      }
    }
  });

  if (existingRoom) {
    sendSuccess(res, { id: existingRoom.id }, 'Chat room already exists', 200);
    return;
  }

  const room = await prisma.chatRoom.create({
    data: roomData,
    include: {
      storeOwner: { include: { user: { select: { id: true, name: true } } } },
      distributor: { include: { user: { select: { id: true, name: true } } } }
    }
  });

  sendSuccess(res, room, 'Chat room created', 201);
});

// GET /api/chat/rooms/:roomId/messages - Get messages for a room
export const getRoomMessages = asyncHandler(async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const user = req.user!;

  // Verify user has access to this room
  const room = await prisma.chatRoom.findFirst({
    where: {
      id: roomId,
      OR: [
        { distributorId: user.distributorId },
        { storeOwnerId: user.clientId }
      ]
    }
  });

  if (!room) {
    res.status(403);
    throw new Error('Access denied to this chat room');
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = 50;
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { chatRoomId: roomId },
      include: {
        sender: { select: { id: true, name: true, role: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.message.count({ where: { chatRoomId: roomId } })
  ]);

  // Mark messages as read
  await prisma.message.updateMany({
    where: {
      chatRoomId: roomId,
      senderId: { not: user.userId },
      isRead: false
    },
    data: { isRead: true }
  });

  sendSuccess(res, {
    messages: messages.reverse(),
    total,
    page,
    pages: Math.ceil(total / limit)
  }, 'Messages retrieved', 200);
});

// POST /api/chat/rooms/:roomId/messages - Send a message
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { content, type = 'TEXT' } = req.body;
  const user = req.user!;

  if (!content?.trim()) {
    res.status(400);
    throw new Error('Message content is required');
  }

  // Verify user has access to this room
  const room = await prisma.chatRoom.findFirst({
    where: {
      id: roomId,
      OR: [
        { distributorId: user.distributorId },
        { storeOwnerId: user.clientId }
      ]
    }
  });

  if (!room) {
    res.status(403);
    throw new Error('Access denied to this chat room');
  }

  const message = await prisma.message.create({
    data: {
      chatRoomId: roomId,
      senderId: user.userId,
      content,
      type
    },
    include: {
      sender: { select: { id: true, name: true, role: true, avatar: true } }
    }
  });

  // Update room's lastMessageAt
  await prisma.chatRoom.update({
    where: { id: roomId },
    data: { lastMessageAt: new Date() }
  });

  sendSuccess(res, message, 'Message sent', 201);
});

// PATCH /api/chat/rooms/:roomId/read - Mark messages as read
export const markRoomAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const user = req.user!;

  await prisma.message.updateMany({
    where: {
      chatRoomId: roomId,
      senderId: { not: user.userId },
      isRead: false
    },
    data: { isRead: true }
  });

  sendSuccess(res, null, 'Marked as read', 200);
});

// GET /api/chat/conversations - Alternative endpoint (legacy support)
export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  // Redirect to getChatRooms
  await getChatRooms(req, res);
});
