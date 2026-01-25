'use client';

/**
 * OceanCache Search Optimizer Dashboard
 * Main interface for probability-weighted container recovery search planning
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { setCurrentStep } from '@/lib/mission-state';
import * as THREE from 'three';

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

// Dynamically import 3D components to avoid SSR issues
const Canvas = dynamic(() => import('@react-three/fiber').then(mod => ({ default: mod.Canvas })), { ssr: false });
const OrbitControls = dynamic(() => import('@react-three/drei').then(mod => ({ default: mod.OrbitControls })), { ssr: false });
const PerspectiveCamera = dynamic(() => import('@react-three/drei').then(mod => ({ default: mod.PerspectiveCamera })), { ssr: false });
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
  const [driftHoursView, setDriftHoursView] = useState(48);
  const [driftPlaying, setDriftPlaying] = useState(false);
  const [assetProfile, setAssetProfile] = useState<'shallow' | 'mid' | 'deep'>('mid');
  const [sweptCells, setSweptCells] = useState<Record<string, boolean>>({});
  const [showSceneDetails, setShowSceneDetails] = useState(false);

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

  // Handle incident form submission
  const handleIncidentSubmit = useCallback(async (incident: IncidentInput) => {
    setLoading(true);
    setError(null);
    setIncidentSnapshot(incident);
    setSweptCells({});
    setDriftPlaying(false);

    try {
      const requestBody: ProbabilitySearchRequest = {
        incident,
        searchRadius: SEARCH_RADIUS_KM,
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

  const handleToggleCell = useCallback((cellId: string) => {
    setSweptCells((prev) => ({
      ...prev,
      [cellId]: !prev[cellId],
    }));
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
  const depthMeters = incidentSnapshot?.gpsCoordinates?.altitude
    ? Math.abs(incidentSnapshot.gpsCoordinates.altitude)
    : 2000;
  const seaFloorY = -Math.min(depthMeters / SCENE_SCALE, MAX_DEPTH_UNITS);
  const sceneRadiusUnits = (SEARCH_RADIUS_KM * 1000) / SCENE_SCALE;

  const gridConfig = useMemo(() => {
    const cellSize = (sceneRadiusUnits * 2) / GRID_SIZE;
    const cells = [];
    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        const x = -sceneRadiusUnits + cellSize * (col + 0.5);
        const z = -sceneRadiusUnits + cellSize * (row + 0.5);
        cells.push({
          id: `${row}-${col}`,
          row,
          col,
          x,
          z,
        });
      }
    }
    return { cellSize, cells, total: GRID_SIZE * GRID_SIZE };
  }, [sceneRadiusUnits]);

  const sweptCount = Object.values(sweptCells).filter(Boolean).length;
  const coveragePercent = gridConfig.total > 0 ? (sweptCount / gridConfig.total) * 100 : 0;
  const remainingCells = Math.max(gridConfig.total - sweptCount, 0);
  const etaHours = remainingCells * CELL_SWEEP_HOURS;

  const assetMaxDepth = assetProfile === 'shallow' ? 1200 : assetProfile === 'mid' ? 2500 : 4500;

  const routeDistanceKm = useMemo(() => {
    if (!comparisonData?.optimized.searchOrder || comparisonData.optimized.searchOrder.length === 0) return 0;
    const zoneMap = new Map(comparisonData.optimized.zones.map((zone) => [zone.id, zone]));
    const points = comparisonData.optimized.searchOrder
      .map((id) => zoneMap.get(id)?.centroid)
      .filter((point): point is GPSCoordinate => Boolean(point));
    if (points.length < 2) return 0;
    let distance = 0;
    for (let i = 0; i < points.length - 1; i += 1) {
      distance += haversineDistance(points[i], points[i + 1]);
    }
    return distance / 1000;
  }, [comparisonData]);

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
          <div className="flex-1 relative min-h-[60vh] bg-gradient-to-b from-[#0b1f31] via-[#0e2a40] to-[#14384f]">

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
                  <div className="text-3xl tracking-[0.4em] text-white/50 mb-4">OCEAN</div>
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
                  <color attach="background" args={['#0b2235']} />
                  <fog attach="fog" args={['#0b2235', 800, 3200]} />
                  <PerspectiveCamera makeDefault position={[0, 500, 1000]} />
                  <OrbitControls
                    enablePan
                    enableZoom
                    enableRotate
                    maxPolarAngle={Math.PI / 2.2}
                    minDistance={100}
                    maxDistance={3000}
                    target={[0, seaFloorY + 5, 0]}
                  />

                  {/* Lighting */}
                  <ambientLight intensity={0.8} />
                  <hemisphereLight args={['#8fbcd4', '#0b2235', 0.6]} />
                  <directionalLight position={[200, 300, 200]} intensity={1.1} />
                  <pointLight position={[0, 180, 0]} intensity={0.7} color="#00d9ff" />

                  {/* Ocean Floor */}
                  <SeaFloorTerrain
                    seaFloorY={seaFloorY}
                    radiusUnits={sceneRadiusUnits * 1.4}
                    showDepthBands={showDepthBands}
                    showDepthRisk={showDepthRisk}
                    assetMaxDepth={assetMaxDepth}
                  />

                  {/* Probability Heatmap */}
                  <ProbabilityHeatmap
                    zones={activeZones}
                    referencePoint={referencePoint}
                    visible={true}
                    opacity={0.7}
                    seaFloorY={seaFloorY + 2}
                    markerOffset={18}
                  />

                  {showGridPlanner && (
                    <SearchGrid
                      cells={gridConfig.cells}
                      cellSize={gridConfig.cellSize}
                      seaFloorY={seaFloorY + 1.5}
                      sweptCells={sweptCells}
                      onToggleCell={handleToggleCell}
                    />
                  )}

                  <IncidentOverlay
                    incident={incidentSnapshot}
                    referencePoint={referencePoint}
                    seaFloorY={seaFloorY}
                    searchRadiusKm={SEARCH_RADIUS_KM}
                    driftHours={driftHoursView}
                  />

                  {showDriftTrack && (
                    <DriftTrack
                      incident={incidentSnapshot}
                      referencePoint={referencePoint}
                      driftHours={driftHoursView}
                      surfaceY={0}
                    />
                  )}

                  {showAssetRoute && comparisonData && (
                    <AssetRoute
                      comparison={comparisonData}
                      referencePoint={referencePoint}
                      surfaceY={seaFloorY + 6}
                    />
                  )}

                  {/* Grid Helper */}
                  <gridHelper args={[sceneRadiusUnits * 3, 40, '#2b5575', '#1e3a5f']} position={[0, seaFloorY + 2, 0]} />
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

            {showVisualization && !loading && (
              <div className="absolute bottom-4 left-4 z-10 w-[320px] bg-black/80 backdrop-blur-sm border border-[#1e3a5f] p-3 space-y-3 text-[10px] text-white/70">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase text-white/50">Scene HUD</div>
                  <button
                    type="button"
                    onClick={() => setShowSceneDetails((prev) => !prev)}
                    className="border border-[#1e3a5f] px-2 py-1 text-[9px] uppercase text-white/60 hover:text-white hover:bg-[#0d2847]"
                  >
                    {showSceneDetails ? 'Hide' : 'Details'}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[9px] uppercase">
                  <div className="border border-[#1e3a5f] px-2 py-1 text-white/70">
                    Coverage
                    <div className="text-white">{coveragePercent.toFixed(0)}%</div>
                  </div>
                  <div className="border border-[#1e3a5f] px-2 py-1 text-white/70">
                    Drift
                    <div className="text-white">{driftHoursView.toFixed(0)} hrs</div>
                  </div>
                  <div className="border border-[#1e3a5f] px-2 py-1 text-white/70">
                    Route
                    <div className="text-white">{routeDistanceKm.toFixed(1)} km</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <TogglePill
                    label="Grid"
                    enabled={showGridPlanner}
                    onToggle={() => setShowGridPlanner((prev) => !prev)}
                  />
                  <TogglePill
                    label="Drift"
                    enabled={showDriftTrack}
                    onToggle={() => setShowDriftTrack((prev) => !prev)}
                  />
                  <TogglePill
                    label="Route"
                    enabled={showAssetRoute}
                    onToggle={() => setShowAssetRoute((prev) => !prev)}
                  />
                  <TogglePill
                    label="Depth"
                    enabled={showDepthBands}
                    onToggle={() => setShowDepthBands((prev) => !prev)}
                  />
                  <TogglePill
                    label="Risk"
                    enabled={showDepthRisk}
                    onToggle={() => setShowDepthRisk((prev) => !prev)}
                  />
                </div>

                {showSceneDetails && (
                  <>
                    <div className="border-t border-[#1e3a5f] pt-3 space-y-2">
                      <div className="text-[10px] uppercase text-white/50">Grid Planner</div>
                      <div className="flex items-center justify-between">
                        <span>Cells Swept</span>
                        <span className="text-white">{sweptCount}/{gridConfig.total}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>ETA Remaining</span>
                        <span className="text-white">{etaHours.toFixed(1)} hrs</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSweptCells({})}
                        className="mt-1 w-full border border-[#1e3a5f] px-2 py-1 text-[9px] uppercase text-white/60 hover:text-white hover:bg-[#0d2847]"
                      >
                        Reset Grid
                      </button>
                    </div>

                    <div className="border-t border-[#1e3a5f] pt-3 space-y-2">
                      <div className="text-[10px] uppercase text-white/50">Drift Playback</div>
                      <input
                        type="range"
                        min={0}
                        max={DRIFT_MAX_HOURS}
                        value={driftHoursView}
                        onChange={(e) => setDriftHoursView(Number(e.target.value))}
                        className="w-full"
                      />
                      <button
                        type="button"
                        onClick={() => setDriftPlaying((prev) => !prev)}
                        className="w-full border border-[#1e3a5f] px-2 py-1 text-[9px] uppercase text-white/60 hover:text-white hover:bg-[#0d2847]"
                      >
                        {driftPlaying ? 'Pause Drift' : 'Play Drift'}
                      </button>
                    </div>

                    <div className="border-t border-[#1e3a5f] pt-3 space-y-2">
                      <div className="text-[10px] uppercase text-white/50">Asset Routing</div>
                      <div className="flex items-center justify-between">
                        <span>Asset Profile</span>
                        <select
                          value={assetProfile}
                          onChange={(e) => setAssetProfile(e.target.value as 'shallow' | 'mid' | 'deep')}
                          className="bg-black border border-[#1e3a5f] text-white/70 px-2 py-1 text-[9px] uppercase"
                        >
                          <option value="shallow">Shallow (1200 m)</option>
                          <option value="mid">Mid (2500 m)</option>
                          <option value="deep">Deep (4500 m)</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
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
              <div className="p-6 space-y-6">
                <PlanningBrief
                  incident={incidentSnapshot}
                  comparison={comparisonData}
                  activeMode={searchMode}
                />
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

function IncidentOverlay({
  incident,
  referencePoint,
  seaFloorY,
  searchRadiusKm,
  driftHours,
}: {
  incident: IncidentInput | null;
  referencePoint: GPSCoordinate;
  seaFloorY: number;
  searchRadiusKm: number;
  driftHours: number;
}) {
  const surfaceY = 0;

  const anchor = useMemo(() => {
    if (!incident) return null;
    return gpsToCartesian(incident.gpsCoordinates, referencePoint, SCENE_SCALE);
  }, [incident, referencePoint]);

  const tetherGeometry = useMemo(() => {
    if (!anchor) return null;
    const points = [
      new THREE.Vector3(anchor.x, surfaceY, anchor.z),
      new THREE.Vector3(anchor.x, seaFloorY, anchor.z),
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [anchor, seaFloorY]);

  const driftArrow = useMemo(() => {
    if (!incident || !anchor) return null;
    const current = incident.environmentalConditions?.oceanCurrents?.[0];
    if (!current || !driftHours) return null;

    const driftMeters = current.speed * driftHours * 3600;
    const cappedMeters = Math.min(driftMeters, searchRadiusKm * 1000);
    const length = cappedMeters / SCENE_SCALE;
    if (length <= 0) return null;

    const heading = degreesToRadians(current.direction);
    const direction = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading)).normalize();
    return {
      direction,
      origin: new THREE.Vector3(anchor.x, surfaceY, anchor.z),
      length,
    };
  }, [incident, anchor, searchRadiusKm, driftHours]);

  if (!incident || !anchor) return null;

  const radius = (searchRadiusKm * 1000) / SCENE_SCALE;
  const ringGeometry = useMemo(() => {
    if (!anchor) return null;
    const segments = 80;
    const points = [];
    for (let i = 0; i <= segments; i += 1) {
      const angle = (i / segments) * Math.PI * 2;
      const x = anchor.x + Math.cos(angle) * radius;
      const z = anchor.z + Math.sin(angle) * radius;
      points.push(new THREE.Vector3(x, seaFloorY + 1, z));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [anchor, radius, seaFloorY]);

  return (
    <group>
      <mesh position={[anchor.x, surfaceY + 8, anchor.z]}>
        <coneGeometry args={[8, 18, 16]} />
        <meshStandardMaterial color="#00d9ff" emissive="#00d9ff" emissiveIntensity={0.6} />
      </mesh>

      <mesh position={[anchor.x, seaFloorY + 2, anchor.z]}>
        <sphereGeometry args={[10, 16, 16]} />
        <meshStandardMaterial color="#DF6C42" emissive="#DF6C42" emissiveIntensity={0.4} />
      </mesh>

      {tetherGeometry && (
        <line geometry={tetherGeometry}>
          <lineBasicMaterial color="#00d9ff" transparent opacity={0.4} />
        </line>
      )}

      {ringGeometry && (
        <line geometry={ringGeometry}>
          <lineBasicMaterial color="#7fd1ff" transparent opacity={0.6} />
        </line>
      )}

      {driftArrow && (
        <arrowHelper
          args={[driftArrow.direction, driftArrow.origin, driftArrow.length, 0x00d9ff, 22, 10]}
        />
      )}
    </group>
  );
}

function SeaFloorTerrain({
  seaFloorY,
  radiusUnits,
  showDepthBands,
  showDepthRisk,
  assetMaxDepth,
}: {
  seaFloorY: number;
  radiusUnits: number;
  showDepthBands: boolean;
  showDepthRisk: boolean;
  assetMaxDepth: number;
}) {
  const geometry = useMemo(() => {
    const segments = 120;
    const plane = new THREE.PlaneGeometry(radiusUnits * 2, radiusUnits * 2, segments, segments);
    const position = plane.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(position.count * 3);
    const shallowColor = new THREE.Color('#1e7f8a');
    const deepColor = new THREE.Color('#0b2a44');
    const riskColor = new THREE.Color('#7a2a1e');
    const amplitudeMeters = 320;
    const baseDepthMeters = Math.abs(seaFloorY * SCENE_SCALE);

    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const y = position.getY(i);
      const wave =
        Math.sin(x * 0.008) * 0.6 +
        Math.cos(y * 0.009) * 0.5 +
        Math.sin((x + y) * 0.006) * 0.4;
      const heightMeters = wave * amplitudeMeters;
      const heightUnits = heightMeters / SCENE_SCALE;
      position.setZ(i, heightUnits);

      const depthMeters = Math.abs((seaFloorY + heightUnits) * SCENE_SCALE);
      const depthRange = Math.max(baseDepthMeters + amplitudeMeters, 1);
      const normalized = Math.min(depthMeters / depthRange, 1);

      const bandStrength = showDepthBands ? 1 : 0.25;
      const color = deepColor.clone().lerp(shallowColor, (1 - normalized) * bandStrength);
      if (showDepthRisk && depthMeters > assetMaxDepth) {
        color.lerp(riskColor, 0.65);
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    plane.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    plane.computeVertexNormals();
    return plane;
  }, [radiusUnits, seaFloorY, showDepthRisk, assetMaxDepth]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, seaFloorY, 0]} geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        color="#0b2a44"
        emissive="#0d2235"
        emissiveIntensity={0.2}
        roughness={0.85}
        metalness={0.2}
      />
    </mesh>
  );
}

function SearchGrid({
  cells,
  cellSize,
  seaFloorY,
  sweptCells,
  onToggleCell,
}: {
  cells: { id: string; row: number; col: number; x: number; z: number }[];
  cellSize: number;
  seaFloorY: number;
  sweptCells: Record<string, boolean>;
  onToggleCell: (cellId: string) => void;
}) {
  return (
    <group>
      {cells.map((cell) => {
        const isSwept = Boolean(sweptCells[cell.id]);
        return (
          <mesh
            key={cell.id}
            position={[cell.x, seaFloorY, cell.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            onPointerDown={(event) => {
              event.stopPropagation();
              onToggleCell(cell.id);
            }}
          >
            <planeGeometry args={[cellSize * 0.98, cellSize * 0.98]} />
            <meshBasicMaterial
              color={isSwept ? '#1ed392' : '#0b2a44'}
              transparent
              opacity={isSwept ? 0.35 : 0.12}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function DriftTrack({
  incident,
  referencePoint,
  driftHours,
  surfaceY,
}: {
  incident: IncidentInput | null;
  referencePoint: GPSCoordinate;
  driftHours: number;
  surfaceY: number;
}) {
  const current = incident?.environmentalConditions?.oceanCurrents?.[0];

  const points = useMemo(() => {
    if (!incident || !current || driftHours <= 0) return [];
    const samples = 12;
    return calculateDrift(
      incident.gpsCoordinates,
      current.speed,
      current.direction,
      driftHours,
      samples
    );
  }, [incident, current, driftHours]);

  const lineGeometry = useMemo(() => {
    if (points.length === 0) return null;
    const linePoints = points.map((point) => {
      const cart = gpsToCartesian(point, referencePoint, SCENE_SCALE);
      return new THREE.Vector3(cart.x, surfaceY + 6, cart.z);
    });
    return new THREE.BufferGeometry().setFromPoints(linePoints);
  }, [points, referencePoint, surfaceY]);

  if (!lineGeometry || points.length === 0) return null;

  const lastPoint = points[points.length - 1];
  const lastCartesian = gpsToCartesian(lastPoint, referencePoint, SCENE_SCALE);

  return (
    <group>
      <line geometry={lineGeometry}>
        <lineBasicMaterial color="#7fd1ff" transparent opacity={0.9} />
      </line>
      <mesh position={[lastCartesian.x, surfaceY + 8, lastCartesian.z]}>
        <sphereGeometry args={[6, 12, 12]} />
        <meshStandardMaterial color="#7fd1ff" emissive="#7fd1ff" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

function AssetRoute({
  comparison,
  referencePoint,
  surfaceY,
}: {
  comparison: SearchComparisonType;
  referencePoint: GPSCoordinate;
  surfaceY: number;
}) {
  const routePoints = useMemo(() => {
    const zoneMap = new Map(comparison.optimized.zones.map((zone) => [zone.id, zone]));
    return comparison.optimized.searchOrder
      .map((zoneId) => zoneMap.get(zoneId)?.centroid)
      .filter((point): point is GPSCoordinate => Boolean(point));
  }, [comparison]);

  const lineGeometry = useMemo(() => {
    if (routePoints.length < 2) return null;
    const linePoints = routePoints.map((point) => {
      const cart = gpsToCartesian(point, referencePoint, SCENE_SCALE);
      return new THREE.Vector3(cart.x, surfaceY, cart.z);
    });
    return new THREE.BufferGeometry().setFromPoints(linePoints);
  }, [routePoints, referencePoint, surfaceY]);

  if (!lineGeometry) return null;

  return (
    <group>
      <line geometry={lineGeometry}>
        <lineBasicMaterial color="#DF6C42" transparent opacity={0.7} />
      </line>
      {routePoints.map((point, index) => {
        const cart = gpsToCartesian(point, referencePoint, SCENE_SCALE);
        return (
          <mesh key={`route-${index}`} position={[cart.x, surfaceY + 2, cart.z]}>
            <sphereGeometry args={[6, 12, 12]} />
            <meshStandardMaterial color="#DF6C42" emissive="#DF6C42" emissiveIntensity={0.4} />
          </mesh>
        );
      })}
    </group>
  );
}

function TogglePill({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`px-2 py-1 text-[9px] uppercase border ${
        enabled ? 'border-[#00d9ff] text-[#00d9ff]' : 'border-[#1e3a5f] text-white/50'
      } hover:text-white hover:bg-[#0d2847]`}
    >
      {label}
    </button>
  );
}

function PlanningBrief({
  incident,
  comparison,
  activeMode,
}: {
  incident: IncidentInput | null;
  comparison: SearchComparisonType;
  activeMode: 'traditional' | 'optimized';
}) {
  const optimized = comparison.optimized;
  const totalArea = Math.max(optimized.metrics.totalArea, 0.001);
  const phaseShares = {
    high: optimized.metrics.zoneCoverage.high / totalArea,
    medium: optimized.metrics.zoneCoverage.medium / totalArea,
    low: optimized.metrics.zoneCoverage.low / totalArea,
  };
  const totalDays = optimized.metrics.estimatedDuration;
  const incidentDepth = incident?.gpsCoordinates?.altitude ? Math.abs(incident.gpsCoordinates.altitude) : undefined;
  const driftHours = incident?.estimatedTimeInWater;
  const currentSpeed = incident?.environmentalConditions?.oceanCurrents?.[0]?.speed;
  const currentDirection = incident?.environmentalConditions?.oceanCurrents?.[0]?.direction;
  const riskFlags = getRiskFlags({ incidentDepth, driftHours, currentSpeed, cargoValue: incident?.cargoValue });
  const assets = getRecommendedAssets(incidentDepth);
  const zoneOrder = optimized.searchOrder.slice(0, 3).map((zoneId) => formatZoneId(zoneId));

  return (
    <div className="border border-[#1e3a5f] p-5" style={{ backgroundColor: 'rgba(5, 15, 26, 0.9)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase text-white/50">Planning Brief</div>
          <div className="text-lg font-bold text-[#00d9ff] uppercase tracking-wide">
            Mission Snapshot
          </div>
        </div>
        <div className="text-[10px] uppercase text-white/60">
          Active Mode: <span className="text-white">{activeMode}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="border border-[#1e3a5f] p-4">
          <div className="text-[10px] uppercase text-white/50 mb-3">Incident Snapshot</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-[9px] text-white/40">Latitude</div>
              <div className="text-white">{incident?.gpsCoordinates?.latitude?.toFixed(3) ?? '---'}</div>
            </div>
            <div>
              <div className="text-[9px] text-white/40">Longitude</div>
              <div className="text-white">{incident?.gpsCoordinates?.longitude?.toFixed(3) ?? '---'}</div>
            </div>
            <div>
              <div className="text-[9px] text-white/40">Depth</div>
              <div className="text-white">{incidentDepth ? `${incidentDepth.toFixed(0)} m` : '---'}</div>
            </div>
            <div>
              <div className="text-[9px] text-white/40">Time in Water</div>
              <div className="text-white">{driftHours ? `${driftHours.toFixed(0)} hrs` : '---'}</div>
            </div>
            <div>
              <div className="text-[9px] text-white/40">Current</div>
              <div className="text-white">
                {currentSpeed ? `${currentSpeed.toFixed(2)} m/s` : '---'}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-white/40">Direction</div>
              <div className="text-white">
                {currentDirection ? `${currentDirection.toFixed(0)} deg` : '---'}
              </div>
            </div>
          </div>
        </div>

        <div className="border border-[#1e3a5f] p-4">
          <div className="text-[10px] uppercase text-white/50 mb-3">Recommended Plan</div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Search Area</span>
              <span className="text-white">{optimized.metrics.totalArea.toFixed(1)} km^2</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Recovery Probability</span>
              <span className="text-[#DF6C42]">
                {(optimized.metrics.recoveryProbability * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">ETA</span>
              <span className="text-white">{optimized.metrics.estimatedDuration.toFixed(1)} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Budget</span>
              <span className="text-white">{formatCurrency(optimized.metrics.estimatedCost)}</span>
            </div>
            <div>
              <div className="text-[9px] text-white/40 mb-1">Zone Order</div>
              <div className="text-[10px] text-white/70">
                {zoneOrder.length > 0 ? zoneOrder.join(' -> ') : 'Auto-generated after calculation'}
              </div>
            </div>
          </div>
        </div>

        <div className="border border-[#1e3a5f] p-4">
          <div className="text-[10px] uppercase text-white/50 mb-3">Risk Flags</div>
          <div className="space-y-2 text-xs">
            {riskFlags.length > 0 ? (
              riskFlags.map((flag) => (
                <div key={flag} className="border border-[#DF6C42]/40 bg-[#DF6C42]/10 px-2 py-1">
                  {flag}
                </div>
              ))
            ) : (
              <div className="text-white/60">No elevated risks detected.</div>
            )}
          </div>
          <div className="mt-4">
            <div className="text-[10px] uppercase text-white/50 mb-2">Assets</div>
            <div className="flex flex-wrap gap-2 text-[9px] text-white/70">
              {assets.map((asset) => (
                <span key={asset} className="border border-[#1e3a5f] px-2 py-1">
                  {asset}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border border-[#1e3a5f] mt-5 p-4">
        <div className="text-[10px] uppercase text-white/50 mb-3">Mission Phases</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px] uppercase">
          <PhaseCard
            label="Phase 1"
            accent="#FF0000"
            title="High Priority Sweep"
            durationDays={totalDays * phaseShares.high}
          />
          <PhaseCard
            label="Phase 2"
            accent="#FFFF00"
            title="Medium Priority Expand"
            durationDays={totalDays * phaseShares.medium}
          />
          <PhaseCard
            label="Phase 3"
            accent="#0000FF"
            title="Low Priority Coverage"
            durationDays={totalDays * phaseShares.low}
          />
        </div>
      </div>
    </div>
  );
}

function PhaseCard({
  label,
  accent,
  title,
  durationDays,
}: {
  label: string;
  accent: string;
  title: string;
  durationDays: number;
}) {
  return (
    <div className="border border-[#1e3a5f] p-3 bg-black/40">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/60">{label}</span>
        <span className="text-white/70">{durationDays > 0 ? `${durationDays.toFixed(1)} days` : '---'}</span>
      </div>
      <div className="h-1 w-full bg-black/60 mb-2">
        <div className="h-1" style={{ width: '100%', backgroundColor: accent, boxShadow: `0 0 10px ${accent}80` }} />
      </div>
      <div className="text-xs text-white">{title}</div>
    </div>
  );
}

function getRiskFlags({
  incidentDepth,
  driftHours,
  currentSpeed,
  cargoValue,
}: {
  incidentDepth?: number;
  driftHours?: number;
  currentSpeed?: number;
  cargoValue?: number;
}) {
  const flags: string[] = [];
  if (incidentDepth && incidentDepth > 3000) {
    flags.push('Deep recovery required (>3000 m).');
  }
  if (driftHours && driftHours > 72) {
    flags.push('Extended drift window (>72 hrs).');
  }
  if (currentSpeed && currentSpeed > 1.2) {
    flags.push('High current velocity (>1.2 m/s).');
  }
  if (cargoValue && cargoValue > 1000000) {
    flags.push('High-value cargo exposure.');
  }
  return flags;
}

function getRecommendedAssets(incidentDepth?: number) {
  if (!incidentDepth) {
    return ['ROV package', 'Multibeam sonar', 'Support vessel'];
  }
  if (incidentDepth > 2500) {
    return ['Heavy-class ROV', 'AUV sweep', 'DP support vessel'];
  }
  if (incidentDepth > 1000) {
    return ['Mid-depth ROV', 'Side-scan sonar', 'Survey vessel'];
  }
  return ['Shallow ROV', 'Tow sonar', 'Fast response boat'];
}

function formatZoneId(zoneId: string) {
  if (zoneId.startsWith('zone-')) {
    return `Z${zoneId.replace('zone-', '')}`;
  }
  return zoneId.toUpperCase();
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}
