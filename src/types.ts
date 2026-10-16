export interface RibbyKeyframe {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  orbitAngle: number; // degrees
  cameraDistance: number;
  cameraHeight: number;
}

export type RubyKeyframe = RibbyKeyframe; // Backward compatibility alias

export type CameraOrbitMode = 'auto-orbit' | 'manual-drag' | 'front-stage' | 'side-orbit' | 'closeup' | 'wide-club';

export type MellowSongId = 'neon-velvet' | 'cyber-rain' | 'midnight-starlight' | 'rebels-sunset';

export type TransitionStyle = 'crossfade' | 'cut' | 'flash' | 'dissolve';

export interface LoopSlot {
  slotId: number;
  screenIndex: number; // 0, 1, 2, 3
  duration: number; // in seconds, sum to 10.0s
}

export interface VisualFXSettings {
  volumetricLasers: boolean;
  laserIntensity: number; // 0 to 1
  laserColorPalette: 'cyan-magenta' | 'toxic-emerald' | 'ribo-violet' | 'amber-pulse';
  bassPulseIntensity: number; // 0 to 1
  subdermalCircuitGlow: number; // 0 to 1
  depthOfFieldBlur: boolean;
  hologramScanlines: boolean;
  filmGrain: boolean;
  chromaticAberration: boolean;
  smokeHaze: boolean;
}

export interface AudioStemLevels {
  bass: number;
  mid: number;
  treble: number;
  overall: number;
  beatHit: boolean;
}
