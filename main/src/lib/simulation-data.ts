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
    points: [
      { lat: 35.0, lng: -120.0 },
      { lat: 30.0, lng: -150.0 },
      { lat: 25.0, lng: 180.0 },
    ],
  },
  {
    name: 'Trans-Atlantic',
    trafficDensity: 'High',
    averageSpeed: 22,
    points: [
      { lat: 40.0, lng: -70.0 },
      { lat: 45.0, lng: -40.0 },
      { lat: 50.0, lng: -10.0 },
    ],
  },
  {
    name: 'Suez Canal Route',
    trafficDensity: 'Very High',
    averageSpeed: 18,
    points: [
      { lat: 30.0, lng: 32.0 },
      { lat: 20.0, lng: 40.0 },
      { lat: 10.0, lng: 50.0 },
    ],
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

export const POINTS_OF_INTEREST = [
  { lat: 38.7, lon: -28.5, name: 'Kelvin Seamounts' },
  { lat: 35.0, lon: -25.0, name: 'Search Area Alpha' },
  { lat: 40.0, lon: -30.0, name: 'Search Area Bravo' },
];

export const PATROL_PATH = [
  { lat: 38.7, lon: -28.5 },
  { lat: 39.0, lon: -27.0 },
  { lat: 37.5, lon: -26.5 },
  { lat: 38.7, lon: -28.5 },
];
