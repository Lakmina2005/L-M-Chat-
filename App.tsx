import { useCallback, useEffect, useRef, useState } from "react";
import { Terminal, Info, Smartphone, SlidersHorizontal } from "lucide-react";
import type {
  AppProject,
  CodeIssue,
  ConsoleEntry,
  EditorTab,
  SectionId,
  ThemeMode,
  UILang,
} from "./types";
import { createDefaultProject } from "./utils/defaultProject";
import {
  deleteProjectFromStorage,
  getActiveProjectId,
  listProjects,
  saveProjectToStorage,
  setActiveProjectId,
} from "./utils/storage";
import { runStaticCodeCheck, sanitizeFilename } from "./utils/validators";
import { generateWebProjectZip, triggerBlobDownload } from "./utils/generators";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { VirtualPhonePreview } from "./components/VirtualPhonePreview";
import { HomeSection } from "./components/HomeSection";
import { AppSettingsSection } from "./components/AppSettingsSection";
import { AppDesignSection } from "./components/AppDesignSection";
import { SplashSection } from "./components/SplashSection";
import { StatusBarSection } from "./components/StatusBarSection";
import { BottomNavSection } from "./components/BottomNavSection";
import { FilesSection } from "./components/FilesSection";
import { CodeEditor } from "./components/CodeEditor";
import { ExternalLinksSection } from "./components/ExternalLinksSection";
import {
  ConsoleSection,
  ErrorFixerSection,
} from "./components/ConsoleAndErrorSection";
import {
  ApkBuildSection,
  ExportSection,
} from "./components/ExportAndApkSection";
import { ProjectsSection } from "./components/ProjectsSection";

