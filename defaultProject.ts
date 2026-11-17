import type { AppProject } from "../types";

export const DEFAULT_ICON_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0284c7"/>
        <stop offset="100%" stop-color="#2563eb"/>
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="112" fill="url(#g)"/>
    <path d="M168 340L256 140L344 340M198 282H314" stroke="#ffffff" stroke-width="34" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>`
)}`;

export function createDefaultProject(
  overrides?: Partial<Pick<AppProject, "id" | "projectName">>
): AppProject {
  const now = Date.now();
  const id = overrides?.id || `proj_${now}_${Math.random().toString(36).slice(2, 7)}`;
  const projectName = overrides?.projectName || "LankaPocket Studio";

  return {
    id,
    projectName,
    createdAt: now,
    updatedAt: now,
    iconDataUrl: DEFAULT_ICON_SVG,
    appSettings: {
      appName: "LankaPocket",
      packageName: "com.appforge.lankapocket",
      versionName: "1.0.0",
      versionCode: 1,
      description:
        "Bilingual mobile utility and quick notes app built with App Forge.",
      developerName: "App Forge Studio",
      themeColor: "#0ea5e9",
      backgroundColor: "#0f172a",
      textColor: "#f8fafc",
      fontFamily: "Plus Jakarta Sans",
      language: "en-si",
      orientation: "portrait",
      showAppHeader: true,
    },
    nameStyle: {
      fontSize: 24,
      fontFamily: "Plus Jakarta Sans",
      bold: true,
      italic: false,
      letterSpacing: 0.4,
      textShadow: "0 2px 12px rgba(14, 165, 233, 0.35)",
      gradientEnabled: true,
      gradientFrom: "#38bdf8",
      gradientTo: "#818cf8",
      textColor: "#f8fafc",
      animation: "none",
      position: "header",
      alignment: "left",
    },
    splash: {
      enabled: true,
      durationMs: 2000,
      showIcon: true,
      iconSize: 84,
      showName: true,
      nameSize: 26,
      subtitle: "Loading your workspace...",
      position: "center",
      backgroundMode: "gradient",
      backgroundColor: "#0f172a",
      gradientFrom: "#0f172a",
      gradientTo: "#1e293b",
      textColor: "#f8fafc",
      animation: "zoom",
      loadingAnimation: "bar",
      video: {
        enabled: false,
        sourceType: "none",
        url: "",
        localFileName: "",
        localDataUrl: "",
        localSizeBytes: 0,
        autoplay: true,
        muted: true,
        loop: true,
        objectFit: "cover",
        durationSec: 3,
        cropZoom: 1,
        position: "center",
      },
    },
    statusBar: {
      visible: true,
      backgroundColor: "#0f172a",
      iconStyle: "light",
      transparent: false,
      showTime: true,
      showBattery: true,
      showNetwork: true,
    },
    bottomNav: {
      enabled: true,
      backgroundColor: "#111827",
      textColor: "#94a3b8",
      activeColor: "#38bdf8",
      position: "bottom",
      items: [
        {
          id: "nav_home",
          label: "Home",
          icon: "home",
          action: "go-home",
          target: "home",
        },
        {
          id: "nav_tasks",
          label: "Tasks",
          icon: "check-square",
          action: "open-page",
          target: "tasks",
        },
        {
          id: "nav_about",
          label: "About",
          icon: "info",
          action: "open-page",
          target: "about",
        },
        {
          id: "nav_settings",
          label: "Info",
          icon: "sliders",
          action: "js-action",
          target: "showToast('App version 1.0.0 ready')",
        },
      ],
    },
    code: {
      html: `<div class="app-shell">
  <section data-page="home" class="page active">
    <div class="hero-card">
      <p class="kicker">ආයුබෝවන් · Welcome</p>
      <h2>Smart Daily Hub</h2>
      <p class="lead">Add quick notes, check tasks, and test native navigation inside your mobile build.</p>
      <div class="stats-row">
        <div class="stat-box">
          <span class="stat-label">Tasks</span>
          <strong id="task-count">3</strong>
        </div>
        <div class="stat-box">
          <span class="stat-label">Mode</span>
          <strong>Offline Ready</strong>
        </div>
      </div>
    </div>

    <div class="composer">
      <input id="note-input" type="text" placeholder="Write a note (සටහනක් ලියන්න)..." />
      <button id="add-note-btn" type="button">Add</button>
    </div>

    <ul id="note-list" class="note-list"></ul>
  </section>

  <section data-page="tasks" class="page">
    <h3>Active Checklist</h3>
    <div class="card-item">
      <strong>Configure Android Package ID</strong>
      <p>Verify reverse-domain package name before export.</p>
    </div>
    <div class="card-item">
      <strong>Customize App Icon & Splash</strong>
      <p>Upload a 512x512 square PNG or SVG logo.</p>
    </div>
    <div class="card-item">
      <strong>Export Capacitor Android ZIP</strong>
      <p>Build debug or release APK via Android Studio.</p>
    </div>
  </section>

  <section data-page="about" class="page">
    <h3>About This App</h3>
    <p class="lead">Built with APP FORGE HTML-to-APK studio. Supports Sinhala & English typography, offline storage, and native WebView bridges.</p>
    <button type="button" class="secondary-btn" onclick="showToast('Native bridge active')">Test JS Action</button>
  </section>

  <div id="app-toast" class="app-toast" aria-live="polite"></div>
</div>`,
      css: `* {
  box-sizing: border-box;
}

.app-shell {
  padding: 16px;
  min-height: 100%;
  font-family: inherit;
}

.page {
  display: none;
  animation: fadeUp 0.2s ease;
}

.page.active {
  display: block;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.hero-card {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 16px;
}

.kicker {
  margin: 0 0 6px;
  font-size: 12px;
  color: #38bdf8;
  font-weight: 600;
}

.hero-card h2 {
  margin: 0 0 8px;
  font-size: 20px;
}

.lead {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  opacity: 0.82;
}

.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 14px;
}

.stat-box {
  background: rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 10px 12px;
}

.stat-label {
  display: block;
  font-size: 11px;
  opacity: 0.7;
  margin-bottom: 2px;
}

.composer {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.composer input {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
  color: inherit;
  font-size: 13px;
}

.composer button,
.secondary-btn {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: #0ea5e9;
  color: #ffffff;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}

.note-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.note-item,
.card-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  font-size: 13px;
}

.note-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.note-del {
  background: transparent;
  border: none;
  color: #f87171;
  font-size: 12px;
  cursor: pointer;
}

.card-item {
  margin-bottom: 10px;
}

.card-item p {
  margin: 4px 0 0;
  font-size: 12px;
  opacity: 0.75;
}

.app-toast {
  position: fixed;
  left: 50%;
  bottom: 76px;
  transform: translateX(-50%) translateY(12px);
  background: #0284c7;
  color: #fff;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 12px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.app-toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}`,
      js: `const defaultNotes = [
  "Test Live Phone Preview",
  "සිංහල සහ English අකුරු පරීක්ෂාව"
];

let notes = [...defaultNotes];

function renderNotes() {
  const list = document.getElementById("note-list");
  const countEl = document.getElementById("task-count");
  if (!list) return;

  list.innerHTML = notes
    .map(
      (note, idx) =>
        '<li class="note-item"><span>' +
        note.replace(/</g, "&lt;") +
        '</span><button class="note-del" onclick="removeNote(' +
        idx +
        ')">Remove</button></li>'
    )
    .join("");

  if (countEl) countEl.textContent = String(notes.length);
}

window.removeNote = function (index) {
  notes.splice(index, 1);
  renderNotes();
  showToast("Note removed");
};

window.showToast = function (msg) {
  const toast = document.getElementById("app-toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
};

window.navigateToPage = function (pageName) {
  const pages = document.querySelectorAll("[data-page]");
  pages.forEach((p) => {
    p.classList.toggle("active", p.getAttribute("data-page") === pageName);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("add-note-btn");
  const input = document.getElementById("note-input");

  if (btn && input) {
    btn.addEventListener("click", () => {
      const val = input.value.trim();
      if (!val) return;
      notes.unshift(val);
      input.value = "";
      renderNotes();
      showToast("Note added");
    });
  }

  renderNotes();
  console.log("LankaPocket initialized successfully");
});`,
      python: `# Optional Backend Companion (Flask API)
# Host this file on your Python server and connect from script.js via fetch()

from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route("/api/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok", "service": "lankapocket-backend"})

@app.route("/api/notes", methods=["POST"])
def save_note():
    data = request.get_json(silent=True) or {}
    note_text = str(data.get("text", "")).strip()
    if not note_text:
        return jsonify({"error": "Note text is required"}), 400
    return jsonify({"saved": True, "text": note_text})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
`,
      json: `{
  "appId": "com.appforge.lankapocket",
  "appName": "LankaPocket",
  "webDir": "www",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https"
  }
}`,
    },
    files: [
      {
        id: "f_readme",
        name: "notes.txt",
        path: "www/notes.txt",
        folder: "www",
        mimeType: "text/plain",
        size: 86,
        isBinary: false,
        content: "App Forge project workspace. Add HTML, CSS, JS, images, or Python backend scripts.",
        updatedAt: now,
      },
    ],
    externalLinks: [
      {
        id: "link_docs",
        title: "Capacitor Docs",
        url: "https://capacitorjs.com/docs",
        mode: "in-app",
      },
    ],
    preview: {
      device: "android-phone",
      sizeMode: "mobile",
      customWidth: 380,
      customHeight: 740,
    },
  };
}
