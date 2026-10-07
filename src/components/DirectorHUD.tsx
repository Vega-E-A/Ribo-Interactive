import React from 'react';
import { VisualFXSettings, CameraOrbitMode } from '../types';
import { 
  Sliders, Eye, Sun, Sparkles, Orbit, Layers, Tv, Waves, Activity 
} from 'lucide-react';

interface Props {
  fxSettings: VisualFXSettings;
  onUpdateFX: (settings: Partial<VisualFXSettings>) => void;
  orbitMode: CameraOrbitMode;
  onOrbitModeChange: (mode: CameraOrbitMode) => void;
}

export const DirectorHUD: React.FC<Props> = ({
  fxSettings,
  onUpdateFX,
  orbitMode,
  onOrbitModeChange,
}) => {
  return (
    <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-cyan-400" />
          <span className="font-cyber text-xs font-bold text-white tracking-wider">
            CINEMATIC DIRECTOR CONSOLE
          </span>
        </div>
        <span className="font-hud text-[11px] text-zinc-400">
          8K PHOTOREALISTIC RENDER · 9:16
        </span>
      </div>

      {/* Main Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Volumetric Laser Beams Control */}
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-black/40 border border-zinc-800/60">
          <div className="flex items-center justify-between">
            <span className="font-hud text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
              <Sun size={13} />
              VOLUMETRIC LASER BEAMS
            </span>
            <input
              type="checkbox"
              checked={fxSettings.volumetricLasers}
              onChange={(e) => onUpdateFX({ volumetricLasers: e.target.checked })}
              className="accent-cyan-400 w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0.2"
              max="1.5"
              step="0.05"
              value={fxSettings.laserIntensity}
              disabled={!fxSettings.volumetricLasers}
              onChange={(e) => onUpdateFX({ laserIntensity: parseFloat(e.target.value) })}
              className="flex-1 h-1.5 accent-cyan-400 bg-zinc-800 rounded appearance-none cursor-pointer disabled:opacity-40"
            />
            <span className="font-mono text-xs text-cyan-400 w-8 text-right">
              {Math.round(fxSettings.laserIntensity * 100)}%
            </span>
          </div>

          {/* Color Palettes */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10px] font-hud text-zinc-500">PALETTE:</span>
            {(['cyan-magenta', 'toxic-emerald', 'ribo-violet', 'amber-pulse'] as const).map((pal) => (
              <button
                key={pal}
                onClick={() => onUpdateFX({ laserColorPalette: pal })}
                className={`text-[10px] font-hud px-1.5 py-0.5 rounded uppercase transition-colors ${
                  fxSettings.laserColorPalette === pal
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-zinc-500 hover:text-zinc-300 bg-zinc-800/40'
                }`}
              >
                {pal.split('-')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-Dermal Circuit Glow */}
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-black/40 border border-zinc-800/60">
          <div className="flex items-center justify-between">
            <span className="font-hud text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
              <Sparkles size={13} />
              GLOWING SUB-DERMAL CIRCUITS
            </span>
            <span className="font-mono text-xs text-cyan-400">
              {Math.round(fxSettings.subdermalCircuitGlow * 100)}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="1.2"
            step="0.05"
            value={fxSettings.subdermalCircuitGlow}
            onChange={(e) => onUpdateFX({ subdermalCircuitGlow: parseFloat(e.target.value) })}
            className="w-full h-1.5 accent-cyan-400 bg-zinc-800 rounded appearance-none cursor-pointer"
          />

          <div className="text-[11px] font-hud text-zinc-400 flex justify-between">
            <span>Cyan neural patterns on Ruby's cheekbones & jacket</span>
            <span className="text-cyan-400">PULSING WITH BASS</span>
          </div>
        </div>

        {/* Pulsing Bass Screen Vibes */}
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-black/40 border border-zinc-800/60">
          <div className="flex items-center justify-between">
            <span className="font-hud text-xs font-semibold text-fuchsia-300 flex items-center gap-1.5">
              <Waves size={13} />
              PULSING BASS CAMERA VIBES
            </span>
            <span className="font-mono text-xs text-fuchsia-400">
              {Math.round(fxSettings.bassPulseIntensity * 100)}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={fxSettings.bassPulseIntensity}
            onChange={(e) => onUpdateFX({ bassPulseIntensity: parseFloat(e.target.value) })}
            className="w-full h-1.5 accent-fuchsia-400 bg-zinc-800 rounded appearance-none cursor-pointer"
          />

          <div className="text-[11px] font-hud text-zinc-400">
            Micro-shake & lens ripple on 4-on-the-floor kick drops
          </div>
        </div>

        {/* Cinematic Atmospheric Toggles */}
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-black/40 border border-zinc-800/60">
          <span className="font-hud text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Layers size={13} />
            CINEMATIC POST-PROCESSING
          </span>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <label className="flex items-center gap-1.5 text-xs font-hud text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={fxSettings.depthOfFieldBlur}
                onChange={(e) => onUpdateFX({ depthOfFieldBlur: e.target.checked })}
                className="accent-cyan-400 rounded cursor-pointer"
              />
              Club Crowd Bokeh
            </label>

            <label className="flex items-center gap-1.5 text-xs font-hud text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={fxSettings.chromaticAberration}
                onChange={(e) => onUpdateFX({ chromaticAberration: e.target.checked })}
                className="accent-cyan-400 rounded cursor-pointer"
              />
              Lens Aberration
            </label>

            <label className="flex items-center gap-1.5 text-xs font-hud text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={fxSettings.hologramScanlines}
                onChange={(e) => onUpdateFX({ hologramScanlines: e.target.checked })}
                className="accent-cyan-400 rounded cursor-pointer"
              />
              Holo Scanlines
            </label>

            <label className="flex items-center gap-1.5 text-xs font-hud text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={fxSettings.smokeHaze}
                onChange={(e) => onUpdateFX({ smokeHaze: e.target.checked })}
                className="accent-cyan-400 rounded cursor-pointer"
              />
              Club Smoke Haze
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
