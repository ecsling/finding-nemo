'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const CubeViewer = dynamic(() => import('@/components/CubeViewer'), { ssr: false });
const Dithering = lazy(() => 
  import("@paper-design/shaders-react").then((mod) => ({ default: mod.Dithering }))
);

export default function Home() {
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const x = Math.max(-6, Math.min(6, ((e.clientX - rect.left) / rect.width - 0.5) * 12));
        const y = Math.max(-6, Math.min(6, ((e.clientY - rect.top) / rect.height - 0.5) * 12));
        setMousePosition({ x, y });
      }
    };

    const heroElement = heroRef.current;
    if (heroElement) {
      heroElement.addEventListener('mousemove', handleMouseMove);
      return () => {
        heroElement.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, []);

  const handleLaunchDemoClick = (
    e?: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
  ) => {
    if (typeof window === 'undefined') return;
    // Only intercept navigation on smaller screens
    if (window.innerWidth < 1024) {
      e?.preventDefault();
      setShowMobileModal(true);
    }
  };

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const fadeInDown = {
    hidden: { opacity: 0, y: -40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.8 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

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

      {/* Floating geometric particles */}
      <div className="fixed inset-0 pointer-events-none z-[2]">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              width: `${4 + (i % 3) * 2}px`,
              height: `${4 + (i % 3) * 2}px`,
              left: `${(i * 37.7) % 100}%`,
              top: `${(i * 23.3) % 100}%`,
              background: i % 3 === 0 ? '#00d9ff' : 'transparent',
              border: i % 3 !== 0 ? '1px solid rgba(0, 217, 255, 0.4)' : 'none',
              boxShadow: '0 0 10px rgba(0, 217, 255, 0.5)',
              transform: `rotate(${i * 45}deg)`
            }}
            animate={{
              x: [0, 20 + (i % 5) * 10, -15, 10, 0],
              y: [0, 30 + (i % 4) * 10, 20, -10, 0],
              opacity: [0.3, 0.6, 0.4, 0.7, 0.3],
              rotate: [i * 45, i * 45 + 180, i * 45 + 360]
            }}
            transition={{
              duration: 15 + (i % 5) * 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2
            }}
          />
        ))}
      </div>

      {/* Navigation Header */}
      <nav className="relative px-0 h-16 flex justify-between items-center z-50" style={{ backgroundColor: 'transparent' }}>
        <div className="flex items-center h-full flex-1">
          {/* Logo Box - Aligned with Left Sidebar */}
          {/* Scaled down from 179px */}
          <div className="w-[134px] h-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'transparent' }}>
            <div className="w-10 h-10 flex items-center justify-center">
              <div className="w-6 h-6 border border-[#1e3a5f] rounded-sm"></div>
            </div>
          </div>
          
          {/* Nav Items - Cyberpunk style */}
          <div className="hidden md:flex h-full items-center px-6 gap-6 flex-1">
            {[
              { name: 'PROCESS', href: '#process' },
              { name: 'METRICS', href: '#metrics' },
              { name: 'DEMO', href: '#interactive-demo' },
              { name: 'FUTURE', href: '#future-extensions' }
            ].map((item, idx) => (
              <div key={item.name} className="flex items-center gap-6 group">
                <a 
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.querySelector(item.href);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="relative hover:text-[#00d9ff] transition-all cursor-pointer px-3 py-2 text-sm font-bold uppercase tracking-[0.15em] group-hover:shadow-[0_0_10px_rgba(0,217,255,0.5)]"
                  style={{ textShadow: '0 0 5px rgba(255, 255, 255, 0.3)' }}
                >
                  {item.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#00d9ff] group-hover:w-full transition-all duration-300" style={{ boxShadow: '0 0 8px rgba(0, 217, 255, 0.8)' }}></span>
                </a>
                <span className="text-[#00d9ff]/30 group-last:hidden text-xs">|</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-4 px-6">
          <Link
            href="/dashboard"
            className="px-8 py-3 bg-[#DF6C42] text-[#0a1929] text-lg uppercase font-bold hover:bg-[#0d2847] transition-colors"
            onClick={handleLaunchDemoClick}
          >
            Launch Search Demo
          </Link>
        </div>
      </nav>

      {/* Main Content Grid */}
      <main className="relative flex-1 grid grid-cols-12 z-10">
        
        {/* Left Sidebar (Empty/Decor) */}
        <div className="hidden lg:block col-span-1 relative overflow-hidden" style={{ backgroundColor: 'transparent' }}>
          {/* Diagonal Lines SVG Background */}
          <div className="absolute inset-0 opacity-[0.1]" style={{ 
            backgroundImage: 'repeating-linear-gradient(45deg, #1e3a5f 0, #1e3a5f 1px, transparent 0, transparent 50%)', 
            backgroundSize: '10px 10px' 
          }} />
          
          <div className="absolute bottom-8 left-8 -rotate-90 origin-bottom-left text-[10px] uppercase opacity-40 font-regular whitespace-nowrap z-10">
              System Status: Nominal
          </div>
        </div>

         {/* Main Hero Content */}
        <div className="col-span-12 lg:col-span-10 lg:col-start-2 flex flex-col">
          
           {/* Hero Section */}
           <motion.div 
             ref={heroRef}
             className="flex flex-col justify-center items-center gap-4 lg:gap-6 relative px-4"
             style={{ minHeight: '100vh' }}
             initial="hidden"
             animate="visible"
             variants={staggerContainer}
           >
             {/* Particle Layer - Background */}
             <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
               {Array.from({ length: 30 }).map((_, i) => (
                 <motion.div
                   key={i}
                   className="absolute w-1 h-1 bg-[#e0f2ff] rounded-full"
                   style={{
                     left: `${(i * 37) % 100}%`,
                     top: `${(i * 23) % 100}%`,
                     opacity: 0.15 + (i % 3) * 0.05
                   }}
                   animate={{
                     x: [0, 20, -15, 10, 0],
                     y: [0, 30, 20, -10, 0],
                     opacity: [0.15, 0.25, 0.2, 0.3, 0.15]
                   }}
                   transition={{
                     duration: 8 + (i % 4) * 2,
                     repeat: Infinity,
                     ease: "easeInOut",
                     delay: i * 0.2
                   }}
                 />
               ))}
             </div>

             {/* Mission HUD Panel */}
             <motion.div 
               className="absolute left-1/2 top-1/2 pointer-events-none z-[4]"
               style={{
                 width: '85%',
                 height: '320px',
                 transform: `translate(calc(-50% + ${mousePosition.x}px), calc(-50% + ${mousePosition.y}px))`,
                 transition: 'transform 0.1s ease-out'
               }}
             >
               <div 
                 className="w-full h-full"
                 style={{
                   backgroundColor: 'rgba(223, 108, 66, 0.95)',
                   border: '2px solid rgba(255,255,255,0.6)',
                   borderRadius: '6px'
                 }}
               />
             </motion.div>

             <motion.div
               className="relative z-[5] mb-4"
               variants={staggerItem}
             >
               <div className="w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center relative mx-auto">
                 <div className="absolute inset-0 border-2 border-[#00d9ff] animate-pulse" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', boxShadow: '0 0 30px rgba(0, 217, 255, 0.6)' }}></div>
                 <div className="w-10 h-10 lg:w-12 lg:h-12 bg-black border-2 border-[#00d9ff] relative z-10" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', boxShadow: '0 0 20px rgba(0, 217, 255, 0.8)' }}></div>
               </div>
             </motion.div>

             <motion.div 
               className="inline-flex items-center gap-2 px-4 py-1.5 border-2 border-[#00d9ff] text-[9px] lg:text-[11px] uppercase tracking-[0.2em] w-fit relative z-[5] mb-6 bg-black/50"
               variants={staggerItem}
               style={{ boxShadow: '0 0 15px rgba(0, 217, 255, 0.4)' }}
             >
               <div className="w-2 h-2 bg-[#00ff00] animate-pulse" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', boxShadow: '0 0 10px rgba(0, 255, 0, 0.8)' }}></div>
               <span className="text-white font-bold" style={{ textShadow: '0 0 10px rgba(0, 217, 255, 0.8)' }}>SYSTEM ACTIVE</span>
             </motion.div>
             
             <motion.h2 
               className="text-4xl lg:text-6xl font-sans font-bold leading-none tracking-tight text-white relative z-[5] text-center mb-6"
               variants={staggerItem}
               style={{ textShadow: '0 0 20px rgba(0, 217, 255, 0.6), 0 0 40px rgba(0, 217, 255, 0.3)' }}
             >
               OCEANCACHE
             </motion.h2>
             
             <motion.p 
               className="text-sm lg:text-base text-white/80 max-w-lg lg:max-w-2xl leading-relaxed relative z-[5] text-center font-bold tracking-wide mb-3"
               variants={staggerItem}
               style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}
             >
               DEEP SEA RECOVERY SYSTEM // 3D VISUALIZATION PLATFORM
             </motion.p>
             
             <motion.p 
               className="text-xs lg:text-sm text-[#00d9ff]/80 max-w-lg lg:max-w-xl leading-relaxed relative z-[5] text-center"
               variants={staggerItem}
             >
               Precision underwater navigation at 2,850 meters. Real-time container verification with AI-assisted analysis.
             </motion.p>
             
             {/* Mobile 3D Visualization Box */}
             <motion.div 
               className="lg:hidden h-64 border border-[#1e3a5f] relative overflow-hidden shrink-0 my-4 z-[2]"
               style={{ backgroundColor: 'transparent' }}
               variants={staggerItem}
             >
               <div className="absolute inset-0 flex items-center justify-center">
                   <CubeViewer />
               </div>
             </motion.div>
             
             <motion.div 
               className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 relative z-[5]"
               variants={staggerItem}
             >
              <button 
                className="w-full sm:w-auto px-8 py-3 border-2 border-[#00d9ff] text-[11px] uppercase font-bold hover:bg-[#00d9ff] hover:text-black transition-all cursor-pointer tracking-[0.15em] group relative overflow-hidden"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.querySelector('#process');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                style={{ 
                  boxShadow: '0 0 15px rgba(0, 217, 255, 0.3)',
                  textShadow: '0 0 10px rgba(0, 217, 255, 0.6)'
                }}
              >
                 <span className="relative z-10">HOW IT WORKS</span>
                 <div className="absolute inset-0 bg-[#00d9ff] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
               </button>
               <button
                 className="w-full sm:w-auto px-8 py-3 bg-[#00d9ff] text-black text-[11px] uppercase font-bold hover:bg-white transition-all cursor-pointer tracking-[0.15em] relative group"
                 onClick={(e) => {
                   e.preventDefault();
                   const element = document.querySelector('#map-viewer');
                   if (element) {
                     element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                   }
                 }}
                 style={{ 
                   clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)',
                   boxShadow: '0 0 25px rgba(0, 217, 255, 0.6)'
                 }}
               >
                 <span className="relative z-10 font-black">LAUNCH DIVE →</span>
               </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Visualization Column - Moved to separate section */}
        <div id="map-viewer" className="col-span-12 lg:col-span-10 lg:col-start-2 flex flex-col" style={{ backgroundColor: 'transparent' }}>
          
          {/* 3D Visualization Box */}
          <div className="hidden lg:block h-[50vh] relative overflow-hidden shrink-0" style={{ backgroundColor: 'transparent' }}>
            <div className="absolute inset-0 flex items-center justify-center">
                <CubeViewer />
            </div>
          </div>
        </div>

      </main>

      {/* Ocean Transition Wave */}
      <div className="relative w-full h-24 -mt-24 pointer-events-none z-[5]" style={{ marginTop: '-6rem' }}>
        <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 120">
          <path d="M0,60 Q300,40 600,60 T1200,60 L1200,120 L0,120 Z" fill="#0d2d47" opacity="0.95"/>
          <path d="M0,70 Q300,50 600,70 T1200,70 L1200,120 L0,120 Z" fill="#0a1f35" opacity="0.98"/>
        </svg>
      </div>

      {/* How It Works Section */}
      <section id="process" className="relative z-10" style={{ backgroundColor: 'transparent' }}>
        <div className="grid grid-cols-12">
          {/* Left Sidebar Spacer */}
          <div className="hidden lg:block col-span-1"></div>
          
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-11">
            <motion.div 
              className="px-10 py-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
            >
              <motion.div 
                className="inline-flex items-center gap-2 px-2 py-0.5 border border-[#1e3a5f] text-[10px] uppercase tracking-wider w-fit mb-8"
                variants={fadeInDown}
              >
                <div className="w-1.5 h-1.5 bg-[#DF6C42]"></div>
                PROCESS
              </motion.div>
              
              <motion.h3 
                className="text-4xl font-sans font-medium leading-none tracking-tight text-[#e0f2ff] mb-12"
                variants={fadeInUp}
              >
                How It Works
              </motion.h3>
              
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-[#1e3a5f]"
                variants={staggerContainer}
              >
                {[
                  {
                    step: '01',
                    title: 'Incident Input',
                    description: 'Operators input the last known GPS location of a lost container, its vessel route, and basic container metadata to define the initial search context.',
                  },
                  {
                    step: '02',
                    title: 'Search Modeling',
                    description: 'A rule-based spatial model prioritizes likely recovery zones using distance from the incident point, proximity to the vessel route, and historical loss patterns.',
                  },
                  {
                    step: '03',
                    title: '3D Visualization',
                    description: 'Probability-weighted search zones are rendered directly onto a 3D ocean floor mesh, enabling intuitive spatial reasoning and faster decision-making.',
                  },
                  {
                    step: '04',
                    title: 'Recovery Focus',
                    description: 'Teams concentrate efforts on high-confidence recovery zones first, improving search efficiency and reducing operational cost and environmental disturbance.',
                  },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    className={`p-8 border-r border-[#1e3a5f] last:border-r-0 hover:bg-[#0d2847] hover:text-[#0a1929] transition-colors group`}
                    variants={staggerItem}
                  >
                    <div className="text-[10px] uppercase opacity-50 mb-4 font-mono">{item.step}</div>
                    <h4 className="text-xl font-medium mb-3">{item.title}</h4>
                    <p className="text-sm opacity-70 leading-relaxed">{item.description}</p>
                    {idx < 3 && (
                      <div className="mt-6 flex items-center gap-2 opacity-20 group-hover:opacity-40">
                        <div className="w-full h-px bg-[#0d2847]"></div>
                        <div className="w-1.5 h-1.5 bg-[#DF6C42]"></div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Ocean Transition Wave */}
      <div className="relative w-full h-24 -mt-24 pointer-events-none z-[5]" style={{ marginTop: '-6rem' }}>
        <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 120">
          <path d="M0,50 Q300,70 600,50 T1200,50 L1200,120 L0,120 Z" fill="#0a1f35" opacity="0.95"/>
          <path d="M0,60 Q300,80 600,60 T1200,60 L1200,120 L0,120 Z" fill="#081a2e" opacity="0.98"/>
        </svg>
      </div>

      {/* Financial & Operational Impact Section */}
      <section id="metrics" className="relative z-10" style={{ backgroundColor: 'transparent' }}>
        <div className="grid grid-cols-12">
          {/* Left Sidebar Spacer */}
          <div className="hidden lg:block col-span-1"></div>
          
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-11">
            <motion.div 
              className="px-10 py-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
            >
              <motion.div 
                className="inline-flex items-center gap-2 px-2 py-0.5 border border-[#1e3a5f] text-[10px] uppercase tracking-wider w-fit mb-8"
                variants={fadeInDown}
              >
                <div className="w-1.5 h-1.5 bg-[#DF6C42]"></div>
                FINANCIAL IMPACT
              </motion.div>
              
              <motion.h3 
                className="text-4xl font-sans font-medium leading-none tracking-tight text-[#e0f2ff] mb-6"
                variants={fadeInUp}
              >
                Financial & Operational Impact
              </motion.h3>
              
              <motion.p 
                className="text-sm text-white/70 italic mb-12"
                variants={fadeInUp}
              >
                All data shown is simulated and illustrative. These charts support decision-making but do not guarantee outcomes.
              </motion.p>

              {/* Chart 1: Estimated Financial Loss by Incident Type */}
              <motion.div 
                className="border border-[#1e3a5f] mb-12 overflow-hidden"
                variants={fadeInUp}
              >
                <div className="p-8 pt-10 pb-10">
                  {/* Chart Header */}
                  <div className="mb-16">
                    <h4 className="text-lg font-bold text-white mb-3 uppercase tracking-wide">
                      Estimated Financial Loss by Incident Type (Simulated)
                    </h4>
                    <p className="text-base text-white/80 leading-relaxed">
                      This chart illustrates how financial exposure increases with incident severity and distance from shore.
                    </p>
                  </div>
                  
                  {/* Chart Canvas */}
                  <div className="flex flex-col md:flex-row gap-6 mb-8">
                    {/* Y-Axis */}
                    <div className="flex flex-row md:flex-col justify-between md:h-80 text-sm font-semibold text-white pt-1 pb-2 md:pb-8 md:pr-4 gap-2 md:gap-0">
                      <span>$2.5M</span>
                      <span>$2.0M</span>
                      <span>$1.5M</span>
                      <span>$1.0M</span>
                      <span>$500K</span>
                      <span>$0</span>
                    </div>
                    
                    {/* Stacked Bars */}
                    <div className="flex-1 h-80 flex flex-wrap md:flex-nowrap items-end gap-6 relative">
                      {[
                        { label: 'Nearshore Incident', cargo: 0.8, recovery: 0.3, penalties: 0.1 },
                        { label: 'Coastal Route', cargo: 1.2, recovery: 0.5, penalties: 0.2 },
                        { label: 'Deep Water', cargo: 1.5, recovery: 0.8, penalties: 0.3 },
                        { label: 'Open Ocean', cargo: 1.8, recovery: 1.2, penalties: 0.5 },
                      ].map((item, idx) => {
                        const maxLoss = 2.5;
                        const chartHeight = 320;
                        const totalHeight = ((item.cargo + item.recovery + item.penalties) / maxLoss) * chartHeight;
                        const cargoHeight = (item.cargo / maxLoss) * chartHeight;
                        const recoveryHeight = (item.recovery / maxLoss) * chartHeight;
                        const penaltiesHeight = (item.penalties / maxLoss) * chartHeight;
                        
                        return (
                          <div
                            key={idx}
                            className="flex-1 flex flex-col items-center justify-end gap-3 h-full relative"
                          >
                            <div className="flex flex-col items-end justify-end relative" style={{ height: '320px', width: '100%' }}>
                              <div className="flex flex-col w-full" style={{ height: `${totalHeight}px` }}>
                                <div
                                  className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/80 transition-colors"
                                  style={{ height: `${cargoHeight}px` }}
                                  title="Estimated Cargo Value Loss"
                                />
                                <div
                                  className="bg-[#DF6C42] hover:bg-[#DF6C42]/80 transition-colors"
                                  style={{ height: `${recoveryHeight}px` }}
                                  title="Recovery Operation Cost"
                                />
                                <div
                                  className="bg-[#8B2635] hover:bg-[#8B2635]/80 transition-colors"
                                  style={{ height: `${penaltiesHeight}px` }}
                                  title="Delay & Environmental Penalties"
                                />
                              </div>
                            </div>
                            <div className="text-sm font-medium text-white mt-3 text-center px-1">{item.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="pt-6 border-t border-[#1e3a5f]">
                    <div className="flex flex-wrap items-center justify-center gap-8">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-[#1e3a5f]"></div>
                        <div className="text-sm font-semibold text-white">Estimated Cargo Value Loss</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-[#DF6C42]"></div>
                        <div className="text-sm font-semibold text-white">Recovery Operation Cost</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-[#8B2635]"></div>
                        <div className="text-sm font-semibold text-white">Delay & Environmental Penalties</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Chart 2: Recovery Cost Comparison */}
              <motion.div 
                className="border border-[#1e3a5f] mb-12 overflow-hidden"
                variants={fadeInUp}
              >
                <div className="p-8 pt-10 pb-10">
                  {/* Chart Header */}
                  <div className="mb-16">
                    <h4 className="text-lg font-bold text-white mb-3 uppercase tracking-wide">
                      Recovery Cost Comparison (Simulated)
                    </h4>
                    <p className="text-base text-white/80 leading-relaxed">
                      Simulation-first planning reduces unnecessary dives, operational cost, and mission failure rates.
                    </p>
                  </div>
                  
                  {/* Chart Canvas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-6">
                    {[
                      { 
                        metric: 'Average Recovery Cost', 
                        traditional: 1.8, 
                        simulation: 1.1,
                        unit: 'M USD',
                        max: 2.0
                      },
                      { 
                        metric: 'Average Mission Duration', 
                        traditional: 18, 
                        simulation: 11,
                        unit: 'days',
                        max: 20
                      },
                      { 
                        metric: 'Successful Recovery Rate', 
                        traditional: 68, 
                        simulation: 87,
                        unit: '%',
                        max: 100
                      },
                    ].map((item, idx) => {
                      const chartHeight = 200;
                      const traditionalHeight = (item.traditional / item.max) * chartHeight;
                      const simulationHeight = (item.simulation / item.max) * chartHeight;
                      
                      return (
                        <div key={idx} className="flex flex-col">
                          <div className="text-base font-bold text-white mb-6 text-center uppercase tracking-wide">
                            {item.metric}
                          </div>
                          <div className="flex items-end justify-center gap-6 h-52">
                            <div className="flex flex-col items-center gap-3">
                              <div
                                className="bg-[#0d2847] hover:bg-[#0d2847]/80 transition-colors w-20"
                                style={{ height: `${traditionalHeight}px` }}
                              />
                              <div className="text-sm font-semibold text-white text-center">
                                <div className="text-base font-bold mb-1">{item.traditional}{item.unit === '%' ? '%' : item.unit === 'days' ? 'd' : 'M'}</div>
                                <div className="text-white/70 text-xs uppercase">Traditional</div>
                              </div>
                            </div>
                            <div className="flex flex-col items-center gap-3">
                              <div
                                className="bg-[#DF6C42] hover:bg-[#DF6C42]/80 transition-colors w-20"
                                style={{ height: `${simulationHeight}px` }}
                              />
                              <div className="text-sm font-semibold text-white text-center">
                                <div className="text-base font-bold mb-1">{item.simulation}{item.unit === '%' ? '%' : item.unit === 'days' ? 'd' : 'M'}</div>
                                <div className="text-white/70 text-xs uppercase">Simulation-First</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Chart 3: Salvage Value Decay Over Time */}
              <motion.div 
                className="border border-[#1e3a5f] mb-12 overflow-hidden"
                variants={fadeInUp}
              >
                <div className="p-8 pt-10 pb-10">
                  {/* Chart Header */}
                  <div className="mb-16">
                    <h4 className="text-lg font-bold text-white mb-3 uppercase tracking-wide">
                      Salvage Value Decay Over Time Underwater (Simulated)
                    </h4>
                    <p className="text-base text-white/80 leading-relaxed">
                      Delays in assessment rapidly reduce recoverable value, especially for high-value or sensitive cargo.
                    </p>
                  </div>
                  
                  {/* Chart Canvas */}
                  <div className="flex flex-col md:flex-row gap-6 mb-8">
                    {/* Y-Axis */}
                    <div className="flex flex-row md:flex-col justify-between md:h-80 text-sm font-semibold text-white pt-1 pb-2 md:pb-8 md:pr-4 gap-2 md:gap-0">
                      <span>100%</span>
                      <span>80%</span>
                      <span>60%</span>
                      <span>40%</span>
                      <span>20%</span>
                      <span>0%</span>
                    </div>
                    
                    {/* Line Chart */}
                    <div className="flex-1 h-80 relative">
                      <svg className="w-full h-full" viewBox="0 0 800 320" preserveAspectRatio="none">
                        {/* Grid lines */}
                        {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((val) => (
                          <line
                            key={val}
                            x1="0"
                            y1={320 - (val * 320)}
                            x2="800"
                            y2={320 - (val * 320)}
                            stroke="rgba(255, 255, 255, 0.1)"
                            strokeWidth="1"
                          />
                        ))}
                        
                        {/* No Early Assessment - dashed line */}
                        <polyline
                          points="0,320 100,280 200,240 300,200 400,160 500,120 600,80 700,50 800,30"
                          fill="none"
                          stroke="#8B2635"
                          strokeWidth="3"
                          strokeDasharray="5,5"
                        />
                        
                        {/* Early Simulation-Based Assessment - solid line */}
                        <polyline
                          points="0,320 100,300 200,280 300,260 400,240 500,220 600,200 700,185 800,175"
                          fill="none"
                          stroke="#DF6C42"
                          strokeWidth="3"
                        />
                      </svg>
                      
                      {/* X-Axis Labels */}
                      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 text-sm font-semibold text-white">
                        <span>0d</span>
                        <span>10d</span>
                        <span>20d</span>
                        <span>30d</span>
                        <span>40d</span>
                        <span>50d</span>
                        <span>60d</span>
                        <span>70d</span>
                        <span>80d</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="pt-6 border-t border-[#1e3a5f]">
                    <div className="flex flex-wrap items-center justify-center gap-8">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-1 bg-[#8B2635]" style={{ borderTop: '3px dashed #8B2635' }}></div>
                        <div className="text-sm font-semibold text-white">No Early Assessment</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-1 bg-[#DF6C42]"></div>
                        <div className="text-sm font-semibold text-white">Early Simulation-Based Assessment</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Chart 4: Environmental Risk Multipliers */}
              <motion.div 
                className="border border-[#1e3a5f] mb-12 overflow-hidden"
                variants={fadeInUp}
              >
                <div className="p-8 pt-10 pb-10">
                  {/* Chart Header */}
                  <div className="mb-16">
                    <h4 className="text-lg font-bold text-white mb-3 uppercase tracking-wide">
                      Environmental Risk Multipliers (Simulated)
                    </h4>
                    <p className="text-base text-white/80 leading-relaxed">
                      Environmental conditions significantly increase recovery complexity and cost, reinforcing the need for pre-mission simulation.
                    </p>
                  </div>
                  
                  {/* Chart Canvas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { condition: 'Ocean Current Strength', values: [
                        { label: 'Low', multiplier: 1.0, color: '#1e3a5f' },
                        { label: 'Medium', multiplier: 1.4, color: '#DF6C42' },
                        { label: 'High', multiplier: 2.2, color: '#8B2635' },
                      ]},
                      { condition: 'Depth', values: [
                        { label: '<100m', multiplier: 1.0, color: '#1e3a5f' },
                        { label: '100-500m', multiplier: 1.6, color: '#DF6C42' },
                        { label: '>500m', multiplier: 2.5, color: '#8B2635' },
                      ]},
                      { condition: 'Seafloor Type', values: [
                        { label: 'Sandy', multiplier: 1.0, color: '#1e3a5f' },
                        { label: 'Rocky', multiplier: 1.8, color: '#DF6C42' },
                        { label: 'Muddy', multiplier: 2.0, color: '#8B2635' },
                      ]},
                    ].map((category, catIdx) => (
                      <div key={catIdx} className="border border-[#1e3a5f] p-6">
                        <div className="text-base font-bold text-white mb-5 uppercase tracking-wide">
                          {category.condition}
                        </div>
                        <div className="space-y-4">
                          {category.values.map((item, idx) => {
                            const maxMultiplier = 2.5;
                            const barWidth = (item.multiplier / maxMultiplier) * 100;
                            
                            return (
                              <div key={idx} className="group relative">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-base font-semibold text-white">{item.label}</span>
                                  <span className="text-base font-bold text-white">×{item.multiplier}</span>
                                </div>
                                <div className="w-full h-5 bg-[#1e3a5f]/20 overflow-hidden">
                                  <div
                                    className="h-full transition-all"
                                    style={{ 
                                      width: `${barWidth}%`,
                                      backgroundColor: item.color
                                    }}
                                  />
                                </div>
                                <div className="absolute -top-10 left-0 bg-[#0a1929] border border-[#1e3a5f] px-3 py-2 text-sm font-medium text-white opacity-0 group-hover:opacity-100 pointer-events-none z-10 whitespace-nowrap">
                                  Recovery Cost Multiplier: ×{item.multiplier}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Ocean Transition Wave */}
      <div className="relative w-full h-24 -mt-24 pointer-events-none z-[5]" style={{ marginTop: '-6rem' }}>
        <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 120">
          <path d="M0,60 Q300,40 600,60 T1200,60 L1200,120 L0,120 Z" fill="#0d2d47" opacity="0.95"/>
          <path d="M0,70 Q300,50 600,70 T1200,70 L1200,120 L0,120 Z" fill="#0a1f35" opacity="0.98"/>
        </svg>
      </div>

      {/* Interactive Search Optimization Demo Section */}
      <section id="interactive-demo" className="relative z-10" style={{ backgroundColor: 'transparent' }}>
        <div className="grid grid-cols-12">
          {/* Left Sidebar Spacer */}
          <div className="hidden lg:block col-span-1"></div>
          
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-11">
            <motion.div 
              className="px-10 py-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
            >
              <motion.div 
                className="inline-flex items-center gap-2 px-2 py-0.5 border border-[#1e3a5f] text-[10px] uppercase tracking-wider w-fit mb-8"
                variants={fadeInDown}
              >
                <div className="w-1.5 h-1.5 bg-[#DF6C42]"></div>
                INTERACTIVE DEMO
              </motion.div>
              
              <motion.h3 
                className="text-4xl font-sans font-medium leading-none tracking-tight text-[#e0f2ff] mb-6"
                variants={fadeInUp}
              >
                Interactive Search Optimization Demo
              </motion.h3>
              
              <motion.p 
                className="text-sm opacity-70 leading-relaxed mb-4 max-w-3xl"
                variants={fadeInUp}
              >
                This interactive 3D map visualizes how probability-weighted search zones reduce the area required to locate lost shipping containers compared to traditional uniform search methods.
              </motion.p>

              <motion.p 
                className="text-xs opacity-60 italic mb-6"
                variants={fadeInUp}
              >
                Toggle between traditional and optimized search to compare coverage efficiency.
              </motion.p>

              {/* Search Mode Toggle */}
              <motion.div 
                className="mb-6 flex items-center gap-4"
                variants={fadeInUp}
              >
                <div className="text-[10px] uppercase opacity-50">Search Mode:</div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 border border-[#1e3a5f] text-[10px] uppercase font-bold hover:bg-[#0d2847] hover:text-[#0a1929] transition-colors">
                    Traditional Search
                  </button>
                  <button className="px-4 py-2 bg-[#DF6C42] text-[#0a1929] text-[10px] uppercase font-bold hover:bg-[#0d2847] transition-colors">
                    Optimized Search
                  </button>
                </div>
              </motion.div>

              {/* 3D Visualization Container */}
              <motion.div 
                className="border border-[#1e3a5f] mb-6 relative overflow-hidden"
                style={{ backgroundColor: 'transparent' }}
                style={{ height: '60vh', minHeight: '400px' }}
                variants={fadeInUp}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <CubeViewer />
                </div>
                
                {/* Visualization Legend */}
                <div className="absolute top-4 right-4 border border-[#1e3a5f] p-4" style={{ backgroundColor: 'rgba(5, 15, 26, 0.9)' }}>
                  <div className="text-[10px] uppercase opacity-50 mb-3">Priority Zones</div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-[#DF6C42]"></div>
                      <div className="text-[10px] uppercase opacity-70">High Priority</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-[#DF6C42]/60"></div>
                      <div className="text-[10px] uppercase opacity-70">Medium Priority</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-[#DF6C42]/30"></div>
                      <div className="text-[10px] uppercase opacity-70">Low Priority</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Helper Text */}
              <motion.p 
                className="text-xs opacity-60 italic mb-6"
                variants={fadeInUp}
              >
                Rotate, zoom, and explore the ocean floor to see how search optimization concentrates recovery efforts in high-confidence areas.
              </motion.p>

              {/* Compare Button */}
              <motion.div 
                className="flex justify-center"
                variants={fadeInUp}
              >
                <button className="px-6 py-3 bg-[#DF6C42] text-[#0a1929] text-[10px] uppercase font-bold hover:bg-[#0d2847] transition-colors">
                  Compare Search Strategies
                </button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Ocean Transition Wave */}
      <div className="relative w-full h-24 -mt-24 pointer-events-none z-[5]" style={{ marginTop: '-6rem' }}>
        <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 120">
          <path d="M0,50 Q300,70 600,50 T1200,50 L1200,120 L0,120 Z" fill="#0a1f35" opacity="0.95"/>
          <path d="M0,60 Q300,80 600,60 T1200,60 L1200,120 L0,120 Z" fill="#081a2e" opacity="0.98"/>
        </svg>
      </div>

      {/* Future Extensions Section */}
      <section id="future-extensions" className="relative z-10" style={{ backgroundColor: 'transparent' }}>
        <div className="grid grid-cols-12">
          {/* Left Sidebar Spacer */}
          <div className="hidden lg:block col-span-1"></div>
          
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-11">
            <motion.div 
              className="px-10 py-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
            >
              <motion.div 
                className="inline-flex items-center gap-2 px-2 py-0.5 border border-[#1e3a5f] text-[10px] uppercase tracking-wider w-fit mb-8"
                variants={fadeInDown}
              >
                <div className="w-1.5 h-1.5 bg-[#DF6C42]"></div>
                FUTURE EXTENSIONS
              </motion.div>
              
              <motion.h3 
                className="text-4xl font-sans font-medium leading-none tracking-tight text-[#e0f2ff] mb-12"
                variants={fadeInUp}
              >
                Future Extensions
              </motion.h3>
              
              <motion.div 
                className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-[#1e3a5f]"
                variants={staggerContainer}
              >
                <motion.div 
                  className="p-8 hover:bg-[#0d2847] hover:text-[#0a1929] transition-colors flex flex-col h-full"
                  variants={staggerItem}
                >
                  <h4 className="text-xl font-medium mb-3">Insurance Loss Assessment</h4>
                  <p className="text-sm opacity-70 leading-relaxed flex-1">
                    Recovered container condition data can support faster and more accurate insurance claim validation.
                  </p>
                </motion.div>
                
                <motion.div 
                  className="p-8 hover:bg-[#0d2847] hover:text-[#0a1929] transition-colors flex flex-col h-full"
                  variants={staggerItem}
                >
                  <h4 className="text-xl font-medium mb-3">Automated Recovery Planning</h4>
                  <p className="text-sm opacity-70 leading-relaxed flex-1">
                    Future versions could integrate additional environmental data to further refine search prioritization.
                  </p>
                </motion.div>
                
                <motion.div 
                  className="p-8 hover:bg-[#0d2847] hover:text-[#0a1929] transition-colors flex flex-col h-full"
                  variants={staggerItem}
                >
                  <h4 className="text-xl font-medium mb-3">Fleet-Level Analytics</h4>
                  <p className="text-sm opacity-70 leading-relaxed flex-1">
                    Aggregated loss data may reveal systemic risk patterns across routes and vessel types.
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Ocean Transition Wave */}
      <div className="relative w-full h-24 -mt-24 pointer-events-none z-[5]" style={{ marginTop: '-6rem' }}>
        <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 120">
          <path d="M0,60 Q300,40 600,60 T1200,60 L1200,120 L0,120 Z" fill="#0d2d47" opacity="0.95"/>
          <path d="M0,70 Q300,50 600,70 T1200,70 L1200,120 L0,120 Z" fill="#0a1f35" opacity="0.98"/>
        </svg>
      </div>

      {/* Footer */}
      <footer id="visualize" className="relative z-10" style={{ backgroundColor: 'transparent' }}>
        <div className="grid grid-cols-12">
          {/* Left Sidebar Spacer */}
          <div className="hidden lg:block col-span-1"></div>
          
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-11">
            <motion.div 
              className="px-10 py-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeIn}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 mb-6">
                <div>
                  <div className="mb-4">
                    <span className="text-sm font-medium">Deep Sea Container Search</span>
                  </div>
                  <p className="text-xs opacity-60 leading-relaxed">
                    A 3D decision-support tool for optimizing underwater cargo recovery.
                  </p>
                </div>
                
                <div>
                  <div className="text-[10px] uppercase opacity-50 mb-4">Quick Links</div>
                  <div className="flex flex-col gap-2">
                    {[
                      { name: 'Process', href: '#process' },
                      { name: 'Metrics', href: '#metrics' },
                      { name: 'Interactive Demo', href: '#interactive-demo' },
                      { name: 'Future Extensions', href: '#future-extensions' },
                    ].map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        onClick={(e) => {
                          e.preventDefault();
                          const element = document.querySelector(item.href);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        className="text-xs opacity-70 hover:text-[#DF6C42] hover:opacity-100 transition-colors cursor-pointer"
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="text-[10px] uppercase opacity-50 mb-4">Resources</div>
                  <div className="flex flex-col gap-2">
                    <Link href="/dashboard" className="text-xs opacity-70 hover:text-[#DF6C42] hover:opacity-100 transition-colors">
                      Dashboard
                    </Link>
                    <a href="#" className="text-xs opacity-70 hover:text-[#DF6C42] hover:opacity-100 transition-colors">
                      Documentation
                    </a>
                    <a href="#" className="text-xs opacity-70 hover:text-[#DF6C42] hover:opacity-100 transition-colors">
                      GitHub
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase opacity-50">
                <div>© 2025 Deep Sea Container Search. Built by <a href="https://www.linkedin.com/in/fenilshah05/" target="_blank" rel="noopener noreferrer" className="hover:text-[#DF6C42] transition-colors">Fenil Shah</a>, <a href="https://www.linkedin.com/in/devp19/" target="_blank" rel="noopener noreferrer" className="hover:text-[#DF6C42] transition-colors">Dev Patel</a>, <a href="https://www.linkedin.com/in/kushp4444/" target="_blank" rel="noopener noreferrer" className="hover:text-[#DF6C42] transition-colors">Kush Patel</a>.</div>
                <div className="flex items-center gap-4">
                  <span>v.2.0.4</span>
                  <span className="opacity-30">/</span>
                  <span>System Status: Nominal</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </footer>

      {/* Mobile Modal */}
      {showMobileModal && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative border-2 border-[#1e3a5f] p-8 max-w-sm w-full" style={{ backgroundColor: 'rgba(5, 15, 26, 0.95)' }}>
            {/* Close Button */}
            <button
              onClick={() => setShowMobileModal(false)}
              className="absolute top-4 right-4 w-8 h-8 border border-[#1e3a5f] flex items-center justify-center hover:bg-[#0d2847] hover:text-[#0a1929] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Modal Header */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 bg-[#DF6C42]"></div>
              <span className="text-[10px] uppercase tracking-wider">DEMO ACCESS</span>
            </div>
            
            {/* Modal Title */}
            <h3 className="text-2xl font-sans font-medium leading-none tracking-tight text-[#e0f2ff] mb-4">
              LARGER SCREEN<br/>RECOMMENDED
            </h3>
            
            {/* Modal Message */}
            <p className="text-sm opacity-70 leading-relaxed mb-6">
              For the best demo experience, please view on a tablet or desktop device. The full 3D visualization and interactive features require a larger screen.
            </p>
            
            {/* Action Button */}
            <button
              onClick={() => setShowMobileModal(false)}
              className="w-full px-6 py-3 bg-[#DF6C42] text-[#0a1929] text-[10px] uppercase font-bold hover:bg-[#0d2847] transition-colors"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
      
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
