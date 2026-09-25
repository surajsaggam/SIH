import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'lucide-react';

/**
 * CinematicIntro — Procedural gravitational-lensing / black-hole accretion disk intro animation
 * inspired by deep-space AI satellite boot sequence.
 * 
 * Target duration: ~2.5 - 3.0 seconds.
 * Procedural HTML5 Canvas with zero heavy external dependencies.
 */
export default function CinematicIntro({ onComplete }) {
  const canvasRef = useRef(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [bootText, setBootText] = useState('INITIALIZING MULTISPECTRAL SENSORS...');
  const [progress, setProgress] = useState(0);
  const animationFrameId = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onComplete?.();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate background space particles
    const particleCount = 140;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.7 + 0.1,
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: (Math.random() - 0.5) * 0.2,
        pulseSpeed: Math.random() * 0.03 + 0.01,
      });
    }

    const duration = 2800; // total duration in ms
    let hasTriggeredFade = false;

    const render = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progressRatio = Math.min(1, elapsed / duration);
      
      setProgress(Math.floor(progressRatio * 100));

      if (elapsed > 800 && elapsed < 1600) {
        setBootText('CALIBRATING GRAVITATIONAL LENSING & OPTICS...');
      } else if (elapsed >= 1600 && elapsed < 2300) {
        setBootText('ENGAGING SWINIR ×4 SUPER-RESOLUTION ENGINE...');
      } else if (elapsed >= 2300) {
        setBootText('SYSTEM ONLINE // WELCOME TO SRM-26142');
      }

      // Trigger fade out at 2400ms
      if (elapsed >= 2400 && !hasTriggeredFade) {
        hasTriggeredFade = true;
        setIsFadingOut(true);
        setTimeout(() => {
          onComplete?.();
        }, 600);
      }

      // Clear with deep space canvas
      ctx.fillStyle = '#030509';
      ctx.fillRect(0, 0, width, height);

      // Center coords (slightly right-center on wide screens)
      const cx = width > 1024 ? width * 0.55 : width * 0.5;
      const cy = height * 0.48;

      // ── 1. Draw Starfield Particles ──
      for (let p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const currentAlpha = p.alpha + Math.sin(timestamp * p.pulseSpeed) * 0.2;
        ctx.fillStyle = `rgba(180, 230, 255, ${Math.max(0, Math.min(1, currentAlpha * Math.min(1, elapsed / 600)))})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── 2. Atmospheric & Ambient Accretion Glow ──
      if (elapsed > 400) {
        const glowPhase = Math.min(1, (elapsed - 400) / 1200);
        const glowRadius = 220 + glowPhase * 60;
        const ambientGlow = ctx.createRadialGradient(cx, cy, 30, cx, cy, glowRadius);
        ambientGlow.addColorStop(0, `rgba(0, 217, 255, ${0.18 * glowPhase})`);
        ambientGlow.addColorStop(0.35, `rgba(13, 71, 161, ${0.12 * glowPhase})`);
        ambientGlow.addColorStop(0.7, `rgba(0, 240, 255, ${0.04 * glowPhase})`);
        ambientGlow.addColorStop(1, 'rgba(3, 5, 9, 0)');

        ctx.fillStyle = ambientGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── 3. Accretion Disk / Curved Relativistic Ring ──
      if (elapsed > 600) {
        const sweepProgress = Math.min(1, (elapsed - 600) / 1400); // 0 to 1
        const diskRadiusX = 170;
        const diskRadiusY = 48; // perspective flattening
        const voidRadius = 65;

        ctx.save();
        ctx.translate(cx, cy);

        // Rotation tilt
        ctx.rotate(-0.18);

        // Sweeping luminous ring (Accretion disk behind & around void)
        const sweepAngle = sweepProgress * Math.PI * 2;

        // Outer glowing accretion band
        ctx.lineWidth = 14;
        const ringGrad = ctx.createLinearGradient(-diskRadiusX, 0, diskRadiusX, 0);
        ringGrad.addColorStop(0, 'rgba(0, 217, 255, 0.85)');
        ringGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.95)');
        ringGrad.addColorStop(0.7, 'rgba(0, 180, 255, 0.6)');
        ringGrad.addColorStop(1, 'rgba(0, 100, 220, 0.2)');

        ctx.strokeStyle = ringGrad;
        ctx.shadowColor = '#00D9FF';
        ctx.shadowBlur = 24 * sweepProgress;

        // Draw sweeping elliptical arc
        ctx.beginPath();
        ctx.ellipse(0, 0, diskRadiusX, diskRadiusY, 0, -Math.PI * 0.8, -Math.PI * 0.8 + sweepAngle);
        ctx.stroke();

        // ── 4. Gravitational Lensing Arc (Bending light over the top) ──
        if (sweepProgress > 0.3) {
          const lensPhase = (sweepProgress - 0.3) / 0.7;
          ctx.beginPath();
          ctx.lineWidth = 8;
          ctx.strokeStyle = `rgba(180, 245, 255, ${0.85 * lensPhase})`;
          ctx.shadowColor = '#00F0FF';
          ctx.shadowBlur = 30 * lensPhase;
          // Upper lens crest
          ctx.ellipse(0, -18, voidRadius * 1.35, voidRadius * 1.05, 0, Math.PI * 0.9, Math.PI * 2.1);
          ctx.stroke();

          // Secondary faint bottom counter-arc
          ctx.beginPath();
          ctx.lineWidth = 4;
          ctx.strokeStyle = `rgba(0, 217, 255, ${0.4 * lensPhase})`;
          ctx.shadowBlur = 15;
          ctx.ellipse(0, 16, voidRadius * 1.25, voidRadius * 0.65, 0, 0, Math.PI);
          ctx.stroke();
        }

        // ── 5. The Event Horizon (Dark Void Core) ──
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#030509';
        ctx.beginPath();
        ctx.arc(0, 0, voidRadius, 0, Math.PI * 2);
        ctx.fill();

        // Intense inner photon ring edge
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = `rgba(0, 217, 255, ${0.9 * Math.min(1, sweepProgress * 1.2)})`;
        ctx.shadowColor = '#00D9FF';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, voidRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Front half of the accretion disk (passes in front of event horizon)
        if (sweepProgress > 0.5) {
          const frontPhase = (sweepProgress - 0.5) / 0.5;
          ctx.lineWidth = 10;
          ctx.strokeStyle = `rgba(0, 230, 255, ${0.9 * frontPhase})`;
          ctx.shadowColor = '#00D9FF';
          ctx.shadowBlur = 20 * frontPhase;
          ctx.beginPath();
          ctx.ellipse(0, 0, diskRadiusX * 0.95, diskRadiusY * 0.95, 0, 0, Math.PI * frontPhase);
          ctx.stroke();
        }

        ctx.restore();
      }

      // ── 6. Shockwave Ring Expansion at ~2.0s ──
      if (elapsed > 2000) {
        const shockPhase = (elapsed - 2000) / 700;
        const shockRadius = 80 + shockPhase * 240;
        const shockAlpha = Math.max(0, (1 - shockPhase) * 0.4);

        ctx.save();
        ctx.strokeStyle = `rgba(0, 217, 255, ${shockAlpha})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00D9FF';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(cx, cy, shockRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (elapsed < duration + 700) {
        animationFrameId.current = requestAnimationFrame(render);
      }
    };

    animationFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete?.();
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-10 pointer-events-auto transition-opacity duration-700 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#030509' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />

      {/* Top Header Telemetry */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
            SRM-26142 // SATELLITE SYSTEM BOOT
          </span>
        </div>

        <button
          onClick={handleSkip}
          className="px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-cyan-500/40 text-[10px] font-mono tracking-widest text-gray-400 hover:text-cyan-300 uppercase transition-all cursor-pointer"
        >
          SKIP INTRO [ESC]
        </button>
      </div>

      {/* Bottom Telemetry HUD */}
      <div className="relative z-10 max-w-xl">
        <div className="flex items-center gap-2 mb-2 text-cyan-400 text-xs font-mono">
          <Terminal size={14} className="animate-pulse" />
          <span className="tracking-wider uppercase">{bootText}</span>
        </div>

        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden border border-white/10">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 mt-2">
          <span>MISSION: SIH 2026</span>
          <span className="text-cyan-400 font-bold">{progress}%</span>
          <span>OPTICS: SENTINEL-2 L2A</span>
        </div>
      </div>
    </div>
  );
}
