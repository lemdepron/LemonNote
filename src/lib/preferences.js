const NAMESPACE = "notecraft:prefs";

const listeners = new Set();

function readAll() {
  try {
    const raw = window.localStorage.getItem(NAMESPACE);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(next) {
  try {
    window.localStorage.setItem(NAMESPACE, JSON.stringify(next));
  } catch {
    /* storage unavailable — in-memory state still works for the session */
  }
  listeners.forEach((listener) => listener());
}

export function readPref(key, fallback) {
  const all = readAll();
  return Object.prototype.hasOwnProperty.call(all, key) ? all[key] : fallback;
}

export function writePref(key, value) {
  writeAll({ ...readAll(), [key]: value });
}

export function removePref(key) {
  const all = readAll();
  if (!Object.prototype.hasOwnProperty.call(all, key)) return;
  delete all[key];
  writeAll(all);
}

export function listPrefKeys() {
  return Object.keys(readAll());
}

export function subscribePrefs(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}