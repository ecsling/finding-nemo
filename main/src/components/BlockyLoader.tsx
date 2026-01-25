'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const MESSAGES = [
  'Preparing dive environment...',
  'Loading ocean floor topology...',
  'Initializing recovery systems...',
  'Calibrating depth sensors...',
  'Syncing mission parameters...',
  'Activating 3D visualization...',
  'Dive system ready...',
];

const KELVIN_SEAMOUNTS_DEPTH = 2850; // meters

interface BlockyLoaderProps {
  onFinished?: () => void;
}

export default function BlockyLoader({ onFinished }: BlockyLoaderProps) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % MESSAGES.length);
    }, 500);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (onFinished) {
             setTimeout(() => onFinished(), 0);
          }
          return 100;

        }
        return prev + Math.random() * 8;
      });
    }, 80);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [onFinished]);

  // Calculate current depth based on progress (0m to 2850m)
  const currentDepth = Math.floor((progress / 100) * KELVIN_SEAMOUNTS_DEPTH);

  return (
    <div 
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center font-mono"
      style={{
        background: 'linear-gradient(to bottom, #E5E6DA 0%, #D8D6C4 50%, #D0CEBC 100%)',
        minHeight: '100vh'
      }}
    >

      <div className="relative z-10 w-full max-w-md px-8 space-y-8">
        {/* Depth Descent Animation */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex items-center justify-center">
            {/* Depth indicator */}
            <div className="relative z-10 text-center">
              <div className="text-4xl font-bold mb-1" style={{ 
                color: '#1D1E15',
                textShadow: 'none',
                fontFamily: 'var(--font-mono)'
              }}>
                {currentDepth}m
              </div>
              <div className="text-sm uppercase tracking-[0.2em] font-semibold" style={{ 
                color: '#1D1E15',
                textShadow: 'none'
              }}>
                DEPTH
              </div>
              <div className="mt-2 text-xs uppercase tracking-wider" style={{ color: '#1D1E15' }}>
                0m → {KELVIN_SEAMOUNTS_DEPTH}m
              </div>
            </div>
          </div>
        </div>

        {/* Mission Status Text */}
        <div className="h-12 relative overflow-hidden text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessage}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-x-0 text-base uppercase tracking-[0.15em] font-bold"
              style={{ 
                color: '#1D1E15',
                textShadow: 'none',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {MESSAGES[currentMessage]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Bar Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm uppercase tracking-[0.15em] font-semibold" style={{ 
              color: '#1D1E15',
              textShadow: 'none'
            }}>
              DIVE SYSTEM INITIALIZING
            </span>
            <span 
              className="text-3xl font-bold" 
              style={{ 
                color: '#1D1E15',
                textShadow: 'none',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {Math.min(100, Math.floor(progress))}%
            </span>
          </div>
          
          {/* Enhanced Progress Bar */}
          <div className="relative h-3 rounded-full overflow-hidden" style={{
            backgroundColor: '#D8D6C4',
            border: '1px solid #B8B6A4',
            boxShadow: 'none'
          }}>
            <motion.div
              className="h-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                backgroundColor: '#9B8F7A',
                boxShadow: 'none'
              }}
            />
          </div>
        </div>
        
        {/* Version Tag */}
        <div className="text-center pt-4">
          <div 
            className="inline-block px-4 py-1.5 text-xs uppercase tracking-[0.15em] font-semibold rounded-lg"
            style={{ 
              backgroundColor: '#E6E3D6',
              border: '1px solid #B8B6A4',
              color: '#1D1E15',
              boxShadow: 'none',
              textShadow: 'none'
            }}
          >
            RECOVERY ENGINE v2.0.4
          </div>
        </div>
      </div>
    </div>
  );
}

