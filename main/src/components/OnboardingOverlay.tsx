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
        <div 
          className="p-2 rounded-lg"
          style={{ 
            backgroundColor: '#E6E3D6',
            border: '1px solid #B8B6A4',
            boxShadow: 'none',
            outline: 'none'
          }}
        >

          {/* Custom Dropdown */}
          <div className="p-6 space-y-5 rounded-lg">
            <div className="text-left space-y-3 relative" ref={dropdownRef}>
              <label 
                className="text-sm font-bold uppercase tracking-[0.15em] block"
                style={{ color: '#1D1E15' }}
              >
                Load Dive Model
              </label>

              {/* Custom Dropdown Trigger */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full text-base font-mono px-5 py-4 rounded-lg outline-none transition-all flex items-center justify-between group"
                style={{ 
                  backgroundColor: '#E6E3D6',
                  border: '1px solid #B8B6A4',
                  boxShadow: 'none',
                  outline: 'none',
                  color: '#1D1E15'
                }}
              >
                <span style={{ color: selectedDemo ? '#1D1E15' : 'rgba(29, 30, 21, 0.6)' }}>
                  {selectedDemo || "Select mission model..."}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                  style={{ color: '#1D1E15' }}
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
                      background: rgba(230, 227, 214, 0.8);
                      border-radius: 4px;
                    }
                    .mission-dropdown::-webkit-scrollbar-thumb {
                      background: rgba(29, 30, 21, 0.3);
                      border-radius: 4px;
                      border: 1px solid rgba(184, 182, 164, 0.3);
                    }
                    .mission-dropdown::-webkit-scrollbar-thumb:hover {
                      background: rgba(29, 30, 21, 0.5);
                    }
                  `}</style>
                  <div 
                    className="mission-dropdown absolute top-full left-0 right-0 mt-2 rounded-lg overflow-hidden z-50 max-h-[40vh] overflow-y-auto" 
                    style={{ 
                      backgroundColor: '#E6E3D6',
                      border: '1px solid #B8B6A4',
                      boxShadow: 'none',
                      outline: 'none',
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(29, 30, 21, 0.3) rgba(230, 227, 214, 0.8)'
                    }}
                  >
                    {filteredModels.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleDemoSelect(m.id, m.name)}
                        className="w-full text-left px-5 py-3.5 text-base font-mono transition-all border-b last:border-0 font-semibold"
                        style={{ 
                          color: '#1D1E15',
                          borderColor: 'rgba(184, 182, 164, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#E5E6DA';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
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
