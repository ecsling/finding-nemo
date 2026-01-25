'use client';

/**
 * DEMO PAGE - Shows how the mission flow animations work
 *
 * This demonstrates the guided flow system without modifying existing pages.
 * Navigate to /mission-demo to see it in action.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MissionProgress from '@/components/mission/MissionProgress';
import MissionNavigation from '@/components/mission/MissionNavigation';
import PageTransition, { ScaleTransition, SlideTransition } from '@/components/mission/PageTransition';

const DEMO_STEPS = [
  {
    id: 1,
    title: 'Incident Scene',
    description: 'Container falls off cargo ship',
    bgColor: 'from-blue-900/20 to-black',
    content: '🚢 Cargo Ship - Container Loss Event',
  },
  {
    id: 2,
    title: 'Globe Tracking',
    description: 'Watch container drift in real-time',
    bgColor: 'from-cyan-900/20 to-black',
    content: '🌍 Globe View - Real-time Drift Tracking',
  },
  {
    id: 3,
    title: 'Search Planning',
    description: 'Optimize recovery strategy',
    bgColor: 'from-purple-900/20 to-black',
    content: '🔍 Search Optimizer - Probability Analysis',
  },
  {
    id: 4,
    title: 'Dive Recovery',
    description: 'Underwater inspection mission',
    bgColor: 'from-orange-900/20 to-black',
    content: '🤿 Underwater Scene - Recovery Mission',
  },
];

export default function MissionDemoPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [animationKey, setAnimationKey] = useState(0);

  const handleNext = () => {
    if (currentStep < DEMO_STEPS.length) {
      setAnimationKey((prev) => prev + 1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setAnimationKey((prev) => prev + 1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStepClick = (step: number) => {
    setAnimationKey((prev) => prev + 1);
    setCurrentStep(step);
  };

  const currentStepData = DEMO_STEPS[currentStep - 1];

  return (
    <div className="min-h-screen bg-black text-white font-mono overflow-hidden">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-[#00d9ff]/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold uppercase tracking-wider text-[#00d9ff]">
              Mission Flow Demo
            </h1>
            <p className="text-xs text-white/60 mt-1">
              Animation Preview - Option B: Guided Navigation Flow
            </p>
          </div>
          <div className="text-xs text-white/40 uppercase">
            Animation Type: {currentStep === 4 ? 'Scale' : currentStep === 3 ? 'Slide' : 'Page'} Transition
          </div>
        </div>
      </div>

      {/* Mission Progress Bar */}
      <div className="fixed top-20 left-0 right-0 z-40 bg-black/50 backdrop-blur-sm py-4">
        <MissionProgress currentStep={currentStep} onStepClick={handleStepClick} />
      </div>

      {/* Main Content */}
      <div className="pt-40 pb-32 min-h-screen flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={animationKey}
            className={`w-full max-w-4xl mx-auto px-6`}
          >
            {/* Different transition type based on step */}
            {currentStep === 1 && (
              <PageTransition>
                <StepContent data={currentStepData} />
              </PageTransition>
            )}

            {currentStep === 2 && (
              <PageTransition>
                <StepContent data={currentStepData} />
              </PageTransition>
            )}

            {currentStep === 3 && (
              <SlideTransition>
                <StepContent data={currentStepData} />
              </SlideTransition>
            )}

            {currentStep === 4 && (
              <ScaleTransition>
                <StepContent data={currentStepData} />
              </ScaleTransition>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <MissionNavigation
        currentStep={currentStep}
        totalSteps={DEMO_STEPS.length}
        previousRoute={currentStep > 1 ? '#' : undefined}
        nextRoute={currentStep < DEMO_STEPS.length ? '#' : undefined}
        nextLabel={currentStep === 3 ? 'Launch Dive' : 'Next Step'}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />

      {/* Animation Explanation */}
      <div className="fixed bottom-32 right-6 bg-black/80 backdrop-blur-md border border-[#00d9ff]/30 p-4 max-w-xs">
        <div className="text-xs text-white/60 space-y-2">
          <div className="text-[#00d9ff] font-bold uppercase mb-3">How It Works:</div>
          <div><span className="text-white">Step 1-2:</span> Fade + Slide animation</div>
          <div><span className="text-white">Step 3:</span> Slide-in from right (panel effect)</div>
          <div><span className="text-white">Step 4:</span> Scale zoom (diving effect)</div>
          <div className="pt-2 border-t border-white/10 mt-3">
            <span className="text-[#00d9ff]">✓</span> Click progress circles to jump
          </div>
          <div>
            <span className="text-[#00d9ff]">✓</span> Smooth easing curves
          </div>
          <div>
            <span className="text-[#00d9ff]">✓</span> State persistence ready
          </div>
        </div>
      </div>
    </div>
  );
}

// Step content component
function StepContent({ data }: { data: typeof DEMO_STEPS[0] }) {
  return (
    <motion.div
      className={`bg-gradient-to-b ${data.bgColor} border-2 border-[#00d9ff]/30 p-12 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden`}
      style={{ boxShadow: '0 0 40px rgba(0, 217, 255, 0.2)' }}
    >
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 217, 255, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 217, 255, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
          animate={{
            backgroundPosition: ['0px 0px', '50px 50px'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      <div className="relative z-10 text-center space-y-6">
        <motion.div
          className="text-8xl mb-8"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
            delay: 0.2,
          }}
        >
          {data.content.split(' ')[0]}
        </motion.div>

        <motion.h2
          className="text-4xl font-bold text-[#00d9ff] uppercase"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {data.title}
        </motion.h2>

        <motion.p
          className="text-xl text-white/70 max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {data.description}
        </motion.p>

        <motion.div
          className="text-6xl font-mono text-white/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {data.content.substring(data.content.indexOf(' '))}
        </motion.div>
      </div>

      {/* Corner Decorations */}
      <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#00d9ff]/50" />
      <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-[#00d9ff]/50" />
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-[#00d9ff]/50" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#00d9ff]/50" />
    </motion.div>
  );
}
