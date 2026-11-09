/**
 * Toast system for LemonNote.
 * Simple, accessible, no dependencies. Max 3 visible toasts at once.
 */

import { useState, useEffect } from "react";

let listeners = [];
let nextId = 1;
const MAX_TOASTS = 3;
const DEFAULT_DURATION = 4000;

const store = {
  toasts: [],
  subscribe(listener) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  notify() {
    listeners.forEach((l) => l(store.toasts));
  },
  add(toast) {
    const id = nextId++;
    const newToast = {
      id,
      type: "info",
      duration: DEFAULT_DURATION,
      ...toast,
    };
    store.toasts = [...store.toasts, newToast].slice(-MAX_TOASTS);
    store.notify();
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => store.remove(id), newToast.duration);
    }
    return id;
  },
  remove(id) {
    store.toasts = store.toasts.filter((t) => t.id !== id);
    store.notify();
  },
  clear() {
    store.toasts = [];
    store.notify();
  },
};

export function useToast() {
  const [toasts, setToasts] = useState(store.toasts);
  useEffect(() => store.subscribe(setToasts), []);
  return toasts;
}

/**
 * Show a success toast.
 * @param {string} text - Message to show
 * @param {number} [duration=4000] - Auto-dismiss time in ms, 0 = no auto-dismiss
 * @returns {number} Toast ID
 */
export function success(text, duration = DEFAULT_DURATION) {
  return store.add({ type: "success", text, duration });
}

/**
 * Show an error toast.
 * @param {string} text - Message to show
 * @param {number} [duration=6000] - Auto-dismiss time in ms, 0 = no auto-dismiss
 * @returns {number} Toast ID
 */
export function error(text, duration = 6000) {
  return store.add({ type: "error", text, duration });
}

/**
 * Show an info toast.
 * @param {string} text - Message to show
 * @param {number} [duration=4000] - Auto-dismiss time in ms, 0 = no auto-dismiss
 * @returns {number} Toast ID
 */
export function info(text, duration = DEFAULT_DURATION) {
  return store.add({ type: "info", text, duration });
}

/**
 * Show a custom toast with optional action button.
 * @param {Object} options
 * @param {string} options.text - Message to show
 * @param {string} [options.type="info"] - "success" | "error" | "info"
 * @param {string} [options.actionLabel] - Label for action button
 * @param {Function} [options.onAction] - Called when action button clicked
 * @param {number} [options.duration=4000] - Auto-dismiss time in ms, 0 = no auto-dismiss
 * @returns {number} Toast ID
 */
export function toast({ text, type = "info", actionLabel, onAction, duration = DEFAULT_DURATION }) {
  return store.add({ type, text, actionLabel, onAction, duration });
}

export { store as _store };