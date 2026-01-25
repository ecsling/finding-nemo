/**
 * OceanCache Probability Calculation Engine
 * Multi-factor spatial analysis for container recovery optimization
 */

import type {
  IncidentInput,
  ProbabilityZone,
  ProbabilityFactors,
  SearchStrategy,
  SearchMetrics,
  GPSCoordinate,
  HistoricalIncident,
  DriftModel,
} from '@/models/SearchOptimization';
import { SEARCH_CONSTANTS } from '@/models/SearchOptimization';
import {
  haversineDistance,
  distanceToPolyline,
  createSpatialGrid,
  calculateCentroid,
  calculatePolygonArea,
  calculateDrift,
  destinationPoint,
} from './geo-utils';

/**
 * Calculate distance decay probability using Gaussian distribution
 * Probability decreases exponentially with distance from incident point
 *
 * Formula: P = exp(-(d²) / (2σ²))
 * where d = distance, σ = search radius / 3 (99.7% within 3σ)
 */
function calculateDistanceDecay(
  pointDistance: number,
  searchRadiusMeters: number
): number {
  const sigma = searchRadiusMeters / 3;
  const exponent = -(pointDistance ** 2) / (2 * sigma ** 2);
  return Math.exp(exponent);
}

/**
 * Calculate route proximity score
 * Higher probability near vessel's travel path
 *
 * Formula: P = 1 - (perpDistance / maxRouteDistance)
 * Capped at 0 for points far from route
 */
function calculateRouteProximity(
  point: GPSCoordinate,
  routePoints: GPSCoordinate[],
  maxDistanceMeters: number
): number {
  if (routePoints.length < 2) return 0;

  const distance = distanceToPolyline(point, routePoints);
  const proximity = Math.max(0, 1 - distance / maxDistanceMeters);

  return proximity;
}

/**
 * Calculate ocean current influence
 * Estimate drift direction and assign probability based on alignment
 *
 * Formula: P = exp(-(angularDiff²) / (2 * 30²)) * (1 - driftDistError)
 * where angularDiff = difference between point direction and current direction
 */
function calculateCurrentInfluence(
  point: GPSCoordinate,
  incidentLocation: GPSCoordinate,
  currentSpeed: number, // m/s
  currentDirection: number, // degrees
  timeInWaterHours: number
): number {
  // Calculate expected drift distance
  const expectedDriftMeters = currentSpeed * timeInWaterHours * 3600;

  // Calculate actual distance from incident
  const actualDistance = haversineDistance(point, incidentLocation);

  // Calculate expected drift endpoint
  const driftEndpoint = destinationPoint(
    incidentLocation,
    expectedDriftMeters,
    currentDirection
  );

  // Distance between point and drift endpoint
  const driftDistanceError = haversineDistance(point, driftEndpoint);

  // Normalize error (closer = higher probability)
  const driftAlignment = Math.max(
    0,
    1 - driftDistanceError / (expectedDriftMeters * 2)
  );

  return driftAlignment;
}

/**
 * Calculate cluster analysis score
 * Higher probability in areas with historical loss incidents
 *
 * Uses Gaussian kernel density estimation
 * Formula: P = Σ exp(-(d_i²) / (2σ²)) / n
 */
function calculateClusterScore(
  point: GPSCoordinate,
  historicalIncidents: HistoricalIncident[],
  bandwidthMeters: number = 5000 // Kernel bandwidth
): number {
  if (historicalIncidents.length === 0) return 0;

  let densitySum = 0;

  for (const incident of historicalIncidents) {
    const distance = haversineDistance(point, incident.location);
    const kernel = Math.exp(-(distance ** 2) / (2 * bandwidthMeters ** 2));
    densitySum += kernel;
  }

  // Normalize by number of incidents
  return densitySum / historicalIncidents.length;
}

/**
 * Calculate depth factor influence
 * Containers settle in shallower areas vs deep trenches
 * Simple heuristic based on typical seafloor topology
 */
function calculateDepthFactor(depthMeters: number): number {
  // Optimal depth range: 1000-3000m (most common container loss depth)
  const optimalDepthMin = 1000;
  const optimalDepthMax = 3000;

  if (depthMeters >= optimalDepthMin && depthMeters <= optimalDepthMax) {
    return 1.0; // Optimal depth range
  } else if (depthMeters < optimalDepthMin) {
    // Shallower: Higher wave action, faster current
    return 0.7 + (depthMeters / optimalDepthMin) * 0.3;
  } else {
    // Deeper: Harder to reach, but more stable
    return Math.max(0.3, 1.0 - (depthMeters - optimalDepthMax) / 5000);
  }
}

