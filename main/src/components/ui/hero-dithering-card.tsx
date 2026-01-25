'use client';

import { ArrowRight } from "lucide-react"
import { useState, Suspense, lazy } from "react"
import Link from "next/link"

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({ default: mod.Dithering }))
)

export function CTASection() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <section className="py-12 w-full flex justify-center items-center px-4 md:px-6 flex-1">
      <div
        className="w-full max-w-7xl relative h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden rounded-[48px] border border-[#d0d0c8] bg-[#f5f5f0] shadow-sm min-h-[600px] md:min-h-[700px] flex flex-col items-center justify-center duration-500">
          <Suspense fallback={<div className="absolute inset-0 bg-[#e8f4f8]/20" />}>
            <div className="absolute inset-0 z-0 pointer-events-none opacity-50 mix-blend-multiply">
              <Dithering
                colorBack="#00000000"
                colorFront="#7ec8e3"
                shape="warp"
                type="4x4"
                speed={isHovered ? 0.6 : 0.2}
                className="size-full"
                minPixelRatio={1}
              />
            </div>
          </Suspense>

          <div className="relative z-10 px-6 max-w-4xl mx-auto text-center flex flex-col items-center">

            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#1D1E15]/10 bg-white px-4 py-1.5 text-sm font-medium text-[#1D1E15] backdrop-blur-sm shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1D1E15] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1D1E15]"></span>
              </span>
              AI-Powered Marine Intelligence
            </div>

            <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight text-[#1D1E15] mb-8 leading-[1.05] italic">
              Vessel Tracking, <br />
              <span className="text-[#1D1E15]/80">made easy.</span>
            </h2>

            <p className="text-[#4b4f52] text-lg md:text-xl max-w-2xl mb-12 leading-relaxed font-mono">
              Some subtitle here.
            </p>

            <Link
              href="/dashboard"
              className="group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full bg-[#1D1E15] px-12 text-base font-medium text-white transition-all duration-300 hover:bg-[#1D1E15]/90 hover:scale-105 active:scale-95 hover:ring-4 hover:ring-[#1D1E15]/20"
            >
              <span className="relative z-10">View Demo</span>
              <ArrowRight className="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
