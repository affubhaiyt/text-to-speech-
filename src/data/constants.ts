import { VoicePersona, LanguageOption, SpeechTone } from '../types';

export const GEMINI_VOICES: VoicePersona[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'female',
    tagline: 'Warm, Balanced & Soothing',
    description: 'Natural pacing with clear pronunciation and soothing warmth. Ideal for general narration and assistants.',
    bestFor: 'Audiobooks, Virtual Assistants, Guides',
    avatarColor: 'from-amber-500 to-rose-500'
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'male',
    tagline: 'Lively, Youthful & Engaging',
    description: 'Energetic and upbeat cadence with a friendly conversational touch. Great for podcasts and casual dialogues.',
    bestFor: 'Podcasts, Explainers, Casual Chats',
    avatarColor: 'from-blue-500 to-cyan-400'
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'male',
    tagline: 'Deep, Resonant & Authoritative',
    description: 'Commanding low-register voice with rich resonance and measured cadence. Perfect for documentaries and corporate briefings.',
    bestFor: 'Documentaries, Keynotes, Corporate',
    avatarColor: 'from-slate-700 to-indigo-900'
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'male',
    tagline: 'Crisp, Dynamic & Dramatic',
    description: 'Punchy articulation with compelling dramatic range. Exceptional for trailers, storytelling, and high-impact announcements.',
    bestFor: 'Trailers, Dramatic Stories, Gaming',
    avatarColor: 'from-orange-600 to-red-600'
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'female',
    tagline: 'Melodic, Gentle & Mindful',
    description: 'Soft, harmonious delivery with calming cadence. Excellent for wellness, meditation, and serene narratives.',
    bestFor: 'Meditation, Sleep Stories, Poetry',
    avatarColor: 'from-emerald-500 to-teal-400'
  }
];

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English (US/UK)', flag: '🇺🇸', sampleText: 'The future of communication begins with natural, expressive artificial intelligence.' },
  { code: 'hi-en', name: 'Hinglish', nativeName: 'Hinglish (Hindi + English)', flag: '🇮🇳', sampleText: 'Arre yaar, suno! With this AI voice synthesizer, ab tum kisi bhi emotion me natural speech generate kar sakte ho, absolutely seamlessly!' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', sampleText: 'आर्टिफिशियल इंटेलिजेंस की शक्ति से अपने शब्दों को सजीव और प्राकृतिक आवाज़ में बदलें।' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', sampleText: 'La tecnología avanza para unir a las personas a través del poder de la voz natural.' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', sampleText: 'Bienvenue dans un monde où les voix artificielles résonnent avec une émotion authentique.' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', sampleText: 'Entdecken Sie die nächste Generation künstlicher Intelligenz mit natürlicher Sprachsynthese.' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', sampleText: 'La bellezza della voce humana incontra la precisione della moderna intelligenza artificiale.' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', sampleText: 'Transformando palavras escritas em discursos vivos e cativantes com alta fidelidade sonora.' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', sampleText: '最先端のAI技術が創り出す、豊かで自然な音声の世界へようこそ。' },
  { code: 'zh', name: 'Chinese', nativeName: '中文 (普通话)', flag: '🇨🇳', sampleText: '借助先进的人工智能模型，轻松将文本转化为生动自然的高清语音。' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', sampleText: '고급 인공지능 모델을 통해 텍스트를 자연스럽고 생생한 음성으로 변환해 드립니다.' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', sampleText: 'مرحباً بكم في عصر جديد من التوليف الصوتي المدعوم بأحدث تقنيات الذكاء الاصطناعي.' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', sampleText: 'Ervaar de perfecte harmonie tussen geschreven tekst en natuurgetrouwe spraak.' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', sampleText: 'Искусственный интеллект открывает новые горизонты живого и выразительного звучания.' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', sampleText: 'Yapay zeka teknolojisi ile metinlerinizi doğal ve akıcı seslere dönüştürün.' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', sampleText: 'Khám phá công nghệ tổng hợp giọng nói tự nhiên với độ chân thực vượt trội.' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', sampleText: 'Odkryj niezwykle naturalną syntezę mowy napędzaną przez nowoczesne modele językowe.' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', sampleText: 'Upplev framtidens talsyntes med kristallklart och naturligt klingande röstläge.' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', sampleText: 'Ubah teks tertulis menjadi suara yang terdengar sangat alami dan ekspresif.' }
];

export const TONE_OPTIONS: { id: SpeechTone; label: string; description: string; emoji: string; isEmotion?: boolean }[] = [
  // User-requested Expressions & Feelings
  { id: 'happy', label: 'Happy', description: 'Upbeat, joyful, smiling, and optimistic radiance', emoji: '😊', isEmotion: true },
  { id: 'sad', label: 'Sad', description: 'Melancholic, sorrowful, heartbroken, and dejected cadence', emoji: '😢', isEmotion: true },
  { id: 'angry', label: 'Angry', description: 'Furious, intense, sharp, and heated vocal energy', emoji: '😠', isEmotion: true },
  { id: 'excited', label: 'Excited', description: 'Thrilled, energetic, enthusiastic, and breathless excitement', emoji: '🤩', isEmotion: true },
  { id: 'silly', label: 'Silly', description: 'Playful, goofy, chuckle-filled, and whimsical inflection', emoji: '🤪', isEmotion: true },
  { id: 'bored', label: 'Bored', description: 'Dull, flat, monotone, unenthusiastic, and sighing apathy', emoji: '🥱', isEmotion: true },
  { id: 'shy', label: 'Shy', description: 'Timid, soft, hesitant, modest, and gentle bashfulness', emoji: '😳', isEmotion: true },
  { id: 'worried', label: 'Worried', description: 'Anxious, trembling, stressed, and troubled concern', emoji: '😟', isEmotion: true },
  { id: 'disappointed', label: 'Disappointed', description: 'Crestfallen, let down, deflated, and disheartened tone', emoji: '😞', isEmotion: true },
  { id: 'frustrated', label: 'Frustrated', description: 'Exasperated, irritated, annoyed, and tense friction', emoji: '😤', isEmotion: true },
  { id: 'embarrassed', label: 'Embarrassed', description: 'Flustered, self-conscious, sheepish, and awkward delivery', emoji: '🙈', isEmotion: true },
  { id: 'surprised', label: 'Surprised', description: 'Astonished, stunned, gasped, wide-eyed amazement', emoji: '😲', isEmotion: true },

  // Core Delivery Styles
  { id: 'natural', label: 'Natural', description: 'Balanced rhythm and friendly everyday inflection', emoji: '💬', isEmotion: false },
  { id: 'storyteller', label: 'Storyteller', description: 'Rich cadence, expressive pauses, and evocative tone', emoji: '📖', isEmotion: false },
  { id: 'professional', label: 'Corporate', description: 'Crisp, articulate, authoritative broadcast delivery', emoji: '👔', isEmotion: false },
  { id: 'calm', label: 'Calm & Zen', description: 'Gentle, soothing, unhurried and relaxed breathing cadence', emoji: '🌿', isEmotion: false },
  { id: 'whisper', label: 'Whisper', description: 'Intimate, close-mic gentle whisper with quiet warmth', emoji: '🤫', isEmotion: false },
  { id: 'dramatic', label: 'Dramatic', description: 'Intense emotion, heightened suspense, and deep gravity', emoji: '🎭', isEmotion: false }
];

export const SAMPLE_SCRIPTS = [
  {
    title: 'Product Keynote Announcement',
    category: 'Keynote',
    tone: 'professional' as SpeechTone,
    voice: 'Charon' as const,
    language: 'English',
    text: 'Good morning everyone. Today, we are unveiling a breakthrough in voice synthesis that closes the gap between synthetic audio and genuine human expression. It represents five years of acoustic research, engineered to communicate with emotional depth.'
  },
  {
    title: 'Mindful Evening Wind-down',
    category: 'Meditation',
    tone: 'calm' as SpeechTone,
    voice: 'Zephyr' as const,
    language: 'English',
    text: 'Take a slow, deep breath in through your nose. Feel your chest rise and your shoulders relax as you let the air gently drift away. Release the tension of today, knowing you have done enough.'
  },
  {
    title: 'Epic Cosmos Documentary',
    category: 'Documentary',
    tone: 'dramatic' as SpeechTone,
    voice: 'Fenrir' as const,
    language: 'English',
    text: 'Billions of light years across the silent abyss of the void, ancient stars burn through unimaginable fury. Every atom in our bodies was forged in the hearts of those dying titans, echoing across eternity.'
  },
  {
    title: 'Tech Podcast Intro',
    category: 'Podcast',
    tone: 'friendly' as SpeechTone,
    voice: 'Puck' as const,
    language: 'English',
    text: 'Hey friends, welcome back to The AI Horizon! In this episode, we are diving headfirst into real-time speech models, neural codecs, and what happens when software learns how to speak like a best friend.'
  },
  {
    title: 'Bilingual Greeting (Spanish & English)',
    category: 'Multilingual',
    tone: 'natural' as SpeechTone,
    voice: 'Kore' as const,
    language: 'Spanish',
    text: 'Hola a todos. Bienvenidos a nuestra plataforma de síntesis de voz inteligente. Con soporte para más de dieciocho idiomas, la comunicación no conoce fronteras.'
  },
  {
    title: 'Hinglish Excited & Joyful Chat',
    category: 'Hinglish',
    tone: 'excited' as SpeechTone,
    voice: 'Puck' as const,
    language: 'Hinglish',
    text: 'Arre yaar, I cannot believe this! Finally hamara project live ho chuka hai and the response is absolutely mind-blowing. Chalo jaldi se team ke saath party plan karte hain, aaj celebration toh banta hai!'
  },
  {
    title: 'Hinglish Heartfelt & Emotional Story',
    category: 'Hinglish',
    tone: 'sad' as SpeechTone,
    voice: 'Kore' as const,
    language: 'Hinglish',
    text: 'Kabhi kabhi jab purani baatein yaad aati hain, toh dil thoda heavy ho jata hai. Woh college ke din, doston ke saath chai ki tapri par ghanto baatein karna... sab kitna jaldi beet gaya.'
  },
  {
    title: 'Surprised Mystery Discovery',
    category: 'Dramatic',
    tone: 'surprised' as SpeechTone,
    voice: 'Zephyr' as const,
    language: 'English',
    text: 'Wait... are you seeing what I am seeing?! Look at the seismic monitor! The signal isn’t coming from beneath the surface... it is transmitting from directly above us!'
  }
];

export const SAMPLE_DIALOGUE = [
  {
    speaker: 'Speaker A' as const,
    voice: 'Charon' as const,
    emotion: 'surprised' as SpeechTone,
    text: 'Wait a second, did you just hear that acoustic shift?! It sounded almost entirely human!'
  },
  {
    speaker: 'Speaker B' as const,
    voice: 'Kore' as const,
    emotion: 'excited' as SpeechTone,
    text: 'Yes! That is the new emotional synthesis engine. It dynamically models pitch, breath, and sentiment in real time!'
  },
  {
    speaker: 'Speaker A' as const,
    voice: 'Charon' as const,
    emotion: 'happy' as SpeechTone,
    text: 'Arre wah! Even in Hinglish and global languages, the expressive depth feels so genuine!'
  },
  {
    speaker: 'Speaker B' as const,
    voice: 'Kore' as const,
    emotion: 'playful' as const,
    text: 'Absolutely! Whether someone is feeling ecstatic, frustrated, or shy, the voice captures every nuance.'
  }
];
