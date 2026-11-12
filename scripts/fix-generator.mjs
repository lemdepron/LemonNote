// Fix: Add buildPreset function to generator script
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("scripts/generate-theme-presets.mjs", "utf8");

const searchStr = `export function presetVars(preset, mode) {
  return (preset && preset.tokens && preset.tokens[mode]) || {};
}

const hsl = (value, alpha) => \`hsl(\${value}\${alpha == null ? "" : \` / \${alpha}\`})\`;`;

const insertStr = `export function buildPreset(spec) {
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

const result = source.replace(searchStr, insertStr);

writeFileSync("scripts/generate-theme-presets.mjs", result);
console.log("Added buildPreset function to generator!");