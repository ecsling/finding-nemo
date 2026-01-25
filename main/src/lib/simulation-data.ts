// globe simulation configuration

export interface Coordinates {
    lat: number;
    lng: number;
  }
  
  export interface PointOfInterest {
    id: string;
    name: string;
    type: 'base' | 'port' | 'resource' | 'radar';
    coordinates: Coordinates;
    description?: string;
  }
  
  export interface TradeRoute {
    id: string;
    name: string;
    points: Coordinates[];
    color: string;
    trafficLevel: 'low' | 'medium' | 'high';
  }
  
  export interface WeatherZone {
    id: string;
    name: string;
    center: Coordinates;
    radius: number; // in degrees
    type: 'ice' | 'storm' | 'fog';
    severity: 'light' | 'moderate' | 'severe';
  }
  
  export interface TimelineEvent {
    time: number; // seconds from start
    type: 'deploy' | 'route_start' | 'contact' | 'weather' | 'fuel_warning' | 'route_complete' | 'return' | 'mission_complete' | 'threat' | 'ice_warning';
    message: string;
    data?: {
      routeId?: string;
      fuelPercent?: number;
      contactType?: string;
      weatherType?: string;
      threatLevel?: string;
    };
  }
  
  // Canadian Arctic points of interest - EXPANDED
  export const POINTS_OF_INTEREST: PointOfInterest[] = [
    // Military Bases
    { id: 'cfs-alert', name: 'CFS Alert', type: 'base', coordinates: { lat: 82.5, lng: -62.3 }, description: 'Northernmost military base' },
    { id: 'nanisivik', name: 'Nanisivik Naval Facility', type: 'base', coordinates: { lat: 73.0, lng: -84.5 }, description: 'Arctic naval refueling' },
    { id: 'thule', name: 'Thule Air Base', type: 'base', coordinates: { lat: 76.5, lng: -68.7 }, description: 'US/NATO Arctic base' },
    { id: 'yellowknife', name: 'CFB Yellowknife', type: 'base', coordinates: { lat: 62.5, lng: -114.4 }, description: 'Northern Command HQ' },
  
    // Ports
    { id: 'resolute', name: 'Resolute Bay', type: 'port', coordinates: { lat: 74.7, lng: -94.8 }, description: 'Central Arctic hub' },
    { id: 'iqaluit', name: 'Iqaluit', type: 'port', coordinates: { lat: 63.7, lng: -68.5 }, description: 'Nunavut capital' },
    { id: 'tuktoyaktuk', name: 'Tuktoyaktuk', type: 'port', coordinates: { lat: 69.4, lng: -133.0 }, description: 'Western Arctic port' },
    { id: 'churchill', name: 'Port of Churchill', type: 'port', coordinates: { lat: 58.8, lng: -94.2 }, description: 'Hudson Bay deep water' },
    { id: 'cambridge-bay', name: 'Cambridge Bay', type: 'port', coordinates: { lat: 69.1, lng: -105.1 }, description: 'Central passage port' },
    { id: 'pond-inlet', name: 'Pond Inlet', type: 'port', coordinates: { lat: 72.7, lng: -77.9 }, description: 'Eastern Arctic gateway' },
  
    // Resource Sites
    { id: 'prudhoe', name: 'Prudhoe Bay Oil', type: 'resource', coordinates: { lat: 70.3, lng: -148.4 }, description: 'Major oil field' },
    { id: 'hibernia', name: 'Hibernia Platform', type: 'resource', coordinates: { lat: 46.7, lng: -48.8 }, description: 'Offshore oil platform' },
    { id: 'mary-river', name: 'Mary River Mine', type: 'resource', coordinates: { lat: 71.3, lng: -79.2 }, description: 'Iron ore mine' },
    { id: 'ekati', name: 'Ekati Diamond Mine', type: 'resource', coordinates: { lat: 64.7, lng: -110.6 }, description: 'Diamond extraction' },
    { id: 'raglan', name: 'Raglan Mine', type: 'resource', coordinates: { lat: 61.7, lng: -73.6 }, description: 'Nickel mining' },
  
    // Radar Stations
    { id: 'north-warning-1', name: 'NWS Cambridge', type: 'radar', coordinates: { lat: 69.1, lng: -105.1 }, description: 'North Warning System' },
    { id: 'north-warning-2', name: 'NWS Hall Beach', type: 'radar', coordinates: { lat: 68.8, lng: -81.2 }, description: 'North Warning System' },
  ];
  
  // Arctic trade routes - EXPANDED
  export const TRADE_ROUTES: TradeRoute[] = [
    {
      id: 'nwp-east',
      name: 'NW Passage - Eastern Approach',
      points: [
        { lat: 63.7, lng: -68.5 },   // Iqaluit
        { lat: 66.5, lng: -61.0 },
        { lat: 70.0, lng: -65.0 },
        { lat: 72.7, lng: -77.9 },   // Pond Inlet
        { lat: 74.7, lng: -94.8 },   // Resolute
      ],
      color: '#3B82F6',
      trafficLevel: 'medium',
    },
    {
      id: 'nwp-west',
      name: 'NW Passage - Western Approach',
      points: [
        { lat: 74.7, lng: -94.8 },   // Resolute
        { lat: 72.0, lng: -110.0 },
        { lat: 69.1, lng: -105.1 },  // Cambridge Bay
        { lat: 70.5, lng: -120.0 },
        { lat: 69.4, lng: -133.0 },  // Tuktoyaktuk
      ],
      color: '#10B981',
      trafficLevel: 'medium',
    },
    {
      id: 'arctic-bridge',
      name: 'Arctic Bridge Route',
      points: [
        { lat: 58.8, lng: -94.2 },   // Churchill
        { lat: 63.0, lng: -90.0 },
        { lat: 66.0, lng: -85.0 },
        { lat: 69.0, lng: -75.0 },
        { lat: 70.0, lng: -60.0 },   // To Murmansk direction
      ],
      color: '#8B5CF6',
      trafficLevel: 'low',
    },
    {
      id: 'beaufort-shipping',
      name: 'Beaufort Sea Shipping Lane',
      points: [
        { lat: 69.4, lng: -133.0 },  // Tuktoyaktuk
        { lat: 70.3, lng: -140.0 },
        { lat: 70.3, lng: -148.4 },  // Prudhoe Bay
        { lat: 71.0, lng: -156.0 },
      ],
      color: '#F59E0B',
      trafficLevel: 'high',
    },
    {
      id: 'hudson-strait',
      name: 'Hudson Strait Corridor',
      points: [
        { lat: 58.8, lng: -94.2 },   // Churchill
        { lat: 60.0, lng: -85.0 },
        { lat: 62.0, lng: -72.0 },
        { lat: 63.7, lng: -68.5 },   // Iqaluit
      ],
      color: '#EC4899',
      trafficLevel: 'medium',
    },
    {
      id: 'transpolar',
      name: 'Transpolar Sea Route',
      points: [
        { lat: 82.5, lng: -62.3 },   // CFS Alert area
        { lat: 85.0, lng: -60.0 },
        { lat: 87.0, lng: -40.0 },
        { lat: 88.0, lng: 0.0 },     // Near pole
      ],
      color: '#06B6D4',
      trafficLevel: 'low',
    },
  ];
  
  // Weather zones
  export const WEATHER_ZONES: WeatherZone[] = [
    { id: 'beaufort-ice', name: 'Beaufort Ice Pack', center: { lat: 74.0, lng: -140.0 }, radius: 5, type: 'ice', severity: 'severe' },
    { id: 'baffin-fog', name: 'Baffin Bay Fog', center: { lat: 70.0, lng: -65.0 }, radius: 4, type: 'fog', severity: 'moderate' },
    { id: 'arctic-storm', name: 'Arctic Storm System', center: { lat: 72.0, lng: -100.0 }, radius: 6, type: 'storm', severity: 'light' },
  ];
  
  // Current weather conditions (for dashboard)
  export interface WeatherConditions {
    temperature: number; // Celsius
    windSpeed: number; // knots
    visibility: 'poor' | 'moderate' | 'good' | 'excellent';
    iceCoverage: number; // percentage
    seaState: number; // 1-9 scale
  }
  
  export const WEATHER_CONDITIONS: WeatherConditions = {
    temperature: -15,
    windSpeed: 25,
    visibility: 'moderate',
    iceCoverage: 45,
    seaState: 4,
  };
  
  // Patrol path for the asset (combines routes)
  export const PATROL_PATH: Coordinates[] = [
    { lat: 74.7, lng: -94.8 },   // Start: Resolute Bay
    { lat: 72.0, lng: -85.0 },
    { lat: 70.0, lng: -75.0 },
    { lat: 68.0, lng: -70.0 },
    { lat: 66.5, lng: -68.5 },   // Near Iqaluit
    { lat: 68.0, lng: -80.0 },
    { lat: 70.0, lng: -95.0 },
    { lat: 72.0, lng: -110.0 },
    { lat: 70.5, lng: -120.0 },
    { lat: 69.4, lng: -133.0 },  // Tuktoyaktuk
    { lat: 71.0, lng: -120.0 },
    { lat: 74.7, lng: -94.8 },   // Return: Resolute Bay
  ];
  
  // Pre-scripted timeline (total ~4:30) - EXPANDED
  export const SIMULATION_TIMELINE: TimelineEvent[] = [
    { time: 0, type: 'deploy', message: 'Asset deployed from Resolute Bay' },
    { time: 15, type: 'weather', message: 'Current conditions: -15°C, 25kt winds, moderate visibility', data: { weatherType: 'update' } },
    { time: 30, type: 'route_start', message: 'Beginning eastern patrol sector', data: { routeId: 'nwp-east' } },
    { time: 45, type: 'contact', message: 'Contact detected - cargo vessel MV Arctic Star', data: { contactType: 'cargo' } },
    { time: 60, type: 'threat', message: 'Unidentified vessel detected - investigating', data: { threatLevel: 'low' } },
    { time: 75, type: 'ice_warning', message: 'Ice drift detected - adjusting patrol route', data: { weatherType: 'ice' } },
    { time: 90, type: 'contact', message: 'Contact identified - Russian research vessel', data: { contactType: 'research' } },
    { time: 105, type: 'route_start', message: 'Proceeding to western patrol sector', data: { routeId: 'nwp-west' } },
    { time: 120, type: 'contact', message: 'Contact detected - fishing fleet (3 vessels)', data: { contactType: 'fishing' } },
    { time: 135, type: 'fuel_warning', message: 'Fuel status: 50% remaining', data: { fuelPercent: 50 } },
    { time: 150, type: 'threat', message: 'Submarine contact - Canadian HMCS detected', data: { threatLevel: 'friendly' } },
    { time: 165, type: 'weather', message: 'Weather clearing - visibility improved to good', data: { weatherType: 'clear' } },
    { time: 180, type: 'route_complete', message: 'Western sector patrol complete' },
    { time: 195, type: 'contact', message: 'Contact detected - tanker vessel en route to Prudhoe', data: { contactType: 'tanker' } },
    { time: 210, type: 'fuel_warning', message: 'Fuel status: 30% - RTB recommended', data: { fuelPercent: 30 } },
    { time: 225, type: 'return', message: 'Return to base initiated' },
    { time: 250, type: 'weather', message: 'Tailwind favorable - ETA reduced', data: { weatherType: 'favorable' } },
    { time: 270, type: 'mission_complete', message: 'Mission complete - all objectives achieved' },
  ];
  
  export const SIMULATION_DURATION = 270; // seconds
  
  // Mission metrics (for dashboard)
  export interface MissionMetrics {
    contactsDetected: number;
    threatsIdentified: number;
    routesCovered: number;
    totalRoutes: number;
    avgResponseTime: number; // minutes
    efficiencyScore: number; // 0-100
  }
  
  // Asset configuration - EXPANDED
  export const ASSET_CONFIG = {
    cruiseSpeed: 350, // knots
    maxSpeed: 420, // knots
    fuelBurnRate: 0.35, // percent per second at cruise
    detectionRadius: 150, // nm
    sensorRange: 200, // nm for radar
    endurance: 8, // hours
    costPerHour: 15000, // dollars
  };
  
  // Threat levels
  export const THREAT_LEVELS = {
    low: { color: '#10B981', label: 'LOW' },
    medium: { color: '#F59E0B', label: 'MEDIUM' },
    high: { color: '#EF4444', label: 'HIGH' },
    critical: { color: '#DC2626', label: 'CRITICAL' },
  };