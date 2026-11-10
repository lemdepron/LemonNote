/**
 * Bridge between the ribbon and the markdown textarea (#nb-editor).
 *
 * The ribbon holds no reference to the editor, so it reads the caret through this
 * small store. Edits go through execCommand("insertText") on the exact changed
 * region: the textarea keeps focus, the selection is restored afterwards, and the
 * edit joins the browser's native undo stack, so one Ctrl+Z reverts one action.
 *
 * Supports multiple editors (one per pane) keyed by paneId.
 */
import { useSyncExternalStore } from "react";
import { toast } from "@/lib/toast";

const EMPTY = { start: 0, end: 0, value: "", live: false };
const DEFAULT_PANE = "default";

// Map of paneId -> { element, snapshot, listeners }
const panes = new Map();

function getPaneState(paneId) {
  if (!panes.has(paneId)) {
    panes.set(paneId, {
      element: null,
      snapshot: EMPTY,
      listeners: new Set(),
    });
  }
  return panes.get(paneId);
}

function publish(paneId, next) {
  const state = getPaneState(paneId);
  state.snapshot = next;
  state.listeners.forEach((listener) => listener());
}

function readFrom(node) {
  return {
    start: node.selectionStart ?? 0,
    end: node.selectionEnd ?? 0,
    value: node.value,
    live: true,
  };
}

/** Called by the editor when the textarea mounts. Returns its cleanup. */
export function registerEditor(paneId, node) {
  const state = getPaneState(paneId);
  state.element = node;
  if (node) publish(paneId, readFrom(node));
  return () => {
    if (state.element !== node) return;
    state.element = null;
    publish(paneId, EMPTY);
  };
}

/** Re-reads the textarea after the caret or text changed. */
export function syncEditor(paneId = DEFAULT_PANE) {
  const state = getPaneState(paneId);
  if (!state.element) return;
  publish(paneId, readFrom(state.element));
}

/** Live caret while the editor is focused, otherwise the last known one. */
export function caret(paneId = DEFAULT_PANE) {
  const state = getPaneState(paneId);
  if (state.element && document.activeElement === state.element) return readFrom(state.element);
  return state.snapshot;
}

export function subscribe(paneId, listener) {
  const state = getPaneState(paneId);
  state.listeners.add(listener);
  return () => state.listeners.delete(listener);
}

export function getSnapshot(paneId = DEFAULT_PANE) {
  return getPaneState(paneId).snapshot;
}

export function useEditorSnapshot(paneId = DEFAULT_PANE) {
  return useSyncExternalStore(
    (listener) => subscribe(paneId, listener),
    () => getSnapshot(paneId),
    () => getSnapshot(paneId)
  );
}

/**
 * Replaces [start, end) with `text`. `caret` is where the cursor lands afterwards.
 * When the browser refuses the command the caller's fallback gets the whole body.
 */
export function commit(paneId, result, onFallback) {
  if (!result) return false;
  const state = getPaneState(paneId);
  const node = state.element;
  if (!node) {
    onFallback?.(result.next);
    return false;
  }
  node.focus({ preventScroll: true });
  node.setSelectionRange(result.start, result.end);
  let done = false;
  try {
    done = document.execCommand("insertText", false, result.text);
  } catch {
    done = false;
  }
  if (!done) {
    onFallback?.(result.next);
    return false;
  }
  if (Array.isArray(result.select)) {
    node.setSelectionRange(result.select[0], result.select[1]);
  } else {
    const at = typeof result.caret === "number" ? result.caret : result.start + result.text.length;
    node.setSelectionRange(at, at);
  }
  publish(paneId, readFrom(node));
  return true;
}

/** Runs a native editing command (undo, redo, selectAll) on the editor and re-reads it. */
export function execEditor(paneId, command) {
  const state = getPaneState(paneId);
  const node = state.element;
  if (!node) return false;
  node.focus({ preventScroll: true });
  let done = false;
  try {
    done = document.execCommand(command);
  } catch {
    done = false;
  }
  publish(paneId, readFrom(node));
  return done;
}

/** Copies text to the clipboard; falls back to the legacy command when the async API is blocked. */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard.");
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    const state = getPaneState(DEFAULT_PANE);
    if (state.element) state.element.focus({ preventScroll: true });
    if (ok) toast.success("Copied to clipboard.");
    return ok;
  }
}