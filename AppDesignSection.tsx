import React, { useRef, useState } from "react";
import {
  Upload,
  Crop,
  Globe,
  Sparkles,
  Loader2,
  Search,
} from "lucide-react";
import type { AppNameStyle, AppSettings, UILang } from "../types";
import { IconCropperModal } from "./IconCropperModal";

interface AppDesignSectionProps {
  iconDataUrl: string;
  onChangeIcon: (dataUrl: string) => void;
  appSettings: AppSettings;
  onChangeAppName: (name: string) => void;
  nameStyle: AppNameStyle;
  onChangeNameStyle: (patch: Partial<AppNameStyle>) => void;
  lang: UILang;
  onNotify: (msg: string) => void;
}

const PUBLIC_VECTOR_PRESETS = [
  {
    name: "Sky Bolt",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#0f172a"/><path d="M278 96L156 280h98l-20 136 122-184h-98z" fill="#38bdf8"/></svg>`,
  },
  {
    name: "Emerald Leaf",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#064e3b"/><path d="M160 352c16-120 96-192 208-192-16 112-88 192-208 192z" fill="#34d399"/><path d="M160 352L296 216" stroke="#ecfdf5" stroke-width="24" stroke-linecap="round"/></svg>`,
  },
  {
    name: "Amber Compass",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#1e1b4b"/><circle cx="256" cy="256" r="136" stroke="#f59e0b" stroke-width="24" fill="none"/><polygon points="256,156 296,256 256,356 216,256" fill="#fbbf24"/></svg>`,
  },
  {
    name: "Minimal Cube",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#111827"/><polygon points="256,112 384,184 384,328 256,400 128,328 128,184" stroke="#60a5fa" stroke-width="24" fill="none"/><path d="M128 184l128 72 128-72M256 256v144" stroke="#60a5fa" stroke-width="24"/></svg>`,
  },
];

