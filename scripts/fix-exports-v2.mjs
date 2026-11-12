// Fix exports section to include buildPreset function
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("scripts/generate-theme-presets.mjs", "utf8");

// Find the position of "const hsl = " after presetVars
const hslPos = source.indexOf("const hsl = (value, alpha) =>");
if (hslPos === -1) {
  console.log("ERROR: Could not find hsl function!");
  process.exit(1);
}

// Find the end of the presetVars function (the blank line before const hsl)
let searchPos = hslPos;
while (searchPos > 0 && source[searchPos] !== '\n') searchPos--;
while (searchPos > 0 && source[searchPos] === '\n') searchPos--;
while (searchPos > 0 && source[searchPos] !== '\n') searchPos--;

// Find the end of presetVars function (the closing brace)
let braceCount = 0;
let inFunction = false;
let funcEnd = -1;
for (let i = hslPos - 1; i >= 0; i--) {
  if (source[i] === '}') braceCount++;
  else if (source[i] === '{') {
    braceCount--;
    if (braceCount === 0) {
      funcEnd = i + 1;
      break;
    }
  }
}

// Insert after the presetVars function
const insertPos = funcEnd;
const insertStr = `\n\nexport function buildPreset(spec) {\n  return {\n    id: spec.id,\n    name: spec.name,\n    mode: null,\n    surface: spec.surface,\n    tokens: {\n      light: spec.light,\n      dark: spec.dark,\n    },\n  };\n}`;

const result = source.slice(0, insertPos) + insertStr + source.slice(insertPos);
writeFileSync("scripts/generate-theme-presets.mjs", result);
console.log("Added buildPreset function to exports!");