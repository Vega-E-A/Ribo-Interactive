import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { CameraOrbitMode, VisualFXSettings } from '../types';
import { audioSingleton } from '../audio/cyberpunkAudio';
import { RIBBY_IMAGES, RIBBY_IMAGE_ARRAY } from '../assets/images';
import { 
  Play, Pause, RotateCw, Volume2, VolumeX, Maximize2, Minimize2, 
  Sparkles, Camera, Radio, Disc3, Layers, Compass
} from 'lucide-react';

interface Props {
  fxSettings: VisualFXSettings;
  orbitMode: CameraOrbitMode;
  onOrbitModeChange: (mode: CameraOrbitMode) => void;
  onTimeUpdate?: (time: number) => void;
}

export const VerticalVideoPlayer: React.FC<Props> = ({
  fxSettings,
  orbitMode,
  onOrbitModeChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const laserCanvasRef = useRef<HTMLCanvasElement>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // 0 to 10 seconds
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.45);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [manualAngle, setManualAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartAngle, setDragStartAngle] = useState(0);
  const [showHUD, setShowHUD] = useState(true);

  const loopDuration = 10.0; // 10.0s exact loop

  // Toggle play/pause
  const handleTogglePlay = useCallback(() => {
    const nextState = audioSingleton.toggle();
    setIsPlaying(nextState);
    // If playing, ensure auto-orbit is active so user gets full 4-screen loop
    if (nextState && (orbitMode === 'manual-drag' || orbitMode !== 'auto-orbit')) {
      onOrbitModeChange('auto-orbit');
    }
  }, [orbitMode, onOrbitModeChange]);

  // Handle Mute
  const handleToggleMute = useCallback(() => {
    if (isMuted) {
      audioSingleton.setVolume(volume);
      setIsMuted(false);
    } else {
      audioSingleton.setVolume(0);
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  // Handle Volume Change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (!isMuted) {
      audioSingleton.setVolume(val);
    }
  };

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Drag tracking ref
  const dragMovedRef = useRef(false);
  const autoResumeTimerRef = useRef<number | null>(null);

  // Manual Drag Orbit handling
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, a')) return;
    setIsDragging(true);
    dragMovedRef.current = false;
    setDragStartX(e.clientX);
    setDragStartAngle(manualAngle);
    if (autoResumeTimerRef.current) {
      clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX;
    if (Math.abs(deltaX) > 8) {
      dragMovedRef.current = true;
      if (orbitMode !== 'manual-drag') {
        onOrbitModeChange('manual-drag');
      }
      const newAngle = ((dragStartAngle + deltaX * 0.7) % 360 + 360) % 360;
      setManualAngle(newAngle);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    if (dragMovedRef.current) {
      // Auto-resume to auto-orbit after 3.5 seconds so user never gets permanently stuck on a 17° angle!
      if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = window.setTimeout(() => {
        onOrbitModeChange('auto-orbit');
      }, 3500);
    }
    dragMovedRef.current = false;
  };

  // Continuous 10-Second Animation & Timeline Loop
  const curTimeRef = useRef(0);

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      if (isPlaying) {
        let next = curTimeRef.current + dt;
        if (next >= loopDuration) {
          next = next % loopDuration;
        }
        curTimeRef.current = next;
        setCurrentTime(next);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, loopDuration]);

  // Compute Active Angle based on Mode & Time
  const activeOrbitAngle = useMemo(() => {
    if (orbitMode === 'manual-drag') {
      return manualAngle;
    }
    if (orbitMode === 'front-stage') return 0;
    if (orbitMode === 'side-orbit') return 65;
    if (orbitMode === 'closeup') return 140;
    if (orbitMode === 'wide-club') return 280;

    // 'auto-orbit': High-energy 10-second seamless camera orbit around Ribby
    const progress = (currentTime % loopDuration) / loopDuration;
    const baseOrbit = progress * 360;
    const cameraSway = Math.sin(progress * Math.PI * 4) * 8;
    return ((baseOrbit + cameraSway) % 360 + 360) % 360;
  }, [orbitMode, manualAngle, currentTime, loopDuration]);

  // Normalized angle in 0..360
  const normalizedAngle = ((activeOrbitAngle % 360) + 360) % 360;

  // Calculate weights for crossfade between the 4 shots
  const keyframeWeights = useMemo(() => {
    const w = [0, 0, 0, 0];

    // Single screen lock modes
    if (orbitMode === 'front-stage') {
      w[0] = 1.0;
      return w;
    }
    if (orbitMode === 'side-orbit') {
      w[1] = 1.0;
      return w;
    }
    if (orbitMode === 'closeup') {
      w[2] = 1.0;
      return w;
    }
    if (orbitMode === 'wide-club') {
      w[3] = 1.0;
      return w;
    }

    if (orbitMode === 'manual-drag') {
      // In manual drag, interpolate between nearest screens
      const step = (normalizedAngle / 90) % 4;
      const idx = Math.floor(step);
      const next = (idx + 1) % 4;
      const t = step - idx;
      w[idx] = 1 - t;
      w[next] = t;
      return w;
    }

    // Default 'auto-orbit': Seamlessly cycles through all 4 screens across the 10-second loop:
    // 0.0s - 2.5s: Screen 0 (Front Center Stage)
    // 2.5s - 5.0s: Screen 1 (3/4 Dynamic Orbit)
    // 5.0s - 7.5s: Screen 2 (Facial Focus & Piercings)
    // 7.5s - 10.0s: Screen 3 (Underground Club Wide)
    const tSec = currentTime % loopDuration;
    const currIdx = Math.min(3, Math.floor(tSec / 2.5));
    const nextIdx = (currIdx + 1) % 4;
    const subProgress = (tSec % 2.5) / 2.5; // 0.0 to 1.0 within this 2.5s window

    // Hold the current screen clearly for the first 82% (2.05s), then smooth 0.45s cinematic crossfade
    if (subProgress < 0.82) {
      w[currIdx] = 1.0;
    } else {
      const dissolve = (subProgress - 0.82) / 0.18; // 0 to 1
      w[currIdx] = 1.0 - dissolve;
      w[nextIdx] = dissolve;
    }

    return w;
  }, [orbitMode, normalizedAngle, currentTime, loopDuration]);

  // Current audio reactive levels (mellow, non-jarring)
  const bassLevel = audioSingleton.bassLevel;
  const isBeatHit = audioSingleton.isBeatHit && fxSettings.bassPulseIntensity > 0;
  const bassShake = isBeatHit ? (Math.random() * 2 - 1) * fxSettings.bassPulseIntensity * 0.6 : 0;
  const bassScale = 1 + bassLevel * 0.03 * fxSettings.bassPulseIntensity;

  // Dynamic Camera Orbit 3D perspective transform
  const orbitTranslateX = Math.sin((activeOrbitAngle * Math.PI) / 180) * 14;
  const orbitRotateY = Math.sin((activeOrbitAngle * Math.PI) / 180) * 6;
  const orbitRotateZ = Math.cos((activeOrbitAngle * Math.PI) / 180) * 1.0;

  // Render Volumetric Lasers Canvas
  useEffect(() => {
    const canvas = laserCanvasRef.current;
    if (!canvas || !fxSettings.volumetricLasers) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const renderLasers = () => {
      t += 0.015;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      if (!isPlaying && !fxSettings.volumetricLasers) {
        animId = requestAnimationFrame(renderLasers);
        return;
      }

      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const audioEnergy = audioSingleton.bassLevel * 1.2 + 0.35;
      const laserPower = fxSettings.laserIntensity * audioEnergy;

      // Color scheme
      let primaryColor = 'rgba(6, 182, 212, '; // Cyan
      let secondaryColor = 'rgba(236, 72, 153, '; // Magenta
      let tertiaryColor = 'rgba(168, 85, 247, '; // Purple

      if (fxSettings.laserColorPalette === 'toxic-emerald') {
        primaryColor = 'rgba(16, 185, 129, ';
        secondaryColor = 'rgba(234, 179, 8, ';
        tertiaryColor = 'rgba(6, 182, 212, ';
      } else if (fxSettings.laserColorPalette === 'ribo-violet') {
        primaryColor = 'rgba(192, 38, 211, ';
        secondaryColor = 'rgba(99, 102, 241, ';
        tertiaryColor = 'rgba(236, 72, 153, ';
      } else if (fxSettings.laserColorPalette === 'amber-pulse') {
        primaryColor = 'rgba(245, 158, 11, ';
        secondaryColor = 'rgba(239, 68, 68, ';
        tertiaryColor = 'rgba(251, 191, 36, ';
      }

      // Ceiling Trusses Laser Origin (Top Center of club)
      const originX = w * 0.5 + Math.sin(t * 0.5) * 35;
      const originY = -25;

      // 6 Soft Volumetric Laser Beam Cones
      const beamCount = 6;
      for (let i = 0; i < beamCount; i++) {
        const angleOffset = (i - (beamCount - 1) / 2) * 0.26;
        const sweepAngle = angleOffset + Math.sin(t * 1.2 + i * 0.7) * 0.3;

        const targetX = originX + Math.sin(sweepAngle) * h * 1.3;
        const targetY = h + 50;

        const grad = ctx.createLinearGradient(originX, originY, targetX, targetY);
        const col = i % 2 === 0 ? primaryColor : (i % 3 === 0 ? secondaryColor : tertiaryColor);
        const alpha = Math.min(0.75, 0.22 * laserPower);

        grad.addColorStop(0, `${col} ${alpha * 1.4})`);
        grad.addColorStop(0.35, `${col} ${alpha * 0.7})`);
        grad.addColorStop(0.7, `${col} ${alpha * 0.35})`);
        grad.addColorStop(1, `${col} 0)`);

        ctx.beginPath();
        const beamSpread = 28 + audioSingleton.bassLevel * 20;
        ctx.moveTo(originX - 4, originY);
        ctx.lineTo(originX + 4, originY);
        ctx.lineTo(targetX + beamSpread, targetY);
        ctx.lineTo(targetX - beamSpread, targetY);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.restore();
      animId = requestAnimationFrame(renderLasers);
    };

    renderLasers();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, fxSettings.volumetricLasers, fxSettings.laserIntensity, fxSettings.laserColorPalette]);

  // Format time display (00:00.00)
  const formatTime = (secs: number) => {
    const s = Math.floor(secs);
    const ms = Math.floor((secs % 1) * 100);
    return `${s.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  };

  const images = [
    RIBBY_IMAGES.front,
    RIBBY_IMAGES.orbit,
    RIBBY_IMAGES.closeup,
    RIBBY_IMAGES.wide,
  ];

  const currentScreenIndex = Math.min(3, Math.floor((currentTime % loopDuration) / 2.5));

  return (
    <div 
      ref={containerRef}
      className={`relative flex flex-col items-center justify-center bg-zinc-950 select-none ${
        isFullscreen ? 'fixed inset-0 z-50 p-0' : 'w-full py-1'
      }`}
    >
      {/* 9:16 Vertical Cinema Container */}
      <div 
        className="relative aspect-[9/16] w-full max-w-[420px] sm:max-w-[440px] md:max-w-[460px] h-auto max-h-[85vh] rounded-2xl overflow-hidden bg-black shadow-2xl shadow-cyan-950/40 border border-zinc-800/80 group"
        style={{ perspective: '1200px' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* 3D Moving Camera Rig */}
        <div 
          className="absolute inset-0 w-full h-full transition-transform duration-75 ease-out will-change-transform"
          style={{
            transform: `translate3d(${orbitTranslateX + bassShake}px, ${bassShake * 0.5}px, 0px) rotateY(${orbitRotateY}deg) rotateZ(${orbitRotateZ}deg) scale(${bassScale})`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* 4 Multi-Angle Screens with Seamless Crossfade */}
          {images.map((imgSrc, idx) => {
            const weight = keyframeWeights[idx];
            if (weight <= 0.001) return null;
            return (
              <div 
                key={idx}
                className="absolute inset-0 w-full h-full will-change-opacity pointer-events-none"
                style={{
                  opacity: Math.max(0, Math.min(1, weight)),
                  zIndex: Math.round(weight * 10),
                }}
              >
                <img
                  src={imgSrc}
                  alt={`Ribby Angle ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center filter saturate-105 contrast-105"
                  draggable={false}
                />
              </div>
            );
          })}

          {/* Sub-Dermal Cyan Circuit Glow Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none mix-blend-screen transition-opacity duration-100"
            style={{
              opacity: fxSettings.subdermalCircuitGlow * (0.35 + bassLevel * 0.5),
            }}
          >
            <svg className="w-full h-full" viewBox="0 0 1000 1777" fill="none" preserveAspectRatio="none">
              <defs>
                <filter id="circuit-neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="cyan-circuit-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.7" />
                </linearGradient>
              </defs>

              <g filter="url(#circuit-neon-glow)" stroke="url(#cyan-circuit-grad)">
                <path d="M 460 620 L 480 660 L 510 680 L 510 730" strokeWidth="2.5" strokeDasharray="6 3" />
                <path d="M 540 620 L 520 660 L 490 680 L 490 730" strokeWidth="2.5" strokeDasharray="6 3" />
                <path d="M 430 520 L 470 540 L 490 520 L 510 520 L 530 540 L 570 520" strokeWidth="2" />
                <circle cx="470" cy="540" r="2.5" fill="#22d3ee" />
                <circle cx="530" cy="540" r="2.5" fill="#22d3ee" />
                <path d="M 420 400 L 440 450 L 450 490" strokeWidth="3" />
                <path d="M 580 400 L 560 450 L 550 490" strokeWidth="3" />
              </g>
            </svg>
          </div>

          {/* Canvas Volumetric Laser Light Beams */}
          <canvas
            ref={laserCanvasRef}
            width={720}
            height={1280}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              opacity: fxSettings.volumetricLasers ? 1 : 0,
            }}
          />

          {/* Background Neon 'RIBO' Signage */}
          <div className="absolute top-[6%] left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center">
            <div 
              className={`w-7 h-7 mb-0.5 transition-all duration-75 ${isBeatHit ? 'scale-105 opacity-100' : 'opacity-90'}`}
              style={{ filter: `drop-shadow(0 0 ${8 + bassLevel * 10}px #f97316)` }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-amber-400 stroke-[5]">
                <path d="M 30 75 C 20 40 10 15 35 15 C 45 15 42 45 50 60 C 58 45 55 15 65 15 C 90 15 80 40 70 75" />
                <path d="M 40 68 L 50 78 L 60 68" />
              </svg>
            </div>
            <div 
              className="font-cyber text-3xl sm:text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-500"
              style={{
                filter: `drop-shadow(0 0 ${10 + bassLevel * 15}px rgba(244, 63, 94, 0.8))`,
                textShadow: '0 0 15px #f43f5e',
              }}
            >
              RIBO
            </div>
            <div className="font-hud text-[8px] tracking-[0.25em] uppercase text-amber-300/80 mt-0.5">
              OWN THE MUSIC · KEEP THE RIGHTS
            </div>
          </div>

          {/* Shallow Depth of Field Crowd Silhouette */}
          {fxSettings.depthOfFieldBlur && (
            <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none flex items-end justify-between px-3 overflow-hidden">
              <div 
                className="w-16 h-28 rounded-t-full bg-zinc-950/80 blur-sm transform -translate-x-3 translate-y-6"
                style={{ transform: `translate3d(${-10 + orbitTranslateX * 0.3}px, 16px, 0)` }}
              />
              <div 
                className="w-20 h-36 rounded-t-full bg-zinc-950/85 blur-[2px] transform translate-y-8"
                style={{ transform: `translate3d(${orbitTranslateX * 0.15}px, 22px, 0)` }}
              />
              <div 
                className="w-16 h-32 rounded-t-full bg-zinc-950/90 blur-sm transform translate-x-4 translate-y-6"
                style={{ transform: `translate3d(${12 + orbitTranslateX * 0.25}px, 18px, 0)` }}
              />
            </div>
          )}

          {/* Hologram Scanlines */}
          {fxSettings.hologramScanlines && (
            <div className="absolute inset-0 cyber-scanlines opacity-30 pointer-events-none" />
          )}
        </div>

        {/* Top HUD Overlay */}
        <div className={`absolute top-0 inset-x-0 p-3 flex items-start justify-between z-20 transition-opacity duration-300 ${showHUD ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-hud font-bold text-xs tracking-wider text-emerald-400 uppercase">
                10S SEAMLESS LOOP
              </span>
            </div>
            <div className="font-cyber text-xs font-bold text-white tracking-wider mt-0.5">
              RIBBY // REBEL RABBIT
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Screen indicator pill */}
            <div className="px-2 py-0.5 rounded bg-black/75 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold">
              SCREEN {currentScreenIndex + 1}/4
            </div>

            {/* Fullscreen button */}
            <button
              onClick={handleToggleFullscreen}
              className="p-1.5 rounded-lg bg-black/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>

        {/* Center Play Prompt when paused */}
        {!isPlaying && (
          <div 
            onClick={handleTogglePlay}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] z-30 cursor-pointer group-hover:bg-black/30 transition-colors"
          >
            <div className="w-16 h-16 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-lg shadow-cyan-500/50 transform group-hover:scale-110 transition-transform">
              <Play size={28} className="translate-x-0.5 fill-black" />
            </div>
            <div className="mt-3 font-cyber text-sm font-bold tracking-wider text-cyan-300">
              PLAY 10S MOTION LOOP
            </div>
            <div className="font-hud text-xs text-zinc-300 mt-1">
              {audioSingleton.songTitle} · Mellow Soundtrack
            </div>
          </div>
        )}

        {/* Manual Drag Warning / Resume Button (Prevents ever getting stuck on 17°) */}
        {orbitMode === 'manual-drag' && (
          <div className="absolute top-12 inset-x-3 z-30 flex items-center justify-between p-2 rounded-lg bg-black/85 border border-amber-500/60 shadow-lg text-xs font-hud">
            <span className="text-amber-300 flex items-center gap-1.5 font-mono">
              <Camera size={13} className="text-amber-400" />
              Manual Angle: {Math.round(manualAngle)}°
            </span>
            <button
              onClick={() => onOrbitModeChange('auto-orbit')}
              className="py-1 px-2.5 rounded bg-cyan-500 text-black font-cyber text-[10px] font-bold flex items-center gap-1 shadow-sm hover:bg-cyan-400"
            >
              <RotateCw size={11} />
              Resume 4-Screen Auto Cycle
            </button>
          </div>
        )}

        {/* Bottom Interactive HUD & Timecode Scrub */}
        <div className={`absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent z-20 flex flex-col gap-2 transition-opacity duration-300 ${showHUD ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {/* Loop Progress Bar */}
          <div 
            className="relative w-full h-1.5 bg-zinc-800/80 rounded-full overflow-hidden cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              const t = Math.max(0, Math.min(loopDuration, pct * loopDuration));
              curTimeRef.current = t;
              setCurrentTime(t);
              if (orbitMode !== 'auto-orbit') onOrbitModeChange('auto-orbit');
            }}
          >
            <div 
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-500 via-pink-500 to-emerald-400 rounded-full transition-all duration-75"
              style={{ width: `${(currentTime / loopDuration) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-zinc-300">
            {/* Play/Pause & Timecode */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePlay}
                className="p-1.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors"
              >
                {isPlaying ? <Pause size={13} /> : <Play size={13} className="fill-current" />}
              </button>

              <div className="font-cyber text-xs tracking-wider text-cyan-400">
                {formatTime(currentTime)}
                <span className="text-zinc-500 mx-1">/</span>
                <span className="text-zinc-400">10:00</span>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-hud font-semibold uppercase ml-1">
                <RotateCw size={11} className={isPlaying ? 'animate-spin' : ''} />
                LOOP
              </div>
            </div>

            {/* Audio Mute & Volume */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToggleMute}
                className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                title="Mute/Unmute"
              >
                {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 h-1 accent-cyan-400 bg-zinc-800 rounded appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Interactive Drag Orbit Prompt */}
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 font-hud text-[11px] text-zinc-400">
            <span className="flex items-center gap-1">
              <Camera size={11} className="text-cyan-400" />
              Angle: {Math.round(activeOrbitAngle)}° (Drag to pivot camera)
            </span>
            <span className="text-zinc-400 font-mono text-[10px]">
              {audioSingleton.songTitle}
            </span>
          </div>
        </div>

        {/* HUD Toggle Hotkey Button (Corner) */}
        <button
          onClick={() => setShowHUD(!showHUD)}
          className="absolute top-2.5 right-12 z-20 p-1.5 rounded bg-black/40 hover:bg-black/80 text-zinc-400 hover:text-white text-[10px] font-hud uppercase"
          title="Toggle HUD Display"
        >
          {showHUD ? 'HUD ON' : 'HUD OFF'}
        </button>
      </div>

      {/* 4-Screen Loop Timeline & Screen Selector */}
      <div className="mt-3 w-full max-w-[440px] flex flex-col gap-1.5 p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
        <div className="flex items-center justify-between px-1 text-[11px] font-hud text-zinc-400">
          <span className="flex items-center gap-1.5 font-cyber text-cyan-300 font-bold">
            <RotateCw size={11} className={isPlaying ? 'animate-spin' : ''} />
            10S 4-SCREEN LOOP CYCLE
          </span>
          <span className="font-mono text-cyan-400">
            CURRENT: SCREEN {currentScreenIndex + 1}/4
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 p-0.5 rounded-lg bg-black/60 border border-zinc-800/80">
          <button
            onClick={() => {
              onOrbitModeChange('auto-orbit');
            }}
            className={`py-1.5 px-2 rounded-md text-[11px] font-hud font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
              orbitMode === 'auto-orbit'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <RotateCw size={11} className={orbitMode === 'auto-orbit' && isPlaying ? 'animate-spin' : ''} />
            Auto Cycle
          </button>

          {RIBBY_IMAGE_ARRAY.map((scr, idx) => {
            const isScreenActive = currentScreenIndex === idx && orbitMode === 'auto-orbit';
            const startTimeSec = idx * 2.5;
            return (
              <button
                key={scr.id}
                onClick={() => {
                  curTimeRef.current = startTimeSec;
                  setCurrentTime(startTimeSec);
                  onOrbitModeChange('auto-orbit');
                }}
                className={`flex-1 py-1 px-1 rounded-md text-[11px] font-hud font-semibold transition-all text-center ${
                  isScreenActive
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                }`}
                title={`${scr.title} (${startTimeSec}s)`}
              >
                {scr.shortTitle}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
