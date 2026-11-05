/** Shortcut specs shown in the ribbon tooltips, and the matcher used to run them. */

const MAC =
  typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent || "");

const MOD_LABEL = MAC ? "⌘" : "Ctrl";

const ARROWS = { ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→", Backspace: "⌫", Delete: "Del" };

export function shortcutLabel(spec) {
  if (!spec) return "";
  const parts = [];
  if (spec.mod) parts.push(MOD_LABEL);
  if (spec.shift) parts.push(MAC ? "⇧" : "Shift");
  if (spec.alt) parts.push(MAC ? "⌥" : "Alt");
  const key = ARROWS[spec.key] || (spec.key.length === 1 ? spec.key.toUpperCase() : spec.key);
  parts.push(key);
  return parts.join(MAC ? "" : "+");
}

export function shortcutMatches(event, spec) {
  if (!spec) return false;
  const modPressed = MAC ? event.metaKey : event.ctrlKey;
  if (Boolean(spec.mod) !== modPressed) return false;
  if (Boolean(spec.shift) !== event.shiftKey) return false;
  if (Boolean(spec.alt) !== event.altKey) return false;
  return String(event.key).toLowerCase() === String(spec.key).toLowerCase();
}