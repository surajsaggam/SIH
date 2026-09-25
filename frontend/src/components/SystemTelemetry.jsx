import React from 'react';
import { Terminal, Cpu, Radio, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function SystemTelemetry({ activeSample, isUploading, isAnalyzing }) {
  if (!activeSample) return null;

  const formatVal = (val, decimals) => {
    if (val === undefined || val === null || val === "" || val === "NaN" || isNaN(parseFloat(val))) return "N/A";
    return parseFloat(val).toFixed(decimals);
  };

  const sampleTitle = activeSample.name || activeSample.sample_id || 'Sentinel-2';

  return (
    <div className="flex flex-col gap-4">
      {/* Telemetry Header */}
      <div className="cosmic-panel p-4 rounded-xl border border-cyan-500/20 bg-[#080D18]/90">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 text-cyan-400">
            <Radio size={14} className="animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase">
              LIVE TELEMETRY
            </span>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-semibold">
            FEED ACTIVE
          </span>
        </div>

        {/* Core Specs Grid */}
        <div className="grid grid-cols-2 gap-3 pt-3 text-[11px] font-mono">
          <div>
            <span className="text-[9px] text-gray-500 uppercase block">MODEL</span>
            <span className="text-gray-200 font-semibold">SwinIR x4</span>
          </div>
          <div>
            <span className="text-[9px] text-gray-500 uppercase block">SCALE</span>
            <span className="text-cyan-400 font-bold">4× Spatial</span>
          </div>
          <div>
            <span className="text-[9px] text-gray-500 uppercase block">INPUT RES</span>
            <span className="text-gray-300">10 m / px</span>
          </div>
          <div>
            <span className="text-[9px] text-gray-500 uppercase block">OUTPUT RES</span>
            <span className="text-orange-400 font-semibold">&lt; 4 m / px</span>
          </div>
        </div>
      </div>

      {/* Sensor Array & Neural Net */}
      <div className="cosmic-panel p-4 rounded-xl border border-white/[0.08] bg-[#080D18]/80 flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-1.5">
            <span className="uppercase tracking-wider">SENSOR ARRAY ALPHA</span>
            <span className="text-cyan-400 font-bold">94% OPTIMAL</span>
          </div>
          <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/10">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full w-[94%]" />
          </div>
        </div>

        <div className="pt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Cpu size={12} className="text-cyan-400" />
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">NEURAL NET INFERENCE</span>
            </div>
            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${isUploading || isAnalyzing ? 'text-orange-400 animate-pulse' : 'text-cyan-400'}`}>
              {isUploading ? 'UPSCALING...' : isAnalyzing ? 'CLASSIFYING...' : 'ONLINE'}
            </span>
          </div>

          {/* Equalizer Bars */}
          <div className="flex items-end gap-1.5 h-6 bg-black/40 p-1.5 rounded-md border border-white/[0.06]">
            {[40, 75, 100, 60, 85, 50, 90, 70].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-xs transition-all duration-300"
                style={{
                  height: `${isUploading || isAnalyzing ? Math.min(100, (h + (i % 3) * 15)) : h}%`,
                  opacity: isUploading || isAnalyzing ? 1 : 0.75
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mission Log */}
      <div className="cosmic-panel p-4 rounded-xl border border-white/[0.08] bg-[#080D18]/80 flex flex-col flex-1">
        <div className="flex items-center gap-2 pb-2 mb-2 border-b border-white/[0.06]">
          <Terminal size={12} className="text-gray-400" />
          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
            MISSION LOG STREAM
          </span>
        </div>

        <ul className="text-[10px] font-mono space-y-1.5 text-gray-400">
          <li className="flex items-start gap-1.5">
            <span className="text-cyan-500">&gt;</span>
            <span className="text-gray-300 truncate">Target: {sampleTitle}</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-cyan-500">&gt;</span>
            <span>Sentinel-2 L2A composite loaded</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-cyan-500">&gt;</span>
            <span>Optics &amp; geometric calibration ready</span>
          </li>
          <li className="flex items-start gap-1.5 text-cyan-400 font-semibold">
            <span className="text-cyan-400">&gt;</span>
            <span>SwinIR 4× super-resolution active</span>
          </li>
          <li className="flex items-start gap-1.5 text-emerald-400">
            <CheckCircle2 size={11} className="mt-0.5 text-emerald-400 flex-shrink-0" />
            <span>Telemetry validated &amp; synchronized</span>
          </li>
        </ul>
      </div>

    </div>
  );
}
