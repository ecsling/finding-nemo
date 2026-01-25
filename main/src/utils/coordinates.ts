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
  path: THREE.Vector3[] | { lat: number; lon: number }[],
  progress: number
): THREE.Vector3 | { lat: number; lon: number } {
  if (path.length === 0) return new THREE.Vector3();
  if (path.length === 1) {
    return path[0] instanceof THREE.Vector3 ? path[0].clone() : path[0];
  }

  const totalSegments = path.length - 1;
  const scaledProgress = progress * totalSegments;
  const segmentIndex = Math.floor(scaledProgress);
  const segmentProgress = scaledProgress - segmentIndex;

  if (segmentIndex >= totalSegments) {
    return path[path.length - 1] instanceof THREE.Vector3 
      ? (path[path.length - 1] as THREE.Vector3).clone() 
      : path[path.length - 1];
  }

  const start = path[segmentIndex];
  const end = path[segmentIndex + 1];

  if (start instanceof THREE.Vector3 && end instanceof THREE.Vector3) {
    return new THREE.Vector3().lerpVectors(start, end, segmentProgress);
  } else {
    // Interpolate lat/lon coordinates
    const startCoord = start as { lat: number; lon: number };
    const endCoord = end as { lat: number; lon: number };
    return {
      lat: startCoord.lat + (endCoord.lat - startCoord.lat) * segmentProgress,
      lon: startCoord.lon + (endCoord.lon - startCoord.lon) * segmentProgress,
    };
  }
}

export function calculateHeading(from: THREE.Vector3, to: THREE.Vector3): number {
  const direction = new THREE.Vector3().subVectors(to, from).normalize();
  const heading = Math.atan2(direction.x, direction.z) * (180 / Math.PI);
  return (heading + 360) % 360;
}
