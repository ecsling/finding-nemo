'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type CursorMode = 'default' | 'container' | 'ship' | 'ocean';

interface CustomCursorProps {
  mode?: CursorMode;
}

export default function CustomCursor({ mode = 'default' }: CustomCursorProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', updatePosition);
    document.body.addEventListener('mouseleave', handleMouseLeave);
    document.body.addEventListener('mouseenter', handleMouseEnter);

    // Hide default cursor
    document.body.style.cursor = 'none';

    return () => {
      window.removeEventListener('mousemove', updatePosition);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
      document.body.style.cursor = 'auto';
    };
  }, []);

  const getColor = () => {
    switch (mode) {
      case 'container':
        return '#DF6C42';
      case 'ship':
        return '#00d9ff';
      case 'ocean':
        return '#1a5490';
      default:
        return '#E5E6DA';
    }
  };

  const getScale = () => {
    switch (mode) {
      case 'container':
      case 'ship':
        return 1.5;
      default:
        return 1;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
          style={{
            x: position.x,
            y: position.y,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Outer ring */}
          <motion.div
            className="absolute"
            style={{
              width: 32,
              height: 32,
              border: `2px solid ${getColor()}`,
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              scale: getScale(),
              rotate: mode === 'container' || mode === 'ship' ? 360 : 0,
            }}
            transition={{
              scale: { duration: 0.2 },
              rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
            }}
          />

          {/* Center dot */}
          <motion.div
            className="absolute"
            style={{
              width: 4,
              height: 4,
              backgroundColor: getColor(),
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 0 10px ${getColor()}`,
            }}
            animate={{
              scale: mode === 'container' || mode === 'ship' ? 2 : 1,
            }}
            transition={{ duration: 0.2 }}
          />

          {/* Crosshair lines */}
          <div
            className="absolute"
            style={{
              width: 1,
              height: 20,
              backgroundColor: getColor(),
              transform: 'translate(-50%, -50%)',
              opacity: 0.6,
            }}
          />
          <div
            className="absolute"
            style={{
              width: 20,
              height: 1,
              backgroundColor: getColor(),
              transform: 'translate(-50%, -50%)',
              opacity: 0.6,
            }}
          />

          {/* Label for interactive elements */}
          {mode !== 'default' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-10 left-0 text-xs font-mono uppercase tracking-widest whitespace-nowrap"
              style={{
                color: getColor(),
                textShadow: `0 0 10px ${getColor()}`,
              }}
            >
              {mode === 'container' && 'CONTAINER'}
              {mode === 'ship' && 'VESSEL'}
              {mode === 'ocean' && 'OCEAN'}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
