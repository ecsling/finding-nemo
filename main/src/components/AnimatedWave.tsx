'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AnimatedWaveProps {
  radius?: number;
  segments?: number;
  waveHeight?: number;
  speed?: number;
  color?: string;
}

export default function AnimatedWave({
  radius = 2.05,
  segments = 128,
  waveHeight = 0.05,
  speed = 1,
  color = '#1a5490',
}: AnimatedWaveProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry as THREE.SphereGeometry;
      const positionAttribute = geometry.attributes.position;
      const time = state.clock.elapsedTime * speed;

      // Apply wave displacement to sphere surface
      for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);

        const vector = new THREE.Vector3(x, y, z);
        const length = vector.length();

        // Create wave pattern
        const wave = Math.sin(x * 5 + time) *
                     Math.sin(y * 5 + time * 0.7) *
                     Math.sin(z * 5 + time * 1.3) *
                     waveHeight;

        vector.normalize().multiplyScalar(length + wave);

        positionAttribute.setXYZ(i, vector.x, vector.y, vector.z);
      }

      positionAttribute.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, segments, segments]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.6}
        roughness={0.1}
        metalness={0.9}
        wireframe={false}
      />
    </mesh>
  );
}
