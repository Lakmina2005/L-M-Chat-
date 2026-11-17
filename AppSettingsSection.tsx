import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { AppSettings, UILang } from "../types";
import { validatePackageName } from "../utils/validators";

interface AppSettingsSectionProps {
  settings: AppSettings;
  lang: UILang;
  onChange: (patch: Partial<AppSettings>) => void;
}

export const AppSettingsSection: React.FC<AppSettingsSectionProps> = ({
  settings,
  lang,
  onChange,
}) => {
  const pkgValidation = validatePackageName(settings.packageName);

  return (
    <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {lang === "si" ? "ඇප් මූලික සැකසුම් (App Settings)" : "App Basic Settings"}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure Android identity, theme palette, typography, and orientation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1.5 block">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            App Name
          </span>
          <input
            type="text"
            value={settings.appName}
            onChange={(e) => onChange({ appName: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
          />
        </label>

        <label className="space-y-1.5 block">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Package Name (Android ID)
          </span>
          <input
            type="text"
            value={settings.packageName}
            onChange={(e) => onChange({ packageName: e.target.value.toLowerCase() })}
            placeholder="com.example.myapp"
            className={`w-full px-3 py-2 rounded-lg border font-mono text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white ${
              pkgValidation.valid
                ? "border-slate-200 dark:border-slate-700"
                : "border-rose-500"
            }`}
          />
          {pkgValidation.valid ? (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Valid Android package format
            </p>
          ) : (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-start gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{pkgValidation.error}</span>
            </p>
          )}
        </label>

        <label className="space-y-1.5 block">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Version Name
          </span>
          <input
            type="text"
            value={settings.versionName}
            onChange={(e) => onChange({ versionName: e.target.value })}
            placeholder="1.0.0"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white"
          />
        </label>

        <label className="space-y-1.5 block">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Version Code (Integer)
          </span>
          <input
            type="number"
            min={1}
            value={settings.versionCode}
            onChange={(e) =>
              onChange({ versionCode: Math.max(1, Number(e.target.value) || 1) })
            }
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono tabular-nums text-slate-900 dark:text-white"
          />
        </label>

        <label className="space-y-1.5 block">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Developer Name
          </span>
          <input
            type="text"
            value={settings.developerName}
            onChange={(e) => onChange({ developerName: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
          />
        </label>

        <label className="space-y-1.5 block">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Orientation
          </span>
          <select
            value={settings.orientation}
            onChange={(e) =>
              onChange({
                orientation: e.target.value as AppSettings["orientation"],
              })
            }
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
            <option value="auto">Auto</option>
          </select>
        </label>

        <label className="space-y-1.5 block">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Default Font Family
          </span>
          <select
            value={settings.fontFamily}
            onChange={(e) => onChange({ fontFamily: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
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
            App Language
          </span>
          <select
            value={settings.language}
            onChange={(e) => onChange({ language: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
          >
            <option value="en-si">English + Sinhala (සිංහල)</option>
            <option value="en">English</option>
            <option value="si">Sinhala (සිංහල)</option>
          </select>
        </label>
      </div>

      <label className="space-y-1.5 block">
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
          App Description
        </span>
        <textarea
          rows={3}
          value={settings.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
        />
      </label>

      {/* Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
        {(
          [
            { key: "themeColor", label: "App Theme Color" },
            { key: "backgroundColor", label: "Background Color" },
            { key: "textColor", label: "Text Color" },
          ] as const
        ).map(({ key, label }) => (
          <label key={key} className="space-y-1.5 block">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {label}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings[key]}
                onChange={(e) => onChange({ [key]: e.target.value })}
                className="w-10 h-9 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={settings[key]}
                onChange={(e) => onChange({ [key]: e.target.value })}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
              />
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};
