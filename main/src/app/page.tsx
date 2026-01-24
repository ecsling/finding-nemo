'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const CubeViewer = dynamic(() => import('@/components/CubeViewer'), { ssr: false });

export default function Home() {
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
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
    <div className="relative min-h-screen bg-[#0a1929] text-[#e0f2ff] font-mono flex flex-col overflow-hidden">

      {/* Animated Waves Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="wave"></div>
        <div className="wave"></div>
        <div className="wave"></div>
      </div>

      {/* Navigation Header */}
      <nav className="relative border-b border-[#1e3a5f] px-0 h-16 flex justify-between items-center bg-[#0a1929] z-50">
        <div className="flex items-center h-full flex-1">
          {/* Logo Box - Aligned with Left Sidebar */}
          {/* Scaled down from 179px */}
          <div className="w-[134px] h-full flex items-center justify-center bg-[#0a1929] shrink-0">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/logo.png" alt="Mesh Logo" className="w-6 h-6 object-contain invert" />
            </div>
          </div>
          
          {/* Nav Items starting right after the box */}
          <div className="hidden md:flex h-full items-center px-6 gap-8 text-[10px] font-medium uppercase tracking-wide flex-1">
            {[
              { name: 'Process', href: '#process' },
              { name: 'Metrics', href: '#metrics' },
              { name: 'Interactive Demo', href: '#interactive-demo' },
              { name: 'Future Extensions', href: '#future-extensions' }
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-8 group">
                <a 
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.querySelector(item.href);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="hover:text-[#DF6C42] transition-colors cursor-pointer"
                >
                  {item.name}
                </a>
                <span className="text-[#e0f2ff]/20 group-last:hidden">/</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-4 px-6">
          <div className="text-[10px] uppercase tracking-widest opacity-50">Mesh</div>
          <Link
            href="/dashboard"
            className="px-5 py-1.5 bg-[#DF6C42] text-[#0a1929] text-[10px] uppercase font-bold hover:bg-[#0d2847] transition-colors"
            onClick={handleLaunchDemoClick}
          >
            Launch Search Demo
          </Link>
        </div>
      </nav>

      {/* Main Content Grid */}
      <main className="relative flex-1 grid grid-cols-12 divide-x divide-[#1e3a5f] z-10">
        
        {/* Left Sidebar (Empty/Decor) */}
        <div className="hidden lg:block col-span-1 relative bg-[#0a1929] overflow-hidden">
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
        <div className="col-span-12 lg:col-span-7 flex flex-col divide-y divide-[#1e3a5f]">
          
           {/* Hero Section */}
           <motion.div 
             ref={heroRef}
             className="pl-4 lg:pl-10 flex flex-col justify-center gap-4 lg:gap-6 flex-1 relative"
             initial="hidden"
             animate="visible"
             variants={staggerContainer}
           >
           <motion.img 
             src="/logo.png" 
             alt="Mesh Logo" 
             className="w-8 h-8 lg:w-12 lg:h-12 object-contain invert relative z-10"
             variants={staggerItem}
           />

             <motion.div 
               className="inline-flex items-center gap-2 px-2 py-0.5 border border-[#1e3a5f] text-[8px] lg:text-[10px] uppercase tracking-wider w-fit relative z-10"
               variants={staggerItem}
             >
              
               <div className="w-1.5 h-1.5 bg-[#DF6C42]"></div>
               Mesh
             </motion.div>
             
             {/* Mission Control Panel - Background HUD */}
             <div 
               className="absolute left-0 right-0 top-1/2 -translate-y-1/2 w-full h-24 lg:h-32 pointer-events-none z-0"
               style={{
                 transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
                 transition: 'transform 0.1s ease-out'
               }}
             >
               <div className="relative w-full h-full flex items-center justify-center">
                 <div className="w-full max-w-4xl mx-auto px-4 lg:px-8">
                   <div className="relative w-full h-full border border-[#1e3a5f]/30 bg-[#0a1929]/40 backdrop-blur-sm">
                     <motion.div
                       className="absolute left-1/4 top-1/2 -translate-y-1/2 w-32 lg:w-48 h-12 lg:h-16 bg-[#DF6C42] opacity-20 blur-sm"
                       animate={{
                         opacity: [0.2, 0.25, 0.2],
                       }}
                       transition={{
                         duration: 4,
                         repeat: Infinity,
                         ease: "easeInOut"
                       }}
                     />
                     <div className="absolute inset-0 flex items-center justify-between px-6 lg:px-12">
                       <div className="text-[8px] lg:text-[10px] uppercase tracking-widest text-[#e0f2ff]/20 font-mono">
                         MISSION CONTROL
                       </div>
                       <div className="text-[8px] lg:text-[10px] uppercase tracking-widest text-[#e0f2ff]/20 font-mono">
                         SYSTEM ACTIVE
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
             
             <motion.h2 
               className="text-3xl lg:text-5xl font-sans font-medium leading-none tracking-tight text-[#e0f2ff] relative z-10"
               variants={staggerItem}
             >
               Deep Sea Container Search
             </motion.h2>
             
             <motion.p 
               className="text-xs lg:text-sm opacity-70 max-w-lg lg:max-w-xl leading-relaxed relative z-10"
               variants={staggerItem}
             >
               A 3D decision-support system that reduces underwater search time for lost shipping containers by prioritizing high-probability recovery zones.
             </motion.p>
             
             {/* Mobile 3D Visualization Box */}
             <motion.div 
               className="lg:hidden h-64 border border-[#1e3a5f] relative overflow-hidden bg-[#0a1929] shrink-0 my-4 z-10"
               variants={staggerItem}
             >
               <div className="absolute inset-0 flex items-center justify-center">
                   <CubeViewer />
               </div>
             </motion.div>
             
             <motion.div 
               className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pt-2 relative z-10"
               variants={staggerItem}
             >
              <button 
                className="w-full sm:w-auto px-6 py-3 border border-[#1e3a5f] text-[10px] uppercase font-bold hover:bg-[#0d2847] hover:text-[#0a1929] transition-colors cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.querySelector('#process');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                 How It Works
               </button>
               <button
                 className="w-full sm:w-auto px-6 py-3 bg-[#DF6C42] text-[#0a1929] text-[10px] uppercase font-bold hover:bg-[#0d2847] transition-colors text-center sm:text-left mb-2 sm:mb-0"
                 onClick={(e) => {
                   e.preventDefault();
                   const element = document.querySelector('#map-viewer');
                   if (element) {
                     element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                   }
                 }}
               >
                 Launch Search Demo
               </button>
             </motion.div>
           </motion.div>

           {/* Ecosystem Partners */}
           <div className="h-18 grid grid-cols-4 divide-x divide-[#1e3a5f] mt-auto border-b border-[#1e3a5f]">
             {[
               { name: 'GEMINI PRO', image: '/gemini-pro.png' },
               { name: 'SKETCHFAB', image: '/sketch.png' },
               { name: 'OPENAI', image: '/openai.png' },
               { name: 'ARDUINO', image: '/arduino.png' }
             ].map((partner) => (
               <div key={partner.name} className="flex items-center justify-center opacity-40 hover:opacity-100 hover:bg-[#0d2847] transition-all cursor-default p-2">
                 <img 
                   src={partner.image} 
                   alt={partner.name} 
                   className="h-5 w-auto object-contain filter brightness-0 invert"
                 />
               </div>
             ))}
           </div>
         </div>

        {/* Right Visualization Column */}
        <div id="map-viewer" className="col-span-12 lg:col-span-4 flex flex-col divide-y divide-[#1e3a5f] bg-[#0a1929]">
          
          {/* 3D Visualization Box */}
          <div className="hidden lg:block h-[50vh] border-b border-[#1e3a5f] relative overflow-hidden bg-[#0a1929] shrink-0">
            <div className="absolute inset-0 flex items-center justify-center">
                <CubeViewer />
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="flex-1 grid grid-rows-3 divide-y divide-[#1e3a5f] min-h-0">
            <div className="px-6 py-4 flex flex-col justify-center group hover:bg-[#0d2847] hover:text-[#0a1929] transition-colors">
                <div className="text-[10px] uppercase opacity-50 mb-2">Preloaded Models</div>
                <div className="text-2xl font-bold mb-3">6</div>
                <div className="w-full h-1 bg-[#DF6C42]/20 overflow-hidden">
                  <div className="h-full w-[95%] bg-[#DF6C42]"></div>
                </div>
            </div>
            <div className="px-6 py-4 flex flex-col justify-center group hover:bg-[#0d2847] hover:text-[#0a1929] transition-colors">
                <div className="text-[10px] uppercase opacity-50 mb-2">Meshes Processed</div>
                <div className="text-2xl font-bold mb-3">2.1M</div>
                <div className="w-full h-1 bg-[#DF6C42]/20 overflow-hidden">
                  <div className="h-full w-2/3 bg-[#DF6C42]"></div>
                </div>
            </div>
            <div className="px-6 py-4 flex flex-col justify-center group hover:bg-[#0d2847] hover:text-[#0a1929] transition-colors">
                <div className="text-[10px] uppercase opacity-50 mb-2">Total Vertices</div>
                <div className="text-2xl font-bold mb-3">1.72B</div>
                <div className="w-full h-1 bg-[#DF6C42]/20 overflow-hidden">
                  <div className="h-full w-full bg-[#DF6C42]"></div>
                </div>
            </div>
          </div>
        </div>

      </main>

      {/* How It Works Section */}
      <section id="process" className="relative border-t border-[#1e3a5f] bg-[#0a1929] z-10">
        <div className="grid grid-cols-12 divide-x divide-[#1e3a5f]">
          {/* Left Sidebar Spacer */}
          <div className="hidden lg:block col-span-1"></div>
          
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-11">
            <motion.div 
              className="px-10 py-16 border-b border-[#1e3a5f]"
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

      {/* Search Impact Section */}
      <section id="metrics" className="relative border-t border-[#1e3a5f] bg-[#0a1929] z-10">
        <div className="grid grid-cols-12 divide-x divide-[#1e3a5f]">
          {/* Left Sidebar Spacer */}
          <div className="hidden lg:block col-span-1"></div>
          
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-11">
            <motion.div 
              className="px-10 py-16 border-b border-[#1e3a5f]"
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
                METRICS
              </motion.div>
              
              <motion.h3 
                className="text-4xl font-sans font-medium leading-none tracking-tight text-[#e0f2ff] mb-12"
                variants={fadeInUp}
              >
                Search Impact
              </motion.h3>
              
              <motion.p 
                className="text-sm opacity-70 leading-relaxed mb-8 max-w-3xl"
                variants={fadeInUp}
              >
                This system is designed to reduce underwater search time and operational cost by prioritizing high-probability recovery zones instead of uniform search patterns.
              </motion.p>
              
              <motion.p 
                className="text-xs opacity-60 italic mb-8"
                variants={fadeInUp}
              >
                The following metrics demonstrate the operational impact of search optimization.
              </motion.p>
              
              {/* Combined Bar Graph - Traditional vs Optimized Search */}
              <motion.div 
                className="border border-[#1e3a5f] mb-8 overflow-hidden"
                variants={fadeInUp}
              >
                <div className="p-8">
                  <div className="mb-4">
                    <div className="text-[10px] uppercase opacity-50 mb-2">Search Efficiency Comparison</div>
                    <p className="text-xs opacity-60 italic">
                      This chart compares search area coverage between traditional uniform search patterns and optimized probability-based search across different incident scenarios.
                    </p>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    {/* Y-Axis */}
                    <div className="flex flex-row md:flex-col justify-between md:h-80 text-[8px] uppercase opacity-40 pt-1 pb-2 md:pb-8 md:pr-2 gap-2 md:gap-0">
                      <span>5.0 km²</span>
                      <span>4.0 km²</span>
                      <span>3.0 km²</span>
                      <span>2.0 km²</span>
                      <span>1.0 km²</span>
                      <span>0 km²</span>
                    </div>
                    
                    {/* Chart Bars */}
                    <div className="flex-1 h-80 flex flex-wrap md:flex-nowrap items-end gap-4 relative">
                      {[
                        { label: 'Nearshore Incident', traditional: 4.2, optimized: 1.8 },
                        { label: 'Coastal Route', traditional: 3.8, optimized: 1.6 },
                        { label: 'Deep Water', traditional: 4.5, optimized: 2.1 },
                        { label: 'Open Ocean', traditional: 4.8, optimized: 2.3 },
                      ].map((item, idx) => {
                        const maxArea = 5.0; // Maximum search area on y-axis
                        const chartHeight = 320; // h-80 = 320px
                        const traditionalHeight = (item.traditional / maxArea) * chartHeight;
                        const optimizedHeight = (item.optimized / maxArea) * chartHeight;
                        
                        return (
                          <div
                            key={idx}
                            className="flex-1 flex flex-col items-center justify-end gap-2 h-full relative"
                          >
                            <div className="flex items-end gap-2 w-full justify-center relative" style={{ height: '320px' }}>
                              {/* Traditional Uniform Search Bar */}
                              <div className="flex flex-col items-center justify-end relative" style={{ height: '320px' }}>
                                <div
                                  className="bg-[#0d2847] hover:bg-[#0d2847]/80 transition-colors relative"
                                  style={{ 
                                    height: `${traditionalHeight}px`, 
                                    width: 'calc(45% - 4px)',
                                    minWidth: '40px'
                                  }}
                                />
                              </div>
                              {/* Optimized Probability-Based Search Bar */}
                              <div className="flex flex-col items-center justify-end relative" style={{ height: '320px' }}>
                                <div
                                  className="bg-[#DF6C42] hover:bg-[#DF6C42]/80 transition-colors relative"
                                  style={{ 
                                    height: `${optimizedHeight}px`, 
                                    width: 'calc(45% - 4px)',
                                    minWidth: '40px'
                                  }}
                                />
                              </div>
                            </div>
                            <div className="text-[8px] uppercase opacity-40 mt-2 text-center px-1">{item.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-[#1e3a5f]">
                    <div className="flex items-center justify-center gap-8 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-[#0d2847]"></div>
                        <div className="text-[10px] uppercase opacity-70">Traditional Uniform Search</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-[#DF6C42]"></div>
                        <div className="text-[10px] uppercase opacity-70">Optimized Probability-Based Search</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold mb-1">4.3 km²</div>
                        <div className="text-[10px] uppercase opacity-50">Avg Traditional</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold mb-1">1.9 km²</div>
                        <div className="text-[10px] uppercase opacity-50">Avg Optimized</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Key Metrics */}
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#1e3a5f] mb-8"
                variants={staggerContainer}
              >
                {[
                  { 
                    label: 'Search Area Reduction', 
                    value: '58%', 
                    sublabel: 'Vs uniform search', 
                    chart: 58,
                    explanation: 'Average reduction in search area coverage when using probability-based prioritization compared to traditional uniform search patterns across multiple incident scenarios.'
                  },
                  { 
                    label: 'Estimated Time Savings', 
                    value: '35–50%', 
                    sublabel: 'Operational efficiency', 
                    chart: 42,
                    explanation: 'Projected time reduction for search operations by focusing recovery efforts on high-probability zones first, reducing overall mission duration.'
                  },
                  { 
                    label: 'Search Prioritization Accuracy', 
                    value: 'High-confidence zones identified first', 
                    sublabel: 'Recovery focus', 
                    chart: 85,
                    explanation: 'The system successfully identifies and prioritizes high-probability recovery zones, enabling teams to concentrate search efforts where containers are most likely to be found.'
                  },
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    className={`p-6 border-r border-[#1e3a5f] last:border-r-0 hover:bg-[#0d2847] hover:text-[#0a1929] transition-colors flex flex-col`}
                    variants={staggerItem}
                  >
                    <div className="text-[10px] uppercase opacity-50 mb-2">{stat.label}</div>
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-[8px] uppercase opacity-40 mb-3">{stat.sublabel}</div>
                    <div className="w-full h-1 bg-[#DF6C42]/20 overflow-hidden mb-3">
                      <div className="h-full bg-[#DF6C42]" style={{ width: `${stat.chart}%` }}></div>
                    </div>
                    <div className="text-[9px] opacity-60 leading-relaxed mt-auto">{stat.explanation}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Search Optimization Demo Section */}
      <section id="interactive-demo" className="relative border-t border-[#1e3a5f] bg-[#0a1929] z-10">
        <div className="grid grid-cols-12 divide-x divide-[#1e3a5f]">
          {/* Left Sidebar Spacer */}
          <div className="hidden lg:block col-span-1"></div>
          
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-11">
            <motion.div 
              className="px-10 py-16 border-b border-[#1e3a5f]"
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
                className="border border-[#1e3a5f] mb-6 relative overflow-hidden bg-[#0a1929]"
                style={{ height: '60vh', minHeight: '400px' }}
                variants={fadeInUp}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <CubeViewer />
                </div>
                
                {/* Visualization Legend */}
                <div className="absolute top-4 right-4 bg-[#0a1929]/90 border border-[#1e3a5f] p-4">
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

      {/* Future Extensions Section */}
      <section id="future-extensions" className="relative border-t border-[#1e3a5f] bg-[#0a1929] z-10">
        <div className="grid grid-cols-12 divide-x divide-[#1e3a5f]">
          {/* Left Sidebar Spacer */}
          <div className="hidden lg:block col-span-1"></div>
          
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-11">
            <motion.div 
              className="px-10 py-16 border-b border-[#1e3a5f]"
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
                  className="p-8 border-r border-b border-[#1e3a5f] lg:border-b-0 last:border-r-0 hover:bg-[#0d2847] hover:text-[#0a1929] transition-colors flex flex-col h-full"
                  variants={staggerItem}
                >
                  <h4 className="text-xl font-medium mb-3">Insurance Loss Assessment</h4>
                  <p className="text-sm opacity-70 leading-relaxed flex-1">
                    Recovered container condition data can support faster and more accurate insurance claim validation.
                  </p>
                </motion.div>
                
                <motion.div 
                  className="p-8 border-r border-b border-[#1e3a5f] lg:border-b-0 last:border-r-0 hover:bg-[#0d2847] hover:text-[#0a1929] transition-colors flex flex-col h-full"
                  variants={staggerItem}
                >
                  <h4 className="text-xl font-medium mb-3">Automated Recovery Planning</h4>
                  <p className="text-sm opacity-70 leading-relaxed flex-1">
                    Future versions could integrate additional environmental data to further refine search prioritization.
                  </p>
                </motion.div>
                
                <motion.div 
                  className="p-8 border-r border-b border-[#1e3a5f] lg:border-b-0 last:border-r-0 hover:bg-[#0d2847] hover:text-[#0a1929] transition-colors flex flex-col h-full"
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

      {/* Footer */}
      <footer id="visualize" className="relative border-t border-[#1e3a5f] bg-[#0a1929] z-10">
        <div className="grid grid-cols-12 divide-x divide-[#1e3a5f]">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-[#1e3a5f] pb-8 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <img src="/logo.png" alt="Mesh Logo" className="w-6 h-6 object-contain invert" />
                    <span className="text-sm font-medium">Mesh</span>
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
                    <a href="https://github.com/devp19/Mesh" target="_blank" rel="noopener noreferrer" className="text-xs opacity-70 hover:text-[#DF6C42] hover:opacity-100 transition-colors">
                      GitHub
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase opacity-50">
                <div>© 2025 Mesh. Built by <a href="https://www.linkedin.com/in/fenilshah05/" target="_blank" rel="noopener noreferrer" className="hover:text-[#DF6C42] transition-colors">Fenil Shah</a>, <a href="https://www.linkedin.com/in/devp19/" target="_blank" rel="noopener noreferrer" className="hover:text-[#DF6C42] transition-colors">Dev Patel</a>, <a href="https://www.linkedin.com/in/kushp4444/" target="_blank" rel="noopener noreferrer" className="hover:text-[#DF6C42] transition-colors">Kush Patel</a>.</div>
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
          <div className="relative bg-[#0a1929] border-2 border-[#1e3a5f] p-8 max-w-sm w-full">
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
    </div>
  );
}
