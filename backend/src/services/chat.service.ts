import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ChatService {
  // CHAT-01: Get chat list
  async getChatList(userId: string) {
    // Get all conversations
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
        receiver: { select: { id: true, name: true, avatar: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by conversation partner
    const conversations: Record<string, any> = {};

    messages.forEach(msg => {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;

      if (!conversations[partnerId]) {
        conversations[partnerId] = {
          partnerId,
          partner,
          lastMessage: msg,
          unreadCount: 0
        };
      }

      // Count unread messages
      if (msg.receiverId === userId && !msg.isRead) {
        conversations[partnerId].unreadCount++;
      }
    });

    return Object.values(conversations);
  }

  // CHAT-01: Get messages with a user
  async getMessages(userId: string, partnerId: string, page = 1, limit = 50) {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId }
        ]
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Mark as read
    await prisma.message.updateMany({
      where: {
        senderId: partnerId,
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    return messages.reverse();
  }

  // CHAT-01: Send message
  async sendMessage(senderId: string, receiverId: string, data: any) {
    const { content, type = 'TEXT', fileUrl, orderId } = data;

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        type,
        fileUrl,
        orderId
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } }
      }
    });

    // Send push notification
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'NEW_MESSAGE',
        title: 'Yangi xabar',
        body: `${message.sender.name}: ${content.substring(0, 50)}`,
        metadata: { messageId: message.id, senderId }
      }
    });

    return message;
  }

  // CHAT-01: Mark messages as read
  async markAsRead(userId: string, partnerId: string) {
    return prisma.message.updateMany({
      where: {
        senderId: partnerId,
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });
  }

  // Get unread count
  async getUnreadCount(userId: string) {
    return prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });
  }
}
