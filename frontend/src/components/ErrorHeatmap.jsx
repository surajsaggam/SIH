import React, { useEffect, useRef, useState } from 'react';
import { Activity, AlertTriangle } from 'lucide-react';

export default function ErrorHeatmap({ aiSrc, refSrc }) {
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

        // Yellow for low error, Red for high error
        // Yellow: [255, 255, 0], Red: [255, 0, 0]
        let r = 255;
        let g = 255 * (1 - curved);
        let b = 0;

        heatmapData[i] = r;
        heatmapData[i + 1] = g;
        heatmapData[i + 2] = b;
        heatmapData[i + 3] = 255; // Alpha
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
      <div className="border border-gray-800 bg-black/40 p-5 rounded-sm flex flex-col h-full min-h-[300px]">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Activity size={12} className="text-mission-orange" /> RECONSTRUCTION ERROR VS GROUND TRUTH
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-700 rounded-sm bg-black/50 p-6 text-center h-full">
          <AlertTriangle size={24} className="text-gray-600 mb-2" />
          <div className="text-xs font-bold text-gray-400 mb-1">DATA UNAVAILABLE</div>
          <div className="text-[10px] font-mono text-gray-500 max-w-[200px]">
            No ground truth reference available for live uploads to compute MAE.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-800 bg-black/40 p-5 rounded-sm flex flex-col h-full">
      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Activity size={12} className="text-mission-orange" /> RECONSTRUCTION ERROR VS GROUND TRUTH
      </h3>
      
      <div className="flex-1 flex flex-col">
        <div className="flex gap-4 mb-4">
          {/* Heatmap Canvas Container */}
          <div className="flex-1 relative border border-gray-800 bg-black overflow-hidden flex items-center justify-center h-[200px]">
            {isComputing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <span className="text-[10px] font-mono text-mission-cyan animate-pulse">COMPUTING ERROR MAP...</span>
              </div>
            )}
            <canvas ref={canvasRef} className="max-w-full max-h-[200px] object-contain w-full h-auto" />
            <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 text-[9px] font-mono text-gray-400 border border-gray-700 backdrop-blur-sm pointer-events-none">
              PIXEL ERROR MAGNITUDE
            </div>
          </div>
          
          {/* Color Scale Bar */}
          <div className="w-6 flex flex-col border border-gray-800">
            <div 
              className="flex-1 w-full"
              style={{
                background: 'linear-gradient(to bottom, #FF0000 0%, #FFFF00 100%)'
              }}
            ></div>
          </div>
          <div className="flex flex-col justify-between text-[9px] font-mono text-gray-500 py-1">
            <span>HIGH</span>
            <span>ERROR</span>
            <div className="flex-1"></div>
            <span>LOW</span>
            <span>ERROR</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-auto">
          <div className="bg-gray-900/50 border border-gray-800 p-3 flex flex-col justify-center">
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">MEAN ABSOLUTE ERROR</span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-xl text-mission-orange">
                {mae !== null ? mae.toFixed(2) : '--'}
              </span>
            </div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 p-3 flex flex-col justify-center">
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">MAXIMUM ERROR</span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-xl text-red-500">
                {maxError !== null ? maxError.toFixed(1) : '--'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
