import React, { useState } from 'react';
import { VerticalVideoPlayer } from './components/VerticalVideoPlayer';
import { AudioControls } from './components/AudioControls';
import { DirectorHUD } from './components/DirectorHUD';
import { VideoExporter } from './components/VideoExporter';
import { CameraOrbitMode, VisualFXSettings } from './types';
import { RIBBY_IMAGES } from './assets/images';
import { 
  Radio, Sparkles, Sliders, Volume2, Film, Zap, Layers, Compass, 
  ExternalLink, Disc3, ShieldCheck, RotateCw
} from 'lucide-react';

export default function App() {
  // Visual FX State
  const [fxSettings, setFxSettings] = useState<VisualFXSettings>({
    volumetricLasers: true,
    laserIntensity: 1.0,
    laserColorPalette: 'cyan-magenta',
    bassPulseIntensity: 0.9,
    subdermalCircuitGlow: 0.95,
    depthOfFieldBlur: true,
    hologramScanlines: true,
    filmGrain: false,
    chromaticAberration: true,
    smokeHaze: true,
  });

  // Camera Orbit State
  const [orbitMode, setOrbitMode] = useState<CameraOrbitMode>('auto-orbit');
  const [bassBoost, setBassBoost] = useState(1.2);
  const [activeTab, setActiveTab] = useState<'director' | 'audio' | 'loop-maker' | 'keyframes'>('director');

  const handleUpdateFX = (partial: Partial<VisualFXSettings>) => {
    setFxSettings((prev) => ({ ...prev, ...partial }));
  };

  const keyframeGallery = [
    {
      title: 'Front Center Stage',
      desc: 'Ribby high-energy dance with maroon jacket, volumetric cyan lasers & RIBO neon sign',
      img: RIBBY_IMAGES.front,
      angle: '0° FRONT',
    },
    {
      title: '3/4 Dynamic Orbit',
      desc: 'Kinetic camera sweep with pierced ears, pick necklace & maroon biker jacket flare',
      img: RIBBY_IMAGES.orbit,
      angle: '65° ORBIT',
    },
    {
      title: 'Facial Focus & Piercings',
      desc: 'Sharp focus on purple eyes, ear rings, glowing headphones, and cyan circuits',
      img: RIBBY_IMAGES.closeup,
      angle: '140° CLOSE-UP',
    },
    {
      title: 'Underground Club Wide',
      desc: 'Packed cyber crowd dancefloor and giant RIBO neon wall with rabbit ears symbol',
      img: RIBBY_IMAGES.wide,
      angle: '280° WIDE',
    },
  ];

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Cyberpunk Navigation Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-rose-500 to-fuchsia-600 flex items-center justify-center font-cyber font-black text-black text-sm shadow-md shadow-rose-500/30">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-cyber text-sm sm:text-base font-black tracking-wider text-white">
                  RIBBY <span className="text-amber-400">// THE REBEL RABBIT</span>
                </h1>
                <span className="text-[10px] font-hud px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-700/60 font-semibold tracking-wide uppercase">
                  9:16 CINEMATIC LOOP
                </span>
              </div>
              <p className="text-[11px] font-hud text-zinc-400 tracking-wide">
                MAROON JACKET · 'R' PICK NECKLACE · HIGH-TECH HEADPHONES · RIBO UNDERGROUND
              </p>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-2 font-hud text-xs">
            <div className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 flex items-center gap-1.5 text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>LOOP: <b className="text-cyan-400 font-mono">10.00s</b></span>
            </div>
            <div className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 flex items-center gap-1.5 text-zinc-300">
              <Disc3 size={13} className="text-pink-400" />
              <span>SOUNDTRACK: <b className="text-emerald-400 font-mono">MELLOW CHILL LOUNGE</b></span>
            </div>
            <div className="hidden sm:flex px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 items-center gap-1.5 text-zinc-300">
              <Compass size={13} className="text-cyan-400" />
              <span>ORBIT: <b className="text-cyan-400 font-mono">{orbitMode.toUpperCase()}</b></span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-5 flex flex-col lg:flex-row gap-6 items-start justify-center">
        {/* Left Column: 9:16 Vertical Video Player Stage */}
        <div className="w-full lg:w-[480px] flex-shrink-0 flex flex-col items-center">
          <VerticalVideoPlayer
            fxSettings={fxSettings}
            orbitMode={orbitMode}
            onOrbitModeChange={setOrbitMode}
          />
        </div>

        {/* Right Column: Console Controls, Audio Visualizer, Keyframes & Exporter */}
        <div className="flex-1 w-full flex flex-col gap-5">
          {/* Section Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/80 pb-2">
            <button
              onClick={() => setActiveTab('director')}
              className={`py-1.5 px-3 rounded-lg font-cyber text-xs font-bold tracking-wider transition-colors flex items-center gap-1.5 ${
                activeTab === 'director'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Sliders size={13} />
              DIRECTOR CONSOLE
            </button>

            <button
              onClick={() => setActiveTab('audio')}
              className={`py-1.5 px-3 rounded-lg font-cyber text-xs font-bold tracking-wider transition-colors flex items-center gap-1.5 ${
                activeTab === 'audio'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Volume2 size={13} />
              MELLOW AUDIO
            </button>

            <button
              onClick={() => setActiveTab('loop-maker')}
              className={`py-1.5 px-3 rounded-lg font-cyber text-xs font-bold tracking-wider transition-colors flex items-center gap-1.5 ${
                activeTab === 'loop-maker'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Film size={13} />
              LOOP MAKER STUDIO
            </button>

            <button
              onClick={() => setActiveTab('keyframes')}
              className={`py-1.5 px-3 rounded-lg font-cyber text-xs font-bold tracking-wider transition-colors flex items-center gap-1.5 ${
                activeTab === 'keyframes'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Layers size={13} />
              8K KEYFRAMES (4)
            </button>
          </div>

          {/* Tab 1: Director Console */}
          {activeTab === 'director' && (
            <div className="flex flex-col gap-4">
              <DirectorHUD
                fxSettings={fxSettings}
                onUpdateFX={handleUpdateFX}
                orbitMode={orbitMode}
                onOrbitModeChange={setOrbitMode}
              />
              <AudioControls
                bassBoost={bassBoost}
                onBassBoostChange={setBassBoost}
              />
            </div>
          )}

          {/* Tab 2: Audio Engine */}
          {activeTab === 'audio' && (
            <div className="flex flex-col gap-4">
              <AudioControls
                bassBoost={bassBoost}
                onBassBoostChange={setBassBoost}
              />
              
              {/* Audio Stem Breakout Info */}
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-hud flex flex-col gap-2">
                <span className="font-cyber font-bold text-white text-xs">
                  MELLOW AUDIO SOUNDSCAPE // "MY NAIL IN THE WALL"
                </span>
                <p className="text-zinc-400">
                  A soothing, non-fatiguing chillwave & ambient downtempo arrangement:
                </p>
                <ul className="list-disc list-inside space-y-1 text-zinc-300 pl-1">
                  <li><strong className="text-cyan-400">Warm Analog Pads:</strong> Gentle swelling triangle chords (F#m9 - Dmaj7 - Amaj7 - Eadd9) with cozy lowpass filter</li>
                  <li><strong className="text-pink-400">Dreamy Rhodes Melody:</strong> Soft bell-like melodic plucks playing the iconic theme without harshness</li>
                  <li><strong className="text-cyan-400">Deep Warm Sine Sub:</strong> Pure 45-60Hz fundamental sub-bass with zero harsh buzzy overtone fatigue</li>
                  <li><strong className="text-emerald-400">Cozy Lo-Fi Beat:</strong> Soft tape kick thump and gentle brush shakers at a relaxed 96 BPM tempo</li>
                </ul>
              </div>
            </div>
          )}

          {/* Tab 3: Loop Maker Studio */}
          {activeTab === 'loop-maker' && (
            <div className="flex flex-col gap-4">
              <VideoExporter />
            </div>
          )}

          {/* Tab 4: 8K Keyframe Gallery */}
          {activeTab === 'keyframes' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs font-hud">
                <span className="text-zinc-400">
                  Click any keyframe below to inspect, or click Resume to keep cycling:
                </span>
                <button
                  onClick={() => setOrbitMode('auto-orbit')}
                  className="py-1 px-2.5 rounded bg-cyan-500 text-black font-cyber text-[11px] font-bold flex items-center gap-1 shadow-sm"
                >
                  <RotateCw size={11} />
                  Resume 4-Screen Auto Cycle
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {keyframeGallery.map((kf, i) => (
                  <div 
                    key={i}
                    className="rounded-xl overflow-hidden bg-zinc-900/90 border border-zinc-800 flex flex-col group cursor-pointer hover:border-cyan-500/60 transition-colors"
                    onClick={() => {
                      if (i === 0) setOrbitMode('front-stage');
                      else if (i === 1) setOrbitMode('side-orbit');
                      else if (i === 2) setOrbitMode('closeup');
                      else setOrbitMode('wide-club');
                    }}
                  >
                    <div className="relative aspect-[9/16] max-h-56 overflow-hidden bg-black">
                      <img 
                        src={kf.img} 
                        alt={kf.title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 font-hud text-[10px] text-cyan-300 font-semibold border border-cyan-500/30">
                        {kf.angle}
                      </div>
                    </div>
                    <div className="p-2.5 flex flex-col">
                      <span className="font-cyber text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {kf.title}
                      </span>
                      <span className="font-hud text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                        {kf.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loop Maker Quick Panel (Always visible below director console) */}
          {activeTab === 'director' && (
            <VideoExporter />
          )}

          {/* Character Dossier Footer Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-950 via-zinc-900/60 to-zinc-950 border border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-hud text-zinc-400">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-950 border border-rose-500/40 flex items-center justify-center font-cyber text-rose-300 font-bold">
                RR
              </div>
              <div>
                <div className="font-cyber text-xs font-bold text-zinc-200">
                  CHARACTER: RIBBY THE REBEL RABBIT
                </div>
                <div className="text-[11px] text-zinc-400">
                  White Fur · Ear Piercings · Worn Maroon Jacket · 'R' Guitar Pick · Headphones
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-cyber">
                8K DIGITAL ART
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px] font-cyber">
                FREEDOM SOUNDS BETTER
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
