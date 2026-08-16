import React, { useEffect, useRef, useState } from 'react';
import { Message } from '../../types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { QuickActions } from './QuickActions';
import { MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { tts } from '../../lib/tts';

export function AssistantShell() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
     tts.init();
     return () => tts.stop();
  }, []);

  const handlePlay = (id: string, text: string) => {
     setPlayingId(id);
     tts.speak(text, () => {
        setPlayingId(prev => prev === id ? null : prev);
     });
  };

  const handleStop = () => {
     tts.stop();
     setPlayingId(null);
  };

  const handleSendMessage = async (content: string) => {
    handleStop();

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      console.log('[CHAT] API_REQUEST_STARTED');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content }),
      });

      const data = await response.json();
      console.log('[CHAT] API_RESPONSE_RECEIVED');

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch response');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      console.log('[CHAT] ASSISTANT_MESSAGE_ADDED');
      handlePlay(assistantMessage.id, assistantMessage.content);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I couldn\'t process that right now. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
      handlePlay(errorMessage.id, errorMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-white text-neutral-900 font-sans">
      {/* Header */}
      <header className="flex-none flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900">Nila</h1>
        <button className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 w-full max-w-3xl mx-auto flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center mt-12 sm:mt-24 mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div className="w-16 h-16 bg-neutral-100 rounded-3xl mx-auto mb-6 flex items-center justify-center border border-neutral-200">
                <span className="text-3xl">✨</span>
              </div>
              <h2 className="text-3xl font-semibold mb-3 tracking-tight">How can I help?</h2>
              <p className="text-neutral-500 text-lg mb-8 max-w-md">
                Ask anything in Malayalam, Manglish, or English.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
              className="w-full"
            >
              <QuickActions onSelect={handleSendMessage} />
            </motion.div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col w-full pt-6">
            {messages.map((msg) => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                isPlaying={playingId === msg.id}
                onPlay={(text) => handlePlay(msg.id, text)}
                onStop={handleStop}
              />
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex w-full justify-start mb-6"
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="flex-none p-4 sm:p-6 bg-white w-full max-w-3xl mx-auto pb-safe">
        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        <p className="text-xs text-center text-neutral-400 mt-4 mb-2">
          Nila can make mistakes. Consider verifying important information.
        </p>
      </footer>
    </div>
  );
}
