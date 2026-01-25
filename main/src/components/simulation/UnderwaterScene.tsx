'use client';

import { useRef, Suspense } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import MeshWave from '../MeshWave';

interface UnderwaterSceneProps {
  containerModelPath?: string;
  seabedModelPath?: string;
  position?: [number, number, number];
  depth?: number;
  onContainerClick?: () => void;
}

// Floating particles (plankton/debris)
function UnderwaterParticles() {
  const particlesRef = useRef<THREE.Points>(null);

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(500 * 3);

  for (let i = 0; i < 500; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  useFrame((state) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position;

      for (let i = 0; i < positions.count; i++) {
        let y = positions.getY(i);
        y += 0.002;
        if (y > 5) y = -5;
        positions.setY(i, y);
      }

      positions.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial
        size={0.02}
        color="#ffffff"
        transparent
        opacity={0.3}
        sizeAttenuation
      />
    </points>
  );
}

// Container model component
function ContainerModel({
  modelPath,
  position,
  onClick,
}: {
  modelPath: string;
  position: [number, number, number];
  onClick?: () => void;
}) {
  const gltf = useLoader(GLTFLoader, modelPath);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Subtle settling animation
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={position} onClick={onClick}>
      <primitive object={gltf.scene.clone()} scale={0.5} />

      {/* Spotlights on container */}
      <spotLight
        position={[2, 3, 2]}
        angle={0.5}
        penumbra={0.5}
        intensity={2}
        color="#00d9ff"
        target-position={position}
      />
      <spotLight
        position={[-2, 3, -2]}
        angle={0.5}
        penumbra={0.5}
        intensity={2}
        color="#00d9ff"
        target-position={position}
      />
    </group>
  );
}

// Seabed/bathymetry model
function SeabedModel({ modelPath }: { modelPath: string }) {
  const gltf = useLoader(GLTFLoader, modelPath);

  return (
    <group position={[0, -5, 0]} scale={0.1}>
      <primitive object={gltf.scene.clone()} />
    </group>
  );
}

// Caustic light effect
function CausticLight() {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <directionalLight
      ref={lightRef}
      position={[0, 10, 0]}
      intensity={0.5}
      color="#4da6ff"
      castShadow
    />
  );
}

export default function UnderwaterScene({
  containerModelPath = '/assets/shipping_container.glb',
  seabedModelPath = '/assets/kelvin_seamounts_atlantico_norte.glb',
  position = [0, 0, 0],
  depth = 2850,
  onContainerClick,
}: UnderwaterSceneProps) {
  return (
    <group position={position}>
      {/* Ambient underwater lighting */}
      <ambientLight intensity={0.2} color="#0a4d7a" />

      {/* Caustic light effect */}
      <CausticLight />

      {/* Top-down light (surface light penetration) */}
      <hemisphereLight
        skyColor="#1a5490"
        groundColor="#0a1f35"
        intensity={0.3}
        position={[0, 10, 0]}
      />

      {/* Seabed */}
      <Suspense fallback={null}>
        <SeabedModel modelPath={seabedModelPath} />
      </Suspense>

      {/* Container */}
      <Suspense fallback={null}>
        <ContainerModel
          modelPath={containerModelPath}
          position={[0, 0, 0]}
          onClick={onContainerClick}
        />
      </Suspense>

      {/* Water surface/waves above */}
      <MeshWave
        position={[0, 5, 0]}
        size={[30, 30]}
        segments={[40, 40]}
        speed={0.5}
        amplitude={0.1}
        color="#1a5490"
      />

      {/* Underwater particles */}
      <UnderwaterParticles />

      {/* Fog for depth effect */}
      <fog attach="fog" args={['#0a1f35', 5, 30]} />

      {/* Depth indicator marker */}
      <group position={[5, 2, 0]}>
        <mesh>
          <boxGeometry args={[0.1, depth / 100, 0.1]} />
          <meshBasicMaterial color="#DF6C42" transparent opacity={0.5} />
        </mesh>
        {/* Depth label */}
        <mesh position={[0, depth / 200, 0]}>
          <planeGeometry args={[2, 0.5]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.7} />
        </mesh>
      </group>
    </group>
  );
}
