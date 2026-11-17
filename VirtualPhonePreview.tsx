import React, { useMemo, useState, useEffect } from "react";
import {
  RotateCcw,
  Sparkles,
  Battery,
  Wifi,
  Signal,
  Smartphone,
  Tablet,
  Monitor,
} from "lucide-react";
import type {
  AppProject,
  ConsoleEntry,
  DeviceType,
  PreviewSizeMode,
  UILang,
} from "../types";
import { buildAppDocumentHtml } from "../utils/generators";
import { UI_COPY } from "../i18n";

interface VirtualPhonePreviewProps {
  project: AppProject;
  runNonce: number;
  lang: UILang;
  onUpdatePreview: (patch: Partial<AppProject["preview"]>) => void;
  onConsoleMessage: (entry: ConsoleEntry) => void;
}

const DEVICE_DIMENSIONS: Record<
  DeviceType,
  { label: string; width: number; height: number; radius: number; notch: "pill" | "hole" | "none" }
> = {
  "android-phone": {
    label: "Android Phone",
    width: 340,
    height: 640,
    radius: 34,
    notch: "hole",
  },
  "small-phone": {
    label: "Small Phone",
    width: 300,
    height: 540,
    radius: 28,
    notch: "none",
  },
  "large-phone": {
    label: "Large Phone",
    width: 380,
    height: 700,
    radius: 36,
    notch: "hole",
  },
  tablet: {
    label: "Tablet",
    width: 480,
    height: 620,
    radius: 24,
    notch: "none",
  },
  iphone: {
    label: "iPhone",
    width: 345,
    height: 650,
    radius: 40,
    notch: "pill",
  },
};

