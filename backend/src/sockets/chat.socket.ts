import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client';
import { setOnline, setOffline } from '../services/redis.service';
import { createNotification } from '../services/notification.service';

interface AuthSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export function initChatSocket(io: Server) {
  // Auth middleware
  io.use(async (socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Token yo\'q'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string; role: string };
      socket.userId   = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Token yaroqsiz'));
    }
  });

  io.on('connection', async (socket: AuthSocket) => {
    const userId = socket.userId!;
    console.log(`Socket connected: ${userId}`);

    await setOnline(userId);
    io.emit('online_status', { userId, isOnline: true });

    // Join room
    socket.on('join_room', ({ roomId }: { roomId: string }) => {
      socket.join(roomId);
    });

    // Send message
    socket.on('send_message', async ({ roomId, content }: { roomId: string; content: string }) => {
      try {
        const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
        if (!room) return;

        const message = await prisma.message.create({
          data: { chatRoomId: roomId, senderId: userId, content },
          include: { sender: { select: { id: true, email: true, role: true } } },
        });

        await prisma.chatRoom.update({
          where: { id: roomId },
          data: { lastMessageAt: new Date() },
        });

        io.to(roomId).emit('new_message', { message });

        // Notify recipient
        const storeOwner = await prisma.storeOwner.findUnique({ where: { id: room.storeOwnerId } });
        const dist       = await prisma.distributor.findUnique({ where: { id: room.distributorId } });

        const recipientUserId = userId === storeOwner?.userId ? dist?.userId : storeOwner?.userId;
        if (recipientUserId) {
          await createNotification(recipientUserId, 'NEW_MESSAGE', 'Yangi xabar', content, { roomId });
        }
      } catch (err) {
        console.error('send_message error:', err);
      }
    });

    // Typing
    socket.on('typing', ({ roomId }: { roomId: string }) => {
      socket.to(roomId).emit('user_typing', { userId, roomId });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      await setOffline(userId);
      io.emit('online_status', { userId, isOnline: false });
      console.log(`Socket disconnected: ${userId}`);
    });
  });
}
