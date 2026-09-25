import React, { useRef, useEffect, useState } from 'react';
import Globe from 'react-globe.gl';
import { Rocket, Satellite, ChevronRight, Sparkles, Activity, Layers, Bot } from 'lucide-react';

export default function GlobeHero({ onLaunchAnalysis, onViewFleet, onSelectScene, onOpenChat }) {
  const globeEl = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 520, height: 520 });

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setDimensions({
          width: Math.min(entry.contentRect.width, 580),
          height: Math.min(entry.contentRect.height, 580)
        });
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Setup globe controls on ready
  useEffect(() => {
    if (globeEl.current) {
      try {
        const controls = globeEl.current.controls();
        if (controls) {
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.6;
          controls.enableZoom = false;
        }
        globeEl.current.pointOfView({ altitude: 2.1 });
      } catch (e) {
        console.error("Globe controls initialization:", e);
      }
    }
  }, []);

  return (
    <section className="relative min-h-[580px] xl:min-h-[640px] mb-12 rounded-xl overflow-hidden border border-white/[0.07] bg-gradient-to-b from-[#090E1A]/80 via-[#060A13]/90 to-[#04070D] p-6 lg:p-10 flex flex-col justify-between shadow-2xl backdrop-blur-md">
      
      {/* Subtle Starfield & Ambient Glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0, 217, 255, 0.12) 0%, transparent 70%), radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 40px 40px'
        }}
      />
      
      {/* Top Meta Tag & Mission Status */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold">SYSTEM ONLINE // SWINIR ×4</span>
          </div>
          <span className="hidden sm:inline text-xs font-mono text-gray-500">SENTINEL-2 EARTH OBSERVATION PIPELINE</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-gray-300">GPU ACCELERATED</span>
          </span>
          <span className="text-gray-700">|</span>
          <span className="text-cyan-400 font-semibold">SIH 2026</span>
        </div>
      </div>

      {/* Main Hero Body */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
        
        {/* Left: Headline & Actions */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="space-y-3">
            <div className="text-xs font-mono tracking-widest text-cyan-400 uppercase flex items-center gap-2">
              <Sparkles size={13} className="text-cyan-400" />
              <span>SUPER RESOLUTION MAPPING SUITE</span>
            </div>
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-white uppercase leading-[1.08] font-sans">
              PIXEL-PERFECT <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
                INTELLIGENCE
              </span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base max-w-lg leading-relaxed pt-1">
              AI-powered satellite imagery enhancement for high-resolution land analysis. 
              Elevating 10m Sentinel-2 multispectral tiles to &lt;4m clarity using SwinIR transformers with grounded RAG insights.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onLaunchAnalysis}
              className="px-6 py-3.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-bold text-xs tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(0,217,255,0.3)] hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Rocket size={15} className="text-black" />
              <span>LAUNCH ANALYSIS</span>
            </button>

            <button
              onClick={onViewFleet}
              className="px-5 py-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/40 text-gray-300 hover:text-cyan-300 font-mono font-bold text-xs tracking-widest uppercase transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Satellite size={15} className="text-cyan-400" />
              <span>VIEW SATELLITE DATA</span>
            </button>
          </div>

          {/* Key Specs Strip */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.06] max-w-md">
            <div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-400">4×</div>
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mt-0.5">Scale Factor</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white">&lt;4 m</div>
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mt-0.5">Target Res</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-sky-400">10-Class</div>
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mt-0.5">EuroSAT AI</div>
            </div>
          </div>
        </div>

        {/* Center / Right: 3D Interactive Rotating Earth Globe & Pill Navigation */}
        <div className="lg:col-span-6 relative flex flex-col md:flex-row items-center justify-center gap-6">
          
          {/* Globe Canvas with Celestial Halo Ring */}
          <div 
            ref={containerRef}
            className="relative w-full max-w-[340px] sm:max-w-[400px] h-[340px] sm:h-[400px] flex items-center justify-center"
          >
            {/* Ambient Cyan/Purple Celestial Halo Ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-600/10 to-purple-600/20 blur-2xl pointer-events-none transform scale-90 animate-pulse" />
            <div className="absolute w-[85%] h-[85%] rounded-full border border-cyan-500/20 pointer-events-none" />
            <div className="absolute w-[95%] h-[95%] rounded-full border border-purple-500/15 pointer-events-none" />

            <div className="relative z-10 w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing">
              <Globe
                ref={globeEl}
                width={dimensions.width}
                height={dimensions.height}
                backgroundColor="rgba(0,0,0,0)"
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                showAtmosphere={true}
                atmosphereColor="rgba(0, 217, 255, 0.45)"
                atmosphereAltitude={0.14}
              />
            </div>
          </div>

          {/* Quick Pill Controls (inspired by reference style) */}
          <div className="w-full md:w-[230px] flex flex-col gap-2 relative z-20">
            <div className="flex items-center gap-2 pb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 font-bold">
                MISSION MODULES
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              onClick={() => onSelectScene && onSelectScene('sample_1')}
              className="glow-pill px-3 py-2.5 rounded-lg flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Layers size={13} className="text-cyan-400" />
                <span className="text-[11px] font-mono text-gray-300 group-hover:text-white transition-colors">
                  CROP MONITORING
                </span>
              </div>
              <ChevronRight size={13} className="text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => onSelectScene && onSelectScene('sample_2')}
              className="glow-pill px-3 py-2.5 rounded-lg flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Activity size={13} className="text-cyan-400" />
                <span className="text-[11px] font-mono text-gray-300 group-hover:text-white transition-colors">
                  URBAN ANALYSIS
                </span>
              </div>
              <ChevronRight size={13} className="text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => onSelectScene && onSelectScene('sample_3')}
              className="glow-pill px-3 py-2.5 rounded-lg flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Satellite size={13} className="text-orange-400" />
                <span className="text-[11px] font-mono text-gray-300 group-hover:text-white transition-colors">
                  DISASTER RESPONSE
                </span>
              </div>
              <ChevronRight size={13} className="text-gray-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={onLaunchAnalysis}
              className="glow-pill px-3 py-2.5 rounded-lg flex items-center justify-between text-left group cursor-pointer border-cyan-500/40 bg-cyan-950/20"
            >
              <div className="flex items-center gap-2">
                <Rocket size={13} className="text-cyan-400" />
                <span className="text-[11px] font-mono text-cyan-300 group-hover:text-white transition-colors font-bold">
                  LIVE SWINIR UPLOAD
                </span>
              </div>
              <ChevronRight size={13} className="text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="glow-pill px-3 py-2.5 rounded-lg flex items-center justify-between text-left group cursor-pointer border-purple-500/30 bg-purple-950/20"
              >
                <div className="flex items-center gap-2">
                  <Bot size={13} className="text-purple-400" />
                  <span className="text-[11px] font-mono text-purple-300 group-hover:text-white transition-colors">
                    AI ANALYSIS AGENT
                  </span>
                </div>
                <ChevronRight size={13} className="text-purple-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            )}
          </div>
        </div>

      </div>

    </section>
  );
}
