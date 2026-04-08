import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client';
import { setOnline, setOffline } from '../services/redis.service';
import { createNotification } from '../services/notification.service';

interface AuthSocket extends Socket {
  userId?: string;
  userRole?: string;
  distributorId?: string;
  clientId?: string;
}

export function initChatSocket(io: Server) {
  // Auth middleware
  io.use(async (socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Token yo\'q'));

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as { userId: string; role: string; distributorId?: string; clientId?: string };

      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      socket.distributorId = decoded.distributorId;
      socket.clientId = decoded.clientId;
      next();
    } catch {
      next(new Error('Token yaroqsiz'));
    }
  });

  io.on('connection', async (socket: AuthSocket) => {
    const userId = socket.userId!;
    console.log(`💬 Chat socket connected: ${userId}`);

    await setOnline(userId);
    io.emit('online_status', { userId, isOnline: true });

    // Join chat room
    socket.on('join_room', async ({ roomId }: { roomId: string }) => {
      try {
        // Verify user has access to this room
        const room = await prisma.chatRoom.findFirst({
          where: {
            id: roomId,
            OR: [
              { distributorId: socket.distributorId },
              { storeOwnerId: socket.clientId }
            ]
          }
        });

        if (!room) {
          socket.emit('error', { message: 'Access denied to this room' });
          return;
        }

        socket.join(roomId);
        console.log(`👥 User ${userId} joined room ${roomId}`);

        // Mark messages as read
        await prisma.message.updateMany({
          where: {
            chatRoomId: roomId,
            senderId: { not: userId },
            isRead: false
          },
          data: { isRead: true }
        });
      } catch (err) {
        console.error('join_room error:', err);
      }
    });

    // Leave chat room
    socket.on('leave_room', ({ roomId }: { roomId: string }) => {
      socket.leave(roomId);
      console.log(`👋 User ${userId} left room ${roomId}`);
    });

    // Send message
    socket.on('send_message', async ({ roomId, content, type = 'TEXT' }: {
      roomId: string;
      content: string;
      type?: string;
    }) => {
      try {
        if (!roomId || !content?.trim()) {
          socket.emit('error', { message: 'Room ID and content required' });
          return;
        }

        // Verify user has access to this room
        const room = await prisma.chatRoom.findFirst({
          where: {
            id: roomId,
            OR: [
              { distributorId: socket.distributorId },
              { storeOwnerId: socket.clientId }
            ]
          },
          include: {
            storeOwner: { include: { user: true } },
            distributor: { include: { user: true } }
          }
        });

        if (!room) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            chatRoomId: roomId,
            senderId: userId,
            content,
            type: type as any
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

        // Emit to room
        io.to(roomId).emit('new_message', { message });

        // Send notification to recipient
        const recipientId = socket.userRole === 'DISTRIBUTOR'
          ? room.storeOwner.userId
          : room.distributor.userId;

        await createNotification(
          recipientId,
          'NEW_MESSAGE',
          'Yangi xabar',
          content.substring(0, 100),
          { roomId, senderId: userId }
        );

        console.log(`📨 Message sent in room ${roomId}`);
      } catch (err) {
        console.error('send_message error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', ({ roomId }: { roomId: string }) => {
      socket.to(roomId).emit('user_typing', { userId, roomId });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      await setOffline(userId);
      io.emit('online_status', { userId, isOnline: false });
      console.log(`💬 Chat socket disconnected: ${userId}`);
    });
  });
}
