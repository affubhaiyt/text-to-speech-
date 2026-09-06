/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Volume2,
  Wand2,
  AlertCircle,
  Loader2,
  Eraser,
  MessageSquare,
  User,
  Zap,
  Eye,
  PenTool,
} from 'lucide-react';
import {
  VoiceName,
  SpeechTone,
  SynthesisEngine,
  DialogueLine,
  GenerationHistoryItem,
} from './types';
import { Header } from './components/Header';
import { VoiceSelector } from './components/VoiceSelector';
import { LanguageToneBar } from './components/LanguageToneBar';
import { AudioPlayer } from './components/AudioPlayer';
import { DialogueEditor } from './components/DialogueEditor';
import { TextPreviewPane } from './components/TextPreviewPane';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ScriptTemplatesModal } from './components/ScriptTemplatesModal';
import { SUPPORTED_LANGUAGES } from './data/constants';
import { createAudioBlobUrl, speakWithBrowserWebSpeech, formatTime } from './utils/audioUtils';

const DEFAULT_SAMPLE_TEXT =
  'Welcome to the next generation of voice synthesis. Using advanced artificial intelligence, this speech synthesizer transforms text into natural, expressive human-like audio across dozens of global languages in real time.';

const MAX_CHARACTERS = 10000;
const MAX_WORDS = 10000;
const MAX_DURATION_SEC = 900; // 15 minutes

