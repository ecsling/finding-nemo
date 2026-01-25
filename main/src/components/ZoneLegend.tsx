'use client';

/**
 * Zone Legend Component
 * Display color-coded priority zones explanation
 */

import React from 'react';
import { motion } from 'framer-motion';

interface ZoneLegendProps {
  showProbabilities?: boolean;
  className?: string;
}

export default function ZoneLegend({ showProbabilities = false, className = '' }: ZoneLegendProps) {
  const zones = [
    {
      priority: 'high',
      color: '#FF0000',
      label: 'High Priority',
      description: 'Probability > 70%',
      rangeMin: 0.7,
      rangeMax: 1.0,
    },
    {
      priority: 'medium',
      color: '#FFFF00',
      label: 'Medium Priority',
      description: '30-70% Probability',
      rangeMin: 0.3,
      rangeMax: 0.7,
    },
    {
      priority: 'low',
      color: '#0000FF',
      label: 'Low Priority',
      description: 'Probability < 30%',
      rangeMin: 0,
      rangeMax: 0.3,
    },
  ];

  return (
    <motion.div
      className={`border border-[#1e3a5f] p-4 ${className}`}
      style={{ backgroundColor: 'rgba(5, 15, 26, 0.9)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-[10px] uppercase opacity-50 mb-3 font-mono tracking-wider">
        Priority Zones
      </div>

      <div className="flex flex-col gap-2">
        {zones.map((zone) => (
          <div key={zone.priority} className="flex items-center gap-3 group">
            {/* Color Swatch */}
            <div
              className="w-4 h-4 shrink-0 border border-white/20 transition-transform group-hover:scale-125"
              style={{
                backgroundColor: zone.color,
                boxShadow: `0 0 8px ${zone.color}60`,
              }}
            />

            {/* Label & Description */}
            <div className="flex-1">
              <div className="text-xs font-semibold text-white uppercase tracking-wide">
                {zone.label}
              </div>
              {showProbabilities && (
                <div className="text-[10px] text-white/60 mt-0.5">{zone.description}</div>
              )}
            </div>

            {/* Probability Range (Optional) */}
            {showProbabilities && (
              <div className="text-[10px] font-mono text-[#00d9ff] shrink-0">
                {(zone.rangeMin * 100).toFixed(0)}-{(zone.rangeMax * 100).toFixed(0)}%
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-4 pt-3 border-t border-[#1e3a5f]">
        <div className="text-[9px] text-white/40 leading-relaxed">
          Zones calculated using multi-factor spatial analysis: distance decay, route proximity,
          ocean current influence, and historical incident clustering.
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Compact Legend for Overlay
 */
export function CompactLegend({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="text-[10px] uppercase opacity-50">Probability:</div>

      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-[#FF0000]" style={{ boxShadow: '0 0 8px #FF000060' }} />
        <div className="text-[10px] text-white/70">High</div>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-[#FFFF00]" style={{ boxShadow: '0 0 8px #FFFF0060' }} />
        <div className="text-[10px] text-white/70">Medium</div>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-[#0000FF]" style={{ boxShadow: '0 0 8px #0000FF60' }} />
        <div className="text-[10px] text-white/70">Low</div>
      </div>
    </div>
  );
}
