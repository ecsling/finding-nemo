'use client';

/**
 * OceanCache Search Optimizer Dashboard
 * Main interface for probability-weighted container recovery search planning
 */

import React, { useState, useCallback, useEffect, useMemo, Suspense, lazy } from 'react';
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

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({ default: mod.Dithering }))
);

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
    } catch (err) {
      console.error('Error calculating search zones:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleCell = useCallback((cellId: string) => {
    setSweptCells((prev) => ({ ...prev, [cellId]: !prev[cellId] }));
  }, []);

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

  return (
    <div className="min-h-screen bg-[#E5E6DA] text-[#1D1E15] font-mono">
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
        <div className="flex items-center gap-3 px-6 text-[10px] uppercase text-[#1D1E15]/50">
          System Status: <span className="text-green-600 font-medium ml-1">Active</span>
        </div>
      </nav>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[calc(100vh-5rem)] relative z-10">
        <div className="lg:col-span-4 xl:col-span-3 border-r border-[#1D1E15]/10 overflow-y-auto bg-[#E5E6DA]/60 backdrop-blur-sm">
          <div className="p-6 space-y-6">
            <IncidentInputForm onSubmit={handleIncidentSubmit} loading={loading} />
            {showVisualization && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <ZoneLegend showProbabilities />
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

        <div className="lg:col-span-8 xl:col-span-9 flex flex-col">
          <div className="flex-1 relative min-h-[60vh] bg-gradient-to-b from-[#8fbcd4] via-[#5a9dc2] to-[#2d6d96] rounded-bl-3xl overflow-hidden">
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

            {!showVisualization && !loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center max-w-md px-6">
                  <div className="text-3xl tracking-[0.4em] text-white/60 mb-4 font-light">OCEAN</div>
                  <h2 className="text-2xl font-semibold text-white mb-2 uppercase">Ready to Optimize</h2>
                  <p className="text-sm text-white/80 leading-relaxed">Enter incident details to generate probability-weighted search zones.</p>
                </div>
              </div>
            )}

            {showVisualization && !loading && (
              <Canvas style={{ position: 'absolute', inset: 0 }}>
                <color attach="background" args={['#5a9dc2']} />
                <fog attach="fog" args={['#5a9dc2', 800, 3200]} />
                <PerspectiveCamera makeDefault position={[0, 500, 1000]} />
                <OrbitControls enablePan enableZoom enableRotate maxPolarAngle={Math.PI / 2.2} minDistance={100} maxDistance={3000} target={[0, seaFloorY + 5, 0]} />
                <ambientLight intensity={0.9} />
                <hemisphereLight args={['#ffffff', '#5a9dc2', 0.6]} />
                <directionalLight position={[200, 300, 200]} intensity={1.1} />
                <SeaFloorTerrain seaFloorY={seaFloorY} radiusUnits={sceneRadiusUnits * 1.4} showDepthBands={showDepthBands} showDepthRisk={showDepthRisk} assetMaxDepth={assetMaxDepth} />
                <ProbabilityHeatmap zones={activeZones} referencePoint={referencePoint} visible opacity={0.7} seaFloorY={seaFloorY + 2} markerOffset={18} />
                {showGridPlanner && <SearchGrid cells={gridConfig.cells} cellSize={gridConfig.cellSize} seaFloorY={seaFloorY + 1.5} sweptCells={sweptCells} onToggleCell={handleToggleCell} />}
                <IncidentOverlay incident={incidentSnapshot} referencePoint={referencePoint} seaFloorY={seaFloorY} searchRadiusKm={SEARCH_RADIUS_KM} driftHours={driftHoursView} />
                {showDriftTrack && <DriftTrack incident={incidentSnapshot} referencePoint={referencePoint} driftHours={driftHoursView} surfaceY={0} />}
                {showAssetRoute && comparisonData && <AssetRoute comparison={comparisonData} referencePoint={referencePoint} surfaceY={seaFloorY + 6} />}
                <gridHelper args={[sceneRadiusUnits * 3, 40, '#ffffff40', '#ffffff20']} position={[0, seaFloorY + 2, 0]} />
              </Canvas>
            )}

            {showVisualization && !loading && (
              <>
                <div className="absolute top-4 left-4 right-4 z-10 flex items-start justify-between">
                  <div className="bg-white/90 backdrop-blur-sm border border-[#1D1E15]/10 p-3 rounded-xl shadow-lg"><HeatmapToggle mode={searchMode} onModeChange={setSearchMode} /></div>
                  <div className="bg-white/90 backdrop-blur-sm border border-[#1D1E15]/10 p-3 rounded-xl shadow-lg"><CompactLegend /></div>
                </div>
                <div className="absolute bottom-4 left-4 z-10 w-[320px] bg-white/90 backdrop-blur-sm border border-[#1D1E15]/10 p-4 space-y-3 text-[10px] rounded-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="uppercase text-[#1D1E15]/50 font-medium">Scene HUD</span>
                    <button onClick={() => setShowSceneDetails((p) => !p)} className="border border-[#1D1E15]/20 px-2 py-1 text-[9px] uppercase rounded-full hover:bg-[#1D1E15]/5">{showSceneDetails ? 'Hide' : 'Details'}</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[9px] uppercase">
                    {[['Coverage', `${coveragePercent.toFixed(0)}%`], ['Drift', `${driftHoursView.toFixed(0)} hrs`], ['Route', `${routeDistanceKm.toFixed(1)} km`]].map(([l, v]) => (
                      <div key={l} className="border border-[#1D1E15]/10 px-2 py-1.5 rounded-lg bg-[#1D1E15]/5"><span className="text-[#1D1E15]/50">{l}</span><div className="text-[#1D1E15] font-medium">{v}</div></div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[['Grid', showGridPlanner, setShowGridPlanner], ['Drift', showDriftTrack, setShowDriftTrack], ['Route', showAssetRoute, setShowAssetRoute], ['Depth', showDepthBands, setShowDepthBands], ['Risk', showDepthRisk, setShowDepthRisk]].map(([l, e, s]) => (
                      <TogglePill key={l as string} label={l as string} enabled={e as boolean} onToggle={() => (s as React.Dispatch<React.SetStateAction<boolean>>)((p) => !p)} />
                    ))}
                  </div>
                  {showSceneDetails && (
                    <>
                      <div className="border-t border-[#1D1E15]/10 pt-3 space-y-2">
                        <div className="uppercase text-[#1D1E15]/50">Grid Planner</div>
                        <div className="flex justify-between"><span>Cells Swept</span><span className="font-medium">{sweptCount}/{gridConfig.total}</span></div>
                        <div className="flex justify-between"><span>ETA Remaining</span><span className="font-medium">{etaHours.toFixed(1)} hrs</span></div>
                        <button onClick={() => setSweptCells({})} className="w-full border border-[#1D1E15]/20 py-1.5 text-[9px] uppercase rounded-full hover:bg-[#1D1E15]/5">Reset Grid</button>
                      </div>
                      <div className="border-t border-[#1D1E15]/10 pt-3 space-y-2">
                        <div className="uppercase text-[#1D1E15]/50">Drift Playback</div>
                        <input type="range" min={0} max={DRIFT_MAX_HOURS} value={driftHoursView} onChange={(e) => setDriftHoursView(Number(e.target.value))} className="w-full accent-[#1D1E15]" />
                        <button onClick={() => setDriftPlaying((p) => !p)} className="w-full border border-[#1D1E15]/20 py-1.5 text-[9px] uppercase rounded-full hover:bg-[#1D1E15]/5">{driftPlaying ? 'Pause' : 'Play'} Drift</button>
                      </div>
                      <div className="border-t border-[#1D1E15]/10 pt-3 space-y-2">
                        <div className="uppercase text-[#1D1E15]/50">Asset Routing</div>
                        <div className="flex justify-between items-center">
                          <span>Profile</span>
                          <select value={assetProfile} onChange={(e) => setAssetProfile(e.target.value as 'shallow' | 'mid' | 'deep')} className="bg-white border border-[#1D1E15]/20 px-2 py-1 text-[9px] uppercase rounded-lg">{['shallow', 'mid', 'deep'].map((p) => <option key={p} value={p}>{p}</option>)}</select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-sm border border-[#1D1E15]/10 p-3 text-[9px] text-[#1D1E15]/60 rounded-xl shadow-lg">
                  <div>Left Click + Drag: Rotate</div><div>Right Click + Drag: Pan</div><div>Scroll: Zoom</div>
                </div>
              </>
            )}
          </div>

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

function IncidentOverlay({ incident, referencePoint, seaFloorY, searchRadiusKm, driftHours }: { incident: IncidentInput | null; referencePoint: GPSCoordinate; seaFloorY: number; searchRadiusKm: number; driftHours: number }) {
  const anchor = useMemo(() => incident ? gpsToCartesian(incident.gpsCoordinates, referencePoint, SCENE_SCALE) : null, [incident, referencePoint]);
  const tetherGeometry = useMemo(() => anchor ? new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(anchor.x, 0, anchor.z), new THREE.Vector3(anchor.x, seaFloorY, anchor.z)]) : null, [anchor, seaFloorY]);
  const driftArrow = useMemo(() => {
    if (!incident || !anchor) return null;
    const c = incident.environmentalConditions?.oceanCurrents?.[0];
    if (!c || !driftHours) return null;
    const len = Math.min(c.speed * driftHours * 3600, searchRadiusKm * 1000) / SCENE_SCALE;
    if (len <= 0) return null;
    const h = degreesToRadians(c.direction);
    return { direction: new THREE.Vector3(Math.sin(h), 0, Math.cos(h)).normalize(), origin: new THREE.Vector3(anchor.x, 0, anchor.z), length: len };
  }, [incident, anchor, searchRadiusKm, driftHours]);
  const ringGeometry = useMemo(() => {
    if (!anchor) return null;
    const r = (searchRadiusKm * 1000) / SCENE_SCALE, pts = [];
    for (let i = 0; i <= 80; i++) { const a = (i / 80) * Math.PI * 2; pts.push(new THREE.Vector3(anchor.x + Math.cos(a) * r, seaFloorY + 1, anchor.z + Math.sin(a) * r)); }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [anchor, searchRadiusKm, seaFloorY]);
  if (!incident || !anchor) return null;
  return (
    <group>
      <mesh position={[anchor.x, 8, anchor.z]}><coneGeometry args={[8, 18, 16]} /><meshStandardMaterial color="#1D1E15" emissive="#1D1E15" emissiveIntensity={0.3} /></mesh>
      <mesh position={[anchor.x, seaFloorY + 2, anchor.z]}><sphereGeometry args={[10, 16, 16]} /><meshStandardMaterial color="#DF6C42" emissive="#DF6C42" emissiveIntensity={0.4} /></mesh>
      {tetherGeometry && <line geometry={tetherGeometry}><lineBasicMaterial color="#1D1E15" transparent opacity={0.4} /></line>}
      {ringGeometry && <line geometry={ringGeometry}><lineBasicMaterial color="#ffffff" transparent opacity={0.6} /></line>}
      {driftArrow && <arrowHelper args={[driftArrow.direction, driftArrow.origin, driftArrow.length, 0x1D1E15, 22, 10]} />}
    </group>
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
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, seaFloorY, 0]} geometry={geometry}><meshStandardMaterial vertexColors color="#2d6d96" emissive="#1a4a6e" emissiveIntensity={0.2} roughness={0.85} metalness={0.2} /></mesh>;
}

function SearchGrid({ cells, cellSize, seaFloorY, sweptCells, onToggleCell }: { cells: { id: string; x: number; z: number }[]; cellSize: number; seaFloorY: number; sweptCells: Record<string, boolean>; onToggleCell: (id: string) => void }) {
  return <group>{cells.map((c) => <mesh key={c.id} position={[c.x, seaFloorY, c.z]} rotation={[-Math.PI / 2, 0, 0]} onPointerDown={(e) => { e.stopPropagation(); onToggleCell(c.id); }}><planeGeometry args={[cellSize * 0.98, cellSize * 0.98]} /><meshBasicMaterial color={sweptCells[c.id] ? '#4ade80' : '#ffffff'} transparent opacity={sweptCells[c.id] ? 0.4 : 0.1} side={THREE.DoubleSide} /></mesh>)}</group>;
}

function DriftTrack({ incident, referencePoint, driftHours, surfaceY }: { incident: IncidentInput | null; referencePoint: GPSCoordinate; driftHours: number; surfaceY: number }) {
  const c = incident?.environmentalConditions?.oceanCurrents?.[0];
  const pts = useMemo(() => (!incident || !c || driftHours <= 0) ? [] : calculateDrift(incident.gpsCoordinates, c.speed, c.direction, driftHours, 12), [incident, c, driftHours]);
  const geo = useMemo(() => pts.length ? new THREE.BufferGeometry().setFromPoints(pts.map((p) => { const cart = gpsToCartesian(p, referencePoint, SCENE_SCALE); return new THREE.Vector3(cart.x, surfaceY + 6, cart.z); })) : null, [pts, referencePoint, surfaceY]);
  if (!geo || !pts.length) return null;
  const last = gpsToCartesian(pts[pts.length - 1], referencePoint, SCENE_SCALE);
  return <group><line geometry={geo}><lineBasicMaterial color="#ffffff" transparent opacity={0.9} /></line><mesh position={[last.x, surfaceY + 8, last.z]}><sphereGeometry args={[6, 12, 12]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.7} /></mesh></group>;
}

function AssetRoute({ comparison, referencePoint, surfaceY }: { comparison: SearchComparisonType; referencePoint: GPSCoordinate; surfaceY: number }) {
  const pts = useMemo(() => { const m = new Map(comparison.optimized.zones.map((z) => [z.id, z])); return comparison.optimized.searchOrder.map((id) => m.get(id)?.centroid).filter((p): p is GPSCoordinate => Boolean(p)); }, [comparison]);
  const geo = useMemo(() => pts.length < 2 ? null : new THREE.BufferGeometry().setFromPoints(pts.map((p) => { const c = gpsToCartesian(p, referencePoint, SCENE_SCALE); return new THREE.Vector3(c.x, surfaceY, c.z); })), [pts, referencePoint, surfaceY]);
  if (!geo) return null;
  return <group><line geometry={geo}><lineBasicMaterial color="#DF6C42" transparent opacity={0.7} /></line>{pts.map((p, i) => { const c = gpsToCartesian(p, referencePoint, SCENE_SCALE); return <mesh key={i} position={[c.x, surfaceY + 2, c.z]}><sphereGeometry args={[6, 12, 12]} /><meshStandardMaterial color="#DF6C42" emissive="#DF6C42" emissiveIntensity={0.4} /></mesh>; })}</group>;
}

function TogglePill({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) {
  return <button onClick={onToggle} className={`px-2.5 py-1 text-[9px] uppercase rounded-full transition-colors ${enabled ? 'bg-[#1D1E15] text-[#E5E6DA]' : 'border border-[#1D1E15]/20 text-[#1D1E15]/50 hover:bg-[#1D1E15]/5'}`}>{label}</button>;
}

function PlanningBrief({ incident, comparison, activeMode }: { incident: IncidentInput | null; comparison: SearchComparisonType; activeMode: string }) {
  const o = comparison.optimized, total = Math.max(o.metrics.totalArea, 0.001);
  const shares = { high: o.metrics.zoneCoverage.high / total, medium: o.metrics.zoneCoverage.medium / total, low: o.metrics.zoneCoverage.low / total };
  const depth = incident?.gpsCoordinates?.altitude ? Math.abs(incident.gpsCoordinates.altitude) : undefined;
  const drift = incident?.estimatedTimeInWater, spd = incident?.environmentalConditions?.oceanCurrents?.[0]?.speed, dir = incident?.environmentalConditions?.oceanCurrents?.[0]?.direction;
  const risks = getRiskFlags({ incidentDepth: depth, driftHours: drift, currentSpeed: spd, cargoValue: incident?.cargoValue });
  const assets = getRecommendedAssets(depth), zones = o.searchOrder.slice(0, 3).map(formatZoneId);

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-[#1D1E15]/10 p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div><div className="text-[10px] uppercase text-[#1D1E15]/50">Planning Brief</div><div className="text-lg font-semibold uppercase tracking-wide">Mission Snapshot</div></div>
        <div className="text-[10px] uppercase text-[#1D1E15]/60">Mode: <span className="font-medium">{activeMode}</span></div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="border border-[#1D1E15]/10 p-4 rounded-xl bg-[#1D1E15]/5">
          <div className="text-[10px] uppercase text-[#1D1E15]/50 mb-3">Incident</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[['Lat', incident?.gpsCoordinates?.latitude?.toFixed(3)], ['Lon', incident?.gpsCoordinates?.longitude?.toFixed(3)], ['Depth', depth ? `${depth.toFixed(0)} m` : null], ['Time', drift ? `${drift.toFixed(0)} hrs` : null], ['Current', spd ? `${spd.toFixed(2)} m/s` : null], ['Dir', dir ? `${dir.toFixed(0)} deg` : null]].map(([l, v]) => <div key={l}><div className="text-[9px] text-[#1D1E15]/40">{l}</div><div className="font-medium">{v ?? '---'}</div></div>)}
          </div>
        </div>
        <div className="border border-[#1D1E15]/10 p-4 rounded-xl bg-[#1D1E15]/5">
          <div className="text-[10px] uppercase text-[#1D1E15]/50 mb-3">Plan</div>
          <div className="space-y-2 text-xs">
            {[['Area', `${o.metrics.totalArea.toFixed(1)} km²`], ['Probability', `${(o.metrics.recoveryProbability * 100).toFixed(0)}%`, 'text-[#DF6C42] font-semibold'], ['ETA', `${o.metrics.estimatedDuration.toFixed(1)} days`], ['Budget', formatCurrency(o.metrics.estimatedCost)]].map(([l, v, c]) => <div key={l} className="flex justify-between"><span className="text-[#1D1E15]/60">{l}</span><span className={c || 'font-medium'}>{v}</span></div>)}
            <div><div className="text-[9px] text-[#1D1E15]/40 mb-1">Zone Order</div><div className="text-[10px] text-[#1D1E15]/70">{zones.length ? zones.join(' -> ') : 'Auto-generated'}</div></div>
          </div>
        </div>
        <div className="border border-[#1D1E15]/10 p-4 rounded-xl bg-[#1D1E15]/5">
          <div className="text-[10px] uppercase text-[#1D1E15]/50 mb-3">Risks</div>
          <div className="space-y-2 text-xs">{risks.length ? risks.map((f) => <div key={f} className="border border-[#DF6C42]/30 bg-[#DF6C42]/10 px-2 py-1 rounded-lg text-[#DF6C42]">{f}</div>) : <div className="text-[#1D1E15]/60">No elevated risks.</div>}</div>
          <div className="mt-4"><div className="text-[10px] uppercase text-[#1D1E15]/50 mb-2">Assets</div><div className="flex flex-wrap gap-2 text-[9px]">{assets.map((a) => <span key={a} className="border border-[#1D1E15]/15 px-2 py-1 rounded-full bg-white">{a}</span>)}</div></div>
        </div>
      </div>
      <div className="border border-[#1D1E15]/10 mt-5 p-4 rounded-xl bg-[#1D1E15]/5">
        <div className="text-[10px] uppercase text-[#1D1E15]/50 mb-3">Mission Phases</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{[['Phase 1', '#ef4444', 'High Priority', shares.high], ['Phase 2', '#eab308', 'Medium Priority', shares.medium], ['Phase 3', '#3b82f6', 'Low Priority', shares.low]].map(([l, c, t, s]) => <PhaseCard key={l as string} label={l as string} accent={c as string} title={t as string} durationDays={o.metrics.estimatedDuration * (s as number)} />)}</div>
      </div>
    </div>
  );
}

function PhaseCard({ label, accent, title, durationDays }: { label: string; accent: string; title: string; durationDays: number }) {
  return <div className="border border-[#1D1E15]/10 p-3 rounded-xl bg-white"><div className="flex justify-between mb-2 text-[10px] uppercase"><span className="text-[#1D1E15]/60">{label}</span><span>{durationDays > 0 ? `${durationDays.toFixed(1)} days` : '---'}</span></div><div className="h-1.5 w-full bg-[#1D1E15]/10 rounded-full mb-2 overflow-hidden"><div className="h-full rounded-full" style={{ width: '100%', backgroundColor: accent }} /></div><div className="text-xs font-medium">{title}</div></div>;
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

function formatZoneId(id: string) { return id.startsWith('zone-') ? `Z${id.replace('zone-', '')}` : id.toUpperCase(); }
function formatCurrency(v: number) { return v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${v.toFixed(0)}`; }
