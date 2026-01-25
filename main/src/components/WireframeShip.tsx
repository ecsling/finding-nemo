'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

interface WireframeShipProps {
  position: [number, number, number];
  modelPath?: string;
  scale?: number;
  onClick?: () => void;
  highlighted?: boolean;
  color?: string;
}

export default function WireframeShip({
  position,
  modelPath = '/assets/cargo_ship.glb',
  scale = 0.01,
  onClick,
  highlighted = false,
  color = '#00d9ff',
}: WireframeShipProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Load ship model
  const gltf = useLoader(GLTFLoader, modelPath);

  // Create wireframe material
  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: highlighted || hovered ? '#DF6C42' : color,
    wireframe: true,
    transparent: true,
    opacity: highlighted || hovered ? 1.0 : 0.8,
  });

  // Clone the model and apply wireframe
  useEffect(() => {
    if (gltf && groupRef.current) {
      groupRef.current.clear();

      const clone = gltf.scene.clone();
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.material = wireframeMaterial;
        }
      });

      groupRef.current.add(clone);
    }
  }, [gltf, highlighted, hovered]);

  // Gentle bobbing animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;

      // Gentle rotation when highlighted
      if (highlighted || hovered) {
        groupRef.current.rotation.y += 0.01;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Glow effect when highlighted */}
      {(highlighted || hovered) && (
        <pointLight
          color={highlighted || hovered ? '#DF6C42' : color}
          intensity={2}
          distance={0.5}
        />
      )}
    </group>
  );
}
