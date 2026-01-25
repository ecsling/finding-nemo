'use client';

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { motion } from 'framer-motion-3d';

interface AnimatedShipEntryProps {
  targetPosition: THREE.Vector3;
  onComplete?: () => void;
  duration?: number;
}

export default function AnimatedShipEntry({
  targetPosition,
  onComplete,
  duration = 3,
}: AnimatedShipEntryProps) {
  const { camera } = useThree();
  const animationProgress = useRef(0);
  const startPosition = useRef(camera.position.clone());
  const startTime = useRef(Date.now());

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    animationProgress.current = Math.min(elapsed / duration, 1);

    // Smooth easing function (ease-in-out)
    const eased = animationProgress.current < 0.5
      ? 2 * animationProgress.current * animationProgress.current
      : 1 - Math.pow(-2 * animationProgress.current + 2, 2) / 2;

    // Interpolate camera position
    camera.position.lerpVectors(
      startPosition.current,
      targetPosition,
      eased
    );

    // Look at target
    camera.lookAt(targetPosition);

    // Call onComplete when animation finishes
    if (animationProgress.current >= 1 && onComplete) {
      onComplete();
    }
  });

  return null;
}

// Dive transition effect component
interface DiveTransitionProps {
  active: boolean;
  onComplete?: () => void;
}

export function DiveTransition({ active, onComplete }: DiveTransitionProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && active) {
      // Ripple effect
      const time = state.clock.elapsedTime * 2;
      meshRef.current.position.z = Math.sin(time) * 0.5;

      // Fade out after 2 seconds
      if (time > 4 && onComplete) {
        onComplete();
      }
    }
  });

  if (!active) return null;

  return (
    <group>
      {/* Water surface effect */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <planeGeometry args={[10, 10, 32, 32]} />
        <meshStandardMaterial
          color="#1a5490"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          wireframe
        />
      </mesh>

      {/* Bubbles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.mesh
          key={i}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: 5,
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            delay: i * 0.1,
            repeat: Infinity,
          }}
          position={[
            (Math.random() - 0.5) * 2,
            0,
            (Math.random() - 0.5) * 2,
          ]}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#00d9ff" transparent opacity={0.5} />
        </motion.mesh>
      ))}
    </group>
  );
}
