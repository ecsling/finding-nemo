// MongoDB Model for Dive Sessions with Real Oceanographic Data

export interface DiveSession {
  _id?: string;
  sessionId: string;
  timestamp: Date;
  
  // Real Location Data (Kelvin Seamounts)
  location: {
    name: string;
    latitude: number;  // 37.5°N
    longitude: number; // -14.5°W
    region: string;    // "North Atlantic Ocean"
  };
  
  // Real Oceanographic Data
  oceanography: {
    depth: number;        // meters (2850m for Kelvin Seamounts)
    pressure: number;     // bars (depth/10)
    temperature: number;  // °C (4°C at deep ocean)
    salinity: number;     // PSU (practical salinity units, ~35 PSU)
    visibility: number;   // meters (typically 10-30m)
  };
  
  // Diver Status (simulated for game)
  diverStatus: {
    oxygen: number;         // percentage
    oxygenConsumption: number; // liters/minute
    heading: number;        // degrees (0-360)
    duration: number;       // minutes
  };
  
  // Mission Data
  mission: {
    objective: string;
    vesselName: string;
    vesselType: string;
    containersTotal: number;
    containersVerified: number;
    photosCollected: number;
    status: 'active' | 'completed' | 'aborted';
  };
  
  // Container Verification Records
  containers: ContainerRecord[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface ContainerRecord {
  containerId: string;
  serialNumber: string;
  owner: string;
  
  // Expected Manifest
  manifest: {
    category: string;
    items: ManifestItem[];
    totalValue: number; // USD
    insuranceClaimId?: string;
  };
  
  // Photo Verification
  verification: {
    photoUrl?: string;
    uploadedAt?: Date;
    cvAnalysis?: {
      matchScore: number; // 0-100
      itemsDetected: DetectedItem[];
      discrepancies: string[];
    };
    status: 'pending' | 'verified' | 'discrepancy' | 'missing';
    verifiedBy?: string;
    verifiedAt?: Date;
  };
  
  // Physical Condition
  condition: {
    damaged: boolean;
    waterDamage: boolean;
    notes: string;
  };
}

export interface ManifestItem {
  name: string;
  quantity: number;
  unit: string;
  value: number; // USD per unit
  brand?: string;
}

export interface DetectedItem {
  name: string;
  confidence: number; // 0-1
  quantity: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Real oceanographic data constants
export const OCEANOGRAPHIC_DATA = {
  KELVIN_SEAMOUNTS: {
    name: "Kelvin Seamounts",
    latitude: 37.5,
    longitude: -14.5,
    region: "North Atlantic Ocean",
    depth: 2850, // meters
    temperature: 4, // °C
    pressure: 285, // bars
    salinity: 35.5, // PSU
    visibility: 15, // meters
  }
};

// Helper function to calculate real pressure based on depth
export function calculatePressure(depthMeters: number): number {
  // 1 atmosphere at surface + 1 atmosphere per 10 meters
  return Math.round((1 + depthMeters / 10) * 10) / 10;
}

// Helper function to estimate oxygen consumption
export function calculateOxygenConsumption(
  depthMeters: number,
  activityLevel: 'rest' | 'moderate' | 'heavy'
): number {
  const baseConsumption = {
    rest: 15,      // liters/min
    moderate: 25,  // liters/min
    heavy: 40,     // liters/min
  };
  
  // Consumption increases with depth (more pressure)
  const pressureMultiplier = 1 + (depthMeters / 1000);
  return Math.round(baseConsumption[activityLevel] * pressureMultiplier);
}
