'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MissionNavigationProps {
  currentStep: number;
  totalSteps: number;
  previousRoute?: string;
  nextRoute?: string;
  nextLabel?: string;
  onNext?: () => void;
  onPrevious?: () => void;
}

export default function MissionNavigation({
  currentStep,
  totalSteps,
  previousRoute,
  nextRoute,
  nextLabel = 'Next Step',
  onNext,
  onPrevious,
}: MissionNavigationProps) {
  const router = useRouter();

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else if (nextRoute) {
      router.push(nextRoute);
    }
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    } else if (previousRoute) {
      router.push(previousRoute);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
      {/* Home Button */}
      <Link
        href="/"
        className="p-3 bg-black/80 backdrop-blur-md border border-[#1e3a5f] text-white/60 hover:text-[#00d9ff] hover:border-[#00d9ff]/50 transition-all"
      >
        <Home size={20} />
      </Link>

      {/* Navigation Container */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex items-center gap-3 bg-black/90 backdrop-blur-md border border-[#00d9ff]/30 px-6 py-4"
        style={{ boxShadow: '0 0 30px rgba(0, 217, 255, 0.2)' }}
      >
        {/* Previous Button */}
        {currentStep > 1 && previousRoute && (
          <motion.button
            onClick={handlePrevious}
            className="flex items-center gap-2 px-4 py-2 border border-[#1e3a5f] text-white/80 hover:border-[#00d9ff] hover:text-[#00d9ff] transition-all text-sm font-mono uppercase"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={16} />
            Previous
          </motion.button>
        )}

        {/* Step Indicator */}
        <div className="px-4 py-2 bg-[#00d9ff]/10 border border-[#00d9ff]/30">
          <div className="text-xs text-white/60 font-mono uppercase tracking-wider">
            Step <span className="text-[#00d9ff] font-bold">{currentStep}</span> / {totalSteps}
          </div>
        </div>

        {/* Next Button */}
        {currentStep < totalSteps && nextRoute && (
          <motion.button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2 bg-[#00d9ff] text-black hover:bg-[#00d9ff]/80 transition-all text-sm font-mono uppercase font-bold"
            style={{ boxShadow: '0 0 20px rgba(0, 217, 255, 0.4)' }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0, 217, 255, 0.6)' }}
            whileTap={{ scale: 0.95 }}
          >
            {nextLabel}
            <ArrowRight size={16} />
          </motion.button>
        )}

        {/* Mission Complete */}
        {currentStep === totalSteps && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-6 py-2 bg-green-500/20 border border-green-500 text-green-400"
          >
            <span className="text-sm font-mono uppercase font-bold">✓ Mission Complete</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
