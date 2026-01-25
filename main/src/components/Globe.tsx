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

export interface HighlightedPoint {
  lat: number;
  lon: number;
  label?: string;
  color?: string;
}

interface GlobeProps {
  onContainerClick?: (container: ContainerData) => void;
  onShipClick?: (ship: ShipRoute) => void;
  containers?: ContainerData[];
  ships?: ShipRoute[];
  autoRotate?: boolean;
  showCurrents?: boolean;
  highlightedPoint?: HighlightedPoint;
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

// Highlighted Point Marker Component
function HighlightedPointMarker({ point }: { point: HighlightedPoint }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const position = useMemo(() =>
    latLonToVector3(point.lat, point.lon),
    [point.lat, point.lon]
  );

  const color = point.color || '#DF6C42';

  useFrame((state) => {
    if (meshRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.15 + 1;
      meshRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={position}>
      {/* Main marker sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Outer glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06, 0.08, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Pulsing outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={1.5}>
        <ringGeometry args={[0.08, 0.09, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Vertical beam */}
      <mesh position={[0, 0.15, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.3, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
    </group>
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
  highlightedPoint,
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

      {/* Highlighted Point */}
      {highlightedPoint && <HighlightedPointMarker point={highlightedPoint} />}

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

// Export sample data for testing - containers spread across major oceans
export const SAMPLE_CONTAINERS: ContainerData[] = [
  // North Atlantic - Incident Location
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
  // English Channel
  {
    id: 'CONT-002',
    serialNumber: 'HLCU-789012-3',
    position: [49.8, -3.2],
    dropPosition: [50.1, -2.8],
    status: 'floating',
    timeInWater: 12,
    driftSpeed: 0.5,
    weight: 28000,
    dimensions: { length: 12.2, width: 2.4, height: 2.6 },
    contents: 'Textiles',
    buoyancy: 'Floating',
    shipName: 'CMA CGM Marco Polo',
  },
  // South China Sea
  {
    id: 'CONT-003',
    serialNumber: 'OOLU-456789-1',
    position: [14.5, 115.8],
    dropPosition: [15.0, 116.2],
    status: 'sunken',
    timeInWater: 168,
    driftSpeed: 0.0,
    weight: 32000,
    dimensions: { length: 12.2, width: 2.4, height: 2.6 },
    contents: 'Auto Parts',
    buoyancy: 'Seabed',
    shipName: 'COSCO Shipping Universe',
  },
  // Gulf of Mexico
  {
    id: 'CONT-004',
    serialNumber: 'MSCU-234567-8',
    position: [25.2, -90.5],
    dropPosition: [25.8, -89.8],
    status: 'floating',
    timeInWater: 36,
    driftSpeed: 0.4,
    weight: 26000,
    dimensions: { length: 12.2, width: 2.4, height: 2.6 },
    contents: 'Furniture',
    buoyancy: 'Partially submerged',
    shipName: 'Maersk Alabama',
  },
  // Mediterranean Sea
  {
    id: 'CONT-005',
    serialNumber: 'CMAU-345678-9',
    position: [35.8, 14.2],
    dropPosition: [36.2, 14.8],
    status: 'floating',
    timeInWater: 24,
    driftSpeed: 0.25,
    weight: 29000,
    dimensions: { length: 12.2, width: 2.4, height: 2.6 },
    contents: 'Machinery',
    buoyancy: 'Floating',
    shipName: 'MSC Oscar',
  },
  // Indian Ocean
  {
    id: 'CONT-006',
    serialNumber: 'EISU-567890-2',
    position: [-8.5, 72.3],
    dropPosition: [-8.0, 73.0],
    status: 'sunken',
    timeInWater: 240,
    driftSpeed: 0.0,
    weight: 31000,
    dimensions: { length: 12.2, width: 2.4, height: 2.6 },
    contents: 'Chemicals',
    buoyancy: 'Seabed',
    shipName: 'Yang Ming Warranty',
  },
  // Pacific - near Japan
  {
    id: 'CONT-007',
    serialNumber: 'NYKU-678901-3',
    position: [32.5, 138.2],
    dropPosition: [33.0, 139.0],
    status: 'floating',
    timeInWater: 72,
    driftSpeed: 0.6,
    weight: 27000,
    dimensions: { length: 12.2, width: 2.4, height: 2.6 },
    contents: 'Consumer Goods',
    buoyancy: 'Partially submerged',
    shipName: 'ONE Contribution',
  },
  // North Pacific
  {
    id: 'CONT-008',
    serialNumber: 'HDMU-789012-4',
    position: [42.0, -155.5],
    dropPosition: [42.5, -154.8],
    status: 'floating',
    timeInWater: 96,
    driftSpeed: 0.35,
    weight: 30000,
    dimensions: { length: 12.2, width: 2.4, height: 2.6 },
    contents: 'Electronics',
    buoyancy: 'Floating',
    shipName: 'Hyundai Dream',
  },
  // South Atlantic - Cape Route
  {
    id: 'CONT-009',
    serialNumber: 'SUDU-890123-5',
    position: [-32.5, -5.2],
    dropPosition: [-32.0, -4.5],
    status: 'sunken',
    timeInWater: 312,
    driftSpeed: 0.0,
    weight: 33000,
    dimensions: { length: 12.2, width: 2.4, height: 2.6 },
    contents: 'Mining Equipment',
    buoyancy: 'Seabed',
    shipName: 'Hamburg Süd Santos',
  },
  // Arabian Sea
  {
    id: 'CONT-010',
    serialNumber: 'APLU-901234-6',
    position: [18.5, 64.8],
    dropPosition: [19.0, 65.5],
    status: 'floating',
    timeInWater: 18,
    driftSpeed: 0.28,
    weight: 28500,
    dimensions: { length: 12.2, width: 2.4, height: 2.6 },
    contents: 'Textiles',
    buoyancy: 'Partially submerged',
    shipName: 'APL Sentosa',
  },
  // Baltic Sea
  {
    id: 'CONT-011',
    serialNumber: 'FCIU-012345-7',
    position: [56.2, 18.5],
    dropPosition: [56.5, 19.0],
    status: 'floating',
    timeInWater: 6,
    driftSpeed: 0.2,
    weight: 25000,
    dimensions: { length: 12.2, width: 2.4, height: 2.6 },
    contents: 'Paper Products',
    buoyancy: 'Floating',
    shipName: 'Finnlines Finnbreeze',
  },
  // Tasman Sea
  {
    id: 'CONT-012',
    serialNumber: 'TCLU-123456-8',
    position: [-38.5, 158.2],
    dropPosition: [-38.0, 159.0],
    status: 'sunken',
    timeInWater: 480,
    driftSpeed: 0.0,
    weight: 34000,
    dimensions: { length: 12.2, width: 2.4, height: 2.6 },
    contents: 'Agricultural Equipment',
    buoyancy: 'Seabed',
    shipName: 'ANL Elaroo',
  },
];

// Major global shipping lanes
export const SAMPLE_SHIPS: ShipRoute[] = [
  // Trans-Atlantic: Europe to US East Coast
  {
    id: 'SHIP-001',
    name: 'MSC Daniela',
    points: [
      [51.0, 3.5],      // Rotterdam
      [50.5, -1.5],     // English Channel
      [49.0, -8.0],     // Irish Sea exit
      [45.0, -20.0],    // Mid-Atlantic
      [40.0, -35.0],    // Central Atlantic
      [38.0, -50.0],    // Western Atlantic
      [40.5, -74.0],    // New York
    ],
    color: '#00d9ff',
  },
  // Asia to Europe via Suez
  {
    id: 'SHIP-002',
    name: 'Ever Given',
    points: [
      [31.2, 121.5],    // Shanghai
      [22.3, 114.2],    // Hong Kong
      [10.0, 105.0],    // South China Sea
      [1.3, 103.8],     // Singapore
      [6.0, 80.0],      // Sri Lanka
      [12.5, 54.0],     // Arabian Sea
      [12.0, 45.0],     // Gulf of Aden
      [30.0, 32.5],     // Suez Canal
      [35.5, 14.5],     // Malta
      [36.0, -5.5],     // Gibraltar
      [51.0, 3.5],      // Rotterdam
    ],
    color: '#00ff88',
  },
  // Trans-Pacific: Asia to US West Coast
  {
    id: 'SHIP-003',
    name: 'COSCO Shipping Universe',
    points: [
      [31.2, 121.5],    // Shanghai
      [35.0, 130.0],    // Korea Strait
      [40.0, 145.0],    // Japan East
      [45.0, 165.0],    // North Pacific
      [48.0, -175.0],   // Mid Pacific (crosses dateline)
      [50.0, -145.0],   // Eastern Pacific
      [48.5, -125.0],   // Approaching Vancouver
      [47.6, -122.3],   // Seattle
    ],
    color: '#ff6b6b',
  },
  // Cape Route: Asia to Europe (alternative)
  {
    id: 'SHIP-004',
    name: 'Yang Ming Warranty',
    points: [
      [1.3, 103.8],     // Singapore
      [-6.0, 95.0],     // Indian Ocean
      [-15.0, 70.0],    // Central Indian Ocean
      [-25.0, 50.0],    // Madagascar
      [-35.0, 25.0],    // Cape of Good Hope
      [-30.0, 0.0],     // South Atlantic
      [-15.0, -20.0],   // Mid Atlantic
      [5.0, -25.0],     // Equatorial Atlantic
      [25.0, -30.0],    // North Atlantic
      [36.0, -5.5],     // Gibraltar
    ],
    color: '#ffd93d',
  },
  // Panama Canal Route: US East to Asia
  {
    id: 'SHIP-005',
    name: 'Maersk Alabama',
    points: [
      [40.5, -74.0],    // New York
      [32.0, -80.0],    // Charleston
      [25.8, -80.2],    // Miami
      [20.0, -85.0],    // Caribbean
      [9.0, -79.5],     // Panama Canal
      [5.0, -90.0],     // Eastern Pacific
      [10.0, -110.0],   // Central Pacific
      [20.0, -140.0],   // Mid Pacific
      [30.0, -160.0],   // North Pacific
      [35.0, -175.0],   // Western Pacific approach
      [35.0, 140.0],    // Japan
    ],
    color: '#c084fc',
  },
  // Intra-Asia Route
  {
    id: 'SHIP-006',
    name: 'ONE Contribution',
    points: [
      [35.5, 139.7],    // Tokyo
      [34.7, 135.2],    // Osaka
      [35.0, 129.0],    // Busan
      [31.2, 121.5],    // Shanghai
      [22.3, 114.2],    // Hong Kong
      [10.8, 106.7],    // Ho Chi Minh
      [1.3, 103.8],     // Singapore
    ],
    color: '#4ade80',
  },
  // Mediterranean Loop
  {
    id: 'SHIP-007',
    name: 'MSC Oscar',
    points: [
      [36.0, -5.5],     // Gibraltar
      [36.5, 4.5],      // Algiers
      [37.5, 15.0],     // Sicily
      [35.5, 14.5],     // Malta
      [35.0, 25.0],     // Crete
      [31.0, 32.5],     // Port Said
      [32.0, 34.8],     // Haifa
      [41.0, 29.0],     // Istanbul
      [40.6, 14.3],     // Naples
      [43.3, 5.4],      // Marseille
      [41.4, 2.2],      // Barcelona
      [36.0, -5.5],     // Gibraltar
    ],
    color: '#f472b6',
  },
  // South America Route
  {
    id: 'SHIP-008',
    name: 'Hamburg Süd Santos',
    points: [
      [53.5, 10.0],     // Hamburg
      [51.0, 3.5],      // Rotterdam
      [43.0, -9.0],     // Spain
      [28.5, -16.5],    // Canary Islands
      [5.0, -25.0],     // Mid Atlantic
      [-5.0, -35.0],    // Brazil approach
      [-23.0, -43.0],   // Rio de Janeiro
      [-24.0, -46.3],   // Santos
      [-34.6, -58.4],   // Buenos Aires
    ],
    color: '#fb923c',
  },
  // Australia Route
  {
    id: 'SHIP-009',
    name: 'ANL Elaroo',
    points: [
      [1.3, 103.8],     // Singapore
      [-6.0, 106.8],    // Jakarta
      [-12.0, 120.0],   // Timor Sea
      [-18.0, 135.0],   // Northern Australia
      [-27.5, 153.0],   // Brisbane
      [-33.9, 151.2],   // Sydney
      [-37.8, 144.9],   // Melbourne
      [-35.0, 138.5],   // Adelaide
      [-32.0, 115.8],   // Fremantle
    ],
    color: '#38bdf8',
  },
  // Arctic Route (Northern Sea Route)
  {
    id: 'SHIP-010',
    name: 'Christophe de Margerie',
    points: [
      [69.0, 33.0],     // Murmansk
      [72.0, 55.0],     // Kara Sea
      [75.0, 85.0],     // Laptev Sea
      [73.0, 120.0],    // East Siberian Sea
      [68.0, 150.0],    // Chukchi Sea
      [65.0, 170.0],    // Bering Strait
      [55.0, 165.0],    // North Pacific
      [45.0, 145.0],    // Japan approach
    ],
    color: '#a5f3fc',
  },
];