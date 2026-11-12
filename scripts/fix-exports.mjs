// Fix exports section to include buildPreset function
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("scripts/generate-theme-presets.mjs", "utf8");

const oldStr = `export function presetVars(preset, mode) {
  return (preset && preset.tokens && preset.tokens[mode]) || {};
}

const hsl = (value, alpha) => \`hsl(\${value}\${alpha == null ? "" : \` / \${alpha}\`})\`;`;

const newStr = `export function presetVars(preset, mode) {
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

const result = source.replace(oldStr, newStr);

if (result === source) {
  console.log("ERROR: Pattern not found!");
  process.exit(1);
}

writeFileSync("scripts/generate-theme-presets.mjs", result);
console.log("Added buildPreset to exports!");