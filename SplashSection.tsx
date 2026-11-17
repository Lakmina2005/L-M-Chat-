import React, { useRef, useState } from "react";
import { AlertTriangle, Upload, Video, Sparkles } from "lucide-react";
import type { SplashSettings, SplashVideoSettings, UILang } from "../types";
import { parseGoogleDriveVideoUrl } from "../utils/validators";

interface SplashSectionProps {
  splash: SplashSettings;
  onChange: (patch: Partial<SplashSettings>) => void;
  lang: UILang;
  onReplaySplash: () => void;
  onNotify: (msg: string) => void;
}

const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

export const SplashSection: React.FC<SplashSectionProps> = ({
  splash,
  onChange,
  lang,
  onReplaySplash,
  onNotify,
}) => {
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  const updateVideo = (patch: Partial<SplashVideoSettings>) => {
    onChange({ video: { ...splash.video, ...patch } });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoError(null);

    if (file.size > MAX_VIDEO_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setVideoError(
        `Upload blocked: Video size (${sizeMb} MB) exceeds the strict 100 MB maximum limit.`
      );
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateVideo({
        enabled: true,
        sourceType: "local",
        localFileName: file.name,
        localSizeBytes: file.size,
        localDataUrl: String(reader.result || ""),
      });
      onNotify(`Loaded splash video ${file.name}`);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const gdriveCheck = parseGoogleDriveVideoUrl(splash.video.url);

  return (
    <div className="space-y-6">
      {/* Main Splash Controls */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {lang === "si" ? "Splash තිර සැකසුම් (Splash Screen)" : "Splash Screen Builder"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Customize launch animation, duration, branding, and optional background video.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={splash.enabled}
                onChange={(e) => onChange({ enabled: e.target.checked })}
                className="accent-sky-500"
              />
              Show Splash
            </label>
            <button
              type="button"
              onClick={onReplaySplash}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Test Splash</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Duration ({(splash.durationMs / 1000).toFixed(1)}s / {splash.durationMs}ms)
            </span>
            <div className="flex items-center gap-1.5">
              {[1000, 2000, 3000, 5000].map((ms) => (
                <button
                  key={ms}
                  type="button"
                  onClick={() => onChange({ durationMs: ms })}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono tabular-nums border ${
                    splash.durationMs === ms
                      ? "bg-sky-600 border-sky-600 text-white"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {ms / 1000}s
                </button>
              ))}
            </div>
            <input
              type="number"
              min={300}
              max={15000}
              step={100}
              value={splash.durationMs}
              onChange={(e) =>
                onChange({ durationMs: Math.max(300, Number(e.target.value) || 1000) })
              }
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono tabular-nums"
            />
          </div>

          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Subtitle
            </span>
            <input
              type="text"
              value={splash.subtitle}
              onChange={(e) => onChange({ subtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Position
            </span>
            <select
              value={splash.position}
              onChange={(e) =>
                onChange({ position: e.target.value as SplashSettings["position"] })
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            >
              <option value="center">Center</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </select>
          </label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Animation Type
            </span>
            <select
              value={splash.animation}
              onChange={(e) =>
                onChange({ animation: e.target.value as SplashSettings["animation"] })
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            >
              <option value="fade-in">Fade in</option>
              <option value="fade-out">Fade out</option>
              <option value="zoom">Zoom</option>
              <option value="slide">Slide</option>
              <option value="pulse">Pulse</option>
            </select>
          </label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Loading Indicator
            </span>
            <select
              value={splash.loadingAnimation}
              onChange={(e) =>
                onChange({
                  loadingAnimation: e.target.value as SplashSettings["loadingAnimation"],
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            >
              <option value="bar">Progress Bar</option>
              <option value="spinner">Spinner</option>
              <option value="dots">Dots</option>
              <option value="none">None</option>
            </select>
          </label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Icon Size ({splash.iconSize}px) · Name ({splash.nameSize}px)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={40}
                max={140}
                value={splash.iconSize}
                onChange={(e) => onChange({ iconSize: Number(e.target.value) })}
                className="flex-1 accent-sky-500"
              />
              <input
                type="range"
                min={16}
                max={40}
                value={splash.nameSize}
                onChange={(e) => onChange({ nameSize: Number(e.target.value) })}
                className="flex-1 accent-sky-500"
              />
            </div>
          </label>
        </div>

        {/* Background Mode & Colors */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={splash.showIcon}
              onChange={(e) => onChange({ showIcon: e.target.checked })}
              className="accent-sky-500"
            />
            Show DP/Icon
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={splash.showName}
              onChange={(e) => onChange({ showName: e.target.checked })}
              className="accent-sky-500"
            />
            Show App Name
          </label>
          <select
            value={splash.backgroundMode}
            onChange={(e) =>
              onChange({
                backgroundMode: e.target.value as SplashSettings["backgroundMode"],
              })
            }
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="solid">Solid Background</option>
            <option value="gradient">Gradient Background</option>
          </select>

          {splash.backgroundMode === "gradient" ? (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={splash.gradientFrom}
                onChange={(e) => onChange({ gradientFrom: e.target.value })}
                className="w-8 h-7 rounded cursor-pointer bg-transparent"
              />
              <span>to</span>
              <input
                type="color"
                value={splash.gradientTo}
                onChange={(e) => onChange({ gradientTo: e.target.value })}
                className="w-8 h-7 rounded cursor-pointer bg-transparent"
              />
            </div>
          ) : (
            <input
              type="color"
              value={splash.backgroundColor}
              onChange={(e) => onChange({ backgroundColor: e.target.value })}
              className="w-8 h-7 rounded cursor-pointer bg-transparent"
            />
          )}

          <div className="flex items-center gap-1.5">
            <span>Text</span>
            <input
              type="color"
              value={splash.textColor}
              onChange={(e) => onChange({ textColor: e.target.value })}
              className="w-8 h-7 rounded cursor-pointer bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Splash Video */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-sky-500" />
              <span>Splash Video (Max 100 MB)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports Local MP4 (≤ 100 MB), HTTPS video URLs, or stream-compatible Google Drive links.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={splash.video.enabled}
              onChange={(e) => updateVideo({ enabled: e.target.checked })}
              className="accent-sky-500"
            />
            Enable Video
          </label>
        </div>

        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,.mp4"
          onChange={handleVideoUpload}
          className="hidden"
        />

        {videoError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{videoError}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Local MP4 (Max 100 MB)</span>
          </button>

          {splash.video.localFileName && (
            <span className="text-xs text-slate-500 dark:text-slate-400 self-center font-mono">
              {splash.video.localFileName} (
              {(splash.video.localSizeBytes / (1024 * 1024)).toFixed(2)} MB)
            </span>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Web / HTTPS / Stream-Compatible Google Drive Video URL
          </label>
          <input
            type="url"
            value={splash.video.url}
            onChange={(e) =>
              updateVideo({
                url: e.target.value,
                sourceType: e.target.value.includes("drive.google.com")
                  ? "gdrive"
                  : "web",
              })
            }
            placeholder="https://example.com/intro.mp4"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
          />

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 space-y-1.5">
            <p>
              {lang === "si"
                ? "වැදගත්: සාමාන්‍ය Google Drive share link (/view) එකක් <video> tag එක තුළ සැමවිටම direct stream ලෙස වැඩ නොකරයි. Direct MP4/CDN URL එකක් හෝ public direct-stream URL එකක් භාවිතා කරන්න."
                : "Note: Ordinary Google Drive sharing URLs (/file/d/.../view) return an HTML viewer page and will not always play inside a <video> source. Use a direct MP4 stream URL or compatible direct download endpoint."}
            </p>
            {gdriveCheck.isSharePage && gdriveCheck.suggestedDirectUrl && (
              <button
                type="button"
                onClick={() => updateVideo({ url: gdriveCheck.suggestedDirectUrl })}
                className="underline font-medium"
              >
                Convert to direct Drive link format
              </button>
            )}
          </div>
        </div>

        {/* Video Playback & Framing Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <label className="space-y-1 block text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Object Fit
            </span>
            <select
              value={splash.video.objectFit}
              onChange={(e) =>
                updateVideo({
                  objectFit: e.target.value as SplashVideoSettings["objectFit"],
                })
              }
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
            </select>
          </label>

          <label className="space-y-1 block text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Position
            </span>
            <select
              value={splash.video.position}
              onChange={(e) =>
                updateVideo({
                  position: e.target.value as SplashVideoSettings["position"],
                })
              }
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              <option value="center">Center</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </select>
          </label>

          <label className="space-y-1 block text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Duration (sec) · Crop Zoom ({splash.video.cropZoom}x)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={30}
                value={splash.video.durationSec}
                onChange={(e) =>
                  updateVideo({ durationSec: Math.max(1, Number(e.target.value) || 3) })
                }
                className="w-16 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums"
              />
              <input
                type="range"
                min={1}
                max={2}
                step={0.05}
                value={splash.video.cropZoom}
                onChange={(e) => updateVideo({ cropZoom: Number(e.target.value) })}
                className="flex-1 accent-sky-500"
              />
            </div>
          </label>
        </div>

        <div className="flex flex-wrap gap-4 text-xs">
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={splash.video.autoplay}
              onChange={(e) => updateVideo({ autoplay: e.target.checked })}
              className="accent-sky-500"
            />
            Autoplay
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={splash.video.muted}
              onChange={(e) => updateVideo({ muted: e.target.checked })}
              className="accent-sky-500"
            />
            Muted
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={splash.video.loop}
              onChange={(e) => updateVideo({ loop: e.target.checked })}
              className="accent-sky-500"
            />
            Loop
          </label>
        </div>
      </div>
    </div>
  );
};
