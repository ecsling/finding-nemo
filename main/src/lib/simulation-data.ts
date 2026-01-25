// Simulation data for command dashboard

export interface TimelineEvent {
  time: number;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'contact' | 'threat' | 'weather' | 'fuel_warning' | 'mission_complete' | 'deploy' | 'system' | 'milestone' | 'route_start' | 'return' | 'route_complete';
  data?: any;
}

export const ASSET_CONFIG = {
  shallow: {
    maxDepth: 1200,
    searchSpeed: 2.5,
    sensors: ['Side-scan sonar', 'Magnetometer'],
  },
  mid: {
    maxDepth: 2500,
    searchSpeed: 2.0,
    sensors: ['Multibeam sonar', 'Sub-bottom profiler'],
  },
  deep: {
    maxDepth: 4500,
    searchSpeed: 1.5,
    sensors: ['Synthetic aperture sonar', 'Deep-tow camera'],
  },
  fuelBurnRate: 0.1,
  costPerHour: 5000,
  cruiseSpeed: 12,
};

export const WEATHER_CONDITIONS = {
  temperature: 4,
  windSpeed: 15,
  visibility: 'good',
  iceCoverage: 0,
  waveHeight: 1.5,
  calm: {
    waveHeight: 0.5,
    windSpeed: 5,
    visibility: 'Excellent',
  },
  moderate: {
    waveHeight: 1.5,
    windSpeed: 15,
    visibility: 'Good',
  },
  rough: {
    waveHeight: 3.0,
    windSpeed: 25,
    visibility: 'Fair',
  },
};

export const TRADE_ROUTES = [
  {
    name: 'Trans-Pacific',
    trafficDensity: 'High',
    averageSpeed: 20,
  },
  {
    name: 'Trans-Atlantic',
    trafficDensity: 'High',
    averageSpeed: 22,
  },
  {
    name: 'Suez Canal Route',
    trafficDensity: 'Very High',
    averageSpeed: 18,
  },
];
