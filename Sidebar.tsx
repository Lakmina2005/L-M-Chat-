import React from "react";
import {
  Home,
  Settings,
  Palette,
  Sparkles,
  Wifi,
  PanelBottom,
  FolderOpen,
  FileCode2,
  FileType,
  Braces,
  Terminal,
  Link2,
  Smartphone,
  ScrollText,
  Wrench,
  Download,
  PackageCheck,
  Save,
  X,
} from "lucide-react";
import type { SectionId, UILang } from "../types";
import { NAV_LABELS } from "../i18n";

interface SidebarProps {
  activeSection: SectionId;
  onSelectSection: (section: SectionId) => void;
  lang: UILang;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  errorCount: number;
}

const GROUPS: Array<{
  titleEn: string;
  titleSi: string;
  items: Array<{ id: SectionId; icon: React.ComponentType<{ className?: string }> }>;
}> = [
  {
    titleEn: "Overview",
    titleSi: "සාරාංශය",
    items: [
      { id: "home", icon: Home },
      { id: "projects", icon: Save },
    ],
  },
  {
    titleEn: "App Configuration",
    titleSi: "ඇප් සැකසුම්",
    items: [
      { id: "app-settings", icon: Settings },
      { id: "app-design", icon: Palette },
      { id: "splash-screen", icon: Sparkles },
      { id: "status-bar", icon: Wifi },
      { id: "bottom-nav", icon: PanelBottom },
    ],
  },
  {
    titleEn: "Code & Assets",
    titleSi: "කේත සහ ගොනු",
    items: [
      { id: "files", icon: FolderOpen },
      { id: "html-editor", icon: FileCode2 },
      { id: "css-editor", icon: FileType },
      { id: "js-editor", icon: Braces },
      { id: "python-backend", icon: Terminal },
      { id: "external-links", icon: Link2 },
    ],
  },
  {
    titleEn: "Inspect & Build",
    titleSi: "පරීක්ෂාව සහ Build",
    items: [
      { id: "preview", icon: Smartphone },
      { id: "console", icon: ScrollText },
      { id: "error-fixer", icon: Wrench },
      { id: "export", icon: Download },
      { id: "apk-build", icon: PackageCheck },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  lang,
  mobileOpen,
  onCloseMobile,
  errorCount,
}) => {
  const navContent = (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 lg:hidden">
        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
          Navigation
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {GROUPS.map((group) => (
          <div key={group.titleEn}>
            <div className="px-2.5 mb-1.5 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
              {lang === "si" ? group.titleSi : group.titleEn}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ id, icon: Icon }) => {
                const isActive = activeSection === id;
                const label = NAV_LABELS[id][lang];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      onSelectSection(id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? "bg-sky-500/12 text-sky-600 dark:text-sky-400"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{label}</span>
                    </span>
                    {id === "error-fixer" && errorCount > 0 && (
                      <span className="text-xs font-mono tabular-nums text-rose-600 dark:text-rose-400">
                        {errorCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-60 shrink-0 h-[calc(100vh-57px)] sticky top-[57px]">
        {navContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 w-68 max-w-[82vw] h-full shadow-xl">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};
