import React, { useRef } from "react";
import JSZip from "jszip";
import {
  Play,
  ShieldCheck,
  Wrench,
  Download,
  PackageCheck,
  Plus,
  Upload,
  FileArchive,
  Sparkles,
} from "lucide-react";
import type { AppProject, ProjectFile, SectionId, UILang } from "../types";
import { UI_COPY } from "../i18n";

interface HomeSectionProps {
  project: AppProject;
  lang: UILang;
  errorCount: number;
  onNavigate: (section: SectionId) => void;
  onCreateNewProject: () => void;
  onImportProjectPatch: (patch: Partial<AppProject>) => void;
  onRunPreview: () => void;
  onCheckCode: () => void;
  onQuickDownloadZip: () => void;
  onNotify: (msg: string) => void;
}

export const HomeSection: React.FC<HomeSectionProps> = ({
  project,
  lang,
  errorCount,
  onNavigate,
  onCreateNewProject,
  onImportProjectPatch,
  onRunPreview,
  onCheckCode,
  onQuickDownloadZip,
  onNotify,
}) => {
  const htmlInputRef = useRef<HTMLInputElement | null>(null);
  const zipInputRef = useRef<HTMLInputElement | null>(null);
  const copy = UI_COPY[lang];

  const handleSingleHtmlImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
    const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const styleMatches = [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(
      (m) => m[1]
    );
    const scriptMatches = [...text.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)]
      .filter((m) => !m[0].includes("src="))
      .map((m) => m[1]);

    onImportProjectPatch({
      appSettings: {
        ...project.appSettings,
        appName: titleMatch?.[1]?.trim() || project.appSettings.appName,
      },
      code: {
        ...project.code,
        html: bodyMatch ? bodyMatch[1].trim() : text,
        css: styleMatches.length ? styleMatches.join("\n\n") : project.code.css,
        js: scriptMatches.length ? scriptMatches.join("\n\n") : project.code.js,
      },
    });
    onNotify(`Imported ${file.name}`);
    e.target.value = "";
  };

  const handleZipImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const zip = await JSZip.loadAsync(file);
      let nextHtml = project.code.html;
      let nextCss = project.code.css;
      let nextJs = project.code.js;
      let nextPy = project.code.python;
      const importedFiles: ProjectFile[] = [];

      const entries = Object.values(zip.files).filter((entry) => !entry.dir);
      for (const entry of entries) {
        const cleanPath = entry.name.replace(/^\/+/, "");
        const baseName = cleanPath.split("/").pop() || cleanPath;
        const lower = baseName.toLowerCase();

        if (cleanPath === "index.html" || cleanPath === "www/index.html") {
          const rawHtml = await entry.async("string");
          const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          nextHtml = bodyMatch ? bodyMatch[1].trim() : rawHtml;
          continue;
        }
        if (lower === "style.css" || lower === "styles.css") {
          nextCss = await entry.async("string");
          continue;
        }
        if (lower === "script.js" || lower === "app.js" || lower === "main.js") {
          nextJs = await entry.async("string");
          continue;
        }
        if (lower.endsWith(".py")) {
          nextPy = await entry.async("string");
        }

        const isBinary = /\.(png|jpe?g|webp|gif|mp4|ico)$/i.test(lower);
        let content = "";
        let size = 0;
        if (isBinary) {
          const base64 = await entry.async("base64");
          const ext = lower.split(".").pop() || "png";
          const mime =
            ext === "mp4"
              ? "video/mp4"
              : ext === "jpg" || ext === "jpeg"
              ? "image/jpeg"
              : `image/${ext}`;
          content = `data:${mime};base64,${base64}`;
          size = Math.round((base64.length * 3) / 4);
        } else {
          content = await entry.async("string");
          size = content.length;
        }

        const folder: ProjectFile["folder"] = lower.endsWith(".py")
          ? "backend"
          : cleanPath.includes("assets/") || isBinary
          ? "www/assets"
          : "www";

        importedFiles.push({
          id: `imp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: baseName,
          path: cleanPath.startsWith("www/") || cleanPath.startsWith("backend/")
            ? cleanPath
            : `${folder}/${baseName}`,
          folder,
          mimeType: isBinary ? "application/octet-stream" : "text/plain",
          size,
          isBinary,
          content,
          updatedAt: Date.now(),
        });
      }

      onImportProjectPatch({
        code: {
          ...project.code,
          html: nextHtml,
          css: nextCss,
          js: nextJs,
          python: nextPy,
        },
        files: importedFiles.length ? importedFiles : project.files,
      });
      onNotify(`Imported ZIP project (${entries.length} files detected)`);
    } catch {
      onNotify("Failed to parse ZIP archive. Ensure it is a valid .zip file.");
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Hero Summary */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={project.iconDataUrl}
              alt={project.appSettings.appName}
              className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {project.appSettings.appName}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {project.appSettings.packageName} · v{project.appSettings.versionName} (
                {project.appSettings.versionCode})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCreateNewProject}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{copy.createApp}</span>
          </button>
        </div>

        {/* Core Workflow Action Strip */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => {
              onRunPreview();
              onNavigate("preview");
            }}
            className="px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{copy.previewBtn}</span>
          </button>

          <button
            type="button"
            onClick={onCheckCode}
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
            <span>{copy.checkCode}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("error-fixer")}
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {copy.fixErrors} ({errorCount})
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("export")}
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{copy.exportProject}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("apk-build")}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>{copy.generateAndroid}</span>
          </button>

          <button
            type="button"
            onClick={onQuickDownloadZip}
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
          >
            <FileArchive className="w-3.5 h-3.5" />
            <span>{copy.downloadZip}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">Project Files</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {project.files.length + 4}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">Bottom Nav Buttons</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {project.bottomNav.items.length} / 5
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">External Links</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {project.externalLinks.length}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-xs text-slate-500 dark:text-slate-400">Detected Issues</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {errorCount}
          </div>
        </div>
      </div>

      {/* Import Existing HTML / ZIP Project */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {lang === "si"
              ? "පවතින HTML / ZIP ව්‍යාපෘතියක් Import කරන්න"
              : "Import Existing HTML / CSS / JS Project"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Import a single HTML file or a full ZIP archive (detects index.html, style.css, script.js, and assets/ while preserving relative paths).
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            ref={htmlInputRef}
            type="file"
            accept=".html,.htm"
            onChange={handleSingleHtmlImport}
            className="hidden"
          />
          <input
            ref={zipInputRef}
            type="file"
            accept=".zip"
            onChange={handleZipImport}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => htmlInputRef.current?.click()}
            className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4 text-sky-500" />
            <span>Import Single HTML File</span>
          </button>

          <button
            type="button"
            onClick={() => zipInputRef.current?.click()}
            className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 inline-flex items-center gap-2"
          >
            <FileArchive className="w-4 h-4 text-emerald-500" />
            <span>Import ZIP Project</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("app-design")}
            className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Customize App Name & Icon</span>
          </button>
        </div>
      </div>
    </div>
  );
};
