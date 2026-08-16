export const tts = {
  speak: (text: string, onEnd: () => void, langPref = 'ml-IN') => {
    if (!('speechSynthesis' in window)) {
      onEnd();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    let selectedVoice = voices.find(v => v.lang.includes(langPref) || v.lang.includes(langPref.split('-')[0]));
    
    if (!selectedVoice && langPref === 'ml-IN') {
       selectedVoice = voices.find(v => v.lang.includes('en-IN')) || voices.find(v => v.lang.includes('en'));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = onEnd;
    utterance.onerror = onEnd;

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
