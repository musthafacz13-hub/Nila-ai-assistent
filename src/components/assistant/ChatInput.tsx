import { ArrowUp, Mic, Square } from 'lucide-react';
import React, { FormEvent, KeyboardEvent, useRef, useState, useCallback, useEffect } from 'react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transcriptRef = useRef('');
  const finalTranscriptRef = useRef('');

  const handleSpeechResult = useCallback((text: string, isFinal: boolean) => {
    setInput(text);
    transcriptRef.current = text;
    if (isFinal) {
      finalTranscriptRef.current = text;
    }
  }, []);

  const handleSpeechEnd = useCallback(() => {
    const textToSend = finalTranscriptRef.current.trim();
    if (textToSend && !disabled) {
      console.log('[CHAT] VOICE_MESSAGE_SUBMIT:', textToSend);
      onSend(textToSend);
      setInput('');
      transcriptRef.current = '';
      finalTranscriptRef.current = '';
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } else {
      // If recognition ended without a final result, or it ended because 
      // the UI became disabled (e.g. from a quick action), discard the stale text.
      setInput('');
      transcriptRef.current = '';
      finalTranscriptRef.current = '';
    }
  }, [onSend, disabled]);

  const {
    isListening,
    supported,
    startListening,
    stopListening,
    lang,
    toggleLang,
    error
  } = useSpeechRecognition({
    onResult: handleSpeechResult,
    onEnd: handleSpeechEnd
  });

  useEffect(() => {
    if (disabled && isListening) {
      stopListening();
    }
  }, [disabled, isListening, stopListening]);

  const handleSubmit = useCallback((e?: FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !disabled) {
      const textToSend = input.trim();
      setInput('');
      transcriptRef.current = ''; // Prevent double-send if mic is active
      finalTranscriptRef.current = '';
      if (isListening) {
        stopListening(); // Stop mic if it was listening
      }
      onSend(textToSend);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [input, disabled, onSend, isListening, stopListening]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    transcriptRef.current = e.target.value; // Keep ref in sync if user types while listening
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  const placeholder = error 
     ? error 
     : isListening 
        ? "Listening..." 
        : disabled 
           ? "Thinking..." 
           : "Ask anything...";

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative flex items-end w-full overflow-hidden rounded-3xl border border-neutral-300 bg-white focus-within:border-neutral-500 focus-within:ring-1 focus-within:ring-neutral-500 transition-shadow">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full max-h-[150px] min-h-[56px] resize-none bg-transparent py-4 pl-5 ${supported ? 'pr-[120px]' : 'pr-14'} text-base text-neutral-900 placeholder:text-neutral-500 focus:outline-none scrollbar-hide`}
          rows={1}
          disabled={disabled || isListening}
        />
        <div className="absolute right-1 bottom-1 flex items-center gap-1 bg-white pl-2 pb-1 pr-1 pt-1">
          {supported && (
             <button
               type="button"
               onClick={toggleLang}
               className="px-2 py-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors"
               title="Toggle Language"
             >
               {lang === 'ml-IN' ? 'ML' : 'EN'}
             </button>
          )}
          {supported && (
            <button
               type="button"
               onClick={isListening ? stopListening : startListening}
               className={`p-2 rounded-full transition-colors ${isListening ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'}`}
               title={isListening ? "Stop listening" : "Tap to speak"}
            >
               {isListening ? <Square size={18} className="fill-current animate-pulse" /> : <Mic size={18} />}
            </button>
          )}
          <button
             type="submit"
             disabled={!input.trim() || disabled}
             className="p-2.5 rounded-full bg-neutral-900 text-white disabled:bg-neutral-200 disabled:text-neutral-400 transition-colors ml-1"
          >
            <ArrowUp size={20} />
          </button>
        </div>
      </div>
      {!supported && (
         <p className="text-xs text-center text-neutral-500 mt-3">
           Voice input isn't supported in this browser. You can still type your message.
         </p>
      )}
    </form>
  );
}