export default function App() {
  // Engine & API state
  const [engine, setEngine] = useState<SynthesisEngine>('gemini-ai');
  const [hasApiKey, setHasApiKey] = useState(true);

  // Synthesis configuration
  const [mode, setMode] = useState<'single' | 'dialogue'>('single');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedTone, setSelectedTone] = useState<SpeechTone>('natural');
  const [inputText, setInputText] = useState(DEFAULT_SAMPLE_TEXT);

  // Dialogue configuration
  const [speakerAVoice, setSpeakerAVoice] = useState<VoiceName>('Charon');
  const [speakerBVoice, setSpeakerBVoice] = useState<VoiceName>('Kore');
  const [dialogueLines, setDialogueLines] = useState<DialogueLine[]>([
    {
      id: 'd1',
      speaker: 'Speaker A',
      voice: 'Charon',
      text: 'Good morning! Have you tested the new neural text-to-speech engine yet?',
    },
    {
      id: 'd2',
      speaker: 'Speaker B',
      voice: 'Kore',
      text: 'Yes, it accurately captures emotional inflections, breath pauses, and natural sentence pacing.',
    },
  ]);

  // Player & Output state
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  const [activeAudioSnippet, setActiveAudioSnippet] = useState('');
  const [activeVoiceName, setActiveVoiceName] = useState<string>('Kore');
  const [activeLanguage, setActiveLanguage] = useState<string>('English');
  const [activeTone, setActiveTone] = useState<string>('natural');
  const [activeDuration, setActiveDuration] = useState<number | undefined>(undefined);

  // Loading & Processing states
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isEnhancingScript, setIsEnhancingScript] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPreviewSpeaking, setIsPreviewSpeaking] = useState(false);
  const [scriptViewTab, setScriptViewTab] = useState<'edit' | 'preview'>('edit');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & Drawers
  const [historyOpen, setHistoryOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);

  // Local speech synthesis cancel ref
  const browserSpeechCancelRef = useRef<(() => void) | null>(null);

  // Check health on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.hasApiKey === 'boolean') {
          setHasApiKey(data.hasApiKey);
        }
      })
      .catch(() => {
        // Backend dev startup
      });

    // Load history from localStorage
    try {
      const saved = localStorage.getItem('ai_tts_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load history from localStorage', e);
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = useCallback((item: GenerationHistoryItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev.slice(0, 29)];
      try {
        localStorage.setItem('ai_tts_history', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage quota limit reached, skipping storage', e);
      }
      return updated;
    });
  }, []);

  // Metrics & Capacity Limits
  const charCount = inputText.length;
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).filter(Boolean).length : 0;
  const estimatedReadingTimeSec = Math.max(1, Math.round(wordCount / 2.5));
  const isOverCharLimit = charCount > MAX_CHARACTERS;
  const isOverWordLimit = wordCount > MAX_WORDS;
  const isOverDurationLimit = estimatedReadingTimeSec > MAX_DURATION_SEC;
  const isOverLimit = isOverCharLimit || isOverWordLimit || isOverDurationLimit;
  const charCapacityPct = Math.min(100, Math.round((charCount / MAX_CHARACTERS) * 100));

  // Dialogue Metrics
  const dialogueCharCount = dialogueLines.reduce((acc, l) => acc + (l.text || '').length, 0);
  const dialogueWordCount = dialogueLines.reduce(
    (acc, l) => acc + (l.text ? l.text.trim().split(/\s+/).filter(Boolean).length : 0),
    0
  );
  const dialogueEstimatedSec = Math.max(1, Math.round(dialogueWordCount / 2.5));
  const isDialogueOverCharLimit = dialogueCharCount > MAX_CHARACTERS;
  const isDialogueOverWordLimit = dialogueWordCount > MAX_WORDS;
  const isDialogueOverDurationLimit = dialogueEstimatedSec > MAX_DURATION_SEC;
  const isDialogueOverLimit = isDialogueOverCharLimit || isDialogueOverWordLimit || isDialogueOverDurationLimit;

  // Synthesize Action
  const handleSynthesize = async () => {
    setErrorMessage(null);

    // If dialogue mode
    if (mode === 'dialogue') {
      const validLines = dialogueLines.filter((l) => l.text.trim().length > 0);
      if (validLines.length === 0) {
        setErrorMessage('Please enter at least one line of dialogue script.');
        return;
      }

      if (isDialogueOverLimit) {
        if (isDialogueOverCharLimit) {
          setErrorMessage(`Dialogue script exceeds the maximum limit of ${MAX_CHARACTERS.toLocaleString()} characters.`);
          return;
        }
        if (isDialogueOverWordLimit) {
          setErrorMessage(`Dialogue script exceeds the maximum limit of ${MAX_WORDS.toLocaleString()} words.`);
          return;
        }
        if (isDialogueOverDurationLimit) {
          setErrorMessage(`Estimated dialogue duration exceeds the maximum limit of 15 minutes (${formatTime(MAX_DURATION_SEC)}).`);
          return;
        }
      }

      setIsSynthesizing(true);

      // Local browser fallback for dialogue
      if (engine === 'browser-speech') {
        const fullScript = validLines
          .map((l) => `${l.speaker === 'Speaker A' ? 'Speaker 1' : 'Speaker 2'}: ${l.text}`)
          .join('. ');

        const langMatch = SUPPORTED_LANGUAGES.find((item) => item.name.toLowerCase() === selectedLanguage.toLowerCase());

        try {
          if (browserSpeechCancelRef.current) browserSpeechCancelRef.current();
          browserSpeechCancelRef.current = speakWithBrowserWebSpeech(fullScript, {
            langCode: langMatch?.code,
            tone: selectedTone,
            onStart: () => setIsSynthesizing(false),
            onEnd: () => setIsSynthesizing(false),
            onError: (err) => {
              setIsSynthesizing(false);
              setErrorMessage('Browser speech synthesis error.');
              console.error(err);
            },
          }).cancel;
          return;
        } catch (err: unknown) {
          setIsSynthesizing(false);
          setErrorMessage((err as Error).message || 'Browser speech failed');
          return;
        }
      }

      // Advanced AI Gemini mode
      try {
        const res = await fetch('/api/tts/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'dialogue',
            language: selectedLanguage,
            dialogue: validLines.map((l) => ({
              speaker: l.speaker === 'Speaker A' ? 'Alex' : 'Jordan',
              voice: l.speaker === 'Speaker A' ? speakerAVoice : speakerBVoice,
              emotion: l.emotion || 'natural',
              text: l.text,
            })),
          }),
        });

        const data = await res.json();
        if (!data.success || !data.audioBase64) {
          throw new Error(data.error || 'Failed to synthesize multi-speaker dialogue');
        }

        const blobUrl = createAudioBlobUrl(data.audioBase64);
        setActiveAudioUrl(blobUrl);
        setActiveAudioSnippet(validLines[0].text);
        setActiveVoiceName(`${speakerAVoice} & ${speakerBVoice}`);
        setActiveLanguage(selectedLanguage);
        setActiveTone('dialogue');
        setActiveDuration(data.durationEstimate);

        saveToHistory({
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          text: validLines.map((l) => l.text).join(' | '),
          voice: `${speakerAVoice} + ${speakerBVoice}`,
          language: selectedLanguage,
          tone: 'dialogue',
          engine: 'gemini-ai',
          audioBase64: data.audioBase64,
          durationEstimate: data.durationEstimate,
          wordCount: validLines.reduce((acc, l) => acc + l.text.split(/\s+/).length, 0),
          isDialogue: true,
        });
      } catch (err: unknown) {
        const errObj = err as Error;
        setErrorMessage(errObj.message || 'Speech generation encountered an error.');
      } finally {
        setIsSynthesizing(false);
      }
      return;
    }

    // Single Speaker Mode
    if (!inputText.trim()) {
      setErrorMessage('Please enter some text to synthesize.');
      return;
    }

    if (isOverLimit) {
      if (isOverCharLimit) {
        setErrorMessage(`Script exceeds the maximum limit of ${MAX_CHARACTERS.toLocaleString()} characters.`);
        return;
      }
      if (isOverWordLimit) {
        setErrorMessage(`Script exceeds the maximum limit of ${MAX_WORDS.toLocaleString()} words.`);
        return;
      }
      if (isOverDurationLimit) {
        setErrorMessage(`Estimated duration exceeds the maximum limit of 15 minutes (${formatTime(MAX_DURATION_SEC)}).`);
        return;
      }
    }

    setIsSynthesizing(true);

    // Browser local engine
    if (engine === 'browser-speech') {
      try {
        const langMatch = SUPPORTED_LANGUAGES.find((item) => item.name.toLowerCase() === selectedLanguage.toLowerCase());
        if (browserSpeechCancelRef.current) browserSpeechCancelRef.current();
        browserSpeechCancelRef.current = speakWithBrowserWebSpeech(inputText, {
          langCode: langMatch?.code,
          tone: selectedTone,
          onStart: () => setIsSynthesizing(false),
          onEnd: () => setIsSynthesizing(false),
          onError: (err) => {
            setIsSynthesizing(false);
            setErrorMessage('Browser speech error.');
            console.error(err);
          },
        }).cancel;

        saveToHistory({
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          text: inputText,
          voice: 'Device System Voice',
          language: selectedLanguage,
          tone: selectedTone,
          engine: 'browser-speech',
          wordCount,
          durationEstimate: estimatedReadingTimeSec,
        });
      } catch (err: unknown) {
        setIsSynthesizing(false);
        setErrorMessage((err as Error).message || 'Browser speech failed');
      }
      return;
    }

    // Advanced AI Gemini engine
    try {
      const res = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          voice: selectedVoice,
          language: selectedLanguage,
          tone: selectedTone,
          mode: 'single',
        }),
      });

      const data = await res.json();
      if (!data.success || !data.audioBase64) {
        throw new Error(data.error || 'Failed to synthesize speech');
      }

      const blobUrl = createAudioBlobUrl(data.audioBase64);
      setActiveAudioUrl(blobUrl);
      setActiveAudioSnippet(inputText.trim());
      setActiveVoiceName(selectedVoice);
      setActiveLanguage(selectedLanguage);
      setActiveTone(selectedTone);
      setActiveDuration(data.durationEstimate || estimatedReadingTimeSec);

      saveToHistory({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        text: inputText.trim(),
        voice: selectedVoice,
        language: selectedLanguage,
        tone: selectedTone,
        engine: 'gemini-ai',
        audioBase64: data.audioBase64,
        durationEstimate: data.durationEstimate || estimatedReadingTimeSec,
        wordCount,
      });
    } catch (err: unknown) {
      const errObj = err as Error;
      setErrorMessage(errObj.message || 'Speech generation failed. Please try again.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Quick Voice Preview Test
  const handlePreviewVoice = async (voice: VoiceName) => {
    setSelectedVoice(voice);
    setErrorMessage(null);
    setIsSynthesizing(true);
    try {
      const res = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Hello! I am ${voice}. This is my natural voice profile.`,
          voice,
          language: selectedLanguage,
          tone: selectedTone,
        }),
      });
      const data = await res.json();
      if (data.success && data.audioBase64) {
        const blobUrl = createAudioBlobUrl(data.audioBase64);
        setActiveAudioUrl(blobUrl);
        setActiveAudioSnippet(`Hello! I am ${voice}.`);
        setActiveVoiceName(voice);
        setActiveLanguage(selectedLanguage);
        setActiveTone(selectedTone);
        setActiveDuration(data.durationEstimate);
      }
    } catch (e) {
      console.error('Preview voice error', e);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Enhance script with AI assistant
  const handleEnhanceScript = async () => {
    if (!inputText.trim()) return;
    setIsEnhancingScript(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/tts/enhance-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          targetTone: selectedTone,
          language: selectedLanguage,
        }),
      });
      const data = await res.json();
      if (data.success && data.enhancedText) {
        setInputText(data.enhancedText);
      } else {
        throw new Error(data.error || 'Failed to enhance script');
      }
    } catch (err: unknown) {
      const errObj = err as Error;
      setErrorMessage(errObj.message || 'Could not enhance script');
    } finally {
      setIsEnhancingScript(false);
    }
  };

  // Translate script to selected language
  const handleTranslateScript = async () => {
    if (!inputText.trim()) return;
    setIsTranslating(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/tts/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          targetLanguage: selectedLanguage,
        }),
      });
      const data = await res.json();
      if (data.success && data.translatedText) {
        setInputText(data.translatedText);
      } else {
        throw new Error(data.error || 'Translation failed');
      }
    } catch (err: unknown) {
      const errObj = err as Error;
      setErrorMessage(errObj.message || 'Could not translate script');
    } finally {
      setIsTranslating(false);
    }
  };

  // Quick Audition / Listen for preview snippets
  const handleQuickPreviewSpeech = (snippet: string) => {
    if (!snippet.trim()) return;
    setIsPreviewSpeaking(true);
    try {
      const langMatch = SUPPORTED_LANGUAGES.find((item) => item.name.toLowerCase() === selectedLanguage.toLowerCase());
      if (browserSpeechCancelRef.current) browserSpeechCancelRef.current();
      browserSpeechCancelRef.current = speakWithBrowserWebSpeech(snippet, {
        langCode: langMatch?.code,
        tone: selectedTone,
        onStart: () => setIsPreviewSpeaking(true),
        onEnd: () => setIsPreviewSpeaking(false),
        onError: () => setIsPreviewSpeaking(false),
      }).cancel;
    } catch (e) {
      console.warn('Quick preview speech error', e);
      setIsPreviewSpeaking(false);
    }
  };

  // Handle replaying item from History
  const handlePlayHistoryItem = (item: GenerationHistoryItem) => {
    if (item.audioBase64) {
      const blobUrl = createAudioBlobUrl(item.audioBase64);
      setActiveAudioUrl(blobUrl);
      setActiveAudioSnippet(item.text);
      setActiveVoiceName(item.voice);
      setActiveLanguage(item.language);
      setActiveTone(item.tone);
      setActiveDuration(item.durationEstimate);
      setHistoryOpen(false);
    } else {
      // Re-synthesize using current engine
      setInputText(item.text);
      setHistoryOpen(false);
    }
  };

  // Clear or Delete from history
  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('ai_tts_history');
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const next = prev.filter((item) => item.id !== id);
      localStorage.setItem('ai_tts_history', JSON.stringify(next));
      return next;
    });
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter to synthesize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSynthesize();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white p-3 sm:p-5 lg:p-6">
      {/* Top Application Header */}
      <Header
        engine={engine}
        onEngineChange={setEngine}
        hasApiKey={hasApiKey}
        historyCount={history.length}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenTemplates={() => setTemplatesOpen(true)}
      />

      {/* Main Studio Bento Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto py-4 space-y-4">
        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-start gap-3 shadow-md animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-rose-300">
              <strong className="font-bold block mb-0.5">Synthesis Alert</strong>
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs text-rose-400 hover:text-rose-200 font-bold ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Bento Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Card 1: Main Text / Script Input (8 cols) */}
          <section className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xs space-y-4">
            <div>
              {/* Mode switch row + Text Preview Tab */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2.5">
                <div className="flex items-center gap-1 bg-zinc-800/80 p-1 rounded-2xl border border-zinc-700/50">
                  <button
                    type="button"
                    id="mode-single-btn"
                    onClick={() => setMode('single')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      mode === 'single'
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Single Narrator</span>
                  </button>
                  <button
                    type="button"
                    id="mode-dialogue-btn"
                    onClick={() => setMode('dialogue')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      mode === 'dialogue'
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>Multi-Speaker Dialogue</span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                      2 Voices
                    </span>
                  </button>
                </div>

                {/* Edit vs Text Preview Switcher */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center bg-zinc-800/90 p-1 rounded-xl border border-zinc-700/60">
                    <button
                      type="button"
                      id="tab-edit-script-btn"
                      onClick={() => setScriptViewTab('edit')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        scriptViewTab === 'edit'
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      id="tab-preview-script-btn"
                      onClick={() => setScriptViewTab('preview')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        scriptViewTab === 'preview'
                          ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/25'
                          : 'text-zinc-400 hover:text-indigo-300'
                      }`}
                      title="Preview formatted text, sentence pacing, and audio breakdown"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Text</span>
                    </button>
                  </div>

                  {/* Quick helper capacity badge */}
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800/40 px-3 py-1 rounded-xl border border-zinc-700/40 font-mono text-[11px]">
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    <span>10k Chars • 15 Mins</span>
                  </div>
                </div>
              </div>

              {/* Script Input or Text Preview Body */}
              {scriptViewTab === 'preview' ? (
                <div className="pt-3">
                  <TextPreviewPane
                    mode={mode}
                    text={inputText}
                    dialogueLines={dialogueLines}
                    speakerAVoice={speakerAVoice}
                    speakerBVoice={speakerBVoice}
                    voiceName={selectedVoice}
                    language={selectedLanguage}
                    tone={selectedTone}
                    onSpeakText={handleQuickPreviewSpeech}
                    isSpeakingPreview={isPreviewSpeaking}
                  />
                </div>
              ) : mode === 'single' ? (
                <div className="space-y-3 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
                        Script Content
                      </label>
                      <button
                        type="button"
                        onClick={() => setScriptViewTab('preview')}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
                        title="Open full text preview"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Preview</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleEnhanceScript}
                        disabled={isEnhancingScript || !inputText.trim()}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 disabled:opacity-40 transition-colors cursor-pointer"
                        title="Optimizes pauses, commas, and phonetics for natural speech"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>{isEnhancingScript ? 'Polishing...' : 'Polish for Speech'}</span>
                      </button>
                      <span className="text-zinc-700">|</span>
                      <button
                        type="button"
                        onClick={() => setInputText('')}
                        className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      >
                        <Eraser className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      id="speech-script-textarea"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Enter text to synthesize into speech (up to 10,000 characters / 10,000 words / 15 minutes)..."
                      rows={6}
                      className={`w-full rounded-2xl border bg-zinc-950/70 p-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-all resize-y leading-relaxed font-normal ${
                        isOverLimit
                          ? 'border-rose-500/80 focus:border-rose-500'
                          : 'border-zinc-800 focus:border-indigo-500'
                      }`}
                    />
                  </div>

                  {/* Capacity & Progress Statistics */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={isOverCharLimit ? 'text-rose-400 font-bold' : ''}>
                          {charCount.toLocaleString()} / {MAX_CHARACTERS.toLocaleString()} chars
                        </span>
                        <span className="text-zinc-700">•</span>
                        <span className={isOverWordLimit ? 'text-rose-400 font-bold' : ''}>
                          {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()} words
                        </span>
                        <span className="text-zinc-700">•</span>
                        <span className={isOverDurationLimit ? 'text-rose-400 font-bold' : ''}>
                          Est. ~{formatTime(estimatedReadingTimeSec)} / 15:00 max
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Capacity</span>
                        <span
                          className={`text-[10px] font-bold ${
                            charCapacityPct > 85
                              ? charCapacityPct > 100
                                ? 'text-rose-400'
                                : 'text-amber-400'
                              : 'text-zinc-400'
                          }`}
                        >
                          {charCapacityPct}%
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          charCapacityPct > 100
                            ? 'bg-rose-500'
                            : charCapacityPct > 85
                            ? 'bg-amber-400'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, charCapacityPct)}%` }}
                      />
                    </div>

                    {isOverLimit && (
                      <p className="text-xs text-rose-400 font-medium pt-0.5">
                        Text exceeds the 10,000 character / 10,000 word / 15-minute maximum limit. Please trim slightly before generating.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="pt-3">
                  <DialogueEditor
                    dialogueLines={dialogueLines}
                    onChangeDialogue={setDialogueLines}
                    speakerAVoice={speakerAVoice}
                    speakerBVoice={speakerBVoice}
                    onChangeSpeakerAVoice={setSpeakerAVoice}
                    onChangeSpeakerBVoice={setSpeakerBVoice}
                  />
                </div>
              )}
            </div>

            {/* Primary Action Button Bar */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800">
              <div className="text-xs text-zinc-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  Engine: <strong className="text-zinc-200">{engine === 'gemini-ai' ? 'Gemini 3.1 Flash TTS' : 'Web Speech API'}</strong>
                </span>
              </div>

              <button
                id="generate-speech-btn"
                type="button"
                onClick={handleSynthesize}
                disabled={isSynthesizing || (mode === 'single' ? isOverLimit : isDialogueOverLimit)}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSynthesizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>
                      {wordCount > 150 || (mode === 'dialogue' && dialogueWordCount > 100)
                        ? 'Synthesizing Long Audio...'
                        : 'Synthesizing Voice...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    <span>Generate Speech</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Right Column (4 cols) - Voice & Language */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Card 2: Voice Persona Selector */}
            {mode === 'single' && (
              <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col justify-between shadow-xs">
                <VoiceSelector
                  selectedVoice={selectedVoice}
                  onSelectVoice={setSelectedVoice}
                  onPreviewVoice={handlePreviewVoice}
                  isPreviewing={isSynthesizing}
                />
              </section>
            )}

            {/* Card 3: Language & Delivery Tone Selector */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col justify-between shadow-xs">
              <LanguageToneBar
                selectedLanguage={selectedLanguage}
                onSelectLanguage={(langName, sampleText) => {
                  setSelectedLanguage(langName);
                  if (sampleText && inputText === DEFAULT_SAMPLE_TEXT) {
                    setInputText(sampleText);
                  }
                }}
                selectedTone={selectedTone}
                onSelectTone={setSelectedTone}
                onTranslateClick={mode === 'single' ? handleTranslateScript : undefined}
                isTranslating={isTranslating}
              />
            </section>
          </div>
        </div>

        {/* Row 2: Audio Player & Real-time Visualizer Card (Full or 12-cols) */}
        <section aria-label="Audio Playback Console">
          <AudioPlayer
            audioUrl={activeAudioUrl}
            textSnippet={activeAudioSnippet}
            voiceName={activeVoiceName}
            language={activeLanguage}
            tone={activeTone}
            durationEstimate={activeDuration}
          />
        </section>

        {/* Row 3: Feature Highlights Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
              <Volume2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-zinc-100">5 Distinct Voice Personas</h4>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Kore, Puck, Charon, Fenrir, and Zephyr model organic human resonance across varied vocal registers and expressive ranges.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-zinc-100">18+ Global Languages</h4>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Full multilingual phonetic support including Spanish, French, Japanese, German, Hindi, Arabic, Mandarin, and more.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-zinc-100">Dual-Speaker Dialogue</h4>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Synthesize natural multi-party dialogues and podcasts with synchronized conversational turn-taking and speaker voices.
            </p>
          </div>
        </section>

        {/* Bento Footer */}
        <footer className="flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 border-t border-zinc-900 pt-4 pb-2 gap-2 font-mono">
          <div>
            <span>Gemini Neural Voice Engine</span>
            <span className="mx-2">•</span>
            <span>24kHz Studio RIFF WAV</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setTemplatesOpen(true)}
              className="text-zinc-400 hover:text-indigo-400 transition-colors"
            >
              Curated Scripts
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="text-zinc-400 hover:text-indigo-400 transition-colors"
            >
              Library ({history.length})
            </button>
          </div>
        </footer>
      </main>

      {/* History Library Drawer */}
      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onPlayItem={handlePlayHistoryItem}
        onClearHistory={handleClearHistory}
        onDeleteItem={handleDeleteHistoryItem}
      />

      {/* Sample Scripts Modal */}
      <ScriptTemplatesModal
        isOpen={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onSelectScript={(script) => {
          setMode('single');
          setInputText(script.text);
          setSelectedVoice(script.voice);
          setSelectedLanguage(script.language);
          setSelectedTone(script.tone);
        }}
      />
    </div>
  );
}
