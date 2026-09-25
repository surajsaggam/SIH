import React, { useState } from 'react';
import {
  Layers,
  Leaf,
  Droplets,
  Building2,
  Activity,
  CheckCircle2,
  ShieldAlert,
  ChevronLeft,
  Sprout,
  TreePine,
  Tractor,
  Feather,
  Trees,
  Waves,
  Route,
  Factory,
  Building,
  BookOpen,
  BarChart3,
  Zap,
  Info,
} from 'lucide-react';
import ClassBarChart from './ClassBarChart';
import ChatBot from './ChatBot';

/* Map KB icon strings → lucide components */
const iconMap = {
  Sprout, TreePine, Tractor, Feather, Trees, Waves,
  Route, Factory, Building, Layers,
  Droplets, Leaf, ShieldAlert, Activity,
};

export default function DeepAnalysisPage({ analysis, onBack }) {
  const [activeTab, setActiveTab] = useState('crop');

  if (!analysis) return null;

  const suggestions = analysis.suggestions || {};
  const cropTips = suggestions.crop_analysis || [];
  const disasterTips = suggestions.disaster_management || [];
  const displayName = suggestions.display_name || analysis.label;
  const IconComponent = iconMap[suggestions.icon] || Layers;

  const coverageData = [
    { label: 'VEGETATION', value: analysis.vegetation_pct ?? 0, color: '#10b981', icon: Leaf },
    { label: 'WATER', value: analysis.water_pct ?? 0, color: '#00D9FF', icon: Droplets },
    { label: 'URBAN', value: analysis.urban_pct ?? 0, color: '#FF6B35', icon: Building2 },
  ];

  return (
    <section className="cosmic-panel rounded-xl border border-white/[0.08] bg-[#080D18]/90 relative overflow-hidden mb-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.06] px-6 py-4 gap-3 bg-gradient-to-r from-cyan-950/30 to-transparent">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 text-[10px] font-mono font-bold tracking-widest text-gray-300 hover:text-cyan-300 transition-colors uppercase cursor-pointer"
          >
            <ChevronLeft size={14} />
            <span>RETURN TO OVERVIEW</span>
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-cyan-400" />
            <h2 className="text-xs font-mono font-bold text-gray-200 uppercase tracking-widest">
              DEEP ANALYSIS // FULL TAXONOMY
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>ConvNeXt-Tiny (EuroSAT)</span>
          </div>
          <span className="text-gray-700">|</span>
          <span className="text-gray-400">10-CLASS DISTRIBUTION</span>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6">

        {/* ── Row 1: Prediction Card + Coverage Breakdown ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Prediction badge */}
          <div className="lg:col-span-4 border border-white/[0.08] bg-black/40 p-5 rounded-xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center border border-cyan-500/30 bg-cyan-950/40 rounded-lg">
                <IconComponent size={20} className="text-cyan-400" />
              </div>
              <div>
                <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">CLASSIFICATION</div>
                <h3 className="text-xl font-bold text-white tracking-wide uppercase font-sans">
                  {displayName}
                </h3>
              </div>
            </div>

            <div className="flex items-center justify-between bg-black/60 border border-white/[0.06] px-3.5 py-2.5 rounded-lg">
              <span className="text-[10px] font-mono text-gray-500 uppercase">MODEL CONFIDENCE</span>
              <span className="text-lg font-mono font-bold text-cyan-400">{analysis.confidence}%</span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400">
              <CheckCircle2 size={12} className="text-cyan-400" />
              <span>SwinIR Super-Resolution Validated</span>
            </div>

            {/* Heuristic coverage mini-cards */}
            <div className="flex flex-col gap-2.5 pt-3 border-t border-white/[0.06]">
              <div className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">
                SURFACE COVERAGE HEURISTICS
              </div>
              {coverageData.map((c) => {
                const CIcon = c.icon;
                return (
                  <div key={c.label} className="flex items-center gap-3 group">
                    <CIcon size={12} style={{ color: c.color }} />
                    <span className="text-[10px] font-mono text-gray-400 w-20">{c.label}</span>
                    <div className="flex-1 h-1.5 bg-black/80 border border-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-700"
                        style={{ width: `${Math.min(100, Math.max(0, c.value))}%`, background: c.color }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold w-12 text-right" style={{ color: c.color }}>
                      {c.value}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full 10-class bar chart */}
          <div className="lg:col-span-8 border border-white/[0.08] bg-black/40 p-5 rounded-xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={14} className="text-cyan-400" />
                <h4 className="text-[10px] font-mono font-bold text-gray-300 uppercase tracking-widest">
                  COMPLETE 10-CLASS PROBABILITY DISTRIBUTION
                </h4>
              </div>
              <span className="text-[9px] font-mono text-gray-500 uppercase">EUROSAT SENTINEL-2</span>
            </div>
            <div className="flex-1 min-h-[340px]">
              <ClassBarChart classProbs={analysis.class_probs} topN={10} />
            </div>
          </div>
        </div>

        {/* ── Row 2: Tabbed KB Suggestions ── */}
        <div className="border border-white/[0.08] bg-black/40 rounded-xl overflow-hidden">
          {/* Tab header */}
          <div className="flex border-b border-white/[0.06] bg-black/60">
            <button
              onClick={() => setActiveTab('crop')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'crop'
                  ? 'text-cyan-400 bg-cyan-950/30 border-b-2 border-cyan-400'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
              }`}
            >
              <Leaf size={13} className={activeTab === 'crop' ? 'text-cyan-400' : 'text-gray-600'} />
              <span>CROP ANALYSIS &amp; AGRONOMY</span>
            </button>
            <button
              onClick={() => setActiveTab('disaster')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'disaster'
                  ? 'text-orange-400 bg-orange-950/30 border-b-2 border-orange-400'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
              }`}
            >
              <ShieldAlert size={13} className={activeTab === 'disaster' ? 'text-orange-400' : 'text-gray-600'} />
              <span>DISASTER MANAGEMENT &amp; HAZARD</span>
            </button>
          </div>

          {/* Tab content */}
          <div className="p-5">
            {activeTab === 'crop' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <Sprout size={16} className="text-emerald-400" />
                  <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wide">
                    Recommendations for {displayName}
                  </h4>
                </div>
                {cropTips.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cropTips.map((tip, i) => (
                      <div
                        key={i}
                        className="border border-white/[0.06] bg-black/40 p-3.5 rounded-lg flex items-start gap-3 hover:border-cyan-500/30 transition-colors group"
                      >
                        <div className="w-6 h-6 flex items-center justify-center rounded-md bg-cyan-950/40 border border-cyan-500/30 flex-shrink-0 mt-0.5 group-hover:bg-cyan-950/70 transition-colors">
                          <Zap size={12} className="text-cyan-400" />
                        </div>
                        <span className="text-xs text-gray-300 leading-relaxed font-sans">{tip}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 font-mono italic">No crop analysis data available for this land cover class.</div>
                )}
              </div>
            )}

            {activeTab === 'disaster' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert size={16} className="text-orange-400" />
                  <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wide">
                    Risk Assessment for {displayName}
                  </h4>
                </div>
                {disasterTips.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {disasterTips.map((tip, i) => (
                      <div
                        key={i}
                        className="border border-white/[0.06] bg-black/40 p-3.5 rounded-lg flex items-start gap-3 hover:border-orange-500/30 transition-colors group"
                      >
                        <div className="w-6 h-6 flex items-center justify-center rounded-md bg-orange-950/40 border border-orange-500/30 flex-shrink-0 mt-0.5 group-hover:bg-orange-950/70 transition-colors">
                          <ShieldAlert size={12} className="text-orange-400" />
                        </div>
                        <span className="text-xs text-gray-300 leading-relaxed font-sans">{tip}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 font-mono italic">No disaster management data available for this land cover class.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Row 3: KB Info Banner ── */}
        <div className="border border-white/[0.08] bg-black/40 p-4 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex-shrink-0">
              <Info size={14} className="text-cyan-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <BookOpen size={12} className="text-gray-500" />
                <h4 className="text-[10px] font-mono font-bold text-gray-300 uppercase tracking-widest">
                  KNOWLEDGE BASE — {displayName.toUpperCase()}
                </h4>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Generated via EuroSAT ConvNeXt-Tiny classifier on Sentinel-2 imagery. Domain recommendations are grounded in static agronomy &amp; disaster risk knowledge keyed to the <strong className="text-gray-200">{analysis.label}</strong> class. Coverage heuristics are computed via spectral proxies on super-resolved output.
              </p>
              <div className="flex gap-4 mt-3 text-[10px] font-mono text-gray-500">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 size={10} className="text-emerald-400" />
                  {cropTips.length} crop recommendations
                </span>
                <span className="flex items-center gap-1.5 text-orange-400">
                  <CheckCircle2 size={10} className="text-orange-400" />
                  {disasterTips.length} disaster assessments
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <CheckCircle2 size={10} className="text-cyan-400" />
                  10-class taxonomy
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 4: AI Analysis Chat Agent ── */}
        <ChatBot analysis={analysis} />
      </div>
    </section>
  );
}
