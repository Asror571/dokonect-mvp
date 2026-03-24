import React, { useState } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useChatRooms } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import ChatSidebar from '../../components/chat/ChatSidebar';
import ChatWindow from '../../components/chat/ChatWindow';

const DistributorChatPage = () => {
  useSocket();
  const { data: rooms = [], isLoading } = useChatRooms();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-7 h-7 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">Chat</h1>
        <p className="text-slate-500 text-sm mt-0.5">Do'kon egalari bilan muloqot</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex" style={{ height: 'calc(100vh - 180px)' }}>
        <ChatSidebar rooms={rooms} selectedRoomId={selectedRoomId} onSelect={setSelectedRoomId} />
        {selectedRoom ? (
          <ChatWindow room={selectedRoom} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
            <MessageSquare className="w-12 h-12" />
            <p className="text-sm">Chat tanlang</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DistributorChatPage;
