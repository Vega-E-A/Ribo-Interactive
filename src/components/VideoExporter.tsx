import React, { useState, useRef, useEffect } from 'react';
import { Download, Film, CheckCircle2, Loader2, Sparkles, Play, Pause, RefreshCw, Eye, Sliders, ArrowRight, Music, Clock } from 'lucide-react';
import { audioSingleton, MELLOW_SONGS } from '../audio/cyberpunkAudio';
import { RIBBY_IMAGE_ARRAY, RIBBY_IMAGES } from '../assets/images';
import { MellowSongId, TransitionStyle } from '../types';

interface Props {
  orbitAngle?: number;
}

export const VideoExporter: React.FC<Props> = () => {
  // Loop Sequence State: 4 slots in the 10-second loop
  // Each slot has: screenIndex (0 to 3), duration (seconds)
  const [slotScreens, setSlotScreens] = useState<number[]>([0, 1, 2, 3]); // Default: Screen 1 -> 2 -> 3 -> 4
  const [transitionStyle, setTransitionStyle] = useState<TransitionStyle>('crossfade');
  const [selectedSong, setSelectedSong] = useState<MellowSongId>(audioSingleton.currentSongId);

  // Live Preview inside Loop Maker Studio
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(true);
  const [previewTime, setPreviewTime] = useState(0); // 0 to 10 seconds
  const previewAnimRef = useRef<number | null>(null);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportScreenStatus, setExportScreenStatus] = useState<number>(1);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const loopDuration = 10.0;

  // Real-time animation loop for the Live Loop Preview
  useEffect(() => {
    let lastTime = performance.now();
    const updatePreview = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      if (isPreviewPlaying && !isExporting) {
        setPreviewTime((prev) => {
          const next = prev + dt;
          return next >= loopDuration ? next % loopDuration : next;
        });
      }

      previewAnimRef.current = requestAnimationFrame(updatePreview);
    };

    previewAnimRef.current = requestAnimationFrame(updatePreview);
    return () => {
      if (previewAnimRef.current) cancelAnimationFrame(previewAnimRef.current);
    };
  }, [isPreviewPlaying, isExporting]);

  // Compute which screen is currently active in the 10-second preview
  // 4 slots: 0.0-2.5s, 2.5-5.0s, 5.0-7.5s, 7.5-10.0s
  const currentSlotIndex = Math.min(3, Math.floor((previewTime % loopDuration) / 2.5));
  const activeScreenIndex = slotScreens[currentSlotIndex] ?? 0;
  const nextSlotIndex = (currentSlotIndex + 1) % 4;
  const nextScreenIndex = slotScreens[nextSlotIndex] ?? 1;

  // Dissolve progress within the current slot (2.5s)
  const slotProgress = (previewTime % 2.5) / 2.5;
  const isTransitioning = transitionStyle !== 'cut' && slotProgress > 0.82;
  const dissolveAmount = isTransitioning ? (slotProgress - 0.82) / 0.18 : 0;

  // Preload HTML Image Elements for fast canvas export & preview
  const cachedImagesRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    const loaded: HTMLImageElement[] = [];
    const srcList = [
      RIBBY_IMAGES.front,
      RIBBY_IMAGES.orbit,
      RIBBY_IMAGES.closeup,
      RIBBY_IMAGES.wide,
    ];

    srcList.forEach((src) => {
      const img = new Image();
      img.src = src;
      loaded.push(img);
    });

    cachedImagesRef.current = loaded;
  }, []);

  // Quick Preset Sequences
  const handleSetSequencePreset = (preset: 'cycle-all' | 'reverse' | 'closeup-action' | 'single-stage') => {
    if (preset === 'cycle-all') {
      setSlotScreens([0, 1, 2, 3]);
    } else if (preset === 'reverse') {
      setSlotScreens([3, 2, 1, 0]);
    } else if (preset === 'closeup-action') {
      setSlotScreens([0, 2, 1, 2]); // Front -> Close-up -> Orbit -> Close-up
    } else if (preset === 'single-stage') {
      setSlotScreens([0, 0, 0, 0]);
    }
  };

  // Change individual slot's screen
  const handleSlotChange = (slotIdx: number, newScreenIdx: number) => {
    setSlotScreens((prev) => {
      const updated = [...prev];
      updated[slotIdx] = newScreenIdx;
      return updated;
    });
  };

  // Export 10-Second High-Quality Reel
  const startExport = async () => {
    try {
      setIsExporting(true);
      setExportProgress(5);
      setDownloadUrl(null);
      setExportScreenStatus(1);

      // Canvas dimensions for 9:16 vertical video (540x960)
      const exportCanvas = previewCanvasRef.current || document.createElement('canvas');
      exportCanvas.width = 540;
      exportCanvas.height = 960;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D context');

      // Ensure all images are loaded
      const loadedImages = await Promise.all<HTMLImageElement>(
        [
          RIBBY_IMAGES.front,
          RIBBY_IMAGES.orbit,
          RIBBY_IMAGES.closeup,
          RIBBY_IMAGES.wide,
        ].map(
          (src) =>
            new Promise<HTMLImageElement>((resolve) => {
              const img = new Image();
              img.src = src;
              if (img.complete && img.naturalWidth > 0) {
                resolve(img);
              } else {
                img.onload = () => resolve(img);
                img.onerror = () => {
                  // Fallback: resolve anyway so render doesn't freeze
                  resolve(img);
                };
              }
            })
        )
      );

      setExportProgress(15);

      // Setup MediaStream & Recorder
      const fps = 30;
      const stream = exportCanvas.captureStream(fps);

      // Capture audio from Web Audio destination if available
      const audioCtx = audioSingleton.getAudioContext();
      if (audioCtx) {
        const dest = audioCtx.createMediaStreamDestination();
        const master = audioSingleton.getMasterDestinationNode();
        if (master) {
          master.connect(dest);
          dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
        }
      }

      // Start audio playing with selected mellow song
      audioSingleton.setSong(selectedSong);
      if (!audioSingleton.getIsPlaying()) {
        audioSingleton.start();
      }

      // Check supported MIME types
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setIsExporting(false);
        setExportProgress(100);
      };

      recorder.start();

      // Render 10 seconds of frames at 30 fps = 300 frames
      const totalFrames = 300;
      let frame = 0;

      const renderInterval = setInterval(() => {
        frame++;
        const t = frame / fps; // 0.0 to 10.0 seconds
        const pct = Math.min(96, Math.round(15 + (t / 10) * 80));
        setExportProgress(pct);

        // Determine active slot and screen
        const slotIdx = Math.min(3, Math.floor(t / 2.5));
        const activeIdx = slotScreens[slotIdx] ?? 0;
        const nextIdx = slotScreens[(slotIdx + 1) % 4] ?? 1;
        setExportScreenStatus(activeIdx + 1);

        const subT = (t % 2.5) / 2.5; // 0 to 1
        let dissolve = 0;
        if (transitionStyle !== 'cut' && subT > 0.82) {
          dissolve = (subT - 0.82) / 0.18;
        }

        // 1. Clear background
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, 540, 960);

        // 2. Draw current screen image
        ctx.save();
        const baseImg = loadedImages[activeIdx];
        if (baseImg && baseImg.naturalWidth > 0) {
          ctx.globalAlpha = 1.0 - dissolve;
          const swayX = Math.sin((t / 10) * Math.PI * 2) * 6;
          ctx.drawImage(baseImg, swayX, 0, 540, 960);
        }

        // 3. Draw incoming screen during dissolve
        if (dissolve > 0.01) {
          const nextImg = loadedImages[nextIdx];
          if (nextImg && nextImg.naturalWidth > 0) {
            ctx.globalAlpha = dissolve;
            ctx.drawImage(nextImg, 0, 0, 540, 960);
          }
        }
        ctx.restore();

        // 4. Draw mellow cyan volumetric laser beams
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let b = 0; b < 5; b++) {
          const sweep = (b - 2) * 0.22 + Math.sin(t * 1.4 + b) * 0.25;
          const targetX = 270 + Math.sin(sweep) * 960;
          const grad = ctx.createLinearGradient(270, -20, targetX, 1000);
          grad.addColorStop(0, 'rgba(6, 182, 212, 0.40)');
          grad.addColorStop(0.6, 'rgba(236, 72, 153, 0.18)');
          grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(265, -20);
          ctx.lineTo(275, -20);
          ctx.lineTo(targetX + 25, 1000);
          ctx.lineTo(targetX - 25, 1000);
          ctx.closePath();
          ctx.fill();
        }

        // 5. Glowing RIBO Neon Sign at Top
        ctx.font = '900 36px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#f43f5e';
        ctx.fillText('RIBO', 270, 90);
        ctx.shadowBlur = 0;

        ctx.font = '600 11px Rajdhani, sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('OWN THE MUSIC · KEEP THE RIGHTS', 270, 110);

        // 6. Loop Watermark Badge
        ctx.font = '700 11px Orbitron, sans-serif';
        ctx.fillStyle = 'rgba(6, 182, 212, 0.85)';
        ctx.fillText(`RIBBY // SCREEN ${activeIdx + 1}/4 [10S LOOP]`, 270, 930);

        ctx.restore();

        if (frame >= totalFrames) {
          clearInterval(renderInterval);
          recorder.stop();
        }
      }, 1000 / fps);

    } catch (err) {
      console.error('Loop render error:', err);
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Film size={18} className="text-emerald-400" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cyber text-xs sm:text-sm font-bold text-white tracking-wider">
                10S LOOP MAKER & REEL STUDIO
              </span>
              <span className="text-[10px] font-hud px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
                ACTIVE 4-SCREEN TIMELINE
              </span>
            </div>
            <p className="font-hud text-xs text-zinc-400 mt-0.5">
              Live interactive sequencer: arrange camera angles, customize transitions, and export the 10-second reel.
            </p>
          </div>
        </div>

        {/* Preset quick buttons */}
        <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-zinc-800 text-[11px] font-hud self-stretch sm:self-auto">
          <button
            onClick={() => handleSetSequencePreset('cycle-all')}
            className="py-1 px-2 rounded font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-all"
            title="1 -> 2 -> 3 -> 4"
          >
            All 4 Angles
          </button>
          <button
            onClick={() => handleSetSequencePreset('closeup-action')}
            className="py-1 px-2 rounded font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-all"
            title="Front -> Close-up -> Orbit -> Close-up"
          >
            Close-up Focus
          </button>
          <button
            onClick={() => handleSetSequencePreset('reverse')}
            className="py-1 px-2 rounded font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-all"
            title="4 -> 3 -> 2 -> 1"
          >
            Reverse Sweep
          </button>
        </div>
      </div>

      {/* 4-Slot Timeline Sequencer */}
      <div className="flex flex-col gap-2 p-3 rounded-lg bg-black/50 border border-zinc-800">
        <div className="flex items-center justify-between text-xs font-hud">
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
            <Clock size={13} className="text-cyan-400" />
            10-SECOND LOOP TIMELINE (4 SLOTS · 2.5s EACH):
          </span>
          <span className="font-mono text-cyan-400 text-[11px]">
            NOW PLAYING: SLOT {currentSlotIndex + 1}/4 ({previewTime.toFixed(1)}s)
          </span>
        </div>

        {/* 4 Slot Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {slotScreens.map((screenIdx, slotIdx) => {
            const isSlotActive = currentSlotIndex === slotIdx;
            const startTime = slotIdx * 2.5;
            const endTime = (slotIdx + 1) * 2.5;
            const screen = RIBBY_IMAGE_ARRAY[screenIdx];

            return (
              <div
                key={slotIdx}
                className={`p-2 rounded-lg border flex flex-col gap-1.5 transition-all ${
                  isSlotActive
                    ? 'bg-cyan-950/40 border-cyan-500/80 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                    : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Slot Header */}
                <div className="flex items-center justify-between text-[11px] font-hud">
                  <span className={`font-bold ${isSlotActive ? 'text-cyan-300' : 'text-zinc-400'}`}>
                    SLOT {slotIdx + 1}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500">
                    {startTime}s - {endTime}s
                  </span>
                </div>

                {/* Thumbnail Preview */}
                <div className="relative aspect-[9/16] max-h-32 rounded overflow-hidden bg-black border border-zinc-800">
                  <img
                    src={screen?.src}
                    alt={screen?.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {isSlotActive && (
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-cyan-500 text-black font-cyber font-bold text-[9px] shadow-sm">
                      ACTIVE
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 font-mono text-[9px] text-zinc-300">
                    {screen?.angleLabel}
                  </div>
                </div>

                {/* Angle Selector Dropdown for this slot */}
                <select
                  value={screenIdx}
                  onChange={(e) => handleSlotChange(slotIdx, parseInt(e.target.value, 10))}
                  className="w-full py-1 px-1.5 rounded bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs font-hud focus:border-cyan-400 focus:outline-none cursor-pointer"
                >
                  {RIBBY_IMAGE_ARRAY.map((s, idx) => (
                    <option key={s.id} value={idx}>
                      {s.shortTitle} ({s.angleLabel})
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Preview Stage & Export Panel */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-lg bg-black/60 border border-zinc-800/80">
        {/* Real-Time 9:16 Video Canvas / Video Result */}
        <div className="relative w-32 sm:w-36 aspect-[9/16] rounded-xl overflow-hidden border-2 border-zinc-700 bg-zinc-950 flex-shrink-0 flex items-center justify-center shadow-lg">
          {downloadUrl ? (
            <video
              src={downloadUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="relative w-full h-full">
              {/* Primary active screen */}
              <img
                src={RIBBY_IMAGE_ARRAY[activeScreenIndex]?.src}
                alt="Active Preview Screen"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-opacity duration-150"
                style={{
                  opacity: 1.0 - dissolveAmount,
                }}
              />
              {/* Dissolve incoming screen */}
              {dissolveAmount > 0.01 && (
                <img
                  src={RIBBY_IMAGE_ARRAY[nextScreenIndex]?.src}
                  alt="Next Preview Screen"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    opacity: dissolveAmount,
                  }}
                />
              )}

              {/* Live Preview Canvas for recorder */}
              <canvas
                ref={previewCanvasRef}
                width={540}
                height={960}
                className="hidden"
              />

              {/* Watermark in preview */}
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[9px] text-cyan-300 font-bold border border-cyan-500/30">
                SCR {activeScreenIndex + 1}/4
              </div>

              <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between px-1.5 py-0.5 rounded bg-black/80 font-mono text-[9px] text-zinc-300">
                <span>{previewTime.toFixed(1)}s</span>
                <span className="text-emerald-400">10.0s LOOP</span>
              </div>
            </div>
          )}
        </div>

        {/* Controls, Soundtrack Picker & Export Trigger */}
        <div className="flex-1 flex flex-col gap-3 w-full">
          {/* Preview Play/Pause & Transition Style */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPreviewPlaying(!isPreviewPlaying)}
                className="py-1 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-cyber text-xs flex items-center gap-1.5 border border-zinc-700 transition-colors"
              >
                {isPreviewPlaying ? <Pause size={12} /> : <Play size={12} className="fill-current" />}
                {isPreviewPlaying ? 'PAUSE PREVIEW' : 'RESUME PREVIEW'}
              </button>

              <button
                onClick={() => setPreviewTime(0)}
                className="py-1 px-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-hud text-xs border border-zinc-700"
                title="Restart 10s loop"
              >
                Restart (0s)
              </button>
            </div>

            {/* Transition Selector */}
            <div className="flex items-center gap-1.5 text-xs font-hud">
              <span className="text-zinc-400">TRANSITION:</span>
              <select
                value={transitionStyle}
                onChange={(e) => setTransitionStyle(e.target.value as TransitionStyle)}
                className="py-1 px-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-hud cursor-pointer"
              >
                <option value="crossfade">Smooth Crossfade (0.4s)</option>
                <option value="cut">Direct Hard Cut</option>
                <option value="dissolve">Slow Ambient Dissolve</option>
              </select>
            </div>
          </div>

          {/* Soundtrack Selection for Export */}
          <div className="flex flex-col gap-1 text-xs font-hud">
            <span className="text-zinc-400 flex items-center gap-1">
              <Music size={12} className="text-cyan-400" />
              SOUNDTRACK EMBEDDED IN VIDEO:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {MELLOW_SONGS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSong(s.id);
                    audioSingleton.setSong(s.id);
                  }}
                  className={`py-1 px-2 rounded text-[11px] font-medium text-left truncate transition-all ${
                    selectedSong === s.id
                      ? 'bg-cyan-500 text-black font-bold shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                  title={`${s.title} (${s.genre})`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          {/* Export Progress & Actions */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-zinc-800/80">
            <div className="flex items-center justify-between text-xs font-hud">
              <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                {isExporting ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-cyan-400" />
                    RENDERING 10S VIDEO CLIP ({exportProgress}%) · SCREEN {exportScreenStatus}/4
                  </>
                ) : downloadUrl ? (
                  <>
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    10S VIDEO REEL READY FOR DOWNLOAD!
                  </>
                ) : (
                  <>
                    <Sparkles size={13} className="text-cyan-400" />
                    Ready to export customized 10s multi-screen loop
                  </>
                )}
              </span>
              {isExporting && (
                <span className="font-mono text-cyan-400 text-xs">{exportProgress}%</span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-emerald-400 transition-all duration-150"
                style={{ width: `${exportProgress}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {downloadUrl ? (
                <>
                  <a
                    href={downloadUrl}
                    download="Ribby_The_Rebel_10s_Cinematic_Reel.webm"
                    className="py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-cyber text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all"
                  >
                    <Download size={14} />
                    DOWNLOAD 10S VIDEO CLIP
                  </a>
                  <button
                    onClick={startExport}
                    className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-hud text-xs flex items-center gap-1.5 transition-colors border border-zinc-700"
                  >
                    <RefreshCw size={13} />
                    Re-render Loop
                  </button>
                </>
              ) : (
                <button
                  onClick={startExport}
                  disabled={isExporting}
                  className={`py-2 px-5 rounded-lg font-cyber text-xs font-bold flex items-center gap-2 transition-all ${
                    isExporting
                      ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/30'
                  }`}
                >
                  {isExporting ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-black" />
                      RENDERING 10S MULTI-SCREEN LOOP...
                    </>
                  ) : (
                    <>
                      <Film size={14} />
                      RENDER & EXPORT 10S VIDEO CLIP
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
