import React, { useEffect, useRef, useState } from "react";
import {
  Search,
  Replace,
  Wand2,
  Trash2,
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste,
  Download,
  Play,
} from "lucide-react";
import type { EditorTab } from "../types";

interface CodeEditorProps {
  activeTab: EditorTab;
  onChangeTab: (tab: EditorTab) => void;
  values: Record<EditorTab, string>;
  onChangeCode: (tab: EditorTab, value: string) => void;
  highlightLine: number | null;
  onRun: () => void;
  onNotify: (msg: string) => void;
}

const TAB_FILES: Record<EditorTab, { label: string; filename: string }> = {
  html: { label: "HTML", filename: "index.html" },
  css: { label: "CSS", filename: "style.css" },
  js: { label: "JavaScript", filename: "script.js" },
  python: { label: "Python", filename: "app.py" },
  json: { label: "JSON", filename: "capacitor.config.json" },
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightCode(code: string, tab: EditorTab): string {
  const escaped = escapeHtml(code);
  if (tab === "html") {
    return escaped
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="text-slate-500">$1</span>')
      .replace(
        /(&lt;\/?)([a-zA-Z0-9-]+)([\s\S]*?)(\/?&gt;)/g,
        '<span class="text-sky-500">$1</span><span class="text-cyan-400 font-medium">$2</span><span class="text-amber-300">$3</span><span class="text-sky-500">$4</span>'
      );
  }
  if (tab === "css") {
    return escaped
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-slate-500">$1</span>')
      .replace(/([a-z-]+)(\s*:)/g, '<span class="text-sky-400">$1</span>$2')
      .replace(/(#[0-9a-fA-F]{3,8}|\b\d+(?:px|rem|em|%|vh|vw|s|ms)?\b)/g, '<span class="text-amber-400">$1</span>');
  }
  if (tab === "json") {
    return escaped
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?/g, (_m, str, _u, colon) =>
        colon
          ? `<span class="text-sky-400">${str}</span>:`
          : `<span class="text-emerald-400">${str}</span>`
      )
      .replace(/\b(true|false|null)\b/g, '<span class="text-amber-400">$1</span>');
  }
  // JS / Python
  return escaped
    .replace(/(#.*$|\/\/.*$)/gm, '<span class="text-slate-500">$1</span>')
    .replace(
      /\b(const|let|var|function|return|if|else|for|while|async|await|import|from|export|def|class|try|catch|except|print|console)\b/g,
      '<span class="text-violet-400 font-medium">$1</span>'
    )
    .replace(/(&quot;[^&]*?&quot;|'[^']*?')/g, '<span class="text-emerald-400">$1</span>');
}

function formatCodeText(code: string, tab: EditorTab): string {
  if (tab === "json") {
    try {
      return JSON.stringify(JSON.parse(code), null, 2);
    } catch {
      return code;
    }
  }
  if (tab === "css") {
    return code
      .replace(/\s*\{\s*/g, " {\n  ")
      .replace(/;\s*/g, ";\n  ")
      .replace(/\s*\}\s*/g, "\n}\n\n")
      .replace(/\n  \n\}/g, "\n}")
      .trim();
  }
  if (tab === "html") {
    const lines = code
      .replace(/>\s*</g, ">\n<")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    let indent = 0;
    return lines
      .map((line) => {
        if (/^<\//.test(line)) indent = Math.max(0, indent - 1);
        const pad = "  ".repeat(indent);
        if (
          /^<[a-zA-Z]/.test(line) &&
          !/^<(br|hr|img|input|meta|link|source)\b/i.test(line) &&
          !/\/>$/.test(line) &&
          !/<\/[a-zA-Z0-9-]+>$/.test(line)
        ) {
          indent++;
        }
        return pad + line;
      })
      .join("\n");
  }
  // JS / Python line trim
  return code
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n");
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  activeTab,
  onChangeTab,
  values,
  onChangeCode,
  highlightLine,
  onRun,
  onNotify,
}) => {
  const code = values[activeTab] ?? "";
  const [showFind, setShowFind] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [undoStack, setUndoStack] = useState<Record<EditorTab, string[]>>({
    html: [],
    css: [],
    js: [],
    python: [],
    json: [],
  });
  const [redoStack, setRedoStack] = useState<Record<EditorTab, string[]>>({
    html: [],
    css: [],
    js: [],
    python: [],
    json: [],
  });

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (highlightLine && textareaRef.current) {
      const top = Math.max(0, (highlightLine - 3) * 20);
      textareaRef.current.scrollTop = top;
      if (preRef.current) preRef.current.scrollTop = top;
      if (gutterRef.current) gutterRef.current.scrollTop = top;
    }
  }, [highlightLine, activeTab]);

  const updateWithHistory = (nextVal: string) => {
    setUndoStack((prev) => ({
      ...prev,
      [activeTab]: [...prev[activeTab].slice(-30), code],
    }));
    setRedoStack((prev) => ({ ...prev, [activeTab]: [] }));
    onChangeCode(activeTab, nextVal);
  };

  const handleUndo = () => {
    const stack = undoStack[activeTab];
    if (stack.length === 0) return;
    const prevVal = stack[stack.length - 1];
    setUndoStack((u) => ({ ...u, [activeTab]: stack.slice(0, -1) }));
    setRedoStack((r) => ({ ...r, [activeTab]: [...r[activeTab], code] }));
    onChangeCode(activeTab, prevVal);
  };

  const handleRedo = () => {
    const stack = redoStack[activeTab];
    if (stack.length === 0) return;
    const nextVal = stack[stack.length - 1];
    setRedoStack((r) => ({ ...r, [activeTab]: stack.slice(0, -1) }));
    setUndoStack((u) => ({ ...u, [activeTab]: [...u[activeTab], code] }));
    onChangeCode(activeTab, nextVal);
  };

  const syncScroll = () => {
    if (!textareaRef.current) return;
    const { scrollTop, scrollLeft } = textareaRef.current;
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
  };

  const handleDownloadCurrent = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = TAB_FILES[activeTab].filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onNotify(`Downloaded ${TAB_FILES[activeTab].filename}`);
  };

  const lines = code.split("\n");

  return (
    <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
      {/* Editor Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(Object.keys(TAB_FILES) as EditorTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onChangeTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "bg-sky-600 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800"
              }`}
            >
              {TAB_FILES[tab].label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={handleUndo}
            title="Undo"
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            title="Redo"
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowFind((s) => !s)}
            title="Search & Replace"
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              updateWithHistory(formatCodeText(code, activeTab));
              onNotify("Formatted code");
            }}
            title="Format Code"
            className="px-2 py-1 rounded-md text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 inline-flex items-center gap-1"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Format</span>
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(code);
                onNotify("Copied code to clipboard");
              } catch {
                onNotify("Clipboard permission unavailable");
              }
            }}
            title="Copy"
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                const txt = await navigator.clipboard.readText();
                if (txt) {
                  updateWithHistory(txt);
                  onNotify("Pasted from clipboard");
                }
              } catch {
                onNotify("Use Ctrl+V inside the editor to paste");
              }
            }}
            title="Paste"
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDownloadCurrent}
            title="Download file"
            className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => updateWithHistory("")}
            title="Clear"
            className="p-1.5 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRun}
            className="ml-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1"
          >
            <Play className="w-3 h-3" />
            <span>Run</span>
          </button>
        </div>
      </div>

      {/* Search & Replace Bar */}
      {showFind && (
        <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder="Find..."
            className="px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
          />
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Replace with..."
            className="px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
          />
          <button
            type="button"
            onClick={() => {
              if (!findText) return;
              const next = code.split(findText).join(replaceText);
              updateWithHistory(next);
              onNotify(`Replaced occurrences of "${findText}"`);
            }}
            className="px-2.5 py-1 rounded-md bg-sky-600 text-white text-xs font-medium inline-flex items-center gap-1"
          >
            <Replace className="w-3 h-3" />
            <span>Replace All</span>
          </button>
        </div>
      )}

      {/* Code Canvas */}
      <div className="relative flex h-[460px] bg-slate-950 text-slate-100 font-mono text-[13px] leading-[20px]">
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          className="w-12 py-3 px-2 text-right select-none overflow-hidden bg-slate-900/90 border-r border-slate-800 text-slate-500 text-xs leading-[20px] tabular-nums shrink-0"
        >
          {lines.map((_, idx) => {
            const lineNum = idx + 1;
            const isHighlighted = highlightLine === lineNum;
            return (
              <div
                key={lineNum}
                className={
                  isHighlighted
                    ? "bg-rose-500/25 text-rose-300 font-semibold -mx-2 px-2"
                    : ""
                }
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Highlighted Overlay + Editable Textarea */}
        <div className="relative flex-1 overflow-hidden">
          <pre
            ref={preRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 m-0 p-3 overflow-hidden whitespace-pre font-mono text-[13px] leading-[20px] text-slate-100"
            dangerouslySetInnerHTML={{ __html: highlightCode(code, activeTab) + "\n" }}
          />
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => updateWithHistory(e.target.value)}
            onScroll={syncScroll}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                const el = e.currentTarget;
                const start = el.selectionStart;
                const end = el.selectionEnd;
                const next = code.slice(0, start) + "  " + code.slice(end);
                updateWithHistory(next);
                requestAnimationFrame(() => {
                  el.selectionStart = el.selectionEnd = start + 2;
                });
              }
            }}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="relative z-10 w-full h-full p-3 m-0 bg-transparent text-transparent caret-sky-400 resize-none outline-none overflow-auto whitespace-pre font-mono text-[13px] leading-[20px]"
          />
        </div>
      </div>

      <div className="px-3 py-1.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
        <span>{TAB_FILES[activeTab].filename}</span>
        <span>
          {lines.length} lines · {code.length} chars
        </span>
      </div>
    </div>
  );
};
