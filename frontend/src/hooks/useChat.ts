import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import socket from '../lib/socket';
import api from '../api/api';
import { useAuthStore } from '../store/auth.store';

export interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; email: string; role: string };
}

export interface ChatRoom {
  id: string;
  storeOwnerId: string;
  distributorId: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: Message[];
  storeOwner?: { id: string; storeName: string };
  distributor?: { id: string; companyName: string; logoUrl?: string };
}

export function useChatRooms() {
  return useQuery<ChatRoom[]>({
    queryKey: ['chat-rooms'],
    queryFn: async () => {
      const res = await api.get('/chat/rooms');
      return res.data.data;
    },
  });
}

export function useChatRoom(roomId: string | null) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => {
      const res = await api.get(`/chat/rooms/${roomId}/messages`);
      return res.data.data.messages as Message[];
    },
    enabled: !!roomId,
  });

  useEffect(() => {
    if (data) setMessages(data);
  }, [data]);

  useEffect(() => {
    if (!roomId) return;

    socket.emit('join_room', { roomId });
    api.patch(`/chat/rooms/${roomId}/read`).catch(() => {});

    const onNewMessage = ({ message }: { message: Message }) => {
      setMessages((prev) => [...prev, message]);
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    };

    const onTyping = ({ userId }: { userId: string; roomId: string }) => {
      if (userId === user?.id) return;
      setTypingUsers((prev) => [...new Set([...prev, userId])]);
      setTimeout(() => setTypingUsers((prev) => prev.filter((id) => id !== userId)), 2000);
    };

    socket.on('new_message', onNewMessage);
    socket.on('user_typing', onTyping);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('user_typing', onTyping);
    };
  }, [roomId, user?.id, queryClient]);

  const sendMessage = useCallback((content: string) => {
    if (!roomId || !content.trim()) return;
    socket.emit('send_message', { roomId, content });
  }, [roomId]);

  const emitTyping = useCallback(() => {
    if (!roomId) return;
    socket.emit('typing', { roomId });
  }, [roomId]);

  return { messages, isLoading, typingUsers, sendMessage, emitTyping, isTyping, setIsTyping };
}

export function useCreateChatRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (distributorId: string) => api.post('/chat/rooms', { distributorId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat-rooms'] }),
  });
}
