'use client';

/**
 * OceanCache Search Optimizer Dashboard
 * Premium simulation interface for probability-weighted container recovery search planning
 * Features: Container descent animation, probability fields, traditional vs optimized comparison
 */

import React, { useState, useCallback, useEffect, useMemo, useRef, Suspense, lazy } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { setCurrentStep } from '@/lib/mission-state';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

import type {
  IncidentInput,
  GPSCoordinate,
  SearchComparison as SearchComparisonType,
  ProbabilitySearchRequest,
  ProbabilitySearchResponse,
} from '@/models/SearchOptimization';
import { calculateDrift, degreesToRadians, gpsToCartesian, haversineDistance } from '@/lib/geo-utils';

import IncidentInputForm from '@/components/IncidentInputForm';
import SearchComparison from '@/components/SearchComparison';
import ZoneLegend, { CompactLegend } from '@/components/ZoneLegend';
import MouseTrail from '@/components/MouseTrail';

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({ default: mod.Dithering }))
);

// Dynamically import 3D components to avoid SSR issues
const Canvas = dynamic(() => import('@react-three/fiber').then(mod => ({ default: mod.Canvas })), { ssr: false });
const OrbitControls = dynamic(() => import('@react-three/drei').then(mod => ({ default: mod.OrbitControls })), { ssr: false });
const PerspectiveCamera = dynamic(() => import('@react-three/drei').then(mod => ({ default: mod.PerspectiveCamera })), { ssr: false });
const Environment = dynamic(() => import('@react-three/drei').then(mod => ({ default: mod.Environment })), { ssr: false });
const ProbabilityHeatmap = dynamic(() => import('@/components/ProbabilityHeatmap').then(mod => ({ default: mod.default })), { ssr: false });
const MissionProgress = dynamic(() => import('@/components/mission/MissionProgress'), { ssr: false });
const MissionNavigation = dynamic(() => import('@/components/mission/MissionNavigation'), { ssr: false });

const SEARCH_RADIUS_KM = 25;
const SCENE_SCALE = 10;
const MAX_DEPTH_UNITS = 160;
const GRID_SIZE = 9;
const CELL_SWEEP_HOURS = 0.5;
const DRIFT_MAX_HOURS = 96;
const DESCENT_DURATION = 10; // seconds for container to fall
const CONTAINER_SINK_SPEED = 0.8; // m/s terminal velocity

// Seeded random number generator based on container serial
class SeededRandom {
  private seed: number;

  constructor(containerSerial: string) {
    this.seed = this.hashString(containerSerial);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) || 1;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  gaussian(): number {
    const u1 = this.next();
    const u2 = this.next();
    return Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
  }
}

// Simulation state
type SimulationPhase = 'idle' | 'descending' | 'drifting' | 'settled';

