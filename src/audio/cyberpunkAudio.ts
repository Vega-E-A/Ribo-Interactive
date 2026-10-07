/**
 * Cyberpunk & Space Trance Audio Engine for "My Nail in the Wall"
 * Captures the 138 BPM melodic space trance anthem uploaded by the user:
 * - "A beautiful star came unto me... She said the universe is yours, you see"
 * - "While the supersonic engine takes me through the sky... My nail in the wall"
 * - Driving 138 BPM four-on-the-floor trance kick, rolling 16th bassline,
 *   soaring supersaw trance leads, atmospheric space arpeggios, and vocal formants.
 */

export type SongSectionPreset = 'chorus-supersonic' | 'verse-star' | 'instrumental-drop';

export class CyberpunkAudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private loopTimer: number | null = null;
  private animFrameId: number | null = null;
  private startTime = 0;
  private customAudioElement: HTMLAudioElement | null = null;
  private customSourceNode: MediaElementAudioSourceNode | null = null;
  public isCustomAudio = false;

  public songTitle = "My Nail in the Wall";
  public songSubtitle = "Supersonic Space Trance (138 BPM)";
  public currentPreset: SongSectionPreset = 'chorus-supersonic';

  public loopDuration = 10.0; // 10 seconds exactly
  public volume = 0.85;
  public bassBoost = 1.25;

  // Real-time metrics
  public frequencyData: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(64));
  public bassLevel = 0;
  public midLevel = 0;
  public trebleLevel = 0;
  public overallLevel = 0;
  public isBeatHit = false;
  public currentTime = 0;

  constructor() {
    // Lazy init
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.75;

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);

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
      this.gainNode.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    if (this.customAudioElement) {
      this.customAudioElement.volume = this.volume;
    }
  }

  public setPreset(preset: SongSectionPreset) {
    this.currentPreset = preset;
    if (this.isPlaying && !this.isCustomAudio) {
      this.stop();
      this.start();
    }
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  public getAnalyserNode(): AnalyserNode | null {
    return this.analyser;
  }

  public getGainNode(): GainNode | null {
    return this.gainNode;
  }

  public start() {
    this.init();
    if (!this.ctx || !this.gainNode) return;

    this.isPlaying = true;
    this.startTime = this.ctx.currentTime;

    if (this.isCustomAudio && this.customAudioElement) {
      this.customAudioElement.currentTime = 0;
      this.customAudioElement.play().catch(console.error);
    } else {
      this.schedule10SecondSongLoop();
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

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Schedule the 10-second "My Nail in the Wall" Trance Loop
   * 138 BPM: 1 beat = 60 / 138 = 0.43478s
   * 16th note = 0.10869s
   * Total beats in 10s = 23 beats (~5.75 bars)
   * Chord Progression: F#m -> D -> A -> E (Key of A Major / F# Minor)
   */
  private schedule10SecondSongLoop() {
    if (!this.ctx || !this.gainNode || !this.isPlaying) return;

    const now = this.ctx.currentTime;
    const bpm = 138;
    const beatSec = 60 / bpm; // ~0.435s
    const sixteenth = beatSec / 4; // ~0.108s
    const totalBeats = Math.floor(this.loopDuration / beatSec); // ~23 beats
    const totalSixteenths = Math.floor(this.loopDuration / sixteenth);

    // 1. Driving Trance Kick Drum (138 BPM four-on-the-floor)
    for (let i = 0; i < totalBeats; i++) {
      const beatTime = now + i * beatSec;
      if (beatTime - now >= this.loopDuration) break;
      this.triggerTranceKick(beatTime);
    }

    // 2. Rolling Offbeat Progressive Trance Bass (F# -> D -> A -> E)
    // F#1 = 46.25Hz, D1 = 36.7Hz, A1 = 55.0Hz, E1 = 41.2Hz
    const bassChords = [
      { root: 46.25, durationBeats: 6 },  // F#m
      { root: 36.70, durationBeats: 6 },  // D
      { root: 55.00, durationBeats: 6 },  // A
      { root: 41.20, durationBeats: 5 },  // E
    ];

    let currentChordIdx = 0;
    let chordBeatCounter = 0;

    for (let s = 0; s < totalSixteenths; s++) {
      const t = now + s * sixteenth;
      if (t - now >= this.loopDuration) break;

      const currentBeat = Math.floor(s / 4);
      if (currentBeat !== chordBeatCounter) {
        chordBeatCounter = currentBeat;
      }

      // Determine chord
      if (chordBeatCounter < 6) currentChordIdx = 0;
      else if (chordBeatCounter < 12) currentChordIdx = 1;
      else if (chordBeatCounter < 18) currentChordIdx = 2;
      else currentChordIdx = 3;

      const root = bassChords[currentChordIdx].root;
      // Rolling 16th offbeats (step 1, 2, 3 in 0,1,2,3)
      const isOffbeat = (s % 4 !== 0);
      this.triggerRollingTranceBass(t, root, isOffbeat ? 0.32 : 0.18, sixteenth * 0.9);
    }

    // 3. Trance Hi-Hats, Claps & Sweeps
    for (let i = 0; i < totalBeats; i++) {
      const beatTime = now + i * beatSec;
      if (beatTime - now >= this.loopDuration) break;

      // Snare / Clap on beats 2 and 4
      if (i % 2 === 1) {
        this.triggerTranceClap(beatTime);
      }

      // Punchy Open Hat on off-beat & closed hats on 16ths
      this.triggerTranceHat(beatTime + beatSec * 0.5, true);
      this.triggerTranceHat(beatTime + sixteenth * 1, false);
      this.triggerTranceHat(beatTime + sixteenth * 3, false);
    }

    // 4. Soaring Supersaw Melodic Lead Chords (F#m -> D -> A -> E)
    // Melodic Motifs from "My Nail in the Wall"
    const leadNotes = [
      // Bar 1-2 (F#m)
      { f: 554.37, t: 0.0, d: 0.8 }, // C#5
      { f: 659.25, t: 0.8, d: 0.8 }, // E5
      { f: 739.99, t: 1.6, d: 1.2 }, // F#5 ("Supersonic")
      // Bar 2-3 (D)
      { f: 880.00, t: 2.8, d: 0.9 }, // A5 ("Engine takes me")
      { f: 739.99, t: 3.7, d: 0.8 }, // F#5
      { f: 659.25, t: 4.5, d: 1.2 }, // E5 ("Through the sky")
      // Bar 4 (A)
      { f: 554.37, t: 5.8, d: 0.8 }, // C#5
      { f: 659.25, t: 6.6, d: 0.8 }, // E5 ("My nail")
      { f: 739.99, t: 7.4, d: 1.0 }, // F#5 ("In the wall")
      // Bar 5 (E) turnaround
      { f: 830.61, t: 8.5, d: 0.7 }, // G#5
      { f: 880.00, t: 9.2, d: 0.8 }, // A5
    ];

    leadNotes.forEach((n) => {
      this.triggerSupersawLead(now + n.t, n.f, n.d);
    });

    // 5. Space Arpeggiator (Shimmering 16th-note Star Arp)
    const arpScale = [440, 554.37, 659.25, 739.99, 880, 1108.73];
    for (let s = 0; s < totalSixteenths; s++) {
      const t = now + s * sixteenth;
      if (t - now >= this.loopDuration) break;
      const note = arpScale[s % arpScale.length];
      this.triggerSpaceArp(t, note, sixteenth * 0.75);
    }

    // 6. Vocal Formants Synthesis: "Supersonic Engine" & "My Nail in the Wall"
    this.triggerVocalFormantLyrics(now);

    // 7. Uplifting White Noise & Laser Riser Sweeps
    this.triggerTranceRiser(now + 0.1, 200, 3200, 2.2);
    this.triggerTranceRiser(now + 5.2, 350, 4800, 2.5);
    this.triggerTranceRiser(now + 8.5, 500, 6500, 1.4);

    // Schedule next seamless loop turnaround
    const timeRemaining = (this.loopDuration * 1000) - 20;
    this.loopTimer = window.setTimeout(() => {
      if (this.isPlaying && !this.isCustomAudio) {
        this.startTime = this.ctx ? this.ctx.currentTime : Date.now() / 1000;
        this.schedule10SecondSongLoop();
      }
    }, timeRemaining);
  }

  // --- Sound Generation Units ---

  private triggerTranceKick(time: number) {
    if (!this.ctx || !this.gainNode) return;
    const osc = this.ctx.createOscillator();
    const kickGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(170, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.08);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.22);

    kickGain.gain.setValueAtTime(1.1 * this.bassBoost, time);
    kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.26);

    osc.connect(kickGain);
    kickGain.connect(this.gainNode);

    osc.start(time);
    osc.stop(time + 0.28);
  }

  private triggerRollingTranceBass(time: number, freq: number, gainLevel: number, duration: number) {
    if (!this.ctx || !this.gainNode) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const bassGain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(freq * 1.002, time); // Subtle detune for width

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, time);
    filter.frequency.exponentialRampToValueAtTime(1400, time + 0.035);
    filter.frequency.exponentialRampToValueAtTime(300, time + duration);
    filter.Q.setValueAtTime(4.5, time);

    bassGain.gain.setValueAtTime(gainLevel * this.bassBoost, time);
    bassGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(bassGain);
    bassGain.connect(this.gainNode);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration);
  }

  private triggerTranceHat(time: number, open: boolean) {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, time);

    const hatGain = this.ctx.createGain();
    const dur = open ? 0.16 : 0.035;
    hatGain.gain.setValueAtTime(open ? 0.22 : 0.12, time);
    hatGain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    noise.connect(filter);
    filter.connect(hatGain);
    hatGain.connect(this.gainNode);

    noise.start(time);
    noise.stop(time + dur);
  }

  private triggerTranceClap(time: number) {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1300, time);
    filter.Q.setValueAtTime(2.0, time);

    const clapGain = this.ctx.createGain();
    clapGain.gain.setValueAtTime(0.35, time);
    clapGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    noise.connect(filter);
    filter.connect(clapGain);
    clapGain.connect(this.gainNode);

    noise.start(time);
    noise.stop(time + 0.18);
  }

  /**
   * Euphoric Trance Supersaw Lead (Multiple detuned sawtooth oscillators)
   */
  private triggerSupersawLead(time: number, freq: number, duration: number) {
    if (!this.ctx || !this.gainNode) return;
    const detunes = [-12, -5, 0, 6, 13];
    const leadGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, time);
    filter.frequency.linearRampToValueAtTime(3800, time + 0.1);
    filter.frequency.exponentialRampToValueAtTime(1600, time + duration);
    filter.Q.setValueAtTime(2.5, time);

    leadGain.gain.setValueAtTime(0.0, time);
    leadGain.gain.linearRampToValueAtTime(0.18, time + 0.04);
    leadGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    detunes.forEach((cents) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);
      osc.detune.setValueAtTime(cents, time);
      osc.connect(filter);
      osc.start(time);
      osc.stop(time + duration);
    });

    filter.connect(leadGain);
    leadGain.connect(this.gainNode);
  }

  private triggerSpaceArp(time: number, freq: number, duration: number) {
    if (!this.ctx || !this.gainNode) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const arpGain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, time);
    filter.Q.setValueAtTime(3.0, time);

    arpGain.gain.setValueAtTime(0.09, time);
    arpGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(arpGain);
    arpGain.connect(this.gainNode);

    osc.start(time);
    osc.stop(time + duration);
  }

  private triggerTranceRiser(time: number, startFreq: number, endFreq: number, duration: number) {
    if (!this.ctx || !this.gainNode) return;
    const osc = this.ctx.createOscillator();
    const riserGain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration);

    riserGain.gain.setValueAtTime(0.01, time);
    riserGain.gain.linearRampToValueAtTime(0.18, time + duration * 0.8);
    riserGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(riserGain);
    riserGain.connect(this.gainNode);

    osc.start(time);
    osc.stop(time + duration);
  }

  /**
   * Ethereal Space Vocal Formants singing:
   * "Supersonic engine takes me through the sky... My nail in the wall..."
   */
  private triggerVocalFormantLyrics(time: number) {
    if (!this.ctx || !this.gainNode) return;

    const vocalPhrases = [
      // "Super-sonic engine" (t = 1.0s to 3.0s)
      { word: 'Super', offset: 1.0, f0: 330, dur: 0.4 },
      { word: 'sonic', offset: 1.5, f0: 370, dur: 0.5 },
      { word: 'engine', offset: 2.1, f0: 440, dur: 0.6 },
      // "Through the sky" (t = 3.4s to 4.8s)
      { word: 'through', offset: 3.4, f0: 392, dur: 0.4 },
      { word: 'sky', offset: 4.0, f0: 440, dur: 0.8 },
      // "My nail in the wall" (t = 6.2s to 8.5s)
      { word: 'My', offset: 6.2, f0: 330, dur: 0.35 },
      { word: 'nail', offset: 6.6, f0: 370, dur: 0.5 },
      { word: 'in the', offset: 7.2, f0: 440, dur: 0.4 },
      { word: 'wall', offset: 7.7, f0: 494, dur: 1.1 },
    ];

    vocalPhrases.forEach((p) => {
      const sylTime = time + p.offset;
      const osc = this.ctx!.createOscillator();
      const filterA = this.ctx!.createBiquadFilter();
      const filterB = this.ctx!.createBiquadFilter();
      const vGain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(p.f0, sylTime);
      osc.frequency.linearRampToValueAtTime(p.f0 * 1.02, sylTime + p.dur);

      // Formants for female vocal timbre
      filterA.type = 'bandpass';
      filterA.frequency.setValueAtTime(800, sylTime);
      filterA.Q.setValueAtTime(5.0, sylTime);

      filterB.type = 'bandpass';
      filterB.frequency.setValueAtTime(2100, sylTime);
      filterB.Q.setValueAtTime(5.0, sylTime);

      vGain.gain.setValueAtTime(0.0, sylTime);
      vGain.gain.linearRampToValueAtTime(0.22, sylTime + 0.05);
      vGain.gain.exponentialRampToValueAtTime(0.001, sylTime + p.dur);

      osc.connect(filterA);
      filterA.connect(filterB);
      filterB.connect(vGain);
      vGain.connect(this.gainNode!);

      osc.start(sylTime);
      osc.stop(sylTime + p.dur);
    });
  }

  /**
   * Real-time audio analyzer loop
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

        this.bassLevel = Math.min(1.0, (bSum / (9 * 255)) * this.bassBoost);
        this.midLevel = Math.min(1.0, mSum / (20 * 255));
        this.trebleLevel = Math.min(1.0, tSum / (35 * 255));
        this.overallLevel = Math.min(1.0, allSum / (this.frequencyData.length * 255));

        // Beat hit on driving 138 BPM kick
        this.isBeatHit = this.bassLevel > 0.62;
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
   * Load user's direct audio file
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
        this.songTitle = file.name.replace(/\.[^/.]+$/, "");
        this.songSubtitle = "Loaded Studio Master Track";

        if (this.ctx && this.gainNode) {
          if (!this.customSourceNode) {
            this.customSourceNode = this.ctx.createMediaElementSource(audio);
            this.customSourceNode.connect(this.gainNode);
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
    this.songTitle = "My Nail in the Wall";
    this.songSubtitle = "Supersonic Space Trance (138 BPM)";
    this.loopDuration = 10.0;
  }
}

export const audioSingleton = new CyberpunkAudioEngine();
