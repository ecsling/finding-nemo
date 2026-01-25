'use client';

import { motion } from 'framer-motion';

interface MissionStep {
  id: number;
  label: string;
  route: string;
  description: string;
}

const MISSION_STEPS: MissionStep[] = [
  {
    id: 1,
    label: 'Incident',
    route: '/dashboard',
    description: 'Container loss event',
  },
  {
    id: 2,
    label: 'Tracking',
    route: '/simulation?mode=globe',
    description: 'Real-time drift monitoring',
  },
  {
    id: 3,
    label: 'Planning',
    route: '/dashboard/search-optimizer',
    description: 'Search optimization',
  },
  {
    id: 4,
    label: 'Recovery',
    route: '/simulation?mode=underwater',
    description: 'Dive mission',
  },
];

interface MissionProgressProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export default function MissionProgress({ currentStep, onStepClick }: MissionProgressProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-3 left-0 right-0 h-[2px] bg-[#1D1E15]/10">
          <motion.div
            className="h-full bg-[#1D1E15]"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep - 1) / (MISSION_STEPS.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>

        {/* Step Circles */}
        {MISSION_STEPS.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const isClickable = onStepClick && (isCompleted || isActive);

          return (
            <button
              key={step.id}
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={`relative z-10 flex flex-col items-center gap-2 ${
                isClickable ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* Circle */}
              <motion.div
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-mono text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'border-[#1D1E15] bg-[#1D1E15] text-[#E5E6DA]'
                    : isCompleted
                    ? 'border-[#1D1E15] bg-[#E5E6DA] text-[#1D1E15]'
                    : 'border-[#1D1E15]/20 bg-[#E5E6DA] text-[#1D1E15]/30'
                }`}
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
                whileHover={isClickable ? { scale: 1.15 } : {}}
              >
                {isCompleted ? '✓' : step.id}
              </motion.div>

              {/* Compact Label */}
              <div className="flex flex-col items-center">
                <div
                  className={`text-[10px] font-mono uppercase tracking-[0.15em] whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-[#1D1E15] font-semibold'
                      : isCompleted
                      ? 'text-[#1D1E15]/70'
                      : 'text-[#1D1E15]/30'
                  }`}
                >
                  {step.label}
                </div>
              </div>

              {/* Active Pulse */}
              {isActive && (
                <motion.div
                  className="absolute w-7 h-7 rounded-full border-2 border-[#1D1E15]/40 top-0"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { MISSION_STEPS };
export type { MissionStep };