export default function SearchOptimizerPage() {
  // State
  const [searchMode, setSearchMode] = useState<'traditional' | 'optimized'>('optimized');
  const [comparisonData, setComparisonData] = useState<SearchComparisonType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);
  const [incidentSnapshot, setIncidentSnapshot] = useState<IncidentInput | null>(null);
  const [showGridPlanner, setShowGridPlanner] = useState(true);
  const [showAssetRoute, setShowAssetRoute] = useState(true);
  const [showDepthBands, setShowDepthBands] = useState(true);
  const [showDepthRisk, setShowDepthRisk] = useState(true);
  const [showProbabilityField, setShowProbabilityField] = useState(true);
  const [driftHoursView] = useState(48);
  const [assetProfile] = useState<'shallow' | 'mid' | 'deep'>('mid');

  // Simulation state
  const [simulationPhase, setSimulationPhase] = useState<SimulationPhase>('idle');
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);

  // Set mission step
  useEffect(() => {
    setCurrentStep(3);
  }, []);

  // Start simulation when data is ready
  const startSimulation = useCallback(() => {
    setSimulationPhase('descending');
    setSimulationProgress(0);
    setIsSimulationRunning(true);
  }, []);

  // Handle incident form submission
  const handleIncidentSubmit = useCallback(async (incident: IncidentInput) => {
    setLoading(true);
    setError(null);
    setIncidentSnapshot(incident);
    setSimulationPhase('idle');

    try {
      const requestBody: ProbabilitySearchRequest = {
        incident,
        searchRadius: SEARCH_RADIUS_KM,
        gridResolution: 100,
        includeHistorical: true,
        useRealTimeData: false,
      };

      const response = await fetch('/api/probability-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(`API error: ${response.statusText}`);

      const data: ProbabilitySearchResponse = await response.json();
      setComparisonData(data.comparison);
      setShowVisualization(true);

      // Auto-start simulation after brief delay
      setTimeout(() => {
        startSimulation();
      }, 500);
    } catch (err) {
      console.error('Error calculating search zones:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [startSimulation]);


  const resetSimulation = useCallback(() => {
    setSimulationPhase('idle');
    setSimulationProgress(0);
    setIsSimulationRunning(false);
    setTimeout(() => startSimulation(), 100);
  }, [startSimulation]);

  const activeZones = comparisonData
    ? searchMode === 'traditional' ? comparisonData.traditional.zones : comparisonData.optimized.zones
    : [];

  const referencePoint = comparisonData?.optimized.zones[0]?.centroid || { latitude: 37.5, longitude: -14.5, altitude: -2850 };
  const depthMeters = incidentSnapshot?.gpsCoordinates?.altitude ? Math.abs(incidentSnapshot.gpsCoordinates.altitude) : 2000;
  const seaFloorY = -Math.min(depthMeters / SCENE_SCALE, MAX_DEPTH_UNITS);
  const sceneRadiusUnits = (SEARCH_RADIUS_KM * 1000) / SCENE_SCALE;

  const gridConfig = useMemo(() => {
    const cellSize = (sceneRadiusUnits * 2) / GRID_SIZE;
    const cells = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        cells.push({ id: `${row}-${col}`, row, col, x: -sceneRadiusUnits + cellSize * (col + 0.5), z: -sceneRadiusUnits + cellSize * (row + 0.5) });
      }
    }
    return { cellSize, cells, total: GRID_SIZE * GRID_SIZE };
  }, [sceneRadiusUnits]);

  const assetMaxDepth = assetProfile === 'shallow' ? 1200 : assetProfile === 'mid' ? 2500 : 4500;

  const routeDistanceKm = useMemo(() => {
    if (!comparisonData?.optimized.searchOrder?.length) return 0;
    const zoneMap = new Map(comparisonData.optimized.zones.map((z) => [z.id, z]));
    const points = comparisonData.optimized.searchOrder.map((id) => zoneMap.get(id)?.centroid).filter((p): p is GPSCoordinate => Boolean(p));
    return points.length < 2 ? 0 : points.slice(0, -1).reduce((d, p, i) => d + haversineDistance(p, points[i + 1]), 0) / 1000;
  }, [comparisonData]);

  // Get seeded random for current container
  const seededRandom = useMemo(() => {
    return new SeededRandom(incidentSnapshot?.containerSerialId || 'DEFAULT-123456-0');
  }, [incidentSnapshot?.containerSerialId]);

  return (
    <div className="min-h-screen bg-[#E5E6DA] text-[#1D1E15] font-mono">
      <MouseTrail />

      <Suspense fallback={null}>
        <div className="fixed inset-0 z-0 pointer-events-none opacity-20 mix-blend-multiply">
          <Dithering colorBack="#00000000" colorFront="#7ec8e3" shape="warp" type="4x4" speed={0.1} className="size-full" minPixelRatio={1} />
        </div>
      </Suspense>

      <nav className="px-0 h-20 flex justify-between items-center border-b border-[#1D1E15]/10 relative z-10 bg-[#E5E6DA]/80 backdrop-blur-sm">
        <div className="flex items-center h-full flex-1">
          <Link href="/" className="w-[134px] h-full flex items-center justify-center shrink-0 border-r border-[#1D1E15]/10 hover:bg-[#1D1E15]/5 transition-colors">
            <div className="w-6 h-6 border-2 border-[#1D1E15]/40 rounded-sm" />
          </Link>
          <div className="px-6 text-base font-bold uppercase tracking-[0.15em]">Search Optimizer</div>
          <div className="flex-1 px-8"><MissionProgress currentStep={3} /></div>
        </div>
        <div className="flex items-center gap-3 px-6">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </div>
          <div className="text-sm uppercase tracking-widest text-[#1D1E15]/70 font-medium">
            {simulationPhase === 'idle' ? 'Ready' : simulationPhase === 'descending' ? 'Simulating Descent' : simulationPhase === 'drifting' ? 'Simulating Drift' : 'Settled'}
          </div>
        </div>
      </nav>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[calc(100vh-5rem)] relative z-10">
        {/* Left Panel - Form and Legend */}
        <div className="lg:col-span-4 xl:col-span-3 border-r border-[#1D1E15]/10 overflow-y-auto bg-[#E5E6DA]/60 backdrop-blur-sm">
          <div className="p-6 space-y-6">
            <IncidentInputForm onSubmit={handleIncidentSubmit} loading={loading} />


            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border border-red-400 bg-red-50 p-4 rounded-xl">
                  <div className="text-xs font-semibold text-red-600 uppercase mb-2">Error</div>
                  <div className="text-xs text-red-800">{error}</div>
                  <button onClick={() => setError(null)} className="mt-3 text-[10px] uppercase text-red-600 hover:text-red-800">Dismiss</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Main 3D Viewport */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col">
          <div className="flex-1 relative min-h-[60vh] bg-gradient-to-b from-[#8fbcd4] via-[#5a9dc2] to-[#2d6d96] rounded-bl-3xl overflow-hidden">
            {/* Loading Overlay */}
            <AnimatePresence>
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#1D1E15] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <div className="text-sm uppercase text-[#1D1E15] tracking-wider font-medium">Calculating Probability Zones...</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty State */}
            {!showVisualization && !loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center max-w-lg px-6">
                  <div className="w-24 h-24 mx-auto mb-6 border-2 border-white/30 rounded-2xl flex items-center justify-center">
                    <svg className="w-12 h-12 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-semibold text-white mb-3 uppercase tracking-wide">3D Search Planner</h2>
                  <p className="text-base text-white/90 leading-relaxed mb-4">Enter incident details on the left to launch an interactive 3D simulation.</p>
                  <div className="text-sm text-white/70 leading-relaxed space-y-1">
                    <div>• Watch container descent animation</div>
                    <div>• See drift patterns and probability zones</div>
                    <div>• Plan optimal search routes</div>
                  </div>
                </div>
              </div>
            )}

            {/* 3D Scene */}
            {showVisualization && !loading && (
              <Canvas style={{ position: 'absolute', inset: 0 }}>
                <color attach="background" args={['#5a9dc2']} />
                <fog attach="fog" args={['#5a9dc2', 1000, 3500]} />
                {/* HARDCODED CLOSE camera looking directly at container */}
                <PerspectiveCamera makeDefault position={[250, 100, 250]} fov={60} />
                <OrbitControls 
                  enablePan 
                  enableZoom 
                  enableRotate 
                  target={[0, 0, 0]} 
                  enableDamping
                  dampingFactor={0.05}
                />
                {/* SUPER BRIGHT lighting to see the container */}
                <ambientLight intensity={3} />
                <directionalLight position={[500, 800, 400]} intensity={3} />
                <directionalLight position={[-500, 500, -400]} intensity={2} />
                <hemisphereLight args={['#ffffff', '#5a9dc2', 2]} />

                {/* Simple ocean floor */}
                <SeaFloorTerrain
                  seaFloorY={seaFloorY}
                  radiusUnits={sceneRadiusUnits * 1.2}
                  showDepthBands={false}
                  showDepthRisk={false}
                  assetMaxDepth={assetMaxDepth}
                />

                {/* Probability Heatmap (zone markers) */}
                <ProbabilityHeatmap
                  zones={activeZones}
                  referencePoint={referencePoint}
                  visible
                  opacity={0.7}
                  seaFloorY={seaFloorY + 2}
                  markerOffset={18}
                />

                {/* Search Grid */}
                {showGridPlanner && (
                  <SearchGrid
                    cells={gridConfig.cells}
                    cellSize={gridConfig.cellSize}
                    seaFloorY={seaFloorY + 1.5}
                  />
                )}

                {/* Container with Descent Animation */}
                <ContainerSimulation
                  incident={incidentSnapshot}
                  referencePoint={referencePoint}
                  seaFloorY={seaFloorY}
                  searchRadiusKm={SEARCH_RADIUS_KM}
                  driftHours={driftHoursView}
                  simulationPhase={simulationPhase}
                  onPhaseChange={setSimulationPhase}
                  onProgress={setSimulationProgress}
                  seededRandom={seededRandom}
                />

                {/* Removed drift track - cleaner visualization */}

                {/* Asset Route */}
                {showAssetRoute && comparisonData && (
                  <AssetRoute
                    comparison={comparisonData}
                    referencePoint={referencePoint}
                    surfaceY={seaFloorY + 6}
                    searchMode={searchMode}
                  />
                )}

                {/* Simple grid for reference */}
                <gridHelper args={[sceneRadiusUnits * 2, 20, '#ffffff', '#ffffff']} position={[0, seaFloorY + 5, 0]} material-opacity={0.15} material-transparent />
              </Canvas>
            )}

            {/* Overlay Controls */}
            {showVisualization && !loading && (
              <>
                {/* Top Bar - Simulation Progress */}
                <div className="absolute top-4 left-4 right-4 z-10 flex items-start justify-between gap-4">
                  {/* Simulation Progress - Compact */}
                  {isSimulationRunning && simulationPhase !== 'settled' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/80 backdrop-blur-sm border border-[#1D1E15]/10 px-2 py-1 rounded-lg shadow"
                    >
                      <div className="text-[8px] uppercase text-[#1D1E15]/50 mb-0.5">
                        {simulationPhase === 'descending' ? 'Descent' : 'Drifting'}
                      </div>
                      <div className="w-24 h-1 bg-[#1D1E15]/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-[#DF6C42] rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${simulationProgress * 100}%` }}
                        />
                      </div>
                    </motion.div>
                  )}

                </div>

                {/* Simplified HUD */}
                <div className="absolute bottom-4 left-4 right-4 z-10 flex gap-3">
                  {/* Main stats */}
                  <div className="flex-1 bg-white/90 backdrop-blur-sm border border-[#1D1E15]/10 px-4 py-3 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between gap-6">
                      <div className="text-center">
                        <div className="text-[9px] text-[#1D1E15]/50 uppercase">Status</div>
                        <div className="text-sm font-semibold text-[#1D1E15]">{simulationPhase === 'settled' ? 'Simulation Complete' : 'Running...'}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px] text-[#1D1E15]/50 uppercase">Search Area</div>
                        <div className="text-sm font-semibold text-[#1D1E15]">{comparisonData?.optimized.metrics.totalArea.toFixed(0) || '0'} km²</div>
                      </div>
                      <button
                        onClick={resetSimulation}
                        className="border border-[#1D1E15]/20 px-4 py-2 text-[10px] uppercase rounded-full hover:bg-[#1D1E15]/5 transition-colors"
                      >
                        ↺ Replay
                      </button>
                    </div>
                  </div>

                  {/* View toggles - Compact */}
                  <div className="bg-white/80 backdrop-blur-sm border border-[#1D1E15]/10 px-2 py-1.5 rounded-lg shadow">
                    <div className="flex gap-1.5">
                      {[
                        ['Grid', showGridPlanner, setShowGridPlanner],
                        ['Route', showAssetRoute, setShowAssetRoute],
                      ].map(([l, e, s]) => (
                        <button
                          key={l as string}
                          onClick={() => (s as React.Dispatch<React.SetStateAction<boolean>>)((p) => !p)}
                          className={`px-2 py-0.5 text-[8px] uppercase rounded transition-colors ${
                            e
                              ? 'bg-[#1D1E15] text-[#E5E6DA]'
                              : 'border border-[#1D1E15]/20 text-[#1D1E15]/50 hover:bg-[#1D1E15]/5'
                          }`}
                        >
                          {l as string}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Minimal controls hint */}
                <div className="absolute top-3 right-3 z-10 bg-white/70 backdrop-blur-sm border border-[#1D1E15]/10 px-2 py-1 text-[8px] text-[#1D1E15]/40 rounded">
                  <div>Drag • Scroll</div>
                </div>
                
                {/* Live Simulation Feed - Compact */}
                <div className="absolute left-3 top-20 z-20 w-52 max-h-[300px] overflow-y-auto bg-black/70 backdrop-blur-sm border border-cyan-400/20 rounded">
                  <div className="p-2">
                    <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-cyan-400/20">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                      <span className="text-cyan-400 text-[9px] font-mono uppercase tracking-wide">Live Feed</span>
                    </div>
                    
                    <div className="space-y-1 text-[9px] font-mono leading-tight">
                      <div className="text-gray-300">
                        <span className="text-cyan-400">[00:00]</span> Container lost overboard
                      </div>
                      <div className="text-gray-300">
                        <span className="text-cyan-400">[00:01]</span> Location: Kelvin Seamounts, North Atlantic
                      </div>
                      <div className="text-gray-300">
                        <span className="text-cyan-400">[00:02]</span> GPS: {incidentSnapshot?.gpsCoordinates?.latitude.toFixed(2)}°N, {incidentSnapshot?.gpsCoordinates?.longitude.toFixed(2)}°E
                      </div>
                      <div className="text-gray-300">
                        <span className="text-cyan-400">[00:03]</span> Serial: {incidentSnapshot?.containerSerialId}
                      </div>
                      <div className="text-gray-300">
                        <span className="text-cyan-400">[00:05]</span> Target Depth: {Math.abs(incidentSnapshot?.gpsCoordinates?.altitude || 0)}m
                      </div>
                      {/* Location Image Preview */}
                      <div className="mt-3 border-t border-cyan-400/20 pt-3">
                        <div className="text-[8px] text-cyan-400/70 uppercase tracking-wide mb-2">Seafloor Terrain</div>
                        <div className="relative w-full h-24 bg-black/40 rounded overflow-hidden border border-cyan-400/10">
                          <img 
                            src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=200&fit=crop&q=80" 
                            alt="Kelvin Seamounts seafloor" 
                            className="w-full h-full object-cover opacity-70"
                          />
                          <div className="absolute bottom-1 right-1 text-[7px] text-white/50 bg-black/60 px-1 rounded">Bathymetric Data</div>
                        </div>
                      </div>
                      {simulationPhase !== 'idle' && (
                        <>
                          <div className="text-yellow-400">
                            <span className="text-cyan-400">[00:15]</span> ⬇ Container descending through water column
                          </div>
                          <div className="text-gray-300">
                            <span className="text-cyan-400">[02:30]</span> ✓ Seafloor contact detected
                          </div>
                          <div className="text-gray-300">
                            <span className="text-cyan-400">[02:31]</span> Ocean Current: {incidentSnapshot?.environmentalConditions?.oceanCurrents?.[0]?.speed || 0.42} m/s @ {incidentSnapshot?.environmentalConditions?.oceanCurrents?.[0]?.direction || 85}°
                          </div>
                        </>
                      )}
                      {simulationPhase === 'drifting' && (
                        <>
                          <div className="text-yellow-400 animate-pulse">
                            <span className="text-cyan-400">[02:35]</span> ⚠ Container drifting in current
                          </div>
                          <div className="text-gray-300">
                            <span className="text-cyan-400">[02:40]</span> Water flow visible around cargo
                          </div>
                          <div className="text-gray-300">
                            <span className="text-cyan-400">[04:00]</span> Est. drift: ~{((incidentSnapshot?.environmentalConditions?.oceanCurrents?.[0]?.speed || 0.42) * (incidentSnapshot?.estimatedTimeInWater || 72) * 3.6).toFixed(0)}m from drop point
                          </div>
                        </>
                      )}
                      {simulationPhase === 'settled' && (
                        <>
                          <div className="text-green-400">
                            <span className="text-cyan-400">[{incidentSnapshot?.estimatedTimeInWater || 72}:00]</span> ✓ Container settled on seafloor
                          </div>
                          <div className="text-gray-300">
                            <span className="text-cyan-400">[{incidentSnapshot?.estimatedTimeInWater || 72}:05]</span> Total drift: ~{((incidentSnapshot?.environmentalConditions?.oceanCurrents?.[0]?.speed || 0.42) * (incidentSnapshot?.estimatedTimeInWater || 72) * 3.6).toFixed(0)}m
                          </div>
                          <div className="text-gray-300">
                            <span className="text-cyan-400">[{incidentSnapshot?.estimatedTimeInWater || 72}:15]</span> Final position locked
                          </div>
                          <div className="text-green-400 font-semibold">
                            <span className="text-cyan-400">[{incidentSnapshot?.estimatedTimeInWater || 72}:30]</span> ✓ Ready for search operations
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Environment stats - Compact */}
                    <div className="mt-2 pt-2 border-t border-cyan-400/20">
                      <div className="text-[8px] text-cyan-400/70 uppercase tracking-wide mb-1">Env</div>
                      <div className="grid grid-cols-2 gap-1 text-[8px]">
                        <div><span className="text-gray-500">Temp:</span> <span className="text-white ml-1">4°C</span></div>
                        <div><span className="text-gray-500">Vis:</span> <span className="text-white ml-1">3m</span></div>
                        <div><span className="text-gray-500">Size:</span> <span className="text-white ml-1">40ft</span></div>
                        <div><span className="text-gray-500">Wt:</span> <span className="text-white ml-1">30t</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </main>

      <MissionNavigation currentStep={3} totalSteps={4} previousRoute="/simulation?mode=globe" nextRoute="/simulation?mode=underwater" nextLabel="Launch Dive Mission" />
    </div>
  );
}

// Container model with descent and drift animation
function ContainerSimulation({
  incident,
  referencePoint,
  seaFloorY,
  searchRadiusKm,
  driftHours,
  simulationPhase,
  onPhaseChange,
  onProgress,
  seededRandom,
}: {
  incident: IncidentInput | null;
  referencePoint: GPSCoordinate;
  seaFloorY: number;
  searchRadiusKm: number;
  driftHours: number;
  simulationPhase: SimulationPhase;
  onPhaseChange: (phase: SimulationPhase) => void;
  onProgress: (progress: number) => void;
  seededRandom: SeededRandom;
}) {
  const containerRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const driftOffsetRef = useRef({ x: 0, z: 0 });

  // Load and clone shipping container GLB model
  const { scene: containerScene } = useGLTF('/assets/shipping_container.glb');
  const containerModel = useMemo(() => containerScene.clone(), [containerScene]);

  const anchor = useMemo(() =>
    incident ? gpsToCartesian(incident.gpsCoordinates, referencePoint, SCENE_SCALE) : null,
    [incident, referencePoint]
  );

  // Generate deterministic drift noise based on container serial
  const driftNoise = useMemo(() => {
    const noise = [];
    for (let i = 0; i < 100; i++) {
      noise.push({
        x: seededRandom.gaussian() * 5,
        z: seededRandom.gaussian() * 5,
      });
    }
    return noise;
  }, [seededRandom]);

  useFrame((state, delta) => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // HARDCODED: Keep container at origin, visible
    container.position.set(0, 0, 0);
    container.rotation.set(0, 0.5, 0);

    if (simulationPhase === 'descending') {
      timeRef.current += delta;
      const progress = Math.min(timeRef.current / DESCENT_DURATION, 1);
      onProgress(progress);

      if (progress >= 1) {
        onPhaseChange('drifting');
        timeRef.current = 0;
      }
    } else if (simulationPhase === 'drifting') {
      timeRef.current += delta;
      const driftProgress = Math.min(timeRef.current / 3, 1);
      onProgress(driftProgress);

      if (driftProgress >= 1) {
        onPhaseChange('settled');
      }
    }
  });

  if (!incident || !anchor) return null;

  return (
    <group ref={containerRef} position={[0, 0, 0]}>
      {/* GLB SHIPPING CONTAINER - Production Quality */}
      <primitive 
        object={containerModel} 
        scale={40}
        rotation={[0, Math.PI / 6, 0]}
        castShadow 
        receiveShadow 
      />
      
      {/* Container lighting */}
      <pointLight position={[0, 50, 0]} color="#FFFFFF" intensity={8} distance={200} decay={2} />
      <spotLight
        position={[100, 100, 100]}
        angle={0.4}
        penumbra={0.5}
        intensity={12}
        castShadow
        color="#FFFFFF"
      />
      
      {/* ENHANCED Water current particles - MORE VISIBLE */}
      <WaterCurrentParticles 
        position={[0, 0, 0]} 
        currentDirection={85}
        currentSpeed={0.42}
      />
      
      {/* ENHANCED Water stream lines - MORE VISIBLE */}
      <WaterStreamLines
        position={[0, 0, 0]}
        currentDirection={85}
      />
    </group>
  );
}

// Probability field visualization - Anisotropic Gaussian
function ProbabilityFieldMesh({
  seaFloorY,
  radiusUnits,
  incident,
  seededRandom,
  searchMode,
}: {
  seaFloorY: number;
  radiusUnits: number;
  incident: IncidentInput | null;
  seededRandom: SeededRandom;
  searchMode: 'traditional' | 'optimized';
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(radiusUnits * 2, radiusUnits * 2, 80, 80);
    const pos = plane.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 4);

    const currentDir = incident?.environmentalConditions?.oceanCurrents?.[0]?.direction || 0;
    const currentSpeed = incident?.environmentalConditions?.oceanCurrents?.[0]?.speed || 0.5;
    const driftTime = incident?.estimatedTimeInWater || 48;

    // Anisotropic parameters based on current
    const sigmaX = 0.3 + currentSpeed * 0.2;
    const sigmaY = 0.15 + (driftTime / 96) * 0.15;
    const rotation = degreesToRadians(currentDir);

    const highColor = new THREE.Color('#ef4444');
    const lowColor = new THREE.Color('#3b82f6');

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) / radiusUnits;
      const y = pos.getY(i) / radiusUnits;

      // Rotate coordinates by current direction
      const rotX = x * Math.cos(rotation) - y * Math.sin(rotation);
      const rotY = x * Math.sin(rotation) + y * Math.cos(rotation);

      // Anisotropic Gaussian
      const probability = Math.exp(-(rotX * rotX) / (2 * sigmaX * sigmaX) - (rotY * rotY) / (2 * sigmaY * sigmaY));

      // Add some noise for realism
      const noise = seededRandom.next() * 0.1;
      const finalProb = Math.min(Math.max(probability + noise - 0.05, 0), 1);

      const color = lowColor.clone().lerp(highColor, finalProb);
      colors[i * 4] = color.r;
      colors[i * 4 + 1] = color.g;
      colors[i * 4 + 2] = color.b;
      colors[i * 4 + 3] = finalProb * 0.6;
    }

    plane.setAttribute('color', new THREE.BufferAttribute(colors, 4));
    return plane;
  }, [radiusUnits, incident, seededRandom]);

  if (searchMode !== 'optimized') return null;

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, seaFloorY + 3, 0]}
      geometry={geometry}
    >
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.35}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function SeaFloorTerrain({ seaFloorY, radiusUnits, showDepthBands, showDepthRisk, assetMaxDepth }: { seaFloorY: number; radiusUnits: number; showDepthBands: boolean; showDepthRisk: boolean; assetMaxDepth: number }) {
  // Load the seabed GLB model
  const { scene: seabedScene } = useGLTF('/assets/kelvin_seamounts_atlantico_norte.glb');
  const seabedModel = useMemo(() => {
    const cloned = seabedScene.clone();
    // Make materials darker and more subtle
    cloned.traverse((child: any) => {
      if (child.isMesh) {
        child.receiveShadow = true;
        if (child.material) {
          child.material = child.material.clone();
          child.material.color.multiplyScalar(0.4); // Darker
          child.material.roughness = 0.95;
          child.material.metalness = 0.05;
        }
      }
    });
    return cloned;
  }, [seabedScene]);

  return (
    <group>
      {/* HUGE seabed GLB model for diorama effect */}
      <primitive 
        object={seabedModel} 
        scale={800} 
        position={[0, seaFloorY - 100, 0]} 
        rotation={[0, Math.PI / 4, 0]}
      />
      
      {/* Backup flat plane to ensure coverage */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, seaFloorY - 50, 0]} receiveShadow>
        <planeGeometry args={[radiusUnits * 4, radiusUnits * 4]} />
        <meshStandardMaterial 
          color="#0d1f28" 
          roughness={0.95} 
          metalness={0}
        />
      </mesh>
    </group>
  );
}

