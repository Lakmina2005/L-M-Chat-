import JSZip from "jszip";
import type { ApkBuildConfig, AppProject } from "../types";
import { sanitizeFilename } from "./validators";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getAppNameCss(project: AppProject): string {
  const ns = project.nameStyle;
  const gradientCss = ns.gradientEnabled
    ? `background: linear-gradient(90deg, ${ns.gradientFrom}, ${ns.gradientTo}); -webkit-background-clip: text; -webkit-text-fill-color: transparent;`
    : `color: ${ns.textColor};`;

  return `
    font-size: ${ns.fontSize}px;
    font-family: '${ns.fontFamily}', sans-serif;
    font-weight: ${ns.bold ? 700 : 500};
    font-style: ${ns.italic ? "italic" : "normal"};
    letter-spacing: ${ns.letterSpacing}px;
    text-shadow: ${ns.gradientEnabled ? "none" : ns.textShadow || "none"};
    text-align: ${ns.alignment};
    ${gradientCss}
  `;
}

function getIconSvgMarkup(iconName: string): string {
  const map: Record<string, string> = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    "check-square": '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    star: '<polygon points="12 2 15.1 8.3 22 9.3 17 14.2 18.2 21 12 17.8 5.8 21 7 14.2 2 9.3 8.9 8.3 12 2"/>',
  };
  const body = map[iconName] || map.home;
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

export function buildAppDocumentHtml(
  project: AppProject,
  options: {
    includeBridge: boolean;
    playSplash: boolean;
    standaloneTitle?: string;
  }
): string {
  const { appSettings, splash, bottomNav, code, files, externalLinks } = project;
  const assetMap: Record<string, string> = {};
  for (const f of files) {
    if (f.isBinary) {
      assetMap[f.name] = f.content;
      assetMap[f.path] = f.content;
      assetMap[`assets/${f.name}`] = f.content;
    }
  }

  let processedHtml = code.html;
  for (const [key, dataUrl] of Object.entries(assetMap)) {
    processedHtml = processedHtml.split(key).join(dataUrl);
  }

  const extraCss = files
    .filter((f) => f.name.endsWith(".css") && f.name !== "style.css")
    .map((f) => f.content)
    .join("\n");
  const extraJs = files
    .filter((f) => f.name.endsWith(".js") && f.name !== "script.js")
    .map((f) => f.content)
    .join("\n");

  const splashBg =
    splash.backgroundMode === "gradient"
      ? `linear-gradient(155deg, ${splash.gradientFrom}, ${splash.gradientTo})`
      : splash.backgroundColor;

  const videoSrc =
    splash.video.enabled && splash.video.sourceType === "local"
      ? splash.video.localDataUrl
      : splash.video.enabled
      ? splash.video.url
      : "";

  const splashOverlay =
    splash.enabled && options.playSplash
      ? `
    <div id="af-splash" class="af-splash af-anim-${splash.animation}" style="background:${splashBg};color:${splash.textColor};align-items:${
          splash.position === "top"
            ? "flex-start"
            : splash.position === "bottom"
            ? "flex-end"
            : "center"
        };">
      ${
        videoSrc
          ? `<video class="af-splash-video" src="${escapeHtml(videoSrc)}" ${
              splash.video.autoplay ? "autoplay" : ""
            } ${splash.video.muted ? "muted" : ""} ${
              splash.video.loop ? "loop" : ""
            } playsinline style="object-fit:${
              splash.video.objectFit
            };object-position:${splash.video.position};transform:scale(${
              splash.video.cropZoom
            });"></video>`
          : ""
      }
      <div class="af-splash-inner">
        ${
          splash.showIcon && project.iconDataUrl
            ? `<img src="${project.iconDataUrl}" alt="App Icon" style="width:${splash.iconSize}px;height:${splash.iconSize}px;border-radius:22%;object-fit:cover;box-shadow:0 10px 30px rgba(0,0,0,0.35);" />`
            : ""
        }
        ${
          splash.showName
            ? `<div style="font-size:${splash.nameSize}px;font-weight:700;margin-top:12px;">${escapeHtml(
                appSettings.appName
              )}</div>`
            : ""
        }
        ${
          splash.subtitle
            ? `<p style="margin:6px 0 0;font-size:13px;opacity:0.8;">${escapeHtml(
                splash.subtitle
              )}</p>`
            : ""
        }
        ${
          splash.loadingAnimation === "spinner"
            ? '<div class="af-loader-spinner"></div>'
            : splash.loadingAnimation === "dots"
            ? '<div class="af-loader-dots"><span></span><span></span><span></span></div>'
            : splash.loadingAnimation === "bar"
            ? '<div class="af-loader-bar"><div></div></div>'
            : ""
        }
      </div>
    </div>`
      : "";

  const navMarkup = bottomNav.enabled
    ? `<nav id="af-bottom-nav" class="af-bottom-nav ${
        bottomNav.position === "floating" ? "af-nav-floating" : ""
      }" style="background:${bottomNav.backgroundColor};color:${bottomNav.textColor};">
        ${bottomNav.items
          .map(
            (item, idx) => `
          <button type="button" class="af-nav-btn ${
            idx === 0 ? "active" : ""
          }" data-idx="${idx}" data-action="${item.action}" data-target="${escapeHtml(
              item.target
            )}" style="--af-active:${bottomNav.activeColor};">
            ${getIconSvgMarkup(item.icon)}
            <span>${escapeHtml(item.label)}</span>
          </button>`
          )
          .join("")}
      </nav>`
    : "";

  const bridgeScript = options.includeBridge
    ? `
    (function(){
      function send(level, args) {
        try {
          var text = Array.prototype.slice.call(args).map(function(a){
            if (typeof a === 'object') { try { return JSON.stringify(a); } catch(e) { return String(a); } }
            return String(a);
          }).join(' ');
          window.parent.postMessage({ source: 'appforge-preview', type: 'console', level: level, message: text }, '*');
        } catch(e){}
      }
      ['log','info','warn','error'].forEach(function(lvl){
        var orig = console[lvl];
        console[lvl] = function(){ send(lvl, arguments); if(orig) orig.apply(console, arguments); };
      });
      window.addEventListener('error', function(ev){
        send('error', [ev.message + ' (line ' + ev.lineno + ')']);
      });
      window.addEventListener('unhandledrejection', function(ev){
        send('error', ['Unhandled Promise Rejection: ' + ev.reason]);
      });
    })();`
    : "";

  const linksJson = JSON.stringify(externalLinks);
  const splashDuration = splash.video.enabled
    ? Math.max(splash.durationMs, splash.video.durationSec * 1000)
    : splash.durationMs;

  return `<!doctype html>
