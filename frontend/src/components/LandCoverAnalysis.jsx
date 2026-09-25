import React, { useState } from 'react';
import {
  Layers,
  Leaf,
  Droplets,
  Building2,
  Activity,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import ClassBarChart from './ClassBarChart';
import DeepAnalysisPage from './DeepAnalysisPage';

export default function LandCoverAnalysis({ analysis, isAnalyzing }) {
  const [showDeep, setShowDeep] = useState(false);

  React.useEffect(() => {
    setShowDeep(false);
  }, [analysis]);

  /* ── Loading state ── */
  if (isAnalyzing && !analysis) {
    return (
      <section className="cosmic-panel rounded-xl p-6 relative overflow-hidden mb-8 border border-cyan-500/30 bg-[#080D18]/90">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-cyan-400 animate-spin" />
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
              STEP 05 // LAND COVER INFERENCE
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
            CLASSIFYING HR SURFACE...
          </span>
        </div>
        <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-gray-300">
            Running EuroSAT ConvNeXt classification on 4× Super-Resolved image...
          </span>
        </div>
      </section>
    );
  }

  /* ── Awaiting / Empty state ── */
  if (!analysis) {
    return (
      <section className="cosmic-panel rounded-xl p-6 relative overflow-hidden mb-8 border border-white/[0.08] bg-[#080D18]/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.06] pb-3 mb-4 gap-2">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-gray-500" />
            <h2 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">
              LAND COVER INFERENCE // EUROSAT TAXONOMY
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
            <span>AWAITING INPUT SELECTION</span>
          </div>
        </div>
        <div className="py-8 flex flex-col items-center justify-center gap-3 text-center border border-dashed border-white/10 rounded-lg bg-black/40 px-4">
          <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-gray-400">
            <Activity size={18} className="text-gray-400" />
          </div>
          <div className="max-w-md">
            <div className="text-xs font-mono text-gray-300 font-semibold uppercase tracking-wider mb-1">
              NO ACTIVE LAND COVER ANALYSIS
            </div>
            <p className="text-xs font-mono text-gray-500 leading-relaxed">
              Select a preset Sentinel-2 scene from the scene selector or upload a satellite image to trigger ConvNeXt-Tiny EuroSAT classification, surface heuristics, and domain knowledge base inference.
            </p>
          </div>
        </div>
      </section>
    );
  }

  /* ── Deep Analysis subpage ── */
  if (showDeep) {
    return (
      <DeepAnalysisPage
        analysis={analysis}
        onBack={() => setShowDeep(false)}
      />
    );
  }

  /* ── Overview subpage ── */
  const suggestions = analysis.suggestions || {};

  return (
    <section className="cosmic-panel rounded-xl p-6 relative overflow-hidden mb-8 border border-white/[0.08] bg-[#080D18]/80">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.06] pb-3 mb-6 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center">
            <Layers size={13} className="text-cyan-400" />
          </div>
          <h2 className="text-xs font-mono font-bold text-gray-200 uppercase tracking-widest">
            LAND COVER ANALYSIS // SENTINEL-2 EUROSAT
          </h2>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>MODEL: ConvNeXt-Tiny (EuroSAT)</span>
          </div>
          <span className="text-gray-700">|</span>
          <span className="text-gray-400">10-CLASS TAXONOMY</span>
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Prediction + Heuristic Coverage Cards */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Primary Prediction Card */}
          <div className="border border-white/[0.08] bg-black/40 p-4 rounded-lg flex flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1">
                  PREDICTED LAND COVER CLASS
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold font-sans tracking-wide text-white uppercase">
                  {suggestions.display_name || analysis.label}
                </h3>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                  CONFIDENCE
                </span>
                <span className="px-3 py-1 text-sm font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 rounded-md">
                  {analysis.confidence}%
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <CheckCircle2 size={12} className="text-cyan-400" />
                <span>Super-Resolution Validated Classification</span>
              </span>
              <span className="text-gray-500">224 × 224 Sentinel-2 Input</span>
            </div>
          </div>

          {/* Heuristics Cards: Vegetation / Water / Urban */}
          <div className="grid grid-cols-3 gap-3 font-mono">
            {/* Vegetation */}
            <div className="border border-white/[0.08] bg-black/40 p-3 rounded-lg flex flex-col justify-between">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider">VEGETATION</span>
                <Leaf size={12} className="text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-emerald-400">
                {analysis.vegetation_pct ?? 0}<span className="text-xs text-gray-500 font-normal">%</span>
              </div>
              <div className="w-full bg-black/80 h-1.5 rounded-full overflow-hidden mt-2 border border-white/10">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, analysis.vegetation_pct ?? 0))}%` }}
                />
              </div>
            </div>

            {/* Water */}
            <div className="border border-white/[0.08] bg-black/40 p-3 rounded-lg flex flex-col justify-between">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider">WATER</span>
                <Droplets size={12} className="text-cyan-400" />
              </div>
              <div className="text-xl font-bold text-cyan-400">
                {analysis.water_pct ?? 0}<span className="text-xs text-gray-500 font-normal">%</span>
              </div>
              <div className="w-full bg-black/80 h-1.5 rounded-full overflow-hidden mt-2 border border-white/10">
                <div
                  className="bg-cyan-400 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, analysis.water_pct ?? 0))}%` }}
                />
              </div>
            </div>

            {/* Urban */}
            <div className="border border-white/[0.08] bg-black/40 p-3 rounded-lg flex flex-col justify-between">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider">URBAN</span>
                <Building2 size={12} className="text-orange-400" />
              </div>
              <div className="text-xl font-bold text-orange-400">
                {analysis.urban_pct ?? 0}<span className="text-xs text-gray-500 font-normal">%</span>
              </div>
              <div className="w-full bg-black/80 h-1.5 rounded-full overflow-hidden mt-2 border border-white/10">
                <div
                  className="bg-orange-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, analysis.urban_pct ?? 0))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Top-3 Class Probabilities (recharts) */}
        <div className="lg:col-span-6 flex flex-col justify-between border border-white/[0.08] bg-black/40 p-4 rounded-lg">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-bold text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                <Activity size={12} className="text-cyan-400" />
                <span>TOP CLASS PROBABILITIES</span>
              </span>
              <span className="text-[9px] font-mono text-gray-500">EUROSAT RANKING</span>
            </div>

            {/* Recharts top-3 bar chart */}
            <ClassBarChart classProbs={analysis.class_probs} topN={3} />
          </div>

          {/* Action Button: View Full Analysis */}
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-500">Full 10-Class distribution &amp; agronomy knowledge base</span>
            <button
              onClick={() => setShowDeep(true)}
              className="glow-pill px-4 py-2 text-[10px] font-mono font-bold tracking-widest uppercase transition-all text-cyan-300 hover:text-white rounded-lg cursor-pointer flex items-center gap-2 group"
            >
              <span>VIEW FULL ANALYSIS</span>
              <ChevronRight size={13} className="text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
