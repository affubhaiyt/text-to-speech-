import { Sparkles, Radio, History, BookmarkCheck, Volume2, ShieldCheck } from 'lucide-react';
import { SynthesisEngine } from '../types';

interface HeaderProps {
  engine: SynthesisEngine;
  onEngineChange: (engine: SynthesisEngine) => void;
  hasApiKey: boolean;
  historyCount: number;
  onOpenHistory: () => void;
  onOpenTemplates: () => void;
}

export function Header({
  engine,
  onEngineChange,
  hasApiKey,
  historyCount,
  onOpenHistory,
  onOpenTemplates,
}: HeaderProps) {
  return (
    <header className="border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20">
            <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-zinc-100 tracking-tight">
                AI Speech <span className="text-indigo-400">Synthesizer</span>
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Gemini 3.1 Flash TTS
              </span>
            </div>
            <p className="text-xs text-zinc-500 hidden md:block">
              Neural acoustic voice synthesis with natural human cadence
            </p>
          </div>
        </div>

        {/* Action Controls & Engine Switch */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Engine Selector */}
          <div className="bg-zinc-900 border border-zinc-800 p-1 rounded-xl flex items-center text-xs">
            <button
              id="engine-gemini-btn"
              type="button"
              onClick={() => onEngineChange('gemini-ai')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                engine === 'gemini-ai'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Advanced AI Neural Model with emotional inflection"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Advanced AI</span>
            </button>
            <button
              id="engine-browser-btn"
              type="button"
              onClick={() => onEngineChange('browser-speech')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                engine === 'browser-speech'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Instant local synthesis using device voices"
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Instant</span> Local
            </button>
          </div>

          {/* Templates Trigger */}
          <button
            id="open-templates-btn"
            type="button"
            onClick={onOpenTemplates}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:text-white active:scale-95 transition-all"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Presets</span>
          </button>

          {/* History Trigger */}
          <button
            id="open-history-btn"
            type="button"
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:text-white active:scale-95 transition-all"
          >
            <History className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Library</span>
            {historyCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-indigo-600 text-white text-[10px] rounded-full font-bold">
                {historyCount}
              </span>
            )}
          </button>

          {/* API Status indicator */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-400"
            title={hasApiKey ? 'Gemini API key active' : 'API Key checked'}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-semibold text-zinc-300">Ready</span>
          </div>
        </div>
      </div>
    </header>
  );
}
