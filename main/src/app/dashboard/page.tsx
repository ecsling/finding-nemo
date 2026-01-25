'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { setCurrentStep } from '@/lib/mission-state';
import MouseTrail from '@/components/MouseTrail';

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({ default: mod.Dithering }))
);

// Dynamically import components
const ModelViewer = dynamic(() => import('@/components/ModelViewer'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#E5E6DA] flex items-center justify-center">
      <div className="text-[#1D1E15]/60 font-mono text-base uppercase tracking-wider">
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
  const [showVideo, setShowVideo] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCurrentStep(1);
    
    // Hide video after loading completes (3 seconds delay to let scene load)
    const hideVideoTimer = setTimeout(() => {
      setIsLoading(false);
      // Give another 2 seconds before collapsing the video
      setTimeout(() => {
        setShowVideo(false);
      }, 2000);
    }, 3000);
    
    return () => clearTimeout(hideVideoTimer);
  }, []);

  return (
    <div
      className="relative min-h-screen text-[#1D1E15] font-mono flex flex-col overflow-hidden"
      style={{ background: '#E5E6DA' }}
    >
      <MouseTrail />

      {/* Dithering Background */}
      <Suspense fallback={<div className="absolute inset-0 bg-[#E5E6DA]" />}>
        <div className="fixed inset-0 z-0 pointer-events-none opacity-30 mix-blend-multiply">
          <Dithering
            colorBack="#00000000"
            colorFront="#7ec8e3"
            shape="warp"
            type="4x4"
            speed={0.15}
            className="size-full"
            minPixelRatio={1}
          />
        </div>
      </Suspense>

      {/* Demo Banner */}
      {showBanner && (
        <div className="bg-[#DF6C42] border-b border-[#DF6C42] px-6 py-3 flex items-center justify-between z-50 relative">
          <div className="flex items-center gap-4 flex-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="shrink-0">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-white text-sm md:text-base font-medium">
              <span className="font-bold">Demo Mode:</span> This version uses preloaded models. Visit our{' '}
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white/80 transition-colors font-bold"
              >
                GitHub repository
              </a>
              {' '}for setup instructions.
            </p>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="ml-4 w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 transition-colors shrink-0 border border-white/20 rounded"
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
      <nav className="border-b border-[#1D1E15]/10 px-0 h-20 flex justify-between items-center z-50 relative bg-[#E5E6DA]/80 backdrop-blur-sm">
        <div className="flex items-center h-full flex-1">
          {/* Logo Box */}
          <Link href="/" className="w-[134px] h-full flex items-center justify-center shrink-0 border-r border-[#1D1E15]/10 hover:bg-[#1D1E15]/5 group transition-colors">
             <div className="w-10 h-10 flex items-center justify-center">
               <div className="w-6 h-6 border-2 border-[#1D1E15]/40 rounded-sm group-hover:border-[#1D1E15] transition-colors"></div>
             </div>
          </Link>

          <div className="px-6 text-base font-bold uppercase tracking-[0.15em] text-[#1D1E15]">
            Mission Console
          </div>

          {/* Integrated Mission Progress */}
          <div className="flex-1 px-8">
            <MissionProgress currentStep={1} />
          </div>
        </div>

        <div className="flex items-center gap-3 px-6">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </div>
          <div className="text-sm uppercase tracking-widest text-[#1D1E15]/70 font-medium">
            System Active
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 relative">
        <ModelViewer />
        
        {/* Cargo Ship Video Window - Positioned above model selector */}
        <AnimatePresence>
          {showVideo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ 
                opacity: 0, 
                scale: 0.8, 
                y: 40,
                transition: { duration: 0.6, ease: "easeInOut" }
              }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute bottom-[140px] left-6 z-40 w-[320px] bg-black/95 backdrop-blur-md border-2 border-cyan-400/40 rounded-lg shadow-2xl overflow-hidden"
            >
              {/* Video Header */}
              <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-b border-cyan-400/30 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">Live Feed</span>
                </div>
                <span className="text-white/60 text-[10px] font-mono">Cargo Ship Camera</span>
              </div>
              
              {/* Video Player */}
              <div className="relative bg-black">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto"
                  style={{ maxHeight: '240px' }}
                >
                  <source src="/assets/cargo_ship.mp4" type="video/mp4" />
                  <source src="/assets/cargo_ship.webm" type="video/webm" />
                  {/* Fallback message */}
                  <div className="flex items-center justify-center h-48 text-white/60 text-xs">
                    Video not found. Place cargo_ship.mp4 in /public/assets/
                  </div>
                </video>
                
                {/* Video Overlay Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                  <div className="flex items-center justify-between text-[10px] text-white/80 font-mono">
                    <span>📍 Atlantic Ocean</span>
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      LIVE
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Video Stats */}
              <div className="bg-black/60 px-4 py-2 flex items-center justify-between text-[9px] text-white/60 font-mono border-t border-cyan-400/20">
                <span>Container Incident Zone</span>
                <span>00:15:42 UTC</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mission Navigation */}
      <MissionNavigation
        currentStep={1}
        totalSteps={4}
        nextRoute="/simulation?mode=globe"
        nextLabel="Track Container"
      />
    </div>
  );
}
