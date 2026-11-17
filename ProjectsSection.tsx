import React, { useRef, useState } from "react";
import {
  Plus,
  Save,
  CopyPlus,
  Trash2,
  Download,
  Upload,
  FolderOpen,
} from "lucide-react";
import type { AppProject, UILang } from "../types";
import { triggerBlobDownload } from "../utils/generators";
import { sanitizeFilename } from "../utils/validators";

interface ProjectsSectionProps {
  currentProject: AppProject;
  projects: AppProject[];
  lang: UILang;
  onNewProject: () => void;
  onSaveNow: () => void;
  onSaveAs: (newName: string) => void;
  onLoadProject: (project: AppProject) => void;
  onDuplicateProject: (project: AppProject) => void;
  onDeleteProject: (id: string) => void;
  onImportProjectJson: (project: AppProject) => void;
  onNotify: (msg: string) => void;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  currentProject,
  projects,
  lang,
  onNewProject,
  onSaveNow,
  onSaveAs,
  onLoadProject,
  onDuplicateProject,
  onDeleteProject,
  onImportProjectJson,
  onNotify,
}) => {
  const importRef = useRef<HTMLInputElement | null>(null);
  const [saveAsName, setSaveAsName] = useState("");

  const handleExportProjectJson = () => {
    const json = JSON.stringify(currentProject, null, 2);
    const filename = `${sanitizeFilename(currentProject.projectName)}.appforge.json`;
    triggerBlobDownload(new Blob([json], { type: "application/json" }), filename);
    onNotify(`Exported ${filename}`);
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as AppProject;
      if (!parsed.appSettings || !parsed.code) {
        throw new Error("Invalid project schema");
      }
      onImportProjectJson({
        ...parsed,
        id: `proj_${Date.now()}`,
        updatedAt: Date.now(),
      });
      onNotify(`Imported project "${parsed.projectName}"`);
    } catch {
      onNotify("Invalid .appforge.json project file.");
    }
    e.target.value = "";
  };

  return (
    <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {lang === "si" ? "ව්‍යාපෘති Save සහ Load කිරීම" : "Project Save / Load Manager"}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Projects auto-save locally to IndexedDB so your icon, splash video, code, and settings persist across browser refreshes.
        </p>
      </div>

      {/* Primary Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onNewProject}
          className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>

        <button
          type="button"
          onClick={onSaveNow}
          className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>

        <button
          type="button"
          onClick={handleExportProjectJson}
          className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Project</span>
        </button>

        <input
          ref={importRef}
          type="file"
          accept=".json"
          onChange={handleImportJson}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => importRef.current?.click()}
          className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-1.5"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import Project</span>
        </button>
      </div>

      {/* Save As */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={saveAsName}
          onChange={(e) => setSaveAsName(e.target.value)}
          placeholder="Save copy as project name..."
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
        />
        <button
          type="button"
          onClick={() => {
            if (!saveAsName.trim()) return;
            onSaveAs(saveAsName.trim());
            setSaveAsName("");
          }}
          className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium"
        >
          Save As
        </button>
      </div>

      {/* Saved Projects List */}
      <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
        {projects.map((p) => {
          const isCurrent = p.id === currentProject.id;
          return (
            <div
              key={p.id}
              className={`px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${
                isCurrent ? "bg-sky-500/5" : ""
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={p.iconDataUrl}
                  alt={p.appSettings.appName}
                  className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {p.projectName}
                    {isCurrent && (
                      <span className="ml-2 text-sky-600 dark:text-sky-400 font-normal">
                        · Active
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">
                    {p.appSettings.packageName} · Updated{" "}
                    {new Date(p.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {!isCurrent && (
                  <button
                    type="button"
                    onClick={() => onLoadProject(p)}
                    className="px-2.5 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-medium inline-flex items-center gap-1"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Load</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDuplicateProject(p)}
                  title="Duplicate"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <CopyPlus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={projects.length <= 1}
                  onClick={() => onDeleteProject(p.id)}
                  title="Delete"
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
