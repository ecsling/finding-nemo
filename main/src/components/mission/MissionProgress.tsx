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
        <div className="absolute top-3 left-0 right-0 h-0.5 bg-[#1e3a5f]">
          <motion.div
            className="h-full bg-[#00d9ff]"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep - 1) / (MISSION_STEPS.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ boxShadow: '0 0 10px rgba(0, 217, 255, 0.6)' }}
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
              className={`relative z-10 flex flex-col items-center gap-1 ${
                isClickable ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* Circle */}
              <motion.div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-mono text-[10px] font-bold ${
                  isActive
                    ? 'border-[#00d9ff] bg-[#00d9ff] text-black'
                    : isCompleted
                    ? 'border-[#00d9ff] bg-black text-[#00d9ff]'
                    : 'border-[#1e3a5f] bg-black text-[#1e3a5f]'
                }`}
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  boxShadow: isActive
                    ? '0 0 15px rgba(0, 217, 255, 0.8)'
                    : isCompleted
                    ? '0 0 8px rgba(0, 217, 255, 0.4)'
                    : 'none',
                }}
                transition={{ duration: 0.3 }}
                whileHover={isClickable ? { scale: 1.15 } : {}}
              >
                {isCompleted ? '✓' : step.id}
              </motion.div>

              {/* Compact Label */}
              <div className="flex flex-col items-center">
                <div
                  className={`text-[9px] font-mono uppercase tracking-wider whitespace-nowrap ${
                    isActive
                      ? 'text-[#00d9ff] font-bold'
                      : isCompleted
                      ? 'text-white/80'
                      : 'text-white/40'
                  }`}
                >
                  {step.label}
                </div>
              </div>

              {/* Active Pulse */}
              {isActive && (
                <motion.div
                  className="absolute w-6 h-6 rounded-full border-2 border-[#00d9ff] top-0"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.6, opacity: 0 }}
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