export default function App() {
  const [projects, setProjects] = useState<AppProject[]>([]);
  const [project, setProject] = useState<AppProject>(() => createDefaultProject());
  const [hydrated, setHydrated] = useState(false);

  const [activeSection, setActiveSection] = useState<SectionId>("home");
  const [editorTab, setEditorTab] = useState<EditorTab>("html");
  const [highlightLine, setHighlightLine] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<"workspace" | "preview">("workspace");

  const [lang, setLang] = useState<UILang>("en");
  const [theme, setTheme] = useState<ThemeMode>("dark");

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [lastSavedAt, setLastSavedAt] = useState<number>(Date.now());
  const [runNonce, setRunNonce] = useState(1);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleEntry[]>([]);
  const [issues, setIssues] = useState<CodeIssue[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const saveTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const notify = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 3200);
  }, []);

  // Load persisted projects from IndexedDB on startup
  useEffect(() => {
    let mounted = true;
    (async () => {
      const savedList = await listProjects();
      if (!mounted) return;
      if (savedList.length > 0) {
        const activeId = getActiveProjectId();
        const found = savedList.find((p) => p.id === activeId) || savedList[0];
        setProjects(savedList);
        setProject(found);
        setIssues(runStaticCodeCheck(found));
      } else {
        const initial = createDefaultProject();
        await saveProjectToStorage(initial);
        if (!mounted) return;
        setProjects([initial]);
        setProject(initial);
        setIssues(runStaticCodeCheck(initial));
      }
      setHydrated(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Sync Tailwind dark class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Auto-save whenever project changes
  const updateProject = useCallback(
    (updater: (prev: AppProject) => AppProject) => {
      setProject((prev) => {
        const next = updater(prev);
        next.updatedAt = Date.now();
        setSaveStatus("saving");
        if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = window.setTimeout(async () => {
          await saveProjectToStorage(next);
          setProjects((list) => {
            const idx = list.findIndex((p) => p.id === next.id);
            if (idx >= 0) {
              const copy = [...list];
              copy[idx] = next;
              return copy;
            }
            return [next, ...list];
          });
          setSaveStatus("saved");
          setLastSavedAt(Date.now());
        }, 450);
        return next;
      });
    },
    []
  );

  const handleSelectSection = (sec: SectionId) => {
    setActiveSection(sec);
    setMobilePane("workspace");
    if (sec === "html-editor") setEditorTab("html");
    else if (sec === "css-editor") setEditorTab("css");
    else if (sec === "js-editor") setEditorTab("js");
    else if (sec === "python-backend") setEditorTab("python");
  };

  const handleRunPreview = () => {
    setRunNonce((n) => n + 1);
    notify("Preview updated");
    if (window.innerWidth < 1280) {
      setMobilePane("preview");
    }
  };

  const handleCheckCode = () => {
    const detected = runStaticCodeCheck(project);
    setIssues(detected);
    setActiveSection("error-fixer");
    setMobilePane("workspace");
    notify(
      detected.length === 0
        ? "Code check passed with 0 issues"
        : `Detected ${detected.length} issue(s)`
    );
  };

  const handleCreateNewProject = async () => {
    const fresh = createDefaultProject({
      projectName: `App Project ${projects.length + 1}`,
    });
    await saveProjectToStorage(fresh);
    setActiveProjectId(fresh.id);
    setProjects((prev) => [fresh, ...prev]);
    setProject(fresh);
    setIssues(runStaticCodeCheck(fresh));
    setRunNonce((n) => n + 1);
    notify("Created new app project");
  };

  const handleQuickDownloadZip = async () => {
    const blob = await generateWebProjectZip(project);
    const base = sanitizeFilename(project.appSettings.appName).toLowerCase();
    triggerBlobDownload(blob, `${base}-web-project.zip`);
    notify("Downloaded Web Project ZIP");
  };

  const onConsoleMessage = useCallback((entry: ConsoleEntry) => {
    setConsoleLogs((prev) => [entry, ...prev.slice(0, 199)]);
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-sm text-slate-500">
        Loading APP FORGE workspace...
      </div>
    );
  }

  const isCodeSection =
    activeSection === "html-editor" ||
    activeSection === "css-editor" ||
    activeSection === "js-editor" ||
    activeSection === "python-backend";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <TopBar
        projectName={project.projectName}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        lang={lang}
        onToggleLang={() => setLang((l) => (l === "en" ? "si" : "en"))}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onRunPreview={handleRunPreview}
        onCheckCode={handleCheckCode}
        onNavigate={handleSelectSection}
      />

      {/* Mobile Workspace / Preview Switcher */}
      <div className="xl:hidden px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMobilePane("workspace")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 ${
            mobilePane === "workspace"
              ? "bg-sky-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Builder / Editor</span>
        </button>
        <button
          type="button"
          onClick={() => setMobilePane("preview")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 ${
            mobilePane === "preview"
              ? "bg-sky-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Phone Preview</span>
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        <Sidebar
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          lang={lang}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          errorCount={issues.length}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_410px] gap-6 items-start">
            {/* Primary Workspace Column */}
            <div
              className={
                mobilePane === "preview" && activeSection !== "preview"
                  ? "hidden xl:block"
                  : "block"
              }
            >
              {activeSection === "home" && (
                <HomeSection
                  project={project}
                  lang={lang}
                  errorCount={issues.length}
                  onNavigate={handleSelectSection}
                  onCreateNewProject={handleCreateNewProject}
                  onImportProjectPatch={(patch) =>
                    updateProject((p) => ({ ...p, ...patch }))
                  }
                  onRunPreview={handleRunPreview}
                  onCheckCode={handleCheckCode}
                  onQuickDownloadZip={handleQuickDownloadZip}
                  onNotify={notify}
                />
              )}

              {activeSection === "app-settings" && (
                <AppSettingsSection
                  settings={project.appSettings}
                  lang={lang}
                  onChange={(patch) =>
                    updateProject((p) => ({
                      ...p,
                      appSettings: { ...p.appSettings, ...patch },
                    }))
                  }
                />
              )}

              {activeSection === "app-design" && (
                <AppDesignSection
                  iconDataUrl={project.iconDataUrl}
                  onChangeIcon={(iconDataUrl) =>
                    updateProject((p) => ({ ...p, iconDataUrl }))
                  }
                  appSettings={project.appSettings}
                  onChangeAppName={(appName) =>
                    updateProject((p) => ({
                      ...p,
                      appSettings: { ...p.appSettings, appName },
                    }))
                  }
                  nameStyle={project.nameStyle}
                  onChangeNameStyle={(patch) =>
                    updateProject((p) => ({
                      ...p,
                      nameStyle: { ...p.nameStyle, ...patch },
                    }))
                  }
                  lang={lang}
                  onNotify={notify}
                />
              )}

              {activeSection === "splash-screen" && (
                <SplashSection
                  splash={project.splash}
                  onChange={(patch) =>
                    updateProject((p) => ({
                      ...p,
                      splash: { ...p.splash, ...patch },
                    }))
                  }
                  lang={lang}
                  onReplaySplash={() => {
                    setRunNonce((n) => n + 1);
                    setActiveSection("preview");
                    setMobilePane("preview");
                  }}
                  onNotify={notify}
                />
              )}

              {activeSection === "status-bar" && (
                <StatusBarSection
                  statusBar={project.statusBar}
                  onChange={(patch) =>
                    updateProject((p) => ({
                      ...p,
                      statusBar: { ...p.statusBar, ...patch },
                    }))
                  }
                  lang={lang}
                />
              )}

              {activeSection === "bottom-nav" && (
                <BottomNavSection
                  bottomNav={project.bottomNav}
                  onChange={(patch) =>
                    updateProject((p) => ({
                      ...p,
                      bottomNav: { ...p.bottomNav, ...patch },
                    }))
                  }
                  lang={lang}
                  onNotify={notify}
                />
              )}

              {activeSection === "files" && (
                <FilesSection
                  files={project.files}
                  onChangeFiles={(files) =>
                    updateProject((p) => ({ ...p, files }))
                  }
                  onOpenInEditor={(tab, content) => {
                    setEditorTab(tab);
                    if (content !== undefined) {
                      updateProject((p) => ({
                        ...p,
                        code: { ...p.code, [tab]: content },
                      }));
                    }
                    setActiveSection(
                      tab === "css"
                        ? "css-editor"
                        : tab === "js"
                        ? "js-editor"
                        : tab === "python"
                        ? "python-backend"
                        : "html-editor"
                    );
                  }}
                  lang={lang}
                  onNotify={notify}
                />
              )}

              {isCodeSection && (
                <div className="space-y-4">
                  {activeSection === "python-backend" && (
                    <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/10 text-xs text-sky-800 dark:text-sky-200 flex items-start gap-2.5">
                      <Terminal className="w-4 h-4 shrink-0 mt-0.5 text-sky-500" />
                      <div className="space-y-1">
                        <div className="font-semibold">
                          Python Backend Companion Architecture
                        </div>
                        <p>
                          Android WebViews run HTML, CSS, and JavaScript locally on the device. Your Python Flask/FastAPI script here is packaged into <code className="font-mono">backend/app.py</code> inside exported ZIPs so you can host it on a Python server and call its API endpoints via <code className="font-mono">fetch()</code>.
                        </p>
                      </div>
                    </div>
                  )}

                  <CodeEditor
                    activeTab={editorTab}
                    onChangeTab={(tab) => {
                      setEditorTab(tab);
                      setHighlightLine(null);
                    }}
                    values={project.code}
                    onChangeCode={(tab, value) =>
                      updateProject((p) => ({
                        ...p,
                        code: { ...p.code, [tab]: value },
                      }))
                    }
                    highlightLine={highlightLine}
                    onRun={handleRunPreview}
                    onNotify={notify}
                  />
                </div>
              )}

              {activeSection === "external-links" && (
                <ExternalLinksSection
                  links={project.externalLinks}
                  onChangeLinks={(externalLinks) =>
                    updateProject((p) => ({ ...p, externalLinks }))
                  }
                  lang={lang}
                  onNotify={notify}
                />
              )}

              {activeSection === "preview" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <Info className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>
                      Interactive Virtual Device Stage — test navigation, splash screen, orientation, and responsive viewport sizes.
                    </span>
                  </div>
                  <VirtualPhonePreview
                    project={project}
                    runNonce={runNonce}
                    lang={lang}
                    onUpdatePreview={(patch) =>
                      updateProject((p) => ({
                        ...p,
                        preview: { ...p.preview, ...patch },
                      }))
                    }
                    onConsoleMessage={onConsoleMessage}
                  />
                </div>
              )}

              {activeSection === "console" && (
                <ConsoleSection
                  entries={consoleLogs}
                  onClear={() => setConsoleLogs([])}
                  lang={lang}
                />
              )}

              {activeSection === "error-fixer" && (
                <ErrorFixerSection
                  project={project}
                  issues={issues}
                  onCheckCode={handleCheckCode}
                  onJumpToLine={(tab, line) => {
                    setEditorTab(tab);
                    setHighlightLine(line);
                    setActiveSection(
                      tab === "css"
                        ? "css-editor"
                        : tab === "js"
                        ? "js-editor"
                        : tab === "python"
                        ? "python-backend"
                        : "html-editor"
                    );
                  }}
                  onApplyFix={(tab, fixedCode) => {
                    updateProject((p) => ({
                      ...p,
                      code: { ...p.code, [tab]: fixedCode },
                    }));
                    setIssues(
                      runStaticCodeCheck({
                        ...project,
                        code: { ...project.code, [tab]: fixedCode },
                      })
                    );
                    setRunNonce((n) => n + 1);
                  }}
                  lang={lang}
                  onNotify={notify}
                />
              )}

              {activeSection === "export" && (
                <ExportSection
                  project={project}
                  lang={lang}
                  onNotify={notify}
                />
              )}

              {activeSection === "apk-build" && (
                <ApkBuildSection
                  project={project}
                  lang={lang}
                  onNotify={notify}
                />
              )}

              {activeSection === "projects" && (
                <ProjectsSection
                  currentProject={project}
                  projects={projects}
                  lang={lang}
                  onNewProject={handleCreateNewProject}
                  onSaveNow={async () => {
                    await saveProjectToStorage(project);
                    setSaveStatus("saved");
                    setLastSavedAt(Date.now());
                    notify("Project saved to IndexedDB");
                  }}
                  onSaveAs={async (newName) => {
                    const copy: AppProject = {
                      ...project,
                      id: `proj_${Date.now()}`,
                      projectName: newName,
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                    };
                    await saveProjectToStorage(copy);
                    setProjects((list) => [copy, ...list]);
                    setProject(copy);
                    notify(`Saved copy as "${newName}"`);
                  }}
                  onLoadProject={(loaded) => {
                    setProject(loaded);
                    setActiveProjectId(loaded.id);
                    setIssues(runStaticCodeCheck(loaded));
                    setRunNonce((n) => n + 1);
                    notify(`Loaded "${loaded.projectName}"`);
                  }}
                  onDuplicateProject={async (target) => {
                    const dup: AppProject = {
                      ...target,
                      id: `proj_${Date.now()}`,
                      projectName: `${target.projectName} Copy`,
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                    };
                    await saveProjectToStorage(dup);
                    setProjects((list) => [dup, ...list]);
                    notify(`Duplicated "${target.projectName}"`);
                  }}
                  onDeleteProject={async (id) => {
                    await deleteProjectFromStorage(id);
                    const remaining = projects.filter((p) => p.id !== id);
                    setProjects(remaining);
                    if (project.id === id && remaining[0]) {
                      setProject(remaining[0]);
                      setActiveProjectId(remaining[0].id);
                    }
                    notify("Project deleted");
                  }}
                  onImportProjectJson={async (imported) => {
                    await saveProjectToStorage(imported);
                    setProjects((list) => [imported, ...list]);
                    setProject(imported);
                    setActiveProjectId(imported.id);
                    setRunNonce((n) => n + 1);
                  }}
                  onNotify={notify}
                />
              )}
            </div>

            {/* Docked Live Virtual Phone Preview (Visible on Desktop xl+, or when Preview tab active on mobile) */}
            {activeSection !== "preview" && (
              <div
                className={`${
                  mobilePane === "preview" ? "block" : "hidden xl:block"
                } xl:sticky xl:top-[77px] xl:max-h-[calc(100vh-96px)]`}
              >
                <VirtualPhonePreview
                  project={project}
                  runNonce={runNonce}
                  lang={lang}
                  onUpdatePreview={(patch) =>
                    updateProject((p) => ({
                      ...p,
                      preview: { ...p.preview, ...patch },
                    }))
                  }
                  onConsoleMessage={onConsoleMessage}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium shadow-xl border border-slate-700 dark:border-slate-300"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
