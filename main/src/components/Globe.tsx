'use client';

import { useRef, useMemo, useState, Suspense } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

export interface ContainerData {
  id: string;
  serialNumber: string;
  position: [number, number];
  dropPosition: [number, number];
  status: 'floating' | 'sunken';
  timeInWater: number;
  driftSpeed: number;
  weight: number;
  dimensions: { length: number; width: number; height: number };
  contents: string;
  buoyancy: string;
  shipName: string;
}

export interface ShipRoute {
  id: string;
  name: string;
  points: [number, number][];
  color: string;
}

interface GlobeProps {
  onContainerClick?: (container: ContainerData) => void;
  onShipClick?: (ship: ShipRoute) => void;
  containers?: ContainerData[];
  ships?: ShipRoute[];
  autoRotate?: boolean;
  showCurrents?: boolean;
}

// Convert lat/lon to 3D sphere coordinates
function latLonToVector3(lat: number, lon: number, radius: number = 2): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

// Create arc curve between two points
function createArcCurve(start: THREE.Vector3, end: THREE.Vector3, arcHeight: number = 0.5) {
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  mid.normalize().multiplyScalar(start.length() + arcHeight);

  return new THREE.QuadraticBezierCurve3(start, mid, end);
}

// Container Marker Component
function ContainerMarker({
  container,
  onClick
}: {
  container: ContainerData;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const position = useMemo(() =>
    latLonToVector3(container.position[0], container.position[1]),
    [container.position]
  );

  const color = container.status === 'floating' ? '#DF6C42' : '#FF4444';

  useFrame((state) => {
    if (meshRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1;
      meshRef.current.scale.setScalar(pulse * (hovered ? 1.3 : 1));
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.03, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={hovered ? 2 : 1.5}
        transparent
        opacity={0.9}
      />

      {/* Glow ring */}
      <mesh scale={1.8}>
        <ringGeometry args={[0.02, 0.025, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </mesh>
  );
}

// Drift Trail Component
function DriftTrail({ container }: { container: ContainerData }) {
  const points = useMemo(() => {
    const start = latLonToVector3(container.dropPosition[0], container.dropPosition[1]);
    const end = latLonToVector3(container.position[0], container.position[1]);
    const curve = createArcCurve(start, end, 0.15);
    return curve.getPoints(50);
  }, [container]);

  return (
    <Line
      points={points}
      color="#9B59B6"
      lineWidth={2}
      transparent
      opacity={0.6}
    />
  );
}

// Ship Route Arc Component
function ShipRouteArc({ ship }: { ship: ShipRoute }) {
  const points = useMemo(() => {
    const vectors = ship.points.map(([lat, lon]) => latLonToVector3(lat, lon));
    const curve = new THREE.CatmullRomCurve3(vectors);
    return curve.getPoints(100);
  }, [ship.points]);

  return (
    <Line
      points={points}
      color={ship.color}
      lineWidth={3}
      transparent
      opacity={0.7}
    />
  );
}

// Ocean Current Particles
function OceanCurrents() {
  const particlesRef = useRef<THREE.Points>(null);

  const particlesGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(1000 * 3);

    for (let i = 0; i < 1000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2.05;
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useFrame(() => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.0002;
    }
  });

  return (
    <points ref={particlesRef} geometry={particlesGeometry}>
      <pointsMaterial
        size={0.008}
        color="#00d9ff"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Earth Sphere with Texture
function EarthTextureSphere() {
  const colorMap = useLoader(
    THREE.TextureLoader,
    "https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg"
  );
  return (
    <mesh>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial map={colorMap} />
    </mesh>
  );
}

// Main Globe Scene
function GlobeScene({
  containers,
  ships,
  onContainerClick,
  autoRotate,
  showCurrents,
}: GlobeProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Earth with texture */}
      <EarthTextureSphere />

      {/* Atmosphere Glow */}
      <mesh scale={1.05}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial
          color="#00d9ff"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Ship Routes */}
      {ships?.map((ship) => (
        <ShipRouteArc key={ship.id} ship={ship} />
      ))}

      {/* Container Drift Trails */}
      {containers?.map((container) => (
        <DriftTrail key={`trail-${container.id}`} container={container} />
      ))}

      {/* Container Markers */}
      {containers?.map((container) => (
        <ContainerMarker
          key={container.id}
          container={container}
          onClick={() => onContainerClick?.(container)}
        />
      ))}

      {/* Ocean Currents */}
      {showCurrents && <OceanCurrents />}

      {/* Grid Lines */}
      <mesh rotation={[0, 0, 0]}>
        <sphereGeometry args={[2.01, 32, 32]} />
        <meshBasicMaterial
          color="#00d9ff"
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>
    </group>
  );
}

export default function Globe(props: GlobeProps) {
  // Only return a group of 3D objects, NOT a Canvas!
  return (
    <Suspense fallback={null}>
      <GlobeScene {...props} />
    </Suspense>
  );
}

// Export sample data for testing
export const SAMPLE_CONTAINERS: ContainerData[] = [
  {
    id: 'CONT-001',
    serialNumber: 'MAEU-123456-7',
    position: [37.42, -14.68],
    dropPosition: [37.5, -14.5],
    status: 'floating',
    timeInWater: 48,
    driftSpeed: 0.3,
    weight: 30000,
    dimensions: { length: 12.2, width: 2.4, height: 2.6 },
    contents: 'Electronics',
    buoyancy: 'Partially submerged',
    shipName: 'MSC Daniela',
  },
  {
    id: 'CONT-002',
    serialNumber: 'HLCU-789012-3',
    position: [35.2, -15.8],
    dropPosition: [35.5, -15.5],
    status: 'sunken',
    timeInWater: 96,
    driftSpeed: 0.0,
    weight: 28000,
    dimensions: { length: 12.2, width: 2.4, height: 2.6 },
    contents: 'Textiles',
    buoyancy: 'Seabed',
    shipName: 'Ever Given',
  },
];

export const SAMPLE_SHIPS: ShipRoute[] = [
  {
    id: 'SHIP-001',
    name: 'MSC Daniela',
    points: [
      [40.0, -10.0],
      [38.5, -12.5],
      [37.5, -14.5],
      [35.0, -16.0],
    ],
    color: '#00d9ff',
  },
  {
    id: 'SHIP-002',
    name: 'Ever Given',
    points: [
      [38.0, -13.0],
      [36.5, -14.5],
      [35.5, -15.5],
      [34.0, -17.0],
    ],
    color: '#00ff88',
  },
];