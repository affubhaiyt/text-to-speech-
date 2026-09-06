import { useState, useMemo } from 'react';
import {
  Eye,
  Volume2,
  Copy,
  Check,
  Play,
  Pause,
  Sparkles,
  Layers,
  MessageSquare,
  Clock,
  FileText,
  AlignLeft,
} from 'lucide-react';
import { DialogueLine, SpeechTone, VoiceName } from '../types';
import { TONE_OPTIONS, SUPPORTED_LANGUAGES } from '../data/constants';
import { formatTime } from '../utils/audioUtils';

interface TextPreviewPaneProps {
  mode: 'single' | 'dialogue';
  text: string;
  dialogueLines: DialogueLine[];
  speakerAVoice?: VoiceName;
  speakerBVoice?: VoiceName;
  voiceName: string;
  language: string;
  tone: SpeechTone;
  onSpeakText?: (sampleText: string) => void;
  isSpeakingPreview?: boolean;
}

export function TextPreviewPane({
  mode,
  text,
  dialogueLines,
  speakerAVoice = 'Charon',
  speakerBVoice = 'Kore',
  voiceName,
  language,
  tone,
  onSpeakText,
  isSpeakingPreview = false,
}: TextPreviewPaneProps) {
  const [copied, setCopied] = useState(false);
  const [previewStyle, setPreviewStyle] = useState<'formatted' | 'teleprompter' | 'sentences'>('formatted');
  const [activeSpeakingLine, setActiveSpeakingLine] = useState<string | null>(null);

  const currentTone = TONE_OPTIONS.find((t) => t.id === tone) || TONE_OPTIONS[0];
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.name.toLowerCase() === language.toLowerCase()) || SUPPORTED_LANGUAGES[0];

  // Parse paragraphs and sentences for single speaker mode
  const paragraphs = useMemo(() => {
    if (!text.trim()) return [];
    return text.split(/\n\s*\n/).map((para) => para.trim()).filter(Boolean);
  }, [text]);

  const sentences = useMemo(() => {
    if (!text.trim()) return [];
    // Split on sentence-ending punctuation followed by space or newline
    const matches = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g);
    if (!matches) return [text.trim()];
    return matches.map((s) => s.trim()).filter(Boolean);
  }, [text]);

  const wordCount = useMemo(() => {
    if (mode === 'single') {
      return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    }
    return dialogueLines.reduce(
      (acc, l) => acc + (l.text ? l.text.trim().split(/\s+/).filter(Boolean).length : 0),
      0
    );
  }, [mode, text, dialogueLines]);

  const charCount = useMemo(() => {
    if (mode === 'single') return text.length;
    return dialogueLines.reduce((acc, l) => acc + (l.text || '').length, 0);
  }, [mode, text, dialogueLines]);

  const estimatedSec = Math.max(1, Math.round(wordCount / 2.5));

  const handleCopy = () => {
    const contentToCopy =
      mode === 'single'
        ? text
        : dialogueLines.map((l) => `${l.speaker} (${l.voice}): ${l.text}`).join('\n\n');
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeakLine = (snippet: string) => {
    if (!onSpeakText) return;
    setActiveSpeakingLine(snippet);
    onSpeakText(snippet);
    setTimeout(() => {
      setActiveSpeakingLine(null);
    }, Math.max(2000, snippet.length * 70));
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-5 space-y-4">
      {/* Top Preview Control & Metadata Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>Script Preview</span>
          </div>

          <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 flex items-center gap-1.5">
            <span>{currentLang.flag}</span>
            <span>{currentLang.name}</span>
          </span>

          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1.5 ${
              currentTone.isEmotion
                ? 'bg-pink-950/50 text-pink-300 border border-pink-700/40'
                : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            <span>{currentTone.emoji}</span>
            <span className="capitalize">{currentTone.label}</span>
          </span>

          {mode === 'single' ? (
            <span className="text-xs text-zinc-400 font-medium px-2 py-0.5 bg-zinc-900 rounded-lg border border-zinc-800">
              Voice: <strong className="text-zinc-200">{voiceName}</strong>
            </span>
          ) : (
            <span className="text-xs text-zinc-400 font-medium px-2 py-0.5 bg-zinc-900 rounded-lg border border-zinc-800">
              Dialogue: <strong className="text-indigo-300">{speakerAVoice}</strong> &amp;{' '}
              <strong className="text-purple-300">{speakerBVoice}</strong>
            </span>
          )}
        </div>

        {/* View Layout Switcher & Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {mode === 'single' && (
            <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setPreviewStyle('formatted')}
                className={`px-2.5 py-1 rounded-lg transition-all font-semibold ${
                  previewStyle === 'formatted'
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Paragraphs View"
              >
                <AlignLeft className="w-3 h-3 inline mr-1" />
                <span>Text</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewStyle('sentences')}
                className={`px-2.5 py-1 rounded-lg transition-all font-semibold ${
                  previewStyle === 'sentences'
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Breakdown by Sentences with Pacing"
              >
                <Layers className="w-3 h-3 inline mr-1" />
                <span>Sentences</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewStyle('teleprompter')}
                className={`px-2.5 py-1 rounded-lg transition-all font-semibold ${
                  previewStyle === 'teleprompter'
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Large Teleprompter Reading Mode"
              >
                <FileText className="w-3 h-3 inline mr-1" />
                <span>Teleprompter</span>
              </button>
            </div>
          )}

          {onSpeakText && (
            <button
              type="button"
              onClick={() => onSpeakText(mode === 'single' ? text : dialogueLines.map((l) => l.text).join('. '))}
              disabled={isSpeakingPreview || (!text.trim() && dialogueLines.length === 0)}
              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40"
              title="Quickly test-listen to this preview"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isSpeakingPreview ? 'Listening...' : 'Test Listen'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Copy Text to Clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Preview Content Area */}
      {mode === 'single' ? (
        <div className="space-y-4">
          {!text.trim() ? (
            <div className="text-center py-10 text-zinc-500 text-xs italic">
              No script text provided yet. Type or paste your text above to see a live preview.
            </div>
          ) : previewStyle === 'formatted' ? (
            <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
              {paragraphs.map((p, idx) => (
                <div
                  key={idx}
                  className="group relative p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700 transition-colors"
                >
                  <p className="text-sm text-zinc-200 leading-relaxed font-normal select-text">
                    {p}
                  </p>
                  <div className="mt-2 pt-2 border-t border-zinc-800/40 flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-zinc-600" />
                      <span>~{Math.max(1, Math.round(p.split(/\s+/).length / 2.5))}s spoken</span>
                    </span>
                    {onSpeakText && (
                      <button
                        type="button"
                        onClick={() => handleSpeakLine(p)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        <Play className="w-3 h-3" />
                        <span>Audition Paragraph</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : previewStyle === 'sentences' ? (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {sentences.map((sentence, idx) => {
                const sWords = sentence.trim().split(/\s+/).filter(Boolean).length;
                const sTime = Math.max(1, Math.round(sWords / 2.5));
                const isCurrentlySpeaking = activeSpeakingLine === sentence;

                return (
                  <div
                    key={idx}
                    className={`flex items-start justify-between gap-3 p-3 rounded-xl border transition-all ${
                      isCurrentlySpeaking
                        ? 'bg-indigo-950/40 border-indigo-600 shadow-md'
                        : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-zinc-200 leading-relaxed font-normal select-text">
                        {sentence}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                        ~{sTime}s
                      </span>
                      {onSpeakText && (
                        <button
                          type="button"
                          onClick={() => handleSpeakLine(sentence)}
                          className="p-1 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-zinc-800 transition-colors"
                          title="Preview sentence"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Teleprompter Mode: High contrast, larger readable typography */
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 max-h-96 overflow-y-auto space-y-4 shadow-inner">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-[11px] text-zinc-400">
                <span className="uppercase tracking-widest font-bold text-indigo-400">Teleprompter Preview</span>
                <span>Paced at ~150 words per minute</span>
              </div>
              <p className="text-base sm:text-lg text-zinc-100 leading-loose font-normal font-sans select-text">
                {text}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Dialogue Multi-Speaker Theatrical Preview */
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {dialogueLines.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-xs italic">
              No dialogue lines added. Enter lines in the dialogue editor to preview the conversation.
            </div>
          ) : (
            dialogueLines.map((line, idx) => {
              const isA = line.speaker === 'Speaker A';
              const assignedVoice = isA ? speakerAVoice : speakerBVoice;
              const lineEmotion = line.emotion || tone || 'natural';
              const emoObj = TONE_OPTIONS.find((t) => t.id === lineEmotion);

              return (
                <div
                  key={line.id || idx}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
                    isA
                      ? 'bg-indigo-950/20 border-indigo-500/20 ml-0 mr-4 sm:mr-10'
                      : 'bg-purple-950/20 border-purple-500/20 mr-0 ml-4 sm:ml-10'
                  }`}
                >
                  {/* Speaker Avatar Badge */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                      isA ? 'bg-indigo-600 text-white' : 'bg-purple-600 text-white'
                    }`}
                  >
                    {isA ? 'A' : 'B'}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-zinc-200 font-bold">
                          {line.speaker}
                        </strong>
                        <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md">
                          Voice: {assignedVoice}
                        </span>
                        {emoObj && emoObj.id !== 'natural' && (
                          <span className="text-[10px] font-semibold text-pink-300 bg-pink-950/50 border border-pink-700/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span>{emoObj.emoji}</span>
                            <span>{emoObj.label}</span>
                          </span>
                        )}
                      </div>

                      {onSpeakText && line.text.trim() && (
                        <button
                          type="button"
                          onClick={() => handleSpeakLine(line.text)}
                          className="text-[11px] text-zinc-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          <span>Audition</span>
                        </button>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed select-text font-normal">
                      {line.text || <span className="italic text-zinc-600">Empty turn</span>}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Footer Metrics */}
      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 font-mono flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span>{charCount.toLocaleString()} characters</span>
          <span className="text-zinc-700">•</span>
          <span>{wordCount.toLocaleString()} words</span>
          <span className="text-zinc-700">•</span>
          <span>Est. ~{formatTime(estimatedSec)} narration</span>
        </div>
        <div className="text-zinc-500 text-[10px]">
          Target Emotion: <strong className="text-zinc-300 not-italic font-medium">{currentTone.emoji} {currentTone.label}</strong>
        </div>
      </div>
    </div>
  );
}
