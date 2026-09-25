import React, { useEffect, useRef, useState } from 'react';
import { Activity, AlertTriangle } from 'lucide-react';

export default function ErrorHeatmap({ aiSrc, refSrc, isPairedReference = true }) {
  const canvasRef = useRef(null);
  const [mae, setMae] = useState(null);
  const [maxError, setMaxError] = useState(null);
  const [isComputing, setIsComputing] = useState(false);

  useEffect(() => {
    if (!aiSrc || !refSrc) {
      setMae(null);
      setMaxError(null);
      return;
    }

    let isMounted = true;
    setIsComputing(true);

    const imgAI = new Image();
    const imgRef = new Image();
    imgAI.crossOrigin = 'Anonymous';
    imgRef.crossOrigin = 'Anonymous';

    Promise.all([
      new Promise((resolve, reject) => {
        imgAI.onload = resolve;
        imgAI.onerror = reject;
        imgAI.src = aiSrc;
      }),
      new Promise((resolve, reject) => {
        imgRef.onload = resolve;
        imgRef.onerror = reject;
        imgRef.src = refSrc;
      })
    ]).then(() => {
      if (!isMounted) return;
      
      const width = imgAI.width;
      const height = imgAI.height;

      const canvasAI = document.createElement('canvas');
      const canvasRefImg = document.createElement('canvas');
      canvasAI.width = width; canvasAI.height = height;
      canvasRefImg.width = width; canvasRefImg.height = height;

      const ctxAI = canvasAI.getContext('2d');
      const ctxRef = canvasRefImg.getContext('2d');

      // Draw original images
      ctxAI.drawImage(imgAI, 0, 0, width, height);
      ctxRef.drawImage(imgRef, 0, 0, width, height);

      const dataAI = ctxAI.getImageData(0, 0, width, height).data;
      const dataRef = ctxRef.getImageData(0, 0, width, height).data;

      const heatmapData = new Uint8ClampedArray(width * height * 4);
      let sumErr = 0;
      let maxErr = 0;

      for (let i = 0; i < dataAI.length; i += 4) {
        // Mean absolute error for this pixel across RGB channels
        const errR = Math.abs(dataAI[i] - dataRef[i]);
        const errG = Math.abs(dataAI[i + 1] - dataRef[i + 1]);
        const errB = Math.abs(dataAI[i + 2] - dataRef[i + 2]);
        const pixelErr = (errR + errG + errB) / 3;

        sumErr += pixelErr;
        if (pixelErr > maxErr) maxErr = pixelErr;

        // Apply gamma to boost visibility of small errors
        const normalized = pixelErr / 255.0;
        const curved = Math.pow(normalized, 0.5); // Gamma 0.5

        let r = 255;
        let g = 255 * (1 - curved);
        let b = 0;

        heatmapData[i] = r;
        heatmapData[i + 1] = g;
        heatmapData[i + 2] = b;
        heatmapData[i + 3] = 255;
      }

      if (isMounted) {
        setMae(sumErr / (width * height));
        setMaxError(maxErr);

        if (canvasRef.current) {
          const outCtx = canvasRef.current.getContext('2d');
          canvasRef.current.width = width;
          canvasRef.current.height = height;
          outCtx.putImageData(new ImageData(heatmapData, width, height), 0, 0);
        }
        setIsComputing(false);
      }
    }).catch(err => {
      console.error("Failed to generate heatmap:", err);
      if (isMounted) setIsComputing(false);
    });

    return () => { isMounted = false; };
  }, [aiSrc, refSrc]);

  if (!refSrc) {
    return (
      <div className="cosmic-panel p-5 rounded-xl border border-white/[0.08] bg-[#080D18]/80 flex flex-col h-full min-h-[260px] justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Activity size={12} className="text-orange-400" />
            <span>RECONSTRUCTION ERROR // PIXEL HEATMAP</span>
          </h3>
          <span className="text-[9px] font-mono text-gray-500 uppercase">GROUND TRUTH</span>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-lg bg-black/40 p-6 text-center my-3">
          <AlertTriangle size={24} className="text-gray-600 mb-2" />
          <div className="text-xs font-mono font-bold text-gray-300 mb-1 uppercase tracking-wider">REFERENCE NOT ATTACHED</div>
          <p className="text-[10px] font-mono text-gray-500 max-w-[260px] leading-relaxed">
            Ground-truth VENµS high-resolution reference is unavailable for live inference uploads. PSNR/MAE computation requires paired ground truth.
          </p>
        </div>

        <div className="text-[9px] font-mono text-gray-600 flex items-center gap-1.5 pt-2 border-t border-white/[0.06]">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
          <span>Scientific integrity preserved (no synthetic metrics generated)</span>
        </div>
      </div>
    );
  }

  return (
    <div className="cosmic-panel p-5 rounded-xl border border-white/[0.08] bg-[#080D18]/80 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
        <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Activity size={12} className="text-orange-400" />
          <span>{isPairedReference ? 'RECONSTRUCTION ERROR // GROUND TRUTH COMPARISON' : 'RECONSTRUCTION ERROR // RESIDUAL HEATMAP'}</span>
        </h3>
        <span className="text-[9px] font-mono text-cyan-400 font-semibold px-2 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/20">
          {isPairedReference ? 'VENµS PAIRED' : 'INPUT REFERENCE'}
        </span>
      </div>
      
      <div className="flex-1 flex flex-col justify-between min-h-0">
        <div className="flex-1 min-h-[220px] flex gap-4 mb-4">
          {/* Heatmap Canvas Container */}
          <div className="flex-1 h-full min-h-[200px] relative border border-white/10 rounded-lg bg-black overflow-hidden flex items-center justify-center p-2">
            {isComputing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <span className="text-[10px] font-mono text-cyan-400 animate-pulse">COMPUTING PIXEL ERROR MAP...</span>
              </div>
            )}
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain block m-auto" />
            <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 text-[9px] font-mono text-gray-400 border border-white/10 rounded-xs backdrop-blur-sm pointer-events-none">
              PIXEL ERROR RESIDUAL
            </div>
          </div>
          
          {/* Color Scale Bar */}
          <div className="w-5 h-full flex flex-col border border-white/10 rounded-sm overflow-hidden">
            <div 
              className="flex-1 w-full"
              style={{
                background: 'linear-gradient(to bottom, #FF0000 0%, #FFFF00 100%)'
              }}
            />
          </div>
          <div className="flex flex-col justify-between text-[9px] font-mono text-gray-500 py-1 select-none">
            <span className="text-red-400 font-bold">MAX</span>
            <span className="text-yellow-400 font-semibold">MID</span>
            <span className="text-gray-400">MIN</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mt-auto pt-2">
          <div className="bg-black/40 border border-white/[0.08] p-3 rounded-lg flex flex-col justify-center">
            <span className="text-[9px] font-mono text-gray-500 font-bold uppercase tracking-widest mb-1">
              MEAN ABSOLUTE ERROR (MAE)
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-orange-400">
                {mae !== null ? mae.toFixed(2) : '--'}
              </span>
              <span className="text-[10px] font-mono text-gray-500">px</span>
            </div>
          </div>

          <div className="bg-black/40 border border-white/[0.08] p-3 rounded-lg flex flex-col justify-center">
            <span className="text-[9px] font-mono text-gray-500 font-bold uppercase tracking-widest mb-1">
              MAXIMUM ERROR
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold text-red-400">
                {maxError !== null ? maxError.toFixed(1) : '--'}
              </span>
              <span className="text-[10px] font-mono text-gray-500">px</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
