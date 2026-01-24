import React, { useState, useRef, useEffect } from 'react';
import { DEMO_MODELS } from '@/lib/demo-config';

interface OnboardingOverlayProps {
  onSelectDemo: (id: string) => void;
  onDismiss: () => void;
}

export default function OnboardingOverlay({
  onSelectDemo,
  onDismiss
}: OnboardingOverlayProps) {
  const [selectedDemo, setSelectedDemo] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDemoSelect = (id: string, name: string) => {
    setSelectedDemo(name);
    setIsDropdownOpen(false);
    if (id) {
      onSelectDemo(id);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="w-full max-w-2xl p-10 text-center space-y-10">
        
        {/* Header */}
        <div className="space-y-4 text-left">
          <div className="w-20 h-20 flex items-center justify-center mb-6 mx-auto">
            <div className="w-16 h-16 flex items-center justify-center relative">
              <div className="absolute inset-0 border-2 border-[#00d9ff] animate-pulse" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', boxShadow: '0 0 30px rgba(0, 217, 255, 0.6)' }}></div>
              <div className="w-10 h-10 bg-black border-2 border-[#00d9ff] relative z-10" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', boxShadow: '0 0 20px rgba(0, 217, 255, 0.8)' }}></div>
            </div>
          </div>
          <p className="text-white font-mono text-base uppercase tracking-[0.15em] max-w-lg leading-relaxed text-center mx-auto" style={{ textShadow: '0 0 10px rgba(0, 217, 255, 0.4)' }}>
            Deep Sea Recovery System // Mission Setup Interface <br/>
            <span className="text-[#00d9ff] text-sm">Load dive model to begin recovery operation.</span>
          </p>
        </div>

        {/* Actions Container */}
        <div className="bg-black/80 border-2 border-[#00d9ff] p-6 rounded-lg shadow-2xl" style={{ boxShadow: '0 0 30px rgba(0, 217, 255, 0.3)' }}>

          {/* Custom Dropdown */}
          <div className="p-6 space-y-5 bg-black/40 rounded-lg border border-[#00d9ff]/30">
            <div className="text-left space-y-3 relative" ref={dropdownRef}>
              <label className="text-sm font-bold uppercase text-white tracking-[0.2em] block" style={{ textShadow: '0 0 10px rgba(0, 217, 255, 0.6)' }}>
                Load Dive Model
              </label>

              {/* Custom Dropdown Trigger */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-black border-2 border-[#00d9ff] text-white text-base font-mono p-4 rounded-lg outline-none focus:border-[#00d9ff] focus:ring-2 focus:ring-[#00d9ff]/50 transition-all flex items-center justify-between hover:bg-[#00d9ff]/10 hover:shadow-[0_0_20px_rgba(0,217,255,0.4)]"
                style={{ boxShadow: '0 0 15px rgba(0, 217, 255, 0.2)' }}
              >
                <span className={selectedDemo ? "text-white" : "text-white/60"}>
                  {selectedDemo || "Select mission model..."}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className={`transition-transform duration-200 text-[#00d9ff] ${isDropdownOpen ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-black border-2 border-[#00d9ff] rounded-lg shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto" style={{ boxShadow: '0 0 30px rgba(0, 217, 255, 0.5)' }}>
                  {DEMO_MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleDemoSelect(m.id, m.name)}
                      className="w-full text-left px-4 py-3 text-base font-mono text-white hover:bg-[#00d9ff] hover:text-black transition-all border-b border-[#00d9ff]/20 last:border-0 font-semibold"
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-center gap-8 text-sm text-white/70 font-mono uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00d9ff] animate-pulse" style={{ boxShadow: '0 0 10px rgba(0, 217, 255, 0.8)' }}></div>
            <span>System Capabilities</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00d9ff] animate-pulse" style={{ boxShadow: '0 0 10px rgba(0, 217, 255, 0.8)' }}></div>
            <span>AI Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00d9ff] animate-pulse" style={{ boxShadow: '0 0 10px rgba(0, 217, 255, 0.8)' }}></div>
            <span>3D Visualization</span>
          </div>
        </div>

      </div>
    </div>
  );
}
