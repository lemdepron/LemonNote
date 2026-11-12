// Fix all bg-pattern values to have properly escaped quotes
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// Find all "--bg-pattern": "url(...)" and escape the inner quotes
// The pattern: "--bg-pattern": "url("data:... ")" 
// Should become: "--bg-pattern": "url(\"data:... \")"

let result = source;

// Use a more robust approach: find each occurrence and fix it
const lines = result.split('\n');
const fixedLines = lines.map((line, index) => {
  // Look for lines with --bg-pattern that have unescaped quotes in the url
  const match = line.match(/^(\s*"--bg-pattern":\s*")url\("([^"]+)"\)(.*),?$/);
  if (match) {
    const prefix = match[1];
    const urlContent = match[2];
    const suffix = match[3];
    // Escape quotes in the URL content
    const escapedUrl = urlContent.replace(/"/g, '\\"');
    return `${prefix}url("${escapedUrl}")${suffix}`;
  }
  return line;
});

result = fixedLines.join('\n');

writeFileSync("src/lib/theme-presets.js", result);
console.log("Fixed bg-pattern escaping!");