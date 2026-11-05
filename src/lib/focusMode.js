import { useEffect, useState } from "react";

const KEY = "nc.focusMode";

const listeners = new Set();

const read = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

let focus = read();

export function getFocusMode() {
  return focus;
}

export function setFocusMode(next) {
  const value = Boolean(next);
  if (value === focus) return;
  focus = value;
  try {
    localStorage.setItem(KEY, value ? "1" : "0");
  } catch {
    /* storage blocked — the session still works */
  }
  listeners.forEach((listener) => listener(value));
}

export function toggleFocusMode() {
  setFocusMode(!focus);
}

export function useFocusMode() {
  const [value, setValue] = useState(focus);

  useEffect(() => {
    const listener = (next) => setValue(next);
    listeners.add(listener);
    listener(focus);
    return () => listeners.delete(listener);
  }, []);

  return { focus: value, toggle: toggleFocusMode, setFocus: setFocusMode };
}