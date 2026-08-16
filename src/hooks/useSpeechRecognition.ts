import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechRecognitionProps {
  onResult: (text: string, isFinal: boolean) => void;
  onEnd: () => void;
}

export function useSpeechRecognition({ onResult, onEnd }: UseSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [lang, setLang] = useState('ml-IN');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const onResultRef = useRef(onResult);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onResultRef.current = onResult;
    onEndRef.current = onEnd;
  }, [onResult, onEnd]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop when the user finishes speaking
    recognition.interimResults = true;
    
    recognition.onstart = () => {
      console.log('[VOICE] RECOGNITION_STARTED');
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let fullTranscript = '';
      let isFinal = false;
      
      // Iterate from 0 to get the FULL transcript of the current session
      for (let i = 0; i < event.results.length; ++i) {
        fullTranscript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          isFinal = true;
        }
      }
      
      if (isFinal) {
        console.log('[VOICE] FINAL_TRANSCRIPT:', fullTranscript);
      } else {
        console.log('[VOICE] INTERIM_TRANSCRIPT:', fullTranscript);
      }
      
      onResultRef.current(fullTranscript, isFinal);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        console.log('[VOICE] PERMISSION_DENIED');
        setError('Mic blocked. Try opening in a new tab.');
      } else if (event.error === 'network') {
        setError('Network error during speech recognition.');
      } else {
        setError('Speech recognition failed.');
      }
      setIsListening(false);
      
      setTimeout(() => {
        setError(null);
      }, 4000);
    };

    recognition.onend = () => {
      console.log('[VOICE] RECOGNITION_ENDED');
      setIsListening(false);
      onEndRef.current();
    };

    recognitionRef.current = recognition;
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
  }, [lang]);

  const startListening = useCallback(() => {
    console.log('[VOICE] MIC_CLICKED (START)');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    console.log('[VOICE] MIC_CLICKED (STOP)');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'ml-IN' ? 'en-IN' : 'ml-IN'));
  }, []);

  return { isListening, supported, startListening, stopListening, lang, toggleLang, error };
}
