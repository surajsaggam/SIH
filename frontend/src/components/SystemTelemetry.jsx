import React from 'react';
import { Terminal } from 'lucide-react';

export default function SystemTelemetry({ activeSample, children }) {
  if (!activeSample) return null;

  const formatVal = (val, decimals) => {
    if (val === undefined || val === null || val === "" || val === "NaN" || isNaN(parseFloat(val))) return "N/A";
    return parseFloat(val).toFixed(decimals);
  };

  return (
    <section className="border border-gray-800 bg-black/40 rounded-sm p-6 relative overflow-hidden mb-8">
      {/* Scanline Animation */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-mission-cyan/30 animate-[scan_4s_linear_infinite] pointer-events-none z-50"></div>
      
      <style>{`
        @keyframes scan {
            0% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
      `}</style>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-800 pb-4 gap-4">
        <h2 className="text-sm font-mono font-bold text-mission-orange flex items-center gap-2 uppercase tracking-widest">
          <Terminal size={18} />
          SYSTEM_TELEMETRY // LIVE_FEED
        </h2>
        <div className="flex flex-wrap gap-4 md:gap-6">
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            PSNR: <span className="text-mission-cyan ml-1 font-bold">{formatVal(activeSample.psnr_ai, 2)}dB</span>
          </div>
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            SSIM: <span className="text-mission-cyan ml-1 font-bold">{formatVal(activeSample.ssim_ai, 3)}</span>
          </div>
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            LATENCY: <span className="text-mission-cyan ml-1 font-bold">12ms</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Data Readouts Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="border border-gray-800 bg-gray-900/50 p-4 rounded-sm">
            <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-2">Sensor Array Alpha</div>
            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-mission-orange h-full w-[85%]"></div>
            </div>
            <div className="mt-2 text-[10px] font-mono text-right text-mission-orange font-bold uppercase tracking-widest">85% OPTIMAL</div>
          </div>
          
          <div className="border border-gray-800 bg-gray-900/50 p-4 rounded-sm">
            <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-2">Neural Net Processing</div>
            <div className="flex justify-between items-end">
              <div className="flex gap-1 h-8 items-end">
                <div className="w-1.5 bg-mission-cyan h-[40%] animate-[pulse_1s_ease-in-out_infinite]"></div>
                <div className="w-1.5 bg-mission-cyan h-[70%] animate-[pulse_1.2s_ease-in-out_infinite]"></div>
                <div className="w-1.5 bg-mission-cyan h-[90%] animate-[pulse_0.8s_ease-in-out_infinite]"></div>
                <div className="w-1.5 bg-mission-cyan h-[50%] animate-[pulse_1.5s_ease-in-out_infinite]"></div>
                <div className="w-1.5 bg-mission-cyan h-[80%] animate-[pulse_1.1s_ease-in-out_infinite]"></div>
              </div>
              <div className="text-[10px] font-mono text-mission-cyan font-bold tracking-widest uppercase">ACTIVE</div>
            </div>
          </div>
          
          <div className="border border-gray-800 bg-gray-900/50 p-4 rounded-sm flex-grow">
            <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-2">Mission Log</div>
            <ul className="text-[10px] font-mono text-gray-500 space-y-2 opacity-80">
              <li>&gt; Target: {activeSample.name}</li>
              <li>&gt; Initiating scan sequence...</li>
              <li>&gt; Calibrating optics...</li>
              <li className="text-mission-orange font-bold">&gt; Enhancing resolution (4x)...</li>
              <li>&gt; Noise reduction applied.</li>
              <li className="text-mission-cyan">&gt; Validation complete.</li>
            </ul>
          </div>
        </div>
        
        {/* Comparison Slider Main Area */}
        <div className="lg:col-span-3">
          {children}
        </div>
      </div>
    </section>
  );
}
