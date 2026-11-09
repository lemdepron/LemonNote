/**
 * Bridge between the ribbon and the markdown textarea (#nb-editor).
 *
 * The ribbon holds no reference to the editor, so it reads the caret through this
 * small store. Edits go through execCommand("insertText") on the exact changed
 * region: the textarea keeps focus, the selection is restored afterwards, and the
 * edit joins the browser's native undo stack, so one Ctrl+Z reverts one action.
 */
import { useSyncExternalStore } from "react";
import { toast } from "@/lib/toast";

const EMPTY = { start: 0, end: 0, value: "", live: false };

let element = null;
let snapshot = EMPTY;
const listeners = new Set();

function publish(next) {
  snapshot = next;
  listeners.forEach((listener) => listener());
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
export function registerEditor(node) {
  element = node;
  if (node) publish(readFrom(node));
  return () => {
    if (element !== node) return;
    element = null;
    publish(EMPTY);
  };
}

/** Re-reads the textarea after the caret or text changed. */
export function syncEditor() {
  if (!element) return;
  publish(readFrom(element));
}

/** Live caret while the editor is focused, otherwise the last known one. */
export function caret() {
  if (element && document.activeElement === element) return readFrom(element);
  return snapshot;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getSnapshot = () => snapshot;

export function useEditorSnapshot() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Replaces [start, end) with `text`. `caret` is where the cursor lands afterwards.
 * When the browser refuses the command the caller's fallback gets the whole body.
 */
export function commit(result, onFallback) {
  if (!result) return false;
  const node = element;
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
  publish(readFrom(node));
  return true;
}

/** Runs a native editing command (undo, redo, selectAll) on the editor and re-reads it. */
export function execEditor(command) {
  const node = element;
  if (!node) return false;
  node.focus({ preventScroll: true });
  let done = false;
  try {
    done = document.execCommand(command);
  } catch {
    done = false;
  }
  publish(readFrom(node));
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
    if (element) element.focus({ preventScroll: true });
    if (ok) toast.success("Copied to clipboard.");
    return ok;
  }
}
