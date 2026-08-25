let voices: SpeechSynthesisVoice[] = [];

function refreshVoices() {
  if ('speechSynthesis' in window) {
    voices = window.speechSynthesis.getVoices();
  }
}

export const tts = {
  speak: (text: string, onEnd: () => void, langPref = 'ml-IN') => {
    if (!('speechSynthesis' in window)) {
      onEnd();
      return;
    }

    window.speechSynthesis.cancel();
    refreshVoices();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langPref;

    const language = langPref.toLowerCase();
    const baseLanguage = language.split('-')[0];
    const selectedVoice =
      voices.find((voice) => voice.lang.toLowerCase() === language) ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith(`${baseLanguage}-`)) ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith(baseLanguage));

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    let completed = false;
    const finish = () => {
      if (completed) return;
      completed = true;
      onEnd();
    };

    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
  },

  stop: () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  },

  init: () => {
    if ('speechSynthesis' in window) {
      refreshVoices();
      window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
    }
  },
};

export function cleanupTts() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.removeEventListener('voiceschanged', refreshVoices);
    window.speechSynthesis.cancel();
  }
}
