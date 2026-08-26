import React, { useRef, useEffect, useState } from 'react';
import Globe from 'react-globe.gl';
import { Rocket, Satellite } from 'lucide-react';

export default function GlobeHero() {
  const globeEl = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, []);

  // Setup globe controls on ready
  useEffect(() => {
    if (globeEl.current) {
      const controls = globeEl.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.enableZoom = false; // keep it looking like a presentation hero
      globeEl.current.pointOfView({ altitude: 2.0 });
    }
  }, []);
  return (
    <section className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-center min-h-[600px] mb-12">
      <div className="flex flex-col gap-6 relative z-10">
        <div className="inline-flex items-center gap-2 border border-mission-cyan/30 bg-mission-cyan/10 px-3 py-1 rounded-sm w-fit">
          <span className="w-2 h-2 rounded-full bg-mission-cyan animate-pulse"></span>
          <span className="text-[10px] font-mono text-mission-cyan uppercase tracking-widest font-bold">System Online</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-100 uppercase">
          PIXEL PERFECT <span className="text-white">INTELLIGENCE</span>
        </h1>
        
        <p className="text-gray-400 max-w-xl text-sm leading-relaxed">
          AI-Powered Satellite Imagery Enhancement. Enhance resolution, detect patterns, and monitor change with 10cm precision.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <button className="bg-mission-cyan/20 text-mission-cyan font-mono font-bold text-xs tracking-widest px-6 py-3 rounded-sm border border-mission-cyan/50 hover:bg-mission-cyan/30 transition-colors flex items-center justify-center gap-2 uppercase">
            <Rocket size={16} />
            Launch Analysis
          </button>
          <button className="bg-transparent text-mission-cyan font-mono font-bold text-xs tracking-widest px-6 py-3 rounded-sm border border-mission-cyan hover:bg-mission-cyan/10 transition-colors flex items-center justify-center gap-2 uppercase">
            <Satellite size={16} />
            View Satellite Fleet
          </button>
        </div>
        
        <div className="mt-8 flex gap-8 border-t border-gray-800 pt-6">
          <div>
            <div className="font-mono text-2xl font-bold text-gray-200">10cm</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Max Resolution</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-bold text-gray-200">99.9%</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Uptime</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-bold text-gray-200">&lt;12ms</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Latency</div>
          </div>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="relative h-[500px] md:h-[600px] w-full overflow-hidden"
      >
        {/* Subtle space particles / grid effect */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-20" 
             style={{ backgroundImage: 'radial-gradient(rgba(0, 217, 255, 0.4) 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center z-10 cursor-move">
          <Globe
            ref={globeEl}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            showAtmosphere={true}
            atmosphereColor="rgba(0, 217, 255, 0.4)"
            atmosphereAltitude={0.1}
          />
        </div>
      </div>
    </section>
  );
}
