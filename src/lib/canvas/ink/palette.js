import { readPref, writePref } from "@/lib/preferences";

const HISTORY_KEY = "inkColorHistory";
const CUSTOM_KEY = "inkCustomPalette";
const LIMIT = 14;

export function readHistory() {
  const list = readPref(HISTORY_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function rememberColor(color) {
  if (!color) return readHistory();
  const next = [color, ...readHistory().filter((entry) => entry !== color)].slice(0, LIMIT);
  writePref(HISTORY_KEY, next);
  return next;
}

export function readCustomPalette() {
  const list = readPref(CUSTOM_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function writeCustomPalette(colors) {
  const next = [...new Set(colors)].slice(0, 24);
  writePref(CUSTOM_KEY, next);
  return next;
}