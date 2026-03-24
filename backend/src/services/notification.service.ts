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
  storeOwnerId: string,
  distributorUserId: string
) {
  const typeMap: Record<string, NotifType> = {
    CONFIRMED:  'ORDER_CONFIRMED',
    DELIVERING: 'ORDER_DELIVERING',
    DELIVERED:  'ORDER_DELIVERED',
    CANCELLED:  'ORDER_CANCELLED',
  };
  const titleMap: Record<string, string> = {
    CONFIRMED:  'Buyurtma tasdiqlandi',
    DELIVERING: 'Buyurtma yetkazilmoqda',
    DELIVERED:  'Buyurtma yetkazildi',
    CANCELLED:  'Buyurtma bekor qilindi',
  };

  const notifType = typeMap[status];
  if (!notifType) return;

  // Notify store owner
  const storeOwner = await prisma.storeOwner.findUnique({ where: { id: storeOwnerId } });
  if (storeOwner) {
    await createNotification(
      storeOwner.userId,
      notifType,
      titleMap[status],
      `Buyurtma #${orderId.slice(-6)} holati: ${status}`,
      { orderId }
    );
  }
}
