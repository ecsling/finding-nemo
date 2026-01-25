'use client';

/**
 * Incident Input Form Component
 * Collect container loss incident data for probability search
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { IncidentInput, GPSCoordinate } from '@/models/SearchOptimization';
import { validateContainerSerial } from '@/lib/geo-utils';

interface IncidentInputFormProps {
  onSubmit: (incident: IncidentInput) => void;
  loading?: boolean;
  initialData?: Partial<IncidentInput>;
}

export default function IncidentInputForm({
  onSubmit,
  loading = false,
  initialData,
}: IncidentInputFormProps) {
  // Form state
  const [latitude, setLatitude] = useState(initialData?.gpsCoordinates?.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(initialData?.gpsCoordinates?.longitude?.toString() || '');
  const [depth, setDepth] = useState(
    initialData?.gpsCoordinates?.altitude ? Math.abs(initialData.gpsCoordinates.altitude).toString() : ''
  );
  const [containerSerial, setContainerSerial] = useState(initialData?.containerSerialId || '');
  const [currentSpeed, setCurrentSpeed] = useState('0.5');
  const [currentDirection, setCurrentDirection] = useState('270');
  const [timeInWater, setTimeInWater] = useState('48');
  const [cargoValue, setCargoValue] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // GPS validation
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }

    if (isNaN(lon) || lon < -180 || lon > 180) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    // Container serial validation
    if (!containerSerial.trim()) {
      newErrors.containerSerial = 'Container serial is required';
    } else if (!validateContainerSerial(containerSerial)) {
      newErrors.containerSerial = 'Invalid ISO 6346 format (e.g., MAEU-123456-7)';
    }

    // Depth validation
    const depthVal = parseFloat(depth);
    if (depth && (isNaN(depthVal) || depthVal < 0)) {
      newErrors.depth = 'Depth must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [latitude, longitude, depth, containerSerial]);

  // Handle submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      const gpsCoordinates: GPSCoordinate = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        altitude: depth ? -Math.abs(parseFloat(depth)) : undefined,
      };

      const incident: IncidentInput = {
        id: `INC-${Date.now()}`,
        timestamp: new Date(),
        gpsCoordinates,
        containerSerialId: containerSerial.toUpperCase(),
        estimatedTimeInWater: parseFloat(timeInWater) || 48,
        cargoValue: cargoValue ? parseFloat(cargoValue) : undefined,
        environmentalConditions: {
          oceanCurrents: [
            {
              speed: parseFloat(currentSpeed) || 0.5,
              direction: parseFloat(currentDirection) || 270,
              depth: parseFloat(depth) || 0,
              timestamp: new Date(),
              source: 'mock',
            },
          ],
        },
      };

      onSubmit(incident);
    },
    [validate, latitude, longitude, depth, containerSerial, currentSpeed, currentDirection, timeInWater, cargoValue, onSubmit]
  );

  // Quick-fill with example data (Kelvin Seamounts)
  const fillExample = useCallback(() => {
    setLatitude('37.5');
    setLongitude('-14.5');
    setDepth('2850');
    setContainerSerial('MAEU-123456-7');
    setCurrentSpeed('0.42');
    setCurrentDirection('85');
    setTimeInWater('72');
    setCargoValue('850000');
    setErrors({});
  }, []);

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-bold text-[#00d9ff] uppercase tracking-wide">
            Incident Data
          </h3>
          <p className="text-xs text-white/60 mt-1">Enter container loss incident details</p>
        </div>

        <button
          type="button"
          onClick={fillExample}
          className="px-3 py-1 text-[9px] uppercase border border-[#1e3a5f] text-white/70 hover:bg-[#0d2847] hover:text-white transition-colors"
        >
          Load Example
        </button>
      </div>

      {/* GPS Coordinates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] uppercase text-white/70 mb-1.5">
            Latitude (°N)
          </label>
          <input
            type="text"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="37.5"
            className={`w-full px-3 py-2 bg-black/50 border ${
              errors.latitude ? 'border-red-500' : 'border-[#1e3a5f]'
            } text-white text-sm focus:outline-none focus:border-[#00d9ff]`}
          />
          {errors.latitude && (
            <div className="text-[9px] text-red-500 mt-1">{errors.latitude}</div>
          )}
        </div>

        <div>
          <label className="block text-[10px] uppercase text-white/70 mb-1.5">
            Longitude (°E)
          </label>
          <input
            type="text"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="-14.5"
            className={`w-full px-3 py-2 bg-black/50 border ${
              errors.longitude ? 'border-red-500' : 'border-[#1e3a5f]'
            } text-white text-sm focus:outline-none focus:border-[#00d9ff]`}
          />
          {errors.longitude && (
            <div className="text-[9px] text-red-500 mt-1">{errors.longitude}</div>
          )}
        </div>
      </div>

      {/* Container Serial & Depth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] uppercase text-white/70 mb-1.5">
            Container Serial (ISO 6346)
          </label>
          <input
            type="text"
            value={containerSerial}
            onChange={(e) => setContainerSerial(e.target.value)}
            placeholder="MAEU-123456-7"
            className={`w-full px-3 py-2 bg-black/50 border ${
              errors.containerSerial ? 'border-red-500' : 'border-[#1e3a5f]'
            } text-white text-sm font-mono uppercase focus:outline-none focus:border-[#00d9ff]`}
          />
          {errors.containerSerial && (
            <div className="text-[9px] text-red-500 mt-1">{errors.containerSerial}</div>
          )}
        </div>

        <div>
          <label className="block text-[10px] uppercase text-white/70 mb-1.5">
            Depth (meters)
          </label>
          <input
            type="text"
            value={depth}
            onChange={(e) => setDepth(e.target.value)}
            placeholder="2850"
            className={`w-full px-3 py-2 bg-black/50 border ${
              errors.depth ? 'border-red-500' : 'border-[#1e3a5f]'
            } text-white text-sm focus:outline-none focus:border-[#00d9ff]`}
          />
          {errors.depth && <div className="text-[9px] text-red-500 mt-1">{errors.depth}</div>}
        </div>
      </div>

      {/* Environmental Conditions */}
      <div className="border-t border-[#1e3a5f] pt-4 mt-2">
        <h4 className="text-xs font-semibold text-white/80 uppercase mb-3">
          Environmental Conditions
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] uppercase text-white/70 mb-1.5">
              Current Speed (m/s)
            </label>
            <input
              type="text"
              value={currentSpeed}
              onChange={(e) => setCurrentSpeed(e.target.value)}
              placeholder="0.5"
              className="w-full px-3 py-2 bg-black/50 border border-[#1e3a5f] text-white text-sm focus:outline-none focus:border-[#00d9ff]"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-white/70 mb-1.5">
              Current Direction (°)
            </label>
            <input
              type="text"
              value={currentDirection}
              onChange={(e) => setCurrentDirection(e.target.value)}
              placeholder="270"
              className="w-full px-3 py-2 bg-black/50 border border-[#1e3a5f] text-white text-sm focus:outline-none focus:border-[#00d9ff]"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-white/70 mb-1.5">
              Time in Water (hours)
            </label>
            <input
              type="text"
              value={timeInWater}
              onChange={(e) => setTimeInWater(e.target.value)}
              placeholder="48"
              className="w-full px-3 py-2 bg-black/50 border border-[#1e3a5f] text-white text-sm focus:outline-none focus:border-[#00d9ff]"
            />
          </div>
        </div>
      </div>

      {/* Optional: Cargo Value */}
      <div>
        <label className="block text-[10px] uppercase text-white/70 mb-1.5">
          Cargo Value (USD) <span className="text-white/40">(Optional)</span>
        </label>
        <input
          type="text"
          value={cargoValue}
          onChange={(e) => setCargoValue(e.target.value)}
          placeholder="850000"
          className="w-full px-3 py-2 bg-black/50 border border-[#1e3a5f] text-white text-sm focus:outline-none focus:border-[#00d9ff]"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full px-6 py-3 mt-2 text-sm font-bold uppercase transition-all ${
          loading
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-[#DF6C42] text-black hover:bg-[#DF6C42]/80'
        }`}
        style={!loading ? { boxShadow: '0 0 20px rgba(223, 108, 66, 0.4)' } : {}}
      >
        {loading ? 'Calculating...' : 'Calculate Search Zones'}
      </button>

      {/* Info Note */}
      <div className="text-[9px] text-white/40 leading-relaxed">
        <strong>Note:</strong> All coordinates use WGS84 datum. Container serial must follow ISO
        6346 format with valid check digit.
      </div>
    </motion.form>
  );
}
