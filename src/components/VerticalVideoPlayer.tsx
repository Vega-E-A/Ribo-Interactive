import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { RibbyKeyframe, CameraOrbitMode, VisualFXSettings } from '../types';
import { audioSingleton } from '../audio/cyberpunkAudio';
import { 
  Play, Pause, RotateCw, Volume2, VolumeX, Maximize2, Minimize2, 
  Sparkles, Camera, Radio, Disc3, ShieldAlert
} from 'lucide-react';

interface Props {
  fxSettings: VisualFXSettings;
  orbitMode: CameraOrbitMode;
  onOrbitModeChange: (mode: CameraOrbitMode) => void;
  onTimeUpdate?: (time: number) => void;
}

const KEYFRAMES: RibbyKeyframe[] = [
  {
    id: 'kf-front',
    title: 'Front Center Stage',
    description: 'Ribby high-energy dance with maroon jacket, volumetric cyan lasers & RIBO neon sign',
    imageSrc: '/src/assets/images/ribby_rebel_dance_front_1791393508947.jpg',
    orbitAngle: 0,
    cameraDistance: 1.0,
    cameraHeight: 0,
  },
  {
    id: 'kf-orbit',
    title: '3/4 Dynamic Orbit',
    description: 'Sweeping camera orbit with pierced ears, pick necklace & maroon biker jacket flare',
    imageSrc: '/src/assets/images/ribby_camera_orbit_angle_1791393519291.jpg',
    orbitAngle: 65,
    cameraDistance: 1.15,
    cameraHeight: 5,
  },
  {
    id: 'kf-closeup',
    title: 'Facial Focus & Piercings',
    description: 'Sharp focus on purple eyes, ear rings, glowing headphones, and cyan circuits',
    imageSrc: '/src/assets/images/ribby_closeup_focus_1791393530166.jpg',
    orbitAngle: 140,
    cameraDistance: 1.35,
    cameraHeight: -5,
  },
  {
    id: 'kf-wide',
    title: 'Underground Club Wide',
    description: 'Packed cyber crowd dancefloor and giant RIBO neon wall with rabbit ears symbol',
    imageSrc: '/src/assets/images/ribby_wide_club_stage_1791393541142.jpg',
    orbitAngle: 280,
    cameraDistance: 0.95,
    cameraHeight: 2,
  },
];

