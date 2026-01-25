/**
 * Search Analytics API Route
 * Cost breakdown and operational metrics calculations
 */

import { NextRequest, NextResponse } from 'next/server';
import type { CostBreakdown } from '@/models/SearchOptimization';
import { SEARCH_CONSTANTS } from '@/models/SearchOptimization';

interface AnalyticsRequest {
  searchAreaKm2: number;
  searchDurationDays: number;
  depthMeters: number;
  seaState?: number;
  includeBreakdown: boolean;
}

/**
 * Calculate detailed cost breakdown
 */
function calculateCostBreakdown(
  areaKm2: number,
  durationDays: number,
  depthMeters: number,
  seaState: number = 3
): CostBreakdown {
  const { COSTS } = SEARCH_CONSTANTS;

  // Base costs
  const vesselCost = durationDays * COSTS.VESSEL_OPERATION_PER_DAY;
  const diveTeamCost = durationDays * COSTS.DIVE_TEAM_PER_DAY;
  const equipmentBase = COSTS.EQUIPMENT_BASE;

  // Depth multiplier (deeper = more expensive equipment)
  const depthMultiplier = 1 + depthMeters / 3000; // 2x cost at 3000m
  const equipmentCost = equipmentBase * depthMultiplier;

  // Fuel cost based on area coverage
  const fuelCost = areaKm2 * COSTS.FUEL_PER_KM;

  // Sea state multiplier (rougher = slower, more expensive)
  const seaStateMultiplier = 1 + seaState / 10; // Up to 1.9x at sea state 9

  // Support services (logistics, communications, safety)
  const supportServices = (vesselCost + diveTeamCost) * 0.15 * seaStateMultiplier;

  const subtotal = vesselCost + diveTeamCost + equipmentCost + fuelCost + supportServices;

  // Contingency (15% of subtotal)
  const contingency = subtotal * 0.15;

  const total = subtotal + contingency;

  return {
    vesselOperationCost: Math.round(vesselCost),
    diveTeamCost: Math.round(diveTeamCost),
    equipmentRental: Math.round(equipmentCost),
    fuelCost: Math.round(fuelCost),
    supportServices: Math.round(supportServices),
    contingency: Math.round(contingency),
    total: Math.round(total),
  };
}

/**
 * Calculate environmental impact metrics
 */
function calculateEnvironmentalImpact(fuelLiters: number): {
  carbonFootprint: number;
  equivalentTrees: number;
} {
  // Diesel emissions: ~2.68 kg CO2 per liter
  const carbonFootprint = fuelLiters * 2.68;

  // Average tree absorbs ~21 kg CO2 per year
  const equivalentTrees = Math.ceil(carbonFootprint / 21);

  return {
    carbonFootprint: Math.round(carbonFootprint),
    equivalentTrees,
  };
}

/**
 * POST /api/search-analytics
 * Calculate cost breakdown and operational metrics
 */
export async function POST(request: NextRequest) {
  try {
    const body: AnalyticsRequest = await request.json();

    // Validate input
    if (!body.searchAreaKm2 || body.searchAreaKm2 <= 0) {
      return NextResponse.json(
        { error: 'Invalid search area' },
        { status: 400 }
      );
    }

    if (!body.searchDurationDays || body.searchDurationDays <= 0) {
      return NextResponse.json(
        { error: 'Invalid search duration' },
        { status: 400 }
      );
    }

    const costBreakdown = calculateCostBreakdown(
      body.searchAreaKm2,
      body.searchDurationDays,
      body.depthMeters || 2850,
      body.seaState || 3
    );

    // Calculate fuel consumption
    const fuelLiters = costBreakdown.fuelCost / 1.5; // Assuming $1.50/liter

    const environmentalImpact = calculateEnvironmentalImpact(fuelLiters);

    // Calculate operational metrics
    const crewSize = Math.ceil(body.searchDurationDays * 1.5); // 1.5 crew per day
    const diveHours = body.searchAreaKm2 * 4; // 4 hours per km^2
    const surfaceHours = body.searchDurationDays * 24 - diveHours;

    const response = {
      costBreakdown: body.includeBreakdown ? costBreakdown : undefined,
      totalCost: costBreakdown.total,
      fuelConsumption: Math.round(fuelLiters),
      carbonFootprint: environmentalImpact.carbonFootprint,
      equivalentTrees: environmentalImpact.equivalentTrees,
      operationalMetrics: {
        estimatedCrewSize: crewSize,
        totalDiveHours: Math.round(diveHours),
        totalSurfaceHours: Math.round(surfaceHours),
        avgDailyProgress: (body.searchAreaKm2 / body.searchDurationDays).toFixed(2),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in search analytics:', error);

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
 * GET /api/search-analytics
 * Return cost estimation guide
 */
export async function GET() {
  return NextResponse.json({
    name: 'OceanCache Search Analytics API',
    version: '1.0.0',
    description: 'Calculate cost breakdowns and operational metrics for container recovery operations',
    costFactors: {
      vesselOperation: `$${SEARCH_CONSTANTS.COSTS.VESSEL_OPERATION_PER_DAY}/day`,
      diveTeam: `$${SEARCH_CONSTANTS.COSTS.DIVE_TEAM_PER_DAY}/day`,
      equipment: `$${SEARCH_CONSTANTS.COSTS.EQUIPMENT_BASE} base cost`,
      fuel: `$${SEARCH_CONSTANTS.COSTS.FUEL_PER_KM}/km`,
    },
    multipliers: {
      depth: 'Equipment cost increases with depth (1x at 0m, 2x at 3000m)',
      seaState: 'Support services cost increases with sea state (1x at 0, 1.9x at 9)',
      contingency: '15% of subtotal for unexpected expenses',
    },
    example: {
      request: {
        searchAreaKm2: 25,
        searchDurationDays: 18,
        depthMeters: 2850,
        seaState: 3,
        includeBreakdown: true,
      },
    },
  });
}