export const VirtualPhonePreview: React.FC<VirtualPhonePreviewProps> = ({
  project,
  runNonce,
  lang,
  onUpdatePreview,
  onConsoleMessage,
}) => {
  const [playSplash, setPlaySplash] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      if (
        ev.data &&
        typeof ev.data === "object" &&
        ev.data.source === "appforge-preview" &&
        ev.data.type === "console"
      ) {
        onConsoleMessage({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          level: ev.data.level || "log",
          message: String(ev.data.message || ""),
          timestamp: new Date().toLocaleTimeString(),
          source: "preview-iframe",
        });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onConsoleMessage]);

  const srcDoc = useMemo(() => {
    return buildAppDocumentHtml(project, {
      includeBridge: true,
      playSplash,
    });
  }, [project, playSplash, runNonce, reloadTick]);

  const deviceSpec = DEVICE_DIMENSIONS[project.preview.device];

  let frameWidth = deviceSpec.width;
  let frameHeight = deviceSpec.height;
  if (project.preview.sizeMode === "tablet") {
    frameWidth = 500;
    frameHeight = 640;
  } else if (project.preview.sizeMode === "desktop") {
    frameWidth = 680;
    frameHeight = 520;
  } else if (project.preview.sizeMode === "custom") {
    frameWidth = Math.max(260, Math.min(900, project.preview.customWidth || 360));
    frameHeight = Math.max(360, Math.min(960, project.preview.customHeight || 660));
  }

  if (project.appSettings.orientation === "landscape") {
    const tmp = frameWidth;
    frameWidth = Math.max(frameHeight, 480);
    frameHeight = Math.min(tmp, 400);
  }

  const sb = project.statusBar;
  const nowStr = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col h-full bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <select
            aria-label="Device selector"
            value={project.preview.device}
            onChange={(e) =>
              onUpdatePreview({
                device: e.target.value as DeviceType,
                sizeMode: e.target.value === "tablet" ? "tablet" : "mobile",
              })
            }
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
          >
            {Object.entries(DEVICE_DIMENSIONS).map(([key, spec]) => (
              <option key={key} value={key}>
                {spec.label}
              </option>
            ))}
          </select>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
            {(
              [
                { id: "mobile", icon: Smartphone, label: "Mobile" },
                { id: "tablet", icon: Tablet, label: "Tablet" },
                { id: "desktop", icon: Monitor, label: "Desktop" },
              ] as Array<{ id: PreviewSizeMode; icon: React.ComponentType<{ className?: string }>; label: string }>
            ).map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  title={m.label}
                  onClick={() => onUpdatePreview({ sizeMode: m.id })}
                  className={`px-2 py-1 rounded-md text-xs transition-colors flex items-center gap-1 ${
                    project.preview.sizeMode === m.id
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => onUpdatePreview({ sizeMode: "custom" })}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                project.preview.sizeMode === "custom"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setPlaySplash(true);
              setReloadTick((t) => t + 1);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            <span>Splash</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaySplash(false);
              setReloadTick((t) => t + 1);
            }}
            title="Reload preview"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {project.preview.sizeMode === "custom" && (
        <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span>W:</span>
            <input
              type="number"
              min={260}
              max={900}
              value={project.preview.customWidth}
              onChange={(e) =>
                onUpdatePreview({ customWidth: Number(e.target.value) || 360 })
              }
              className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono tabular-nums"
            />
          </label>
          <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span>H:</span>
            <input
              type="number"
              min={360}
              max={960}
              value={project.preview.customHeight}
              onChange={(e) =>
                onUpdatePreview({ customHeight: Number(e.target.value) || 660 })
              }
              className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono tabular-nums"
            />
          </label>
          <span className="text-slate-400">px</span>
        </div>
      )}

      {/* Device Stage */}
      <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center">
        <div
          className="relative flex flex-col bg-slate-950 border-[6px] border-slate-800 dark:border-slate-700 shadow-2xl overflow-hidden transition-all duration-200 shrink-0"
          style={{
            width: `${frameWidth}px`,
            maxWidth: "100%",
            height: `${frameHeight}px`,
            borderRadius: `${deviceSpec.radius}px`,
          }}
        >
          {/* Simulated Hardware Notch */}
          {deviceSpec.notch === "pill" && (
            <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 z-30 w-20 h-4 bg-black rounded-full" />
          )}
          {deviceSpec.notch === "hole" && (
            <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 z-30 w-3 h-3 bg-black rounded-full border border-slate-800" />
          )}

          {/* Simulated Android Status Bar */}
          {sb.visible && (
            <div
              className="relative z-20 px-4 h-7 flex items-center justify-between text-[11px] font-medium select-none shrink-0"
              style={{
                backgroundColor: sb.transparent ? "transparent" : sb.backgroundColor,
                color: sb.iconStyle === "dark" ? "#0f172a" : "#f8fafc",
              }}
            >
              <span className="font-mono tabular-nums">
                {sb.showTime ? nowStr : ""}
              </span>
              <div className="flex items-center gap-1.5">
                {sb.showNetwork && (
                  <>
                    <Signal className="w-3 h-3" />
                    <Wifi className="w-3 h-3" />
                  </>
                )}
                {sb.showBattery && <Battery className="w-3.5 h-3.5" />}
              </div>
            </div>
          )}

          {/* Sandboxed Live App Viewport */}
          <iframe
            key={`${reloadTick}_${runNonce}_${playSplash}`}
            title="Virtual Phone Live App Preview"
            srcDoc={srcDoc}
            sandbox="allow-scripts allow-forms allow-modals"
            className="w-full flex-1 border-0 bg-slate-950"
          />

          {/* Home Gesture Indicator */}
          <div className="h-4 bg-slate-950 flex items-center justify-center shrink-0">
            <div className="w-24 h-1 rounded-full bg-slate-700" />
          </div>
        </div>

        <p className="mt-3 text-[11px] text-center text-slate-500 dark:text-slate-400 max-w-sm">
          {UI_COPY[lang].simStatusNotice}
        </p>
      </div>
    </div>
  );
};
