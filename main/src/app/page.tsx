'use client';

import React from 'react';
import { CTASection } from '@/components/ui/hero-dithering-card';
import MouseTrail from '@/components/MouseTrail';

export default function Home() {
  return (
    <div className="relative h-screen w-screen bg-[#E5E6DA] text-[#1D1E15] font-mono flex flex-col overflow-hidden">
      <MouseTrail />
      <CTASection />
    </div>
  );
}
