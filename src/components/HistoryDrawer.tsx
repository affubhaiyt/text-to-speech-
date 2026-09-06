import { X, Play, Trash2, Download, Clock, MessageSquare, Volume2 } from 'lucide-react';
import { GenerationHistoryItem } from '../types';
import { formatTime, downloadWavFile } from '../utils/audioUtils';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: GenerationHistoryItem[];
  onPlayItem: (item: GenerationHistoryItem) => void;
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  history,
  onPlayItem,
  onClearHistory,
  onDeleteItem,
}: HistoryDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col text-zinc-100">
          {/* Header */}
          <div className="p-5 border-b border-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-zinc-100">Speech Library</h3>
              <span className="text-xs text-zinc-500 font-mono">({history.length})</span>
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2.5 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-16 text-zinc-500">
                <Volume2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-zinc-400" />
                <p className="text-sm font-bold text-zinc-300">No synthesized audio yet</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                  Generated speeches will be preserved here for replay and download.
                </p>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/70 hover:bg-zinc-900 hover:border-zinc-700 transition-colors space-y-2.5"
                >
                  {/* Meta Tags */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-600 text-white">
                        {item.voice}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-zinc-800 text-zinc-300">
                        {item.language}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] text-zinc-400 capitalize bg-zinc-800/50">
                        {item.tone}
                      </span>
                      {item.isDialogue && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] bg-indigo-500/20 text-indigo-300 font-bold flex items-center gap-1 border border-indigo-500/30">
                          <MessageSquare className="w-2.5 h-2.5" />
                          Dialogue
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Text preview */}
                  <p className="text-xs text-zinc-300 font-normal line-clamp-2 leading-relaxed">
                    &ldquo;{item.text}&rdquo;
                  </p>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between pt-1 text-xs border-t border-zinc-800/60">
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {item.durationEstimate
                        ? `~${formatTime(item.durationEstimate)}`
                        : `${item.wordCount} words`}
                    </span>

                    <div className="flex items-center gap-2">
                      {item.audioBase64 && (
                        <button
                          type="button"
                          onClick={() => {
                            downloadWavFile(
                              `data:audio/wav;base64,${item.audioBase64}`,
                              `speech_${item.voice}_${item.id}.wav`
                            );
                          }}
                          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Download WAV"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onPlayItem(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-bold active:scale-95 transition-all shadow-xs"
                      >
                        <Play className="w-3 h-3" />
                        <span>Replay</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
