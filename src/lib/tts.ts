export const tts = {
  speak: (text: string, onEnd: () => void, langPref = 'ml-IN') => {
    if (!('speechSynthesis' in window)) {
      console.log('[TTS] TTS_ERROR: speechSynthesis not available');
      onEnd();
      return;
    }

    window.speechSynthesis.cancel();
    console.log('[TTS] TTS_STARTED for text length:', text.length);

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    let selectedVoice = voices.find(v => v.lang.includes(langPref) || v.lang.includes(langPref.split('-')[0]));
    
    if (!selectedVoice && langPref === 'ml-IN') {
       selectedVoice = voices.find(v => v.lang.includes('en-IN')) || voices.find(v => v.lang.includes('en'));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => {
      console.log('[TTS] TTS_FINISHED');
      onEnd();
    };
    utterance.onerror = (e) => {
      console.error('[TTS] TTS_ERROR:', e);
      onEnd();
    };

    window.speechSynthesis.speak(utterance);
  },
  stop: () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  },
  init: () => {
     if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
     }
  }
};
