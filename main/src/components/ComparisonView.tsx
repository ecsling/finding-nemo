'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function ComparisonView() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-mono text-xs uppercase tracking-wider rounded-lg shadow-lg hover:shadow-xl transition-all border border-white/20"
      >
        {isOpen ? '✕ Close' : '📊 Show Comparison'}
      </motion.button>

      {/* Comparison Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900 to-black border-2 border-cyan-500/40 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-b border-cyan-500/30 px-6 py-4">
                <h2 className="text-2xl font-bold text-white font-mono">
                  Traditional vs OceanCache AI
                </h2>
                <p className="text-white/60 text-sm mt-1">
                  See the difference AI makes in container recovery
                </p>
              </div>

              {/* Comparison Grid */}
              <div className="grid grid-cols-2 divide-x divide-white/10">
                {/* Traditional Method */}
                <div className="p-6 bg-red-500/5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-red-500/20 border border-red-500/40 rounded flex items-center justify-center text-red-400">
                      ❌
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-400">Traditional Search</h3>
                      <p className="text-white/40 text-xs">Manual Grid Method</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-white/50 text-xs uppercase mb-2">Recovery Time</div>
                      <div className="text-3xl font-bold text-red-400 font-mono">18-24hrs</div>
                      <div className="text-white/40 text-xs mt-1">Slow, manual process</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-white/50 text-xs uppercase mb-2">Cost Per Recovery</div>
                      <div className="text-3xl font-bold text-red-400 font-mono">$3.2M</div>
                      <div className="text-white/40 text-xs mt-1">Fuel + crew + equipment</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-white/50 text-xs uppercase mb-2">Success Rate</div>
                      <div className="text-3xl font-bold text-red-400 font-mono">45%</div>
                      <div className="text-white/40 text-xs mt-1">Missed over half the time</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-white/50 text-xs uppercase mb-2">Method</div>
                      <div className="text-white/80 text-sm">
                        • Manual grid search<br/>
                        • Guesswork & experience<br/>
                        • No real-time data<br/>
                        • High fuel consumption
                      </div>
                    </div>
                  </div>
                </div>

                {/* OceanCache AI */}
                <div className="p-6 bg-green-500/5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-green-500/20 border border-green-500/40 rounded flex items-center justify-center text-green-400">
                      ✓
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-green-400">OceanCache AI</h3>
                      <p className="text-white/40 text-xs">AI-Optimized Search</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/5 border border-green-500/20 rounded-lg p-4">
                      <div className="text-white/50 text-xs uppercase mb-2">Recovery Time</div>
                      <div className="text-3xl font-bold text-green-400 font-mono">4-6hrs</div>
                      <div className="text-green-400/60 text-xs mt-1">⚡ 75% faster</div>
                    </div>

                    <div className="bg-white/5 border border-green-500/20 rounded-lg p-4">
                      <div className="text-white/50 text-xs uppercase mb-2">Cost Per Recovery</div>
                      <div className="text-3xl font-bold text-green-400 font-mono">$0.9M</div>
                      <div className="text-green-400/60 text-xs mt-1">💰 $2.3M saved</div>
                    </div>

                    <div className="bg-white/5 border border-green-500/20 rounded-lg p-4">
                      <div className="text-white/50 text-xs uppercase mb-2">Success Rate</div>
                      <div className="text-3xl font-bold text-green-400 font-mono">94%</div>
                      <div className="text-green-400/60 text-xs mt-1">🎯 Industry-leading</div>
                    </div>

                    <div className="bg-white/5 border border-green-500/20 rounded-lg p-4">
                      <div className="text-white/50 text-xs uppercase mb-2">Method</div>
                      <div className="text-white/80 text-sm">
                        • AI drift prediction<br/>
                        • Real-time ocean data<br/>
                        • Computer vision<br/>
                        • Eco-friendly approach
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROI Summary */}
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-t border-purple-500/30 px-6 py-4">
                <div className="text-center">
                  <div className="text-white/60 text-xs uppercase tracking-wider mb-2">
                    Average ROI Per Recovery
                  </div>
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 font-mono">
                    $2.3M SAVED
                  </div>
                  <div className="text-white/40 text-xs mt-2">
                    Plus 850 tons CO2 saved • 12,000 gallons fuel saved
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
