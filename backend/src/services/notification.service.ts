import prisma from '../prisma/client';
import { NotifType } from '@prisma/client';

export async function createNotification(
  userId: string,
  type: NotifType,
  title: string,
  body: string,
  metadata?: Record<string, any>
) {
  return prisma.notification.create({
    data: { userId, type, title, body, metadata },
  });
}

export async function notifyOrderStatus(
  orderId: string,
  status: string,
  clientId: string,
  distributorUserId: string
) {
  const typeMap: Record<string, NotifType> = {
    ACCEPTED:   'ORDER_ACCEPTED',
    IN_TRANSIT: 'ORDER_STATUS_UPDATE',
    DELIVERED:  'ORDER_DELIVERED',
    CANCELLED:  'ORDER_CANCELLED',
    REJECTED:   'ORDER_REJECTED',
  };
  const titleMap: Record<string, string> = {
    ACCEPTED:   'Buyurtma qabul qilindi',
    IN_TRANSIT: 'Buyurtma yo\'lda',
    DELIVERED:  'Buyurtma yetkazildi',
    CANCELLED:  'Buyurtma bekor qilindi',
    REJECTED:   'Buyurtma rad etildi',
  };

  const notifType = typeMap[status];
  if (!notifType) return;

  // Notify client
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { user: true }
  });
  if (client) {
    await createNotification(
      client.userId,
      notifType,
      titleMap[status] || `Buyurtma ${status}`,
      `Buyurtma #${orderId.slice(-6)} holati: ${status}`,
      { orderId }
    );
  }
}
