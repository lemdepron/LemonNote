/**
 * Quick Access pins: an ordered list of stable ribbon-button ids (see
 * ribbon-registry.js) saved as one preference (`quickAccessPins`).
 *
 * The stored list is always filtered against the registry, so a renamed or
 * removed button can never break the saved data — unknown ids are dropped.
 */
import { useEffect, useState } from "react";
import { readPref, subscribePrefs, writePref } from "./preferences";
import { DEFAULT_PINS, RIBBON_ACTIONS } from "./ribbon-registry";

export const QUICK_ACCESS_PREF = "quickAccessPins";

/** Keeps only known, non-duplicate ids, in order. Never throws. */
export function normalizePins(ids) {
  const seen = new Set();
  const out = [];
  for (const id of Array.isArray(ids) ? ids : []) {
    if (typeof id !== "string" || !RIBBON_ACTIONS[id] || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/** The saved pins, or the defaults when nothing is saved yet. */
export function readPins() {
  return normalizePins(readPref(QUICK_ACCESS_PREF, DEFAULT_PINS));
}

export function writePins(ids) {
  writePref(QUICK_ACCESS_PREF, normalizePins(ids));
}

export const isPinned = (id) => normalizePins(readPref(QUICK_ACCESS_PREF, [])).includes(id);

export function addPin(id) {
  if (!RIBBON_ACTIONS[id] || isPinned(id)) return;
  writePins([...readPins(), id]);
}

export function removePin(id) {
  writePins(readPins().filter((pinId) => pinId !== id));
}

export function togglePin(id) {
  if (isPinned(id)) removePin(id);
  else addPin(id);
}

/** Moves `id` so it lands at index `toIndex`, shifting the rest (drop-on-chip semantics). */
export function reorderPin(id, toIndex) {
  const pins = readPins();
  const from = pins.indexOf(id);
  if (from === -1) return;
  const without = pins.filter((pinId) => pinId !== id);
  const at = Math.max(0, Math.min(toIndex, without.length));
  without.splice(at, 0, id);
  writePins(without);
}

/** React hook: the live pinned list (updates when any pin changes). */
export function useQuickPins() {
  const [pins, setPins] = useState(readPins);
  useEffect(() => subscribePrefs(() => setPins(readPins())), []);
  return pins;
}