/**
 * Calculate composite probability score for a single grid cell
 * Combines all factors using weighted sum
 */
function calculateCellProbability(
  point: GPSCoordinate,
  incident: IncidentInput,
  searchRadiusMeters: number,
  depthMeters: number
): { score: number; factors: ProbabilityFactors } {
  const weights = SEARCH_CONSTANTS.WEIGHTS;

  // Calculate individual factors
  const distance = haversineDistance(point, incident.gpsCoordinates);
  const distanceDecay = calculateDistanceDecay(distance, searchRadiusMeters);

  const routeProximity = incident.vesselRoute
    ? calculateRouteProximity(point, incident.vesselRoute.points, searchRadiusMeters / 2)
    : 0;

  const currentInfluence = incident.environmentalConditions?.oceanCurrents?.[0]
    ? calculateCurrentInfluence(
        point,
        incident.gpsCoordinates,
        incident.environmentalConditions.oceanCurrents[0].speed,
        incident.environmentalConditions.oceanCurrents[0].direction,
        incident.estimatedTimeInWater || 24 // Default 24 hours
      )
    : 0;

  const clusterScore = incident.historicalData
    ? calculateClusterScore(point, incident.historicalData)
    : 0;

  const depthFactor = calculateDepthFactor(depthMeters);

  const factors: ProbabilityFactors = {
    distanceDecay,
    routeProximity,
    currentInfluence,
    clusterScore,
    depthFactor,
  };

  // Weighted sum
  const compositeScore =
    distanceDecay * weights.DISTANCE_DECAY +
    routeProximity * weights.ROUTE_PROXIMITY +
    currentInfluence * weights.CURRENT_INFLUENCE +
    clusterScore * weights.CLUSTER_SCORE +
    depthFactor * weights.DEPTH_FACTOR;

  return { score: compositeScore, factors };
}

/**
 * Aggregate grid cells into probability zones
 * Groups adjacent high-probability cells into zones
 */