<html lang="${escapeHtml(appSettings.language || "en")}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title>${escapeHtml(options.standaloneTitle || appSettings.appName)}</title>
<style>
  html, body {
    margin: 0;
    padding: 0;
    min-height: 100%;
    background: ${appSettings.backgroundColor};
    color: ${appSettings.textColor};
    font-family: '${appSettings.fontFamily}', 'Noto Sans Sinhala', system-ui, -apple-system, sans-serif;
  }
  body {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    padding-bottom: ${bottomNav.enabled ? "68px" : "0"};
    box-sizing: border-box;
  }
  .af-app-header {
    padding: 14px 16px 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    justify-content: ${
      project.nameStyle.alignment === "center"
        ? "center"
        : project.nameStyle.alignment === "right"
        ? "flex-end"
        : "flex-start"
    };
  }
  .af-app-header img {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
  }
  .af-app-title {
    margin: 0;
    line-height: 1.2;
    ${getAppNameCss(project)}
  }
  .af-anim-text-pulse { animation: afPulse 2s infinite; }
  .af-anim-text-glow { filter: drop-shadow(0 0 8px ${appSettings.themeColor}); }
  .af-anim-text-slide { animation: afSlideIn 0.5s ease; }
  .af-anim-text-float { animation: afFloat 3s ease-in-out infinite; }
  @keyframes afPulse { 0%,100%{opacity:1;} 50%{opacity:0.7;} }
  @keyframes afSlideIn { from{transform:translateY(-8px);opacity:0;} to{transform:none;opacity:1;} }
  @keyframes afFloat { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-3px);} }

  .af-main { flex: 1; }
  .af-bottom-nav {
    position: fixed;
    left: 0; right: 0; bottom: 0;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-around;
    border-top: 1px solid rgba(255,255,255,0.1);
    z-index: 40;
    padding: 0 6px;
  }
  .af-bottom-nav.af-nav-floating {
    left: 12px; right: 12px; bottom: 12px;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.12);
    box-shadow: 0 10px 30px rgba(0,0,0,0.35);
  }
  .af-nav-btn {
    background: transparent;
    border: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    font-size: 11px;
    cursor: pointer;
    padding: 6px 10px;
    opacity: 0.78;
    transition: color 0.15s, opacity 0.15s;
  }
  .af-nav-btn.active {
    color: var(--af-active);
    opacity: 1;
    font-weight: 600;
  }
  .af-splash {
    position: fixed;
    inset: 0;
    z-index: 90;
    display: flex;
    justify-content: center;
    padding: 36px 20px;
    overflow: hidden;
    transition: opacity 0.35s ease, transform 0.35s ease;
  }
  .af-splash.hide { opacity: 0; pointer-events: none; }
  .af-splash-video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }
  .af-splash-inner {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    text-shadow: 0 2px 10px rgba(0,0,0,0.4);
  }
  .af-anim-zoom .af-splash-inner { animation: afZoom 0.6s ease; }
  .af-anim-slide .af-splash-inner { animation: afSlideIn 0.6s ease; }
  .af-anim-pulse .af-splash-inner { animation: afPulse 1.5s infinite; }
  @keyframes afZoom { from{transform:scale(0.85);opacity:0;} to{transform:scale(1);opacity:1;} }
  .af-loader-spinner {
    width: 24px; height: 24px; margin-top: 18px;
    border: 3px solid rgba(255,255,255,0.2);
    border-top-color: ${appSettings.themeColor};
    border-radius: 50%;
    animation: afSpin 0.8s linear infinite;
  }
  @keyframes afSpin { to{transform:rotate(360deg);} }
  .af-loader-dots { display:flex; gap:6px; margin-top:18px; }
  .af-loader-dots span { width:7px; height:7px; border-radius:50%; background:${appSettings.themeColor}; animation: afPulse 1s infinite; }
  .af-loader-dots span:nth-child(2){ animation-delay:0.2s; }
  .af-loader-dots span:nth-child(3){ animation-delay:0.4s; }
  .af-loader-bar { width: 120px; height: 4px; border-radius: 4px; background: rgba(255,255,255,0.16); margin-top: 18px; overflow: hidden; }
  .af-loader-bar div { width: 45%; height: 100%; background: ${appSettings.themeColor}; animation: afBar 1.1s ease-in-out infinite; }
  @keyframes afBar { 0%{transform:translateX(-100%);} 100%{transform:translateX(260%);} }

  .af-webview-modal {
    position: fixed; inset: 0; z-index: 80;
    background: #0f172a;
    display: none; flex-direction: column;
  }
  .af-webview-modal.open { display: flex; }
  .af-webview-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px; background: #1e293b; color: #f8fafc; font-size: 12px;
  }
  .af-webview-bar button {
    background: #334155; color: #fff; border: none; border-radius: 6px; padding: 4px 10px; cursor: pointer;
  }
  .af-webview-modal iframe { flex: 1; border: none; width: 100%; background: #fff; }
</style>
<style>
${code.css}
${extraCss}
</style>
</head>
<body>
${splashOverlay}
<header class="af-app-header">
  ${project.iconDataUrl ? `<img src="${project.iconDataUrl}" alt="Icon" />` : ""}
  <h1 class="af-app-title af-anim-text-${project.nameStyle.animation}">${escapeHtml(
    appSettings.appName
  )}</h1>
</header>
<main class="af-main">
${processedHtml}
</main>
${navMarkup}
<div id="af-webview-modal" class="af-webview-modal">
  <div class="af-webview-bar">
    <span id="af-webview-title">External View</span>
    <button type="button" onclick="document.getElementById('af-webview-modal').classList.remove('open')">Close</button>
  </div>
  <iframe id="af-webview-frame" title="WebView"></iframe>
</div>
<script>
${bridgeScript}
window.APP_FORGE_LINKS = ${linksJson};
window.openAppForgeLink = function(url, mode, title) {
  if (mode === 'in-app' || mode === 'fullscreen-webview') {
    var m = document.getElementById('af-webview-modal');
    var f = document.getElementById('af-webview-frame');
    var t = document.getElementById('af-webview-title');
    if (m && f) {
      if (t) t.textContent = title || url;
      f.src = url;
      m.classList.add('open');
      return;
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer');
};
(function(){
  var splash = document.getElementById('af-splash');
  if (splash) {
    setTimeout(function(){ splash.classList.add('hide'); }, ${Math.max(400, splashDuration)});
  }
  var navButtons = document.querySelectorAll('.af-nav-btn');
  navButtons.forEach(function(btn){
    btn.addEventListener('click', function(){
      navButtons.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      var action = btn.getAttribute('data-action');
      var target = btn.getAttribute('data-target') || '';
      if (action === 'go-home') {
        if (typeof window.navigateToPage === 'function') window.navigateToPage('home');
      } else if (action === 'open-page') {
        if (typeof window.navigateToPage === 'function') window.navigateToPage(target);
      } else if (action === 'go-back') {
        window.history.back();
      } else if (action === 'open-url') {
        window.openAppForgeLink(target, 'in-app', btn.textContent);
      } else if (action === 'js-action') {
        try { new Function(target)(); } catch(e) { console.error(e); }
      }
    });
  });
})();
</script>
<script>
${code.js}
${extraJs}
</script>
</body>
</html>`;
}

export async function generateWebProjectZip(project: AppProject): Promise<Blob> {
  const zip = new JSZip();
  const webHtml = buildAppDocumentHtml(project, {
    includeBridge: false,
    playSplash: true,
  });

  zip.file("index.html", webHtml);
  zip.file("src/body.html", project.code.html);
  zip.file("src/style.css", project.code.css);
  zip.file("src/script.js", project.code.js);
  zip.file("capacitor.config.json", project.code.json);

  if (project.code.python.trim()) {
    zip.file("backend/app.py", project.code.python);
    zip.file("backend/requirements.txt", "flask>=3.0.0\n");
  }

  for (const file of project.files) {
    if (file.isBinary && file.content.startsWith("data:")) {
      const base64 = file.content.split(",")[1] || "";
      zip.file(file.path, base64, { base64: true });
    } else {
      zip.file(file.path, file.content);
    }
  }

  return zip.generateAsync({ type: "blob" });
}

export async function generateAssetsZip(project: AppProject): Promise<Blob> {
  const zip = new JSZip();
  if (project.iconDataUrl.startsWith("data:")) {
    const [, data] = project.iconDataUrl.split(",");
    const isSvg = project.iconDataUrl.includes("svg");
    if (isSvg) {
      zip.file("app-icon.svg", decodeURIComponent(data));
    } else {
      zip.file("app-icon.png", data, { base64: true });
    }
  }
  if (
    project.splash.video.enabled &&
    project.splash.video.sourceType === "local" &&
    project.splash.video.localDataUrl.startsWith("data:")
  ) {
    const base64 = project.splash.video.localDataUrl.split(",")[1] || "";
    zip.file(
      sanitizeFilename(project.splash.video.localFileName || "splash.mp4"),
      base64,
      { base64: true }
    );
  }
  for (const file of project.files) {
    if (file.isBinary && file.content.startsWith("data:")) {
      const base64 = file.content.split(",")[1] || "";
      zip.file(file.name, base64, { base64: true });
    } else {
      zip.file(file.name, file.content);
    }
  }
  return zip.generateAsync({ type: "blob" });
}

export async function generateAndroidCapacitorZip(
  project: AppProject,
  config: ApkBuildConfig
): Promise<Blob> {
  const zip = new JSZip();
  const pkg = project.appSettings.packageName.trim() || "com.appforge.myapp";
  const pkgPath = pkg.replace(/\./g, "/");
  const slug = sanitizeFilename(project.appSettings.appName).toLowerCase();

  // 1. Root Capacitor workspace files
  const rootPkgJson = {
    name: slug || "appforge-mobile",
    version: project.appSettings.versionName || "1.0.0",
    description: project.appSettings.description,
    scripts: {
      "android:sync": "npx cap sync android",
      "android:open": "npx cap open android",
      "android:debug": "cd android && ./gradlew assembleDebug",
      "android:release": "cd android && ./gradlew assembleRelease",
    },
    dependencies: {
      "@capacitor/core": "^6.1.0",
      "@capacitor/android": "^6.1.0",
      "@capacitor/status-bar": "^6.0.0",
      "@capacitor/splash-screen": "^6.0.0",
    },
    devDependencies: {
      "@capacitor/cli": "^6.1.0",
    },
  };
  zip.file("package.json", JSON.stringify(rootPkgJson, null, 2));

  const capConfig = {
    appId: pkg,
    appName: project.appSettings.appName,
    webDir: "www",
    plugins: {
      SplashScreen: {
        launchShowDuration: project.splash.enabled
          ? project.splash.durationMs
          : 0,
        backgroundColor: project.splash.backgroundColor,
        showSpinner: project.splash.loadingAnimation !== "none",
      },
      StatusBar: {
        overlaysWebView: project.statusBar.transparent,
        backgroundColor: project.statusBar.backgroundColor,
        style: project.statusBar.iconStyle === "light" ? "LIGHT" : "DARK",
      },
    },
  };
  zip.file("capacitor.config.json", JSON.stringify(capConfig, null, 2));

  // 2. Web assets under www/
  const builtIndex = buildAppDocumentHtml(project, {
    includeBridge: false,
    playSplash: true,
  });
  zip.file("www/index.html", builtIndex);
  zip.file("www/style.css", project.code.css);
  zip.file("www/script.js", project.code.js);

  if (project.iconDataUrl.startsWith("data:")) {
    const [, data] = project.iconDataUrl.split(",");
    if (project.iconDataUrl.includes("svg")) {
      zip.file("www/assets/icon.svg", decodeURIComponent(data));
    } else {
      zip.file("www/assets/icon.png", data, { base64: true });
    }
  }

  for (const file of project.files) {
    if (file.folder === "backend") {
      zip.file(file.path, file.content);
    } else if (file.isBinary && file.content.startsWith("data:")) {
      const base64 = file.content.split(",")[1] || "";
      zip.file(file.path.startsWith("www/") ? file.path : `www/${file.path}`, base64, {
        base64: true,
      });
    } else {
      zip.file(file.path.startsWith("www/") ? file.path : `www/${file.path}`, file.content);
    }
  }

  if (project.code.python.trim()) {
    zip.file("backend/app.py", project.code.python);
    zip.file("backend/requirements.txt", "flask>=3.0.0\n");
  }

  // 3. Android Gradle & Manifest Structure
  zip.file(
    "android/settings.gradle",
    `rootProject.name = "${slug}"\ninclude ':app'\n`
  );

  zip.file(
    "android/gradle.properties",
    `org.gradle.jvmargs=-Xmx2048m\nandroid.useAndroidX=true\nandroid.enableJetifier=true\n`
  );

  zip.file(
    "android/build.gradle",
    `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.5.2'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
`
  );

  const signingBlock =
    config.buildType === "release"
      ? `    signingConfigs {
        release {
            // Passwords are read from environment variables or gradle.properties — never hardcoded in source
            storeFile file(System.getenv("KEYSTORE_FILE") ?: "${config.keystorePath || "release.keystore"}")
            storePassword System.getenv("KEYSTORE_PASSWORD") ?: ""
            keyAlias System.getenv("KEY_ALIAS") ?: "${config.keystoreAlias || "appforge"}"
            keyPassword System.getenv("KEY_PASSWORD") ?: ""
        }
    }`
      : "";

  const releaseSigningRef =
    config.buildType === "release" ? "signingConfig signingConfigs.release" : "";

  zip.file(
    "android/app/build.gradle",
    `apply plugin: 'com.android.application'

android {
    namespace "${pkg}"
    compileSdk ${config.targetSdk}

    defaultConfig {
        applicationId "${pkg}"
        minSdk ${config.minSdk}
        targetSdk ${config.targetSdk}
        versionCode ${Math.max(1, project.appSettings.versionCode)}
        versionName "${project.appSettings.versionName || "1.0.0"}"
    }

${signingBlock}

    buildTypes {
        debug {
            debuggable true
        }
        release {
            minifyEnabled false
            ${releaseSigningRef}
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.7.0'
    implementation 'androidx.webkit:webkit:1.11.0'
}
`
  );

  const orientationAttr =
    project.appSettings.orientation === "portrait"
      ? 'android:screenOrientation="portrait"'
      : project.appSettings.orientation === "landscape"
      ? 'android:screenOrientation="landscape"'
      : 'android:screenOrientation="unspecified"';

  const hasHttpLinks = project.externalLinks.some((l) =>
    l.url.trim().startsWith("http://")
  );

  zip.file(
    "android/app/src/main/AndroidManifest.xml",
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:usesCleartextTraffic="${hasHttpLinks ? "true" : "false"}"
        android:theme="@style/AppTheme">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            ${orientationAttr}
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`
  );

  zip.file(
    "android/app/src/main/res/values/strings.xml",
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${escapeHtml(project.appSettings.appName)}</string>
</resources>
`
  );

  zip.file(
    "android/app/src/main/res/values/colors.xml",
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">${project.appSettings.themeColor}</color>
    <color name="statusBarColor">${project.statusBar.backgroundColor}</color>
    <color name="splashBackground">${project.splash.backgroundColor}</color>
</resources>
`
  );

  zip.file(
    "android/app/src/main/res/values/styles.xml",
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="android:statusBarColor">@color/statusBarColor</item>
        <item name="android:windowLightStatusBar">${
          project.statusBar.iconStyle === "dark" ? "true" : "false"
        }</item>
    </style>
</resources>
`
  );

  zip.file(
    `android/app/src/main/java/${pkgPath}/MainActivity.java`,
    `package ${pkg};

import android.app.DownloadManager;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.view.View;
import android.view.Window;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        if (${project.statusBar.visible ? "true" : "false"}) {
            try {
                window.setStatusBarColor(Color.parseColor("${project.statusBar.backgroundColor}"));
            } catch (IllegalArgumentException ignored) {}
        } else {
            window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN);
        }

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.setWebViewClient(new WebViewClient());
        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                    request.setMimeType(mimeType);
                    request.setTitle(URLUtil.guessFileName(url, contentDisposition, mimeType));
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, URLUtil.guessFileName(url, contentDisposition, mimeType));
                    DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                    if (dm != null) dm.enqueue(request);
                } else {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                }
            }
        });

        setContentView(webView);
        webView.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
