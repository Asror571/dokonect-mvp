import { useEffect } from 'react';
import socket from '../lib/socket';
import { useAuthStore } from '../store/auth.store';

export function useSocket() {
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) return;

    socket.auth = { token };
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return socket;
}
