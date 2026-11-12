import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");
const lines = source.split('\n');

// Fix line 1540 (index 1540) - remove extra }, after light mode
// The structure should be:
// light: { ... },
// dark: { ... }
// But currently it's:
// },
// },
// dark: {

if (lines[1539].trim() === '},' && lines[1540].trim() === '},' && lines[1541].trim() === 'dark: {') {
  // Remove the extra }, at line 1540 (index 1540)
  lines.splice(1540, 1);
  writeFileSync("src/lib/theme-presets.js", lines.join('\n'));
  console.log("Fixed NEUMORPHISM_THEMES structure!");
} else {
  console.log("Pattern not found");
  console.log("Line 1539:", JSON.stringify(lines[1539]));
  console.log("Line 1540:", JSON.stringify(lines[1540]));
  console.log("Line 1541:", JSON.stringify(lines[1541]));
  console.log("Line 1542:", JSON.stringify(lines[1542]));
}