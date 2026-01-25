'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const stories = [
  {
    id: 'MAEU-789012-4',
    status: 'completed',
    time: '4.2hrs',
    savings: '$850K',
    location: 'Atlantic Ocean',
    date: 'Jan 18, 2026'
  },
  {
    id: 'HLCU-456789-1',
    status: 'completed',
    time: '3.8hrs',
    savings: '$1.2M',
    location: 'Pacific Ocean',
    date: 'Jan 20, 2026'
  },
  {
    id: 'TCLU-123456-9',
    status: 'in-progress',
    time: 'ETA 2.5hrs',
    savings: 'Est. $920K',
    location: 'North Atlantic',
    date: 'Today'
  }
];

export default function SuccessStories() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % stories.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const current = stories[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="fixed bottom-24 left-6 z-40 w-80 bg-black/90 backdrop-blur-md border-2 border-green-500/40 rounded-lg shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 border-b border-green-500/30 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-xs font-mono font-bold uppercase tracking-wider">
            Recent Recoveries
          </span>
        </div>
        <span className="text-white/60 text-[10px] font-mono">
          {currentIndex + 1}/{stories.length}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-3">
              {current.status === 'completed' ? (
                <span className="px-2 py-1 bg-green-500/20 border border-green-500/40 rounded text-green-400 text-[10px] font-mono">
                  ✓ RECOVERED
                </span>
              ) : (
                <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded text-yellow-400 text-[10px] font-mono">
                  ⏱ IN PROGRESS
                </span>
              )}
              <span className="text-white/40 text-[10px] font-mono">{current.date}</span>
            </div>

            {/* Container ID */}
            <div className="mb-3">
              <div className="text-[9px] text-white/50 uppercase tracking-wide mb-1">
                Container ID
              </div>
              <div className="text-white font-mono font-bold text-lg">
                {current.id}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/5 border border-white/10 rounded p-2">
                <div className="text-[9px] text-white/50">RECOVERY TIME</div>
                <div className="text-white font-mono font-bold mt-1">{current.time}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded p-2">
                <div className="text-[9px] text-white/50">COST SAVINGS</div>
                <div className="text-green-400 font-mono font-bold mt-1">{current.savings}</div>
              </div>
            </div>

            {/* Location */}
            <div className="mt-3 text-[10px] text-white/60 font-mono">
              📍 {current.location}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {stories.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                idx === currentIndex ? 'bg-green-500 w-4' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
