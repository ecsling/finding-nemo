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
        background: 'linear-gradient(to bottom, #000000 0%, #0a1f35 50%, #081a2e 100%)',
        minHeight: '100vh'
      }}
    >
      {/* Animated grid background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 217, 255, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 217, 255, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridPulse 4s ease-in-out infinite'
          }}
        />
      </div>
      
      {/* Scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 217, 255, 0.1) 0px, transparent 1px, transparent 2px, rgba(0, 217, 255, 0.1) 3px)',
            animation: 'scanlines 8s linear infinite'
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-2xl px-8 space-y-12">
        {/* Depth Descent Animation */}
        <div className="flex flex-col items-center space-y-6">
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Outer pulse ring */}
            <motion.div
              className="absolute inset-0 border-2 border-[#00d9ff] rounded-full"
              style={{
                boxShadow: '0 0 30px rgba(0, 217, 255, 0.6), inset 0 0 30px rgba(0, 217, 255, 0.2)'
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.6, 0.3, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Middle pulse ring */}
            <motion.div
              className="absolute inset-0 border-2 border-[#00d9ff] rounded-full"
              style={{
                boxShadow: '0 0 20px rgba(0, 217, 255, 0.5)'
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.8, 0.5, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3
              }}
            />

            {/* Depth indicator */}
            <div className="relative z-10 text-center">
              <div className="text-6xl font-bold text-[#00d9ff] mb-2" style={{ 
                textShadow: '0 0 20px rgba(0, 217, 255, 0.8), 0 0 40px rgba(0, 217, 255, 0.4)',
                fontFamily: 'var(--font-mono)'
              }}>
                {currentDepth}m
              </div>
              <div className="text-lg text-white/70 uppercase tracking-[0.2em] font-semibold" style={{ 
                textShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
              }}>
                DEPTH
              </div>
              <div className="mt-4 text-sm text-[#00d9ff]/60 uppercase tracking-wider">
                0m → {KELVIN_SEAMOUNTS_DEPTH}m
              </div>
            </div>
          </div>
        </div>

        {/* Mission Status Text */}
        <div className="h-16 relative overflow-hidden text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessage}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-x-0 text-white text-2xl uppercase tracking-[0.15em] font-bold"
              style={{ 
                textShadow: '0 0 20px rgba(0, 217, 255, 0.6), 0 0 40px rgba(0, 217, 255, 0.3)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {MESSAGES[currentMessage]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Bar Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-lg text-white/80 uppercase tracking-[0.15em] font-semibold" style={{ 
              textShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
            }}>
              DIVE SYSTEM INITIALIZING
            </span>
            <span 
              className="text-5xl font-bold text-[#00d9ff]" 
              style={{ 
                textShadow: '0 0 20px rgba(0, 217, 255, 0.8), 0 0 40px rgba(0, 217, 255, 0.4)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {Math.min(100, Math.floor(progress))}%
            </span>
          </div>
          
          {/* Enhanced Progress Bar */}
          <div className="relative h-4 bg-[#0a2540] border-2 border-[#4080bf] rounded-full overflow-hidden" style={{
            boxShadow: '0 0 15px rgba(64, 128, 191, 0.3), inset 0 0 10px rgba(0, 0, 0, 0.5)'
          }}>
            <motion.div
              className="h-full bg-gradient-to-r from-[#00d9ff] to-[#0099ff]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                boxShadow: '0 0 20px rgba(0, 217, 255, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.2)'
              }}
            />
            {/* Pulse overlay */}
            <motion.div
              className="absolute inset-0 bg-[#00d9ff]"
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                width: `${progress}%`,
                mixBlendMode: 'screen'
              }}
            />
          </div>
        </div>
        
        {/* Version Tag */}
        <div className="text-center pt-6">
          <div 
            className="inline-block px-6 py-2 border-2 border-[#4080bf] text-[#00d9ff] text-sm uppercase tracking-[0.15em] font-semibold"
            style={{ 
              backgroundColor: 'rgba(10, 37, 64, 0.5)',
              boxShadow: '0 0 15px rgba(0, 217, 255, 0.3)',
              textShadow: '0 0 10px rgba(0, 217, 255, 0.6)'
            }}
          >
            RECOVERY ENGINE v2.0.4
          </div>
        </div>
      </div>

      {/* Cyberpunk animations */}
      <style jsx global>{`
        @keyframes gridPulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        
        @keyframes scanlines {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
      `}</style>
    </div>
  );
}

