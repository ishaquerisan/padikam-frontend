/**
 * Audio Pronunciation Utility using Web Speech API with fallback
 */
class AudioPronunciationManager {
  private isSpeaking: boolean = false;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoice();
      window.speechSynthesis.onvoiceschanged = () => this.initVoice();
    }
  }

  private initVoice() {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    // Prefer high quality English voices
    const preferred = voices.find(
      (v) => (v.name.includes('Google') || v.name.includes('Natural')) && v.lang.startsWith('en'),
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferred) {
      this.voice = preferred;
    }
  }

  public speak(text: string, rate: number = 0.9, onEnd?: () => void) {
    if (typeof window === 'undefined') return;

    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      if (onEnd) onEnd();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[*_#]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (this.voice) {
      utterance.voice = this.voice;
    }
    utterance.lang = 'en-US';
    utterance.rate = rate; // Slightly slower for clear beginner comprehension
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }
}

export const audioManager = new AudioPronunciationManager();
