/**
 * Mellow Cyberpunk & Ambient Lounge Audio Engine for Ribby the Rebel
 * 
 * Replaces harsh synthesizers, noisy hiss shakers, and repetitive screeching with:
 * 1. "Neon Velvet" - Cozy Lo-Fi Chillhop with velvet Rhodes chords & soft kicks
 * 2. "Cyber Rain" - Dreamy Ambient Lounge with celestial pads & gentle harp plucks
 * 3. "Midnight Starlight" - Smooth Downtempo / Cyber-Soul with warm electric piano
 * 4. "Rebel's Sunset" - Acoustic Lo-Fi Chill with peaceful nylon guitar swells
 * 
 * All tracks feature:
 * - Pure sine and warm triangle waveforms (zero harsh saw/buzz fatigue)
 * - Warm analog lowpass master filter (smooth cutoff, no high-pitch pierce)
 * - Gentle envelope ramps with zero clicks or pops
 * - Seamless 10-second loop timing matching the vertical video loop
 */

import { MellowSongId } from '../types';

export interface MellowSongInfo {
  id: MellowSongId;
  title: string;
  genre: string;
  tempo: string;
  description: string;
  keyChords: string;
}

export const MELLOW_SONGS: MellowSongInfo[] = [
  {
    id: 'neon-velvet',
    title: 'Neon Velvet',
    genre: 'Lo-Fi Chillhop',
    tempo: '88 BPM Chill',
    description: 'Velvety electric piano chords, pure soft sine sub-bass, and gentle cozy tape kicks.',
    keyChords: 'Dm9 · Gm7 · Cmaj7 · Fmaj7',
  },
  {
    id: 'cyber-rain',
    title: 'Cyber Rain',
    genre: 'Ambient Dream Lounge',
    tempo: '75 BPM Dreamy',
    description: 'Floating celestial warm pads, gentle rain-drop plucks, and serene meditative space.',
    keyChords: 'F#m9 · Dmaj7 · Bm7 · C#m7',
  },
  {
    id: 'midnight-starlight',
    title: 'Midnight Starlight',
    genre: 'Cyber-Soul Downtempo',
    tempo: '92 BPM Mellow',
    description: 'Smooth late-night lounge Rhodes, deep warm walking sub, and peaceful synth melodies.',
    keyChords: 'Bbmaj9 · Gm9 · Ebmaj7 · Fadd9',
  },
  {
    id: 'rebels-sunset',
    title: "Rebel's Sunset",
    genre: 'Acoustic Lo-Fi Chill',
    tempo: '80 BPM Peaceful',
    description: 'Gentle nylon guitar-synth chord swells, warm analog harmonics, and tranquil sunset vibes.',
    keyChords: 'Em9 · Cmaj7 · Gmaj7 · Dadd9',
  },
];

