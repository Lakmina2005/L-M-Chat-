import React, { useRef, useState } from "react";
import {
  Upload,
  FilePlus,
  Trash2,
  Download,
  Eye,
  Pencil,
  Code2,
  Folder,
  X,
} from "lucide-react";
import type { EditorTab, ProjectFile, UILang } from "../types";
import { triggerBlobDownload } from "../utils/generators";

interface FilesSectionProps {
  files: ProjectFile[];
  onChangeFiles: (files: ProjectFile[]) => void;
  onOpenInEditor: (tab: EditorTab, content?: string) => void;
  lang: UILang;
  onNotify: (msg: string) => void;
}

const ALLOWED_EXTENSIONS =
  /\.(html|css|js|json|py|png|jpe?g|webp|svg|mp4|txt)$/i;

export const FilesSection: React.FC<FilesSectionProps> = ({
  files,
  onChangeFiles,
  onOpenInEditor,
  lang,
  onNotify,
}) => {
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const [newName, setNewName] = useState("");
  const [newFolder, setNewFolder] = useState<ProjectFile["folder"]>("www");
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const added: ProjectFile[] = [];
    for (const file of selected) {
      if (!ALLOWED_EXTENSIONS.test(file.name)) {
        onNotify(`Skipped unsupported file type: ${file.name}`);
        continue;
      }
      if (file.name.toLowerCase().endsWith(".mp4") && file.size > 100 * 1024 * 1024) {
        onNotify(`Skipped ${file.name}: exceeds 100 MB video limit.`);
        continue;
      }
      const isBinary = /\.(png|jpe?g|webp|mp4)$/i.test(file.name);
      const content = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        if (isBinary) reader.readAsDataURL(file);
        else reader.readAsText(file);
      });

      const folder: ProjectFile["folder"] = file.name.endsWith(".py")
        ? "backend"
        : isBinary || file.name.endsWith(".svg")
        ? "www/assets"
        : "www";

      added.push({
        id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        path: `${folder}/${file.name}`,
        folder,
        mimeType: file.type || "text/plain",
        size: file.size,
        isBinary,
        content,
        updatedAt: Date.now(),
      });
    }

    if (added.length) {
      onChangeFiles([...added, ...files]);
      onNotify(`Added ${added.length} file(s)`);
    }
    e.target.value = "";
  };

  const createEmptyFile = () => {
    const name = newName.trim();
    if (!name || !ALLOWED_EXTENSIONS.test(name)) {
      onNotify("Enter a valid filename ending in .html, .css, .js, .json, .py, .svg, or .txt");
      return;
    }
    const created: ProjectFile = {
      id: `file_${Date.now()}`,
      name,
      path: `${newFolder}/${name}`,
      folder: newFolder,
      mimeType: "text/plain",
      size: 0,
      isBinary: false,
      content: name.endsWith(".json") ? "{\n  \n}" : "",
      updatedAt: Date.now(),
    };
    onChangeFiles([created, ...files]);
    setNewName("");
    onNotify(`Created ${created.path}`);
  };

  const handleDownload = (f: ProjectFile) => {
    if (f.isBinary && f.content.startsWith("data:")) {
      fetch(f.content)
        .then((r) => r.blob())
        .then((b) => triggerBlobDownload(b, f.name));
    } else {
      triggerBlobDownload(new Blob([f.content], { type: "text/plain" }), f.name);
    }
  };

  const openFileInEditor = (f: ProjectFile) => {
    if (f.isBinary) {
      setPreviewFile(f);
      return;
    }
    const ext = f.name.split(".").pop()?.toLowerCase();
    const tab: EditorTab =
      ext === "css"
        ? "css"
        : ext === "js"
        ? "js"
        : ext === "py"
        ? "python"
        : ext === "json"
        ? "json"
        : "html";
    onOpenInEditor(tab, f.content);
  };

  const commitRename = (id: string) => {
    const clean = renameValue.trim();
    if (!clean) {
      setRenamingId(null);
      return;
    }
    onChangeFiles(
      files.map((f) =>
        f.id === id ? { ...f, name: clean, path: `${f.folder}/${clean}` } : f
      )
    );
    setRenamingId(null);
  };

  return (
    <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {lang === "si" ? "ව්‍යාපෘති ගොනු කළමනාකරු (Files)" : "Project File Manager"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Upload or manage .html, .css, .js, .json, .py, .png, .jpg, .webp, .svg, .mp4, .txt inside simulated folders.
          </p>
        </div>
        <div>
          <input
            ref={uploadRef}
            type="file"
            multiple
            accept=".html,.css,.js,.json,.py,.png,.jpg,.jpeg,.webp,.svg,.mp4,.txt"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => uploadRef.current?.click()}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Files</span>
          </button>
        </div>
      </div>

      {/* Create New File */}
      <div className="flex flex-wrap gap-2">
        <select
          value={newFolder}
          onChange={(e) => setNewFolder(e.target.value as ProjectFile["folder"])}
          className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
        >
          <option value="www">www/</option>
          <option value="www/assets">www/assets/</option>
          <option value="backend">backend/</option>
        </select>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="custom.js or helper.py"
          className="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
        />
        <button
          type="button"
          onClick={createEmptyFile}
          className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-1.5"
        >
          <FilePlus className="w-3.5 h-3.5" />
          <span>New File</span>
        </button>
      </div>

      {/* Simulated Folder Structure & File Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1"><Folder className="w-3.5 h-3.5" /> www/index.html</span>
          <span className="inline-flex items-center gap-1"><Folder className="w-3.5 h-3.5" /> www/style.css</span>
          <span className="inline-flex items-center gap-1"><Folder className="w-3.5 h-3.5" /> www/script.js</span>
        </div>

        {files.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            No extra project files uploaded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {files.map((f) => (
              <div
                key={f.id}
                className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <div className="min-w-0">
                  {renamingId === f.id ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => commitRename(f.id)}
                      onKeyDown={(e) => e.key === "Enter" && commitRename(f.id)}
                      autoFocus
                      className="px-2 py-1 rounded border border-sky-500 bg-white dark:bg-slate-900 font-mono text-xs"
                    />
                  ) : (
                    <div className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                      {f.path}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    {(f.size / 1024).toFixed(1)} KB
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewFile(f)}
                    title="Preview"
                    className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {!f.isBinary && (
                    <button
                      type="button"
                      onClick={() => openFileInEditor(f)}
                      title="Open in Editor"
                      className="p-1.5 rounded text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingId(f.id);
                      setRenameValue(f.name);
                    }}
                    title="Rename"
                    className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(f)}
                    title="Download"
                    className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeFiles(files.filter((x) => x.id !== f.id))}
                    title="Delete"
                    className="p-1.5 rounded text-rose-500 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold">{previewFile.path}</span>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {previewFile.name.toLowerCase().endsWith(".mp4") ? (
              <video src={previewFile.content} controls className="w-full rounded-lg max-h-80" />
            ) : previewFile.isBinary || previewFile.name.toLowerCase().endsWith(".svg") ? (
              <img
                src={
                  previewFile.content.startsWith("data:")
                    ? previewFile.content
                    : `data:image/svg+xml;utf8,${encodeURIComponent(previewFile.content)}`
                }
                alt={previewFile.name}
                className="max-h-80 mx-auto rounded-lg"
              />
            ) : (
              <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 font-mono text-xs max-h-80 overflow-auto">
                {previewFile.content}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
