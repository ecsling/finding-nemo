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
          <div className="w-20 h-20 flex items-center justify-center mb-8 overflow-hidden">
            <div className="w-16 h-16 flex items-center justify-center relative">
              <div className="absolute inset-0 border-2 border-[#00d9ff] animate-pulse" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', boxShadow: '0 0 30px rgba(0, 217, 255, 0.6)' }}></div>
              <div className="w-10 h-10 bg-black border-2 border-[#00d9ff] relative z-10" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', boxShadow: '0 0 20px rgba(0, 217, 255, 0.8)' }}></div>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border-2 border-[#00d9ff] text-xs uppercase tracking-[0.2em] w-fit bg-black/50 mb-6" style={{ boxShadow: '0 0 15px rgba(0, 217, 255, 0.4)' }}>
            <div className="w-2 h-2 bg-[#00ff00] animate-pulse" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', boxShadow: '0 0 10px rgba(0, 255, 0, 0.8)' }}></div>
            <span className="text-white font-bold" style={{ textShadow: '0 0 10px rgba(0, 217, 255, 0.8)' }}>MISSION CONSOLE</span>
          </div>
          <h2 className="text-3xl font-sans font-bold leading-none tracking-tight text-white mb-4" style={{ textShadow: '0 0 20px rgba(0, 217, 255, 0.6), 0 0 40px rgba(0, 217, 255, 0.3)' }}>
            LOAD DIVE MODEL
          </h2>
          <p className="text-base text-white/80 font-mono uppercase tracking-wider max-w-xl leading-relaxed" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}>
            Prepare for deep sea recovery mission. <br/>
            Select a container model to begin dive preparation.
          </p>
        </div>

        {/* Actions Container */}
        <div className="border-2 border-[#00d9ff] p-2 rounded-lg shadow-2xl" style={{ backgroundColor: 'rgba(5, 15, 26, 0.9)', boxShadow: '0 0 25px rgba(0, 217, 255, 0.4)' }}>

          {/* Custom Dropdown */}
          <div className="p-6 space-y-5 rounded-lg">
            <div className="text-left space-y-3 relative" ref={dropdownRef}>
              <label className="text-sm font-bold uppercase text-[#00d9ff] tracking-[0.15em] block" style={{ textShadow: '0 0 10px rgba(0, 217, 255, 0.8)' }}>
                Load Dive Model
              </label>

              {/* Custom Dropdown Trigger */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-[#0a2540] border-2 border-[#4080bf] text-white text-base font-mono px-5 py-4 rounded-lg outline-none focus:border-[#00d9ff] transition-all flex items-center justify-between hover:bg-[#0d2847] hover:border-[#00d9ff] group"
                style={{ 
                  boxShadow: '0 0 15px rgba(64, 128, 191, 0.3)',
                  textShadow: '0 0 5px rgba(255, 255, 255, 0.3)'
                }}
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
                  strokeWidth="2"
                  className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""} text-[#00d9ff]`}
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <style jsx global>{`
                    .mission-dropdown::-webkit-scrollbar {
                      width: 8px;
                    }
                    .mission-dropdown::-webkit-scrollbar-track {
                      background: rgba(10, 37, 64, 0.8);
                      border-radius: 4px;
                    }
                    .mission-dropdown::-webkit-scrollbar-thumb {
                      background: rgba(0, 217, 255, 0.5);
                      border-radius: 4px;
                      border: 1px solid rgba(0, 217, 255, 0.3);
                    }
                    .mission-dropdown::-webkit-scrollbar-thumb:hover {
                      background: rgba(0, 217, 255, 0.7);
                    }
                  `}</style>
                  <div 
                    className="mission-dropdown absolute top-full left-0 right-0 mt-2 bg-[#0a2540] border-2 border-[#4080bf] rounded-lg shadow-xl overflow-hidden z-50 max-h-[40vh] overflow-y-auto" 
                    style={{ 
                      boxShadow: '0 0 20px rgba(0, 217, 255, 0.4)',
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(0, 217, 255, 0.5) rgba(10, 37, 64, 0.8)'
                    }}
                  >
                    {DEMO_MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleDemoSelect(m.id, m.name)}
                        className="w-full text-left px-5 py-3.5 text-base font-mono text-white hover:bg-[#00d9ff] hover:text-black transition-all border-b border-[#4080bf]/20 last:border-0 font-semibold"
                        style={{ textShadow: '0 0 5px rgba(255, 255, 255, 0.3)' }}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-center gap-8 text-sm text-white/70 font-mono uppercase tracking-widest">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#00d9ff] animate-pulse" style={{ boxShadow: '0 0 10px rgba(0, 217, 255, 0.8)' }}></div>
            <span>Web Bluetooth</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#00d9ff] animate-pulse" style={{ boxShadow: '0 0 10px rgba(0, 217, 255, 0.8)' }}></div>
            <span>AI Analysis</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#00d9ff] animate-pulse" style={{ boxShadow: '0 0 10px rgba(0, 217, 255, 0.8)' }}></div>
            <span>Hardware Controls</span>
          </div>
        </div>

      </div>
    </div>
  );
}
