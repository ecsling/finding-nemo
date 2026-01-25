import * as THREE from 'three';

export function latLongToVector3(lat: number, lon: number, radius: number = 1): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

export function getPositionOnPath(
  path: THREE.Vector3[],
  progress: number
): THREE.Vector3 {
  if (path.length === 0) return new THREE.Vector3();
  if (path.length === 1) return path[0].clone();

  const totalSegments = path.length - 1;
  const scaledProgress = progress * totalSegments;
  const segmentIndex = Math.floor(scaledProgress);
  const segmentProgress = scaledProgress - segmentIndex;

  if (segmentIndex >= totalSegments) {
    return path[path.length - 1].clone();
  }

  const start = path[segmentIndex];
  const end = path[segmentIndex + 1];

  return new THREE.Vector3().lerpVectors(start, end, segmentProgress);
}

export function calculateHeading(from: THREE.Vector3, to: THREE.Vector3): number {
  const direction = new THREE.Vector3().subVectors(to, from).normalize();
  const heading = Math.atan2(direction.x, direction.z) * (180 / Math.PI);
  return (heading + 360) % 360;
}
