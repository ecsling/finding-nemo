'use client';

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Globe, { SAMPLE_CONTAINERS, SAMPLE_SHIPS } from '@/components/Globe';
import type { ContainerData } from '@/components/Globe';
import ContainerDataPanel from '@/components/simulation/ContainerDataPanel';
import CustomCursor from '@/components/CustomCursor';

// Dynamically import 3D components to avoid SSR issues
const Canvas = dynamic(
  () => import('@react-three/fiber').then((mod) => ({ default: mod.Canvas })),
  { ssr: false }
);
const OrbitControls = dynamic(
  () => import('@react-three/drei').then((mod) => ({ default: mod.OrbitControls })),
  { ssr: false }
);
const PerspectiveCamera = dynamic(
  () => import('@react-three/drei').then((mod) => ({ default: mod.PerspectiveCamera })),
  { ssr: false }
);
const UnderwaterScene = dynamic(
  () => import('@/components/simulation/UnderwaterScene'),
  { ssr: false }
);

type ViewMode = 'globe' | 'underwater';

export default function SimulationPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('globe');
  const [selectedContainer, setSelectedContainer] = useState<ContainerData | null>(null);
  const [cursorMode, setCursorMode] = useState<'default' | 'container' | 'ship' | 'ocean'>(
    'default'
  );

  const handleContainerClick = (container: ContainerData) => {
    setSelectedContainer(container);
  };

  const handleDiveClick = () => {
    setViewMode('underwater');
  };

  const handleBackToGlobe = () => {
    setViewMode('globe');
    setSelectedContainer(null);
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono relative overflow-hidden">
      {/* Custom Cursor */}
      <CustomCursor mode={cursorMode} />

      {/* Navigation Header */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 px-6 h-16 flex justify-between items-center border-b border-[#00d9ff]/30 backdrop-blur-md"
        style={{ backgroundColor: 'rgba(5, 15, 26, 0.9)' }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-[#00d9ff] hover:text-[#00d9ff]/80 text-sm uppercase transition-colors"
          >
            ← Home
          </Link>
          <div className="w-px h-6 bg-[#00d9ff]/30" />
          <h1 className="text-lg font-bold uppercase tracking-wider text-white">
            Live Cargo Tracker
          </h1>
        </div>

        <div className="flex items-center gap-6">
          {/* View Mode Toggle */}
          {viewMode === 'underwater' && (
            <button
              onClick={handleBackToGlobe}
              className="px-4 py-2 text-xs uppercase font-bold border border-[#00d9ff] text-[#00d9ff] hover:bg-[#00d9ff]/10 transition-all"
            >
              ← Back to Globe
            </button>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-[10px] uppercase text-white/60">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#DF6C42] rounded-full animate-pulse" />
              <span>{SAMPLE_CONTAINERS.filter((c) => c.status === 'floating').length} Drifting</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span>{SAMPLE_CONTAINERS.filter((c) => c.status === 'sunken').length} Sunken</span>
            </div>
          </div>

          <div className="text-[10px] uppercase text-white/40">
            System Status: <span className="text-[#00d9ff]">Active</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative min-h-screen pt-16">
        {/* Container Data Panel */}
        {viewMode === 'globe' && (
          <ContainerDataPanel
            container={selectedContainer}
            onClose={() => setSelectedContainer(null)}
            onDiveClick={handleDiveClick}
          />
        )}

        {/* 3D Canvas */}
        <div className="absolute inset-0 bg-gradient-to-b from-black to-[#0a1f35]">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-[#00d9ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <div className="text-sm uppercase text-[#00d9ff] tracking-wider">
                    Loading Simulation...
                  </div>
                </div>
              </div>
            }
          >
            <Canvas
              style={{ width: '100%', height: '100%' }}
              onPointerMissed={() => setCursorMode('ocean')}
            >
              {viewMode === 'globe' ? (
                <>
                  <PerspectiveCamera makeDefault position={[0, 0, 8]} />
                  <OrbitControls
                    enablePan
                    enableZoom
                    enableRotate
                    minDistance={3}
                    maxDistance={15}
                    autoRotate={!selectedContainer}
                    autoRotateSpeed={0.5}
                  />

                  {/* Lighting for globe */}
                  <ambientLight intensity={0.3} />
                  <directionalLight position={[5, 5, 5]} intensity={1} />
                  <pointLight position={[-5, -5, -5]} intensity={0.5} color="#00d9ff" />

                  {/* Globe Component */}
                  <Globe
                    containers={SAMPLE_CONTAINERS}
                    ships={SAMPLE_SHIPS}
                    onContainerClick={handleContainerClick}
                    autoRotate={!selectedContainer}
                    showCurrents
                  />
                </>
              ) : (
                <>
                  <PerspectiveCamera makeDefault position={[0, 2, 8]} />
                  <OrbitControls
                    enablePan
                    enableZoom
                    enableRotate
                    target={[0, 0, 0]}
                  />

                  {/* Underwater Scene */}
                  <UnderwaterScene
                    containerModelPath="/assets/shipping_container.glb"
                    seabedModelPath="/assets/kelvin_seamounts_atlantico_norte.glb"
                    depth={2850}
                    onContainerClick={() => {}}
                  />
                </>
              )}
            </Canvas>
          </Suspense>
        </div>

        {/* Legend Overlay */}
        {viewMode === 'globe' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed right-6 top-24 bg-black/90 backdrop-blur-md border border-[#00d9ff]/30 p-4 z-40"
            style={{ boxShadow: '0 0 20px rgba(0, 217, 255, 0.2)' }}
          >
            <div className="text-[10px] text-white/60 uppercase tracking-widest font-mono mb-4">
              Map Legend
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#DF6C42] rounded-full" />
                <span className="text-white/80">Floating Container</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-white/80">Sunken Container</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-[#00d9ff]" />
                <span className="text-white/80">Ship Route</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-[#9B59B6]" />
                <span className="text-white/80">Drift Trail</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-[#00ff88]" />
                <span className="text-white/80">Ocean Current</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Controls Help */}
        <div className="fixed bottom-6 right-6 z-40 bg-black/80 backdrop-blur-sm border border-[#00d9ff]/20 p-3 text-[9px] text-white/60 font-mono">
          <div>Left Click + Drag: Rotate</div>
          <div>Right Click + Drag: Pan</div>
          <div>Scroll: Zoom</div>
          <div className="mt-2 text-[#00d9ff]">Click container for details</div>
        </div>

        {/* Underwater Mode Data */}
        {viewMode === 'underwater' && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 left-6 bg-black/90 backdrop-blur-md border border-[#00d9ff]/30 p-6 z-40 max-w-md"
              style={{ boxShadow: '0 0 30px rgba(0, 217, 255, 0.3)' }}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#00d9ff]/20 border border-[#00d9ff] flex items-center justify-center text-[#00d9ff] font-bold">
                    3D
                  </div>
                  <div>
                    <div className="text-[10px] text-white/60 uppercase tracking-wider">
                      Underwater View
                    </div>
                    <div className="text-sm text-white font-bold">
                      {selectedContainer?.serialNumber || 'MAEU-123456-7'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-[#00d9ff]/5 p-2 border border-[#00d9ff]/20">
                    <div className="text-[9px] text-white/40">DEPTH</div>
                    <div className="text-sm text-white font-mono">2,850m</div>
                  </div>
                  <div className="bg-[#00d9ff]/5 p-2 border border-[#00d9ff]/20">
                    <div className="text-[9px] text-white/40">TEMP</div>
                    <div className="text-sm text-white font-mono">4°C</div>
                  </div>
                  <div className="bg-[#00d9ff]/5 p-2 border border-[#00d9ff]/20">
                    <div className="text-[9px] text-white/40">PRESSURE</div>
                    <div className="text-sm text-white font-mono">285 bar</div>
                  </div>
                </div>

                <div className="text-[9px] text-white/60 font-mono">
                  Location: Kelvin Seamounts, North Atlantic
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
