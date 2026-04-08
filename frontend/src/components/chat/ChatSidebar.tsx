import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Search, MessageSquare } from 'lucide-react';
import { cn } from '../ui/Button';
import { ChatRoom } from '../../hooks/useChat';
import { useAuthStore } from '../../store/auth.store';

interface ChatSidebarProps {
  rooms: ChatRoom[];
  selectedRoomId: string | null;
  onSelect: (roomId: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ rooms, selectedRoomId, onSelect }) => {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');

  const filtered = rooms.filter((r) => {
    const name = user?.role === 'CLIENT'
      ? r.distributor?.companyName
      : r.storeOwner?.storeName;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="w-72 border-r border-slate-200 flex flex-col bg-white">
      <div className="p-4 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Qidirish..."
            className="w-full pl-9 pr-3 h-9 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400">
            <MessageSquare className="w-8 h-8" />
            <p className="text-sm">Chat yo'q</p>
          </div>
        ) : (
          filtered.map((room) => {
            const name = user?.role === 'CLIENT'
              ? room.distributor?.companyName
              : room.storeOwner?.storeName;
            const lastMsg = room.lastMessage;
            const lastMsgAt = room.lastMessageAt;

            return (
              <button
                key={room.id}
                onClick={() => onSelect(room.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50',
                  selectedRoomId === room.id && 'bg-violet-50 border-violet-100'
                )}
              >
                <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm font-bold shrink-0">
                  {name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
                    {lastMsgAt && (
                      <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                        {formatDistanceToNow(new Date(lastMsgAt), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {lastMsg || 'Xabar yo\'q'}
                  </p>
                </div>
                {room.unreadCount > 0 && (
                  <span className="w-5 h-5 bg-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                    {room.unreadCount}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
