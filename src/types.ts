export type VoiceName = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export type SpeechEmotion =
  | 'sad'
  | 'happy'
  | 'angry'
  | 'excited'
  | 'silly'
  | 'bored'
  | 'shy'
  | 'worried'
  | 'disappointed'
  | 'frustrated'
  | 'embarrassed'
  | 'surprised';

export type SpeechTone =
  | 'natural'
  | SpeechEmotion
  | 'storyteller'
  | 'professional'
  | 'friendly'
  | 'calm'
  | 'dramatic'
  | 'whisper';

export type SynthesisEngine = 'gemini-ai' | 'browser-speech';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  sampleText: string;
}

export interface VoicePersona {
  id: VoiceName;
  name: string;
  gender: 'female' | 'male';
  tagline: string;
  description: string;
  bestFor: string;
  avatarColor: string;
}

export interface DialogueLine {
  id: string;
  speaker: 'Speaker A' | 'Speaker B';
  voice: VoiceName;
  text: string;
  emotion?: SpeechTone;
}

export interface GenerationHistoryItem {
  id: string;
  timestamp: number;
  text: string;
  voice: VoiceName | string;
  language: string;
  tone: SpeechTone | string;
  engine: SynthesisEngine;
  audioBase64?: string;
  durationEstimate?: number;
  wordCount: number;
  isDialogue?: boolean;
}

export interface SynthesizeRequest {
  text: string;
  voice: VoiceName;
  language: string;
  tone: SpeechTone;
  customInstruction?: string;
  speed?: number;
  mode?: 'single' | 'dialogue';
  dialogue?: Array<{ speaker: string; voice: VoiceName; text: string }>;
}

export interface SynthesizeResponse {
  success: boolean;
  audioBase64?: string;
  mimeType?: string;
  sampleRate?: number;
  durationEstimate?: number;
  error?: string;
  details?: string;
}
