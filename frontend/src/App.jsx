import React, { useState, useEffect, useRef } from 'react';
import { Activity, ChevronRight, CheckCircle2, Maximize, BarChart3, Database, Upload, Loader2, Download } from 'lucide-react';
import GlobeHero from './components/GlobeHero';
import SystemTelemetry from './components/SystemTelemetry';
import ErrorHeatmap from './components/ErrorHeatmap';

export default function App() {
  const [samples, setSamples] = useState([]);
  const [activeSampleId, setActiveSampleId] = useState(null);
  const [viewMode, setViewMode] = useState('input_ai'); // input_ai, ai_ref, threeway
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [customSample, setCustomSample] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const sliderRef = useRef(null);
  const analysisRef = useRef(null);
  const satelliteRef = useRef(null);

  const handleLaunchAnalysis = () => {
    analysisRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const handleViewFleet = () => {
    satelliteRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  console.log("isUploading:", isUploading);

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

  const handleFileUpload = async (e) => {
    const targetEl = e.target;
    const file = targetEl?.files?.[0];
    if (!file) return;

    console.log("handleFileUpload start");
    setIsUploading(true);
    setUploadError(null);

    try {
      const inputUrl = URL.createObjectURL(file);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://127.0.0.1:8000/enhance', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = `Server responded with ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.detail) errorMsg = errData.detail;
        } catch (e) {
          errorMsg = await response.text();
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const outputUrl = `data:image/png;base64,${data.image}`;

      const newCustomSample = {
        sample_id: 'custom',
        name: file.name,
        inputUrl,
        outputUrl,
        psnr_ai: data.psnr_ai ?? 'N/A',
        ssim_ai: data.ssim_ai ?? 'N/A',
        psnr_bicubic: 'N/A',
        ssim_bicubic: 'N/A',
      };

      setCustomSample(newCustomSample);
      setActiveSampleId('custom');
    } catch (err) {
      console.error("Upload error caught in catch:", err);
      setUploadError(err.message || 'Failed to process image with SwinIR backend.');
    } finally {
      setIsUploading(false);
      try {
        if (targetEl) targetEl.value = '';
      } catch (targetErr) {
        console.error("ERROR resetting target value:", targetErr);
      }
      console.log("handleFileUpload end");
    }
  };

  const activeSample = activeSampleId === 'custom'
    ? customSample
    : samples.find(s => s.sample_id === activeSampleId);

  const getImageSrc = (sample, type) => {
    if (!sample) return null;
    if (sample.sample_id === 'custom') {
      if (type === 'input') return sample.inputUrl;
      if (type === 'output') return sample.outputUrl;
      if (type === 'reference') return sample.inputUrl;
    }
    if (type === 'input') return `/${sample.sample_id}_input.png`;
    if (type === 'output') return `/${sample.sample_id}_output.png`;
    if (type === 'reference') return `/${sample.sample_id}_reference.png`;
    return '';
  };

  const handleDownload = () => {
    const outputSrc = getImageSrc(activeSample, 'output');
    if (!outputSrc) return;
    const a = document.createElement('a');
    a.href = outputSrc;
    a.download = activeSample?.sample_id === 'custom'
      ? 'PICT_SwinIR_x4_256x256.png'
      : `${activeSample.sample_id}_SwinIR_x4.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSliderMove = (e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, percentage)));
  };

  const handleSliderPointerDown = (e) => {
    if (e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {}
    }
    handleSliderMove(e);
  };

  const handleSliderPointerMove = (e) => {
    if (e.buttons === 1) {
      handleSliderMove(e);
    }
  };

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
              <span>MODEL: Sentinel-2 SwinIR x4</span>
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
              <span>MODE: LIVE INFERENCE</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1920px] mx-auto w-full px-6 py-6 z-10 relative">
        <GlobeHero onLaunchAnalysis={handleLaunchAnalysis} onViewFleet={handleViewFleet} />
        
        <div className="grid grid-cols-12 gap-8">
        {/* LEFT SIDEBAR */}
        <div className="col-span-12 lg:col-span-3 xl:col-span-2 flex flex-col gap-6">
          <div ref={satelliteRef} className="border border-mission-cyan/10 bg-black/40 p-4 rounded-sm backdrop-blur-sm">
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

              {customSample && (
                <button
                  onClick={() => setActiveSampleId('custom')}
                  className={`text-left px-3 py-2 rounded-sm transition-all border-l-2 group ${
                    activeSampleId === 'custom'
                      ? 'bg-mission-cyan/10 border-mission-cyan'
                      : 'hover:bg-gray-800/50 border-transparent hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-mission-cyan">
                      04
                    </span>
                    <span className="text-xs font-bold tracking-wide text-gray-200 truncate">
                      {customSample.name}
                    </span>
                  </div>
                  <div className="text-[10px] mt-1 ml-6 text-mission-cyan">
                    Custom SwinIR 4× Enhanced
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* UPLOAD SECTION */}
          <div ref={analysisRef} className="border border-mission-cyan/20 bg-black/50 p-4 rounded-sm">
            <h2 className="text-[10px] font-bold text-mission-cyan uppercase tracking-widest mb-3 flex items-center gap-2">
              <Upload size={12} /> LIVE SWINIR INFERENCE
            </h2>
            <label
              htmlFor="image-upload-input"
              className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-700 hover:border-mission-cyan/60 rounded-sm p-4 cursor-pointer transition-colors ${
                isUploading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={20} className="text-mission-cyan animate-spin" />
                  <span className="text-[10px] font-mono text-mission-cyan">RUNNING SWINIR 4×...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <Upload size={18} className="text-mission-cyan mb-1" />
                  <span className="text-xs font-bold text-gray-300">UPLOAD SENTINEL-2 IMAGE</span>
                  <span className="text-[9px] font-mono text-gray-500">Supports PNG, JPG, TIFF</span>
                </div>
              )}
            </label>
            <input
              id="image-upload-input"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
            {uploadError && (
              <div className="mt-2 text-[10px] font-mono text-red-400 bg-red-950/40 p-2 border border-red-800 rounded-sm">
                {uploadError}
              </div>
            )}
          </div>

          <div className="border border-gray-800 bg-black/40 p-4 rounded-sm">
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">CURRENT SCENE</h2>
            <div className="flex flex-col gap-3 text-xs font-mono">
              <div>
                <div className="text-[10px] text-gray-600">Sample ID:</div>
                <div className="text-mission-cyan">
                  {activeSampleId === 'custom' ? 'LIVE-UPLOAD' : `SRM-${activeSampleId ? activeSampleId.split('_')[1].toUpperCase() : '001'}-001`}
                </div>
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
                <div className="text-gray-300">SwinIR Sentinel-2</div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="col-span-12 lg:col-span-9 xl:col-span-10 flex flex-col gap-6 animate-in fade-in duration-500">
          
          {/* HERO VIEWER */}
          {activeSample && (
            <SystemTelemetry activeSample={activeSample}>
              <div className="flex flex-col gap-4">
                {/* Viewer Controls */}
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
                    SATELLITE IMAGE COMPARISON
                  </h2>
                  <div className="text-xs font-mono text-gray-500 mt-1 flex gap-4">
                    <span>SCENE: {(activeSample.name || activeSample.sample_id).toUpperCase()}</span>
                    <span>BAND COMPOSITE: RGB</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* DOWNLOAD BUTTON */}
                  <button
                    onClick={handleDownload}
                    disabled={!getImageSrc(activeSample, 'output')}
                    className="flex items-center gap-2 px-3.5 py-1.5 text-[10px] font-mono font-bold tracking-widest uppercase transition-all bg-mission-cyan/20 text-mission-cyan border border-mission-cyan/50 hover:bg-mission-cyan hover:text-black rounded-xs disabled:opacity-40 disabled:pointer-events-none"
                    title="Download 4x Super-Resolved PNG"
                  >
                    <Download size={12} />
                    <span>DOWNLOAD ENHANCED IMAGE</span>
                  </button>

                  {/* ZOOM CONTROLS */}
                  <div className="flex items-center gap-1 bg-black/60 border border-gray-800 rounded-sm p-1">
                    <span className="text-[9px] font-mono text-gray-400 px-2 uppercase">ZOOM:</span>
                    {[1, 2, 4].map(z => (
                      <button
                        key={z}
                        onClick={() => setZoomLevel(z)}
                        className={`px-2.5 py-1 text-[10px] font-mono transition-colors rounded-xs ${
                          zoomLevel === z
                            ? 'bg-mission-cyan text-black font-bold'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                        }`}
                      >
                        {z}×
                      </button>
                    ))}
                  </div>

                  {/* VIEW MODE TOGGLES */}
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
              </div>

                {/* Viewport */}
                <div className="border border-gray-800 bg-black/40 p-1 rounded-sm w-full">
                  {viewMode === 'threeway' ? (
                    <div className="grid grid-cols-3 gap-1 h-[60vh] max-h-[450px] bg-black select-none">
                      <div className="relative group overflow-hidden">
                        <div className="absolute top-2 left-2 z-10 bg-black/80 px-2 py-1 text-[10px] font-mono text-gray-300 border border-gray-700 backdrop-blur-sm">INPUT // 10m</div>
                        <img src={getImageSrc(activeSample, 'input')} alt="Input" className="w-full h-full object-contain" style={{ transform: `scale(${zoomLevel})`, imageRendering: zoomLevel > 1 ? 'pixelated' : 'auto' }} />
                      </div>
                      <div className="relative group overflow-hidden border-x border-gray-800">
                        <div className="absolute top-2 left-2 z-10 bg-mission-cyan/20 px-2 py-1 text-[10px] font-mono text-mission-cyan border border-mission-cyan/50 backdrop-blur-sm">AI SR // 4×</div>
                        <img src={getImageSrc(activeSample, 'output')} alt="AI Output" className="w-full h-full object-contain" style={{ transform: `scale(${zoomLevel})` }} />
                      </div>
                      <div className="relative group overflow-hidden">
                        <div className="absolute top-2 right-2 z-10 bg-black/80 px-2 py-1 text-[10px] font-mono text-gray-300 border border-gray-700 backdrop-blur-sm">REFERENCE // VENµS</div>
                        <img src={getImageSrc(activeSample, 'reference')} alt="Reference" className="w-full h-full object-contain" style={{ transform: `scale(${zoomLevel})` }} />
                      </div>
                    </div>
                  ) : (
                    <div
                      ref={sliderRef}
                      className="relative w-full aspect-square max-h-[450px] overflow-hidden select-none bg-black cursor-col-resize mx-auto"
                      style={{ touchAction: 'none' }}
                      onPointerDown={handleSliderPointerDown}
                      onPointerMove={handleSliderPointerMove}
                    >
                      {/* AI SR OUTPUT — BASE LAYER */}
                      <div className="absolute top-4 right-4 z-10 bg-black/80 px-2.5 py-1.5 text-[10px] font-mono border backdrop-blur-sm transition-colors border-mission-cyan/50 text-mission-cyan flex flex-col items-end gap-0.5 pointer-events-none">
                        <span className="font-bold">{viewMode === 'input_ai' ? 'AI SR (SWINIR ×4)' : 'REFERENCE (VENµS)'}</span>
                        <span className="text-[9px] text-gray-400">
                          {viewMode === 'input_ai' 
                            ? (activeSample.sample_id === 'custom' ? '256 × 256 px | 4 m/pixel' : '4 m/pixel')
                            : '4 m/pixel'}
                        </span>
                      </div>
                      <img
                        src={viewMode === 'input_ai' ? getImageSrc(activeSample, 'output') : getImageSrc(activeSample, 'reference')}
                        alt="AI Super Resolution"
                        draggable={false}
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        style={{ transform: `scale(${zoomLevel})`, transformOrigin: `${sliderPosition}% 50%` }}
                      />

                      {/* ORIGINAL INPUT — CLIPPED OVERLAY */}
                      <div className="absolute top-4 left-4 z-20 bg-black/80 px-2.5 py-1.5 text-[10px] font-mono text-gray-300 border border-gray-700 backdrop-blur-sm flex flex-col gap-0.5 pointer-events-none">
                        <span className="font-bold">{viewMode === 'input_ai' ? 'INPUT' : 'AI SR (SWINIR ×4)'}</span>
                        <span className="text-[9px] text-gray-400">
                          {viewMode === 'input_ai' 
                            ? (activeSample.sample_id === 'custom' ? '64 × 64 px | 10 m/pixel' : '10 m/pixel')
                            : (activeSample.sample_id === 'custom' ? '256 × 256 px | 4 m/pixel' : '4 m/pixel')}
                        </span>
                      </div>
                      <div
                        className="absolute inset-0 overflow-hidden pointer-events-none z-10"
                        style={{
                          width: `${sliderPosition}%`,
                        }}
                      >
                        <img
                          src={viewMode === 'input_ai' ? getImageSrc(activeSample, 'input') : getImageSrc(activeSample, 'output')}
                          alt="Original Sentinel-2 Input"
                          draggable={false}
                          className="absolute inset-0 w-full h-full object-contain"
                          style={{
                            width: sliderRef.current ? `${sliderRef.current.clientWidth}px` : '100%',
                            maxWidth: 'none',
                            transform: `scale(${zoomLevel})`,
                            transformOrigin: `${sliderPosition}% 50%`,
                            imageRendering: (viewMode === 'input_ai' && zoomLevel > 1) ? 'pixelated' : 'auto'
                          }}
                        />
                      </div>

                      {/* VERTICAL COMPARISON DIVIDER */}
                      <div
                        className="absolute top-0 bottom-0 w-[2px] bg-mission-cyan z-20 pointer-events-none shadow-[0_0_10px_rgba(0,217,255,0.9)]"
                        style={{
                          left: `${sliderPosition}%`,
                          transform: 'translateX(-50%)',
                        }}
                      >
                        <div
                          className="
                            absolute top-1/2 left-1/2
                            -translate-x-1/2 -translate-y-1/2
                            w-10 h-10 rounded-full
                            border-2 border-mission-cyan
                            bg-black/80
                            flex items-center justify-center
                            shadow-[0_0_12px_rgba(0,217,255,0.6)]
                          "
                        >
                          <span className="text-mission-cyan text-xs font-bold">↔</span>
                        </div>
                      </div>
                    </div>
                  )}

                {/* EXPLICIT METADATA BADGES UNDERNEATH VIEWPORT */}
                <div className="grid grid-cols-2 gap-4 mt-2 bg-black/80 border border-gray-800 p-2.5 rounded-sm font-mono text-xs">
                  <div className="flex items-center justify-between border-r border-gray-800 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-gray-300 font-bold">INPUT IMAGE</span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px]">
                      <span className="text-gray-400">DIMENSIONS: <strong className="text-gray-200">{activeSample.sample_id === 'custom' ? '64 × 64 px' : 'LR (10m)'}</strong></span>
                      <span className="text-mission-cyan">SPATIAL: <strong>10 m/pixel</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pl-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-mission-cyan rounded-full animate-pulse"></div>
                      <span className="text-mission-cyan font-bold">AI SR (SWINIR ×4)</span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px]">
                      <span className="text-gray-400">DIMENSIONS: <strong className="text-gray-200">{activeSample.sample_id === 'custom' ? '256 × 256 px' : 'SR (4m)'}</strong></span>
                      <span className="text-mission-orange">SPATIAL: <strong>4 m/pixel</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </SystemTelemetry>
          )}

          {/* PIPELINE STRIP */}
          <div className="border border-gray-800 bg-black/40 rounded-sm px-4 py-3 flex items-center justify-between">
            {[
              { num: '01', title: 'INPUT', desc: 'Sentinel-2 / 10m', active: true },
              { num: '02', title: 'PREPROCESS', desc: 'Cloud Mask / Tiling', active: true },
              { num: '03', title: 'AI SUPER-RESOLUTION', desc: 'Swin-IR / 4×', active: true },
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
            {/* TELEMETRY METRICS AND HEATMAP ROW */}
            {activeSample && (
              <>
                <div className="xl:col-span-1 flex flex-col gap-6">
                  {/* VALIDATION TELEMETRY */}
                  <div className="border border-gray-800 bg-black/40 p-5 rounded-sm flex-1">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Activity size={12} className="text-mission-orange" /> AI VALIDATION METRICS
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>
                  </div>

                  {/* AI MODEL PERFORMANCE CHART */}
                  <div className="border border-gray-800 bg-black/40 p-5 rounded-sm flex-1 flex flex-col">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <BarChart3 size={12} className="text-gray-400" /> AI MODEL PERFORMANCE
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
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ERROR HEATMAP PANEL */}
                <div className="xl:col-span-2">
                  <ErrorHeatmap 
                    aiSrc={getImageSrc(activeSample, 'output')} 
                    refSrc={getImageSrc(activeSample, 'reference')} 
                  />
                </div>
              </>
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
        </div>
      </main>
    </div>
  );
}
