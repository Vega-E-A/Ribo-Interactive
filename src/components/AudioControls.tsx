import React, { useState, useEffect, useRef } from 'react';
import { audioSingleton, SongSectionPreset } from '../audio/cyberpunkAudio';
import { Volume2, Sliders, Zap, Activity, Upload, Music, Disc3, Sparkles } from 'lucide-react';

interface Props {
  bassBoost: number;
  onBassBoostChange: (val: number) => void;
}

export const AudioControls: React.FC<Props> = ({
  bassBoost,
  onBassBoostChange,
}) => {
  const [levels, setLevels] = useState({ bass: 0, mid: 0, treble: 0, overall: 0 });
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [customFileName, setCustomFileName] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<SongSectionPreset>('chorus-supersonic');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitor real-time audio levels for visualizer
  useEffect(() => {
    let animId: number;
    const updateLevels = () => {
      setLevels({
        bass: audioSingleton.bassLevel,
        mid: audioSingleton.midLevel,
        treble: audioSingleton.trebleLevel,
        overall: audioSingleton.overallLevel,
      });
      animId = requestAnimationFrame(updateLevels);
    };
    animId = requestAnimationFrame(updateLevels);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await audioSingleton.loadCustomAudio(file);
      setCustomFileName(file.name);
      setIsAudioLoaded(true);
    } catch (err) {
      console.error('Audio load error:', err);
    }
  };

  const handleResetSample = () => {
    audioSingleton.resetToSynthesizedLoop();
    setCustomFileName(null);
    setIsAudioLoaded(false);
  };

  const handleSelectPreset = (preset: SongSectionPreset) => {
    setActivePreset(preset);
    audioSingleton.setPreset(preset);
  };

  return (
    <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Music size={16} className="text-cyan-400" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cyber text-xs font-bold text-white tracking-wider">
                {audioSingleton.songTitle.toUpperCase()}
              </span>
              <span className="text-[10px] font-hud px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 uppercase font-semibold">
                138 BPM · 4/4
              </span>
            </div>
            <div className="text-[11px] font-hud text-zinc-400">
              {audioSingleton.songSubtitle}
            </div>
          </div>
        </div>

        {/* Vocal Lyrics Hook */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-[10px] font-hud text-zinc-400 uppercase">CHORUS:</span>
          <span className="text-[11px] font-cyber text-pink-400 font-bold bg-pink-950/60 px-2 py-0.5 rounded border border-pink-700/50">
            {customFileName ? customFileName.slice(0, 16) + '...' : '"SUPERSONIC ENGINE // NAIL IN THE WALL"'}
          </span>
        </div>
      </div>

      {/* Preset Section Tabs */}
      <div className="flex items-center gap-2 p-1 bg-black/50 rounded-lg border border-zinc-800/80 text-xs font-hud">
        <button
          onClick={() => handleSelectPreset('chorus-supersonic')}
          className={`flex-1 py-1 px-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-1 ${
            activePreset === 'chorus-supersonic'
              ? 'bg-cyan-500 text-black shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sparkles size={11} />
          Chorus: Supersonic Drop
        </button>
        <button
          onClick={() => handleSelectPreset('verse-star')}
          className={`flex-1 py-1 px-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-1 ${
            activePreset === 'verse-star'
              ? 'bg-cyan-500 text-black shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Verse: A Beautiful Star
        </button>
        <button
          onClick={() => handleSelectPreset('instrumental-drop')}
          className={`flex-1 py-1 px-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-1 ${
            activePreset === 'instrumental-drop'
              ? 'bg-cyan-500 text-black shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Supersaw Anthem
        </button>
      </div>

      {/* Real-time Spectrum Equalizer Display */}
      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-black/60 border border-zinc-800/60">
        {/* Bass Subwoofer */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] font-hud text-cyan-400">
            <span>138 BPM TRANCE KICK</span>
            <span className="font-mono">{Math.round(levels.bass * 100)}%</span>
          </div>
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-400 transition-all duration-75 shadow-sm shadow-cyan-400"
              style={{ width: `${Math.min(100, levels.bass * 100)}%` }}
            />
          </div>
        </div>

        {/* Mid Voice / Supersaw */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] font-hud text-fuchsia-400">
            <span>VOCAL & SUPERSAWS</span>
            <span className="font-mono">{Math.round(levels.mid * 100)}%</span>
          </div>
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-fuchsia-400 transition-all duration-75 shadow-sm shadow-fuchsia-400"
              style={{ width: `${Math.min(100, levels.mid * 100)}%` }}
            />
          </div>
        </div>

        {/* Treble / Hats / Lasers */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] font-hud text-emerald-400">
            <span>SPACE ARPS & RISERS</span>
            <span className="font-mono">{Math.round(levels.treble * 100)}%</span>
          </div>
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-400 transition-all duration-75 shadow-sm shadow-emerald-400"
              style={{ width: `${Math.min(100, levels.treble * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Subwoofer Bass Boost Slider & Audio Options */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Zap size={14} className="text-yellow-400" />
          <span className="font-hud text-xs text-zinc-300 whitespace-nowrap">CLUB SUB-BASS BOOST:</span>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={bassBoost}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onBassBoostChange(val);
              audioSingleton.bassBoost = val;
            }}
            className="flex-1 h-1.5 accent-cyan-400 bg-zinc-800 rounded appearance-none cursor-pointer"
          />
          <span className="font-mono text-xs text-cyan-400 w-8 text-right">{bassBoost}x</span>
        </div>

        {/* Custom Audio File Upload */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="py-1 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-hud flex items-center gap-1.5 transition-colors border border-zinc-700/60"
            title="Load your original song audio file directly"
          >
            <Upload size={12} />
            {isAudioLoaded ? 'Change File' : 'Upload Audio File'}
          </button>

          {isAudioLoaded && (
            <button
              onClick={handleResetSample}
              className="py-1 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-cyan-400 text-xs font-hud transition-colors"
              title="Reset to 10s 'My Nail in the Wall' space trance loop"
            >
              Reset Track
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
