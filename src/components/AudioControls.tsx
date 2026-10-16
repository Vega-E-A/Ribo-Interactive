import React, { useState, useEffect, useRef } from 'react';
import { audioSingleton, MELLOW_SONGS } from '../audio/cyberpunkAudio';
import { MellowSongId } from '../types';
import { 
  Volume2, Sliders, Upload, Music, Disc3, Sparkles, Moon, Coffee, 
  Sun, Play, Pause, Heart, Radio, Check
} from 'lucide-react';

interface Props {
  bassBoost: number;
  onBassBoostChange: (val: number) => void;
}

export const AudioControls: React.FC<Props> = ({
  bassBoost,
  onBassBoostChange,
}) => {
  const [levels, setLevels] = useState({ bass: 0, mid: 0, treble: 0, overall: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSong, setActiveSong] = useState<MellowSongId>(audioSingleton.currentSongId);
  const [warmthFilter, setWarmthFilter] = useState<number>(audioSingleton.warmthFreq);
  const [volume, setVolume] = useState<number>(audioSingleton.volume);
  const [customFileName, setCustomFileName] = useState<string | null>(null);
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
      setIsPlaying(audioSingleton.getIsPlaying());
      animId = requestAnimationFrame(updateLevels);
    };
    animId = requestAnimationFrame(updateLevels);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleTogglePlay = () => {
    const nextState = audioSingleton.toggle();
    setIsPlaying(nextState);
  };

  const handleSelectSong = (songId: MellowSongId) => {
    setActiveSong(songId);
    audioSingleton.setSong(songId);
    if (!audioSingleton.getIsPlaying()) {
      audioSingleton.start();
      setIsPlaying(true);
    }
  };

  const handleWarmthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const freq = parseFloat(e.target.value);
    setWarmthFilter(freq);
    audioSingleton.setWarmthFilter(freq);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    audioSingleton.setVolume(val);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await audioSingleton.loadCustomAudio(file);
      setCustomFileName(file.name);
      if (!audioSingleton.getIsPlaying()) {
        audioSingleton.start();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Audio load error:', err);
    }
  };

  const handleResetSample = () => {
    audioSingleton.resetToSynthesizedLoop();
    setCustomFileName(null);
  };

  return (
    <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Moon size={16} className="text-cyan-400" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cyber text-xs font-bold text-white tracking-wider">
                MELLOW AUDIO SOUNDTRACK
              </span>
              <span className="text-[10px] font-hud px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 uppercase font-semibold">
                WARM · CHILL · NON-FATIGUING
              </span>
            </div>
            <div className="text-[11px] font-hud text-zinc-400">
              Cozy lo-fi Rhodes, pure warm sub-bass, and gentle ambient chords
            </div>
          </div>
        </div>

        {/* Global Play / Pause Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleTogglePlay}
            className={`py-1.5 px-3 rounded-lg font-cyber text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isPlaying
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/30'
            }`}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} className="fill-current" />}
            {isPlaying ? 'PAUSE SOUNDTRACK' : 'PLAY MELLOW MUSIC'}
          </button>
        </div>
      </div>

      {/* 4 Mellow Song Selector Cards */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-hud text-zinc-400">
          <span className="font-semibold text-zinc-300 flex items-center gap-1">
            <Music size={13} className="text-cyan-400" />
            SELECT MELLOW TRACK (4 LO-FI / AMBIENT CHOICES):
          </span>
          <span className="text-[11px] text-cyan-400 font-mono">10.0S SEAMLESS LOOP</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MELLOW_SONGS.map((song) => {
            const isSelected = activeSong === song.id && !customFileName;
            return (
              <div
                key={song.id}
                onClick={() => handleSelectSong(song.id)}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-sm shadow-cyan-500/10'
                    : 'bg-black/40 border-zinc-800 hover:border-zinc-700 hover:bg-black/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {song.id === 'neon-velvet' && <Sparkles size={13} className={isSelected ? 'text-cyan-400' : 'text-zinc-500'} />}
                    {song.id === 'cyber-rain' && <Moon size={13} className={isSelected ? 'text-cyan-400' : 'text-zinc-500'} />}
                    {song.id === 'midnight-starlight' && <Coffee size={13} className={isSelected ? 'text-cyan-400' : 'text-zinc-500'} />}
                    {song.id === 'rebels-sunset' && <Sun size={13} className={isSelected ? 'text-cyan-400' : 'text-zinc-500'} />}
                    <span className={`font-cyber text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-zinc-200'}`}>
                      {song.title}
                    </span>
                  </div>
                  <span className={`text-[10px] font-hud px-1.5 py-0.5 rounded font-semibold ${
                    isSelected ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {song.genre}
                  </span>
                </div>

                <p className="text-[11px] font-hud text-zinc-400 line-clamp-1">
                  {song.description}
                </p>

                <div className="flex items-center justify-between text-[10px] font-hud text-zinc-500 pt-0.5 border-t border-zinc-800/40">
                  <span>CHORDS: <b className="text-zinc-400">{song.keyChords}</b></span>
                  <span className="font-mono text-cyan-400/80">{song.tempo}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Spectrum Equalizer Display (Smooth, Mellow Bars) */}
      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-black/60 border border-zinc-800/60">
        {/* Deep Round Sub */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] font-hud text-cyan-400">
            <span>WARM SUB (40-60Hz)</span>
            <span className="font-mono">{Math.round(levels.bass * 100)}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-75"
              style={{ width: `${Math.min(100, levels.bass * 100)}%` }}
            />
          </div>
        </div>

        {/* Velvet Rhodes Chords */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] font-hud text-pink-400">
            <span>VELVET CHORDS</span>
            <span className="font-mono">{Math.round(levels.mid * 100)}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-400 transition-all duration-75"
              style={{ width: `${Math.min(100, levels.mid * 100)}%` }}
            />
          </div>
        </div>

        {/* Mellow Highs */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] font-hud text-emerald-400">
            <span>WARM HIGHS</span>
            <span className="font-mono">{Math.round(levels.treble * 100)}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-75"
              style={{ width: `${Math.min(100, levels.treble * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Audio Dials & Warmth Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-black/40 border border-zinc-800/80">
        {/* 1. Warmth Lowpass Filter */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs font-hud">
            <span className="text-zinc-300 font-semibold flex items-center gap-1">
              <Moon size={12} className="text-cyan-400" />
              ANALOG WARMTH FILTER
            </span>
            <span className="font-mono text-cyan-400 text-[11px]">{Math.round(warmthFilter)} Hz</span>
          </div>
          <input
            type="range"
            min="600"
            max="2600"
            step="50"
            value={warmthFilter}
            onChange={handleWarmthChange}
            className="w-full h-1.5 accent-cyan-400 bg-zinc-800 rounded appearance-none cursor-pointer"
          />
          <span className="text-[10px] font-hud text-zinc-500">
            Cuts harsh high frequencies for silky smooth audio
          </span>
        </div>

        {/* 2. Master Volume */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs font-hud">
            <span className="text-zinc-300 font-semibold flex items-center gap-1">
              <Volume2 size={12} className="text-pink-400" />
              MUSIC VOLUME
            </span>
            <span className="font-mono text-pink-400 text-[11px]">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-1.5 accent-pink-400 bg-zinc-800 rounded appearance-none cursor-pointer"
          />
          <span className="text-[10px] font-hud text-zinc-500">
            Comfortable, non-fatiguing listening volume
          </span>
        </div>

        {/* 3. Pillow Sub Bass Boost */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs font-hud">
            <span className="text-zinc-300 font-semibold flex items-center gap-1">
              <Disc3 size={12} className="text-emerald-400" />
              DEEP PILLOW SUB
            </span>
            <span className="font-mono text-emerald-400 text-[11px]">{Math.round(bassBoost * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.8"
            step="0.1"
            value={bassBoost}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onBassBoostChange(val);
              audioSingleton.bassBoost = val;
            }}
            className="w-full h-1.5 accent-emerald-400 bg-zinc-800 rounded appearance-none cursor-pointer"
          />
          <span className="text-[10px] font-hud text-zinc-500">
            Pure 40Hz warmth without buzzy distortion
          </span>
        </div>
      </div>

      {/* Custom Audio Upload Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/60 text-xs font-hud">
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
            className="py-1 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium flex items-center gap-1.5 transition-colors border border-zinc-700 text-xs"
          >
            <Upload size={12} />
            {customFileName ? 'Change Audio File' : 'Upload Own Audio File'}
          </button>
          {customFileName && (
            <>
              <span className="text-cyan-400 font-mono text-[11px] line-clamp-1 max-w-[200px]">
                {customFileName}
              </span>
              <button
                onClick={handleResetSample}
                className="text-zinc-500 hover:text-rose-400 text-[11px] underline"
              >
                Reset to Mellow Songs
              </button>
            </>
          )}
        </div>

        <span className="text-zinc-500 text-[11px]">
          Ribby Underground · Mellow Audio Vibe
        </span>
      </div>
    </div>
  );
};
