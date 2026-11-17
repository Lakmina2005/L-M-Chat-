import React, { useState } from "react";
import {
  Download,
  FileArchive,
  PackageCheck,
  Copy,
  Share2,
  AlertCircle,
  CheckCircle2,
  Info,
  Cloud,
  Loader2,
} from "lucide-react";
import type { ApkBuildConfig, AppProject, UILang } from "../types";
import { UI_COPY } from "../i18n";
import {
  buildAppDocumentHtml,
  generateAndroidCapacitorZip,
  generateAssetsZip,
  generateWebProjectZip,
  triggerBlobDownload,
} from "../utils/generators";
import { sanitizeFilename, validatePackageName } from "../utils/validators";

interface ExportSectionProps {
  project: AppProject;
  lang: UILang;
  onNotify: (msg: string) => void;
}

export const ExportSection: React.FC<ExportSectionProps> = ({
  project,
  lang,
  onNotify,
}) => {
  const [busy, setBusy] = useState(false);
  const baseName = sanitizeFilename(project.appSettings.appName).toLowerCase();

  const downloadText = (content: string, filename: string, mime = "text/plain") => {
    triggerBlobDownload(new Blob([content], { type: mime }), filename);
    onNotify(`Downloaded ${filename}`);
  };

  const downloadProjectZip = async () => {
    setBusy(true);
    try {
      const blob = await generateWebProjectZip(project);
      triggerBlobDownload(blob, `${baseName}-web-project.zip`);
      onNotify("Downloaded Web Project ZIP");
    } finally {
      setBusy(false);
    }
  };

  const downloadAssetsZip = async () => {
    setBusy(true);
    try {
      const blob = await generateAssetsZip(project);
      triggerBlobDownload(blob, `${baseName}-assets.zip`);
      onNotify("Downloaded Assets ZIP");
    } finally {
      setBusy(false);
    }
  };

  const downloadStandaloneHtml = () => {
    const html = buildAppDocumentHtml(project, {
      includeBridge: false,
      playSplash: true,
    });
    downloadText(html, `${baseName}-standalone.html`, "text/html;charset=utf-8");
  };

  return (
    <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {lang === "si" ? "ගොනු සහ ව්‍යාපෘති Export කරන්න" : "Export Code & Web Project"}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Download individual source files, a self-contained single HTML app, or complete ZIP archives using Blob URLs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={downloadStandaloneHtml}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-500 text-left space-y-1 transition-colors"
        >
          <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-sky-500" />
            <span>Standalone App HTML</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Single runnable index.html with splash, nav, styles & assets.
          </p>
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={downloadProjectZip}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-500 text-left space-y-1 transition-colors"
        >
          <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FileArchive className="w-4 h-4 text-emerald-500" />
            <span>Full Web Project ZIP</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Includes index.html, src/, backend/, config, and assets.
          </p>
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={downloadAssetsZip}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-500 text-left space-y-1 transition-colors"
        >
          <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FileArchive className="w-4 h-4 text-amber-500" />
            <span>Assets ZIP</span>
          </div>
          <p className="text-[11px] text-slate-500">
            App icon, splash video, and all uploaded media files.
          </p>
        </button>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => downloadText(project.code.html, "body.html", "text/html")}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Download HTML
        </button>
        <button
          type="button"
          onClick={() => downloadText(project.code.css, "style.css", "text/css")}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Download CSS
        </button>
        <button
          type="button"
          onClick={() =>
            downloadText(project.code.js, "script.js", "application/javascript")
          }
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Download JS
        </button>
        <button
          type="button"
          onClick={() =>
            downloadText(project.code.json, "capacitor.config.json", "application/json")
          }
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Download JSON
        </button>
      </div>
    </div>
  );
};

interface ApkBuildSectionProps {
  project: AppProject;
  lang: UILang;
  onNotify: (msg: string) => void;
}

