'use client';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onRestart: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  progress: number;
  duration: number;
  elapsedTime: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function PlaybackControls({
  isPlaying,
  onPlayPause,
  onRestart,
  speed,
  onSpeedChange,
  progress,
  duration,
  elapsedTime,
}: PlaybackControlsProps) {
  return (
    <div className="h-14 bg-[#0a0a0a] border-t border-white/10 flex items-center px-4 gap-4">
      {/* Restart */}
      <button
        onClick={onRestart}
        className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
        title="Restart"
        aria-label="Restart simulation"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12" />
          <path d="M3 3v5h5" />
        </svg>
      </button>

      {/* Play/Pause */}
      <button
        onClick={onPlayPause}
        className="w-10 h-10 flex items-center justify-center bg-[#3B82F6] text-white rounded hover:bg-[#2563EB] transition-colors"
        title={isPlaying ? 'Pause' : 'Play'}
        aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
      >
        {isPlaying ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>

      {/* Speed */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider opacity-50">Speed</span>
        <select
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="bg-white/10 border border-white/20 text-white text-xs px-2 py-1 rounded cursor-pointer"
          aria-label="Playback speed"
        >
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
          <option value={8}>8x</option>
        </select>
      </div>

      {/* Progress Bar */}
      <div className="flex-1 flex items-center gap-3">
        <div className="flex-1 h-1 bg-white/10 rounded overflow-hidden">
          <div
            className="h-full bg-[#3B82F6] transition-all duration-100"
            style={{ width: `${progress * 100}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <span className="text-xs font-mono text-white/70 w-24 text-right">
          {formatTime(elapsedTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}