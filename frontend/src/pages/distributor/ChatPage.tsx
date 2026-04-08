import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Loader2, Send, Search, User } from 'lucide-react';
import { useChatRooms, useChatRoom } from '../../hooks/useChat';
import { useAuthStore } from '../../store/authStore';
import socket from '../../lib/socket';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

const DistributorChatPage = () => {
  const { user } = useAuthStore();
  const { data: rooms = [], isLoading } = useChatRooms();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [inputText, setInputText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, emitTyping, typingUsers } = useChatRoom(selectedRoomId);

  // Connect socket when user opens the chat page
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !socket.connected) {
      socket.auth = { token };
      socket.connect();
    }
    return () => { /* keep connected for real-time */ };
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const filteredRooms = rooms.filter(r =>
    r.storeOwner?.storeName?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-7 h-7 animate-spin text-violet-500" />
    </div>
  );

  return (
    <div className="fade-in flex flex-col" style={{ height: 'calc(100vh - 96px)' }}>
      <div className="mb-4 shrink-0">
        <h1 className="text-xl font-bold text-slate-900">Chat</h1>
        <p className="text-slate-500 text-sm mt-0.5">Do'kon egalari bilan muloqot</p>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden flex min-h-0">
        {/* Sidebar – room list */}
        <div className="w-72 shrink-0 border-r border-slate-100 flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Qidirish..."
                className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Rooms */}
          <div className="flex-1 overflow-y-auto">
            {filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <MessageSquare className="w-8 h-8" />
                <p className="text-sm">Chat xonalari yo'q</p>
              </div>
            ) : (
              filteredRooms.map(room => {
                const name = room.storeOwner?.storeName || 'Do\'kon';
                const lastMsg = room.messages?.[0];
                const isActive = selectedRoomId === room.id;

                return (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${isActive ? 'bg-violet-50 border-r-2 border-violet-500' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-semibold truncate ${isActive ? 'text-violet-700' : 'text-slate-800'}`}>{name}</p>
                        {room.unreadCount > 0 && (
                          <span className="ml-1 shrink-0 w-5 h-5 bg-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {room.unreadCount}
                          </span>
                        )}
                      </div>
                      {lastMsg && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{lastMsg.content}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat window */}
        {selectedRoomId ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            {(() => {
              const room = rooms.find(r => r.id === selectedRoomId);
              return (
                <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3 shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-sm">
                    {(room?.storeOwner?.storeName || 'S').charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{room?.storeOwner?.storeName || "Do'kon"}</p>
                    <p className="text-xs text-slate-400">Do'kon egasi</p>
                  </div>
                </div>
              );
            })()}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                  <MessageSquare className="w-10 h-10" />
                  <p className="text-sm">Hozircha xabarlar yo'q</p>
                </div>
              )}
              {messages.map(msg => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mr-2 mt-1">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-violet-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-violet-200' : 'text-slate-400'}`}>
                        {format(new Date(msg.createdAt), 'HH:mm', { locale: uz })}
                      </p>
                    </div>
                  </div>
                );
              })}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  Yozmoqda...
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-100 shrink-0">
              <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-2">
                <input
                  value={inputText}
                  onChange={e => { setInputText(e.target.value); emitTyping(); }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Xabar yozing..."
                  className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none py-1"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="font-medium text-slate-600">Chat tanlang</p>
              <p className="text-sm mt-1">Chap tomondagi ro'yxatdan chat xonasini tanlang</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DistributorChatPage;