function SearchGrid({ cells, cellSize, seaFloorY }: { cells: { id: string; x: number; z: number }[]; cellSize: number; seaFloorY: number }) {
  return (
    <group>
      {cells.map((c) => (
        <mesh
          key={c.id}
          position={[c.x, seaFloorY + 0.5, c.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[cellSize * 0.96, cellSize * 0.96]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.08}
            side={THREE.DoubleSide}
          />
          {/* Border lines */}
          <lineSegments>
            <edgesGeometry attach="geometry" args={[new THREE.PlaneGeometry(cellSize * 0.96, cellSize * 0.96)]} />
            <lineBasicMaterial 
              attach="material" 
              color="#ffffff" 
              transparent 
              opacity={0.2} 
            />
          </lineSegments>
        </mesh>
      ))}
    </group>
  );
}

// DriftTrack component removed - no longer needed

function AssetRoute({ comparison, referencePoint, surfaceY, searchMode }: { comparison: SearchComparisonType; referencePoint: GPSCoordinate; surfaceY: number; searchMode: 'traditional' | 'optimized' }) {
  const routeData = searchMode === 'optimized' ? comparison.optimized : comparison.traditional;
  const pts = useMemo(() => {
    const m = new Map(routeData.zones.map((z) => [z.id, z]));
    return routeData.searchOrder.map((id) => m.get(id)?.centroid).filter((p): p is GPSCoordinate => Boolean(p));
  }, [routeData]);

  const routeColor = searchMode === 'optimized' ? '#DF6C42' : '#888888';

  const routeLine = useMemo(() => {
    if (pts.length < 2) return null;
    const geo = new THREE.BufferGeometry().setFromPoints(pts.map((p) => {
      const c = gpsToCartesian(p, referencePoint, SCENE_SCALE);
      return new THREE.Vector3(c.x, surfaceY, c.z);
    }));
    const mat = new THREE.LineBasicMaterial({ color: routeColor, transparent: true, opacity: 0.7, linewidth: 2 });
    return new THREE.Line(geo, mat);
  }, [pts, referencePoint, surfaceY, routeColor]);

  if (!routeLine) return null;

  return (
    <group>
      {/* Clean route line only - no spheres */}
      <primitive object={routeLine} />
    </group>
  );
}

function TogglePill({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`px-2.5 py-1.5 text-[9px] uppercase rounded-full transition-colors ${
        enabled
          ? 'bg-[#1D1E15] text-[#E5E6DA]'
          : 'border border-[#1D1E15]/20 text-[#1D1E15]/50 hover:bg-[#1D1E15]/5'
      }`}
    >
      {label}
    </button>
  );
}

