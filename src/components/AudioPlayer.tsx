import { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Check,
  FastForward,
  Rewind,
  Sparkles,
  Eye,
  EyeOff,
  FileText,
} from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';
import { formatTime, downloadWavFile } from '../utils/audioUtils';

interface AudioPlayerProps {
  audioUrl: string | null;
  textSnippet: string;
  voiceName: string;
  language: string;
  tone: string;
  durationEstimate?: number;
  onClearAudio?: () => void;
}

export function AudioPlayer({
  audioUrl,
  textSnippet,
  voiceName,
  language,
  tone,
  durationEstimate,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationEstimate || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(true);

  // When audioUrl changes, reset and autoplay
  useEffect(() => {
    if (!audioUrl) {
      setCurrentTime(0);
      setIsPlaying(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.log('Autoplay was prevented by browser interaction policy:', e);
        setIsPlaying(false);
      });
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleSeek = (percentage: number) => {
    if (!audioRef.current || duration <= 0) return;
    const target = percentage * duration;
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    const nextTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleReplay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    audioRef.current.play().then(() => setIsPlaying(true));
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    audioRef.current.muted = next;
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      if (newVol > 0 && isMuted) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const sanitizedSnippet = textSnippet.slice(0, 24).replace(/[^a-zA-Z0-9]/g, '_');
    downloadWavFile(audioUrl, `speech_${voiceName}_${sanitizedSnippet}.wav`);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(textSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!audioUrl) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 flex flex-col justify-center min-h-[160px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-indigo-500 rounded-sm rotate-45" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-200">Real-time Preview</div>
              <div className="text-xs text-zinc-500">Synthesizer Idle • Ready to generate</div>
            </div>
          </div>
          <div className="text-xs font-mono text-zinc-600">00:00 / 00:00</div>
        </div>

        {/* Ambient idle waveform placeholder */}
        <div className="flex items-end gap-[3px] h-10 overflow-hidden opacity-30">
          {[4, 8, 12, 6, 9, 11, 5, 7, 10, 3, 8, 12, 4, 10, 6, 9, 5, 11, 7, 10, 4, 8, 12, 6, 9, 11, 5, 7, 10, 3].map((h, i) => (
            <div
              key={i}
              className="bg-indigo-500 w-full rounded-full"
              style={{ height: `${(h / 12) * 100}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6 space-y-4 shadow-sm text-zinc-100">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Header Info */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs">
              {voiceName}
            </span>
            <span className="text-xs font-semibold text-zinc-300 px-2.5 py-0.5 bg-zinc-800 rounded-lg">
              {language}
            </span>
            <span className="text-xs text-zinc-400 px-2.5 py-0.5 bg-zinc-800/80 rounded-lg capitalize">
              {tone}
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-normal line-clamp-1 mt-2 italic">
            &ldquo;{textSnippet}&rdquo;
          </p>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFullPreview(!showFullPreview)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              showFullPreview
                ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
            title="Toggle full text script preview"
          >
            {showFullPreview ? <EyeOff className="w-3.5 h-3.5 text-indigo-400" /> : <Eye className="w-3.5 h-3.5 text-indigo-400" />}
            <span className="hidden sm:inline">{showFullPreview ? 'Hide Text' : 'Preview Text'}</span>
          </button>
          <button
            type="button"
            onClick={handleCopyText}
            title="Copy Text"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            title="Download Audio (.WAV)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Download .WAV</span>
          </button>
        </div>
      </div>

      {/* Visualizer & Scrubber */}
      <AudioVisualizer
        isPlaying={isPlaying}
        progress={progress}
        accentColor="#6366f1"
        onSeek={handleSeek}
      />

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-zinc-800/80">
        {/* Playback Transport */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReplay}
            title="Replay from start"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleSkip(-5)}
            title="Rewind 5s"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <Rewind className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="audio-play-toggle-btn"
            onClick={togglePlay}
            className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 active:scale-95 transition-all shadow-md shadow-indigo-600/25"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={() => handleSkip(5)}
            title="Forward 5s"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <FastForward className="w-4 h-4" />
          </button>

          {/* Time Display */}
          <span className="text-xs font-mono font-medium text-zinc-400 ml-2">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Speed & Volume settings */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Speed Pills */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl text-[11px] font-bold text-zinc-400 border border-zinc-800">
            {[0.75, 1, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => changeSpeed(rate)}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  playbackRate === rate
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'hover:text-zinc-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Volume control */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1.5 accent-indigo-500 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Synchronized Script Text Preview & Read-Along */}
      {showFullPreview && textSnippet && (
        <div className="pt-3 border-t border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-indigo-400">
              <FileText className="w-3.5 h-3.5" />
              <span>Full Spoken Text Preview</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              {textSnippet.length} chars • {textSnippet.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 max-h-48 overflow-y-auto text-xs sm:text-sm text-zinc-200 leading-relaxed font-normal select-text whitespace-pre-wrap">
            {textSnippet}
          </div>
        </div>
      )}
    </div>
  );
}
