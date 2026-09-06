import { useEffect, useRef, MouseEvent } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  progress: number; // 0 to 1
  accentColor?: string;
  onSeek?: (percentage: number) => void;
}

export function AudioVisualizer({
  isPlaying,
  progress,
  accentColor = '#6366f1',
  onSeek,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  // Pre-generate pseudo-random waveform bar heights (64 bars)
  const barsCount = 64;
  const waveformHeights = useRef<number[]>(
    Array.from({ length: barsCount }, (_, i) => {
      const x = i / barsCount;
      const envelope = Math.sin(x * Math.PI);
      const noise = (Math.sin(i * 12.3) * 0.5 + 0.5) * 0.6 + 0.4;
      return Math.max(0.15, envelope * noise);
    })
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let active = true;

    const render = () => {
      if (!active) return;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (isPlaying) {
        phaseRef.current += 0.08;
      }

      const barWidth = (width / barsCount) * 0.7;
      const gap = (width / barsCount) * 0.3;

      for (let i = 0; i < barsCount; i++) {
        const x = i * (barWidth + gap) + gap / 2;
        let baseH = waveformHeights.current[i];

        if (isPlaying) {
          const wave = Math.sin(phaseRef.current + i * 0.3) * 0.15;
          baseH = Math.max(0.1, Math.min(1.0, baseH + wave));
        }

        const barHeight = Math.max(4, baseH * (height * 0.85));
        const y = (height - barHeight) / 2;

        const barProgress = i / barsCount;
        const isPast = barProgress <= progress;

        ctx.fillStyle = isPast ? accentColor : '#27272a'; // zinc-800
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      // Render scrub line
      const scrubX = Math.min(width - 2, Math.max(0, progress * width));
      ctx.fillStyle = '#a5b4fc'; // indigo-300
      ctx.fillRect(scrubX - 1, 0, 2, height);

      if (isPlaying) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, progress, accentColor]);

  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(percentage);
  };

  return (
    <div className="w-full relative group cursor-pointer" onClick={handleCanvasClick}>
      <canvas
        ref={canvasRef}
        width={720}
        height={64}
        className="w-full h-14 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 transition-colors group-hover:border-zinc-700"
      />
      <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="text-[10px] bg-zinc-900/90 text-zinc-300 border border-zinc-700 px-2.5 py-0.5 rounded-full shadow-md font-medium">
          Click to scrub
        </span>
      </div>
    </div>
  );
}