export class CyberpunkAudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private isPlaying = false;
  private loopTimer: number | null = null;
  private animFrameId: number | null = null;
  private startTime = 0;
  private customAudioElement: HTMLAudioElement | null = null;
  private customSourceNode: MediaElementAudioSourceNode | null = null;
  public isCustomAudio = false;

  public currentSongId: MellowSongId = 'neon-velvet';
  public songTitle = 'Neon Velvet';
  public songSubtitle = 'Lo-Fi Chillhop · Velvet Rhodes & Soft Sub';

  public loopDuration = 10.0; // 10.0s exact loop
  public volume = 0.45; // Gentle, relaxing volume default
  public warmthFreq = 1200; // Warm lowpass cutoff (eliminates all shrillness)
  public bassBoost = 1.0;

  // Real-time audio metrics for visualizer
  public frequencyData: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(64));
  public bassLevel = 0;
  public midLevel = 0;
  public trebleLevel = 0;
  public overallLevel = 0;
  public isBeatHit = false;
  public currentTime = 0;

  public init() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.88;

      this.masterFilter = this.ctx.createBiquadFilter();
      this.masterFilter.type = 'lowpass';
      this.masterFilter.frequency.setValueAtTime(this.warmthFreq, this.ctx.currentTime);
      this.masterFilter.Q.setValueAtTime(0.65, this.ctx.currentTime); // Soft butterworth slope

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      // Routing: MasterFilter -> GainNode -> Analyser -> Destination
      this.masterFilter.connect(this.gainNode);
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      this.frequencyData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.04);
    }
    if (this.customAudioElement) {
      this.customAudioElement.volume = this.volume;
    }
  }

  public setWarmthFilter(freq: number) {
    this.warmthFreq = Math.max(400, Math.min(4000, freq));
    if (this.masterFilter && this.ctx) {
      this.masterFilter.frequency.setTargetAtTime(this.warmthFreq, this.ctx.currentTime, 0.08);
    }
  }

  public setSong(songId: MellowSongId) {
    this.currentSongId = songId;
    const song = MELLOW_SONGS.find((s) => s.id === songId);
    if (song) {
      this.songTitle = song.title;
      this.songSubtitle = `${song.genre} · ${song.tempo}`;
    }

    if (this.isPlaying && !this.isCustomAudio) {
      // Smoothly re-schedule with the new song
      if (this.loopTimer) {
        clearTimeout(this.loopTimer);
        this.loopTimer = null;
      }
      this.scheduleCurrentSongLoop();
    }
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  public getMasterDestinationNode(): AudioNode | null {
    return this.masterFilter || this.gainNode;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public start() {
    this.init();
    if (!this.ctx || !this.masterFilter) return;

    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;
    this.startTime = this.ctx.currentTime;

    if (this.isCustomAudio && this.customAudioElement) {
      this.customAudioElement.currentTime = 0;
      this.customAudioElement.play().catch(console.error);
    } else {
      this.scheduleCurrentSongLoop();
    }

    this.startAnalysisLoop();
  }

  public stop() {
    this.isPlaying = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.customAudioElement) {
      this.customAudioElement.pause();
      this.customAudioElement.currentTime = 0;
    }
    this.currentTime = 0;
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }

  /**
   * Schedules the active 10-second mellow musical composition
   */
  private scheduleCurrentSongLoop() {
    if (!this.ctx || !this.masterFilter || !this.isPlaying) return;

    const now = this.ctx.currentTime;

    switch (this.currentSongId) {
      case 'neon-velvet':
        this.renderNeonVelvet(now);
        break;
      case 'cyber-rain':
        this.renderCyberRain(now);
        break;
      case 'midnight-starlight':
        this.renderMidnightStarlight(now);
        break;
      case 'rebels-sunset':
        this.renderRebelsSunset(now);
        break;
      default:
        this.renderNeonVelvet(now);
        break;
    }

    // Seamless 10.0-second loop timing
    const loopIntervalMs = (this.loopDuration * 1000) - 35;
    this.loopTimer = window.setTimeout(() => {
      if (this.isPlaying && !this.isCustomAudio) {
        this.startTime = this.ctx ? this.ctx.currentTime : Date.now() / 1000;
        this.scheduleCurrentSongLoop();
      }
    }, loopIntervalMs);
  }

  // =========================================================================
  // SONG 1: NEON VELVET (Cozy Lo-Fi Chillhop)
  // =========================================================================
  private renderNeonVelvet(start: number) {
    // 4 Chords over 10 seconds (2.5s each)
    const chords = [
      { t: 0.0, notes: [146.83, 220.00, 261.63, 329.63], dur: 2.45 }, // Dm9 (D3, A3, C4, E4)
      { t: 2.5, notes: [196.00, 233.08, 293.66, 349.23], dur: 2.45 }, // Gm7 (G3, Bb3, D4, F4)
      { t: 5.0, notes: [130.81, 196.00, 246.94, 329.63], dur: 2.45 }, // Cmaj7 (C3, G3, B3, E4)
      { t: 7.5, notes: [174.61, 220.00, 261.63, 329.63], dur: 2.40 }, // Fmaj7 (F3, A3, C4, E4)
    ];

    chords.forEach((c) => {
      this.playVelvetRhodesChord(start + c.t, c.notes, c.dur);
    });

    // Deep warm sine sub-bass
    const bassline = [
      { t: 0.0, f: 36.71, d: 2.3 }, // D1
      { t: 2.5, f: 49.00, d: 2.3 }, // G1
      { t: 5.0, f: 32.70, d: 2.3 }, // C1
      { t: 7.5, f: 43.65, d: 2.3 }, // F1
    ];

    bassline.forEach((b) => {
      this.playWarmSub(start + b.t, b.f, b.d, 0.22);
    });

    // Cozy, soft lo-fi heartbeat kicks (downbeats only, soft sine thump)
    const kicks = [0.0, 1.25, 2.5, 3.75, 5.0, 6.25, 7.5, 8.75];
    kicks.forEach((kt) => {
      this.playSoftLoFiKick(start + kt);
    });

    // Gentle mellow electric piano melody (sweet, non-piercing)
    const melody = [
      { t: 0.4, f: 293.66, d: 0.7 }, // D4
      { t: 1.3, f: 329.63, d: 0.8 }, // E4
      { t: 2.2, f: 349.23, d: 0.7 }, // F4
      { t: 3.2, f: 392.00, d: 0.8 }, // G4
      { t: 4.5, f: 349.23, d: 0.6 }, // F4
      { t: 5.4, f: 329.63, d: 0.8 }, // E4
      { t: 6.8, f: 293.66, d: 0.7 }, // D4
      { t: 7.9, f: 261.63, d: 0.8 }, // C4
      { t: 8.8, f: 293.66, d: 1.1 }, // D4
    ];

    melody.forEach((m) => {
      this.playMellowMelodyNote(start + m.t, m.f, m.d);
    });
  }

  // =========================================================================
  // SONG 2: CYBER RAIN (Ambient Dream Lounge)
  // =========================================================================
  private renderCyberRain(start: number) {
    // Atmospheric swelling lush pads (F#m9 - Dmaj7 - Bm7 - C#m7)
    const pads = [
      { t: 0.0, notes: [185.00, 220.00, 277.18, 329.63], dur: 2.5 }, // F#m9
      { t: 2.5, notes: [146.83, 220.00, 277.18, 369.99], dur: 2.5 }, // Dmaj9
      { t: 5.0, notes: [123.47, 185.00, 246.94, 293.66], dur: 2.5 }, // Bm7
      { t: 7.5, notes: [138.59, 207.65, 277.18, 329.63], dur: 2.4 }, // C#m7
    ];

    pads.forEach((p) => {
      this.playCelestialPad(start + p.t, p.notes, p.dur);
    });

    // Pure 40Hz pillow sub-bass
    const bassline = [
      { t: 0.0, f: 46.25, d: 2.4 }, // F#1
      { t: 2.5, f: 36.70, d: 2.4 }, // D1
      { t: 5.0, f: 30.87, d: 2.4 }, // B0
      { t: 7.5, f: 34.65, d: 2.3 }, // C#1
    ];

    bassline.forEach((b) => {
      this.playWarmSub(start + b.t, b.f, b.d, 0.20);
    });

    // Soothing rain-drop harp plucks (pentatonic scale, gentle sine bell)
    const plucks = [
      { t: 0.6, f: 369.99, d: 1.2 }, // F#4
      { t: 1.6, f: 440.00, d: 1.2 }, // A4
      { t: 3.0, f: 554.37, d: 1.4 }, // C#5
      { t: 4.2, f: 440.00, d: 1.0 }, // A4
      { t: 5.6, f: 493.88, d: 1.3 }, // B4
      { t: 6.9, f: 369.99, d: 1.1 }, // F#4
      { t: 8.2, f: 329.63, d: 1.5 }, // E4
    ];

    plucks.forEach((pl) => {
      this.playRainPluck(start + pl.t, pl.f, pl.d);
    });
  }

  // =========================================================================
  // SONG 3: MIDNIGHT STARLIGHT (Cyber-Soul Downtempo)
  // =========================================================================
  private renderMidnightStarlight(start: number) {
    // Jazz-hop chords (Bbmaj9 - Gm9 - Ebmaj7 - Fadd9)
    const chords = [
      { t: 0.0, notes: [116.54, 174.61, 233.08, 293.66], dur: 2.45 }, // Bbmaj9
      { t: 2.5, notes: [98.00, 146.83, 233.08, 261.63], dur: 2.45 },  // Gm9
      { t: 5.0, notes: [155.56, 196.00, 233.08, 293.66], dur: 2.45 }, // Ebmaj7
      { t: 7.5, notes: [174.61, 220.00, 261.63, 349.23], dur: 2.40 }, // Fadd9
    ];

    chords.forEach((c) => {
      this.playVelvetRhodesChord(start + c.t, c.notes, c.dur);
    });

    // Walking warm sub-bass
    const bassline = [
      { t: 0.0, f: 29.14, d: 2.3 }, // Bb0
      { t: 2.5, f: 49.00, d: 2.3 }, // G1
      { t: 5.0, f: 38.89, d: 2.3 }, // Eb1
      { t: 7.5, f: 43.65, d: 2.3 }, // F1
    ];

    bassline.forEach((b) => {
      this.playWarmSub(start + b.t, b.f, b.d, 0.24);
    });

    // Relaxed downbeat kick (half-time, every 2.5s)
    [0.0, 2.5, 5.0, 7.5].forEach((kt) => {
      this.playSoftLoFiKick(start + kt);
    });

    // Velvety soul melody
    const soulMelody = [
      { t: 0.5, f: 233.08, d: 0.8 }, // Bb3
      { t: 1.5, f: 293.66, d: 0.9 }, // D4
      { t: 2.7, f: 349.23, d: 0.9 }, // F4
      { t: 4.0, f: 293.66, d: 0.8 }, // D4
      { t: 5.5, f: 261.63, d: 0.8 }, // C4
      { t: 6.8, f: 233.08, d: 0.9 }, // Bb3
      { t: 8.0, f: 293.66, d: 1.2 }, // D4
    ];

    soulMelody.forEach((sm) => {
      this.playMellowMelodyNote(start + sm.t, sm.f, sm.d);
    });
  }

  // =========================================================================
  // SONG 4: REBEL'S SUNSET (Acoustic Lo-Fi Chill)
  // =========================================================================
  private renderRebelsSunset(start: number) {
    // Warm acoustic nylon-synth chords (Em9 - Cmaj7 - Gmaj7 - Dadd9)
    const chords = [
      { t: 0.0, notes: [164.81, 196.00, 246.94, 293.66], dur: 2.45 }, // Em9
      { t: 2.5, notes: [130.81, 164.81, 196.00, 246.94], dur: 2.45 }, // Cmaj7
      { t: 5.0, notes: [196.00, 246.94, 293.66, 329.63], dur: 2.45 }, // Gmaj7
      { t: 7.5, notes: [146.83, 220.00, 293.66, 329.63], dur: 2.40 }, // Dadd9
    ];

    chords.forEach((c) => {
      this.playCelestialPad(start + c.t, c.notes, c.dur);
    });

    // Soft grounded sub
    const bass = [
      { t: 0.0, f: 41.20, d: 2.3 }, // E1
      { t: 2.5, f: 32.70, d: 2.3 }, // C1
      { t: 5.0, f: 49.00, d: 2.3 }, // G1
      { t: 7.5, f: 36.71, d: 2.3 }, // D1
    ];

    bass.forEach((b) => {
      this.playWarmSub(start + b.t, b.f, b.d, 0.21);
    });

    // Peaceful acoustic guitar harmonics
    const harmonics = [
      { t: 0.4, f: 329.63, d: 1.0 }, // E4
      { t: 1.4, f: 392.00, d: 1.0 }, // G4
      { t: 2.8, f: 493.88, d: 1.2 }, // B4
      { t: 4.1, f: 392.00, d: 0.9 }, // G4
      { t: 5.5, f: 293.66, d: 1.1 }, // D4
      { t: 6.8, f: 329.63, d: 1.0 }, // E4
      { t: 8.1, f: 246.94, d: 1.4 }, // B3
    ];

    harmonics.forEach((h) => {
      this.playRainPluck(start + h.t, h.f, h.d);
    });
  }

  // =========================================================================
  // INSTRUMENT SYNTHESIS (Zero Harshness, Pure Warmth)
  // =========================================================================

  /**
   * Velvet Rhodes chord: Triangle wave with smooth attack, warm lowpass
   */
  private playVelvetRhodesChord(time: number, freqs: number[], duration: number) {
    if (!this.ctx || !this.masterFilter) return;

    freqs.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, time);
      filter.Q.setValueAtTime(0.5, time);

      // Smooth velvet envelope
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.042, time + 0.12);
      gain.gain.setValueAtTime(0.038, time + duration - 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterFilter!);

      osc.start(time);
      osc.stop(time + duration);
    });
  }

  /**
   * Celestial Pad: Sine & triangle blend with gentle slow swelling
   */
  private playCelestialPad(time: number, freqs: number[], duration: number) {
    if (!this.ctx || !this.masterFilter) return;

    freqs.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.038, time + 0.45);
      gain.gain.setValueAtTime(0.035, time + duration - 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterFilter!);

      osc.start(time);
      osc.stop(time + duration);
    });
  }

  /**
   * Pure Sine Sub-Bass (round, warm 30-55Hz fundamental, zero buzzy harmonics)
   */
  private playWarmSub(time: number, freq: number, duration: number, level = 0.22) {
    if (!this.ctx || !this.masterFilter) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    const amp = level * this.bassBoost;
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(amp, time + 0.08);
    gain.gain.setValueAtTime(amp * 0.9, time + duration - 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterFilter);

    osc.start(time);
    osc.stop(time + duration);
  }

  /**
   * Soft Lo-Fi Kick: Sine wave sweep starting at 80Hz down to 40Hz (soft felt thump)
   */
  private playSoftLoFiKick(time: number) {
    if (!this.ctx || !this.masterFilter) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(78, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.15);

    gain.gain.setValueAtTime(0.24, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(gain);
    gain.connect(this.masterFilter);

    osc.start(time);
    osc.stop(time + 0.24);
  }

  /**
   * Mellow Melody Note: Warm sine tone with gentle low-pass filter
   */
  private playMellowMelodyNote(time: number, freq: number, duration: number) {
    if (!this.ctx || !this.masterFilter) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.055, time + 0.04);
    gain.gain.setValueAtTime(0.050, time + duration - 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterFilter);

    osc.start(time);
    osc.stop(time + duration);
  }

  /**
   * Rain Pluck: Soft bell-like water droplet tone (sine wave)
   */
  private playRainPluck(time: number, freq: number, duration: number) {
    if (!this.ctx || !this.masterFilter) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.045, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterFilter);

    osc.start(time);
    osc.stop(time + duration);
  }

  /**
   * Real-time audio analysis loop for visualizer meters
   */
  private startAnalysisLoop() {
    const update = () => {
      if (!this.isPlaying) return;

      if (this.analyser) {
        this.analyser.getByteFrequencyData(this.frequencyData);

        let bSum = 0;
        let mSum = 0;
        let tSum = 0;
        let allSum = 0;

        for (let i = 0; i < this.frequencyData.length; i++) {
          const val = this.frequencyData[i];
          allSum += val;
          if (i <= 8) bSum += val;
          else if (i <= 28) mSum += val;
          else tSum += val;
        }

        this.bassLevel = Math.min(1.0, (bSum / (9 * 255)) * 1.3);
        this.midLevel = Math.min(1.0, mSum / (20 * 255));
        this.trebleLevel = Math.min(1.0, tSum / (35 * 255));
        this.overallLevel = Math.min(1.0, allSum / (this.frequencyData.length * 255));

        // Beat hit detection for soft kick pulse
        this.isBeatHit = this.bassLevel > 0.42;
      }

      if (this.ctx) {
        const elapsed = (this.ctx.currentTime - this.startTime) % this.loopDuration;
        this.currentTime = Math.max(0, elapsed);
      }

      this.animFrameId = requestAnimationFrame(update);
    };

    update();
  }

  /**
   * Load user's custom audio file
   */
  public loadCustomAudio(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.init();
        if (this.customAudioElement) {
          this.customAudioElement.pause();
          this.customAudioElement.remove();
        }

        const url = URL.createObjectURL(file);
        const audio = new Audio(url);
        audio.loop = true;
        this.customAudioElement = audio;
        this.isCustomAudio = true;
        this.songTitle = file.name.replace(/\.[^/.]+$/, '');
        this.songSubtitle = 'Custom Loaded Track';

        if (this.ctx && this.masterFilter) {
          if (!this.customSourceNode) {
            this.customSourceNode = this.ctx.createMediaElementSource(audio);
            this.customSourceNode.connect(this.masterFilter);
          }
        }

        audio.onloadedmetadata = () => {
          this.loopDuration = Math.min(10.0, audio.duration || 10.0);
          resolve();
        };

        audio.onerror = (e) => reject(e);
      } catch (err) {
        reject(err);
      }
    });
  }

  public resetToSynthesizedLoop() {
    if (this.customAudioElement) {
      this.customAudioElement.pause();
      this.isCustomAudio = false;
    }
    const current = MELLOW_SONGS.find((s) => s.id === this.currentSongId);
    this.songTitle = current ? current.title : 'Neon Velvet';
    this.songSubtitle = current ? `${current.genre} · ${current.tempo}` : 'Lo-Fi Chillhop';
    this.loopDuration = 10.0;
  }
}

export const audioSingleton = new CyberpunkAudioEngine();
