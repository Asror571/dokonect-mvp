import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

let socket: Socket | null = null;

export const useSocket = () => {
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user.id) return;

    // Initialize socket connection
    socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      
      // Join user-specific room
      socket?.emit('join:user', user.id);

      // Join role-specific rooms
      if (user.role === 'DRIVER' && user.driverId) {
        socket?.emit('join:driver', user.driverId);
      } else if (user.role === 'DISTRIBUTOR' && user.distributorId) {
        socket?.emit('join:distributor', user.distributorId);
      }
    });

    // Listen for new orders (Distributor)
    socket.on('order:new', (order: any) => {
      toast.success(`New order received from ${order.client.user.name}`, {
        duration: 5000,
        icon: '📦',
      });
      
      // Play notification sound
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    });

    // Listen for order accepted (Client)
    socket.on('order:accepted', (order: any) => {
      toast.success('Your order has been accepted!', {
        icon: '✅',
      });
    });

    // Listen for order status updates
    socket.on('order:status_update', (order: any) => {
      toast(`Order status: ${order.status.replace(/_/g, ' ')}`, {
        icon: '📍',
      });
    });

    // Listen for driver location updates (Client tracking)
    socket.on('driver:location', (data: any) => {
      // Update map marker in real-time
      window.dispatchEvent(new CustomEvent('driver-location-update', { detail: data }));
    });

    // Listen for order offers (Driver)
    socket.on('order:offer', (data: any) => {
      toast.success(
        `New delivery offer!\n${data.order.deliveryAddress.street}\nExpires in ${data.expiresIn}s`,
        {
          duration: data.expiresIn * 1000,
          icon: '🚚',
        }
      );
      
      // Emit custom event for driver app to handle
      window.dispatchEvent(new CustomEvent('order-offer', { detail: data }));
    });

    // Listen for low stock alerts (Distributor)
    socket.on('stock:low_alert', (product: any) => {
      toast.error(`Low stock alert: ${product.name} (${product.stockQty} left)`, {
        duration: 8000,
        icon: '⚠️',
      });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      socket?.disconnect();
    };
  }, []);

  return socket;
};

export const getSocket = () => socket;
