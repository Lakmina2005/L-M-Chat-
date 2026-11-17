import type { AppProject } from "../types";

const DB_NAME = "appforge_studio_db";
const DB_VERSION = 1;
const STORE_NAME = "projects";
const ACTIVE_KEY = "appforge_active_project_id";
const LS_FALLBACK_KEY = "appforge_projects_fallback";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Failed to open DB"));
  });
}

export async function listProjects(): Promise<AppProject[]> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const rows = (req.result as AppProject[]) || [];
        rows.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(rows);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      const raw = localStorage.getItem(LS_FALLBACK_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as AppProject[];
      return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch {
      return [];
    }
  }
}

export async function saveProjectToStorage(project: AppProject): Promise<void> {
  const updated: AppProject = { ...project, updatedAt: Date.now() };
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(updated);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fallback to localStorage if IndexedDB fails
    const all = await listProjects();
    const idx = all.findIndex((p) => p.id === updated.id);
    if (idx >= 0) all[idx] = updated;
    else all.unshift(updated);
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(all));
  }
  try {
    localStorage.setItem(ACTIVE_KEY, updated.id);
  } catch {
    // Ignore storage quota issues for active key
  }
}

export async function deleteProjectFromStorage(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const all = await listProjects();
    const filtered = all.filter((p) => p.id !== id);
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(filtered));
  }
}

export function getActiveProjectId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    // Ignore
  }
}
