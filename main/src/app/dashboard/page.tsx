'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { setCurrentStep, getCurrentStep, startNewMission } from '@/lib/mission-state';

// Dynamically import components
const ModelViewer = dynamic(() => import('@/components/ModelViewer'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center" style={{ background: '#000000' }}>
      <div className="text-[#00d9ff]/80 font-mono text-base uppercase tracking-wider" style={{ textShadow: '0 0 10px rgba(0, 217, 255, 0.6)' }}>
        Initializing Mission Console...
      </div>
    </div>
  ),
});

const MissionProgress = dynamic(() => import('@/components/mission/MissionProgress'), { ssr: false });
const MissionNavigation = dynamic(() => import('@/components/mission/MissionNavigation'), { ssr: false });

const IS_PRODUCTION_DEMO = process.env.NEXT_PUBLIC_PRODUCTION_DEMO === "true";

export default function DashboardPage() {
  const [showBanner, setShowBanner] = useState(IS_PRODUCTION_DEMO);
  const [showIncidentAlert, setShowIncidentAlert] = useState(false);
  const [missionStep, setMissionStep] = useState(1);

  useEffect(() => {
    const step = getCurrentStep();
    setMissionStep(step);
    setCurrentStep(1); // This is always step 1

    // Show incident alert after 2 seconds
    const timer = setTimeout(() => {
      setShowIncidentAlert(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="relative min-h-screen text-white font-mono flex flex-col overflow-hidden"
      style={{
        background: '#000000',
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
      
      {/* Demo Banner */}
      {showBanner && (
        <div className="bg-[#DF6C42] border-b-2 border-[#DF6C42] px-6 py-3 flex items-center justify-between z-50 relative" style={{ boxShadow: '0 0 20px rgba(223, 108, 66, 0.4)' }}>
          <div className="flex items-center gap-4 flex-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="shrink-0">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-white text-sm md:text-base font-medium">
              <span className="font-bold">Demo Mode:</span> This version uses preloaded models. To use your own API keys and custom models, visit our{' '}
              <a 
                href="#" 
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#0a1929] transition-colors font-bold"
              >
                GitHub repository
              </a>
              {' '}for setup instructions.
            </p>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="ml-4 w-8 h-8 flex items-center justify-center text-white hover:bg-[#0a1929] transition-colors shrink-0 border border-white/20 rounded"
            aria-label="Close banner"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}
      
      {/* Header with Integrated Mission Progress */}
      <nav className="border-b border-[#1e3a5f] px-0 h-20 flex justify-between items-center z-50 relative" style={{ backgroundColor: 'transparent' }}>
        <div className="flex items-center h-full flex-1">
          {/* Logo Box */}
          <Link href="/" className="w-[134px] h-full flex items-center justify-center shrink-0 border-r border-[#1e3a5f] hover:bg-[#0d2847] group transition-colors" style={{ backgroundColor: 'transparent' }}>
             <div className="w-10 h-10 flex items-center justify-center">
               <div className="w-6 h-6 border border-[#1e3a5f] rounded-sm"></div>
             </div>
          </Link>

          <div className="px-6 text-base font-bold uppercase tracking-[0.15em] text-white" style={{ textShadow: '0 0 5px rgba(255, 255, 255, 0.3)' }}>
            Mission Console
          </div>

          {/* Integrated Mission Progress */}
          <div className="flex-1 px-8">
            <MissionProgress currentStep={1} />
          </div>
        </div>

        <div className="flex items-center gap-4 px-6">
          <div className="w-2 h-2 rounded-full bg-[#00ff00] animate-pulse" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', boxShadow: '0 0 10px rgba(0, 255, 0, 0.8)' }}></div>
          <div className="text-sm uppercase tracking-widest text-[#00d9ff] font-bold" style={{ textShadow: '0 0 10px rgba(0, 217, 255, 0.8)' }}>
            System Active
          </div>
        </div>
      </nav>

      {/* Incident Alert Animation */}
      <AnimatePresence>
        {showIncidentAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="fixed top-32 left-6 right-6 md:left-12 md:right-auto md:translate-x-0 z-50 max-w-2xl w-full mx-auto"
          >
            <div className="bg-[#DF6C42]/90 backdrop-blur-md border-2 border-[#DF6C42] p-6 relative overflow-hidden"
              style={{ boxShadow: '0 0 40px rgba(223, 108, 66, 0.6)' }}
            >
              {/* Animated corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white animate-pulse" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white animate-pulse" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white animate-pulse" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white animate-pulse" />

              <div className="flex items-start gap-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  className="text-4xl"
                >
                  ⚠️
                </motion.div>
                <div className="flex-1">
                  <div className="text-white font-bold text-lg uppercase tracking-wider mb-2">
                    Container Loss Event Detected
                  </div>
                  <div className="text-white/90 text-sm mb-4">
                    ISO Container <span className="font-mono font-bold">MAEU-123456-7</span> has been lost overboard at coordinates <span className="font-mono">37.5°N, -14.5°W</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-white/20 border border-white/40 text-white text-xs uppercase font-mono">
                      Status: Drifting
                    </div>
                    <div className="px-3 py-1 bg-white/20 border border-white/40 text-white text-xs uppercase font-mono">
                      Depth: 2,850m
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowIncidentAlert(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 relative">
        <ModelViewer />
      </div>

      {/* Mission Navigation */}
      <MissionNavigation
        currentStep={1}
        totalSteps={4}
        nextRoute="/simulation?mode=globe"
        nextLabel="Track Container"
      />

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