function PlanningBrief({ incident, comparison, activeMode }: { incident: IncidentInput | null; comparison: SearchComparisonType; activeMode: string }) {
  const routeData = activeMode === 'optimized' ? comparison.optimized : comparison.traditional;
  const total = Math.max(routeData.metrics.totalArea, 0.001);
  const shares = {
    high: routeData.metrics.zoneCoverage.high / total,
    medium: routeData.metrics.zoneCoverage.medium / total,
    low: routeData.metrics.zoneCoverage.low / total
  };
  const depth = incident?.gpsCoordinates?.altitude ? Math.abs(incident.gpsCoordinates.altitude) : undefined;
  const drift = incident?.estimatedTimeInWater;
  const spd = incident?.environmentalConditions?.oceanCurrents?.[0]?.speed;
  const dir = incident?.environmentalConditions?.oceanCurrents?.[0]?.direction;
  const risks = getRiskFlags({ incidentDepth: depth, driftHours: drift, currentSpeed: spd, cargoValue: incident?.cargoValue });
  const assets = getRecommendedAssets(depth);
  const zones = routeData.searchOrder.slice(0, 3).map(formatZoneId);

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-[#1D1E15]/10 p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase text-[#1D1E15]/50">Planning Brief</div>
          <div className="text-lg font-semibold uppercase tracking-wide">Mission Snapshot</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-[10px] uppercase ${
            activeMode === 'optimized'
              ? 'bg-[#DF6C42]/10 text-[#DF6C42] border border-[#DF6C42]/20'
              : 'bg-[#1D1E15]/10 text-[#1D1E15]/70 border border-[#1D1E15]/20'
          }`}>
            {activeMode}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="border border-[#1D1E15]/10 p-4 rounded-xl bg-[#1D1E15]/5">
          <div className="text-[10px] uppercase text-[#1D1E15]/50 mb-3">Incident</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              ['Lat', incident?.gpsCoordinates?.latitude?.toFixed(3)],
              ['Lon', incident?.gpsCoordinates?.longitude?.toFixed(3)],
              ['Depth', depth ? `${depth.toFixed(0)} m` : null],
              ['Time', drift ? `${drift.toFixed(0)} hrs` : null],
              ['Current', spd ? `${spd.toFixed(2)} m/s` : null],
              ['Dir', dir ? `${dir.toFixed(0)}°` : null]
            ].map(([l, v]) => (
              <div key={l}>
                <div className="text-[9px] text-[#1D1E15]/40">{l}</div>
                <div className="font-medium">{v ?? '---'}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="border border-[#1D1E15]/10 p-4 rounded-xl bg-[#1D1E15]/5">
          <div className="text-[10px] uppercase text-[#1D1E15]/50 mb-3">Plan</div>
          <div className="space-y-2 text-xs">
            {[
              ['Area', `${routeData.metrics.totalArea.toFixed(1)} km²`],
              ['Probability', `${(routeData.metrics.recoveryProbability * 100).toFixed(0)}%`, 'text-[#DF6C42] font-semibold'],
              ['ETA', `${routeData.metrics.estimatedDuration.toFixed(1)} days`],
              ['Budget', formatCurrency(routeData.metrics.estimatedCost)]
            ].map(([l, v, c]) => (
              <div key={l} className="flex justify-between">
                <span className="text-[#1D1E15]/60">{l}</span>
                <span className={c || 'font-medium'}>{v}</span>
              </div>
            ))}
            <div>
              <div className="text-[9px] text-[#1D1E15]/40 mb-1">Zone Order</div>
              <div className="text-[10px] text-[#1D1E15]/70">{zones.length ? zones.join(' → ') : 'Auto-generated'}</div>
            </div>
          </div>
        </div>
        <div className="border border-[#1D1E15]/10 p-4 rounded-xl bg-[#1D1E15]/5">
          <div className="text-[10px] uppercase text-[#1D1E15]/50 mb-3">Risks</div>
          <div className="space-y-2 text-xs">
            {risks.length ? risks.map((f) => (
              <div key={f} className="border border-[#DF6C42]/30 bg-[#DF6C42]/10 px-2 py-1 rounded-lg text-[#DF6C42]">{f}</div>
            )) : <div className="text-[#1D1E15]/60">No elevated risks.</div>}
          </div>
          <div className="mt-4">
            <div className="text-[10px] uppercase text-[#1D1E15]/50 mb-2">Assets</div>
            <div className="flex flex-wrap gap-2 text-[9px]">
              {assets.map((a) => (
                <span key={a} className="border border-[#1D1E15]/15 px-2 py-1 rounded-full bg-white">{a}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="border border-[#1D1E15]/10 mt-5 p-4 rounded-xl bg-[#1D1E15]/5">
        <div className="text-[10px] uppercase text-[#1D1E15]/50 mb-3">Mission Phases</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            ['Phase 1', '#ef4444', 'High Priority', shares.high],
            ['Phase 2', '#eab308', 'Medium Priority', shares.medium],
            ['Phase 3', '#3b82f6', 'Low Priority', shares.low]
          ].map(([l, c, t, s]) => (
            <PhaseCard
              key={l as string}
              label={l as string}
              accent={c as string}
              title={t as string}
              durationDays={routeData.metrics.estimatedDuration * (s as number)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PhaseCard({ label, accent, title, durationDays }: { label: string; accent: string; title: string; durationDays: number }) {
  return (
    <div className="border border-[#1D1E15]/10 p-3 rounded-xl bg-white">
      <div className="flex justify-between mb-2 text-[10px] uppercase">
        <span className="text-[#1D1E15]/60">{label}</span>
        <span>{durationDays > 0 ? `${durationDays.toFixed(1)} days` : '---'}</span>
      </div>
      <div className="h-1.5 w-full bg-[#1D1E15]/10 rounded-full mb-2 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: '100%', backgroundColor: accent }} />
      </div>
      <div className="text-xs font-medium">{title}</div>
    </div>
  );
}

function getRiskFlags({ incidentDepth, driftHours, currentSpeed, cargoValue }: { incidentDepth?: number; driftHours?: number; currentSpeed?: number; cargoValue?: number }) {
  const f: string[] = [];
  if (incidentDepth && incidentDepth > 3000) f.push('Deep recovery (>3000 m)');
  if (driftHours && driftHours > 72) f.push('Extended drift (>72 hrs)');
  if (currentSpeed && currentSpeed > 1.2) f.push('High current (>1.2 m/s)');
  if (cargoValue && cargoValue > 1000000) f.push('High-value cargo');
  return f;
}

function getRecommendedAssets(d?: number) {
  if (!d) return ['ROV', 'Multibeam sonar', 'Support vessel'];
  if (d > 2500) return ['Heavy ROV', 'AUV sweep', 'DP vessel'];
  if (d > 1000) return ['Mid-depth ROV', 'Side-scan', 'Survey vessel'];
  return ['Shallow ROV', 'Tow sonar', 'Fast boat'];
}

function formatZoneId(id: string) {
  return id.startsWith('zone-') ? `Z${id.replace('zone-', '')}` : id.toUpperCase();
}

function formatCurrency(v: number) {
  return v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${v.toFixed(0)}`;
}

// Water stream lines showing current flow
function WaterStreamLines({ position, currentDirection }: { position: [number, number, number]; currentDirection: number }) {
  const streamCount = 32; // MASSIVE stream lines for professional look
  const dirRad = degreesToRadians(currentDirection);
  
  const streamLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i < streamCount; i++) {
      const angle = (i / streamCount) * Math.PI * 2;
      const radius = 35 + (i % 3) * 15;
      const startX = Math.cos(angle) * radius;
      const startZ = Math.sin(angle) * radius;
      const endX = startX + Math.sin(dirRad) * 120;
      const endZ = startZ + Math.cos(dirRad) * 120;
      
      const points = [
        new THREE.Vector3(startX, (i % 4 - 2) * 12, startZ),
        new THREE.Vector3(endX, (i % 4 - 2) * 12, endZ),
      ];
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: "#00E5FF", transparent: true, opacity: 0.6, linewidth: 3 });
      lines.push(new THREE.Line(geometry, material));
    }
    return lines;
  }, [dirRad]);
  
  return (
    <group position={position}>
      {streamLines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  );
}

