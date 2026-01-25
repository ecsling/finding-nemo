export function latLongToVector3(lat: number, long: number, radius: number): [number, number, number] {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = long * (Math.PI / 180);
  
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
  
    return [x, y, z];
  }
  
  // Linear interpolation between two coordinates (good enough for short distances)
  export function interpolateCoordinates(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    t: number // 0 to 1
  ): { lat: number; lng: number } {
    // Simple linear interpolation (good enough for short distances)
    return {
      lat: start.lat + (end.lat - start.lat) * t,
      lng: start.lng + (end.lng - start.lng) * t,
    };
  }
  
  // Get position along a path of coordinates
  export function getPositionOnPath(
    path: { lat: number; lng: number }[],
    progress: number // 0 to 1
  ): { lat: number; lng: number; segmentIndex: number } {
    if (path.length === 0) {
      throw new Error('Path cannot be empty');
    }
    if (path.length < 2) return { ...path[0], segmentIndex: 0 };
  
    const totalSegments = path.length - 1;
    const scaledProgress = progress * totalSegments;
    const segmentIndex = Math.min(Math.floor(scaledProgress), totalSegments - 1);
    const segmentProgress = scaledProgress - segmentIndex;
  
    const start = path[segmentIndex];
    const end = path[segmentIndex + 1];
  
    return {
      ...interpolateCoordinates(start, end, segmentProgress),
      segmentIndex,
    };
  }
  
  // Calculate heading between two coordinates (for asset rotation)
  export function calculateHeading(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): number {
    const dLng = (to.lng - from.lng) * Math.PI / 180;
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat * Math.PI / 180;
  
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  
    let heading = Math.atan2(y, x) * 180 / Math.PI;
    return (heading + 360) % 360;
  }