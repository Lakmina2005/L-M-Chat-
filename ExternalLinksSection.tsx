import React, { useState } from "react";
import { AlertTriangle, ExternalLink, Plus, Trash2 } from "lucide-react";
import type { ExternalLinkItem, LinkOpenMode, UILang } from "../types";
import { validateExternalUrl } from "../utils/validators";

interface ExternalLinksSectionProps {
  links: ExternalLinkItem[];
  onChangeLinks: (links: ExternalLinkItem[]) => void;
  lang: UILang;
  onNotify: (msg: string) => void;
}

export const ExternalLinksSection: React.FC<ExternalLinksSectionProps> = ({
  links,
  onChangeLinks,
  lang,
  onNotify,
}) => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("https://");
  const [mode, setMode] = useState<LinkOpenMode>("in-app");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const check = validateExternalUrl(url);

  const addLink = () => {
    const validation = validateExternalUrl(url);
    if (!validation.valid) {
      setErrorMsg(validation.error || "Invalid URL");
      return;
    }
    setErrorMsg(null);
    const next: ExternalLinkItem = {
      id: `lnk_${Date.now()}`,
      title: title.trim() || new URL(url.trim()).hostname,
      url: url.trim(),
      mode,
    };
    onChangeLinks([next, ...links]);
    setTitle("");
    setUrl("https://");
    onNotify("External link added");
  };

  return (
    <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {lang === "si" ? "බාහිර සබැඳි (External Links)" : "External Links & WebView Routing"}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure external URLs with HTTPS validation and choose in-app WebView or external browser behavior.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Link title (e.g. Docs)"
          className="sm:col-span-3 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
        />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="sm:col-span-5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
        />
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as LinkOpenMode)}
          className="sm:col-span-2 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
        >
          <option value="in-app">Open inside app</option>
          <option value="external-browser">External browser</option>
          <option value="new-tab">Open new tab</option>
          <option value="fullscreen-webview">Fullscreen WebView</option>
        </select>
        <button
          type="button"
          onClick={addLink}
          className="sm:col-span-2 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Link</span>
        </button>
      </div>

      {errorMsg && (
        <p className="text-xs text-rose-600 dark:text-rose-400">{errorMsg}</p>
      )}

      {check.valid && check.isHttpWarning && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Security warning: Plain HTTP URLs may be blocked by Android 9+ cleartext traffic policies. HTTPS is strongly recommended.
          </span>
        </div>
      )}

      <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
        {links.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            No external links added yet.
          </div>
        ) : (
          links.map((item) => {
            const isHttp = item.url.startsWith("http://");
            return (
              <div
                key={item.id}
                className="px-4 py-3 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{item.title}</span>
                    {isHttp && (
                      <span className="text-[11px] font-normal text-amber-600 dark:text-amber-400">
                        · HTTP Warning (prefer HTTPS)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 truncate">
                    {item.url} · {item.mode}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const snippet = `<button type="button" onclick="openAppForgeLink('${item.url}', '${item.mode}', '${item.title.replace(/'/g, "")}')">${item.title}</button>`;
                      navigator.clipboard?.writeText(snippet);
                      onNotify("Copied HTML link button snippet");
                    }}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-[11px] font-medium hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Copy HTML Snippet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onChangeLinks(links.filter((l) => l.id !== item.id))
                    }
                    className="p-1.5 rounded text-rose-500 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
