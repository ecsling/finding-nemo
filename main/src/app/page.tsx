'use client';

import React from 'react';
import { CTASection } from '@/components/ui/hero-dithering-card';
import MouseTrail from '@/components/MouseTrail';

export default function Home() {
  return (
    <div className="relative h-screen w-screen bg-[#E5E6DA] text-[#1D1E15] font-mono flex flex-col overflow-hidden">
      <MouseTrail />
      <CTASection />
      
      {/* Company Logos Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-[#1D1E15]/10 bg-[#E5E6DA]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between gap-8">
            {/* Gemini */}
            <div className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity">
              <svg className="h-8 w-auto" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="3" fill="currentColor" />
                <circle cx="8" cy="16" r="2" fill="currentColor" />
                <circle cx="16" cy="16" r="2" fill="currentColor" />
              </svg>
              <span className="text-sm font-medium">Gemini</span>
            </div>

            {/* Sketchfab */}
            <div className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity">
              <svg className="h-8 w-auto" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.82 8 12 11.82 4.18 8 12 4.18zM4 9.36l7 3.5v7.32l-7-3.5V9.36zm9 10.82v-7.32l7-3.5v7.32l-7 3.5z"/>
              </svg>
              <span className="text-sm font-medium">Sketchfab</span>
            </div>

            {/* OpenAI */}
            <div className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity">
              <svg className="h-8 w-auto" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
              </svg>
              <span className="text-sm font-medium">OpenAI</span>
            </div>

            {/* OpenCV */}
            <div className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity">
              <svg className="h-8 w-auto" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              <span className="text-sm font-medium">OpenCV</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
