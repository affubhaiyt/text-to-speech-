import { X, BookmarkCheck, ArrowRight } from 'lucide-react';
import { SAMPLE_SCRIPTS } from '../data/constants';
import { SpeechTone, VoiceName } from '../types';

interface ScriptTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScript: (script: {
    text: string;
    voice: VoiceName;
    language: string;
    tone: SpeechTone;
  }) => void;
}

export function ScriptTemplatesModal({
  isOpen,
  onClose,
  onSelectScript,
}: ScriptTemplatesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 overflow-hidden text-zinc-100">
          {/* Header */}
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <BookmarkCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100">
                  Curated Speech Presets
                </h3>
                <p className="text-xs text-zinc-500">
                  Ready-to-synthesize scripts demonstrating pacing, emotional tones, and vocal registers.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
            {SAMPLE_SCRIPTS.map((script, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onSelectScript({
                    text: script.text,
                    voice: script.voice,
                    language: script.language,
                    tone: script.tone,
                  });
                  onClose();
                }}
                className="group p-4 rounded-2xl border border-zinc-800/80 bg-zinc-800/30 hover:bg-zinc-800/80 hover:border-zinc-700 cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-200">
                      {script.title}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                      {script.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="font-semibold text-indigo-400">Voice: {script.voice}</span>
                    <span>•</span>
                    <span className="capitalize">{script.tone}</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                  &ldquo;{script.text}&rdquo;
                </p>

                <div className="flex items-center justify-end text-xs font-bold text-indigo-400 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all">
                  <span>Load Preset</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
