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
          className="fixed left-6 top-24 w-96 backdrop-blur-md shadow-2xl z-50"
          style={{ 
            backgroundColor: '#E6E3D6',
            border: '1px solid #B8B6A4',
            boxShadow: 'none',
            outline: 'none'
          }}
        >
          {/* Header */}
          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid #B8B6A4' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center" style={{ backgroundColor: '#D8D6C4', border: '1px solid #B8B6A4' }}>
                <Package size={20} className="text-[#1D1E15]" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider font-mono" style={{ color: '#1D1E15', opacity: 0.6 }}>
                  Container ID
                </div>
                <div className="text-sm font-mono font-bold" style={{ color: '#1D1E15' }}>
                  {container.serialNumber}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="transition-colors"
              style={{ color: '#1D1E15', opacity: 0.6 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
            >
              <X size={20} />
            </button>
          </div>

          {/* Status Badge */}
          <div className="px-4 py-3" style={{ backgroundColor: '#D8D6C4', borderBottom: '1px solid #B8B6A4' }}>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${
                  container.status === 'floating' ? 'bg-[#DF6C42]' : 'bg-red-500'
                }`}
              />
              <span className="text-xs uppercase tracking-widest font-mono" style={{ color: '#1D1E15' }}>
                {container.status === 'floating' ? 'Drifting' : 'On Seabed'}
              </span>
              <span className="text-xs ml-auto" style={{ color: '#1D1E15', opacity: 0.5 }}>
                Origin: {container.shipName}
              </span>
            </div>
          </div>

          {/* Data Grid */}
          <div className="p-4 space-y-4">
            {/* Position */}
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-widest font-mono font-bold" style={{ color: '#1D1E15' }}>
                Current Position
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2" style={{ backgroundColor: '#D8D6C4', border: '1px solid #B8B6A4' }}>
                  <div className="text-[9px]" style={{ color: '#1D1E15', opacity: 0.5 }}>LAT</div>
                  <div className="text-sm font-mono" style={{ color: '#1D1E15' }}>
                    {container.position[0].toFixed(4)}°N
                  </div>
                </div>
                <div className="p-2" style={{ backgroundColor: '#D8D6C4', border: '1px solid #B8B6A4' }}>
                  <div className="text-[9px]" style={{ color: '#1D1E15', opacity: 0.5 }}>LON</div>
                  <div className="text-sm font-mono" style={{ color: '#1D1E15' }}>
                    {container.position[1].toFixed(4)}°W
                  </div>
                </div>
              </div>
            </div>

            {/* Drift Data */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <Waves size={14} className="mt-1" style={{ color: '#9B8F7A' }} />
                <div>
                  <div className="text-[9px] uppercase" style={{ color: '#1D1E15', opacity: 0.5 }}>Drift Speed</div>
                  <div className="text-sm font-mono" style={{ color: '#1D1E15' }}>{container.driftSpeed} m/s</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock size={14} className="mt-1" style={{ color: '#9B8F7A' }} />
                <div>
                  <div className="text-[9px] uppercase" style={{ color: '#1D1E15', opacity: 0.5 }}>Time Lost</div>
                  <div className="text-sm font-mono" style={{ color: '#1D1E15' }}>{container.timeInWater}h</div>
                </div>
              </div>
            </div>

            {/* Cargo Specs */}
            <div className="pt-4 space-y-3" style={{ borderTop: '1px solid #B8B6A4' }}>
              <div className="text-[10px] uppercase tracking-widest font-mono font-bold" style={{ color: '#1D1E15' }}>
                Cargo Specifications
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <Weight size={14} className="mt-1" style={{ color: '#9B8F7A' }} />
                  <div>
                    <div className="text-[9px] uppercase" style={{ color: '#1D1E15', opacity: 0.5 }}>Weight</div>
                    <div className="text-sm font-mono" style={{ color: '#1D1E15' }}>
                      {(container.weight / 1000).toFixed(1)}t
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Box size={14} className="mt-1" style={{ color: '#9B8F7A' }} />
                  <div>
                    <div className="text-[9px] uppercase" style={{ color: '#1D1E15', opacity: 0.5 }}>Dimensions</div>
                    <div className="text-xs font-mono" style={{ color: '#1D1E15' }}>
                      {container.dimensions.length}×{container.dimensions.width}×
                      {container.dimensions.height}m
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-2" style={{ backgroundColor: '#D8D6C4', border: '1px solid #B8B6A4' }}>
                <div className="text-[9px] uppercase mb-1" style={{ color: '#1D1E15', opacity: 0.6 }}>Contents</div>
                <div className="text-sm font-mono" style={{ color: '#1D1E15' }}>{container.contents}</div>
              </div>

              <div className="p-2" style={{ backgroundColor: '#D8D6C4', border: '1px solid #B8B6A4' }}>
                <div className="text-[9px] uppercase mb-1" style={{ color: '#1D1E15', opacity: 0.6 }}>Buoyancy</div>
                <div className="text-sm font-mono" style={{ color: '#1D1E15' }}>{container.buoyancy}</div>
              </div>
            </div>

            {/* Predicted Position */}
            <div className="pt-4 space-y-2" style={{ borderTop: '1px solid #B8B6A4' }}>
              <div className="flex items-center gap-2">
                <TrendingDown size={12} style={{ color: '#9B8F7A' }} />
                <div className="text-[10px] uppercase tracking-widest font-mono font-bold" style={{ color: '#1D1E15' }}>
                  Predicted Position (24h)
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2" style={{ backgroundColor: '#D8D6C4', border: '1px solid #B8B6A4' }}>
                  <div className="text-[9px]" style={{ color: '#1D1E15', opacity: 0.5 }}>LAT</div>
                  <div className="text-sm font-mono" style={{ color: '#1D1E15' }}>
                    {predictedPosition[0].toFixed(4)}°N
                  </div>
                </div>
                <div className="p-2" style={{ backgroundColor: '#D8D6C4', border: '1px solid #B8B6A4' }}>
                  <div className="text-[9px]" style={{ color: '#1D1E15', opacity: 0.5 }}>LON</div>
                  <div className="text-sm font-mono" style={{ color: '#1D1E15' }}>
                    {predictedPosition[1].toFixed(4)}°W
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            {onDiveClick && (
              <button
                onClick={onDiveClick}
                className="w-full mt-4 font-mono uppercase text-sm py-3 px-4 transition-all"
                style={{
                  backgroundColor: '#1D1E15',
                  color: '#E5E6DA',
                  border: '1px solid #1D1E15'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#9B8F7A';
                  e.currentTarget.style.borderColor = '#9B8F7A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1D1E15';
                  e.currentTarget.style.borderColor = '#1D1E15';
                }}
              >
                Dive to Container →
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2" style={{ borderTop: '1px solid #B8B6A4', backgroundColor: '#D8D6C4' }}>
            <div className="text-[9px] uppercase tracking-widest font-mono" style={{ color: '#1D1E15', opacity: 0.5 }}>
              Live Tracking • Updated {Math.floor(Math.random() * 5)} min ago
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
