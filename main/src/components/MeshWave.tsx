'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MeshWaveProps {
  position?: [number, number, number];
  size?: [number, number];
  segments?: [number, number];
  speed?: number;
  amplitude?: number;
  color?: string;
}

export default function MeshWave({
  position = [0, 0, 0],
  size = [10, 10],
  segments = [50, 50],
  speed = 1,
  amplitude = 0.2,
  color = '#1a5490',
}: MeshWaveProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry as THREE.PlaneGeometry;
      const positionAttribute = geometry.attributes.position;

      // Create wave effect
      for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);

        const wave1 = Math.sin(x * 2 + state.clock.elapsedTime * speed) * amplitude;
        const wave2 = Math.sin(y * 2 + state.clock.elapsedTime * speed * 0.7) * amplitude * 0.5;

        positionAttribute.setZ(i, wave1 + wave2);
      }

      positionAttribute.needsUpdate = true;
      geometry.computeVertexNormals();
    }

    // Animate opacity for underwater effect
    if (materialRef.current) {
      materialRef.current.opacity = 0.7 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[...size, ...segments]} />
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={0.7}
        side={THREE.DoubleSide}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}