function aggregateCellsIntoZones(
  gridCells: Array<{ location: GPSCoordinate; score: number; factors: ProbabilityFactors }>,
  cellSizeMeters: number
): ProbabilityZone[] {
  const zones: ProbabilityZone[] = [];

  // Sort cells by probability score (descending)
  const sortedCells = gridCells
    .slice()
    .sort((a, b) => b.score - a.score);

  // Group cells into priority tiers
  const highPriorityCells = sortedCells.filter(
    (c) => c.score >= SEARCH_CONSTANTS.PRIORITY_THRESHOLDS.HIGH
  );
  const mediumPriorityCells = sortedCells.filter(
    (c) =>
      c.score >= SEARCH_CONSTANTS.PRIORITY_THRESHOLDS.MEDIUM &&
      c.score < SEARCH_CONSTANTS.PRIORITY_THRESHOLDS.HIGH
  );
  const lowPriorityCells = sortedCells.filter(
    (c) => c.score < SEARCH_CONSTANTS.PRIORITY_THRESHOLDS.MEDIUM
  );

  // Create zones for each priority level
  const createZone = (
    cells: typeof sortedCells,
    priority: 'high' | 'medium' | 'low'
  ): ProbabilityZone | null => {
    if (cells.length === 0) return null;

    const coordinates = cells.map((c) => c.location);
    const centroid = calculateCentroid(coordinates);
    const avgScore = cells.reduce((sum, c) => sum + c.score, 0) / cells.length;
    const avgFactors: ProbabilityFactors = {
      distanceDecay:
        cells.reduce((sum, c) => sum + c.factors.distanceDecay, 0) / cells.length,
      routeProximity:
        cells.reduce((sum, c) => sum + c.factors.routeProximity, 0) / cells.length,
      currentInfluence:
        cells.reduce((sum, c) => sum + c.factors.currentInfluence, 0) / cells.length,
      clusterScore:
        cells.reduce((sum, c) => sum + c.factors.clusterScore, 0) / cells.length,
      depthFactor:
        cells.reduce((sum, c) => sum + c.factors.depthFactor, 0) / cells.length,
    };

    // Approximate area (cell count * cell area)
    const area = cells.length * cellSizeMeters * cellSizeMeters;

    // Estimate search duration (simplified: 1 hour per 100,000 m²)
    const estimatedSearchDuration = area / 100000;

    return {
      id: `zone-${priority}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      coordinates,
      centroid,
      probabilityScore: avgScore,
      priority,
      area,
      factors: avgFactors,
      estimatedSearchDuration,
      confidenceInterval: {
        lower: avgScore * 0.8, // 20% confidence margin
        upper: Math.min(1, avgScore * 1.2),
      },
    };
  };

  const highZone = createZone(highPriorityCells, 'high');
  const mediumZone = createZone(mediumPriorityCells, 'medium');
  const lowZone = createZone(lowPriorityCells, 'low');

  if (highZone) zones.push(highZone);
  if (mediumZone) zones.push(mediumZone);
  if (lowZone) zones.push(lowZone);

  return zones;
}

/**
 * Calculate search metrics for a strategy
 */
function calculateSearchMetrics(zones: ProbabilityZone[]): SearchMetrics {
  const totalAreaM2 = zones.reduce((sum, zone) => sum + zone.area, 0);
  const totalAreaKm2 = totalAreaM2 / 1000000;

  const zoneCoverage = {
    high:
      zones
        .filter((z) => z.priority === 'high')
        .reduce((sum, z) => sum + z.area, 0) / 1000000,
    medium:
      zones
        .filter((z) => z.priority === 'medium')
        .reduce((sum, z) => sum + z.area, 0) / 1000000,
    low:
      zones
        .filter((z) => z.priority === 'low')
        .reduce((sum, z) => sum + z.area, 0) / 1000000,
  };

  // Estimate duration (hours): sum of zone search durations
  const estimatedDurationHours = zones.reduce(
    (sum, zone) => sum + zone.estimatedSearchDuration,
    0
  );
  const estimatedDurationDays = estimatedDurationHours / 24;

  // Estimate cost using constants
  const vesselCost =
    estimatedDurationDays * SEARCH_CONSTANTS.COSTS.VESSEL_OPERATION_PER_DAY;
  const diveTeamCost =
    estimatedDurationDays * SEARCH_CONSTANTS.COSTS.DIVE_TEAM_PER_DAY;
  const equipmentCost = SEARCH_CONSTANTS.COSTS.EQUIPMENT_BASE;
  const fuelCost = totalAreaKm2 * SEARCH_CONSTANTS.COSTS.FUEL_PER_KM;
  const estimatedCost = vesselCost + diveTeamCost + equipmentCost + fuelCost;

  // Recovery probability: weighted by zone priority
  const highProbWeight = 0.8;
  const mediumProbWeight = 0.5;
  const lowProbWeight = 0.2;

  const highArea = zoneCoverage.high;
  const mediumArea = zoneCoverage.medium;
  const lowArea = zoneCoverage.low;

  const recoveryProbability =
    totalAreaKm2 > 0
      ? (highArea * highProbWeight +
          mediumArea * mediumProbWeight +
          lowArea * lowProbWeight) /
        totalAreaKm2
      : 0;

  return {
    totalArea: totalAreaKm2,
    zoneCoverage,
    estimatedDuration: estimatedDurationDays,
    estimatedCost,
    recoveryProbability: Math.min(1, recoveryProbability),
    fuelConsumption: fuelCost / 1.5, // Approximate liters (fuel cost / price per liter)
    carbonFootprint: (fuelCost / 1.5) * 2.68, // kg CO₂ per liter diesel
  };
}

/**
 * Generate traditional circular search strategy
 * Uniform probability distribution within search radius
 */
export function generateTraditionalSearch(
  incident: IncidentInput,
  searchRadiusKm: number,
  gridResolutionMeters: number
): SearchStrategy {
  const searchRadiusMeters = searchRadiusKm * 1000;

  // Create simple circular zone
  const circumferencePoints: GPSCoordinate[] = [];
  const segments = 36; // 10-degree increments

  for (let i = 0; i < segments; i++) {
    const bearing = (i * 360) / segments;
    const point = destinationPoint(
      incident.gpsCoordinates,
      searchRadiusMeters,
      bearing
    );
    circumferencePoints.push(point);
  }

  const circularZone: ProbabilityZone = {
    id: `traditional-zone-${Date.now()}`,
    coordinates: circumferencePoints,
    centroid: incident.gpsCoordinates,
    probabilityScore: 0.5, // Uniform probability
    priority: 'medium',
    area: Math.PI * searchRadiusMeters ** 2,
    factors: {
      distanceDecay: 0.5,
      routeProximity: 0,
      currentInfluence: 0,
      clusterScore: 0,
      depthFactor: 0.5,
    },
    estimatedSearchDuration: (Math.PI * searchRadiusMeters ** 2) / 100000,
  };

  const zones = [circularZone];
  const metrics = calculateSearchMetrics(zones);

  return {
    type: 'traditional',
    zones,
    searchOrder: zones.map((z) => z.id),
    metrics,
    generatedAt: new Date(),
    algorithmVersion: '1.0.0-traditional',
  };
}

/**
 * Generate optimized probability-weighted search strategy
 * Main algorithm entry point
 */
export function generateOptimizedSearch(
  incident: IncidentInput,
  searchRadiusKm: number,
  gridResolutionMeters: number
): SearchStrategy {
  const searchRadiusMeters = searchRadiusKm * 1000;

  // Generate spatial grid
  const gridPoints = createSpatialGrid(
    incident.gpsCoordinates,
    searchRadiusMeters,
    gridResolutionMeters
  );

  // Calculate probability for each grid cell
  const gridCells = gridPoints.map((point) => {
    const depthMeters =
      incident.gpsCoordinates.altitude
        ? Math.abs(incident.gpsCoordinates.altitude)
        : SEARCH_CONSTANTS.PHYSICS.KELVIN_SEAMOUNTS_DEPTH;

    const { score, factors } = calculateCellProbability(
      point,
      incident,
      searchRadiusMeters,
      depthMeters
    );

    return { location: point, score, factors };
  });

  // Aggregate cells into zones
  const zones = aggregateCellsIntoZones(gridCells, gridResolutionMeters);

  // Sort zones by priority (high → medium → low)
  const sortedZones = zones.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const metrics = calculateSearchMetrics(sortedZones);

  return {
    type: 'optimized',
    zones: sortedZones,
    searchOrder: sortedZones.map((z) => z.id),
    metrics,
    generatedAt: new Date(),
    algorithmVersion: '1.0.0-multifactor',
  };
}

/**
 * Generate drift model visualization
 */
export function generateDriftModel(
  incident: IncidentInput,
  durationHours: number = 72 // Default 3 days
): DriftModel | null {
  if (!incident.environmentalConditions?.oceanCurrents?.[0]) {
    return null;
  }

  const current = incident.environmentalConditions.oceanCurrents[0];
  const trajectory = calculateDrift(
    incident.gpsCoordinates,
    current.speed,
    current.direction,
    durationHours,
    24 // Hourly samples
  );

  const currentPosition = trajectory[trajectory.length - 1];
  const totalDistance = haversineDistance(incident.gpsCoordinates, currentPosition);

  return {
    startPosition: incident.gpsCoordinates,
    currentPosition,
    trajectory,
    driftSpeed: current.speed,
    driftDirection: current.direction,
    timeElapsed: durationHours,
    confidence: 0.75, // Simplified confidence score
  };
}

/**
 * Calculate comparison metrics between traditional and optimized strategies
 */
export function calculateImprovements(
  traditional: SearchStrategy,
  optimized: SearchStrategy
): {
  areaReduction: number;
  costSavings: number;
  durationReduction: number;
  probabilityIncrease: number;
} {
  const areaReduction =
    ((traditional.metrics.totalArea - optimized.metrics.totalArea) /
      traditional.metrics.totalArea) *
    100;

  const costSavings = traditional.metrics.estimatedCost - optimized.metrics.estimatedCost;

  const durationReduction =
    traditional.metrics.estimatedDuration - optimized.metrics.estimatedDuration;

  const probabilityIncrease =
    (optimized.metrics.recoveryProbability - traditional.metrics.recoveryProbability) *
    100;

  return {
    areaReduction: Math.max(0, areaReduction),
    costSavings: Math.max(0, costSavings),
    durationReduction: Math.max(0, durationReduction),
    probabilityIncrease: Math.max(0, probabilityIncrease),
  };
}
