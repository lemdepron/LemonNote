import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");
const lines = source.split('\n');

// Fix: Remove empty lines between light and dark mode in NEUMORPHISM_THEMES
// The structure should be:
// },
// dark: {

if (lines[1539].trim() === '},' && lines[1540].trim() === '' && lines[1541].trim() === '' && lines[1542].trim() === 'dark: {') {
  // Remove the two empty lines
  lines.splice(1540, 2);
  writeFileSync("src/lib/theme-presets.js", lines.join('\n'));
  console.log("Fixed NEUMORPHISM_THEMES light/dark structure!");
} else {
  console.log("Pattern not found");
  console.log("Line 1539:", JSON.stringify(lines[1539]));
  console.log("Line 1540:", JSON.stringify(lines[1540]));
  console.log("Line 1541:", JSON.stringify(lines[1541]));
  console.log("Line 1542:", JSON.stringify(lines[1542]));
  console.log("Line 1543:", JSON.stringify(lines[1543]));
}