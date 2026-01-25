'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function ImpactMetrics() {
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  const [count3, setCount3] = useState(0);

  useEffect(() => {
    // Animate counters
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    const timer1 = setInterval(() => {
      setCount1(prev => {
        const next = prev + (2.3 / steps);
        return next >= 2.3 ? 2.3 : next;
      });
    }, interval);

    const timer2 = setInterval(() => {
      setCount2(prev => {
        const next = prev + (75 / steps);
        return next >= 75 ? 75 : next;
      });
    }, interval);

    const timer3 = setInterval(() => {
      setCount3(prev => {
        const next = prev + (94 / steps);
        return next >= 94 ? 94 : next;
      });
    }, interval);

    return () => {
      clearInterval(timer1);
      clearInterval(timer2);
      clearInterval(timer3);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-cyan-600 to-blue-700 backdrop-blur-md px-8 py-4 rounded-lg shadow-2xl border border-white/20"
    >
      <div className="flex items-center gap-8">
        {/* Metric 1 */}
        <div className="text-center">
          <div className="text-3xl font-bold text-white font-mono">
            ${count1.toFixed(1)}M
          </div>
          <div className="text-[10px] text-white/80 uppercase tracking-wider mt-1">
            Avg. Savings
          </div>
        </div>

        <div className="w-px h-12 bg-white/30"></div>

        {/* Metric 2 */}
        <div className="text-center">
          <div className="text-3xl font-bold text-white font-mono">
            {Math.round(count2)}%
          </div>
          <div className="text-[10px] text-white/80 uppercase tracking-wider mt-1">
            Faster Recovery
          </div>
        </div>

        <div className="w-px h-12 bg-white/30"></div>

        {/* Metric 3 */}
        <div className="text-center">
          <div className="text-3xl font-bold text-white font-mono">
            {Math.round(count3)}%
          </div>
          <div className="text-[10px] text-white/80 uppercase tracking-wider mt-1">
            Success Rate
          </div>
        </div>

        <div className="w-px h-12 bg-white/30"></div>

        {/* Bonus: Market Size */}
        <div className="text-center">
          <div className="text-2xl font-bold text-white font-mono">
            10K+
          </div>
          <div className="text-[10px] text-white/80 uppercase tracking-wider mt-1">
            Containers Lost/Year
          </div>
        </div>
      </div>
    </motion.div>
  );
}
