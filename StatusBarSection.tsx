import React from "react";
import { Info } from "lucide-react";
import type { StatusBarSettings, UILang } from "../types";
import { UI_COPY } from "../i18n";

interface StatusBarSectionProps {
  statusBar: StatusBarSettings;
  onChange: (patch: Partial<StatusBarSettings>) => void;
  lang: UILang;
}

export const StatusBarSection: React.FC<StatusBarSectionProps> = ({
  statusBar,
  onChange,
  lang,
}) => {
  return (
    <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {lang === "si" ? "Android Status තීරුව (Status Bar)" : "Android Status Bar Configuration"}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure status bar visibility, background color, and icon contrast.
        </p>
      </div>

      <div className="p-3.5 rounded-lg bg-sky-500/10 border border-sky-500/25 text-xs text-sky-800 dark:text-sky-200 flex items-start gap-2.5">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-500" />
        <p>{UI_COPY[lang].simStatusNotice}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="space-y-1.5 block">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Background Color
          </span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={statusBar.backgroundColor}
              onChange={(e) => onChange({ backgroundColor: e.target.value })}
              className="w-10 h-9 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={statusBar.backgroundColor}
              onChange={(e) => onChange({ backgroundColor: e.target.value })}
              className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs"
            />
          </div>
        </label>

        <label className="space-y-1.5 block">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Status Bar Icons
          </span>
          <select
            value={statusBar.iconStyle}
            onChange={(e) =>
              onChange({ iconStyle: e.target.value as StatusBarSettings["iconStyle"] })
            }
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
          >
            <option value="light">Light Icons (for dark backgrounds)</option>
            <option value="dark">Dark Icons (for light backgrounds)</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={statusBar.visible}
            onChange={(e) => onChange({ visible: e.target.checked })}
            className="accent-sky-500"
          />
          Show Status Bar
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={statusBar.transparent}
            onChange={(e) => onChange({ transparent: e.target.checked })}
            className="accent-sky-500"
          />
          Transparent Overlay
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={statusBar.showTime}
            onChange={(e) => onChange({ showTime: e.target.checked })}
            className="accent-sky-500"
          />
          Time Visibility
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={statusBar.showBattery}
            onChange={(e) => onChange({ showBattery: e.target.checked })}
            className="accent-sky-500"
          />
          Battery Visibility
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={statusBar.showNetwork}
            onChange={(e) => onChange({ showNetwork: e.target.checked })}
            className="accent-sky-500"
          />
          Network Indicators
        </label>
      </div>
    </div>
  );
};
