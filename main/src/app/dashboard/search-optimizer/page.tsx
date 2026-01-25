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
const HeatmapToggle = dynamic(() => import('@/components/ProbabilityHeatmap').then(mod => ({ default: mod.HeatmapToggle })), { ssr: false });
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
  const [showDriftTrack, setShowDriftTrack] = useState(true);
  const [showAssetRoute, setShowAssetRoute] = useState(true);
  const [showDepthBands, setShowDepthBands] = useState(true);
  const [showDepthRisk, setShowDepthRisk] = useState(true);
  const [showProbabilityField, setShowProbabilityField] = useState(true);
  const [driftHoursView, setDriftHoursView] = useState(48);
  const [driftPlaying, setDriftPlaying] = useState(false);
  const [assetProfile, setAssetProfile] = useState<'shallow' | 'mid' | 'deep'>('mid');
  const [sweptCells, setSweptCells] = useState<Record<string, boolean>>({});
  const [showSceneDetails, setShowSceneDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'coverage' | 'drift' | 'route'>('coverage');

  // Simulation state
  const [simulationPhase, setSimulationPhase] = useState<SimulationPhase>('idle');
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);

  // Set mission step
  useEffect(() => {
    setCurrentStep(3);
  }, []);

  useEffect(() => {
    if (incidentSnapshot?.estimatedTimeInWater) {
      setDriftHoursView(Math.min(incidentSnapshot.estimatedTimeInWater, DRIFT_MAX_HOURS));
    }
  }, [incidentSnapshot]);

  useEffect(() => {
    if (!driftPlaying) return;

    const interval = setInterval(() => {
      setDriftHoursView((prev) => (prev >= DRIFT_MAX_HOURS ? 0 : prev + 1));
    }, 250);

    return () => clearInterval(interval);
  }, [driftPlaying]);

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
    setSweptCells({});
    setDriftPlaying(false);
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

  const handleToggleCell = useCallback((cellId: string) => {
    setSweptCells((prev) => ({ ...prev, [cellId]: !prev[cellId] }));
  }, []);

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

  const sweptCount = Object.values(sweptCells).filter(Boolean).length;
  const coveragePercent = gridConfig.total > 0 ? (sweptCount / gridConfig.total) * 100 : 0;
  const etaHours = Math.max(gridConfig.total - sweptCount, 0) * CELL_SWEEP_HOURS;
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

            {showVisualization && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <ZoneLegend showProbabilities />
              </motion.div>
            )}

            {/* Probability Legend */}
            {showVisualization && showProbabilityField && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/80 backdrop-blur-sm border border-[#1D1E15]/10 p-4 rounded-xl"
              >
                <div className="text-[10px] uppercase text-[#1D1E15]/50 mb-3">Probability Distribution</div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-3 rounded-full overflow-hidden" style={{
                    background: 'linear-gradient(to right, rgba(59,130,246,0.1), rgba(239,68,68,0.8))'
                  }} />
                </div>
                <div className="flex justify-between text-[9px] text-[#1D1E15]/60">
                  <span>Low</span>
                  <span>High</span>
                </div>
                <div className="text-[9px] text-[#1D1E15]/40 mt-2">
                  Anisotropic Gaussian distribution based on current direction and drift uncertainty
                </div>
              </motion.div>
            )}

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
                <div className="text-center max-w-md px-6">
                  <div className="w-20 h-20 mx-auto mb-6 border-2 border-white/30 rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-white mb-2 uppercase tracking-wide">Ready to Optimize</h2>
                  <p className="text-sm text-white/80 leading-relaxed">Enter incident details on the left to generate probability-weighted search zones and simulate container descent.</p>
                </div>
              </div>
            )}

            {/* 3D Scene */}
            {showVisualization && !loading && (
              <Canvas style={{ position: 'absolute', inset: 0 }}>
                <color attach="background" args={['#5a9dc2']} />
                <fog attach="fog" args={['#5a9dc2', 800, 3200]} />
                <PerspectiveCamera makeDefault position={[0, 500, 1000]} />
                <OrbitControls enablePan enableZoom enableRotate maxPolarAngle={Math.PI / 2.2} minDistance={100} maxDistance={3000} target={[0, seaFloorY + 5, 0]} />
                <ambientLight intensity={0.9} />
                <hemisphereLight args={['#ffffff', '#5a9dc2', 0.6]} />
                <directionalLight position={[200, 300, 200]} intensity={1.1} castShadow />

                {/* Sea Floor with Terrain */}
                <SeaFloorTerrain
                  seaFloorY={seaFloorY}
                  radiusUnits={sceneRadiusUnits * 1.4}
                  showDepthBands={showDepthBands}
                  showDepthRisk={showDepthRisk}
                  assetMaxDepth={assetMaxDepth}
                />

                {/* Probability Field Visualization */}
                {showProbabilityField && (
                  <ProbabilityFieldMesh
                    seaFloorY={seaFloorY}
                    radiusUnits={sceneRadiusUnits}
                    incident={incidentSnapshot}
                    seededRandom={seededRandom}
                    searchMode={searchMode}
                  />
                )}

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
                    sweptCells={sweptCells}
                    onToggleCell={handleToggleCell}
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

                {/* Drift Track */}
                {showDriftTrack && (
                  <DriftTrack
                    incident={incidentSnapshot}
                    referencePoint={referencePoint}
                    driftHours={driftHoursView}
                    surfaceY={0}
                  />
                )}

                {/* Asset Route */}
                {showAssetRoute && comparisonData && (
                  <AssetRoute
                    comparison={comparisonData}
                    referencePoint={referencePoint}
                    surfaceY={seaFloorY + 6}
                    searchMode={searchMode}
                  />
                )}

                {/* Grid Helper */}
                <gridHelper args={[sceneRadiusUnits * 3, 40, '#ffffff40', '#ffffff20']} position={[0, seaFloorY + 2, 0]} />
              </Canvas>
            )}

            {/* Overlay Controls */}
            {showVisualization && !loading && (
              <>
                {/* Top Bar - Mode Toggle and Legend */}
                <div className="absolute top-4 left-4 right-4 z-10 flex items-start justify-between gap-4">
                  <div className="bg-white/90 backdrop-blur-sm border border-[#1D1E15]/10 p-3 rounded-xl shadow-lg">
                    <HeatmapToggle mode={searchMode} onModeChange={setSearchMode} />
                  </div>

                  {/* Simulation Progress */}
                  {isSimulationRunning && simulationPhase !== 'settled' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/90 backdrop-blur-sm border border-[#1D1E15]/10 px-4 py-2 rounded-xl shadow-lg"
                    >
                      <div className="text-[10px] uppercase text-[#1D1E15]/50 mb-1">
                        {simulationPhase === 'descending' ? 'Container Descent' : 'Drift Simulation'}
                      </div>
                      <div className="w-32 h-1.5 bg-[#1D1E15]/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-[#DF6C42] rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${simulationProgress * 100}%` }}
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="bg-white/90 backdrop-blur-sm border border-[#1D1E15]/10 p-3 rounded-xl shadow-lg">
                    <CompactLegend />
                  </div>
                </div>

                {/* Bottom HUD */}
                <div className="absolute bottom-4 left-4 right-4 z-10 flex gap-4">
                  {/* Main HUD Panel */}
                  <div className="flex-1 bg-white/90 backdrop-blur-sm border border-[#1D1E15]/10 rounded-xl shadow-lg overflow-hidden">
                    {/* Tab Navigation */}
                    <div className="flex border-b border-[#1D1E15]/10">
                      {[
                        { id: 'coverage', label: 'Coverage', icon: '◫' },
                        { id: 'drift', label: 'Drift', icon: '↝' },
                        { id: 'route', label: 'Route', icon: '⊙' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as typeof activeTab)}
                          className={`flex-1 px-4 py-2.5 text-[10px] uppercase tracking-wider transition-colors ${
                            activeTab === tab.id
                              ? 'bg-[#1D1E15] text-[#E5E6DA]'
                              : 'text-[#1D1E15]/60 hover:bg-[#1D1E15]/5'
                          }`}
                        >
                          <span className="mr-1.5">{tab.icon}</span>
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-4">
                      <AnimatePresence mode="wait">
                        {activeTab === 'coverage' && (
                          <motion.div
                            key="coverage"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                          >
                            <div className="grid grid-cols-4 gap-3 text-center">
                              {[
                                ['Cells Swept', `${sweptCount}/${gridConfig.total}`],
                                ['Coverage', `${coveragePercent.toFixed(0)}%`],
                                ['ETA Remaining', `${etaHours.toFixed(1)}h`],
                                ['Asset Profile', assetProfile.toUpperCase()],
                              ].map(([l, v]) => (
                                <div key={l} className="bg-[#1D1E15]/5 px-2 py-2 rounded-lg">
                                  <div className="text-[9px] text-[#1D1E15]/50 uppercase">{l}</div>
                                  <div className="text-sm font-semibold text-[#1D1E15]">{v}</div>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSweptCells({})}
                                className="flex-1 border border-[#1D1E15]/20 py-2 text-[10px] uppercase rounded-full hover:bg-[#1D1E15]/5 transition-colors"
                              >
                                Reset Grid
                              </button>
                              <select
                                value={assetProfile}
                                onChange={(e) => setAssetProfile(e.target.value as typeof assetProfile)}
                                className="bg-white border border-[#1D1E15]/20 px-3 py-2 text-[10px] uppercase rounded-full"
                              >
                                <option value="shallow">Shallow</option>
                                <option value="mid">Mid-Depth</option>
                                <option value="deep">Deep</option>
                              </select>
                            </div>
                          </motion.div>
                        )}

                        {activeTab === 'drift' && (
                          <motion.div
                            key="drift"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                          >
                            <div className="grid grid-cols-3 gap-3 text-center">
                              {[
                                ['Time Elapsed', `${driftHoursView.toFixed(0)}h`],
                                ['Current Speed', `${incidentSnapshot?.environmentalConditions?.oceanCurrents?.[0]?.speed?.toFixed(2) || '---'} m/s`],
                                ['Direction', `${incidentSnapshot?.environmentalConditions?.oceanCurrents?.[0]?.direction?.toFixed(0) || '---'}°`],
                              ].map(([l, v]) => (
                                <div key={l} className="bg-[#1D1E15]/5 px-2 py-2 rounded-lg">
                                  <div className="text-[9px] text-[#1D1E15]/50 uppercase">{l}</div>
                                  <div className="text-sm font-semibold text-[#1D1E15]">{v}</div>
                                </div>
                              ))}
                            </div>
                            <div className="space-y-2">
                              <input
                                type="range"
                                min={0}
                                max={DRIFT_MAX_HOURS}
                                value={driftHoursView}
                                onChange={(e) => setDriftHoursView(Number(e.target.value))}
                                className="w-full accent-[#1D1E15]"
                              />
                              <div className="flex justify-between text-[9px] text-[#1D1E15]/40">
                                <span>0h</span>
                                <span>{DRIFT_MAX_HOURS}h</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setDriftPlaying((p) => !p)}
                                className={`flex-1 py-2 text-[10px] uppercase rounded-full transition-colors ${
                                  driftPlaying
                                    ? 'bg-[#DF6C42] text-white'
                                    : 'border border-[#1D1E15]/20 hover:bg-[#1D1E15]/5'
                                }`}
                              >
                                {driftPlaying ? '⏸ Pause' : '▶ Play'} Drift
                              </button>
                              <button
                                onClick={resetSimulation}
                                className="flex-1 border border-[#1D1E15]/20 py-2 text-[10px] uppercase rounded-full hover:bg-[#1D1E15]/5 transition-colors"
                              >
                                ↺ Replay
                              </button>
                            </div>
                          </motion.div>
                        )}

                        {activeTab === 'route' && (
                          <motion.div
                            key="route"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                          >
                            <div className="grid grid-cols-3 gap-3 text-center">
                              {[
                                ['Total Distance', `${routeDistanceKm.toFixed(1)} km`],
                                ['Zones', `${activeZones.length}`],
                                ['Mode', searchMode.toUpperCase()],
                              ].map(([l, v]) => (
                                <div key={l} className="bg-[#1D1E15]/5 px-2 py-2 rounded-lg">
                                  <div className="text-[9px] text-[#1D1E15]/50 uppercase">{l}</div>
                                  <div className="text-sm font-semibold text-[#1D1E15]">{v}</div>
                                </div>
                              ))}
                            </div>
                            <div className="text-[10px] text-[#1D1E15]/60 leading-relaxed">
                              {searchMode === 'optimized'
                                ? 'Route optimized by probability weighting. High-probability zones searched first.'
                                : 'Traditional grid-based search pattern. Systematic coverage without probability optimization.'}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Toggle Buttons */}
                  <div className="bg-white/90 backdrop-blur-sm border border-[#1D1E15]/10 p-3 rounded-xl shadow-lg">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ['Grid', showGridPlanner, setShowGridPlanner],
                        ['Drift', showDriftTrack, setShowDriftTrack],
                        ['Route', showAssetRoute, setShowAssetRoute],
                        ['Prob', showProbabilityField, setShowProbabilityField],
                        ['Depth', showDepthBands, setShowDepthBands],
                        ['Risk', showDepthRisk, setShowDepthRisk],
                      ].map(([l, e, s]) => (
                        <TogglePill
                          key={l as string}
                          label={l as string}
                          enabled={e as boolean}
                          onToggle={() => (s as React.Dispatch<React.SetStateAction<boolean>>)((p) => !p)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Camera Controls Hint */}
                <div className="absolute bottom-4 right-4 z-10 bg-white/80 backdrop-blur-sm border border-[#1D1E15]/10 p-2.5 text-[9px] text-[#1D1E15]/50 rounded-lg hidden lg:block">
                  <div>Drag: Rotate</div>
                  <div>Right-drag: Pan</div>
                  <div>Scroll: Zoom</div>
                </div>
              </>
            )}
          </div>

          {/* Comparison Panel */}
          {showVisualization && comparisonData && !loading && (
            <div className="border-t border-[#1D1E15]/10 overflow-y-auto bg-[#E5E6DA]/60" style={{ maxHeight: '40vh' }}>
              <div className="p-6 space-y-6">
                <PlanningBrief incident={incidentSnapshot} comparison={comparisonData} activeMode={searchMode} />
                <SearchComparison comparison={comparisonData} />
              </div>
            </div>
          )}
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

  // Load container GLB model
  const { scene: containerModel } = useGLTF('/assets/shipping_container.glb');

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
    if (!containerRef.current || !anchor) return;

    const container = containerRef.current;

    if (simulationPhase === 'descending') {
      timeRef.current += delta;
      const progress = Math.min(timeRef.current / DESCENT_DURATION, 1);
      onProgress(progress);

      // Ease-out descent with slight tumble
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const y = THREE.MathUtils.lerp(50, seaFloorY + 15, easedProgress);

      // Add tumbling rotation during descent
      const tumbleX = Math.sin(timeRef.current * 2) * (1 - progress) * 0.3;
      const tumbleZ = Math.cos(timeRef.current * 1.5) * (1 - progress) * 0.2;

      container.position.set(anchor.x, y, anchor.z);
      container.rotation.set(tumbleX, timeRef.current * 0.5, tumbleZ);

      if (progress >= 1) {
        onPhaseChange('drifting');
        timeRef.current = 0;
      }
    } else if (simulationPhase === 'drifting') {
      timeRef.current += delta;
      const driftProgress = Math.min(timeRef.current / 3, 1);
      onProgress(driftProgress);

      // Add drift offset with noise
      const noiseIndex = Math.floor(timeRef.current * 10) % driftNoise.length;
      const noise = driftNoise[noiseIndex];

      const currentDir = incident?.environmentalConditions?.oceanCurrents?.[0]?.direction || 0;
      const currentSpeed = incident?.environmentalConditions?.oceanCurrents?.[0]?.speed || 0.5;

      const dirRad = degreesToRadians(currentDir);
      driftOffsetRef.current.x += Math.sin(dirRad) * currentSpeed * delta * 2 + noise.x * delta * 0.5;
      driftOffsetRef.current.z += Math.cos(dirRad) * currentSpeed * delta * 2 + noise.z * delta * 0.5;

      container.position.set(
        anchor.x + driftOffsetRef.current.x,
        seaFloorY + 15 + Math.sin(timeRef.current * 0.5) * 2,
        anchor.z + driftOffsetRef.current.z
      );

      // Gentle settling rotation
      container.rotation.x = Math.sin(timeRef.current * 0.3) * 0.1;
      container.rotation.z = Math.cos(timeRef.current * 0.4) * 0.08;

      if (driftProgress >= 1) {
        onPhaseChange('settled');
      }
    } else if (simulationPhase === 'settled') {
      // Settled on sea floor with gentle sway
      container.position.y = seaFloorY + 15 + Math.sin(state.clock.elapsedTime * 0.2) * 0.5;
      container.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.02;
      container.rotation.z = Math.cos(state.clock.elapsedTime * 0.15) * 0.015;
    }
  });

  if (!incident || !anchor) return null;

  return (
    <group ref={containerRef} position={[anchor.x, 50, anchor.z]}>
      <primitive object={containerModel.clone()} scale={12} />
      {/* Glow effect */}
      <pointLight color="#DF6C42" intensity={2} distance={100} />
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
        opacity={0.5}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function SeaFloorTerrain({ seaFloorY, radiusUnits, showDepthBands, showDepthRisk, assetMaxDepth }: { seaFloorY: number; radiusUnits: number; showDepthBands: boolean; showDepthRisk: boolean; assetMaxDepth: number }) {
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(radiusUnits * 2, radiusUnits * 2, 120, 120);
    const pos = plane.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const shallow = new THREE.Color('#7ec8e3'), deep = new THREE.Color('#2d6d96'), risk = new THREE.Color('#c45a3a');
    const amp = 320, baseD = Math.abs(seaFloorY * SCENE_SCALE);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const h = (Math.sin(x * 0.008) * 0.6 + Math.cos(y * 0.009) * 0.5 + Math.sin((x + y) * 0.006) * 0.4) * amp / SCENE_SCALE;
      pos.setZ(i, h);
      const d = Math.abs((seaFloorY + h) * SCENE_SCALE), n = Math.min(d / Math.max(baseD + amp, 1), 1);
      const c = deep.clone().lerp(shallow, (1 - n) * (showDepthBands ? 1 : 0.25));
      if (showDepthRisk && d > assetMaxDepth) c.lerp(risk, 0.65);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    plane.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    plane.computeVertexNormals();
    return plane;
  }, [radiusUnits, seaFloorY, showDepthRisk, assetMaxDepth, showDepthBands]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, seaFloorY, 0]} geometry={geometry}>
      <meshStandardMaterial vertexColors color="#2d6d96" emissive="#1a4a6e" emissiveIntensity={0.2} roughness={0.85} metalness={0.2} />
    </mesh>
  );
}

function SearchGrid({ cells, cellSize, seaFloorY, sweptCells, onToggleCell }: { cells: { id: string; x: number; z: number }[]; cellSize: number; seaFloorY: number; sweptCells: Record<string, boolean>; onToggleCell: (id: string) => void }) {
  return (
    <group>
      {cells.map((c) => (
        <mesh
          key={c.id}
          position={[c.x, seaFloorY, c.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerDown={(e) => { e.stopPropagation(); onToggleCell(c.id); }}
        >
          <planeGeometry args={[cellSize * 0.98, cellSize * 0.98]} />
          <meshBasicMaterial
            color={sweptCells[c.id] ? '#4ade80' : '#ffffff'}
            transparent
            opacity={sweptCells[c.id] ? 0.4 : 0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function DriftTrack({ incident, referencePoint, driftHours, surfaceY }: { incident: IncidentInput | null; referencePoint: GPSCoordinate; driftHours: number; surfaceY: number }) {
  const c = incident?.environmentalConditions?.oceanCurrents?.[0];
  const pts = useMemo(() => (!incident || !c || driftHours <= 0) ? [] : calculateDrift(incident.gpsCoordinates, c.speed, c.direction, driftHours, 12), [incident, c, driftHours]);
  const geo = useMemo(() => pts.length ? new THREE.BufferGeometry().setFromPoints(pts.map((p) => { const cart = gpsToCartesian(p, referencePoint, SCENE_SCALE); return new THREE.Vector3(cart.x, surfaceY + 6, cart.z); })) : null, [pts, referencePoint, surfaceY]);

  if (!geo || !pts.length) return null;

  const last = gpsToCartesian(pts[pts.length - 1], referencePoint, SCENE_SCALE);

  return (
    <group>
      <line geometry={geo}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </line>
      <mesh position={[last.x, surfaceY + 8, last.z]}>
        <sphereGeometry args={[6, 12, 12]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

function AssetRoute({ comparison, referencePoint, surfaceY, searchMode }: { comparison: SearchComparisonType; referencePoint: GPSCoordinate; surfaceY: number; searchMode: 'traditional' | 'optimized' }) {
  const routeData = searchMode === 'optimized' ? comparison.optimized : comparison.traditional;
  const pts = useMemo(() => {
    const m = new Map(routeData.zones.map((z) => [z.id, z]));
    return routeData.searchOrder.map((id) => m.get(id)?.centroid).filter((p): p is GPSCoordinate => Boolean(p));
  }, [routeData]);

  const geo = useMemo(() => pts.length < 2 ? null : new THREE.BufferGeometry().setFromPoints(pts.map((p) => {
    const c = gpsToCartesian(p, referencePoint, SCENE_SCALE);
    return new THREE.Vector3(c.x, surfaceY, c.z);
  })), [pts, referencePoint, surfaceY]);

  if (!geo) return null;

  const routeColor = searchMode === 'optimized' ? '#DF6C42' : '#6b7280';

  return (
    <group>
      <line geometry={geo}>
        <lineBasicMaterial color={routeColor} transparent opacity={0.7} />
      </line>
      {pts.map((p, i) => {
        const c = gpsToCartesian(p, referencePoint, SCENE_SCALE);
        return (
          <mesh key={i} position={[c.x, surfaceY + 2, c.z]}>
            <sphereGeometry args={[6, 12, 12]} />
            <meshStandardMaterial color={routeColor} emissive={routeColor} emissiveIntensity={0.4} />
          </mesh>
        );
      })}
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

// Preload GLB model
useGLTF.preload('/assets/shipping_container.glb');