export const AppDesignSection: React.FC<AppDesignSectionProps> = ({
  iconDataUrl,
  onChangeIcon,
  appSettings,
  onChangeAppName,
  nameStyle,
  onChangeNameStyle,
  lang,
  onNotify,
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [showIconSearch, setShowIconSearch] = useState(false);
  const [aiPrompt, setAiPrompt] = useState(
    "Make the app name futuristic blue neon style"
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState("");

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.(png|jpe?g|webp|svg)$/i.test(file.name)) {
      onNotify("Supported formats: PNG, JPG, JPEG, WEBP, SVG");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      if (file.name.toLowerCase().endsWith(".svg")) {
        onChangeIcon(result);
        onNotify("SVG icon applied");
      } else {
        setCropperSrc(result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const applyUrlIcon = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        onNotify("Please enter an HTTP or HTTPS image URL.");
        return;
      }
      onChangeIcon(url);
      onNotify("Image URL applied to App Icon");
    } catch {
      onNotify("Invalid image URL.");
    }
  };

  const applyLocalPromptFallback = (prompt: string) => {
    const lower = prompt.toLowerCase();
    const patch: Partial<AppNameStyle> = {};
    if (lower.includes("neon") || lower.includes("futuristic") || lower.includes("blue")) {
      patch.gradientEnabled = true;
      patch.gradientFrom = "#38bdf8";
      patch.gradientTo = "#6366f1";
      patch.bold = true;
      patch.letterSpacing = 1.5;
      patch.animation = "glow";
      patch.textShadow = "0 0 14px rgba(56, 189, 248, 0.7)";
    } else if (lower.includes("gold") || lower.includes("luxury") || lower.includes("serif")) {
      patch.fontFamily = "Georgia";
      patch.gradientEnabled = true;
      patch.gradientFrom = "#fbbf24";
      patch.gradientTo = "#d97706";
      patch.italic = true;
    } else if (lower.includes("minimal") || lower.includes("clean")) {
      patch.gradientEnabled = false;
      patch.textColor = "#f8fafc";
      patch.letterSpacing = 0.5;
      patch.animation = "none";
    }
    onChangeNameStyle(patch);
    setAiNote("Applied local style preset from prompt.");
  };

  const handleAiStyle = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiNote("");
    try {
      const res = await fetch("/api/gemini/style-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          currentName: appSettings.appName,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "AI styling unavailable");
      }
      const data = await res.json();
      if (data.style) {
        onChangeNameStyle(data.style);
        setAiNote(data.style.rationale || "AI typography preset applied.");
        onNotify("AI name style applied");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "AI fallback used";
      applyLocalPromptFallback(aiPrompt);
      onNotify(`${msg} — applied local style fallback`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* App DP / Icon */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {lang === "si" ? "ඇප් අයිකනය (App DP / Icon)" : "App DP / Icon Generator"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports PNG, JPG, JPEG, WEBP, SVG. Upload to crop & auto-generate a 512×512 square Android icon.
            </p>
          </div>
          <img
            src={iconDataUrl}
            alt="App Icon Preview"
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
          />
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleIconUpload}
          className="hidden"
        />

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Icon Image</span>
          </button>

          <button
            type="button"
            onClick={() => setCropperSrc(iconDataUrl)}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
          >
            <Crop className="w-3.5 h-3.5" />
            <span>Crop Current Icon</span>
          </button>

          <button
            type="button"
            onClick={() => setShowIconSearch((s) => !s)}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Image / Presets</span>
          </button>
        </div>

        {showIconSearch && (
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Select an open-source SVG icon preset or paste any direct public image URL below (no unauthorized scraping):
            </p>
            <div className="flex flex-wrap gap-3">
              {PUBLIC_VECTOR_PRESETS.map((preset) => {
                const url = `data:image/svg+xml;utf8,${encodeURIComponent(preset.svg)}`;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      onChangeIcon(url);
                      onNotify(`Applied ${preset.name} icon`);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-sky-500 text-xs"
                  >
                    <img src={url} alt={preset.name} className="w-7 h-7 rounded-md" />
                    <span>{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="url"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="Paste direct public image URL (https://...)"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>
          <button
            type="button"
            onClick={applyUrlIcon}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            Preview URL Icon
          </button>
        </div>
      </div>

      {/* App Name Designer */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {lang === "si" ? "ඇප් නම නිර්මාණය (App Name Designer)" : "App Name Designer"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Live typography controls and AI style prompt generator.
          </p>
        </div>

        <label className="space-y-1.5 block">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            App Name (Live Preview)
          </span>
          <input
            type="text"
            value={appSettings.appName}
            onChange={(e) => onChangeAppName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white"
          />
        </label>

        {/* AI Style Prompt */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            AI Name Style Prompt (Server-side Gemini integration)
          </span>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Make the app name futuristic blue neon style"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
            <button
              type="button"
              disabled={aiLoading}
              onClick={handleAiStyle}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Generate Style</span>
            </button>
          </div>
          {aiNote && <p className="text-[11px] text-sky-600 dark:text-sky-400">{aiNote}</p>}
        </div>

        {/* Typography Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Font Size ({nameStyle.fontSize}px)
            </span>
            <input
              type="range"
              min={14}
              max={42}
              value={nameStyle.fontSize}
              onChange={(e) => onChangeNameStyle({ fontSize: Number(e.target.value) })}
              className="w-full accent-sky-500"
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Letter Spacing ({nameStyle.letterSpacing}px)
            </span>
            <input
              type="range"
              min={-1}
              max={6}
              step={0.2}
              value={nameStyle.letterSpacing}
              onChange={(e) =>
                onChangeNameStyle({ letterSpacing: Number(e.target.value) })
              }
              className="w-full accent-sky-500"
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Font Family
            </span>
            <select
              value={nameStyle.fontFamily}
              onChange={(e) => onChangeNameStyle({ fontFamily: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            >
              <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
              <option value="Noto Sans Sinhala">Noto Sans Sinhala</option>
              <option value="JetBrains Mono">JetBrains Mono</option>
              <option value="Georgia">Georgia</option>
              <option value="system-ui">System UI</option>
            </select>
          </label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Alignment
            </span>
            <select
              value={nameStyle.alignment}
              onChange={(e) =>
                onChangeNameStyle({
                  alignment: e.target.value as AppNameStyle["alignment"],
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Animation
            </span>
            <select
              value={nameStyle.animation}
              onChange={(e) =>
                onChangeNameStyle({
                  animation: e.target.value as AppNameStyle["animation"],
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            >
              <option value="none">None</option>
              <option value="pulse">Pulse</option>
              <option value="glow">Glow</option>
              <option value="slide">Slide</option>
              <option value="float">Float</option>
            </select>
          </label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Text Shadow CSS
            </span>
            <input
              type="text"
              value={nameStyle.textShadow}
              onChange={(e) => onChangeNameStyle({ textShadow: e.target.value })}
              placeholder="0 2px 10px rgba(56,189,248,0.4)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={nameStyle.bold}
              onChange={(e) => onChangeNameStyle({ bold: e.target.checked })}
              className="accent-sky-500"
            />
            Bold
          </label>

          <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={nameStyle.italic}
              onChange={(e) => onChangeNameStyle({ italic: e.target.checked })}
              className="accent-sky-500"
            />
            Italic
          </label>

          <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={nameStyle.gradientEnabled}
              onChange={(e) => onChangeNameStyle({ gradientEnabled: e.target.checked })}
              className="accent-sky-500"
            />
            Gradient Text
          </label>

          {nameStyle.gradientEnabled ? (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="color"
                value={nameStyle.gradientFrom}
                onChange={(e) => onChangeNameStyle({ gradientFrom: e.target.value })}
                className="w-8 h-7 rounded cursor-pointer bg-transparent"
              />
              <span>to</span>
              <input
                type="color"
                value={nameStyle.gradientTo}
                onChange={(e) => onChangeNameStyle({ gradientTo: e.target.value })}
                className="w-8 h-7 rounded cursor-pointer bg-transparent"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span>Text Color</span>
              <input
                type="color"
                value={nameStyle.textColor}
                onChange={(e) => onChangeNameStyle({ textColor: e.target.value })}
                className="w-8 h-7 rounded cursor-pointer bg-transparent"
              />
            </div>
          )}
        </div>
      </div>

      {cropperSrc && (
        <IconCropperModal
          imageSrc={cropperSrc}
          onCancel={() => setCropperSrc(null)}
          onConfirm={(cropped) => {
            onChangeIcon(cropped);
            setCropperSrc(null);
            onNotify("Square 512×512 icon generated");
          }}
        />
      )}
    </div>
  );
};
