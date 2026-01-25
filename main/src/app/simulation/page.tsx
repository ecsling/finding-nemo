'use client';

import { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Globe, { SAMPLE_CONTAINERS, SAMPLE_SHIPS } from '@/components/Globe';
import type { ContainerData, HighlightedPoint } from '@/components/Globe';

// Incident location marker (Kelvin Seamounts area)
const INCIDENT_POINT: HighlightedPoint = {
  lat: 37.5,
  lon: -14.5,
  label: 'Incident Location',
  color: '#DF6C42',
};
import ContainerDataPanel from '@/components/simulation/ContainerDataPanel';
import CustomCursor from '@/components/CustomCursor';
import { setCurrentStep, getSelectedContainer, setSelectedContainer as saveContainer } from '@/lib/mission-state';
import dynamic from 'next/dynamic';

const UnderwaterScene = dynamic(
  () => import('@/components/simulation/UnderwaterScene'),
  { ssr: false }
);
const MissionProgress = dynamic(() => import('@/components/mission/MissionProgress'), { ssr: false });
const MissionNavigation = dynamic(() => import('@/components/mission/MissionNavigation'), { ssr: false });

type ViewMode = 'globe' | 'underwater';

export default function SimulationPage() {
  const searchParams = useSearchParams();
  const modeParam = searchParams?.get('mode') as ViewMode | null;

  const [viewMode, setViewMode] = useState<ViewMode>(modeParam || 'globe');
  const [selectedContainer, setSelectedContainer] = useState<ContainerData | null>(null);
  const [cursorMode, setCursorMode] = useState<'default' | 'container' | 'ship' | 'ocean'>(
    'default'
  );

  // Load saved container and set step based on mode
  useEffect(() => {
    const saved = getSelectedContainer();
    if (saved) {
      setSelectedContainer(saved);
    }

    // Set mission step based on mode
    if (viewMode === 'globe') {
      setCurrentStep(2);
    } else if (viewMode === 'underwater') {
      setCurrentStep(4);
    }
  }, [viewMode]);

  const handleContainerClick = (container: ContainerData) => {
    setSelectedContainer(container);
    saveContainer(container); // Persist to mission state
  };

  const handleDiveClick = () => {
    setViewMode('underwater');
    setCurrentStep(4);
  };

  const handleBackToGlobe = () => {
    setViewMode('globe');
    setSelectedContainer(null);
    setCurrentStep(2);
  };

  return (
    <div 
      className="min-h-screen text-white font-mono relative overflow-hidden"
      style={viewMode === 'globe' ? { background: '#E5E6DA' } : { background: '#000000' }}
    >
      {/* Custom Cursor */}
      <CustomCursor mode={cursorMode} />

      {/* Navigation Header with Integrated Mission Progress */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 px-0 h-20 flex justify-between items-center backdrop-blur-sm"
        style={
          viewMode === 'globe'
            ? {
                backgroundColor: 'rgba(220, 218, 200, 0.95)',
                borderBottom: '1px solid rgba(29, 30, 21, 0.08)',
              }
            : {
                backgroundColor: 'rgba(5, 15, 26, 0.9)',
                borderBottom: '1px solid rgba(0, 217, 255, 0.3)',
              }
        }
      >
        <div className="flex items-center h-full flex-1">
          <Link
            href="/"
            className="w-[134px] h-full flex items-center justify-center shrink-0 transition-colors"
            style={
              viewMode === 'globe'
                ? {
                    borderRight: '1px solid rgba(29, 30, 21, 0.08)',
                  }
                : {
                    borderRight: '1px solid rgba(30, 58, 95, 1)',
                  }
            }
            onMouseEnter={(e) => {
              if (viewMode === 'globe') {
                e.currentTarget.style.backgroundColor = 'rgba(29, 30, 21, 0.05)';
              } else {
                e.currentTarget.style.backgroundColor = 'rgba(13, 40, 71, 1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <div
                className="w-6 h-6 rounded-sm"
                style={
                  viewMode === 'globe'
                    ? {
                        border: '2px solid rgba(29, 30, 21, 0.2)',
                      }
                    : {
                        border: '1px solid rgba(30, 58, 95, 1)',
                      }
                }
              ></div>
            </div>
          </Link>

          <div
            className="px-6 text-base font-bold uppercase tracking-[0.15em]"
            style={
              viewMode === 'globe'
                ? {
                    color: '#1D1E15',
                  }
                : {
                    color: '#ffffff',
                    textShadow: '0 0 5px rgba(255, 255, 255, 0.3)',
                  }
            }
          >
            {viewMode === 'globe' ? 'Global Tracker' : 'Recovery Mission'}
          </div>

          {/* Integrated Mission Progress */}
          <div className="flex-1 px-8">
            <MissionProgress currentStep={viewMode === 'globe' ? 2 : 4} />
          </div>
        </div>

        <div className="flex items-center gap-6 px-6">
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
          <div
            className="flex items-center gap-4 text-[10px] uppercase"
            style={
              viewMode === 'globe'
                ? {
                    color: 'rgba(29, 30, 21, 0.7)',
                  }
                : {
                    color: 'rgba(255, 255, 255, 0.6)',
                  }
            }
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#DF6C42] rounded-full animate-pulse" />
              <span>{SAMPLE_CONTAINERS.filter((c) => c.status === 'floating').length} Drifting</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span>{SAMPLE_CONTAINERS.filter((c) => c.status === 'sunken').length} Sunken</span>
            </div>
          </div>

          <div
            className="text-[10px] uppercase"
            style={
              viewMode === 'globe'
                ? {
                    color: 'rgba(29, 30, 21, 0.5)',
                  }
                : {
                    color: 'rgba(255, 255, 255, 0.4)',
                  }
            }
          >
            System Status:{' '}
            <span
              style={
                viewMode === 'globe'
                  ? {
                      color: '#1D1E15',
                    }
                  : {
                      color: '#00d9ff',
                    }
              }
            >
              Active
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative min-h-screen pt-20">
        {/* Container Data Panel */}
        {viewMode === 'globe' && (
          <ContainerDataPanel
            container={selectedContainer}
            onClose={() => setSelectedContainer(null)}
            onDiveClick={handleDiveClick}
          />
        )}

        {/* 3D Canvas */}
        <div 
          className="absolute inset-0"
          style={
            viewMode === 'globe'
              ? {
                  background: 'linear-gradient(to bottom, #E5E6DA 0%, #D8D6C4 50%, #D0CEBC 100%)',
                  backgroundImage: 'radial-gradient(ellipse at center 45%, rgba(126, 200, 227, 0.12) 0%, rgba(126, 200, 227, 0.06) 30%, rgba(126, 200, 227, 0.02) 50%, transparent 70%)',
                }
              : {
                  background: 'linear-gradient(to bottom, #000000, #0a1f35)',
                }
          }
        >
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
                    highlightedPoint={INCIDENT_POINT}
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
            className="fixed right-6 top-24 backdrop-blur-md p-4 z-40"
            style={{
              backgroundColor: '#B8B6A4',
              border: '1px solid rgba(29, 30, 21, 0.15)',
            }}
          >
            <div className="text-[10px] text-[#1D1E15]/70 uppercase tracking-widest font-mono mb-4">
              Map Legend
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#DF6C42] rounded-full" />
                <span className="text-[#1D1E15]/90">Floating Container</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-[#1D1E15]/90">Sunken Container</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-[#00d9ff]" />
                <span className="text-[#1D1E15]/90">Ship Route</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-[#9B59B6]" />
                <span className="text-[#1D1E15]/90">Drift Trail</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 bg-[#00ff88]" />
                <span className="text-[#1D1E15]/90">Ocean Current</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Controls Help */}
        <div
          className="fixed bottom-6 right-6 z-40 backdrop-blur-sm p-3 text-[9px] font-mono"
          style={
            viewMode === 'globe'
              ? {
                  backgroundColor: '#B8B6A4',
                  border: '1px solid rgba(29, 30, 21, 0.15)',
                  color: 'rgba(29, 30, 21, 0.7)',
                }
              : {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(0, 217, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.6)',
                }
          }
        >
          <div>Left Click + Drag: Rotate</div>
          <div>Right Click + Drag: Pan</div>
          <div>Scroll: Zoom</div>
          <div
            className="mt-2"
            style={
              viewMode === 'globe'
                ? {
                    color: 'rgba(29, 30, 21, 0.85)',
                  }
                : {
                    color: '#00d9ff',
                  }
            }
          >
            Click container for details
          </div>
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

      {/* Mission Navigation */}
      {viewMode === 'globe' ? (
        <MissionNavigation
          currentStep={2}
          totalSteps={4}
          previousRoute="/dashboard"
          nextRoute="/dashboard/search-optimizer"
          nextLabel="Plan Search"
        />
      ) : (
        <MissionNavigation
          currentStep={4}
          totalSteps={4}
          previousRoute="/dashboard/search-optimizer"
        />
      )}
    </div>
  );
}