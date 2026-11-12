// Fix: Update the exports section in generator to include buildPreset
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("scripts/generate-theme-presets.mjs", "utf8");

// Find the exports section and replace it entirely
const exportsStart = source.indexOf("// Build exports");
if (exportsStart === -1) {
  console.log("ERROR: Could not find exports section");
  process.exit(1);
}

const oldExports = `  // Build exports
  const exports = \`// ============================================================
// EXPORTS (unchanged API)
// ============================================================

export { DEFAULT_PRESET };

export function readPresetId() {
  const stored = readPref(PRESET_KEY, "notecraft");
  return THEME_PRESETS.some((preset) => preset.id === stored) ? stored : "notecraft";
}

export function activePreset() {
  const id = readPresetId();
  return THEME_PRESETS.find((preset) => preset.id === id) || THEME_PRESETS[0];
}

export function setPreset(id) {
  const next = THEME_PRESETS.some((preset) => preset.id === id) ? id : "notecraft";
  writePref(PRESET_KEY, next);
  return next;
}

export function presetVars(preset, mode) {
  return (preset && preset.tokens && preset.tokens[mode]) || {};
}

const hsl = (value, alpha) => \`hsl(\${value}\${alpha == null ? "" : \` / \${alpha}\`})\`;`;

const newExports = `  // Build exports
  const exports = \`// ============================================================
// EXPORTS (unchanged API)
// ============================================================

export { DEFAULT_PRESET };

export function readPresetId() {
  const stored = readPref(PRESET_KEY, "notecraft");
  return THEME_PRESETS.some((preset) => preset.id === stored) ? stored : "notecraft";
}

export function activePreset() {
  const id = readPresetId();
  return THEME_PRESETS.find((preset) => preset.id === id) || THEME_PRESETS[0];
}

export function setPreset(id) {
  const next = THEME_PRESETS.some((preset) => preset.id === id) ? id : "notecraft";
  writePref(PRESET_KEY, next);
  return next;
}

export function presetVars(preset, mode) {
  return (preset && preset.tokens && preset.tokens[mode]) || {};
}

export function buildPreset(spec) {
  return {
    id: spec.id,
    name: spec.name,
    mode: null,
    surface: spec.surface,
    tokens: {
      light: spec.light,
      dark: spec.dark,
    },
  };
}

const hsl = (value, alpha) => \`hsl(\${value}\${alpha == null ? "" : \` / \${alpha}\`})\`;`;

const result = source.replace(oldExports, newExports);

if (result === source) {
  console.log("ERROR: Pattern not found!");
  process.exit(1);
}

writeFileSync("scripts/generate-theme-presets.mjs", result);
console.log("Fixed exports section!");