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

  // Filter to only show Cargo Ship
  const filteredModels = DEMO_MODELS.filter(m => m.id === 'cargo-ship');

  return (
    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="absolute left-1/2 top-32 -translate-x-1/2 w-[600px] z-50">
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
                    {filteredModels.map((m) => (
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
      </div>
    </div>
  );
}
