import { useState } from 'react';
import { Plus, Trash2, Users, ArrowUpDown } from 'lucide-react';
import { DialogueLine, VoiceName, SpeechTone } from '../types';
import { GEMINI_VOICES, SAMPLE_DIALOGUE } from '../data/constants';
import { formatTime } from '../utils/audioUtils';

interface DialogueEditorProps {
  dialogueLines: DialogueLine[];
  onChangeDialogue: (lines: DialogueLine[]) => void;
  speakerAVoice: VoiceName;
  speakerBVoice: VoiceName;
  onChangeSpeakerAVoice: (v: VoiceName) => void;
  onChangeSpeakerBVoice: (v: VoiceName) => void;
}

export function DialogueEditor({
  dialogueLines,
  onChangeDialogue,
  speakerAVoice,
  speakerBVoice,
  onChangeSpeakerAVoice,
  onChangeSpeakerBVoice,
}: DialogueEditorProps) {
  const [speakerAName, setSpeakerAName] = useState('Alex');
  const [speakerBName, setSpeakerBName] = useState('Jordan');

  const totalChars = dialogueLines.reduce((acc, l) => acc + (l.text || '').length, 0);
  const totalWords = dialogueLines.reduce(
    (acc, l) => acc + (l.text ? l.text.trim().split(/\s+/).filter(Boolean).length : 0),
    0
  );
  const estDurationSec = Math.max(1, Math.round(totalWords / 2.5));
  const charPct = Math.min(100, Math.round((totalChars / 10000) * 100));

  const addLine = (speaker: 'Speaker A' | 'Speaker B') => {
    const voice = speaker === 'Speaker A' ? speakerAVoice : speakerBVoice;
    const newLine: DialogueLine = {
      id: Math.random().toString(36).substring(2, 9),
      speaker,
      voice,
      text: '',
      emotion: 'natural',
    };
    onChangeDialogue([...dialogueLines, newLine]);
  };

  const updateLineText = (id: string, text: string) => {
    onChangeDialogue(
      dialogueLines.map((line) => (line.id === id ? { ...line, text } : line))
    );
  };

  const updateLineEmotion = (id: string, emotion: SpeechTone) => {
    onChangeDialogue(
      dialogueLines.map((line) => (line.id === id ? { ...line, emotion } : line))
    );
  };

  const removeLine = (id: string) => {
    if (dialogueLines.length <= 1) return;
    onChangeDialogue(dialogueLines.filter((line) => line.id !== id));
  };

  const loadSampleDialogue = () => {
    const lines: DialogueLine[] = SAMPLE_DIALOGUE.map((item, idx) => ({
      id: `sample-${idx}`,
      speaker: item.speaker,
      voice: item.voice,
      emotion: (item as unknown as { emotion?: SpeechTone }).emotion || 'natural',
      text: item.text,
    }));
    onChangeDialogue(lines);
  };

  return (
    <div className="space-y-4">
      {/* Speaker Configuration bar */}
      <div className="bg-zinc-800/50 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
              Dialogue Participants
            </h4>
          </div>
          <button
            type="button"
            onClick={loadSampleDialogue}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer transition-colors"
          >
            Load Sample Dialogue
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Speaker A */}
          <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                A
              </span>
              <input
                type="text"
                value={speakerAName}
                onChange={(e) => setSpeakerAName(e.target.value)}
                className="text-xs font-bold text-zinc-100 border-none outline-none w-24 bg-transparent"
                placeholder="Speaker A"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-zinc-500 text-[11px]">Voice:</span>
              <select
                value={speakerAVoice}
                onChange={(e) => onChangeSpeakerAVoice(e.target.value as VoiceName)}
                className="text-xs font-semibold bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-2.5 py-1 outline-none"
              >
                {GEMINI_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.gender})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Speaker B */}
          <div className="p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                B
              </span>
              <input
                type="text"
                value={speakerBName}
                onChange={(e) => setSpeakerBName(e.target.value)}
                className="text-xs font-bold text-zinc-100 border-none outline-none w-24 bg-transparent"
                placeholder="Speaker B"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-zinc-500 text-[11px]">Voice:</span>
              <select
                value={speakerBVoice}
                onChange={(e) => onChangeSpeakerBVoice(e.target.value as VoiceName)}
                className="text-xs font-semibold bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-2.5 py-1 outline-none"
              >
                {GEMINI_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.gender})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Script lines */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {dialogueLines.map((line) => {
          const isA = line.speaker === 'Speaker A';
          const speakerDisplayName = isA ? speakerAName : speakerBName;
          const assignedVoice = isA ? speakerAVoice : speakerBVoice;

          return (
            <div
              key={line.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                isA
                  ? 'bg-indigo-500/5 border-indigo-500/20'
                  : 'bg-purple-500/5 border-purple-500/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
                      isA
                        ? 'bg-indigo-600 text-white'
                        : 'bg-purple-600 text-white'
                    }`}
                  >
                    {speakerDisplayName}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Voice: <strong className="text-zinc-200">{assignedVoice}</strong>
                  </span>
                  <div className="flex items-center gap-1.5 ml-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Feeling:</span>
                    <select
                      value={line.emotion || 'natural'}
                      onChange={(e) => updateLineEmotion(line.id, e.target.value as SpeechTone)}
                      className="text-[11px] font-semibold bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-2 py-0.5 outline-none hover:border-zinc-500 transition-colors cursor-pointer"
                    >
                      <option value="natural">💬 Natural</option>
                      <optgroup label="Expressions & Feelings">
                        <option value="happy">😊 Happy</option>
                        <option value="sad">😢 Sad</option>
                        <option value="angry">😠 Angry</option>
                        <option value="excited">🤩 Excited</option>
                        <option value="silly">🤪 Silly</option>
                        <option value="bored">🥱 Bored</option>
                        <option value="shy">😳 Shy</option>
                        <option value="worried">😟 Worried</option>
                        <option value="disappointed">😞 Disappointed</option>
                        <option value="frustrated">😤 Frustrated</option>
                        <option value="embarrassed">🙈 Embarrassed</option>
                        <option value="surprised">😲 Surprised</option>
                      </optgroup>
                      <optgroup label="Styles">
                        <option value="storyteller">📖 Storyteller</option>
                        <option value="professional">👔 Corporate</option>
                        <option value="calm">🌿 Calm</option>
                        <option value="whisper">🤫 Whisper</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const newSpeaker = isA ? 'Speaker B' : 'Speaker A';
                      const newVoice = isA ? speakerBVoice : speakerAVoice;
                      onChangeDialogue(
                        dialogueLines.map((l) =>
                          l.id === line.id
                            ? { ...l, speaker: newSpeaker, voice: newVoice }
                            : l
                        )
                      );
                    }}
                    className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Toggle speaker"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                  {dialogueLines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Remove line"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={line.text}
                onChange={(e) => updateLineText(line.id, e.target.value)}
                placeholder={`What does ${speakerDisplayName} say?`}
                rows={2}
                className="w-full text-xs text-zinc-200 bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5 outline-none focus:border-indigo-500 resize-none font-normal"
              />
            </div>
          );
        })}
      </div>

      {/* Add turn buttons */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => addLine('Speaker A')}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add {speakerAName} Line</span>
        </button>
        <button
          type="button"
          onClick={() => addLine('Speaker B')}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add {speakerBName} Line</span>
        </button>
      </div>

      {/* Dialogue Capacity & Reading Time Meter */}
      <div className="pt-2 space-y-1.5 border-t border-zinc-800/80">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className={totalChars > 10000 ? 'text-rose-400 font-bold' : ''}>
              {totalChars.toLocaleString()} / 10,000 chars
            </span>
            <span className="text-zinc-700">•</span>
            <span className={totalWords > 10000 ? 'text-rose-400 font-bold' : ''}>
              {totalWords.toLocaleString()} / 10,000 words
            </span>
            <span className="text-zinc-700">•</span>
            <span className={estDurationSec > 900 ? 'text-rose-400 font-bold' : ''}>
              Est. ~{formatTime(estDurationSec)} / 15:00 max
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Capacity</span>
            <span
              className={`text-[10px] font-bold ${
                charPct > 85 ? (charPct > 100 ? 'text-rose-400' : 'text-amber-400') : 'text-zinc-400'
              }`}
            >
              {charPct}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              charPct > 100
                ? 'bg-rose-500'
                : charPct > 85
                ? 'bg-amber-400'
                : 'bg-purple-500'
            }`}
            style={{ width: `${Math.min(100, charPct)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