`
  );

  // Copy www into Android assets folder too so direct Gradle builds work immediately without running npx cap sync!
  zip.file("android/app/src/main/assets/www/index.html", builtIndex);
  zip.file("android/app/src/main/assets/www/style.css", project.code.css);
  zip.file("android/app/src/main/assets/www/script.js", project.code.js);

  zip.file(
    "BUILD_INSTRUCTIONS.md",
    `# ${project.appSettings.appName} — Android APK Build Guide

Package ID: \`${pkg}\`
Version: \`${project.appSettings.versionName}\` (code \`${project.appSettings.versionCode}\`)
Build Mode: \`${config.buildType.toUpperCase()}\`

## Option A: Android Studio (Recommended)
1. Extract this ZIP archive.
2. Open Android Studio -> **Open** -> select the \`android/\` folder inside the extracted directory.
3. Let Gradle sync complete.
4. Click **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.

## Option B: Gradle Command Line
\`\`\`bash
cd android
${
  config.buildType === "release"
    ? `export KEYSTORE_FILE="${config.keystorePath || "release.keystore"}"
export KEYSTORE_PASSWORD="<your-keystore-password>"
export KEY_ALIAS="${config.keystoreAlias || "appforge"}"
export KEY_PASSWORD="<your-key-password>"
./gradlew assembleRelease`
    : "./gradlew assembleDebug"
}
\`\`\`

Generated APK output path:
\`android/app/build/outputs/apk/${config.buildType}/app-${config.buildType}.apk\`
`
  );

  return zip.generateAsync({ type: "blob" });
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const safeName = sanitizeFilename(filename);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
