/**
 * Geospatial Utilities for OceanCache
 * Coordinate transformations, distance calculations, and spatial analysis
 */

import type { GPSCoordinate } from '@/models/SearchOptimization';

// Earth radius in meters (mean radius)
const EARTH_RADIUS_M = 6371000;

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculate Haversine distance between two GPS coordinates
 * Returns distance in meters
 *
 * Formula: a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
 *          c = 2 ⋅ atan2( √a, √(1−a) )
 *          d = R ⋅ c
 */
export function haversineDistance(
  point1: GPSCoordinate,
  point2: GPSCoordinate
): number {
  const φ1 = degreesToRadians(point1.latitude);
  const φ2 = degreesToRadians(point2.latitude);
  const Δφ = degreesToRadians(point2.latitude - point1.latitude);
  const Δλ = degreesToRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
}

/**
 * Calculate bearing (direction) from point1 to point2
 * Returns bearing in degrees (0-360, where 0 is North)
 *
 * Formula: θ = atan2( sin Δλ ⋅ cos φ2 , cos φ1 ⋅ sin φ2 − sin φ1 ⋅ cos φ2 ⋅ cos Δλ )
 */
export function calculateBearing(
  point1: GPSCoordinate,
  point2: GPSCoordinate
): number {
  const φ1 = degreesToRadians(point1.latitude);
  const φ2 = degreesToRadians(point2.latitude);
  const Δλ = degreesToRadians(point2.longitude - point1.longitude);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return (radiansToDegrees(θ) + 360) % 360; // Normalize to 0-360
}

/**
 * Calculate destination point given distance and bearing from origin
 *
 * Formula: φ2 = asin( sin φ1 ⋅ cos δ + cos φ1 ⋅ sin δ ⋅ cos θ )
 *          λ2 = λ1 + atan2( sin θ ⋅ sin δ ⋅ cos φ1, cos δ − sin φ1 ⋅ sin φ2 )
 */
export function destinationPoint(
  origin: GPSCoordinate,
  distanceMeters: number,
  bearingDegrees: number
): GPSCoordinate {
  const δ = distanceMeters / EARTH_RADIUS_M; // Angular distance
  const θ = degreesToRadians(bearingDegrees);
  const φ1 = degreesToRadians(origin.latitude);
  const λ1 = degreesToRadians(origin.longitude);

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  );

  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
    );

  return {
    latitude: radiansToDegrees(φ2),
    longitude: radiansToDegrees(λ2),
    altitude: origin.altitude,
  };
}

/**
 * Calculate perpendicular distance from a point to a line segment
 * Uses cross-track distance formula for great circle routes
 * Returns distance in meters
 */
export function perpendicularDistance(
  point: GPSCoordinate,
  lineStart: GPSCoordinate,
  lineEnd: GPSCoordinate
): number {
  const d13 = haversineDistance(lineStart, point) / EARTH_RADIUS_M;
  const θ13 = degreesToRadians(calculateBearing(lineStart, point));
  const θ12 = degreesToRadians(calculateBearing(lineStart, lineEnd));

  const δxt = Math.asin(Math.sin(d13) * Math.sin(θ13 - θ12));

  return Math.abs(δxt) * EARTH_RADIUS_M;
}

/**
 * Calculate minimum distance from a point to a polyline (vessel route)
 * Returns the shortest perpendicular distance to any segment
 */
