'use client';

/**
 * OceanCache Search Optimizer Dashboard
 * Main interface for probability-weighted container recovery search planning
 */

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { setCurrentStep } from '@/lib/mission-state';

import type {
  IncidentInput,
  SearchComparison as SearchComparisonType,
  ProbabilitySearchRequest,
  ProbabilitySearchResponse,
} from '@/models/SearchOptimization';

import IncidentInputForm from '@/components/IncidentInputForm';
import SearchComparison from '@/components/SearchComparison';
import ZoneLegend, { CompactLegend } from '@/components/ZoneLegend';

// Dynamically import 3D components to avoid SSR issues
const Canvas = dynamic(() => import('@react-three/fiber').then(mod => ({ default: mod.Canvas })), { ssr: false });
const OrbitControls = dynamic(() => import('@react-three/drei').then(mod => ({ default: mod.OrbitControls })), { ssr: false });
const PerspectiveCamera = dynamic(() => import('@react-three/drei').then(mod => ({ default: mod.PerspectiveCamera })), { ssr: false });
const ProbabilityHeatmap = dynamic(() => import('@/components/ProbabilityHeatmap').then(mod => ({ default: mod.default })), { ssr: false });
const HeatmapToggle = dynamic(() => import('@/components/ProbabilityHeatmap').then(mod => ({ default: mod.HeatmapToggle })), { ssr: false });
const MissionProgress = dynamic(() => import('@/components/mission/MissionProgress'), { ssr: false });
const MissionNavigation = dynamic(() => import('@/components/mission/MissionNavigation'), { ssr: false });

