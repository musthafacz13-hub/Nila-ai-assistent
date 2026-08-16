import React from 'react';
import { Message } from '../../types';
import { Bot, User, Volume2, Square } from 'lucide-react';
import { motion } from 'motion/react';

interface ChatMessageProps {
  message: Message;
  isPlaying?: boolean;
  onPlay?: (text: string) => void;
  onStop?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isPlaying, onPlay, onStop }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
    >
      <div className={`flex max-w-[85%] sm:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center">
              <User size={16} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-900 flex items-center justify-center">
              <Bot size={16} />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <div
            className={`px-4 py-3 rounded-2xl ${
              isUser
                ? 'bg-neutral-900 text-white rounded-tr-sm'
                : 'bg-neutral-100 text-neutral-900 rounded-tl-sm border border-neutral-200'
            }`}
          >
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
          {!isUser && onPlay && onStop && (
            <div className="flex px-1">
              {isPlaying ? (
                <button 
                  onClick={onStop} 
                  className="text-neutral-400 hover:text-neutral-700 transition-colors p-1 flex items-center gap-1.5 text-xs font-medium"
                  title="Stop speaking"
                >
                  <Square size={12} className="fill-current" /> Stop
                </button>
              ) : (
                <button 
                  onClick={() => onPlay(message.content)} 
                  className="text-neutral-400 hover:text-neutral-700 transition-colors p-1 flex items-center gap-1.5 text-xs font-medium"
                  title="Read aloud"
                >
                  <Volume2 size={14} /> Listen
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
