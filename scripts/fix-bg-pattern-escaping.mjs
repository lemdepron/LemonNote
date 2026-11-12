// Post-process theme-presets.js to escape double quotes in bg-pattern values
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// Find all "--bg-pattern": "..." lines and escape double quotes in the value
// Pattern: "--bg-pattern": "url(...)" with unescaped quotes inside
const lines = source.split('\n');
const result = lines.map(line => {
  const match = line.match(/^(\s*"--bg-pattern":\s*")([^"]*)(".*)$/);
  if (match) {
    const prefix = match[1];
    const value = match[2];
    const suffix = match[3];
    // Escape double quotes in the value
    const escapedValue = value.replace(/"/g, '\\"');
    return prefix + escapedValue + suffix;
  }
  return line;
}).join('\n');

writeFileSync("src/lib/theme-presets.js", result);
console.log("Fixed bg-pattern escaping!");