export default function SearchOptimizerPage() {
  // State
  const [searchMode, setSearchMode] = useState<'traditional' | 'optimized'>('optimized');
  const [comparisonData, setComparisonData] = useState<SearchComparisonType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);

  // Set mission step
  useEffect(() => {
    setCurrentStep(3);
  }, []);

  // Handle incident form submission
  const handleIncidentSubmit = useCallback(async (incident: IncidentInput) => {
    setLoading(true);
    setError(null);

    try {
      const requestBody: ProbabilitySearchRequest = {
        incident,
        searchRadius: 25, // km
        gridResolution: 100, // meters
        includeHistorical: true,
        useRealTimeData: false, // Use mock data for demo
      };

      const response = await fetch('/api/probability-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data: ProbabilitySearchResponse = await response.json();

      setComparisonData(data.comparison);
      setShowVisualization(true);
    } catch (err) {
      console.error('Error calculating search zones:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get active zones based on search mode
  const activeZones = comparisonData
    ? searchMode === 'traditional'
      ? comparisonData.traditional.zones
      : comparisonData.optimized.zones
    : [];

  // Reference point for 3D visualization (use incident location or Kelvin Seamounts)
  const referencePoint = comparisonData?.optimized.zones[0]?.centroid || {
    latitude: 37.5,
    longitude: -14.5,
    altitude: -2850,
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Navigation Header with Integrated Mission Progress */}
      <nav className="px-0 h-20 flex justify-between items-center border-b border-[#1e3a5f]" style={{ backgroundColor: 'rgba(5, 15, 26, 0.9)' }}>
        <div className="flex items-center h-full flex-1">
          <Link href="/" className="w-[134px] h-full flex items-center justify-center shrink-0 border-r border-[#1e3a5f] hover:bg-[#0d2847] transition-colors">
            <div className="w-10 h-10 flex items-center justify-center">
              <div className="w-6 h-6 border border-[#1e3a5f] rounded-sm"></div>
            </div>
          </Link>

          <div className="px-6 text-base font-bold uppercase tracking-[0.15em] text-white" style={{ textShadow: '0 0 5px rgba(255, 255, 255, 0.3)' }}>
            Search Optimizer
          </div>

          {/* Integrated Mission Progress */}
          <div className="flex-1 px-8">
            <MissionProgress currentStep={3} />
          </div>
        </div>

        <div className="flex items-center gap-4 px-6">
          <div className="text-[10px] uppercase text-white/40">
            System Status: <span className="text-[#00d9ff]">Active</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[calc(100vh-4rem)]">

        {/* Left Panel: Input Form + Legend */}
        <div className="lg:col-span-4 xl:col-span-3 border-r border-[#1e3a5f] overflow-y-auto">
          <div className="p-6 space-y-6">

            {/* Incident Input Form */}
            <IncidentInputForm
              onSubmit={handleIncidentSubmit}
              loading={loading}
            />

            {/* Zone Legend */}
            {showVisualization && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <ZoneLegend showProbabilities />
              </motion.div>
            )}

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border border-red-500 bg-red-500/10 p-4"
                >
                  <div className="text-xs font-semibold text-red-500 uppercase mb-2">
                    Error
                  </div>
                  <div className="text-xs text-white/80">{error}</div>
                  <button
                    onClick={() => setError(null)}
                    className="mt-3 text-[10px] uppercase text-white/60 hover:text-white"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Panel: 3D Visualization + Analytics */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col">

          {/* 3D Visualization Section */}
          <div className="flex-1 relative min-h-[60vh] bg-gradient-to-b from-black to-[#0a1f35]">

            {/* Loading Overlay */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#00d9ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <div className="text-sm uppercase text-[#00d9ff] tracking-wider">
                      Calculating Probability Zones...
                    </div>
                    <div className="text-xs text-white/60 mt-2">
                      Multi-factor spatial analysis in progress
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty State */}
            {!showVisualization && !loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center max-w-md px-6">
                  <div className="text-6xl mb-4">🌊</div>
                  <h2 className="text-2xl font-bold text-[#00d9ff] mb-2 uppercase">
                    Ready to Optimize
                  </h2>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Enter incident details in the form to generate probability-weighted search zones.
                    The system will calculate optimal recovery paths using multi-factor spatial analysis.
                  </p>
                </div>
              </div>
            )}

            {/* 3D Canvas */}
            {showVisualization && !loading && (
              <Canvas style={{ position: 'absolute', inset: 0 }}>
                  <PerspectiveCamera makeDefault position={[0, 500, 1000]} />
                  <OrbitControls
                    enablePan
                    enableZoom
                    enableRotate
                    maxPolarAngle={Math.PI / 2.2}
                    minDistance={100}
                    maxDistance={3000}
                  />

                  {/* Lighting */}
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[10, 10, 5]} intensity={1} />
                  <pointLight position={[0, 100, 0]} intensity={0.5} color="#00d9ff" />

                  {/* Ocean Floor */}
                  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -50, 0]}>
                    <planeGeometry args={[5000, 5000, 50, 50]} />
                    <meshStandardMaterial
                      color="#0a1f35"
                      wireframe={false}
                      roughness={0.8}
                      metalness={0.2}
                    />
                  </mesh>

                  {/* Probability Heatmap */}
                  <ProbabilityHeatmap
                    zones={activeZones}
                    referencePoint={referencePoint}
                    visible={true}
                    opacity={0.7}
                  />

                  {/* Grid Helper */}
                  <gridHelper args={[5000, 50, '#1e3a5f', '#1e3a5f']} position={[0, -45, 0]} />
                </Canvas>
            )}

            {/* 3D Controls Overlay */}
            {showVisualization && !loading && (
              <div className="absolute top-4 left-4 right-4 z-10 flex items-start justify-between">
                <div className="bg-black/80 backdrop-blur-sm border border-[#1e3a5f] p-3">
                  <HeatmapToggle mode={searchMode} onModeChange={setSearchMode} />
                </div>

                <div className="bg-black/80 backdrop-blur-sm border border-[#1e3a5f] p-3">
                  <CompactLegend />
                </div>
              </div>
            )}

            {/* 3D Controls Help */}
            {showVisualization && !loading && (
              <div className="absolute bottom-4 right-4 z-10 bg-black/80 backdrop-blur-sm border border-[#1e3a5f] p-3 text-[9px] text-white/60">
                <div>Left Click + Drag: Rotate</div>
                <div>Right Click + Drag: Pan</div>
                <div>Scroll: Zoom</div>
              </div>
            )}
          </div>

          {/* Analytics Comparison Section */}
          {showVisualization && comparisonData && !loading && (
            <div className="border-t border-[#1e3a5f] overflow-y-auto" style={{ maxHeight: '40vh' }}>
              <div className="p-6">
                <SearchComparison comparison={comparisonData} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mission Navigation */}
      <MissionNavigation
        currentStep={3}
        totalSteps={4}
        previousRoute="/simulation?mode=globe"
        nextRoute="/simulation?mode=underwater"
        nextLabel="Launch Dive Mission"
      />
    </div>
  );
}
