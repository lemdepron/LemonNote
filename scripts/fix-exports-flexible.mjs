// Fix: Update the exports section in generator to include buildPreset
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("scripts/generate-theme-presets.mjs", "utf8");

// Find the exports section by looking for key markers
const exportsMarker = "// Build exports";
const exportsStart = source.indexOf(exportsMarker);
if (exportsStart === -1) {
  console.log("ERROR: Could not find exports section");
  process.exit(1);
}

// Find the end of the exports section (the closing backtick and semicolon)
let backtickCount = 0;
let exportsEnd = -1;
let inTemplate = false;
for (let i = exportsStart; i < source.length; i++) {
  if (source[i] === '`') {
    if (!inTemplate) {
      inTemplate = true;
    } else {
      inTemplate = false;
    }
    backtickCount++;
    if (backtickCount === 2) {
      // Find the semicolon after the second backtick
      let j = i + 1;
      while (j < source.length && /\s/.test(source[j])) j++;
      if (source[j] === ';') {
        exportsEnd = j + 1;
        break;
      }
    }
  }
  if (source[i] === '`') inTemplate = !inTemplate;
}

if (exportsEnd === -1) {
  console.log("ERROR: Could not find end of exports section");
  process.exit(1);
}

const oldExports = source.slice(exportsStart, exportsEnd);

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

const result = source.slice(0, exportsStart) + 
  `  // Build exports
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

  ` + source.slice(exportsEnd);

if (result === source) {
  console.log("ERROR: Pattern not found!");
  process.exit(1);
}

writeFileSync("scripts/generate-theme-presets.mjs", result);
console.log("Fixed exports section!");