export function distanceToPolyline(
  point: GPSCoordinate,
  polyline: GPSCoordinate[]
): number {
  if (polyline.length < 2) {
    return polyline.length === 1
      ? haversineDistance(point, polyline[0])
      : Infinity;
  }

  let minDistance = Infinity;

  for (let i = 0; i < polyline.length - 1; i++) {
    const distance = perpendicularDistance(point, polyline[i], polyline[i + 1]);
    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
}

/**
 * Create a spatial grid around a center point
 * Returns array of grid cell centroids
 */
export function createSpatialGrid(
  center: GPSCoordinate,
  radiusMeters: number,
  cellSizeMeters: number
): GPSCoordinate[] {
  const grid: GPSCoordinate[] = [];
  const cellsPerSide = Math.ceil((radiusMeters * 2) / cellSizeMeters);
  const halfCells = Math.floor(cellsPerSide / 2);

  for (let i = -halfCells; i <= halfCells; i++) {
    for (let j = -halfCells; j <= halfCells; j++) {
      // Calculate offset in meters
      const eastOffset = i * cellSizeMeters;
      const northOffset = j * cellSizeMeters;

      // Convert to bearing and distance
      const distance = Math.sqrt(
        eastOffset * eastOffset + northOffset * northOffset
      );

      if (distance <= radiusMeters) {
        const bearing = Math.atan2(eastOffset, northOffset) * (180 / Math.PI);
        const cellCenter = destinationPoint(
          center,
          distance,
          (bearing + 360) % 360
        );
        grid.push(cellCenter);
      }
    }
  }

  return grid;
}

/**
 * Calculate centroid (center point) of a polygon
 */
export function calculateCentroid(points: GPSCoordinate[]): GPSCoordinate {
  if (points.length === 0) {
    throw new Error('Cannot calculate centroid of empty polygon');
  }

  const sumLat = points.reduce((sum, p) => sum + p.latitude, 0);
  const sumLon = points.reduce((sum, p) => sum + p.longitude, 0);
  const sumAlt = points.reduce(
    (sum, p) => sum + (p.altitude || 0),
    0
  );

  return {
    latitude: sumLat / points.length,
    longitude: sumLon / points.length,
    altitude: sumAlt / points.length,
  };
}

/**
 * Calculate polygon area using spherical excess formula
 * Returns area in square meters
 */
export function calculatePolygonArea(points: GPSCoordinate[]): number {
  if (points.length < 3) return 0;

  // Convert to radians
  const coords = points.map((p) => ({
    lat: degreesToRadians(p.latitude),
    lon: degreesToRadians(p.longitude),
  }));

  let area = 0;

  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    area += coords[i].lon * coords[j].lat - coords[j].lon * coords[i].lat;
  }

  area = Math.abs(area / 2);

  // Convert from steradians to square meters
  return area * EARTH_RADIUS_M * EARTH_RADIUS_M;
}

/**
 * Check if a point is inside a polygon (ray casting algorithm)
 */
export function isPointInPolygon(
  point: GPSCoordinate,
  polygon: GPSCoordinate[]
): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersect =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Estimate ocean current drift over time
 *
 * @param startPosition Initial position
 * @param currentSpeed Current speed in m/s
 * @param currentDirection Current direction in degrees (0 = North)
 * @param durationHours Time in hours
 * @param samples Number of position samples to generate
 */
export function calculateDrift(
  startPosition: GPSCoordinate,
  currentSpeed: number,
  currentDirection: number,
  durationHours: number,
  samples: number = 10
): GPSCoordinate[] {
  const trajectory: GPSCoordinate[] = [startPosition];
  const totalDistanceMeters = currentSpeed * durationHours * 3600; // Convert hours to seconds
  const segmentDistance = totalDistanceMeters / samples;

  let currentPosition = startPosition;

  for (let i = 1; i <= samples; i++) {
    currentPosition = destinationPoint(
      currentPosition,
      segmentDistance,
      currentDirection
    );
    trajectory.push(currentPosition);
  }

  return trajectory;
}

/**
 * Convert GPS coordinates to Cartesian coordinates (for Three.js)
 * Uses equirectangular projection (simple approximation)
 *
 * @param point GPS coordinate
 * @param referencePoint Origin point for relative positioning
 * @param scale Scale factor (meters per unit)
 */
export function gpsToCartesian(
  point: GPSCoordinate,
  referencePoint: GPSCoordinate,
  scale: number = 1
): { x: number; y: number; z: number } {
  const φ = degreesToRadians(referencePoint.latitude);

  const deltaLat = point.latitude - referencePoint.latitude;
  const deltaLon = point.longitude - referencePoint.longitude;

  // Equirectangular projection
  const x = (deltaLon * EARTH_RADIUS_M * Math.cos(φ)) / scale;
  const z = (deltaLat * EARTH_RADIUS_M) / scale;
  const y = (point.altitude || 0) / scale;

  return { x, y, z };
}

