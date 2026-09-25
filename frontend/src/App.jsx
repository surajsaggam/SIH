import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  ChevronRight,
  CheckCircle2,
  Maximize,
  Database,
  Upload,
  Loader2,
  Download,
  ShieldAlert,
  Sprout,
  Building2,
  Waves,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import GlobeHero from './components/GlobeHero';
import SystemTelemetry from './components/SystemTelemetry';
import ErrorHeatmap from './components/ErrorHeatmap';
import LandCoverAnalysis from './components/LandCoverAnalysis';
import ChatBot from './components/ChatBot';
import CinematicIntro from './components/CinematicIntro';

const PRESET_SAMPLES = [
  { sample_id: 'sample_1', name: 'Crop Monitoring', psnr_ai: '30.0', ssim_ai: '0.85', psnr_bicubic: '26.0', ssim_bicubic: '0.75' },
  { sample_id: 'sample_2', name: 'Urban Area', psnr_ai: '31.5', ssim_ai: '0.89', psnr_bicubic: '27.2', ssim_bicubic: 'NaN' },
  { sample_id: 'sample_3', name: 'Disaster Assessment', psnr_ai: '33.0', ssim_ai: '0.93', psnr_bicubic: '28.4', ssim_bicubic: '0.81' },
];

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [samples, setSamples] = useState(PRESET_SAMPLES);
  const [activeSampleId, setActiveSampleId] = useState('sample_1');
  const [viewMode, setViewMode] = useState('input_ai'); // input_ai, ai_ref, threeway
  const [sliderPosition, setSliderPosition] = useState(50);
  const [customSample, setCustomSample] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [analysisMap, setAnalysisMap] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const sliderRef = useRef(null);
  const workspaceRef = useRef(null);
  const sceneSelectorRef = useRef(null);
  const chatRef = useRef(null);

  const handleLaunchAnalysis = () => {
    workspaceRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const handleViewFleet = () => {
    sceneSelectorRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const handleOpenChat = () => {
    chatRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const handleSelectScene = (sceneId) => {
    setActiveSampleId(sceneId);
    workspaceRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  // Load preset sample metadata from CSV
  useEffect(() => {
    fetch('/results.csv')
      .then(res => res.text())
      .then(text => {
        const lines = text.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
          }, {});
        });
        if (data.length > 0) {
          setSamples(data);
          setActiveSampleId(prev => prev || data[0].sample_id);
        }
      })
      .catch(err => console.error("Error loading CSV:", err));
  }, []);

  // Upload handler for live SwinIR inference
  const handleFileUpload = async (e) => {
    const targetEl = e.target;
    const file = targetEl?.files?.[0];
    if (!file) return;

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

      // Trigger Land Cover Analysis for newly enhanced custom image
      try {
        setIsAnalyzing(true);
        const binaryStr = atob(data.image);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'image/png' });
        const analyzeFd = new FormData();
        analyzeFd.append('file', blob, 'enhanced_custom.png');

        const analyzeRes = await fetch('http://127.0.0.1:8000/analyze', {
          method: 'POST',
          body: analyzeFd,
        });
        if (analyzeRes.ok) {
          const aData = await analyzeRes.json();
          setAnalysisMap(prev => ({ ...prev, custom: aData }));
        }
      } catch (analyzeErr) {
        console.error("Land cover analysis error:", analyzeErr);
      } finally {
        setIsAnalyzing(false);
      }
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

  // Preload/fetch Land Cover Analysis for preset scenes
  useEffect(() => {
    if (!activeSampleId || activeSampleId === 'custom') return;
    if (analysisMap[activeSampleId]) return;

    const currentSample = samples.find(s => s.sample_id === activeSampleId);
    const outputSrc = getImageSrc(currentSample, 'output');
    if (!outputSrc) return;

    let isMounted = true;
    setIsAnalyzing(true);

    fetch(outputSrc)
      .then(r => r.blob())
      .then(blob => {
        const fd = new FormData();
        fd.append('file', blob, `${activeSampleId}_output.png`);
        return fetch('http://127.0.0.1:8000/analyze', {
          method: 'POST',
          body: fd,
        });
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (isMounted && data) {
          setAnalysisMap(prev => ({ ...prev, [activeSampleId]: data }));
        }
      })
      .catch(err => console.error("Error analyzing sample:", err))
      .finally(() => {
        if (isMounted) setIsAnalyzing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeSampleId, samples]);

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

  const scenes = [
    { id: 'sample_1', title: 'CROP MONITORING', subtitle: 'Agricultural field boundaries / vegetation', icon: Sprout },
    { id: 'sample_2', title: 'URBAN ANALYSIS', subtitle: 'Buildings / roads / dense settlement', icon: Building2 },
    { id: 'sample_3', title: 'DISASTER ASSESSMENT', subtitle: 'Flooding / damaged infrastructure', icon: Waves },
  ];

  const maxChartPsnr = 45;
  const maxChartSsim = 1.0;

  return (
    <div className="min-h-screen bg-[#05080E] flex flex-col font-sans text-gray-200 relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      {/* ── CINEMATIC BOOT INTRO ANIMATION ── */}
      {showIntro && <CinematicIntro onComplete={() => setShowIntro(false)} />}

      {/* ── AMBIENT BACKGROUND ATMOSPHERE ── */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(0, 217, 255, 0.15) 0%, transparent 60%), linear-gradient(rgba(0, 217, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 217, 255, 0.04) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 36px 36px, 36px 36px'
        }}
      />

      {/* ── HEADER ── */}
      <header className="border-b border-white/[0.08] bg-[#05080E]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center">
          
          {/* Brand & Product Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1px] flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.2)]">
              <div className="w-full h-full bg-[#05080E] rounded-lg flex items-center justify-center">
                <Sparkles size={16} className="text-cyan-400" />
              </div>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-widest text-white uppercase font-sans">
              Pixel 2 Pulse
            </h1>
          </div>

        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-[1920px] mx-auto w-full px-4 sm:px-6 py-6 z-10 relative flex flex-col gap-10">
        
        {/* 1. HERO / LANDING SECTION */}
        <GlobeHero 
          onLaunchAnalysis={handleLaunchAnalysis} 
          onViewFleet={handleViewFleet}
          onSelectScene={handleSelectScene}
          onOpenChat={handleOpenChat}
        />

        {/* 2. ANALYSIS WORKSPACE */}
        <section ref={workspaceRef} className="flex flex-col gap-6">
          
          {/* Workspace Title Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono text-cyan-400 font-bold">
                WORKSPACE
              </span>
              <h2 className="text-lg font-bold font-sans tracking-wide text-white uppercase">
                AI MULTISPECTRAL ANALYSIS &amp; ENHANCEMENT
              </h2>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-gray-400">
              <span>ACTIVE TARGET:</span>
              <span className="text-cyan-400 font-bold uppercase">
                {activeSample ? (activeSample.name || activeSample.sample_id) : 'INITIALIZING'}
              </span>
            </div>
          </div>

          {/* 3-COLUMN HIERARCHY */}
          <div className="grid grid-cols-12 gap-6 items-start">
            
            {/* ── LEFT: Scene / Analysis Controls ── */}
            <div className="col-span-12 lg:col-span-3 xl:col-span-3 flex flex-col gap-5">
              
              {/* Dataset / Scene Selection */}
              <div ref={sceneSelectorRef} className="cosmic-panel p-4 rounded-xl border border-white/[0.08] bg-[#080D18]/80">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                  <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                    <Database size={13} className="text-cyan-400" />
                    <span>DATASET / SCENE</span>
                  </h3>
                  <span className="text-[9px] font-mono text-gray-500">PRESETS</span>
                </div>

                <div className="flex flex-col gap-2">
                  {scenes.map((scene, i) => {
                    const isActive = activeSampleId === scene.id;
                    const SIcon = scene.icon;
                    return (
                      <button
                        key={scene.id}
                        onClick={() => setActiveSampleId(scene.id)}
                        className={`text-left p-3 rounded-lg transition-all border group cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-cyan-950/50 to-blue-950/30 border-cyan-500/50 shadow-[0_0_12px_rgba(0,217,255,0.15)]'
                            : 'bg-black/30 border-white/[0.06] hover:bg-white/[0.03] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-cyan-400' : 'text-gray-500'}`}>
                              0{i + 1}
                            </span>
                            <span className={`text-xs font-bold tracking-wide font-sans ${isActive ? 'text-white' : 'text-gray-300'}`}>
                              {scene.title}
                            </span>
                          </div>
                          <SIcon size={13} className={isActive ? 'text-cyan-400' : 'text-gray-500 group-hover:text-gray-300'} />
                        </div>
                        <p className={`text-[10px] mt-1 ml-5 font-mono ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                          {scene.subtitle}
                        </p>
                      </button>
                    );
                  })}

                  {/* Custom Uploaded Scene Entry */}
                  {customSample && (
                    <button
                      onClick={() => setActiveSampleId('custom')}
                      className={`text-left p-3 rounded-lg transition-all border group cursor-pointer ${
                        activeSampleId === 'custom'
                          ? 'bg-gradient-to-r from-cyan-950/50 to-blue-950/30 border-cyan-500/50 shadow-[0_0_12px_rgba(0,217,255,0.15)]'
                          : 'bg-black/30 border-white/[0.06] hover:bg-white/[0.03] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-cyan-400">
                            04
                          </span>
                          <span className="text-xs font-bold tracking-wide text-white truncate max-w-[160px]">
                            {customSample.name}
                          </span>
                        </div>
                        <Sparkles size={13} className="text-cyan-400" />
                      </div>
                      <p className="text-[10px] mt-1 ml-5 font-mono text-cyan-300">
                        Custom SwinIR 4× Enhanced
                      </p>
                    </button>
                  )}
                </div>
              </div>

              {/* Upload Sentinel-2 Image */}
              <div className="cosmic-panel p-4 rounded-xl border border-cyan-500/30 bg-[#080D18]/90">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                  <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                    <Upload size={13} className="text-cyan-400" />
                    <span>LIVE SWINIR INFERENCE</span>
                  </h3>
                  <span className="text-[9px] font-mono text-gray-400">4× SCALE</span>
                </div>

                <label
                  htmlFor="image-upload-input"
                  className={`flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-cyan-500/50 rounded-xl p-5 cursor-pointer transition-all bg-black/40 hover:bg-black/60 group ${
                    isUploading ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2.5 py-2">
                      <Loader2 size={24} className="text-cyan-400 animate-spin" />
                      <span className="text-[11px] font-mono text-cyan-400 font-bold tracking-wider">
                        ENHANCING RESOLUTION (4×)...
                      </span>
                      <span className="text-[9px] font-mono text-gray-500">
                        Running SwinIR transformer
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <div className="w-10 h-10 rounded-full bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform mb-1">
                        <Upload size={18} />
                      </div>
                      <span className="text-xs font-mono font-bold text-gray-200 group-hover:text-cyan-300 transition-colors">
                        UPLOAD SENTINEL-2 TILE
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">
                        PNG, JPG, TIFF (B2/B3/B4 RGB)
                      </span>
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
                  <div className="mt-3 text-[10px] font-mono text-red-300 bg-red-950/40 p-2.5 border border-red-800/60 rounded-lg">
                    {uploadError}
                  </div>
                )}
              </div>

              {/* Scene Metadata Specs */}
              <div className="cosmic-panel p-4 rounded-xl border border-white/[0.08] bg-[#080D18]/80 text-xs font-mono">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-2 mb-3 border-b border-white/[0.06]">
                  CURRENT SCENE PROFILE
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">SAMPLE ID:</span>
                    <span className="text-cyan-400 font-bold">
                      {activeSampleId === 'custom' ? 'LIVE-UPLOAD' : `SRM-${activeSampleId ? activeSampleId.split('_')[1].toUpperCase() : '001'}-001`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">SOURCE:</span>
                    <span className="text-gray-300">Sentinel-2 L2A</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">INPUT RES:</span>
                    <span className="text-gray-300 font-semibold">10 m / pixel</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">TARGET:</span>
                    <span className="text-orange-400 font-bold">&lt; 4 m / pixel</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">ARCH:</span>
                    <span className="text-gray-300">SwinIR Sentinel-2</span>
                  </div>
                </div>
              </div>

            </div>

            {/* ── CENTER: Large Satellite Image Comparison ── */}
            <div className="col-span-12 lg:col-span-6 xl:col-span-6 flex flex-col gap-4">
              
              {activeSample && (
                <div className="cosmic-panel p-4 sm:p-5 rounded-xl border border-white/[0.08] bg-[#080D18]/90 flex flex-col gap-4">
                  
                  {/* Top Bar of Viewer: Title + Zoom + Download + View toggles */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                    <div>
                      <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <span>SATELLITE IMAGE COMPARISON</span>
                      </h3>
                      <div className="text-[10px] font-mono text-gray-400 mt-0.5 flex items-center gap-3">
                        <span>SCENE: {(activeSample.name || activeSample.sample_id).toUpperCase()}</span>
                        <span className="text-gray-600">|</span>
                        <span>RGB COMPOSITE</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Download Enhanced Image Button */}
                      <button
                        onClick={handleDownload}
                        disabled={!getImageSrc(activeSample, 'output')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold tracking-widest uppercase transition-all bg-gradient-to-r from-cyan-500 to-blue-600 text-black hover:from-cyan-400 hover:to-blue-500 rounded-lg disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-[0_0_12px_rgba(0,217,255,0.2)] active:scale-95"
                        title="Download 4x Super-Resolved Image"
                      >
                        <Download size={12} />
                        <span>DOWNLOAD</span>
                      </button>

                      {/* Zoom Controls */}
                      <div className="flex items-center bg-black/60 border border-white/10 rounded-lg p-0.5">
                        <span className="text-[9px] font-mono text-gray-500 px-1.5">ZOOM:</span>
                        {[1, 2, 4].map(z => (
                          <button
                            key={z}
                            onClick={() => setZoomLevel(z)}
                            className={`px-2 py-0.5 text-[10px] font-mono rounded-md transition-colors cursor-pointer ${
                              zoomLevel === z
                                ? 'bg-cyan-400 text-black font-bold'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            {z}×
                          </button>
                        ))}
                      </div>

                      {/* View Mode Switcher */}
                      <div className="flex bg-black/60 border border-white/10 rounded-lg p-0.5">
                        {[
                          { id: 'input_ai', label: 'INPUT ↔ AI SR' },
                          { id: 'ai_ref', label: 'AI SR ↔ REF' },
                          { id: 'threeway', label: '3-WAY' }
                        ].map(mode => (
                          <button
                            key={mode.id}
                            onClick={() => setViewMode(mode.id)}
                            className={`px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase rounded-md transition-all cursor-pointer ${
                              viewMode === mode.id
                                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-bold'
                                : 'text-gray-500 hover:text-gray-300 border border-transparent'
                            }`}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Image Viewport Main */}
                  <div className="relative border border-white/10 rounded-xl bg-black overflow-hidden select-none">
                    
                    {viewMode === 'threeway' ? (
                      /* 3-Way Side-by-Side Comparison */
                      <div className="grid grid-cols-3 gap-1 h-[360px] sm:h-[420px] bg-black select-none">
                        <div className="relative overflow-hidden group">
                          <div className="absolute top-2 left-2 z-10 bg-black/80 px-2 py-1 text-[9px] font-mono text-gray-300 border border-white/10 rounded-md backdrop-blur-sm">
                            INPUT // 10m
                          </div>
                          <img 
                            src={getImageSrc(activeSample, 'input')} 
                            alt="Input Sentinel-2" 
                            className="w-full h-full object-contain" 
                            style={{ transform: `scale(${zoomLevel})`, imageRendering: zoomLevel > 1 ? 'pixelated' : 'auto' }} 
                          />
                        </div>
                        <div className="relative overflow-hidden border-x border-white/10 group">
                          <div className="absolute top-2 left-2 z-10 bg-cyan-950/80 px-2 py-1 text-[9px] font-mono text-cyan-300 border border-cyan-500/40 rounded-md backdrop-blur-sm">
                            AI SR // 4×
                          </div>
                          <img 
                            src={getImageSrc(activeSample, 'output')} 
                            alt="AI Super Resolution" 
                            className="w-full h-full object-contain" 
                            style={{ transform: `scale(${zoomLevel})` }} 
                          />
                        </div>
                        <div className="relative overflow-hidden group">
                          <div className="absolute top-2 right-2 z-10 bg-black/80 px-2 py-1 text-[9px] font-mono text-gray-300 border border-white/10 rounded-md backdrop-blur-sm">
                            REF // VENµS
                          </div>
                          <img 
                            src={getImageSrc(activeSample, 'reference')} 
                            alt="Reference High Res" 
                            className="w-full h-full object-contain" 
                            style={{ transform: `scale(${zoomLevel})` }} 
                          />
                        </div>
                      </div>
                    ) : (
                      /* Interactive Before/After Split Slider */
                      <div
                        ref={sliderRef}
                        className="relative w-full aspect-square max-h-[460px] overflow-hidden select-none bg-black cursor-col-resize mx-auto"
                        style={{ touchAction: 'none' }}
                        onPointerDown={handleSliderPointerDown}
                        onPointerMove={handleSliderPointerMove}
                      >
                        {/* Base Layer: AI Output or Reference */}
                        <div className="absolute top-3 right-3 z-10 bg-black/85 px-2.5 py-1 text-[9px] font-mono border backdrop-blur-sm border-cyan-500/40 text-cyan-400 rounded-md flex flex-col items-end pointer-events-none">
                          <span className="font-bold">
                            {viewMode === 'input_ai' ? 'AI SR (SWINIR ×4)' : 'REFERENCE (VENµS)'}
                          </span>
                          <span className="text-[8px] text-gray-400">
                            {viewMode === 'input_ai'
                              ? (activeSample.sample_id === 'custom' ? '256 × 256 px | 4 m/px' : '4 m/pixel')
                              : '4 m/pixel'}
                          </span>
                        </div>

                        <img
                          src={viewMode === 'input_ai' ? getImageSrc(activeSample, 'output') : getImageSrc(activeSample, 'reference')}
                          alt="Super Resolution Output"
                          draggable={false}
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                          style={{ transform: `scale(${zoomLevel})`, transformOrigin: `${sliderPosition}% 50%` }}
                        />

                        {/* Clipped Overlay: Input or AI Output */}
                        <div className="absolute top-3 left-3 z-20 bg-black/85 px-2.5 py-1 text-[9px] font-mono text-gray-300 border border-white/10 rounded-md backdrop-blur-sm flex flex-col pointer-events-none">
                          <span className="font-bold">
                            {viewMode === 'input_ai' ? 'INPUT (SENTINEL-2)' : 'AI SR (SWINIR ×4)'}
                          </span>
                          <span className="text-[8px] text-gray-400">
                            {viewMode === 'input_ai'
                              ? (activeSample.sample_id === 'custom' ? '64 × 64 px | 10 m/px' : '10 m/pixel')
                              : (activeSample.sample_id === 'custom' ? '256 × 256 px | 4 m/px' : '4 m/pixel')}
                          </span>
                        </div>

                        {/* Clipped Overlay: Input or AI Output using clip-path */}
                        <div
                          className="absolute inset-0 pointer-events-none z-10"
                          style={{
                            clipPath: `inset(0 calc(100% - ${sliderPosition}%) 0 0)`
                          }}
                        >
                          <img
                            src={viewMode === 'input_ai' ? getImageSrc(activeSample, 'input') : getImageSrc(activeSample, 'output')}
                            alt="Original Sentinel-2 Input"
                            draggable={false}
                            className="absolute inset-0 w-full h-full object-contain"
                            style={{
                              transform: `scale(${zoomLevel})`,
                              transformOrigin: `${sliderPosition}% 50%`,
                              imageRendering: (viewMode === 'input_ai' && zoomLevel > 1) ? 'pixelated' : 'auto'
                            }}
                          />
                        </div>

                        {/* Interactive Split Divider & Handle */}
                        <div
                          className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 z-20 pointer-events-none shadow-[0_0_12px_rgba(0,217,255,0.9)]"
                          style={{
                            left: `${sliderPosition}%`,
                            transform: 'translateX(-50%)',
                          }}
                        >
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-cyan-400 bg-black/90 flex items-center justify-center shadow-[0_0_15px_rgba(0,217,255,0.7)]">
                            <span className="text-cyan-400 text-xs font-bold font-mono">↔</span>
                          </div>
                        </div>

                      </div>
                    )}

                  </div>

                  {/* Explicit Metadata Badges Underneath Viewport */}
                  <div className="grid grid-cols-2 gap-3 bg-black/60 border border-white/[0.08] p-3 rounded-lg font-mono text-xs">
                    <div className="flex items-center justify-between border-r border-white/10 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        <span className="text-gray-300 font-bold">INPUT IMAGE</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-gray-500">DIM: <strong className="text-gray-200">{activeSample.sample_id === 'custom' ? '64 × 64 px' : 'LR (10m)'}</strong></span>
                        <span className="text-cyan-400">SPATIAL: <strong>10 m/px</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pl-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                        <span className="text-cyan-400 font-bold">AI SR (SWINIR)</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-gray-500">DIM: <strong className="text-gray-200">{activeSample.sample_id === 'custom' ? '256 × 256 px' : 'SR (4m)'}</strong></span>
                        <span className="text-orange-400">SPATIAL: <strong>4 m/px</strong></span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* ── RIGHT: Compact Live Telemetry ── */}
            <div className="col-span-12 lg:col-span-3 xl:col-span-3">
              <SystemTelemetry 
                activeSample={activeSample} 
                isUploading={isUploading}
                isAnalyzing={isAnalyzing}
              />
            </div>

          </div>

        </section>

        {/* 3. PIPELINE WORKFLOW STRIP */}
        <section className="cosmic-panel rounded-xl p-4 sm:p-5 border border-white/[0.08] bg-[#080D18]/80">
          <div className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Layers size={13} className="text-cyan-400" />
            <span>END-TO-END INFERENCE &amp; VALIDATION PIPELINE</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { num: '01', title: 'INPUT', desc: 'Sentinel-2 / 10m', sub: 'Multispectral L2A' },
              { num: '02', title: 'PREPROCESS', desc: 'Cloud Mask / Tiling', sub: 'Automated 224x224' },
              { num: '03', title: 'AI SUPER-RESOLUTION', desc: 'SwinIR / 4x', sub: 'RSTB Transformer' },
              { num: '04', title: 'VALIDATION', desc: 'PSNR / SSIM', sub: 'VENµS Benchmarked' },
              { num: '05', title: 'ANALYSIS', desc: 'Land Cover / RAG', sub: 'EuroSAT + Agronomy' },
            ].map((step, idx) => (
              <div 
                key={step.num}
                className="p-3 rounded-lg border border-white/[0.06] bg-black/40 flex flex-col justify-between group hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-cyan-400">{step.num}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    {step.title}
                  </div>
                  <div className="text-[11px] font-mono text-cyan-300 mt-0.5">
                    {step.desc}
                  </div>
                  <div className="text-[9px] font-mono text-gray-500 mt-1">
                    {step.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. METRICS & SCIENTIFIC VALIDATION SECTION */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono text-cyan-400 font-bold">
                VALIDATION
              </span>
              <h2 className="text-lg font-bold font-sans tracking-wide text-white uppercase">
                SCIENTIFIC FIDELITY &amp; RECONSTRUCTION BENCHMARKS
              </h2>
            </div>
            <span className="text-[10px] font-mono text-gray-400">GROUND TRUTH VALIDATED</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Real Scientific Metrics Cards & Performance Bars */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              
              {/* PSNR & SSIM Large Numerics */}
              <div className="cosmic-panel p-5 rounded-xl border border-white/[0.08] bg-[#080D18]/80 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={13} className="text-cyan-400" />
                    <span>AI RECONSTRUCTION FIDELITY</span>
                  </h3>
                  <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    REAL METRICS
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* PSNR Card */}
                  <div className="bg-black/50 border border-white/[0.08] p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-widest mb-2">
                      AI PSNR
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono text-3xl sm:text-4xl font-extrabold text-cyan-400">
                        {formatVal(activeSample?.psnr_ai, 2)}
                      </span>
                      <span className="text-xs font-mono text-gray-400 font-semibold">dB</span>
                    </div>
                    <div className="text-[9px] font-mono text-gray-500 mt-2 flex items-center gap-1">
                      <CheckCircle2 size={10} className="text-cyan-400" />
                      <span>Peak Signal-to-Noise</span>
                    </div>
                  </div>

                  {/* SSIM Card */}
                  <div className="bg-black/50 border border-white/[0.08] p-4 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-widest mb-2">
                      AI SSIM
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono text-3xl sm:text-4xl font-extrabold text-cyan-400">
                        {formatVal(activeSample?.ssim_ai, 3)}
                      </span>
                    </div>
                    <div className="text-[9px] font-mono text-gray-500 mt-2 flex items-center gap-1">
                      <CheckCircle2 size={10} className="text-cyan-400" />
                      <span>Structural Similarity</span>
                    </div>
                  </div>
                </div>

                {/* Model Performance Comparison Bar */}
                <div className="pt-2 border-t border-white/[0.06] flex flex-col gap-3 font-mono text-xs">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>PSNR (dB) RELATIVE BENCHMARK</span>
                    <span className="text-cyan-400">{formatVal(activeSample?.psnr_ai, 2)} dB</span>
                  </div>
                  <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-white/10">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (parseFloat(activeSample?.psnr_ai || 0) / maxChartPsnr) * 100)}%` }}
                    />
                  </div>

                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between mt-1">
                    <span>SSIM (INDEX) STRUCTURAL FIDELITY</span>
                    <span className="text-cyan-400">{formatVal(activeSample?.ssim_ai, 3)}</span>
                  </div>
                  <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-white/10">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (parseFloat(activeSample?.ssim_ai || 0) / maxChartSsim) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Scientific Trust & Uncertainty */}
              <div className="cosmic-panel p-5 rounded-xl border border-white/[0.08] bg-[#080D18]/80 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert size={13} className="text-orange-400" />
                    <span>MODEL TRUST &amp; UNCERTAINTY PROTOCOL</span>
                  </h3>
                  <span className="text-[9px] font-mono text-orange-400 bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-500/20">
                    SCIENTIFIC ETHICS
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed font-sans py-3">
                  Super-resolved spatial details are model-inferred using SwinIR transformer representations. 
                  Validation against paired VENµS ground-truth imagery quantifies reconstruction error bounds before downstream agronomy decisions.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.06] text-xs font-mono">
                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/[0.06]">
                    <span className="text-[9px] text-gray-500 block uppercase">REFERENCE IMAGERY</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 size={12} />
                      <span>VENµS HR VERIFIED</span>
                    </span>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/[0.06]">
                    <span className="text-[9px] text-gray-500 block uppercase">UNCERTAINTY BOUND</span>
                    <span className="text-cyan-400 font-bold mt-0.5 block">
                      PSNR / SSIM BOUNDED
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Error Heatmap (Pixel Residuals vs Ground Truth) */}
            <div className="lg:col-span-7">
              <ErrorHeatmap 
                aiSrc={getImageSrc(activeSample, 'output')} 
                refSrc={getImageSrc(activeSample, 'reference')} 
                isPairedReference={activeSample?.sample_id !== 'custom'}
              />
            </div>

          </div>
        </section>

        {/* 5. LAND COVER & APPLICATION MODULES */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono text-cyan-400 font-bold">
                APPLICATIONS
              </span>
              <h2 className="text-lg font-bold font-sans tracking-wide text-white uppercase">
                LAND COVER INTELLIGENCE &amp; MULTI-SECTOR MODULES
              </h2>
            </div>
            <span className="text-[10px] font-mono text-gray-400">EUROSAT CLASSIFICATION</span>
          </div>

          {/* EuroSAT Analysis Component */}
          <LandCoverAnalysis 
            analysis={analysisMap[activeSampleId]} 
            isAnalyzing={isAnalyzing && !analysisMap[activeSampleId]} 
          />

          {/* 3 Streamlined Application Module Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Crop Monitoring */}
            <div className="cosmic-panel p-5 rounded-xl border border-white/[0.08] bg-[#080D18]/80 hover:border-cyan-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Sprout size={16} />
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    MODULE 01
                  </span>
                </div>
                <h4 className="text-sm font-bold font-sans tracking-wide text-white uppercase mb-2">
                  CROP MONITORING &amp; AGRONOMY
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed font-sans mb-4">
                  Field boundary delineation, NDVI vegetation health indices, and micro-plot soil moisture assessment with 4x resolution.
                </p>
              </div>
              <button 
                onClick={() => handleSelectScene('sample_1')}
                className="w-full py-2 px-3 rounded-lg bg-white/[0.03] hover:bg-emerald-950/30 border border-white/10 hover:border-emerald-500/30 text-gray-300 hover:text-emerald-300 text-[10px] font-mono font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>INSPECT CROP TILE</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Urban Analysis */}
            <div className="cosmic-panel p-5 rounded-xl border border-white/[0.08] bg-[#080D18]/80 hover:border-cyan-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Building2 size={16} />
                  </div>
                  <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    MODULE 02
                  </span>
                </div>
                <h4 className="text-sm font-bold font-sans tracking-wide text-white uppercase mb-2">
                  URBAN DENSITY &amp; ZONING
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed font-sans mb-4">
                  Roadway infrastructure delineation, building footprint separation, and informal settlement expansion monitoring.
                </p>
              </div>
              <button 
                onClick={() => handleSelectScene('sample_2')}
                className="w-full py-2 px-3 rounded-lg bg-white/[0.03] hover:bg-cyan-950/30 border border-white/10 hover:border-cyan-500/30 text-gray-300 hover:text-cyan-300 text-[10px] font-mono font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>INSPECT URBAN TILE</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Disaster Assessment */}
            <div className="cosmic-panel p-5 rounded-xl border border-white/[0.08] bg-[#080D18]/80 hover:border-orange-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                  <div className="w-8 h-8 rounded-lg bg-orange-950/40 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <Waves size={16} />
                  </div>
                  <span className="text-[9px] font-mono text-orange-400 font-bold uppercase tracking-wider">
                    MODULE 03
                  </span>
                </div>
                <h4 className="text-sm font-bold font-sans tracking-wide text-white uppercase mb-2">
                  DISASTER &amp; FLOOD RESPONSE
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed font-sans mb-4">
                  Rapid flood inundation boundary mapping, critical bridge access assessment, and disaster relief logistics guidance.
                </p>
              </div>
              <button 
                onClick={() => handleSelectScene('sample_3')}
                className="w-full py-2 px-3 rounded-lg bg-white/[0.03] hover:bg-orange-950/30 border border-white/10 hover:border-orange-500/30 text-gray-300 hover:text-orange-300 text-[10px] font-mono font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>INSPECT FLOOD TILE</span>
                <ArrowRight size={12} />
              </button>
            </div>

          </div>
        </section>

        {/* 6. RAG AGENT (INTELLIGENCE SECTION) */}
        <section ref={chatRef} id="ai-agent-section" className="flex flex-col gap-6 mb-8">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md bg-purple-950/60 border border-purple-500/30 text-[10px] font-mono text-purple-300 font-bold">
                GROUNDED RAG
              </span>
              <div>
                <h2 className="text-lg font-bold font-sans tracking-wide text-white uppercase">
                  AI ANALYSIS AGENT
                </h2>
                <div className="text-[10px] font-mono text-gray-400">
                  Grounded satellite intelligence powered by Cerebras LLaMA-3.1
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>ACTIVE CONTEXT GROUNDING</span>
            </div>
          </div>

          <ChatBot analysis={analysisMap[activeSampleId]} />
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.08] bg-[#030509] py-6 px-6 text-xs font-mono text-gray-500">
        <div className="max-w-[1920px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <span className="text-white font-semibold tracking-wider uppercase text-xs">SUPER RESOLUTION MAPPING</span>
            <span className="hidden sm:inline text-gray-700">|</span>
            <span className="text-gray-400 text-[11px]">AI-powered Sentinel-2 image enhancement</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-gray-500">
            <span className="text-gray-500">Smart India Hackathon 2026</span>
            <span className="text-gray-700">·</span>
            <span className="text-gray-500">© 2026</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
