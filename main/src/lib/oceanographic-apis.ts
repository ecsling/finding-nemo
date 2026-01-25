/**
 * Oceanographic Data Service Layer
 * Integration with real APIs and mock data fallback
 */

import type { EnvironmentalData, HistoricalIncident, GPSCoordinate } from '@/models/SearchOptimization';
import mockData from '@/data/mock-ocean-currents.json';

const IS_PRODUCTION_DEMO =
  process.env.NEXT_PUBLIC_PRODUCTION_DEMO === 'true' ||
  typeof window !== 'undefined';

/**
 * Find nearest region in mock data
 */
function findNearestRegion(lat: number, lon: number) {
  let nearestRegion = mockData.regions[0];
  let minDistance = Infinity;

  for (const region of mockData.regions) {
    const distance = Math.sqrt(
      Math.pow(region.latitude - lat, 2) + Math.pow(region.longitude - lon, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestRegion = region;
    }
  }

  return nearestRegion;
}

/**
 * Fetch ocean current data from NOAA or mock data
 *
 * Real API: https://tidesandcurrents.noaa.gov/api/
 * Requires: latitude, longitude, depth (optional)
 */
export async function fetchOceanCurrents(
  lat: number,
  lon: number,
  depthMeters?: number
): Promise<EnvironmentalData> {
  // Use mock data for demo mode
  if (IS_PRODUCTION_DEMO) {
    const region = findNearestRegion(lat, lon);

    return {
      oceanCurrents: region.currents.map((current) => ({
        speed: current.speed,
        direction: current.direction,
        depth: current.depth,
        timestamp: new Date(current.timestamp),
        source: 'mock' as const,
      })),
      seaState: region.seaState,
      visibility: region.visibility,
      temperature: region.temperature,
      salinity: region.salinity,
      windSpeed: region.windSpeed,
      windDirection: region.windDirection,
    };
  }

  // Real API integration (commented out - requires API key)
  try {
    /*
    const response = await fetch(
      `https://tidesandcurrents.noaa.gov/api/datagetter?` +
        `product=currents&` +
        `station=${getNearestStation(lat, lon)}&` +
        `begin_date=${getDateString(new Date())}&` +
        `end_date=${getDateString(new Date())}&` +
        `time_zone=gmt&` +
        `units=metric&` +
        `format=json&` +
        `application=OceanCache`
    );

    if (!response.ok) {
      throw new Error('NOAA API request failed');
    }

    const data = await response.json();

    return {
      oceanCurrents: data.data.map((d: any) => ({
        speed: parseFloat(d.s), // Speed in m/s
        direction: parseFloat(d.d), // Direction in degrees
        depth: depthMeters || 0,
        timestamp: new Date(d.t),
        source: 'NOAA' as const,
      })),
      // Additional environmental data would be fetched from separate endpoints
    };
    */

    // Fallback to mock data if real API fails
    const region = findNearestRegion(lat, lon);
    return {
      oceanCurrents: region.currents.map((current) => ({
        speed: current.speed,
        direction: current.direction,
        depth: current.depth,
        timestamp: new Date(current.timestamp),
        source: 'mock' as const,
      })),
      seaState: region.seaState,
      visibility: region.visibility,
      temperature: region.temperature,
      salinity: region.salinity,
      windSpeed: region.windSpeed,
      windDirection: region.windDirection,
    };
  } catch (error) {
    console.error('Error fetching ocean currents:', error);

    // Fallback to mock data
    const region = findNearestRegion(lat, lon);
    return {
      oceanCurrents: region.currents.map((current) => ({
        speed: current.speed,
        direction: current.direction,
        depth: current.depth,
        timestamp: new Date(current.timestamp),
        source: 'mock' as const,
      })),
      seaState: region.seaState,
      visibility: region.visibility,
      temperature: region.temperature,
      salinity: region.salinity,
      windSpeed: region.windSpeed,
      windDirection: region.windDirection,
    };
  }
}

/**
 * Fetch historical incident data from database or mock data
 */
export async function fetchHistoricalIncidents(
  lat: number,
  lon: number,
  radiusKm: number = 50
): Promise<HistoricalIncident[]> {
  // Use mock data for demo
  if (IS_PRODUCTION_DEMO) {
    // Filter incidents within radius
    return mockData.historicalIncidents
      .filter((incident) => {
        const distance = Math.sqrt(
          Math.pow((incident.location.latitude - lat) * 111, 2) +
            Math.pow((incident.location.longitude - lon) * 111 * Math.cos((lat * Math.PI) / 180), 2)
        );
        return distance <= radiusKm;
      })
      .map((incident) => ({
        id: incident.id,
        location: {
          latitude: incident.location.latitude,
          longitude: incident.location.longitude,
          altitude: incident.location.altitude,
        },
        timestamp: new Date(incident.timestamp),
        containerCount: incident.containerCount,
        recovered: incident.recovered,
        recoveryDuration: incident.recoveryDuration,
        cause: incident.cause,
      }));
  }

  // Real database query (would connect to MongoDB)
  try {
    /*
    const response = await fetch(
      `/api/historical-incidents?lat=${lat}&lon=${lon}&radius=${radiusKm}`
    );
    const data = await response.json();
    return data.incidents;
    */

    // Fallback to mock data
    return mockData.historicalIncidents.map((incident) => ({
      id: incident.id,
      location: {
        latitude: incident.location.latitude,
        longitude: incident.location.longitude,
        altitude: incident.location.altitude,
      },
      timestamp: new Date(incident.timestamp),
      containerCount: incident.containerCount,
      recovered: incident.recovered,
      recoveryDuration: incident.recoveryDuration,
      cause: incident.cause,
    }));
  } catch (error) {
    console.error('Error fetching historical incidents:', error);
    return [];
  }
}

/**
 * Fetch bathymetric data from GEBCO or mock data
 *
 * Real API: https://www.gebco.net/data_and_products/gebco_web_services/
 */
export async function fetchBathymetry(
  lat: number,
  lon: number,
  resolution: number = 100 // meters per data point
): Promise<{ depth: number; terrain: string }> {
  // Mock bathymetry data for demo
  if (IS_PRODUCTION_DEMO) {
    // Kelvin Seamounts area
    if (Math.abs(lat - 37.5) < 1 && Math.abs(lon + 14.5) < 1) {
      return {
        depth: 2850,
        terrain: 'seamount',
      };
    }

    // Default ocean depth estimate based on distance from coast
    const estimatedDepth = 200 + Math.random() * 3000;
    return {
      depth: Math.floor(estimatedDepth),
      terrain: estimatedDepth > 2000 ? 'rocky' : 'sandy',
    };
  }

  // Real API integration (commented out)
  try {
    /*
    const response = await fetch(
      `https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?` +
        `request=GetFeatureInfo&` +
        `service=WMS&` +
        `version=1.3.0&` +
        `layers=GEBCO_LATEST&` +
        `query_layers=GEBCO_LATEST&` +
        `info_format=application/json&` +
        `x=${lon}&y=${lat}`
    );

    const data = await response.json();
    return {
      depth: Math.abs(data.features[0].properties.GRAY_INDEX),
      terrain: 'unknown',
    };
    */

    // Fallback
    return {
      depth: 2850,
      terrain: 'seamount',
    };
  } catch (error) {
    console.error('Error fetching bathymetry:', error);
    return {
      depth: 2850,
      terrain: 'seamount',
    };
  }
}

/**
 * Fetch real-time weather data from OpenWeatherMap or similar
 */
export async function fetchWeatherData(
  lat: number,
  lon: number
): Promise<{
  windSpeed: number;
  windDirection: number;
  waveHeight: number;
  seaState: number;
}> {
  if (IS_PRODUCTION_DEMO) {
    const region = findNearestRegion(lat, lon);
    return {
      windSpeed: region.windSpeed || 8.5,
      windDirection: region.windDirection || 320,
      waveHeight: region.seaState * 0.5, // Rough estimate
      seaState: region.seaState || 3,
    };
  }

  // Real API integration
  try {
    /*
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?` +
        `lat=${lat}&lon=${lon}&` +
        `appid=${process.env.OPENWEATHER_API_KEY}&` +
        `units=metric`
    );

    const data = await response.json();

    return {
      windSpeed: data.wind.speed,
      windDirection: data.wind.deg,
      waveHeight: data.waves?.height || 1,
      seaState: calculateSeaState(data.wind.speed),
    };
    */

    // Fallback
    return {
      windSpeed: 8.5,
      windDirection: 320,
      waveHeight: 1.5,
      seaState: 3,
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return {
      windSpeed: 8.5,
      windDirection: 320,
      waveHeight: 1.5,
      seaState: 3,
    };
  }
}

/**
 * Calculate WMO sea state from wind speed
 * 0 = Calm, 1-2 = Light, 3-4 = Moderate, 5-6 = Rough, 7-8 = Very Rough, 9 = Phenomenal
 */
function calculateSeaState(windSpeed: number): number {
  if (windSpeed < 1) return 0;
  if (windSpeed < 3) return 1;
  if (windSpeed < 6) return 2;
  if (windSpeed < 10) return 3;
  if (windSpeed < 16) return 4;
  if (windSpeed < 21) return 5;
  if (windSpeed < 27) return 6;
  if (windSpeed < 33) return 7;
  if (windSpeed < 41) return 8;
  return 9;
}

/**
 * Aggregate all environmental data for a location
 */
export async function fetchComprehensiveEnvironmentalData(
  lat: number,
  lon: number,
  depthMeters?: number
): Promise<EnvironmentalData> {
  const [currentData, weatherData] = await Promise.all([
    fetchOceanCurrents(lat, lon, depthMeters),
    fetchWeatherData(lat, lon),
  ]);

  return {
    ...currentData,
    windSpeed: weatherData.windSpeed,
    windDirection: weatherData.windDirection,
    seaState: weatherData.seaState,
  };
}
