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

  const isStep1 = currentStep === 1;

  return (
    <div
      className={`fixed bottom-6 z-50 flex items-center gap-4 ${
        isStep1 ? 'right-6 left-auto' : 'left-1/2 -translate-x-1/2 right-auto'
      }`}
    >
      {/* Navigation Container */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex items-center gap-3 bg-[#E5E6DA] backdrop-blur-md border border-[#1D1E15]/20 px-6 py-4 rounded-full shadow-lg"
      >
        {/* Previous Button */}
        {currentStep > 1 && previousRoute && (
          <motion.button
            onClick={handlePrevious}
            className="flex items-center gap-2 px-4 py-2 border border-[#1D1E15]/20 text-[#1D1E15]/80 hover:border-[#1D1E15] hover:text-[#1D1E15] transition-all text-sm font-mono uppercase rounded-full"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={16} />
            Previous
          </motion.button>
        )}

        {/* Step Indicator */}
        <div className="px-4 py-2 bg-[#1D1E15]/5 border border-[#1D1E15]/10 rounded-full">
          <div className="text-xs text-[#1D1E15]/60 font-mono uppercase tracking-wider">
            Step <span className="text-[#1D1E15] font-bold">{currentStep}</span> / {totalSteps}
          </div>
        </div>

        {/* Next Button */}
        {currentStep < totalSteps && nextRoute && (
          <motion.button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2 bg-[#1D1E15] text-[#E5E6DA] hover:bg-[#1D1E15]/80 transition-all text-sm font-mono uppercase font-bold rounded-full"
            whileHover={{ scale: 1.05 }}
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
            className="flex items-center gap-2 px-6 py-2 bg-green-100 border border-green-500 text-green-700 rounded-full"
          >
            <span className="text-sm font-mono uppercase font-bold">Mission Complete</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
