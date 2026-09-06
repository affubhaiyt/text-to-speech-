import { VoiceName } from '../types';
import { GEMINI_VOICES } from '../data/constants';
import { Check, Sparkles, Volume2 } from 'lucide-react';

interface VoiceSelectorProps {
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  onPreviewVoice?: (voice: VoiceName) => void;
  isPreviewing?: boolean;
}

export function VoiceSelector({
  selectedVoice,
  onSelectVoice,
  onPreviewVoice,
  isPreviewing,
}: VoiceSelectorProps) {
  const currentVoiceObj = GEMINI_VOICES.find((v) => v.id === selectedVoice) || GEMINI_VOICES[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Active Voice Persona</span>
        </h2>
        <span className="text-[11px] text-zinc-500 font-medium">5 Neural Acoustic Models</span>
      </div>

      {/* Active Voice Spotlight Banner */}
      <div className="flex items-center justify-between p-3.5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-md shadow-indigo-600/30">
            {currentVoiceObj.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-100 text-sm">{currentVoiceObj.name}</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                {currentVoiceObj.gender}
              </span>
            </div>
            <div className="text-xs text-indigo-400 font-medium mt-0.5">
              {currentVoiceObj.tagline} • {currentVoiceObj.bestFor.split(',')[0]}
            </div>
          </div>
        </div>

        {onPreviewVoice && (
          <button
            type="button"
            onClick={() => onPreviewVoice(currentVoiceObj.id)}
            disabled={isPreviewing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all shadow-xs"
            title={`Preview ${currentVoiceObj.name} voice`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Test Voice</span>
          </button>
        )}
      </div>

      {/* Voice Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {GEMINI_VOICES.map((v) => {
          const isSelected = selectedVoice === v.id;
          return (
            <div
              key={v.id}
              onClick={() => onSelectVoice(v.id)}
              className={`group relative rounded-2xl border p-3 cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-500/60 bg-zinc-800 text-white shadow-sm ring-1 ring-indigo-500/30'
                  : 'border-zinc-800/80 bg-zinc-800/40 hover:bg-zinc-800/80 hover:border-zinc-700 text-zinc-300'
              }`}
            >
              {/* Header: Name + Gender */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-zinc-700 text-zinc-300'
                      }`}
                    >
                      {v.name[0]}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold tracking-tight text-zinc-100">
                        {v.name}
                      </h4>
                      <span className="text-[10px] uppercase font-mono text-zinc-500">
                        {v.gender}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                {/* Tagline */}
                <p className="text-xs font-medium leading-snug line-clamp-1 text-zinc-400 mt-1">
                  {v.tagline}
                </p>

                {/* Description */}
                <p className="text-[11px] leading-relaxed line-clamp-2 mt-1 text-zinc-500">
                  {v.description}
                </p>
              </div>

              {/* Best for & Preview CTA */}
              <div className="mt-3 pt-2 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-[10px] line-clamp-1 font-medium text-zinc-500">
                  {v.bestFor.split(',')[0]}
                </span>

                {onPreviewVoice && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewVoice(v.id);
                    }}
                    disabled={isPreviewing}
                    className="p-1 rounded-md text-[10px] flex items-center gap-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60 transition-colors"
                    title={`Hear sample of ${v.name}`}
                  >
                    <Volume2 className="w-3 h-3 text-indigo-400" />
                    <span>Test</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
