'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Page Transition Wrapper
 *
 * Animation Flow:
 * 1. Exit: Current page fades out and slides down
 * 2. Enter: New page slides up and fades in
 *
 * This creates a smooth "flowing" effect between mission steps
 */
export default function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.5,
        ease: [0.43, 0.13, 0.23, 0.96], // Custom easing for smooth feel
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Slide Transition (for modal-like pages)
 * Slides in from the right like a panel
 */
export function SlideTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{
        duration: 0.4,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Fade Transition (subtle)
 * Just fades in/out
 */
export function FadeTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.3,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scale Transition (zoom effect)
 * Scales up from center - good for "dive" effect
 */
export function ScaleTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{
        duration: 0.5,
        ease: 'easeOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