// Water current particles around container
function WaterCurrentParticles({ position, currentDirection, currentSpeed }: { position: [number, number, number]; currentDirection: number; currentSpeed: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 1500; // MORE particles for full wrap-around effect
  
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    const dirRad = degreesToRadians(currentDirection);
    
    for (let i = 0; i < particleCount; i++) {
      // Wrap particles COMPLETELY around the entire container - 360° coverage
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 100; // Closer to container, wider spread
      const height = (Math.random() - 0.5) * 80; // Full height coverage of container
      
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      
      // Dynamic flow velocity - creates motion effect
      velocities[i * 3] = Math.sin(dirRad) * currentSpeed * 5;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      velocities[i * 3 + 2] = Math.cos(dirRad) * currentSpeed * 5;
    }
    
    return { positions, velocities };
  }, [currentDirection, currentSpeed]);
  
  useFrame((state, delta) => {
    if (!particlesRef.current) return;
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const { velocities } = particles;
    
    for (let i = 0; i < particleCount; i++) {
      // Update particle positions based on velocity
      positions[i * 3] += velocities[i * 3] * delta * 15;
      positions[i * 3 + 1] += velocities[i * 3 + 1] * delta * 15;
      positions[i * 3 + 2] += velocities[i * 3 + 2] * delta * 15;
      
      // Reset particles that drift too far
      const distSq = positions[i * 3] ** 2 + positions[i * 3 + 2] ** 2;
      if (distSq > 15000) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 30 + Math.random() * 40;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(particles.positions, 3));
    return geo;
  }, [particles.positions]);

  return (
    <points ref={particlesRef} position={position} geometry={geometry}>
      <pointsMaterial
        size={5}
        color="#00E5FF"
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Preload GLB models
useGLTF.preload('/assets/shipping_container.glb');
useGLTF.preload('/assets/kelvin_seamounts_atlantico_norte.glb');
