import React from 'react';
import { format } from 'date-fns';
import { cn } from '../ui/Button';
import { Message } from '../../hooks/useChat';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => (
  <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
    <div
      className={cn(
        'max-w-[70%] px-4 py-2.5 rounded-2xl text-sm',
        isOwn
          ? 'bg-violet-600 text-white rounded-br-sm'
          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
      )}
    >
      <p className="leading-relaxed">{message.content}</p>
      <p className={cn('text-[10px] mt-1', isOwn ? 'text-violet-200' : 'text-slate-400')}>
        {format(new Date(message.createdAt), 'HH:mm')}
      </p>
    </div>
  </div>
);

export default MessageBubble;
