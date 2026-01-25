'use client';

/**
 * Search Comparison Component
 * Display traditional vs optimized search metrics and analytics
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { SearchComparison as SearchComparisonType } from '@/models/SearchOptimization';

interface SearchComparisonProps {
  comparison: SearchComparisonType;
  className?: string;
}

export default function SearchComparison({ comparison, className = '' }: SearchComparisonProps) {
  const { traditional, optimized, improvements } = comparison;

  return (
    <motion.div
      className={`border border-[#1e3a5f] p-6 ${className}`}
      style={{ backgroundColor: 'rgba(5, 15, 26, 0.9)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-[#00d9ff] uppercase tracking-wide mb-2">
          Search Strategy Comparison
        </h3>
        <p className="text-xs text-white/60">
          Traditional circular search vs probability-weighted optimization
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Area Coverage */}
        <MetricCard
          title="Search Area"
          traditional={traditional.metrics.totalArea.toFixed(1)}
          optimized={optimized.metrics.totalArea.toFixed(1)}
          unit="km^2"
          reduction={improvements.areaReduction}
          badge="AREA"
        />

        {/* Cost */}
        <MetricCard
          title="Estimated Cost"
          traditional={formatCurrency(traditional.metrics.estimatedCost)}
          optimized={formatCurrency(optimized.metrics.estimatedCost)}
          unit=""
          reduction={(improvements.costSavings / traditional.metrics.estimatedCost) * 100}
          badge="COST"
        />

        {/* Duration */}
        <MetricCard
          title="Mission Duration"
          traditional={traditional.metrics.estimatedDuration.toFixed(1)}
          optimized={optimized.metrics.estimatedDuration.toFixed(1)}
          unit="days"
          reduction={(improvements.durationReduction / traditional.metrics.estimatedDuration) * 100}
          badge="TIME"
        />
      </div>

      {/* Success Rate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border border-[#1e3a5f] p-4">
          <div className="text-[10px] uppercase text-white/50 mb-2">Recovery Probability</div>
          <div className="flex items-baseline gap-3">
            <div className="text-2xl font-bold text-[#DF6C42]">
              {(optimized.metrics.recoveryProbability * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-white/60">
              vs {(traditional.metrics.recoveryProbability * 100).toFixed(0)}%
            </div>
          </div>
          <div className="mt-2 text-[9px] text-green-400">
            +{improvements.probabilityIncrease.toFixed(1)} percentage points
          </div>
        </div>

        <div className="border border-[#1e3a5f] p-4">
          <div className="text-[10px] uppercase text-white/50 mb-2">Cost Savings</div>
          <div className="text-2xl font-bold text-[#00d9ff]">
            {formatCurrency(improvements.costSavings)}
          </div>
          <div className="mt-2 text-[9px] text-white/60">
            {((improvements.costSavings / traditional.metrics.estimatedCost) * 100).toFixed(1)}% reduction
          </div>
        </div>
      </div>

      {/* Zone Breakdown */}
      <div className="border-t border-[#1e3a5f] pt-4 mt-4">
        <div className="text-xs font-semibold text-white/80 uppercase mb-3">
          Optimized Zone Coverage
        </div>

        <div className="grid grid-cols-3 gap-3">
          <ZoneBreakdown
            priority="High"
            area={optimized.metrics.zoneCoverage.high}
            color="#FF0000"
          />
          <ZoneBreakdown
            priority="Medium"
            area={optimized.metrics.zoneCoverage.medium}
            color="#FFFF00"
          />
          <ZoneBreakdown
            priority="Low"
            area={optimized.metrics.zoneCoverage.low}
            color="#0000FF"
          />
        </div>
      </div>

      {/* Environmental Impact */}
      {optimized.metrics.carbonFootprint && traditional.metrics.carbonFootprint && (
        <div className="border-t border-[#1e3a5f] pt-4 mt-4">
          <div className="text-xs font-semibold text-white/80 uppercase mb-3">
            Environmental Impact
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] uppercase text-white/50 mb-1">Carbon Footprint</div>
              <div className="text-lg font-bold text-white">
                {optimized.metrics.carbonFootprint.toFixed(0)} kg CO2
              </div>
              <div className="text-[9px] text-green-400 mt-1">
                -{((traditional.metrics.carbonFootprint - optimized.metrics.carbonFootprint) / traditional.metrics.carbonFootprint * 100).toFixed(1)}% vs traditional
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase text-white/50 mb-1">Fuel Consumption</div>
              <div className="text-lg font-bold text-white">
                {optimized.metrics.fuelConsumption?.toFixed(0) || 0} L
              </div>
              <div className="text-[9px] text-white/60 mt-1">
                Diesel fuel
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 p-4 bg-[#DF6C42]/10 border border-[#DF6C42]/30">
        <div className="flex items-center gap-3">
          <div className="text-2xl">OK</div>
          <div>
            <div className="text-sm font-bold text-white">
              Optimization Results Summary
            </div>
            <div className="text-xs text-white/70 mt-1">
              {improvements.areaReduction.toFixed(0)}% smaller search area -{' '}
              {((improvements.durationReduction / traditional.metrics.estimatedDuration) * 100).toFixed(0)}% faster recovery -{' '}
              {((improvements.costSavings / traditional.metrics.estimatedCost) * 100).toFixed(0)}% cost reduction
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Individual Metric Card
 */
function MetricCard({
  title,
  traditional,
  optimized,
  unit,
  reduction,
  badge,
}: {
  title: string;
  traditional: string;
  optimized: string;
  unit: string;
  reduction: number;
  badge: string;
}) {
  return (
    <div className="border border-[#1e3a5f] p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 border border-[#1e3a5f] text-white/60">
          {badge}
        </span>
        <div className="text-[10px] uppercase text-white/50">{title}</div>
      </div>

      <div className="space-y-2">
        <div>
          <div className="text-[9px] text-white/40 mb-0.5">Traditional</div>
          <div className="text-base font-semibold text-white/60">
            {traditional} {unit}
          </div>
        </div>

        <div>
          <div className="text-[9px] text-white/40 mb-0.5">Optimized</div>
          <div className="text-xl font-bold text-[#DF6C42]">
            {optimized} {unit}
          </div>
        </div>

        {reduction > 0 && (
          <div className="text-[9px] text-green-400 pt-1 border-t border-[#1e3a5f]">
            DOWN {reduction.toFixed(0)}% reduction
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Zone Breakdown Component
 */
function ZoneBreakdown({
  priority,
  area,
  color,
}: {
  priority: string;
  area: number;
  color: string;
}) {
  return (
    <div className="border border-[#1e3a5f] p-3">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 shrink-0"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}60` }}
        />
        <div className="text-[10px] uppercase text-white/70">{priority}</div>
      </div>
      <div className="text-lg font-bold text-white">{area.toFixed(1)} km^2</div>
      <div className="text-[9px] text-white/40 mt-1">
        {(area * 1000000).toExponential(2)} m^2
      </div>
    </div>
  );
}

/**
 * Format currency
 */
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  } else {
    return `$${value.toFixed(0)}`;
  }
}
