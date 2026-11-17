import React from "react";
import { Plus, Trash2 } from "lucide-react";
import type { BottomNavAction, BottomNavItem, BottomNavSettings, UILang } from "../types";

interface BottomNavSectionProps {
  bottomNav: BottomNavSettings;
  onChange: (patch: Partial<BottomNavSettings>) => void;
  lang: UILang;
  onNotify: (msg: string) => void;
}

const ICONS = [
  "home",
  "search",
  "user",
  "sliders",
  "check-square",
  "info",
  "globe",
  "star",
];

export const BottomNavSection: React.FC<BottomNavSectionProps> = ({
  bottomNav,
  onChange,
  lang,
  onNotify,
}) => {
  const addButton = () => {
    if (bottomNav.items.length >= 5) {
      onNotify("Maximum 5 bottom navigation buttons allowed.");
      return;
    }
    const next: BottomNavItem = {
      id: `nav_${Date.now()}`,
      label: `Tab ${bottomNav.items.length + 1}`,
      icon: "star",
      action: "open-page",
      target: "home",
    };
    onChange({ items: [...bottomNav.items, next] });
  };

  const updateItem = (id: string, patch: Partial<BottomNavItem>) => {
    onChange({
      items: bottomNav.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    });
  };

  const removeItem = (id: string) => {
    if (bottomNav.items.length <= 1) {
      onNotify("At least 1 navigation button is required while enabled.");
      return;
    }
    onChange({ items: bottomNav.items.filter((i) => i.id !== id) });
  };

  return (
    <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {lang === "si" ? "පහළ Navigation තීරුව (Bottom Bar)" : "Bottom Navigation Builder"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Add 1–5 buttons with custom icons, page navigation, external URLs, or JS actions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={bottomNav.enabled}
              onChange={(e) => onChange({ enabled: e.target.checked })}
              className="accent-sky-500"
            />
            Enable Nav Bar
          </label>
          <button
            type="button"
            disabled={bottomNav.items.length >= 5}
            onClick={addButton}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Button ({bottomNav.items.length}/5)</span>
          </button>
        </div>
      </div>

      {/* Bar Style */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <label className="space-y-1 block">
          <span className="font-medium text-slate-700 dark:text-slate-300">Background</span>
          <input
            type="color"
            value={bottomNav.backgroundColor}
            onChange={(e) => onChange({ backgroundColor: e.target.value })}
            className="w-full h-9 rounded border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
          />
        </label>
        <label className="space-y-1 block">
          <span className="font-medium text-slate-700 dark:text-slate-300">Text / Icon</span>
          <input
            type="color"
            value={bottomNav.textColor}
            onChange={(e) => onChange({ textColor: e.target.value })}
            className="w-full h-9 rounded border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
          />
        </label>
        <label className="space-y-1 block">
          <span className="font-medium text-slate-700 dark:text-slate-300">Active Color</span>
          <input
            type="color"
            value={bottomNav.activeColor}
            onChange={(e) => onChange({ activeColor: e.target.value })}
            className="w-full h-9 rounded border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
          />
        </label>
        <label className="space-y-1 block">
          <span className="font-medium text-slate-700 dark:text-slate-300">Position</span>
          <select
            value={bottomNav.position}
            onChange={(e) =>
              onChange({
                position: e.target.value as BottomNavSettings["position"],
              })
            }
            className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="bottom">Docked Bottom</option>
            <option value="floating">Floating Pill Dock</option>
          </select>
        </label>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {bottomNav.items.map((item, idx) => (
          <div
            key={item.id}
            className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
          >
            <label className="sm:col-span-3 space-y-1 block text-xs">
              <span className="text-slate-500">Label #{idx + 1}</span>
              <input
                type="text"
                value={item.label}
                onChange={(e) => updateItem(item.id, { label: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </label>

            <label className="sm:col-span-2 space-y-1 block text-xs">
              <span className="text-slate-500">Icon</span>
              <select
                value={item.icon}
                onChange={(e) => updateItem(item.id, { icon: e.target.value })}
                className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                {ICONS.map((ic) => (
                  <option key={ic} value={ic}>
                    {ic}
                  </option>
                ))}
              </select>
            </label>

            <label className="sm:col-span-3 space-y-1 block text-xs">
              <span className="text-slate-500">Action</span>
              <select
                value={item.action}
                onChange={(e) =>
                  updateItem(item.id, { action: e.target.value as BottomNavAction })
                }
                className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="open-page">Open Page</option>
                <option value="open-url">Open URL</option>
                <option value="go-back">Go Back</option>
                <option value="go-home">Go Home</option>
                <option value="js-action">JavaScript Action</option>
              </select>
            </label>

            <label className="sm:col-span-3 space-y-1 block text-xs">
              <span className="text-slate-500">Target / Script</span>
              <input
                type="text"
                value={item.target}
                onChange={(e) => updateItem(item.id, { target: e.target.value })}
                placeholder="tasks / https://..."
                className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
              />
            </label>

            <div className="sm:col-span-1 flex justify-end">
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label="Delete button"
                className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
