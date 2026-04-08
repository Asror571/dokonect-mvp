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
  type: string;
  sender: { id: string; name: string; role: string; avatar?: string };
}

export interface ChatRoom {
  id: string;
  storeOwner?: {
    id: string;
    storeName: string;
    user: { id: string; name: string; phone: string; avatar?: string };
  };
  distributor?: {
    id: string;
    companyName: string;
    logo?: string;
    user: { id: string; name: string; phone: string; avatar?: string };
  };
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

// Get all chat rooms
export function useChatRooms() {
  return useQuery<ChatRoom[]>({
    queryKey: ['chat-rooms'],
    queryFn: async () => {
      const res = await api.get('/chat/rooms');
      return res.data.data || [];
    },
  });
}

// Chat with a specific room
export function useChatRoom(roomId: string | null) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const res = await api.get(`/chat/rooms/${roomId}/messages`);
      return res.data.data?.messages || [];
    },
    enabled: !!roomId,
  });

  useEffect(() => {
    if (data) setMessages(data);
  }, [data]);

  useEffect(() => {
    if (!roomId) return;

    // Connect socket if not connected
    if (!socket.connected) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        socket.auth = { token };
        socket.connect();
      }
    }

    // Join room
    socket.emit('join_room', { roomId });

    // Mark messages as read via API
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
      socket.emit('leave_room', { roomId });
    };
  }, [roomId, user?.id, queryClient]);

  const sendMessage = useCallback((content: string, type = 'TEXT') => {
    if (!roomId || !content.trim()) return;
    socket.emit('send_message', { roomId, content, type });
  }, [roomId]);

  const emitTyping = useCallback(() => {
    if (!roomId) return;
    socket.emit('typing', { roomId });
  }, [roomId]);

  return {
    messages,
    isLoading,
    typingUsers,
    sendMessage,
    emitTyping,
    refetch
  };
}

// Create chat room mutation
export function useCreateChatRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ storeOwnerId, distributorId }: { storeOwnerId?: string; distributorId?: string }) => {
      const res = await api.post('/chat/rooms', { storeOwnerId, distributorId });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
  });
}

// Legacy exports for compatibility
export function useConversations() {
  return useChatRooms();
}

export function useChat(receiverId: string | null) {
  return useChatRoom(receiverId);
}

export function useSendMessage() {
  return useCreateChatRoom();
}
