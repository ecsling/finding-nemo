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
        className="fixed bottom-24 right-6 z-50 px-4 py-2 bg-[#1D1E15] text-[#E5E6DA] font-mono text-xs uppercase tracking-wider rounded shadow-lg hover:shadow-xl transition-all border border-[#1D1E15]/40 hover:bg-[#1D1E15]/90"
      >
        {isOpen ? '✕ Close' : '📊 Compare Methods'}
      </motion.button>

      {/* Comparison Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#E5E6DA] border-2 border-[#1D1E15]/20 rounded-lg shadow-2xl max-w-4xl w-full mx-4 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-[#1D1E15]/5 border-b border-[#1D1E15]/10 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#1D1E15] font-mono uppercase tracking-wider">
                    Traditional vs OceanCache AI
                  </h2>
                  <p className="text-[#1D1E15]/60 text-sm mt-1">
                    See the difference AI makes in container recovery
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-[#1D1E15]/10 rounded transition-colors"
                >
                  <span className="text-[#1D1E15] text-xl">✕</span>
                </button>
              </div>

              {/* Comparison Grid */}
              <div className="grid grid-cols-2 divide-x divide-[#1D1E15]/10">
                {/* Traditional Method */}
                <div className="p-6 bg-[#DF6C42]/5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-[#DF6C42]/20 border border-[#DF6C42]/40 rounded flex items-center justify-center text-[#DF6C42]">
                      ❌
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#DF6C42] uppercase tracking-wide">Traditional Search</h3>
                      <p className="text-[#1D1E15]/40 text-xs">Manual Grid Method</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/40 border border-[#1D1E15]/10 rounded p-4">
                      <div className="text-[#1D1E15]/50 text-xs uppercase mb-2 tracking-wider">Recovery Time</div>
                      <div className="text-3xl font-bold text-[#DF6C42] font-mono">18-24hrs</div>
                      <div className="text-[#1D1E15]/40 text-xs mt-1">Slow, manual process</div>
                    </div>

                    <div className="bg-white/40 border border-[#1D1E15]/10 rounded p-4">
                      <div className="text-[#1D1E15]/50 text-xs uppercase mb-2 tracking-wider">Cost Per Recovery</div>
                      <div className="text-3xl font-bold text-[#DF6C42] font-mono">$3.2M</div>
                      <div className="text-[#1D1E15]/40 text-xs mt-1">Fuel + crew + equipment</div>
                    </div>

                    <div className="bg-white/40 border border-[#1D1E15]/10 rounded p-4">
                      <div className="text-[#1D1E15]/50 text-xs uppercase mb-2 tracking-wider">Success Rate</div>
                      <div className="text-3xl font-bold text-[#DF6C42] font-mono">45%</div>
                      <div className="text-[#1D1E15]/40 text-xs mt-1">Missed over half the time</div>
                    </div>

                    <div className="bg-white/40 border border-[#1D1E15]/10 rounded p-4">
                      <div className="text-[#1D1E15]/50 text-xs uppercase mb-2 tracking-wider">Method</div>
                      <div className="text-[#1D1E15]/70 text-sm">
                        • Manual grid search<br/>
                        • Guesswork & experience<br/>
                        • No real-time data<br/>
                        • High fuel consumption
                      </div>
                    </div>
                  </div>
                </div>

                {/* OceanCache AI */}
                <div className="p-6 bg-[#7ec8e3]/5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-[#7ec8e3]/20 border border-[#7ec8e3]/40 rounded flex items-center justify-center text-[#0a4d68]">
                      ✓
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0a4d68] uppercase tracking-wide">OceanCache AI</h3>
                      <p className="text-[#1D1E15]/40 text-xs">AI-Optimized Search</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/40 border border-[#7ec8e3]/30 rounded p-4">
                      <div className="text-[#1D1E15]/50 text-xs uppercase mb-2 tracking-wider">Recovery Time</div>
                      <div className="text-3xl font-bold text-[#0a4d68] font-mono">4-6hrs</div>
                      <div className="text-[#7ec8e3] text-xs mt-1 font-semibold">⚡ 75% faster</div>
                    </div>

                    <div className="bg-white/40 border border-[#7ec8e3]/30 rounded p-4">
                      <div className="text-[#1D1E15]/50 text-xs uppercase mb-2 tracking-wider">Cost Per Recovery</div>
                      <div className="text-3xl font-bold text-[#0a4d68] font-mono">$0.9M</div>
                      <div className="text-[#7ec8e3] text-xs mt-1 font-semibold">💰 $2.3M saved</div>
                    </div>

                    <div className="bg-white/40 border border-[#7ec8e3]/30 rounded p-4">
                      <div className="text-[#1D1E15]/50 text-xs uppercase mb-2 tracking-wider">Success Rate</div>
                      <div className="text-3xl font-bold text-[#0a4d68] font-mono">94%</div>
                      <div className="text-[#7ec8e3] text-xs mt-1 font-semibold">🎯 Industry-leading</div>
                    </div>

                    <div className="bg-white/40 border border-[#7ec8e3]/30 rounded p-4">
                      <div className="text-[#1D1E15]/50 text-xs uppercase mb-2 tracking-wider">Method</div>
                      <div className="text-[#1D1E15]/70 text-sm">
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
              <div className="bg-[#7ec8e3]/10 border-t border-[#1D1E15]/10 px-6 py-4">
                <div className="text-center">
                  <div className="text-[#1D1E15]/60 text-xs uppercase tracking-wider mb-2 font-bold">
                    Average ROI Per Recovery
                  </div>
                  <div className="text-4xl font-bold text-[#0a4d68] font-mono">
                    $2.3M SAVED
                  </div>
                  <div className="text-[#1D1E15]/60 text-xs mt-2">
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