/**
 * Convert Cartesian coordinates back to GPS
 */
export function cartesianToGPS(
  cartesian: { x: number; y: number; z: number },
  referencePoint: GPSCoordinate,
  scale: number = 1
): GPSCoordinate {
  const φ = degreesToRadians(referencePoint.latitude);

  const deltaLon = (cartesian.x * scale) / (EARTH_RADIUS_M * Math.cos(φ));
  const deltaLat = (cartesian.z * scale) / EARTH_RADIUS_M;

  return {
    latitude: referencePoint.latitude + deltaLat,
    longitude: referencePoint.longitude + deltaLon,
    altitude: cartesian.y * scale,
  };
}

/**
 * Validate ISO 6346 container serial number check digit
 *
 * Format: AAAU-123456-7
 * - AAA: Owner code (3 letters)
 * - U: Category identifier (U, J, or Z)
 * - 123456: Serial number (6 digits)
 * - 7: Check digit (1 digit)
 */
export function validateContainerSerial(serial: string): boolean {
  // Remove hyphens and convert to uppercase
  const cleaned = serial.replace(/-/g, '').toUpperCase();

  // Check format: 4 letters + 6 digits + 1 digit
  const regex = /^[A-Z]{4}\d{7}$/;
  if (!regex.test(cleaned)) return false;

  // Validate check digit using ISO 6346 algorithm
  const letters = cleaned.substring(0, 4);
  const numbers = cleaned.substring(4, 10);
  const checkDigit = parseInt(cleaned.charAt(10), 10);

  // Convert letters to numbers (A=10, B=12, C=13, ..., Z=38)
  // ISO 6346 skips values 11, 22, and 33
  const letterValues: { [key: string]: number } = {};
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((letter, index) => {
    let value = 10 + index;
    if (index >= 1) value += 1;   // Skip 11 (after A)
    if (index >= 11) value += 1;  // Skip 22 (after K)
    if (index >= 21) value += 1;  // Skip 33 (after U)
    letterValues[letter] = value;
  });

  let sum = 0;
  let position = 0;

  // Calculate sum for letters
  for (const letter of letters) {
    sum += letterValues[letter] * Math.pow(2, position);
    position++;
  }

  // Calculate sum for numbers
  for (const digit of numbers) {
    sum += parseInt(digit, 10) * Math.pow(2, position);
    position++;
  }

  // Calculate check digit: (sum mod 11) mod 10
  const calculated = (sum % 11) % 10;

  return calculated === checkDigit;
}

/**
 * Parse container serial number into components
 */
export function parseContainerSerial(serial: string): {
  ownerCode: string;
  categoryIdentifier: string;
  serialNumber: string;
  checkDigit: string;
  isValid: boolean;
} {
  const cleaned = serial.replace(/-/g, '').toUpperCase();

  return {
    ownerCode: cleaned.substring(0, 3),
    categoryIdentifier: cleaned.charAt(3),
    serialNumber: cleaned.substring(4, 10),
    checkDigit: cleaned.charAt(10),
    isValid: validateContainerSerial(serial),
  };
}

/**
 * Calculate depth pressure in bars
 * Formula: P = ρgh / 10⁵
 * where ρ = water density (1025 kg/m³), g = 9.81 m/s², h = depth in meters
 */
export function calculatePressure(depthMeters: number): number {
  const waterDensity = 1025; // kg/m³ (seawater)
  const gravity = 9.81; // m/s²

  // Pressure in pascals, then convert to bars (1 bar = 10⁵ Pa)
  const pressureBars = (waterDensity * gravity * depthMeters) / 100000;

  // Add atmospheric pressure (1 bar)
  return pressureBars + 1;
}

/**
 * Normalize angle to 0-360 range
 */
export function normalizeAngle(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/**
 * Calculate angle difference (shortest path)
 */
export function angleDifference(angle1: number, angle2: number): number {
  let diff = normalizeAngle(angle2) - normalizeAngle(angle1);
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}
