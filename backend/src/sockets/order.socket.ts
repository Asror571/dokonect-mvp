import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const initOrderSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Join user-specific room
    socket.on('join:user', (userId: string) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    // Join driver room for order offers
    socket.on('join:driver', (driverId: string) => {
      socket.join(`driver:${driverId}`);
      console.log(`Driver ${driverId} joined driver room`);
    });

    // Join distributor room
    socket.on('join:distributor', (distributorId: string) => {
      socket.join(`distributor:${distributorId}`);
      console.log(`Distributor ${distributorId} joined distributor room`);
    });

    // New order created - notify distributor
    socket.on('order:new', async (data: { orderId: string; distributorId: string }) => {
      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        include: {
          client: { include: { user: true } },
          items: { include: { product: true } },
        },
      });

      io.to(`distributor:${data.distributorId}`).emit('order:new', order);

      // Create notification
      await prisma.notification.create({
        data: {
          userId: order?.distributorId!,
          type: 'ORDER_NEW',
          title: 'New Order Received',
          body: `Order #${order?.id.slice(0, 8)} from ${order?.client.user.name}`,
          metadata: { orderId: order?.id },
        },
      });
    });

    // Order accepted - notify client and find driver
    socket.on('order:accepted', async (data: { orderId: string }) => {
      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        include: {
          client: { include: { user: true } },
          distributor: true,
        },
      });

      io.to(order?.clientId!).emit('order:accepted', order);

      // Find available drivers nearby (simplified - in production use geospatial queries)
      const availableDrivers = await prisma.driver.findMany({
        where: { isOnline: true },
        take: 5,
      });

      // Offer order to drivers
      availableDrivers.forEach((driver) => {
        io.to(`driver:${driver.id}`).emit('order:offer', {
          order,
          expiresIn: 30, // 30 seconds to accept
        });
      });
    });

    // Driver location update - broadcast to tracking clients
    socket.on('driver:location', async (data: { driverId: string; lat: number; lng: number }) => {
      // Update driver location
      await prisma.driver.update({
        where: { id: data.driverId },
        data: {
          currentLat: data.lat,
          currentLng: data.lng,
        },
      });

      // Find active orders for this driver
      const activeOrders = await prisma.order.findMany({
        where: {
          driverId: data.driverId,
          status: { in: ['PICKED', 'IN_TRANSIT'] },
        },
      });

      // Notify clients tracking their orders
      activeOrders.forEach((order) => {
        io.to(order.clientId).emit('driver:location', {
          orderId: order.id,
          lat: data.lat,
          lng: data.lng,
        });
      });

      // Notify admin dashboard
      io.to('admin').emit('driver:location', data);
    });

    // Order status update
    socket.on('order:status_update', async (data: { orderId: string; status: string }) => {
      const order = await prisma.order.update({
        where: { id: data.orderId },
        data: { status: data.status as any },
        include: {
          client: { include: { user: true } },
          driver: { include: { user: true } },
        },
      });

      await prisma.orderStatusHistory.create({
        data: {
          orderId: data.orderId,
          status: data.status as any,
        },
      });

      // Notify all parties
      io.to(order.clientId).emit('order:status_update', order);
      io.to(`distributor:${order.distributorId}`).emit('order:status_update', order);
      io.to('admin').emit('order:status_update', order);

      // Create notification
      await prisma.notification.create({
        data: {
          userId: order.clientId,
          type: 'ORDER_STATUS_UPDATE',
          title: 'Order Status Updated',
          body: `Your order is now ${data.status.replace(/_/g, ' ').toLowerCase()}`,
          metadata: { orderId: order.id },
        },
      });
    });

    // Low stock alert
    socket.on('stock:low_alert', async (data: { productId: string; distributorId: string }) => {
      const product = await prisma.product.findUnique({
        where: { id: data.productId },
      });

      io.to(`distributor:${data.distributorId}`).emit('stock:low_alert', product);
      io.to('admin').emit('stock:low_alert', { product, distributorId: data.distributorId });

      await prisma.notification.create({
        data: {
          userId: data.distributorId,
          type: 'STOCK_LOW_ALERT',
          title: 'Low Stock Alert',
          body: `${product?.name} is running low (${product?.stockQty} left)`,
          metadata: { productId: product?.id },
        },
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};
