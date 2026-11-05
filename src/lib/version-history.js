import { readPref, writePref } from "./preferences";
import { countWords } from "./note-stats";

/**
 * Note snapshots for the version-history extension.
 *
 * Snapshots live beside the vault in local preferences, keyed per note, so a
 * restore never needs the network. Identical bodies are not stacked twice.
 */

const LIMIT = 20;
export const SNAPSHOT_INTERVAL = 5 * 60 * 1000;

const key = (noteId) => `plugin:version-history:${noteId}`;

export function listSnapshots(noteId) {
  if (!noteId) return [];
  const stored = readPref(key(noteId), []);
  return Array.isArray(stored) ? stored : [];
}

export function pushSnapshot(note) {
  if (!note?.id) return [];
  const body = note.body || "";
  const title = note.title || "";
  const stored = listSnapshots(note.id);
  if (stored.length && stored[0].body === body && stored[0].title === title) return stored;
  const next = [
    { at: new Date().toISOString(), title, body, words: countWords(body) },
    ...stored,
  ].slice(0, LIMIT);
  writePref(key(note.id), next);
  return next;
}

export function clearSnapshots(noteId) {
  if (!noteId) return;
  writePref(key(noteId), []);
}