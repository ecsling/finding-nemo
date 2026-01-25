/**
 * Probability Search API Route
 * Main endpoint for calculating probability-weighted search zones
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  ProbabilitySearchRequest,
  ProbabilitySearchResponse,
  IncidentInput,
  SearchComparison,
  ValidationError,
} from '@/models/SearchOptimization';
import {
  generateTraditionalSearch,
  generateOptimizedSearch,
  calculateImprovements,
  generateDriftModel,
} from '@/lib/probability-engine';
import {
  fetchComprehensiveEnvironmentalData,
  fetchHistoricalIncidents,
  fetchBathymetry,
} from '@/lib/oceanographic-apis';
import { validateContainerSerial } from '@/lib/geo-utils';

/**
 * Validate incident input data
 */
function validateIncidentInput(incident: IncidentInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate GPS coordinates
  if (
    !incident.gpsCoordinates ||
    incident.gpsCoordinates.latitude < -90 ||
    incident.gpsCoordinates.latitude > 90
  ) {
    errors.push({
      field: 'gpsCoordinates.latitude',
      message: 'Latitude must be between -90 and 90 degrees',
      code: 'OUT_OF_RANGE',
    });
  }

  if (
    !incident.gpsCoordinates ||
    incident.gpsCoordinates.longitude < -180 ||
    incident.gpsCoordinates.longitude > 180
  ) {
    errors.push({
      field: 'gpsCoordinates.longitude',
      message: 'Longitude must be between -180 and 180 degrees',
      code: 'OUT_OF_RANGE',
    });
  }

  // Validate container serial number (ISO 6346 format)
  if (incident.containerSerialId && !validateContainerSerial(incident.containerSerialId)) {
    errors.push({
      field: 'containerSerialId',
      message: 'Invalid ISO 6346 container serial number format',
      code: 'INVALID_SERIAL',
    });
  }

  // Validate timestamp
  if (!incident.timestamp || isNaN(new Date(incident.timestamp).getTime())) {
    errors.push({
      field: 'timestamp',
      message: 'Invalid timestamp format',
      code: 'INVALID_DATE',
    });
  }

  return errors;
}

/**
 * POST /api/probability-search
 * Calculate probability-weighted search zones for container recovery
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: ProbabilitySearchRequest = await request.json();

    // Validate input
    const validationErrors = validateIncidentInput(body.incident);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: validationErrors,
        },
        { status: 400 }
      );
    }

    // Set defaults
    const searchRadius = body.searchRadius || 25; // km
    const gridResolution = body.gridResolution || 100; // meters
    const useRealTimeData = body.useRealTimeData ?? false;

    // Fetch environmental data if needed
    let enrichedIncident = { ...body.incident };

    if (!enrichedIncident.environmentalConditions || useRealTimeData) {
      try {
        const environmentalData = await fetchComprehensiveEnvironmentalData(
          enrichedIncident.gpsCoordinates.latitude,
          enrichedIncident.gpsCoordinates.longitude,
          Math.abs(enrichedIncident.gpsCoordinates.altitude || 0)
        );

        enrichedIncident.environmentalConditions = environmentalData;
      } catch (error) {
        console.error('Error fetching environmental data:', error);
        // Continue with existing data or defaults
      }
    }

    // Fetch historical incidents if requested
    if (body.includeHistorical && !enrichedIncident.historicalData) {
      try {
        const historicalIncidents = await fetchHistoricalIncidents(
          enrichedIncident.gpsCoordinates.latitude,
          enrichedIncident.gpsCoordinates.longitude,
          searchRadius
        );

        enrichedIncident.historicalData = historicalIncidents;
      } catch (error) {
        console.error('Error fetching historical incidents:', error);
        enrichedIncident.historicalData = [];
      }
    }

    // Generate traditional circular search strategy
    const traditionalStrategy = generateTraditionalSearch(
      enrichedIncident,
      searchRadius,
      gridResolution
    );

    // Generate optimized probability-weighted search strategy
    const optimizedStrategy = generateOptimizedSearch(
      enrichedIncident,
      searchRadius,
      gridResolution
    );

    // Calculate improvements
    const improvements = calculateImprovements(traditionalStrategy, optimizedStrategy);

    // Generate drift model if currents available
    const driftModel =
      enrichedIncident.environmentalConditions?.oceanCurrents?.[0]
        ? generateDriftModel(enrichedIncident, enrichedIncident.estimatedTimeInWater || 72) || undefined
        : undefined;

    // Fetch bathymetry for visualization (optional)
    let bathymetry;
    try {
      const bathyData = await fetchBathymetry(
        enrichedIncident.gpsCoordinates.latitude,
        enrichedIncident.gpsCoordinates.longitude
      );

      bathymetry = [
        {
          location: enrichedIncident.gpsCoordinates,
          depth: bathyData.depth,
          terrain: bathyData.terrain as any,
          slope: 0,
          resolution: gridResolution,
          source: 'mock' as const,
        },
      ];
    } catch (error) {
      console.error('Error fetching bathymetry:', error);
    }

    const comparison: SearchComparison = {
      traditional: traditionalStrategy,
      optimized: optimizedStrategy,
      improvements,
    };

    const warnings: string[] = [];

    // Add warnings for data quality
    if (!useRealTimeData) {
      warnings.push('Using mock environmental data - enable real-time data for production use');
    }

    if (!enrichedIncident.vesselRoute) {
      warnings.push('No vessel route provided - route proximity factor not applied');
    }

    if (!enrichedIncident.historicalData || enrichedIncident.historicalData.length === 0) {
      warnings.push('No historical incident data available - cluster analysis not applied');
    }

    const processingTime = Date.now() - startTime;

    const response: ProbabilitySearchResponse = {
      comparison,
      driftModel,
      bathymetry,
      warnings,
      processingTime,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error in probability search:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/probability-search
 * Return API documentation
 */
