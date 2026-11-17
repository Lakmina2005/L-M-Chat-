import React from "react";
import {
  Menu,
  Play,
  ShieldCheck,
  Sun,
  Moon,
  Languages,
  Check,
  Loader2,
  PackageCheck,
} from "lucide-react";
import type { SectionId, ThemeMode, UILang } from "../types";
import { UI_COPY } from "../i18n";

interface TopBarProps {
  projectName: string;
  saveStatus: "saved" | "saving";
  lastSavedAt: number;
  lang: UILang;
  onToggleLang: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenMobileMenu: () => void;
  onRunPreview: () => void;
  onCheckCode: () => void;
  onNavigate: (section: SectionId) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  projectName,
  saveStatus,
  lastSavedAt,
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  onOpenMobileMenu,
  onRunPreview,
  onCheckCode,
  onNavigate,
}) => {
  const copy = UI_COPY[lang];
  const savedTime = new Date(lastSavedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header className="sticky top-0 z-40 h-[57px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open menu"
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          APP FORGE
        </button>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
          <span aria-hidden="true">/</span>
          <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[180px]">
            {projectName}
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1 tabular-nums whitespace-nowrap">
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                {copy.saving}
              </>
            ) : (
              <>
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                {copy.saved} {savedTime}
              </>
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleLang}
          title="Switch English / Sinhala"
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{lang === "en" ? "සිංහල" : "EN"}</span>
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        <button
          type="button"
          onClick={onCheckCode}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{copy.checkCode}</span>
        </button>

        <button
          type="button"
          onClick={onRunPreview}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <Play className="w-3.5 h-3.5" />
          <span>{copy.runCode}</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate("apk-build")}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 text-xs font-semibold transition-opacity whitespace-nowrap shrink-0"
        >
          <PackageCheck className="w-3.5 h-3.5" />
          <span>APK Build</span>
        </button>
      </div>
    </header>
  );
};
