/**
 * OceanCache Search Optimization Type Definitions
 * Core data structures for probability-weighted container recovery
 */

export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number; // depth if underwater (negative values for below sea level)
}

export interface RoutePolyline {
  points: GPSCoordinate[];
  vesselName: string;
  vesselType: string;
  imoNumber?: string; // International Maritime Organization number
  timestamp: Date;
}

export interface EnvironmentalData {
  oceanCurrents: {
    speed: number; // m/s
    direction: number; // degrees (0-360, where 0 is North)
    depth: number; // meters
    timestamp?: Date;
    source?: 'NOAA' | 'Copernicus' | 'mock';
  }[];
  seaState?: number; // 0-9 WMO scale
  visibility?: number; // meters
  temperature?: number; // °C
  salinity?: number; // PSU (Practical Salinity Units)
  windSpeed?: number; // m/s
  windDirection?: number; // degrees
}

export interface HistoricalIncident {
  id: string;
  location: GPSCoordinate;
  timestamp: Date;
  containerCount: number;
  recovered: boolean;
  recoveryDuration?: number; // days
  cause?: string;
}

export interface IncidentInput {
  id: string;
  timestamp: Date;
  gpsCoordinates: GPSCoordinate;
  containerSerialId: string; // ISO 6346 format (e.g., MAEU-123456-7)
  containerType?: string; // '20ft' | '40ft' | '40ft-HC' | 'reefer'
  vesselRoute?: RoutePolyline;
  environmentalConditions?: EnvironmentalData;
  historicalData?: HistoricalIncident[];
  estimatedTimeInWater?: number; // hours since loss
  cargoValue?: number; // USD
}

export interface ProbabilityFactors {
  distanceDecay: number; // 0-1, Gaussian decay from incident point
  routeProximity: number; // 0-1, perpendicular distance to vessel path
  currentInfluence: number; // 0-1, ocean current drift effect
  depthFactor: number; // 0-1, seafloor topology influence
  clusterScore: number; // 0-1, historical incident density
  timeDecay?: number; // 0-1, probability decay over time
}

export interface ProbabilityZone {
  id: string;
  coordinates: GPSCoordinate[]; // Polygon vertices defining the zone
  centroid: GPSCoordinate; // Center point of the zone
  probabilityScore: number; // 0-1, composite probability
  priority: 'high' | 'medium' | 'low';
  area: number; // square meters
  factors: ProbabilityFactors;
  estimatedSearchDuration: number; // hours
  confidenceInterval?: {
    lower: number;
    upper: number;
  };
}

export interface SearchMetrics {
  totalArea: number; // km²
  zoneCoverage: {
    high: number; // km²
    medium: number; // km²
    low: number; // km²
  };
  estimatedDuration: number; // days
  estimatedCost: number; // USD
  recoveryProbability: number; // 0-1
  fuelConsumption?: number; // liters
  carbonFootprint?: number; // kg CO₂
}

export interface SearchStrategy {
  type: 'traditional' | 'optimized';
  zones: ProbabilityZone[];
  searchOrder: string[]; // Zone IDs in recommended search order
  metrics: SearchMetrics;
  generatedAt: Date;
  algorithmVersion: string;
}

export interface SearchComparison {
  traditional: SearchStrategy;
  optimized: SearchStrategy;
  improvements: {
    areaReduction: number; // percentage
    costSavings: number; // USD
    durationReduction: number; // days
    probabilityIncrease: number; // percentage points
  };
}

export interface BathymetricData {
  location: GPSCoordinate;
  depth: number; // meters (positive = below sea level)
  terrain: 'sandy' | 'rocky' | 'muddy' | 'coral' | 'seamount' | 'trench';
  slope: number; // degrees
  resolution: number; // meters per data point
  source: 'GEBCO' | 'NOAA' | 'mock';
}

export interface DriftModel {
  startPosition: GPSCoordinate;
  currentPosition: GPSCoordinate;
  trajectory: GPSCoordinate[]; // Path points over time
  driftSpeed: number; // m/s
  driftDirection: number; // degrees
  timeElapsed: number; // hours
  confidence: number; // 0-1
}

// ISO 6346 Container Serial Number Validation
export interface ContainerSerial {
  ownerCode: string; // 3 letters (e.g., 'MSK')
  categoryIdentifier: string; // 1 letter (U, J, Z)
  serialNumber: string; // 6 digits
  checkDigit: string; // 1 digit
  full: string; // Complete serial (e.g., 'MSKU-123456-7')
}

// Cost breakdown structure
export interface CostBreakdown {
  vesselOperationCost: number; // USD/day
  diveTeamCost: number; // USD/day
  equipmentRental: number; // USD total
  fuelCost: number; // USD total
  supportServices: number; // USD total
  contingency: number; // USD (10-20% of total)
  total: number; // USD
}

// Export formats
export interface ExportOptions {
  format: 'pdf' | 'geojson' | 'csv' | 'kml';
  includeMetrics: boolean;
  includeCharts: boolean;
  includeMap: boolean;
}

export interface GeoJSONExport {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    geometry: {
      type: 'Polygon';
      coordinates: number[][][]; // [lon, lat, alt]
    };
    properties: {
      zoneId: string;
      priority: string;
      probability: number;
      area: number;
      factors: ProbabilityFactors;
    };
  }[];
  metadata: {
    incidentId: string;
    generatedAt: string;
    algorithmVersion: string;
  };
}

// API Request/Response types
export interface ProbabilitySearchRequest {
  incident: IncidentInput;
  searchRadius: number; // kilometers
  gridResolution: number; // meters (cell size for probability grid)
  includeHistorical: boolean;
  useRealTimeData: boolean; // Use real APIs vs mock data
}

export interface ProbabilitySearchResponse {
  comparison: SearchComparison;
  driftModel?: DriftModel;
  bathymetry?: BathymetricData[];
  warnings?: string[];
  processingTime: number; // milliseconds
}

// Utility type for validation errors
export interface ValidationError {
  field: string;
  message: string;
  code: 'INVALID_GPS' | 'INVALID_SERIAL' | 'INVALID_DATE' | 'MISSING_REQUIRED' | 'OUT_OF_RANGE';
}

// Constants
export const SEARCH_CONSTANTS = {
  // Algorithm weights
  WEIGHTS: {
    DISTANCE_DECAY: 0.35,
    ROUTE_PROXIMITY: 0.25,
    CURRENT_INFLUENCE: 0.20,
    CLUSTER_SCORE: 0.15,
    DEPTH_FACTOR: 0.05,
  },

  // Search parameters
  DEFAULT_SEARCH_RADIUS_KM: 25,
  DEFAULT_GRID_RESOLUTION_M: 100,
  MAX_SEARCH_RADIUS_KM: 100,
  MIN_GRID_RESOLUTION_M: 50,

  // Probability thresholds
  PRIORITY_THRESHOLDS: {
    HIGH: 0.7,
    MEDIUM: 0.3,
  },

  // Cost estimates (USD)
  COSTS: {
    VESSEL_OPERATION_PER_DAY: 50000,
    DIVE_TEAM_PER_DAY: 15000,
    EQUIPMENT_BASE: 25000,
    FUEL_PER_KM: 150,
  },

  // Physical constants
  PHYSICS: {
    WATER_DENSITY: 1025, // kg/m³ (seawater)
    GRAVITY: 9.81, // m/s²
    TYPICAL_CONTAINER_WEIGHT: 3800, // kg (empty 20ft)
    KELVIN_SEAMOUNTS_DEPTH: 2850, // meters
    KELVIN_SEAMOUNTS_PRESSURE: 285, // bar
  },
} as const;