export const ApkBuildSection: React.FC<ApkBuildSectionProps> = ({
  project,
  lang,
  onNotify,
}) => {
  const [buildConfig, setBuildConfig] = useState<ApkBuildConfig>({
    buildType: "debug",
    minSdk: 23,
    targetSdk: 34,
    keystoreAlias: "appforge-key",
    keystorePath: "release.keystore",
    cloudBuildUrl: "",
  });
  // Signing password kept strictly in ephemeral component state if user tests cloud payload, NEVER saved in LocalStorage or generated Gradle files!
  const [ephemeralKeystoreNotice] = useState(true);
  const [projectZipBlob, setProjectZipBlob] = useState<Blob | null>(null);
  const [generating, setGenerating] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<string | null>(null);
  const [cloudBusy, setCloudBusy] = useState(false);

  const pkgCheck = validatePackageName(project.appSettings.packageName);
  const slug = sanitizeFilename(project.appSettings.appName).toLowerCase();

  const handleGenerateAndroidProject = async () => {
    if (!pkgCheck.valid) {
      onNotify("Fix Android Package Name in App Settings before generating.");
      return;
    }
    setGenerating(true);
    try {
      const zip = await generateAndroidCapacitorZip(project, buildConfig);
      setProjectZipBlob(zip);
      onNotify("Android Capacitor Project generated — ready to download ZIP");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadAndroidZip = async () => {
    let blob = projectZipBlob;
    if (!blob) {
      blob = await generateAndroidCapacitorZip(project, buildConfig);
      setProjectZipBlob(blob);
    }
    triggerBlobDownload(blob, `${slug}-android-capacitor-project.zip`);
    onNotify("Downloaded Android Project ZIP");
  };

  const copyInstructions = async () => {
    const text = `1. Extract ${slug}-android-capacitor-project.zip\n2. Open android/ in Android Studio OR run:\n   cd android && ./gradlew ${
      buildConfig.buildType === "release" ? "assembleRelease" : "assembleDebug"
    }\n3. Output APK: android/app/build/outputs/apk/${buildConfig.buildType}/app-${buildConfig.buildType}.apk`;
    await navigator.clipboard?.writeText(text);
    onNotify("Copied Gradle / Android Studio build instructions");
  };

  const handleShareProject = async () => {
    const shareText = `APP FORGE Project: ${project.appSettings.appName} (${project.appSettings.packageName} v${project.appSettings.versionName})`;
    if (navigator.share) {
      try {
        await navigator.share({ title: project.appSettings.appName, text: shareText });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    await navigator.clipboard?.writeText(shareText);
    onNotify("Copied project summary to clipboard");
  };

  const triggerCloudBuild = async () => {
    if (!buildConfig.cloudBuildUrl.trim()) {
      onNotify("Enter an HTTPS CI / Cloud Build webhook URL first.");
      return;
    }
    setCloudBusy(true);
    setCloudStatus(null);
    try {
      const res = await fetch("/api/cloud-build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: buildConfig.cloudBuildUrl.trim(),
          payload: {
            appName: project.appSettings.appName,
            packageName: project.appSettings.packageName,
            versionName: project.appSettings.versionName,
            versionCode: project.appSettings.versionCode,
            buildType: buildConfig.buildType,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cloud build request failed");
      setCloudStatus(`Webhook accepted (HTTP ${data.status}).`);
    } catch (err: unknown) {
      setCloudStatus(
        err instanceof Error ? err.message : "Failed to reach build webhook."
      );
    } finally {
      setCloudBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Architecture & Honest Browser Limitation Notice */}
      <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-200 space-y-2">
        <div className="font-semibold flex items-center gap-2 text-sm">
          <Info className="w-4 h-4 shrink-0" />
          <span>Browser Builder → Android Project Generator → ZIP Export → Gradle APK</span>
        </div>
        <p>{UI_COPY[lang].browserApkNotice}</p>
      </div>

      {/* Build Configuration */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {lang === "si" ? "Android APK ව්‍යාපෘති නිර්මාපකය" : "Android APK Project Generator"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              {project.appSettings.packageName} · versionCode {project.appSettings.versionCode} · versionName {project.appSettings.versionName}
            </p>
          </div>
          {!pkgCheck.valid && (
            <span className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Invalid package name
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <label className="space-y-1.5 block">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              APK Build Type
            </span>
            <select
              value={buildConfig.buildType}
              onChange={(e) =>
                setBuildConfig((c) => ({
                  ...c,
                  buildType: e.target.value as "debug" | "release",
                }))
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              <option value="debug">Debug APK (Immediate testing)</option>
              <option value="release">Release APK (Keystore signed)</option>
            </select>
          </label>

          <label className="space-y-1.5 block">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              minSdkVersion
            </span>
            <input
              type="number"
              min={21}
              max={34}
              value={buildConfig.minSdk}
              onChange={(e) =>
                setBuildConfig((c) => ({ ...c, minSdk: Number(e.target.value) || 23 }))
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums"
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              targetSdkVersion
            </span>
            <input
              type="number"
              min={30}
              max={35}
              value={buildConfig.targetSdk}
              onChange={(e) =>
                setBuildConfig((c) => ({
                  ...c,
                  targetSdk: Number(e.target.value) || 34,
                }))
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums"
            />
          </label>
        </div>

        {buildConfig.buildType === "release" && (
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="text-xs font-semibold text-slate-900 dark:text-white">
              Release Signing Keystore Configuration
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="space-y-1 block">
                <span className="text-slate-500">Keystore Filename / Path</span>
                <input
                  type="text"
                  value={buildConfig.keystorePath}
                  onChange={(e) =>
                    setBuildConfig((c) => ({ ...c, keystorePath: e.target.value }))
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </label>
              <label className="space-y-1 block">
                <span className="text-slate-500">Key Alias</span>
                <input
                  type="text"
                  value={buildConfig.keystoreAlias}
                  onChange={(e) =>
                    setBuildConfig((c) => ({ ...c, keystoreAlias: e.target.value }))
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </label>
            </div>
            {ephemeralKeystoreNotice && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Security guarantee: Keystore passwords are never saved in browser storage or written into generated build.gradle files. Supply KEYSTORE_PASSWORD and KEY_PASSWORD via environment variables at build time.
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2.5 pt-2">
          <button
            type="button"
            disabled={generating || !pkgCheck.valid}
            onClick={handleGenerateAndroidProject}
            className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PackageCheck className="w-4 h-4" />
            )}
            <span>Create Android Project</span>
          </button>

          <button
            type="button"
            disabled={!pkgCheck.valid}
            onClick={handleDownloadAndroidZip}
            className="px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download Android Project</span>
          </button>

          <button
            type="button"
            onClick={copyInstructions}
            className="px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Build Instructions</span>
          </button>

          <button
            type="button"
            onClick={handleShareProject}
            className="px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Project</span>
          </button>
        </div>

        {/* Honest Generation Status */}
        {projectZipBlob && (
          <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-800 dark:text-emerald-200 space-y-1.5">
            <div className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Android Project Generated (Ready for Gradle / Android Studio Compilation)</span>
            </div>
            <p>
              Contains package.json, capacitor.config.json, AndroidManifest.xml, build.gradle, MainActivity.java (with native DownloadListener & StatusBar), styles.xml, and www/ assets. Because no native APK binary was compiled in-browser, download the Android Project ZIP above and run <code className="font-mono">./gradlew assemble{buildConfig.buildType === "release" ? "Release" : "Debug"}</code>.
            </p>
          </div>
        )}
      </div>

      {/* Optional Remote Cloud Build Service Integration */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Cloud className="w-4 h-4 text-sky-500" />
          <span>Optional Remote Cloud Build Webhook (CI / GitHub Actions)</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Connect an external HTTPS build runner endpoint to dispatch automated Gradle APK builds remotely.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={buildConfig.cloudBuildUrl}
            onChange={(e) =>
              setBuildConfig((c) => ({ ...c, cloudBuildUrl: e.target.value }))
            }
            placeholder="https://ci.yourdomain.com/api/build-apk"
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
          />
          <button
            type="button"
            disabled={cloudBusy}
            onClick={triggerCloudBuild}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center justify-center gap-1.5"
          >
            {cloudBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Dispatch Cloud Build</span>
          </button>
        </div>
        {cloudStatus && (
          <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">
            {cloudStatus}
          </p>
        )}
      </div>
    </div>
  );
};