export async function GET() {
  return NextResponse.json({
    name: 'OceanCache Probability Search API',
    version: '1.0.0',
    description:
      'Calculate probability-weighted search zones for maritime container recovery operations',
    endpoints: {
      POST: {
        description: 'Generate search strategies for a lost container incident',
        requestBody: {
          incident: {
            id: 'string (required)',
            timestamp: 'ISO 8601 date string (required)',
            gpsCoordinates: {
              latitude: 'number -90 to 90 (required)',
              longitude: 'number -180 to 180 (required)',
              altitude: 'number (optional, depth if negative)',
            },
            containerSerialId: 'string ISO 6346 format (required)',
            vesselRoute: {
              points: 'GPSCoordinate[] (optional)',
              vesselName: 'string (optional)',
              vesselType: 'string (optional)',
            },
            environmentalConditions: 'EnvironmentalData (optional, auto-fetched if not provided)',
            historicalData: 'HistoricalIncident[] (optional, auto-fetched if includeHistorical=true)',
            estimatedTimeInWater: 'number in hours (optional, default: 24)',
            cargoValue: 'number in USD (optional)',
          },
          searchRadius: 'number in km (optional, default: 25)',
          gridResolution: 'number in meters (optional, default: 100)',
          includeHistorical: 'boolean (optional, default: false)',
          useRealTimeData: 'boolean (optional, default: false)',
        },
        responseBody: {
          comparison: {
            traditional: 'SearchStrategy',
            optimized: 'SearchStrategy',
            improvements: {
              areaReduction: 'number (percentage)',
              costSavings: 'number (USD)',
              durationReduction: 'number (days)',
              probabilityIncrease: 'number (percentage points)',
            },
          },
          driftModel: 'DriftModel (optional)',
          bathymetry: 'BathymetricData[] (optional)',
          warnings: 'string[]',
          processingTime: 'number (milliseconds)',
        },
      },
    },
    examples: {
      kelvinSeamounts: {
        incident: {
          id: 'INC-2026-001',
          timestamp: '2026-01-24T12:00:00Z',
          gpsCoordinates: {
            latitude: 37.5,
            longitude: -14.5,
            altitude: -2850,
          },
          containerSerialId: 'MAEU-123456-7',
          estimatedTimeInWater: 48,
        },
        searchRadius: 25,
        gridResolution: 100,
        includeHistorical: true,
        useRealTimeData: false,
      },
    },
  });
}
