'use client';

import { DEMO_MODELS } from '@/lib/demo-config';
import {
  TimelineEvent,
  ASSET_CONFIG,
  WEATHER_CONDITIONS,
  TRADE_ROUTES,
} from '@/lib/simulation-data';

interface CommandDashboardProps {
  assetId: string;
  elapsedTime: number;
  progress: number;
  events: TimelineEvent[];
  currentEventIndex: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function CommandDashboard({
  assetId,
  elapsedTime,
  progress,
  events,
  currentEventIndex,
}: CommandDashboardProps) {
  const asset = DEMO_MODELS.find((m) => m.id === assetId);
  const fuelRemaining = Math.max(0, 100 - elapsedTime * ASSET_CONFIG.fuelBurnRate);
  const distanceCovered = Math.round(progress * 1200);
  const routesMonitored = Math.min(TRADE_ROUTES.length, Math.floor(progress * TRADE_ROUTES.length) + 1);
  const heading = Math.round((progress * 360) % 360);

  // Calculate mission metrics
  const contactsDetected = events.slice(0, currentEventIndex + 1).filter(e => e.type === 'contact').length;
  const threatsIdentified = events.slice(0, currentEventIndex + 1).filter(e => e.type === 'threat').length;
  const missionCost = Math.round((elapsedTime / 3600) * ASSET_CONFIG.costPerHour);
  const efficiencyScore = Math.min(100, Math.round(60 + progress * 35 + (fuelRemaining > 30 ? 5 : 0)));

  // Determine current threat level based on events
  const recentThreat = events.slice(0, currentEventIndex + 1).reverse().find(e => e.type === 'threat');
  const threatLevel = recentThreat?.data?.threatLevel || 'low';

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-[#E5E6DA] overflow-hidden text-sm">
      {/* Mission Clock & Threat Level */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="text-[9px] uppercase tracking-wider opacity-50 mb-0.5">Mission Clock</div>
          <div className="text-2xl font-mono font-bold text-[#3B82F6]">{formatTime(elapsedTime)}</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-wider opacity-50 mb-0.5">Threat Level</div>
          <div className={`text-lg font-bold uppercase ${
            threatLevel === 'low' ? 'text-[#10B981]' :
            threatLevel === 'medium' ? 'text-[#F59E0B]' :
            threatLevel === 'high' ? 'text-[#EF4444]' : 'text-[#10B981]'
          }`}>
            {threatLevel === 'friendly' ? 'LOW' : threatLevel.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Weather Conditions */}
      <div className="p-3 border-b border-white/10">
        <div className="text-[9px] uppercase tracking-wider opacity-50 mb-2">Weather Conditions</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="opacity-60">Temp</span>
            <span className="font-mono">{WEATHER_CONDITIONS.temperature}°C</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">Wind</span>
            <span className="font-mono">{WEATHER_CONDITIONS.windSpeed} kts</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">Visibility</span>
            <span className={`capitalize ${
              WEATHER_CONDITIONS.visibility === 'poor' ? 'text-red-400' :
              WEATHER_CONDITIONS.visibility === 'moderate' ? 'text-yellow-400' : ''
            }`}>{WEATHER_CONDITIONS.visibility}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">Ice Cover</span>
            <span className={WEATHER_CONDITIONS.iceCoverage > 50 ? 'text-cyan-400' : ''}>{WEATHER_CONDITIONS.iceCoverage}%</span>
          </div>
        </div>
      </div>

      {/* Resource Tracking */}
      <div className="p-3 border-b border-white/10">
        <div className="text-[9px] uppercase tracking-wider opacity-50 mb-2">Resource Tracking</div>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="opacity-60">Fuel</span>
              <span className={fuelRemaining < 30 ? 'text-red-400' : ''}>{Math.round(fuelRemaining)}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded">
              <div
                className={`h-full rounded transition-all ${fuelRemaining < 30 ? 'bg-red-400' : 'bg-[#3B82F6]'}`}
                style={{ width: `${fuelRemaining}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="opacity-60">Distance</span>
              <span className="font-mono">{distanceCovered} nm</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">Cost</span>
              <span className="font-mono text-[#F59E0B]">${missionCost.toLocaleString()}k</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Metrics */}
      <div className="p-3 border-b border-white/10">
        <div className="text-[9px] uppercase tracking-wider opacity-50 mb-2">Mission Metrics</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/5 rounded p-2">
            <div className="text-lg font-bold text-[#3B82F6]">{contactsDetected}</div>
            <div className="text-[9px] opacity-60 uppercase">Contacts</div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-lg font-bold text-[#F59E0B]">{threatsIdentified}</div>
            <div className="text-[9px] opacity-60 uppercase">Threats</div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-lg font-bold text-[#10B981]">{routesMonitored}/{TRADE_ROUTES.length}</div>
            <div className="text-[9px] opacity-60 uppercase">Routes</div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-lg font-bold text-[#8B5CF6]">{efficiencyScore}%</div>
            <div className="text-[9px] opacity-60 uppercase">Efficiency</div>
          </div>
        </div>
      </div>

      {/* Asset Status */}
      <div className="p-3 border-b border-white/10">
        <div className="text-[9px] uppercase tracking-wider opacity-50 mb-2">Asset Status</div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold truncate">{asset?.name || 'Unknown Asset'}</div>
            <div className="text-[9px] text-[#10B981] uppercase">Active</div>
          </div>
          <div className="text-right text-xs">
            <div className="font-mono">{heading.toString().padStart(3, '0')}°</div>
            <div className="opacity-60">{ASSET_CONFIG.cruiseSpeed} kts</div>
          </div>
        </div>
      </div>

      {/* Event Log - Fixed height with scroll */}
      <div className="p-3 border-t border-white/10">
        <div className="text-[9px] uppercase tracking-wider opacity-50 mb-2">Event Log</div>
        <div className="h-[140px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {events.slice(0, currentEventIndex + 1).reverse().map((event, idx) => (
            <div
              key={`${event.time}-${event.type}-${idx}`}
              className={`text-[11px] flex gap-1.5 ${idx === 0 ? 'text-[#3B82F6]' : 'opacity-70'}`}
            >
              <span className="font-mono w-10 shrink-0">{formatTime(event.time)}</span>
              <span className="shrink-0 w-4">
                {event.type === 'contact' && '📡'}
                {event.type === 'weather' && '🌨'}
                {event.type === 'fuel_warning' && '⛽'}
                {event.type === 'mission_complete' && '✅'}
                {event.type === 'deploy' && '🚀'}
                {event.type === 'route_start' && '➡️'}
                {event.type === 'return' && '↩️'}
                {event.type === 'route_complete' && '✓'}
                {event.type === 'threat' && '⚠️'}
                {event.type === 'ice_warning' && '🧊'}
              </span>
              <span className="truncate">{event.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}