import { useCallback, useEffect, useState } from "react";
import { readPref, subscribePrefs, writePref } from "@/lib/preferences";

export const THEME_KEY = "theme";
export const THEME_MODES = ["light", "dark", "system"];

const DARK_QUERY = "(prefers-color-scheme: dark)";

const listeners = new Set();

export function systemTheme() {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

export function readThemeMode() {
  const stored = readPref(THEME_KEY, "system");
  return THEME_MODES.includes(stored) ? stored : "system";
}

export function resolveTheme(mode) {
  return mode === "system" ? systemTheme() : mode;
}

/**
 * Resolve a channel token (stored as `220 18% 6%`) into a usable colour string.
 * Canvas renderers cannot use CSS classes, so they read the same tokens here.
 */
export function tokenColor(name, alpha) {
  if (typeof window === "undefined") return "";
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw) return "";
  if (/^(#|rgb|hsl|oklch|color\()/i.test(raw)) return raw;
  return alpha == null ? `hsl(${raw})` : `hsl(${raw} / ${alpha})`;
}

/** Puts the resolved theme on <html>; runs before paint on load (see index.html). */
export function applyTheme(mode = readThemeMode()) {
  if (typeof document === "undefined") return "dark";
  const resolved = resolveTheme(mode);
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  const background = tokenColor("--background");
  if (meta && background) meta.setAttribute("content", background);
  listeners.forEach((listener) => listener(resolved));
  return resolved;
}

export function setThemeMode(mode) {
  writePref(THEME_KEY, mode);
  return applyTheme(mode);
}

export function subscribeTheme(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Re-renders a consumer whenever the resolved theme changes. */
export function useThemeRevision() {
  const [revision, setRevision] = useState(0);
  useEffect(() => subscribeTheme(() => setRevision((value) => value + 1)), []);
  return revision;
}

export function useTheme() {
  const [mode, setMode] = useState(readThemeMode);
  const [resolved, setResolved] = useState(() => resolveTheme(readThemeMode()));

  useEffect(() => {
    const unsubscribeTheme = subscribeTheme(setResolved);
    const unsubscribePrefs = subscribePrefs(() => setMode(readThemeMode()));
    const media = window.matchMedia(DARK_QUERY);
    const onSystemChange = () => {
      if (readThemeMode() === "system") applyTheme("system");
    };
    if (media.addEventListener) media.addEventListener("change", onSystemChange);
    else media.addListener(onSystemChange);
    return () => {
      unsubscribeTheme();
      unsubscribePrefs();
      if (media.removeEventListener) media.removeEventListener("change", onSystemChange);
      else media.removeListener(onSystemChange);
    };
  }, []);

  const choose = useCallback((next) => setThemeMode(next), []);

  return { mode, resolved, setMode: choose };
}