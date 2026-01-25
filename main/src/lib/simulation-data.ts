// Simulation data for command dashboard

export interface TimelineEvent {
  time: number;
  title: string;
  description: string;
  message?: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'contact' | 'threat' | 'weather' | 'fuel_warning' | 'mission_complete' | 'deploy' | 'system' | 'milestone' | 'route_start' | 'return' | 'route_complete' | 'ice_warning';
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

export const SIMULATION_DURATION = 300; // 5 minutes in seconds

export const SIMULATION_TIMELINE: TimelineEvent[] = [
  { time: 0, title: 'Mission Start', description: 'Initiating search operation', message: 'Initiating search operation', type: 'deploy' },
  { time: 30, title: 'Route Started', description: 'Following planned route', message: 'Following planned route', type: 'route_start' },
  { time: 90, title: 'Contact Detected', description: 'Possible target identified', message: 'Possible target identified', type: 'contact' },
  { time: 150, title: 'Weather Update', description: 'Moderate conditions', message: 'Moderate conditions', type: 'weather' },
  { time: 240, title: 'Mission Complete', description: 'Search operation completed', message: 'Search operation completed', type: 'mission_complete' },
];
