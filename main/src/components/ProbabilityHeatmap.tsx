'use client';

/**
 * Probability Heatmap Component
 * 3D visualization of probability-weighted search zones using Three.js
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ProbabilityZone, GPSCoordinate } from '@/models/SearchOptimization';
import { gpsToCartesian } from '@/lib/geo-utils';

interface ProbabilityHeatmapProps {
  zones: ProbabilityZone[];
  referencePoint: GPSCoordinate;
  visible: boolean;
  opacity?: number;
  animationSpeed?: number;
}

/**
 * Convert priority to color
 */
function getPriorityColor(priority: 'high' | 'medium' | 'low', opacity: number = 0.6): string {
  const colors = {
    high: `rgba(255, 0, 0, ${opacity})`, // Red
    medium: `rgba(255, 255, 0, ${opacity})`, // Yellow
    low: `rgba(0, 0, 255, ${opacity})`, // Blue
  };

  return colors[priority];
}

/**
 * Convert probability score to color (smooth gradient)
 */
function probabilityToColor(score: number, opacity: number = 0.6): THREE.Color {
  // Red (high) → Yellow (medium) → Blue (low)
  if (score >= 0.7) {
    // High priority: Red to Yellow gradient
    const t = (score - 0.7) / 0.3;
    return new THREE.Color().setRGB(1, 1 - t * 0.5, 0);
  } else if (score >= 0.3) {
    // Medium priority: Yellow to Blue gradient
    const t = (score - 0.3) / 0.4;
    return new THREE.Color().setRGB(1 - t, 1 - t, t);
  } else {
    // Low priority: Blue gradient
    const t = score / 0.3;
    return new THREE.Color().setRGB(0, 0, t);
  }
}

/**
 * Individual Zone Mesh Component
 */
function ZoneMesh({
  zone,
  referencePoint,
  opacity,
}: {
  zone: ProbabilityZone;
  referencePoint: GPSCoordinate;
  opacity: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Convert zone centroid to Cartesian
  const centroidCartesian = useMemo(() => {
    return gpsToCartesian(zone.centroid, referencePoint, 10); // Scale: 10m per unit
  }, [zone.centroid, referencePoint]);

  // Estimate radius from zone area
  const radius = useMemo(() => {
    // Area = πr², so r = √(Area/π)
    // Convert area from m² to scene units (divide by 100 since we're scaling by 10)
    return Math.sqrt(zone.area / Math.PI) / 10;
  }, [zone.area]);

  // Create material with color based on priority
  const material = useMemo(() => {
    const color = probabilityToColor(zone.probabilityScore, opacity);

    return new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      emissive: color,
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.3,
    });
  }, [zone.probabilityScore, opacity]);

  // Animate pulsing effect for high-priority zones
  useFrame((state) => {
    if (meshRef.current && zone.priority === 'high') {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.05 + 1;
      meshRef.current.scale.set(pulse, 1, pulse);
    }
  });

  return (
    <mesh
      ref={meshRef}
      material={material}
      position={[centroidCartesian.x, -5, centroidCartesian.z]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <circleGeometry args={[radius, 32]} />
    </mesh>
  );
}

/**
 * Traditional Circular Search Pattern
 */
function TraditionalSearchCircle({
  center,
  radiusMeters,
  referencePoint,
  opacity,
}: {
  center: GPSCoordinate;
  radiusMeters: number;
  referencePoint: GPSCoordinate;
  opacity: number;
}) {
  const geometry = useMemo(() => {
    return new THREE.RingGeometry(0, radiusMeters / 10, 64); // Scale: 10m per unit
  }, [radiusMeters]);

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: 0x00d9ff,
      transparent: true,
      opacity: opacity * 0.3,
      side: THREE.DoubleSide,
    });
  }, [opacity]);

  const centerCartesian = useMemo(() => {
    return gpsToCartesian(center, referencePoint, 10);
  }, [center, referencePoint]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[centerCartesian.x, -10, centerCartesian.z]}
      rotation={[-Math.PI / 2, 0, 0]}
    />
  );
}

/**
 * Main Probability Heatmap Component
 */
export default function ProbabilityHeatmap({
  zones,
  referencePoint,
  visible,
  opacity = 0.6,
  animationSpeed = 1,
}: ProbabilityHeatmapProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Debug: Log zones
  React.useEffect(() => {
    console.log('ProbabilityHeatmap zones:', zones.length);
    if (zones.length > 0) {
      console.log('First zone:', zones[0]);
      console.log('Reference point:', referencePoint);
    }
  }, [zones, referencePoint]);

  // Animate opacity fade in/out
  useFrame(() => {
    if (groupRef.current) {
      const targetOpacity = visible ? opacity : 0;
      if (groupRef.current.children.length > 0) {
        groupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
            if ('opacity' in child.material) {
              child.material.opacity = THREE.MathUtils.lerp(
                child.material.opacity,
                targetOpacity,
                0.1 * animationSpeed
              );
            }
          }
        });
      }
    }
  });

  if (!visible && zones.length === 0) return null;

  return (
    <group ref={groupRef}>
      {zones.map((zone, idx) => {
        console.log(`Rendering zone ${idx}:`, zone.centroid, 'Area:', zone.area);
        return (
          <ZoneMesh
            key={zone.id}
            zone={zone}
            referencePoint={referencePoint}
            opacity={opacity}
          />
        );
      })}

      {/* Markers for zone centroids - larger and more visible */}
      {zones.map((zone) => {
        const centroidCartesian = gpsToCartesian(zone.centroid, referencePoint, 10);
        console.log(`Marker position for ${zone.priority}:`, centroidCartesian);

        return (
          <mesh
            key={`marker-${zone.id}`}
            position={[centroidCartesian.x, 10, centroidCartesian.z]}
          >
            <sphereGeometry args={[20, 16, 16]} />
            <meshStandardMaterial
              color={probabilityToColor(zone.probabilityScore)}
              emissive={probabilityToColor(zone.probabilityScore)}
              emissiveIntensity={0.8}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Heatmap Toggle Component (for traditional vs optimized views)
 */
export function HeatmapToggle({
  mode,
  onModeChange,
}: {
  mode: 'traditional' | 'optimized';
  onModeChange: (mode: 'traditional' | 'optimized') => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onModeChange('traditional')}
        className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${
          mode === 'traditional'
            ? 'bg-[#00d9ff] text-black'
            : 'border border-[#1e3a5f] text-white hover:bg-[#0d2847]'
        }`}
      >
        Traditional Search
      </button>
      <button
        onClick={() => onModeChange('optimized')}
        className={`px-4 py-2 text-xs uppercase font-bold transition-colors ${
          mode === 'optimized'
            ? 'bg-[#DF6C42] text-black'
            : 'border border-[#1e3a5f] text-white hover:bg-[#0d2847]'
        }`}
      >
        Optimized Search
      </button>
    </div>
  );
}