export const VerticalVideoPlayer: React.FC<Props> = ({
  fxSettings,
  orbitMode,
  onOrbitModeChange,
  onTimeUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const laserCanvasRef = useRef<HTMLCanvasElement>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // 0 to 10 seconds
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [manualAngle, setManualAngle] = useState(0); // -180 to 180 degrees
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartAngle, setDragStartAngle] = useState(0);
  const [cameraZoom, setCameraZoom] = useState(1.0);
  const [vocalDropActive, setVocalDropActive] = useState(false);
  const [showHUD, setShowHUD] = useState(true);

  const loopDuration = 10.0; // 10.0s exact loop

  // Toggle play/pause
  const handleTogglePlay = useCallback(() => {
    const nextState = audioSingleton.toggle();
    setIsPlaying(nextState);
    if (nextState && orbitMode === 'manual-drag') {
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

  // Manual Drag Orbit handling
  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent dragging when clicking interactive buttons
    if ((e.target as HTMLElement).closest('button, input, a')) return;
    setIsDragging(true);
    dragMovedRef.current = false;
    setDragStartX(e.clientX);
    setDragStartAngle(manualAngle);
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
    dragMovedRef.current = false;
  };

  // 10-Second Time Update & Animation Loop
  const curTimeRef = useRef(0);

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      if (isPlaying) {
        // Continuous smooth 10.0-second playhead progression
        let next = curTimeRef.current + dt;
        if (next >= loopDuration) {
          next = next % loopDuration;
        }
        curTimeRef.current = next;
        setCurrentTime(next);

        // Detect lyrics active states in 10s loop
        const isVocal = (next >= 1.0 && next <= 4.8) || (next >= 6.0 && next <= 8.8);
        setVocalDropActive(isVocal);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, loopDuration]);

  // Compute Active Angle & Active Keyframe based on Mode & Time
  const activeOrbitAngle = useMemo(() => {
    if (orbitMode === 'manual-drag') {
      return manualAngle;
    }
    if (orbitMode === 'front-stage') return 0;
    if (orbitMode === 'side-orbit') return 65;
    if (orbitMode === 'closeup') return 140;
    if (orbitMode === 'wide-club') return 280;

    // 'auto-orbit': High-energy 10-second seamless camera orbit around Ribby
    // Progress: 0 to 1 over 10 seconds
    const progress = (currentTime % loopDuration) / loopDuration;
    // 360 degree orbit + sine sway for dynamic handheld cinematography
    const baseOrbit = progress * 360;
    const cameraSway = Math.sin(progress * Math.PI * 4) * 12;
    return ((baseOrbit + cameraSway) % 360 + 360) % 360;
  }, [orbitMode, manualAngle, currentTime, loopDuration]);

  // Interpolate / blend between keyframe images based on active angle
  // Normalized angle in 0..360
  const normalizedAngle = ((activeOrbitAngle % 360) + 360) % 360;

  // Calculate weights for crossfade between the 4 shots
  const keyframeWeights = useMemo(() => {
    // 0deg = Front, 90deg = 3/4 Orbit, 180deg = Closeup, 270deg = Wide Club
    const w = [0, 0, 0, 0];
    const angle = normalizedAngle;

    if (angle >= 0 && angle < 90) {
      const t = angle / 90;
      w[0] = 1 - t;
      w[1] = t;
    } else if (angle >= 90 && angle < 180) {
      const t = (angle - 90) / 90;
      w[1] = 1 - t;
      w[2] = t;
    } else if (angle >= 180 && angle < 270) {
      const t = (angle - 180) / 90;
      w[2] = 1 - t;
      w[3] = t;
    } else {
      const t = (angle - 270) / 90;
      w[3] = 1 - t;
      w[0] = t;
    }
    return w;
  }, [normalizedAngle]);

  // Current audio reactive levels
  const bassLevel = audioSingleton.bassLevel;
  const isBeatHit = audioSingleton.isBeatHit && fxSettings.bassPulseIntensity > 0;
  const bassShake = isBeatHit ? (Math.random() * 4 - 2) * fxSettings.bassPulseIntensity : 0;
  const bassScale = 1 + (bassLevel * 0.05 * fxSettings.bassPulseIntensity);

  // Dynamic Camera Orbit 3D perspective transform
  const orbitTranslateX = Math.sin((activeOrbitAngle * Math.PI) / 180) * 18;
  const orbitRotateY = Math.sin((activeOrbitAngle * Math.PI) / 180) * 8;
  const orbitRotateZ = Math.cos((activeOrbitAngle * Math.PI) / 180) * 1.5;

  // Render Volumetric Lasers Canvas
  useEffect(() => {
    const canvas = laserCanvasRef.current;
    if (!canvas || !fxSettings.volumetricLasers) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const renderLasers = () => {
      t += 0.02;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      if (!isPlaying && !fxSettings.volumetricLasers) {
        animId = requestAnimationFrame(renderLasers);
        return;
      }

      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const audioEnergy = audioSingleton.bassLevel * 1.5 + 0.3;
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
      const originX = w * 0.5 + Math.sin(t * 0.5) * 40;
      const originY = -30;

      // 6 Volumetric Laser Beam Cones
      const beamCount = 7;
      for (let i = 0; i < beamCount; i++) {
        const angleOffset = (i - (beamCount - 1) / 2) * 0.28;
        const sweepAngle = angleOffset + Math.sin(t * 1.4 + i * 0.8) * 0.35;

        const targetX = originX + Math.sin(sweepAngle) * h * 1.4;
        const targetY = h + 60;

        // Draw laser shaft gradient
        const grad = ctx.createLinearGradient(originX, originY, targetX, targetY);
        const col = i % 2 === 0 ? primaryColor : (i % 3 === 0 ? secondaryColor : tertiaryColor);
        const alpha = Math.min(0.85, 0.25 * laserPower);

        grad.addColorStop(0, `${col} ${alpha * 1.5})`);
        grad.addColorStop(0.3, `${col} ${alpha * 0.8})`);
        grad.addColorStop(0.7, `${col} ${alpha * 0.5})`);
        grad.addColorStop(1, `${col} 0)`);

        ctx.beginPath();
        const beamSpread = 32 + audioSingleton.bassLevel * 25;
        ctx.moveTo(originX - 4, originY);
        ctx.lineTo(originX + 4, originY);
        ctx.lineTo(targetX + beamSpread, targetY);
        ctx.lineTo(targetX - beamSpread, targetY);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Intense core laser line
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(targetX, targetY);
        ctx.strokeStyle = `${col} ${Math.min(1.0, alpha * 2.2)})`;
        ctx.lineWidth = 2.5 + (i === 3 ? 1.5 : 0);
        ctx.stroke();
      }

      // Horizontal cross-cutter laser
      const crossY = h * 0.45 + Math.sin(t * 2) * 50;
      const crossGrad = ctx.createLinearGradient(0, crossY, w, crossY);
      crossGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
      crossGrad.addColorStop(0.5, `${primaryColor} ${0.6 * laserPower})`);
      crossGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = crossGrad;
      ctx.fillRect(0, crossY - 3, w, 6);

      // Atmospheric smoke particles caught in beams
      const particleCount = 18;
      for (let p = 0; p < particleCount; p++) {
        const px = ((p * 37 + t * 40) % w);
        const py = ((p * 73 + t * 25) % h);
        const pSize = 1.5 + (p % 3);
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fillStyle = `${primaryColor} ${0.4 * laserPower})`;
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

  return (
    <div 
      ref={containerRef}
      className={`relative flex flex-col items-center justify-center bg-zinc-950 select-none ${
        isFullscreen ? 'fixed inset-0 z-50 p-0' : 'w-full py-2'
      }`}
    >
      {/* 9:16 Vertical Cinema Container */}
      <div 
        className="relative aspect-[9/16] w-full max-w-[420px] sm:max-w-[440px] md:max-w-[460px] h-auto max-h-[85vh] rounded-2xl overflow-hidden bg-black shadow-2xl shadow-cyan-950/40 border border-zinc-800/80 group"
        style={{
          perspective: '1200px',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* 3D Moving Camera Rig */}
        <div 
          className="absolute inset-0 w-full h-full transition-transform duration-75 ease-out will-change-transform"
          style={{
            transform: `translate3d(${orbitTranslateX + bassShake}px, ${bassShake * 0.5}px, 0px) rotateY(${orbitRotateY}deg) rotateZ(${orbitRotateZ}deg) scale(${cameraZoom * bassScale})`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Keyframe Images Layers with Seamless Crossfade */}
          {KEYFRAMES.map((kf, idx) => {
            const opacity = keyframeWeights[idx];
            return (
              <div 
                key={kf.id}
                className="absolute inset-0 w-full h-full will-change-opacity pointer-events-none"
                style={{
                  opacity: Math.max(0, Math.min(1, opacity)),
                  transition: 'opacity 0.15s linear',
                }}
              >
                <img
                  src={kf.imageSrc}
                  alt={kf.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center filter saturate-110 contrast-105"
                  draggable={false}
                />
              </div>
            );
          })}

          {/* Sub-Dermal Cyan Circuit Glow Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none mix-blend-screen transition-opacity duration-100"
            style={{
              opacity: fxSettings.subdermalCircuitGlow * (0.4 + bassLevel * 0.7),
            }}
          >
            {/* SVG glowing circuit network */}
            <svg className="w-full h-full" viewBox="0 0 1000 1777" fill="none" preserveAspectRatio="none">
              <defs>
                <filter id="circuit-neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="cyan-circuit-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Cyan Facial & Neck Sub-Dermal Circuit Traces */}
              <g filter="url(#circuit-neon-glow)" stroke="url(#cyan-circuit-grad)">
                {/* Cheeks & Jawline traces */}
                <path d="M 460 620 L 480 660 L 510 680 L 510 730" strokeWidth="3" strokeDasharray="6 3" />
                <path d="M 540 620 L 520 660 L 490 680 L 490 730" strokeWidth="3" strokeDasharray="6 3" />
                
                {/* Temple and forehead neural lines */}
                <path d="M 430 520 L 470 540 L 490 520 L 510 520 L 530 540 L 570 520" strokeWidth="2.5" />
                <circle cx="470" cy="540" r="3" fill="#22d3ee" />
                <circle cx="530" cy="540" r="3" fill="#22d3ee" />

                {/* Cyber Rabbit Ear Base Nodes */}
                <path d="M 420 400 L 440 450 L 450 490" strokeWidth="3.5" />
                <path d="M 580 400 L 560 450 L 550 490" strokeWidth="3.5" />
                <circle cx="440" cy="450" r="4" fill="#a5f3fc" />
                <circle cx="560" cy="450" r="4" fill="#a5f3fc" />

                {/* Collarbone / Neon Leather Jacket Seams */}
                <path d="M 380 820 L 450 860 L 500 900 L 550 860 L 620 820" strokeWidth="4" />
                <path d="M 330 900 L 400 950 L 430 1080" strokeWidth="3" />
                <path d="M 670 900 L 600 950 L 570 1080" strokeWidth="3" />
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

          {/* Background Neon 'RIBO' Signage Flicker & Pulse */}
          <div className="absolute top-[6%] left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center">
            {/* Neon Bunny Ears Silhouette Logo from Ribby art */}
            <div 
              className={`w-8 h-8 mb-0.5 transition-all duration-75 ${isBeatHit ? 'scale-110 opacity-100' : 'opacity-90'}`}
              style={{
                filter: `drop-shadow(0 0 ${10 + bassLevel * 15}px #f97316)`,
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-amber-400 stroke-[5]">
                <path d="M 30 75 C 20 40 10 15 35 15 C 45 15 42 45 50 60 C 58 45 55 15 65 15 C 90 15 80 40 70 75" />
                <path d="M 40 68 L 50 78 L 60 68" />
              </svg>
            </div>
            <div 
              className={`font-cyber text-4xl sm:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-500 transition-all duration-75 ${
                isBeatHit ? 'scale-110 opacity-100' : 'opacity-90'
              }`}
              style={{
                filter: `drop-shadow(0 0 ${12 + bassLevel * 20}px rgba(244, 63, 94, 0.9)) drop-shadow(0 0 ${25 + bassLevel * 30}px rgba(245, 158, 11, 0.7))`,
                textShadow: '0 0 20px #f43f5e',
              }}
            >
              RIBO
            </div>
            <div className="font-hud text-[9px] tracking-[0.25em] uppercase text-amber-300/90 mt-0.5">
              OWN THE MUSIC · KEEP THE RIGHTS
            </div>
          </div>

          {/* Shallow Depth of Field: Dancing Club Crowd Silhouettes at bottom */}
          {fxSettings.depthOfFieldBlur && (
            <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none flex items-end justify-between px-3 overflow-hidden">
              {/* Silhouette Crowd Bokeh & silhouettes */}
              <div 
                className="w-16 h-32 rounded-t-full bg-zinc-950/80 blur-sm transform -translate-x-3 translate-y-6"
                style={{ transform: `translate3d(${-12 + orbitTranslateX * 0.4}px, 20px, 0)` }}
              />
              <div 
                className="w-20 h-40 rounded-t-full bg-zinc-950/85 blur-[2px] transform translate-y-8"
                style={{ transform: `translate3d(${orbitTranslateX * 0.2}px, 28px, 0)` }}
              />
              <div 
                className="w-16 h-36 rounded-t-full bg-zinc-950/90 blur-sm transform translate-x-4 translate-y-6"
                style={{ transform: `translate3d(${16 + orbitTranslateX * 0.3}px, 22px, 0)` }}
              />
              {/* Bokeh club light spheres */}
              <div className="absolute bottom-8 left-8 w-10 h-10 rounded-full bg-cyan-500/20 blur-md pointer-events-none animate-pulse" />
              <div className="absolute bottom-12 right-10 w-12 h-12 rounded-full bg-pink-500/20 blur-md pointer-events-none animate-pulse" />
            </div>
          )}

          {/* Vocal Drop Screen Flare ("Check out the sound") */}
          {vocalDropActive && (
            <div className="absolute inset-0 bg-cyan-400/10 pointer-events-none animate-ping duration-300" />
          )}

          {/* Bass Hit Chromatic Aberration Pulse */}
          {isBeatHit && fxSettings.chromaticAberration && (
            <div className="absolute inset-0 mix-blend-color-dodge bg-gradient-to-r from-red-500/10 via-transparent to-cyan-500/10 pointer-events-none" />
          )}

          {/* Hologram Scanlines & Film Grain */}
          {fxSettings.hologramScanlines && (
            <div className="absolute inset-0 cyber-scanlines opacity-40 pointer-events-none" />
          )}

          {/* Club Smoke Haze */}
          {fxSettings.smokeHaze && (
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/15 via-transparent to-purple-950/20 pointer-events-none mix-blend-screen" />
          )}
        </div>

        {/* Top HUD Overlay */}
        <div className={`absolute top-0 inset-x-0 p-3.5 flex items-start justify-between z-20 transition-opacity duration-300 ${showHUD ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="font-hud font-bold text-xs tracking-wider text-red-400 uppercase">
                REC [10s LOOP]
              </span>
            </div>
            <div className="font-cyber text-xs font-bold text-cyan-400 tracking-wider mt-0.5">
              RIBBY // THE REBEL
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Vocal Drop Badge */}
            {vocalDropActive && (
              <div className="px-2 py-0.5 rounded bg-pink-500/25 border border-pink-400 text-pink-300 font-cyber text-[10px] uppercase font-bold tracking-wider animate-pulse">
                {currentTime < 5.0 ? '"SUPERSONIC ENGINE"' : '"MY NAIL IN THE WALL"'}
              </div>
            )}
            
            {/* Mode badge */}
            <div className="px-2 py-0.5 rounded bg-zinc-900/80 border border-zinc-700/60 text-zinc-300 font-hud text-[11px] font-medium tracking-wide">
              {orbitMode === 'auto-orbit' ? 'ORBIT: AUTO 360°' : orbitMode.toUpperCase()}
            </div>

            {/* Fullscreen button */}
            <button
              onClick={handleToggleFullscreen}
              className="p-1.5 rounded-lg bg-black/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>
        </div>

        {/* Center Dynamic Orbit Gesture Prompt (if user clicks to orbit) */}
        {!isPlaying && (
          <div 
            onClick={handleTogglePlay}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 backdrop-blur-[2px] z-30 cursor-pointer group-hover:bg-black/35 transition-colors"
          >
            <div className="w-16 h-16 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-lg shadow-cyan-500/50 transform group-hover:scale-110 transition-transform">
              <Play size={28} className="translate-x-0.5 fill-black" />
            </div>
            <div className="mt-4 font-cyber text-sm font-bold tracking-wider text-cyan-300 glow-cyan">
              START 10S MOTION LOOP
            </div>
            <div className="font-hud text-xs text-zinc-400 mt-1">
              138 BPM · "My Nail in the Wall" · Space Trance
            </div>
          </div>
        )}

        {/* Bottom Interactive HUD & Timecode Scrub */}
        <div className={`absolute bottom-0 inset-x-0 p-3.5 bg-gradient-to-t from-black via-black/80 to-transparent z-20 flex flex-col gap-2 transition-opacity duration-300 ${showHUD ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {/* Loop Progress Bar */}
          <div className="relative w-full h-1.5 bg-zinc-800/80 rounded-full overflow-hidden cursor-pointer">
            <div 
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-pink-500 rounded-full transition-all duration-75"
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
                {isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-current" />}
              </button>

              <div className="font-cyber text-xs tracking-wider text-cyan-400">
                {formatTime(currentTime)}
                <span className="text-zinc-500 mx-1">/</span>
                <span className="text-zinc-400">10:00</span>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-fuchsia-400 font-hud font-semibold uppercase ml-1">
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
                {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
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
              Angle: {Math.round(activeOrbitAngle)}° (Drag canvas to orbit)
            </span>
            <span className="text-zinc-500">
              9:16 VERTICAL CINEMA
            </span>
          </div>
        </div>

        {/* HUD Toggle Hotkey Button (Corner) */}
        <button
          onClick={() => setShowHUD(!showHUD)}
          className="absolute top-3 right-12 z-20 p-1.5 rounded bg-black/40 hover:bg-black/80 text-zinc-400 hover:text-white text-[10px] font-hud uppercase"
          title="Toggle HUD Display"
        >
          {showHUD ? 'HUD ON' : 'HUD OFF'}
        </button>
      </div>

      {/* Orbit Angle Selector Quick Tabs (Below Player) */}
      <div className="mt-3 w-full max-w-[440px] flex items-center justify-between gap-1.5 p-1 rounded-xl bg-zinc-900/70 border border-zinc-800/80">
        <button
          onClick={() => onOrbitModeChange('auto-orbit')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-hud font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
            orbitMode === 'auto-orbit'
              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <RotateCw size={12} className={orbitMode === 'auto-orbit' && isPlaying ? 'animate-spin' : ''} />
          Auto Orbit
        </button>

        <button
          onClick={() => onOrbitModeChange('front-stage')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-hud font-semibold uppercase tracking-wider transition-all ${
            orbitMode === 'front-stage'
              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          Front Stage
        </button>

        <button
          onClick={() => onOrbitModeChange('side-orbit')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-hud font-semibold uppercase tracking-wider transition-all ${
            orbitMode === 'side-orbit'
              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          3/4 Angle
        </button>

        <button
          onClick={() => onOrbitModeChange('closeup')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-hud font-semibold uppercase tracking-wider transition-all ${
            orbitMode === 'closeup'
              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          Face Focus
        </button>

        <button
          onClick={() => onOrbitModeChange('wide-club')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-hud font-semibold uppercase tracking-wider transition-all ${
            orbitMode === 'wide-club'
              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          Wide Stage
        </button>
      </div>
    </div>
  );
};
