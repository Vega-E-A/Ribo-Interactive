import React, { useState } from 'react';
import { Download, Film, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { audioSingleton } from '../audio/cyberpunkAudio';

interface Props {
  orbitAngle?: number;
}

export const VideoExporter: React.FC<Props> = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const startExport = async () => {
    try {
      setIsExporting(true);
      setExportProgress(10);
      setDownloadUrl(null);

      // Create an offscreen render canvas for 9:16 vertical video (1080x1920)
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 1080;
      exportCanvas.height = 1920;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D context');

      // Load the 4 images for multi-angle orbit rendering
      const imgUrls = [
        '/src/assets/images/ribby_rebel_dance_front_1791393508947.jpg',
        '/src/assets/images/ribby_camera_orbit_angle_1791393519291.jpg',
        '/src/assets/images/ribby_closeup_focus_1791393530166.jpg',
        '/src/assets/images/ribby_wide_club_stage_1791393541142.jpg',
      ];

      const loadedImages = await Promise.all<HTMLImageElement>(
        imgUrls.map(
          (src) =>
            new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.src = src;
              img.onload = () => resolve(img);
              img.onerror = () => reject(new Error('Failed to load ' + src));
            })
        )
      );

      setExportProgress(30);

      // Setup MediaStream & MediaRecorder
      const fps = 30;
      const stream = exportCanvas.captureStream(fps);

      // Connect Web Audio Destination to capture audio if available
      const audioCtx = audioSingleton.getAudioContext();
      if (audioCtx) {
        const dest = audioCtx.createMediaStreamDestination();
        const gain = audioSingleton.getGainNode();
        if (gain) {
          gain.connect(dest);
          dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
        }
      }

      // Check supported MIME types
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8000000, // 8 Mbps high quality
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

      // Trigger audio play
      if (!audioSingleton.getIsPlaying()) {
        audioSingleton.start();
      }

      // Render 10 seconds of frames at 30 fps = 300 frames
      const totalFrames = 300;
      let frame = 0;

      const renderInterval = setInterval(() => {
        frame++;
        const t = frame / fps; // 0 to 10 seconds
        setExportProgress(Math.min(95, Math.round(30 + (t / 10) * 65)));

        // Orbit angle across 10 seconds (0 to 360 deg)
        const angle = (t / 10) * 360;
        const normAngle = ((angle % 360) + 360) % 360;

        // Weights
        const w = [0, 0, 0, 0];
        if (normAngle >= 0 && normAngle < 90) {
          const ratio = normAngle / 90;
          w[0] = 1 - ratio;
          w[1] = ratio;
        } else if (normAngle >= 90 && normAngle < 180) {
          const ratio = (normAngle - 90) / 90;
          w[1] = 1 - ratio;
          w[2] = ratio;
        } else if (normAngle >= 180 && normAngle < 270) {
          const ratio = (normAngle - 180) / 90;
          w[2] = 1 - ratio;
          w[3] = ratio;
        } else {
          const ratio = (normAngle - 270) / 90;
          w[3] = 1 - ratio;
          w[0] = ratio;
        }

        // Draw crossfade images
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 1080, 1920);

        for (let i = 0; i < loadedImages.length; i++) {
          if (w[i] > 0.01) {
            ctx.globalAlpha = w[i];
            // Add subtle orbit translation
            const offsetX = Math.sin((angle * Math.PI) / 180) * 20;
            ctx.drawImage(loadedImages[i], offsetX, 0, 1080, 1920);
          }
        }

        ctx.globalAlpha = 1.0;

        // Draw Volumetric Laser Beams
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const beamCount = 6;
        for (let b = 0; b < beamCount; b++) {
          const sweep = (b - 2.5) * 0.25 + Math.sin(t * 2.5 + b) * 0.3;
          const targetX = 540 + Math.sin(sweep) * 1920;
          const grad = ctx.createLinearGradient(540, -50, targetX, 2000);
          grad.addColorStop(0, 'rgba(6, 182, 212, 0.9)');
          grad.addColorStop(0.5, 'rgba(236, 72, 153, 0.4)');
          grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(530, -50);
          ctx.lineTo(550, -50);
          ctx.lineTo(targetX + 40, 2000);
          ctx.lineTo(targetX - 40, 2000);
          ctx.closePath();
          ctx.fill();
        }

        // Neon RIBO Sign at top center
        ctx.font = '900 80px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#f43f5e';
        ctx.fillText('RIBO', 540, 220);
        ctx.shadowBlur = 0;

        // Glowing Cyan Sub-Dermal Circuits
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(490, 800);
        ctx.lineTo(520, 860);
        ctx.lineTo(570, 890);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();

        if (frame >= totalFrames) {
          clearInterval(renderInterval);
          recorder.stop();
        }
      }, 1000 / fps);

    } catch (err) {
      console.error('Export error:', err);
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex flex-col gap-1 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <Film size={16} className="text-cyan-400" />
          <span className="font-cyber text-xs font-bold text-white tracking-wider">
            EXPORT 10S MOTION LOOP (9:16)
          </span>
          <span className="text-[10px] font-hud px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
            VERTICAL REEL
          </span>
        </div>
        <p className="font-hud text-xs text-zinc-400">
          Render seamless 10-second high-energy video loop with camera orbit, lasers, and audio sample.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {downloadUrl ? (
          <a
            href={downloadUrl}
            download="Ribby_The_Rebel_RIBO_Underground_10s.webm"
            className="py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-cyber text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all"
          >
            <Download size={14} />
            DOWNLOAD 10S VIDEO CLIP
          </a>
        ) : (
          <button
            onClick={startExport}
            disabled={isExporting}
            className={`py-2 px-4 rounded-lg font-cyber text-xs font-bold flex items-center gap-2 transition-all ${
              isExporting
                ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/30'
            }`}
          >
            {isExporting ? (
              <>
                <Loader2 size={14} className="animate-spin text-cyan-400" />
                RENDERING REEL ({exportProgress}%)
              </>
            ) : (
              <>
                <Sparkles size={14} />
                RENDER 10S VERTICAL CLIP
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
