/**
 * Audio helpers for playback, Web Speech API synthesis, and file download.
 */

// Play base64 WAV or data URL audio with Web Audio API or HTMLAudioElement
export function createAudioBlobUrl(base64Wav: string): string {
  const binary = atob(base64Wav);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

// Browser Web Speech API synthesizer for zero-latency local voice generation
export function speakWithBrowserWebSpeech(
  text: string,
  options: {
    langCode?: string;
    tone?: string;
    pitch?: number;
    rate?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: unknown) => void;
  }
): { cancel: () => void } {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    throw new Error('Web Speech API is not supported in this browser environment.');
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Determine emotional modulation for pitch and rate
  let computedPitch = options.pitch ?? 1.0;
  let computedRate = options.rate ?? 1.0;

  if (options.tone) {
    switch (options.tone) {
      case 'happy':
        computedPitch = 1.25;
        computedRate = 1.12;
        break;
      case 'sad':
        computedPitch = 0.82;
        computedRate = 0.85;
        break;
      case 'angry':
        computedPitch = 1.15;
        computedRate = 1.2;
        break;
      case 'excited':
        computedPitch = 1.35;
        computedRate = 1.25;
        break;
      case 'silly':
        computedPitch = 1.4;
        computedRate = 1.1;
        break;
      case 'bored':
        computedPitch = 0.78;
        computedRate = 0.8;
        break;
      case 'shy':
        computedPitch = 1.1;
        computedRate = 0.88;
        break;
      case 'worried':
        computedPitch = 1.22;
        computedRate = 1.15;
        break;
      case 'disappointed':
        computedPitch = 0.85;
        computedRate = 0.86;
        break;
      case 'frustrated':
        computedPitch = 1.08;
        computedRate = 1.18;
        break;
      case 'embarrassed':
        computedPitch = 1.18;
        computedRate = 0.92;
        break;
      case 'surprised':
        computedPitch = 1.35;
        computedRate = 1.15;
        break;
      case 'whisper':
        computedPitch = 0.88;
        computedRate = 0.9;
        break;
      case 'calm':
        computedPitch = 0.95;
        computedRate = 0.9;
        break;
      case 'storyteller':
        computedPitch = 1.05;
        computedRate = 0.95;
        break;
      default:
        break;
    }
  }

  // Hinglish locale mapping: use en-IN or hi-IN for authentic Indian English cadence
  const targetLang = options.langCode === 'hi-en' ? 'en-IN' : options.langCode;

  if (targetLang) utterance.lang = targetLang;
  utterance.pitch = computedPitch;
  utterance.rate = computedRate;

  // Try to find a voice matching the language
  const voices = window.speechSynthesis.getVoices();
  if (targetLang && voices.length > 0) {
    const match = voices.find(v => v.lang.toLowerCase().startsWith(targetLang.toLowerCase())) ||
      (options.langCode === 'hi-en' ? voices.find(v => v.lang.toLowerCase().startsWith('hi') || v.lang.toLowerCase().startsWith('en-in')) : null);
    if (match) utterance.voice = match;
  }

  // Chrome speechSynthesis timeout keepalive for long speech (up to 15 mins)
  let keepAliveTimer: NodeJS.Timeout | null = null;
  const startKeepAlive = () => {
    if (keepAliveTimer) clearInterval(keepAliveTimer);
    keepAliveTimer = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  };

  const cleanup = () => {
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }
  };

  utterance.onstart = () => {
    startKeepAlive();
    if (options.onStart) options.onStart();
  };

  utterance.onend = () => {
    cleanup();
    if (options.onEnd) options.onEnd();
  };

  utterance.onerror = (err) => {
    cleanup();
    if (options.onError) options.onError(err);
  };

  window.speechSynthesis.speak(utterance);

  return {
    cancel: () => {
      cleanup();
      window.speechSynthesis.cancel();
    }
  };
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function downloadWavFile(blobUrl: string, filename = 'ai-speech-synthesis.wav') {
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
