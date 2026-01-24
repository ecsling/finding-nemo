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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#E5E6DA]/95 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="w-full max-w-lg p-8 text-center space-y-8">
        
        {/* Header */}
        <div className="space-y-3 text-left pl-1">
          <div className="w-16 h-16 flex items-center justify-center mb-6 overflow-hidden -ml-3">
             <img src="/logo.png" alt="Mesh Logo" className="w-10 h-10 object-contain invert" />
          </div>
          <p className="text-[#1D1E15]/60 font-mono text-xs uppercase tracking-wider max-w-md leading-relaxed">
            Advanced spatial visualization & analysis platform. <br/>
            Connect hardware or explore local models.
          </p>
        </div>

        {/* Actions Container */}
        <div className="bg-[#E5E6DA] border border-[#1D1E15] p-1.5 rounded-xl shadow-2xl">

          {/* Custom Dropdown */}
          <div className="p-4 space-y-4 bg-[#1D1E15]/5 rounded-lg border border-[#1D1E15]/5">
            <div className="text-left space-y-1.5 relative" ref={dropdownRef}>
              <label className="text-[10px] font-bold uppercase text-[#1D1E15] tracking-wider">
                Select Local Model
              </label>

              {/* Custom Dropdown Trigger */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-[#1D1E15] border border-[#1D1E15] text-[#E5E6DA] text-xs font-mono p-3 rounded-lg outline-none focus:border-[#DF6C42] transition-colors flex items-center justify-between hover:bg-[#1D1E15]/90"
              >
                <span className={selectedDemo ? "text-[#E5E6DA]" : "text-[#E5E6DA]/60"}>
                  {selectedDemo || "Choose a model to inspect..."}
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1D1E15] border border-[#1D1E15] rounded-lg shadow-lg overflow-hidden z-50 max-h-48 overflow-y-auto">
                  {DEMO_MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleDemoSelect(m.id, m.name)}
                      className="w-full text-left px-3 py-2.5 text-xs font-mono text-[#E5E6DA] hover:bg-[#DF6C42] hover:text-white transition-colors border-b border-[#E5E6DA]/10 last:border-0"
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
        <div className="flex items-center justify-center gap-6 text-[10px] text-[#1D1E15]/40 font-mono uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#DF6C42]"></div>
            Web Bluetooth
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#DF6C42]"></div>
            AI Analysis
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#DF6C42]"></div>
            Hardware Controls
          </div>
        </div>

      </div>
    </div>
  );
}
