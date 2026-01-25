'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, TrendingDown, Waves, Clock, Weight, Box } from 'lucide-react';

export interface ContainerData {
  id: string;
  serialNumber: string;
  position: [number, number];
  dropPosition: [number, number];
  status: 'floating' | 'sunken';
  timeInWater: number;
  driftSpeed: number;
  weight: number;
  dimensions: { length: number; width: number; height: number };
  contents: string;
  buoyancy: string;
  shipName: string;
}

interface ContainerDataPanelProps {
  container: ContainerData | null;
  onClose: () => void;
  onDiveClick?: () => void;
}

export default function ContainerDataPanel({
  container,
  onClose,
  onDiveClick,
}: ContainerDataPanelProps) {
  if (!container) return null;

  const predictedPosition = [
    container.position[0] + (container.driftSpeed * 0.01),
    container.position[1] + (container.driftSpeed * 0.01),
  ];

  return (
    <AnimatePresence>
      {container && (
        <motion.div
          initial={{ x: -400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="fixed left-6 top-24 w-96 bg-black/90 backdrop-blur-md border border-[#00d9ff] shadow-2xl z-50"
          style={{ boxShadow: '0 0 30px rgba(0, 217, 255, 0.3)' }}
        >
          {/* Header */}
          <div className="border-b border-[#00d9ff]/30 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#DF6C42]/20 border border-[#DF6C42] flex items-center justify-center">
                <Package size={20} className="text-[#DF6C42]" />
              </div>
              <div>
                <div className="text-xs text-white/60 uppercase tracking-wider font-mono">
                  Container ID
                </div>
                <div className="text-sm text-white font-mono font-bold">
                  {container.serialNumber}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Status Badge */}
          <div className="px-4 py-3 bg-black/40 border-b border-[#00d9ff]/10">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${
                  container.status === 'floating' ? 'bg-[#DF6C42]' : 'bg-red-500'
                }`}
              />
              <span className="text-xs text-white uppercase tracking-widest font-mono">
                {container.status === 'floating' ? 'Drifting' : 'On Seabed'}
              </span>
              <span className="text-xs text-white/40 ml-auto">
                Origin: {container.shipName}
              </span>
            </div>
          </div>

          {/* Data Grid */}
          <div className="p-4 space-y-4">
            {/* Position */}
            <div className="space-y-2">
              <div className="text-[10px] text-[#00d9ff] uppercase tracking-widest font-mono">
                Current Position
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#00d9ff]/5 p-2 border border-[#00d9ff]/20">
                  <div className="text-[9px] text-white/40">LAT</div>
                  <div className="text-sm text-white font-mono">
                    {container.position[0].toFixed(4)}°N
                  </div>
                </div>
                <div className="bg-[#00d9ff]/5 p-2 border border-[#00d9ff]/20">
                  <div className="text-[9px] text-white/40">LON</div>
                  <div className="text-sm text-white font-mono">
                    {container.position[1].toFixed(4)}°W
                  </div>
                </div>
              </div>
            </div>

            {/* Drift Data */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <Waves size={14} className="text-[#00d9ff] mt-1" />
                <div>
                  <div className="text-[9px] text-white/40 uppercase">Drift Speed</div>
                  <div className="text-sm text-white font-mono">{container.driftSpeed} m/s</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock size={14} className="text-[#00d9ff] mt-1" />
                <div>
                  <div className="text-[9px] text-white/40 uppercase">Time Lost</div>
                  <div className="text-sm text-white font-mono">{container.timeInWater}h</div>
                </div>
              </div>
            </div>

            {/* Cargo Specs */}
            <div className="border-t border-[#00d9ff]/10 pt-4 space-y-3">
              <div className="text-[10px] text-[#00d9ff] uppercase tracking-widest font-mono">
                Cargo Specifications
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <Weight size={14} className="text-[#DF6C42] mt-1" />
                  <div>
                    <div className="text-[9px] text-white/40 uppercase">Weight</div>
                    <div className="text-sm text-white font-mono">
                      {(container.weight / 1000).toFixed(1)}t
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Box size={14} className="text-[#DF6C42] mt-1" />
                  <div>
                    <div className="text-[9px] text-white/40 uppercase">Dimensions</div>
                    <div className="text-xs text-white font-mono">
                      {container.dimensions.length}×{container.dimensions.width}×
                      {container.dimensions.height}m
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#DF6C42]/10 p-2 border border-[#DF6C42]/30">
                <div className="text-[9px] text-white/60 uppercase mb-1">Contents</div>
                <div className="text-sm text-white font-mono">{container.contents}</div>
              </div>

              <div className="bg-black/40 p-2 border border-[#00d9ff]/20">
                <div className="text-[9px] text-white/60 uppercase mb-1">Buoyancy</div>
                <div className="text-sm text-white font-mono">{container.buoyancy}</div>
              </div>
            </div>

            {/* Predicted Position */}
            <div className="border-t border-[#00d9ff]/10 pt-4 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingDown size={12} className="text-[#00d9ff]" />
                <div className="text-[10px] text-[#00d9ff] uppercase tracking-widest font-mono">
                  Predicted Position (24h)
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#00d9ff]/5 p-2 border border-[#00d9ff]/20">
                  <div className="text-[9px] text-white/40">LAT</div>
                  <div className="text-sm text-white font-mono">
                    {predictedPosition[0].toFixed(4)}°N
                  </div>
                </div>
                <div className="bg-[#00d9ff]/5 p-2 border border-[#00d9ff]/20">
                  <div className="text-[9px] text-white/40">LON</div>
                  <div className="text-sm text-white font-mono">
                    {predictedPosition[1].toFixed(4)}°W
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            {onDiveClick && (
              <button
                onClick={onDiveClick}
                className="w-full mt-4 bg-[#DF6C42] hover:bg-[#DF6C42]/80 text-black font-mono uppercase text-sm py-3 px-4 transition-all border-2 border-[#DF6C42] hover:shadow-[0_0_20px_rgba(223,108,66,0.5)]"
              >
                Dive to Container →
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#00d9ff]/30 px-4 py-2 bg-black/60">
            <div className="text-[9px] text-white/40 uppercase tracking-widest font-mono">
              Live Tracking • Updated {Math.floor(Math.random() * 5)} min ago
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
