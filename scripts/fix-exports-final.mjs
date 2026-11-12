// Fix exports section to include buildPreset function
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("scripts/generate-theme-presets.mjs", "utf8");

// Find the exports section
const marker = "// Build exports";
const start = source.indexOf(marker);
if (start === -1) {
  console.log("ERROR: Could not find exports section");
  process.exit(1);
}

// Find the end of the exports section
let inTemplate = false;
let backtickCount = 0;
let endPos = -1;

for (let i = start; i < source.length; i++) {
  if (source[i] === '`') {
    if (!inTemplate) {
      inTemplate = true;
    } else {
      inTemplate = false;
    }
    backtickCount++;
    if (backtickCount === 2) {
      let j = i + 1;
      while (j < source.length && /\s/.test(source[j])) j++;
      if (source[j] === ';') {
        endPos = j + 1;
        break;
      }
    }
  }
  if (source[i] === '`') inTemplate = !inTemplate;
}

if (endPos === -1) {
  console.log("ERROR: Could not find end of exports section");
  process.exit(1);
}

const oldExports = source.slice(start, endPos);

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

const hsl = (value, alpha) => \`hsl(\${value}\${alpha == null ? "" : \` / \${alpha}\`})\`;\`;

const result = source.slice(0, start) + `  // Build exports
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

const hsl = (value, alpha) => \`hsl(\${value}\${alpha == null ? "" : \` / \${alpha}\`})\`;\`;

` + source.slice(endPos);

if (result === source) {
  console.log("ERROR: Pattern not found!");
  process.exit(1);
}

writeFileSync("scripts/generate-theme-presets.mjs", result);
console.log("Fixed exports section!");