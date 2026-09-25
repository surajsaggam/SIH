import React, { useState } from 'react';
import {
  Layers,
  Leaf,
  Droplets,
  Building2,
  Activity,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import ClassBarChart from './ClassBarChart';
import DeepAnalysisPage from './DeepAnalysisPage';

/**
 * LandCoverAnalysis — the Overview (subpage 1) of the analysis experience.
 * Shows the primary classification, top-3 class bar chart, heuristic stat cards,
 * and a CTA to transition into the Deep Analysis view.
 *
 * When `showDeep` is true, renders DeepAnalysisPage instead.
 */
export default function LandCoverAnalysis({ analysis, isAnalyzing }) {
  const [showDeep, setShowDeep] = useState(false);

  // Reset subpage to Overview whenever the active scene/analysis changes
  React.useEffect(() => {
    setShowDeep(false);
  }, [analysis]);

  /* ── Loading state ── */
  if (isAnalyzing && !analysis) {
    return (
      <section className="border border-mission-cyan/20 bg-black/40 rounded-sm p-6 relative overflow-hidden mb-8 animate-pulse">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-mission-cyan animate-spin" />
            <span className="text-[10px] font-mono font-bold text-mission-cyan uppercase tracking-widest">
              STEP 06 // LAND COVER INFERENCE
            </span>
          </div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            CLASSIFYING HR SURFACE...
          </span>
        </div>
        <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-6 h-6 border-2 border-mission-cyan border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-gray-400">
            Running EuroSAT ConvNeXt classification on 4× Super-Resolved image...
          </span>
        </div>
      </section>
    );
  }

  /* ── Awaiting / Empty state ── */
  if (!analysis) {
    return (
      <section className="border border-gray-800 bg-black/40 rounded-sm p-6 relative overflow-hidden mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-800 pb-3 mb-4 gap-2">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-gray-500" />
            <h2 className="text-sm font-mono font-bold text-gray-400 uppercase tracking-widest">
              STEP 06 // LAND COVER INFERENCE
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
            <span>AWAITING INPUT SELECTION</span>
          </div>
        </div>
        <div className="py-8 flex flex-col items-center justify-center gap-3 text-center border border-dashed border-gray-800/80 rounded-sm bg-gray-950/30 px-4">
          <div className="w-10 h-10 rounded-sm bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-500">
            <Activity size={18} className="text-gray-500" />
          </div>
          <div className="max-w-md">
            <div className="text-xs font-mono text-gray-300 font-semibold uppercase tracking-wider mb-1">
              NO ACTIVE LAND COVER ANALYSIS
            </div>
            <p className="text-xs font-mono text-gray-500 leading-relaxed">
              Select a preset Sentinel-2 scene from the dataset list or upload a satellite image to trigger ConvNeXt-Tiny EuroSAT classification, surface heuristics, and domain knowledge base inference.
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
    <section className="border border-gray-800 bg-black/40 rounded-sm p-6 relative overflow-hidden mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-800 pb-3 mb-6 gap-2">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-mission-cyan" />
          <h2 className="text-sm font-mono font-bold text-mission-cyan uppercase tracking-widest">
            LAND COVER ANALYSIS // SENTINEL-2 EUROSAT
          </h2>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-mission-cyan">
            <span className="w-1.5 h-1.5 rounded-full bg-mission-cyan animate-pulse"></span>
            <span>MODEL: ConvNeXt-Tiny (EuroSAT)</span>
          </div>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400">10-CLASS SENTINEL TAXONOMY</span>
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Prediction + Heuristic Coverage Cards */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Primary Prediction Card */}
          <div className="border border-gray-800 bg-gray-900/50 p-4 rounded-sm flex flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1">
                  PREDICTED LAND COVER CLASS
                </span>
                <h3 className="text-2xl font-bold font-sans tracking-wide text-gray-100 uppercase">
                  {suggestions.display_name || analysis.label}
                </h3>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                  CONFIDENCE
                </span>
                <span className="px-2.5 py-1 text-sm font-mono font-bold text-mission-cyan bg-mission-cyan/10 border border-mission-cyan/30 rounded-xs">
                  {analysis.confidence}%
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-800/80 flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-mission-cyan" />
                <span>Super-Resolution Validated Classification</span>
              </span>
              <span className="text-gray-500">224 × 224 Sentinel-2 Input</span>
            </div>
          </div>

          {/* Heuristics Cards: Vegetation / Water / Urban */}
          <div className="grid grid-cols-3 gap-3 font-mono">
            {/* Vegetation */}
            <div className="border border-gray-800 bg-gray-900/40 p-3 rounded-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider">VEGETATION</span>
                <Leaf size={12} className="text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-emerald-400">
                {analysis.vegetation_pct ?? 0}<span className="text-xs text-gray-500 font-normal">%</span>
              </div>
              <div className="w-full bg-gray-950 h-1.5 rounded-full overflow-hidden mt-2 border border-gray-800">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, analysis.vegetation_pct ?? 0))}%` }}
                ></div>
              </div>
            </div>

            {/* Water */}
            <div className="border border-gray-800 bg-gray-900/40 p-3 rounded-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider">WATER</span>
                <Droplets size={12} className="text-mission-cyan" />
              </div>
              <div className="text-xl font-bold text-mission-cyan">
                {analysis.water_pct ?? 0}<span className="text-xs text-gray-500 font-normal">%</span>
              </div>
              <div className="w-full bg-gray-950 h-1.5 rounded-full overflow-hidden mt-2 border border-gray-800">
                <div
                  className="bg-mission-cyan h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, analysis.water_pct ?? 0))}%` }}
                ></div>
              </div>
            </div>

            {/* Urban */}
            <div className="border border-gray-800 bg-gray-900/40 p-3 rounded-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider">URBAN</span>
                <Building2 size={12} className="text-mission-orange" />
              </div>
              <div className="text-xl font-bold text-mission-orange">
                {analysis.urban_pct ?? 0}<span className="text-xs text-gray-500 font-normal">%</span>
              </div>
              <div className="w-full bg-gray-950 h-1.5 rounded-full overflow-hidden mt-2 border border-gray-800">
                <div
                  className="bg-mission-orange h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, analysis.urban_pct ?? 0))}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Top-3 Class Probabilities (recharts) */}
        <div className="lg:col-span-6 flex flex-col justify-between border border-gray-800 bg-gray-900/50 p-4 rounded-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Activity size={12} className="text-mission-cyan" /> TOP CLASS PROBABILITIES
              </span>
              <span className="text-[9px] font-mono text-gray-500">EUROSAT RANKING</span>
            </div>

            {/* Recharts top-3 bar chart */}
            <ClassBarChart classProbs={analysis.class_probs} topN={3} />
          </div>

          {/* Action Button: View Full Analysis */}
          <div className="mt-4 pt-3 border-t border-gray-800 flex justify-end">
            <button
              onClick={() => setShowDeep(true)}
              className="flex items-center gap-2 px-4 py-2 text-[10px] font-mono font-bold tracking-widest uppercase transition-all bg-mission-cyan/15 text-mission-cyan border border-mission-cyan/40 hover:bg-mission-cyan hover:text-black rounded-xs cursor-pointer group"
            >
              <span>VIEW FULL ANALYSIS</span>
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
