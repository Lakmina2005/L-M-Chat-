import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Trash2,
  ShieldCheck,
  Sparkles,
  Check,
  Loader2,
} from "lucide-react";
import type {
  AiFixResult,
  AppProject,
  CodeIssue,
  ConsoleEntry,
  EditorTab,
  UILang,
} from "../types";
import { localFallbackFixCode } from "../utils/validators";

interface ConsoleSectionProps {
  entries: ConsoleEntry[];
  onClear: () => void;
  lang: UILang;
}

export const ConsoleSection: React.FC<ConsoleSectionProps> = ({
  entries,
  onClear,
  lang,
}) => {
  const [filter, setFilter] = useState<"all" | ConsoleEntry["level"]>("all");

  const visible =
    filter === "all" ? entries : entries.filter((e) => e.level === filter);

  return (
    <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {lang === "si" ? "සජීවී Console ලොග් (Console)" : "Live Preview Console"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Captures console logs and runtime JavaScript errors from the sandboxed preview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
            {(["all", "log", "warn", "error"] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setFilter(lvl)}
                className={`px-2.5 py-1 rounded-md capitalize ${
                  filter === lvl
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                    : "text-slate-500"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClear}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div className="h-[420px] overflow-y-auto rounded-lg bg-slate-950 border border-slate-800 p-3 font-mono text-xs space-y-1.5">
        {visible.length === 0 ? (
          <div className="text-slate-500 py-8 text-center">
            No console messages captured yet. Click Run to execute your app.
          </div>
        ) : (
          visible.map((entry) => (
            <div
              key={entry.id}
              className={`px-2.5 py-1.5 rounded flex items-start gap-2.5 ${
                entry.level === "error"
                  ? "bg-rose-500/15 text-rose-300"
                  : entry.level === "warn"
                  ? "bg-amber-500/15 text-amber-300"
                  : "text-slate-200"
              }`}
            >
              <span className="text-slate-500 tabular-nums shrink-0">
                {entry.timestamp}
              </span>
              <span className="uppercase text-[10px] font-semibold shrink-0 mt-0.5">
                [{entry.level}]
              </span>
              <span className="break-all">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

interface ErrorFixerSectionProps {
  project: AppProject;
  issues: CodeIssue[];
  onCheckCode: () => void;
  onJumpToLine: (tab: EditorTab, line: number) => void;
  onApplyFix: (tab: EditorTab, fixedCode: string) => void;
  lang: UILang;
  onNotify: (msg: string) => void;
}

export const ErrorFixerSection: React.FC<ErrorFixerSectionProps> = ({
  project,
  issues,
  onCheckCode,
  onJumpToLine,
  onApplyFix,
  lang,
  onNotify,
}) => {
  const [selectedIssue, setSelectedIssue] = useState<CodeIssue | null>(null);
  const [aiResult, setAiResult] = useState<AiFixResult | null>(null);
  const [fixing, setFixing] = useState(false);

  const handleFixWithAi = async (issue: CodeIssue) => {
    setSelectedIssue(issue);
    setAiResult(null);
    setFixing(true);
    const code = project.code[issue.file];

    try {
      const res = await fetch("/api/gemini/fix-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: issue.fileName,
          language: issue.file,
          code,
          issueMessage: issue.message,
          line: issue.line,
        }),
      });
      if (!res.ok) {
        throw new Error("Server AI fixer unavailable");
      }
      const data = (await res.json()) as AiFixResult;
      if (!data.fixedCode) throw new Error("Empty fix response");
      setAiResult(data);
    } catch {
      const fallback = localFallbackFixCode(code, issue.file, issue.message);
      setAiResult(fallback);
      onNotify("AI endpoint offline — generated local deterministic fix");
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {lang === "si" ? "දෝෂ පරීක්ෂාව සහ AI නිවැරදි කිරීම" : "Code Error Detector & AI Fixer"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Scans HTML, CSS, JavaScript, JSON, Python, broken links, and missing files. Click any issue to open the line in Code Editor.
            </p>
          </div>
          <button
            type="button"
            onClick={onCheckCode}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Check Code</span>
          </button>
        </div>

        {issues.length === 0 ? (
          <div className="p-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>No syntax errors, broken file references, or invalid JSON detected.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <button
                  type="button"
                  onClick={() => onJumpToLine(issue.file, issue.line)}
                  className="text-left flex items-start gap-2.5 min-w-0 flex-1"
                >
                  {issue.severity === "ERROR" ? (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  ) : issue.severity === "WARNING" ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      <span>{issue.severity}</span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span className="font-mono text-sky-600 dark:text-sky-400">
                        {issue.fileName}:{issue.line}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      {issue.message}
                    </p>
                    {issue.snippet && (
                      <code className="block mt-1 text-[11px] text-slate-500 font-mono truncate">
                        {issue.snippet}
                      </code>
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleFixWithAi(issue)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 self-start sm:self-center"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Fix Error with AI</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Fix Result Panel */}
      {(fixing || aiResult) && selectedIssue && (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Suggested Fix for {selectedIssue.fileName}:{selectedIssue.line}
            </h3>
            {aiResult?.usedFallback && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Local offline fixer fallback
              </span>
            )}
          </div>

          {fixing ? (
            <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing error and generating repair...</span>
            </div>
          ) : (
            aiResult && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Error Explanation
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {aiResult.explanation}
                  </p>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    What Changed
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {aiResult.whatChanged}
                  </p>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Fixed Code Preview
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 font-mono text-xs max-h-60 overflow-auto">
                    {aiResult.fixedCode}
                  </pre>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAiResult(null)}
                    className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onApplyFix(selectedIssue.file, aiResult.fixedCode);
                      setAiResult(null);
                      onNotify(`Applied fix to ${selectedIssue.fileName}`);
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Fix</span>
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
