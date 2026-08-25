import React, { useState, useEffect, useRef } from 'react';
import { Activity, Upload, Radio, ChevronRight, CheckCircle2, AlertCircle, Maximize, BarChart3, Database } from 'lucide-react';

export default function App() {
  const [samples, setSamples] = useState([]);
  const [activeSampleId, setActiveSampleId] = useState(null);
  const [viewMode, setViewMode] = useState('input_ai'); // input_ai, ai_ref, threeway
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  useEffect(() => {
    fetch('/results.csv')
      .then(res => res.text())
      .then(text => {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',');
        const data = lines.slice(1).map(line => {
          const values = line.split(',');
          return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
          }, {});
        });
        setSamples(data);
        if (data.length > 0) {
          setActiveSampleId(data[0].sample_id);
        }
      })
      .catch(err => console.error("Error loading CSV:", err));
  }, []);

  const activeSample = samples.find(s => s.sample_id === activeSampleId);

  const handleMouseMove = (e) => {
    if (!isDragging || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const formatVal = (val, decimals) => {
    if (val === undefined || val === null || val === "" || val === "NaN" || isNaN(parseFloat(val))) return "N/A";
    return parseFloat(val).toFixed(decimals);
  };

  const calcImpr = (ai, bc, decimals) => {
    if (ai === undefined || ai === "NaN" || bc === undefined || bc === "NaN" || isNaN(parseFloat(ai)) || isNaN(parseFloat(bc))) return "N/A";
    const diff = parseFloat(ai) - parseFloat(bc);
    return (diff >= 0 ? "+" : "") + diff.toFixed(decimals);
  };

  const scenes = [
    { id: 'sample_1', title: 'CROP MONITORING', subtitle: 'Agricultural field boundaries / vegetation' },
    { id: 'sample_2', title: 'URBAN ANALYSIS', subtitle: 'Buildings / roads / dense settlement' },
    { id: 'sample_3', title: 'DISASTER ASSESSMENT', subtitle: 'Flooding / damaged infrastructure' },
  ];

  const maxChartPsnr = 45;
  const maxChartSsim = 1.0;

  return (
    <div className="min-h-screen bg-[#0A0E14] flex flex-col font-sans text-gray-300 relative overflow-x-hidden">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20" 
           style={{ backgroundImage: 'linear-gradient(rgba(0, 217, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-mission-cyan/5 via-transparent to-transparent opacity-50"></div>

      {/* HEADER */}
      <header className="border-b border-mission-cyan/20 bg-[#0A0E14]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold tracking-widest text-gray-100 uppercase font-sans">
                  SRM-26142 <span className="text-mission-cyan opacity-70 mx-1">//</span> SUPER RESOLUTION MAPPING
                </h1>
              </div>
              <div className="text-[10px] font-mono tracking-widest text-gray-400 mt-1 flex items-center gap-2">
                <span>SENTINEL-2</span> <ChevronRight size={10} className="text-mission-cyan" /> 
                <span className="text-mission-cyan">AI SUPER RESOLUTION</span> <ChevronRight size={10} className="text-mission-cyan" /> 
                <span>HIGH-RES VALIDATION</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8 text-xs font-mono">
            <div className="flex items-center gap-2 text-mission-cyan">
              <div className="w-1.5 h-1.5 bg-mission-cyan rounded-full"></div>
              <span>MODEL: Real-ESRGAN v0.3.0</span>
            </div>
            <div className="flex items-center gap-2 text-mission-orange">
              <div className="w-1.5 h-1.5 bg-mission-orange rounded-full animate-pulse"></div>
              <span>STATUS: ACTIVE</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Maximize size={12} />
              <span>SCALE: 4×</span>
            </div>
            <div className="h-6 w-px bg-gray-800"></div>
            <div className="flex flex-col items-end text-[10px] text-gray-500">
              <span>MISSION: SIH 2026</span>
              <span>MODE: DEMONSTRATION</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1920px] mx-auto w-full px-6 py-6 grid grid-cols-12 gap-8 z-10 relative">
        
        {/* LEFT SIDEBAR */}
        <div className="col-span-12 lg:col-span-3 xl:col-span-2 flex flex-col gap-6">
          <div className="border border-mission-cyan/10 bg-black/40 p-4 rounded-sm backdrop-blur-sm">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Database size={14} className="text-mission-cyan" /> DATASET / SCENE
            </h2>
            <div className="flex flex-col gap-3">
              {scenes.map((scene, i) => {
                const isActive = activeSampleId === scene.id;
                return (
                  <button
                    key={scene.id}
                    onClick={() => setActiveSampleId(scene.id)}
                    className={`text-left px-3 py-2 rounded-sm transition-all border-l-2 group ${
                      isActive
                        ? 'bg-mission-cyan/10 border-mission-cyan'
                        : 'hover:bg-gray-800/50 border-transparent hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono ${isActive ? 'text-mission-cyan' : 'text-gray-500'}`}>
                        0{i + 1}
                      </span>
                      <span className={`text-xs font-bold tracking-wide ${isActive ? 'text-gray-200' : 'text-gray-400'}`}>
                        {scene.title}
                      </span>
                    </div>
                    <div className={`text-[10px] mt-1 ml-6 ${isActive ? 'text-gray-400' : 'text-gray-500'}`}>
                      {scene.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border border-gray-800 bg-black/40 p-4 rounded-sm">
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">CURRENT SCENE</h2>
            <div className="flex flex-col gap-3 text-xs font-mono">
              <div>
                <div className="text-[10px] text-gray-600">Sample ID:</div>
                <div className="text-mission-cyan">SRM-{activeSampleId ? activeSampleId.split('_')[1].toUpperCase() : '001'}-001</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-600">SOURCE:</div>
                <div className="text-gray-300">Sentinel-2 L2A</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-600">INPUT RESOLUTION:</div>
                <div className="text-gray-300">10 m / pixel</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-600">TARGET:</div>
                <div className="text-mission-orange">&lt; 4 m / pixel</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-600">MODEL:</div>
                <div className="text-gray-300">Real-ESRGAN</div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="col-span-12 lg:col-span-9 xl:col-span-10 flex flex-col gap-6 animate-in fade-in duration-500">
          
          {/* HERO VIEWER */}
          {activeSample && (
            <div className="flex flex-col gap-4">
              {/* Viewer Controls */}
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
                    SATELLITE IMAGE COMPARISON
                  </h2>
                  <div className="text-xs font-mono text-gray-500 mt-1 flex gap-4">
                    <span>SCENE: {activeSample.name.toUpperCase()}</span>
                    <span>BAND COMPOSITE: RGB</span>
                  </div>
                </div>
                <div className="flex bg-black/60 border border-gray-800 rounded-sm p-1">
                  {[
                    { id: 'input_ai', label: 'INPUT ↔ AI SR' },
                    { id: 'ai_ref', label: 'AI SR ↔ REF' },
                    { id: 'threeway', label: '3-WAY VIEW' }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setViewMode(mode.id)}
                      className={`px-4 py-1.5 text-[10px] font-mono tracking-widest uppercase transition-colors ${
                        viewMode === mode.id
                          ? 'bg-mission-cyan/20 text-mission-cyan border border-mission-cyan/50'
                          : 'text-gray-500 hover:text-gray-300 border border-transparent'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Viewport */}
              <div className="border border-gray-800 bg-black/40 p-1 rounded-sm w-full">
                {viewMode === 'threeway' ? (
                  <div className="grid grid-cols-3 gap-1 h-[60vh] max-h-[700px] bg-black">
                    <div className="relative group overflow-hidden">
                      <div className="absolute top-2 left-2 z-10 bg-black/80 px-2 py-1 text-[10px] font-mono text-gray-300 border border-gray-700 backdrop-blur-sm">INPUT // 10m</div>
                      <img src={`/${activeSample.sample_id}_input.png`} alt="Input" className="w-full h-full object-contain" />
                    </div>
                    <div className="relative group overflow-hidden border-x border-gray-800">
                      <div className="absolute top-2 left-2 z-10 bg-mission-cyan/20 px-2 py-1 text-[10px] font-mono text-mission-cyan border border-mission-cyan/50 backdrop-blur-sm">AI SR // 4×</div>
                      <img src={`/${activeSample.sample_id}_output.png`} alt="AI Output" className="w-full h-full object-contain" />
                    </div>
                    <div className="relative group overflow-hidden">
                      <div className="absolute top-2 right-2 z-10 bg-black/80 px-2 py-1 text-[10px] font-mono text-gray-300 border border-gray-700 backdrop-blur-sm">REFERENCE // VENµS</div>
                      <img src={`/${activeSample.sample_id}_reference.png`} alt="Reference" className="w-full h-full object-contain" />
                    </div>
                  </div>
                ) : (
                  <div 
                    ref={sliderRef}
                    className="relative h-[60vh] max-h-[700px] w-full overflow-hidden cursor-ew-resize select-none bg-black"
                    onMouseDown={() => setIsDragging(true)}
                  >
                    {/* Right Image Base */}
                    <div className="absolute top-4 right-4 z-10 bg-black/80 px-2 py-1 text-[10px] font-mono border backdrop-blur-sm transition-colors border-mission-cyan/50 text-mission-cyan">
                      {viewMode === 'input_ai' ? 'AI SR // 4×' : 'REFERENCE // VENµS'}
                    </div>
                    <img 
                      src={viewMode === 'input_ai' ? `/${activeSample.sample_id}_output.png` : `/${activeSample.sample_id}_reference.png`}
                      alt="Right"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />
                    
                    {/* Left Image Clipped */}
                    <div className="absolute top-4 left-4 z-20 bg-black/80 px-2 py-1 text-[10px] font-mono text-gray-300 border border-gray-700 backdrop-blur-sm">
                      {viewMode === 'input_ai' ? 'INPUT // 10m' : 'AI SR // 4×'}
                    </div>
                    <div 
                      className="absolute inset-0 overflow-hidden pointer-events-none z-10"
                      style={{ width: `${sliderPosition}%` }}
                    >
                      <img 
                        src={viewMode === 'input_ai' ? `/${activeSample.sample_id}_input.png` : `/${activeSample.sample_id}_output.png`}
                        alt="Left"
                        className="absolute inset-0 max-w-none h-full object-contain" 
                        style={{ width: sliderRef.current?.offsetWidth || '100%' }}
                      />
                    </div>

                    {/* Slider Handle */}
                    <div 
                      className="absolute top-0 bottom-0 w-px bg-mission-cyan shadow-[0_0_8px_rgba(0,217,255,0.8)] z-30 flex items-center justify-center pointer-events-none"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="w-6 h-6 rounded-full bg-[#0A0E14] border border-mission-cyan flex items-center justify-center shadow-[0_0_10px_rgba(0,217,255,0.4)]">
                        <div className="w-3 h-px bg-mission-cyan rotate-90 absolute"></div>
                        <div className="w-3 h-px bg-mission-cyan absolute"></div>
                      </div>
                      <div className="absolute -top-6 bg-black/80 px-1.5 py-0.5 text-[8px] font-mono text-mission-cyan border border-mission-cyan/30 rounded-sm">
                        {Math.round(sliderPosition)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PIPELINE STRIP */}
          <div className="border border-gray-800 bg-black/40 rounded-sm px-4 py-3 flex items-center justify-between">
            {[
              { num: '01', title: 'INPUT', desc: 'Sentinel-2 / 10m', active: true },
              { num: '02', title: 'PREPROCESS', desc: 'Cloud Mask / Tiling', active: true },
              { num: '03', title: 'AI SUPER-RESOLUTION', desc: 'Real-ESRGAN / 4×', active: true },
              { num: '04', title: 'VALIDATION', desc: 'VENµS Reference', active: true },
              { num: '05', title: 'METRICS', desc: 'PSNR / SSIM', active: true },
            ].map((step, idx, arr) => (
              <React.Fragment key={step.num}>
                <div className={`flex flex-col items-center flex-1 ${step.active ? 'opacity-100' : 'opacity-40'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-mono text-gray-500">{step.num}</span>
                    <span className={`text-[10px] font-bold tracking-widest ${step.active ? 'text-mission-cyan' : 'text-gray-400'}`}>
                      {step.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">{step.desc}</span>
                </div>
                {idx < arr.length - 1 && (
                  <div className="text-gray-700 flex-shrink-0">
                    <ChevronRight size={16} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* TELEMETRY METRICS */}
            {activeSample && (
              <div className="xl:col-span-2 border border-gray-800 bg-black/40 p-5 rounded-sm">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Activity size={12} className="text-mission-orange" /> VALIDATION TELEMETRY
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-900/50 border border-gray-800 p-3 flex flex-col justify-center">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">AI PSNR</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-2xl text-mission-cyan">{formatVal(activeSample.psnr_ai, 2)}</span>
                      <span className="text-[10px] text-gray-600 font-mono">dB</span>
                    </div>
                  </div>
                  <div className="bg-gray-900/50 border border-gray-800 p-3 flex flex-col justify-center">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">AI SSIM</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-2xl text-mission-cyan">{formatVal(activeSample.ssim_ai, 3)}</span>
                    </div>
                  </div>
                  <div className="bg-gray-900/50 border border-gray-800 p-3 flex flex-col justify-center">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">BICUBIC PSNR</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-2xl text-gray-300">{formatVal(activeSample.psnr_bicubic, 2)}</span>
                      <span className="text-[10px] text-gray-600 font-mono">dB</span>
                    </div>
                  </div>
                  <div className="bg-gray-900/50 border border-gray-800 p-3 flex flex-col justify-center">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">BICUBIC SSIM</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-2xl text-gray-300">{formatVal(activeSample.ssim_bicubic, 3)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center justify-between bg-mission-cyan/5 border border-mission-cyan/10 px-3 py-2">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">PSNR IMPROVEMENT</span>
                    <span className="font-mono text-sm text-mission-cyan">{calcImpr(activeSample.psnr_ai, activeSample.psnr_bicubic, 2)} dB</span>
                  </div>
                  <div className="flex items-center justify-between bg-mission-cyan/5 border border-mission-cyan/10 px-3 py-2">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">SSIM IMPROVEMENT</span>
                    <span className="font-mono text-sm text-mission-cyan">{calcImpr(activeSample.ssim_ai, activeSample.ssim_bicubic, 3)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* PERFORMANCE CHART */}
            {activeSample && (
              <div className="xl:col-span-1 border border-gray-800 bg-black/40 p-5 rounded-sm flex flex-col">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <BarChart3 size={12} className="text-gray-400" /> MODEL PERFORMANCE // AI VS BICUBIC
                </h3>
                
                <div className="flex-1 flex flex-col gap-5 justify-center font-mono text-xs">
                  {/* PSNR */}
                  <div>
                    <div className="text-[10px] text-gray-500 mb-2 uppercase">PSNR (dB)</div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 text-right text-mission-cyan">AI</div>
                        <div className="flex-1 h-3 bg-gray-900 border border-gray-800">
                          <div className="h-full bg-mission-cyan" style={{ width: `${(parseFloat(activeSample.psnr_ai||0) / maxChartPsnr) * 100}%` }}></div>
                        </div>
                        <div className="w-12 text-mission-cyan">{formatVal(activeSample.psnr_ai, 2)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 text-right text-gray-400">BC</div>
                        <div className="flex-1 h-3 bg-gray-900 border border-gray-800">
                          <div className="h-full bg-gray-600" style={{ width: `${(parseFloat(activeSample.psnr_bicubic||0) / maxChartPsnr) * 100}%` }}></div>
                        </div>
                        <div className="w-12 text-gray-400">{formatVal(activeSample.psnr_bicubic, 2)}</div>
                      </div>
                    </div>
                  </div>

                  {/* SSIM */}
                  <div>
                    <div className="text-[10px] text-gray-500 mb-2 uppercase">SSIM (Index)</div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 text-right text-mission-cyan">AI</div>
                        <div className="flex-1 h-3 bg-gray-900 border border-gray-800">
                          <div className="h-full bg-mission-cyan" style={{ width: `${(parseFloat(activeSample.ssim_ai||0) / maxChartSsim) * 100}%` }}></div>
                        </div>
                        <div className="w-12 text-mission-cyan">{formatVal(activeSample.ssim_ai, 3)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 text-right text-gray-400">BC</div>
                        <div className="flex-1 h-3 bg-gray-900 border border-gray-800">
                          <div className="h-full bg-gray-600" style={{ width: `${(parseFloat(activeSample.ssim_bicubic||0) / maxChartSsim) * 100}%` }}></div>
                        </div>
                        <div className="w-12 text-gray-400">{formatVal(activeSample.ssim_bicubic, 3)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SCIENTIFIC VALIDATION */}
            <div className="border border-gray-800 bg-black/40 p-5 rounded-sm">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">SCIENTIFIC VALIDATION</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-300">PIXEL FIDELITY</span>
                    <span className="text-[10px] font-mono text-gray-500">PSNR</span>
                  </div>
                  <CheckCircle2 size={16} className="text-mission-cyan" />
                </div>
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-300">STRUCTURAL SIMILARITY</span>
                    <span className="text-[10px] font-mono text-gray-500">SSIM</span>
                  </div>
                  <CheckCircle2 size={16} className="text-mission-cyan" />
                </div>
                <div className="flex items-center justify-between pb-1">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">SPECTRAL CONSISTENCY</span>
                    <span className="text-[10px] font-mono text-gray-500">SAM</span>
                  </div>
                  <span className="text-[10px] font-mono text-mission-orange bg-mission-orange/10 px-2 py-0.5 border border-mission-orange/20">Not available in current benchmark</span>
                </div>
              </div>
            </div>

            {/* TRUST / UNCERTAINTY */}
            <div className="border border-gray-800 bg-black/40 p-5 rounded-sm">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">MODEL TRUST / UNCERTAINTY</h3>
              <div className="bg-gray-900/50 p-3 border-l-2 border-mission-orange text-xs text-gray-400 mb-4 leading-relaxed">
                Super-resolved details are model-inferred and should not be interpreted as direct observations. Validation against high-resolution reference imagery is used to quantify reconstruction reliability.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-gray-600 font-mono">REFERENCE AVAILABLE</div>
                  <div className="text-xs text-gray-200 mt-1 flex items-center gap-1"><CheckCircle2 size={12} className="text-mission-cyan"/> YES</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-600 font-mono">VALIDATION STATUS</div>
                  <div className="text-xs text-gray-200 mt-1 flex items-center gap-1"><Activity size={12} className="text-mission-cyan"/> BENCHMARKED</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between items-center">
                <span className="text-[10px] text-gray-500 font-mono">VALIDATION-BASED CONFIDENCE:</span>
                <span className="text-[10px] text-mission-cyan bg-mission-cyan/10 px-2 py-0.5 rounded-sm">Based on PSNR / SSIM</span>
              </div>
            </div>
          </div>

          {/* APPLICATION MODULES */}
          <div className="border border-gray-800 bg-black/40 p-5 rounded-sm mb-8">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">APPLICATION MODULES</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-800/50 bg-gray-900/30 p-4 hover:border-gray-600 transition-colors cursor-default">
                <div className="text-[10px] text-mission-cyan font-mono mb-2">[ CROP MONITORING ]</div>
                <ul className="text-xs text-gray-400 space-y-1 ml-3 list-disc marker:text-gray-600">
                  <li>Field boundaries</li>
                  <li>Vegetation structure</li>
                </ul>
              </div>
              <div className="border border-gray-800/50 bg-gray-900/30 p-4 hover:border-gray-600 transition-colors cursor-default">
                <div className="text-[10px] text-mission-cyan font-mono mb-2">[ URBAN ANALYSIS ]</div>
                <ul className="text-xs text-gray-400 space-y-1 ml-3 list-disc marker:text-gray-600">
                  <li>Buildings</li>
                  <li>Road networks</li>
                  <li>Land-use mapping</li>
                </ul>
              </div>
              <div className="border border-gray-800/50 bg-gray-900/30 p-4 hover:border-gray-600 transition-colors cursor-default">
                <div className="text-[10px] text-mission-cyan font-mono mb-2">[ DISASTER RESPONSE ]</div>
                <ul className="text-xs text-gray-400 space-y-1 ml-3 list-disc marker:text-gray-600">
                  <li>Flood extent</li>
                  <li>Infrastructure damage</li>
                  <li>Localized assessment</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
