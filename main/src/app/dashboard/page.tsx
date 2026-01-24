'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';

// Dynamically import ModelViewer to prevent SSR issues and multiple Three.js instances
const ModelViewer = dynamic(() => import('@/components/ModelViewer'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, #1a4a6a 0%, #0d2d47 25%, #0a1f35 50%, #081a2e 75%, #050f1a 100%)' }}>
      <div className="text-white font-mono text-base uppercase tracking-wider" style={{ textShadow: '0 0 10px rgba(0, 217, 255, 0.6)' }}>Loading Mission Console...</div>
    </div>
  ),
});

const IS_PRODUCTION_DEMO = process.env.NEXT_PUBLIC_PRODUCTION_DEMO === "true";

export default function DashboardPage() {
  const [showBanner, setShowBanner] = useState(IS_PRODUCTION_DEMO);

  return (
    <div className="min-h-screen font-mono flex flex-col overflow-hidden text-white" style={{ background: 'linear-gradient(to bottom, #1a4a6a 0%, #0d2d47 25%, #0a1f35 50%, #081a2e 75%, #050f1a 100%)' }}>
      
      {/* Demo Banner */}
      {showBanner && (
        <div className="bg-[#DF6C42] border-b-2 border-[#00d9ff] px-6 py-3 flex items-center justify-between z-50" style={{ boxShadow: '0 0 20px rgba(223, 108, 66, 0.5)' }}>
          <div className="flex items-center gap-3 flex-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="shrink-0">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-white text-sm font-semibold">
              <span className="font-bold">Demo Mode:</span> This version uses preloaded models. To use your own API keys and custom models, visit our{' '}
              <a 
                href="#" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-[#00d9ff] transition-colors font-bold"
                style={{ textShadow: '0 0 10px rgba(0, 217, 255, 0.6)' }}
              >
                GitHub repository
              </a>
              {' '}for setup instructions.
            </p>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="ml-4 w-7 h-7 flex items-center justify-center text-white hover:bg-[#00d9ff]/20 transition-colors shrink-0 rounded border border-white/20"
            aria-label="Close banner"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}
      
      {/* Header */}
      <nav className="border-b-2 border-[#00d9ff]/30 px-0 h-16 flex justify-between items-center z-50 bg-black/40 backdrop-blur-sm" style={{ boxShadow: '0 2px 20px rgba(0, 217, 255, 0.2)' }}>
        <div className="flex items-center h-full flex-1">
          {/* Logo Box */}
          <Link href="/" className="w-[56px] h-full flex items-center justify-center shrink-0 border-r-2 border-[#00d9ff]/30 hover:bg-[#00d9ff]/10 group transition-colors">
             <div className="w-8 h-8 flex items-center justify-center">
               <div className="w-5 h-5 border-2 border-[#00d9ff] rounded-sm" style={{ boxShadow: '0 0 10px rgba(0, 217, 255, 0.6)' }}></div>
             </div>
          </Link>
          
          <div className="px-6 text-base font-bold uppercase tracking-[0.15em] text-white" style={{ textShadow: '0 0 10px rgba(0, 217, 255, 0.6)' }}>
            Mission Console
          </div>
        </div>
        
        <div className="flex items-center gap-4 px-6">
          <div className="w-2 h-2 rounded-full bg-[#00ff00] animate-pulse" style={{ boxShadow: '0 0 10px rgba(0, 255, 0, 0.8)' }}></div>
          <div className="text-sm uppercase tracking-[0.2em] font-semibold text-white" style={{ textShadow: '0 0 5px rgba(0, 217, 255, 0.4)' }}>System Active</div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 relative">
        <ModelViewer />
      </div>
    </div>
  );
}
