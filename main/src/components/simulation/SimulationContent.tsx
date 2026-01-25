'use client';

import { useState, useEffect, useCallback } from 'react';
import SimulationGlobe from './SimulationGlobe';
import CommandDashboard from './CommandDashboard';
import PlaybackControls from './PlaybackControls';
import { SIMULATION_TIMELINE, SIMULATION_DURATION } from '@/lib/simulation-data';

interface SimulationContentProps {
  assetId: string;
}

export default function SimulationContent({ assetId }: SimulationContentProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [currentEventIndex, setCurrentEventIndex] = useState(-1);

  const progress = Math.min(elapsedTime / SIMULATION_DURATION, 1);

  // Update current event based on elapsed time
  useEffect(() => {
    const newEventIndex = SIMULATION_TIMELINE.findIndex(
      (event, idx) =>
        event.time <= elapsedTime &&
        (idx === SIMULATION_TIMELINE.length - 1 || SIMULATION_TIMELINE[idx + 1].time > elapsedTime)
    );
    if (newEventIndex !== currentEventIndex) {
      setCurrentEventIndex(newEventIndex);
    }
  }, [elapsedTime, currentEventIndex]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => {
        const next = prev + 0.1 * speed;
        if (next >= SIMULATION_DURATION) {
          setIsPlaying(false);
          return SIMULATION_DURATION;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  const handlePlayPause = useCallback(() => {
    if (elapsedTime >= SIMULATION_DURATION) {
      // Restart if at end
      setElapsedTime(0);
      setCurrentEventIndex(-1);
    }
    setIsPlaying((prev) => !prev);
  }, [elapsedTime]);

  const handleRestart = useCallback(() => {
    setElapsedTime(0);
    setCurrentEventIndex(-1);
    setIsPlaying(false);
  }, []);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex">
        {/* Globe View - 70% */}
        <div className="w-[70%] relative">
          <SimulationGlobe progress={progress} isPlaying={isPlaying} />

          {/* Globe overlay info */}
          <div className="absolute top-4 left-4 text-[10px] uppercase tracking-wider text-white/50">
            Canadian Arctic Patrol Zone
          </div>
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-[#10B981] animate-pulse' : 'bg-white/30'}`} />
            <span className="text-[10px] uppercase tracking-wider text-white/50">
              {isPlaying ? 'Live' : 'Paused'}
            </span>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm p-2.5 rounded border border-white/10">
            <div className="text-[9px] uppercase tracking-wider text-white/50 mb-1.5">Trade Routes</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-[#3B82F6]" />
                <span className="text-white/70">NW East</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-[#10B981]" />
                <span className="text-white/70">NW West</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-[#8B5CF6]" />
                <span className="text-white/70">Arctic Bridge</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-[#F59E0B]" />
                <span className="text-white/70">Beaufort</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-[#EC4899]" />
                <span className="text-white/70">Hudson</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-[#06B6D4]" />
                <span className="text-white/70">Transpolar</span>
              </div>
            </div>
            <div className="text-[9px] uppercase tracking-wider text-white/50 mb-1.5">Locations</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px]">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                <span className="text-white/70">Base</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="text-white/70">Port</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                <span className="text-white/70">Resource</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                <span className="text-white/70">Radar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard - 30% */}
        <div className="w-[30%] border-l border-white/10">
          <CommandDashboard
            assetId={assetId}
            elapsedTime={elapsedTime}
            progress={progress}
            events={SIMULATION_TIMELINE}
            currentEventIndex={currentEventIndex}
          />
        </div>
      </div>

      {/* Playback Controls */}
      <PlaybackControls
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onRestart={handleRestart}
        speed={speed}
        onSpeedChange={handleSpeedChange}
        progress={progress}
        duration={SIMULATION_DURATION}
        elapsedTime={elapsedTime}
      />
    </div>
  );
}