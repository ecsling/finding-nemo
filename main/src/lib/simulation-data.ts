// Simulation data for command dashboard

export interface TimelineEvent {
  time: number;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success' | 'error';
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
};

export const WEATHER_CONDITIONS = {
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

export const TRADE_ROUTES = {
  transPacific: {
    name: 'Trans-Pacific',
    trafficDensity: 'High',
    averageSpeed: 20,
  },
  transAtlantic: {
    name: 'Trans-Atlantic',
    trafficDensity: 'High',
    averageSpeed: 22,
  },
  suezCanal: {
    name: 'Suez Canal Route',
    trafficDensity: 'Very High',
    averageSpeed: 18,
  },
};
