// Better fix for bg-pattern escaping - handles multiline string literals
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// Replace all occurrences of "--bg-pattern": "url(...)" with escaped quotes
// The pattern finds the full string literal for bg-pattern
let result = source;

// Use a more robust approach: find each "--bg-pattern": "..." and escape quotes inside
// The string literal ends at the closing " followed by , or }
let i = 0;
while (true) {
  const patternIdx = result.indexOf('"--bg-pattern": "', i);
  if (patternIdx === -1) break;
  
  // Find the end of this string literal
  let endIdx = patternIdx + '"--bg-pattern": "'.length;
  let inEscape = false;
  
  while (endIdx < result.length) {
    if (result[endIdx] === '\\' && !inEscape) {
      inEscape = true;
    } else if (result[endIdx] === '"' && !inEscape) {
      // Found the closing quote
      break;
    } else {
      inEscape = false;
    }
    endIdx++;
  }
  
  if (endIdx >= result.length) break;
  
  // Extract the value part
  const valueStart = patternIdx + '"--bg-pattern": "'.length;
  const value = result.slice(valueStart, endIdx);
  
  // Escape double quotes in the value
  const escapedValue = value.replace(/"/g, '\\"');
  
  // Reconstruct
  result = result.slice(0, valueStart) + escapedValue + result.slice(endIdx);
  
  i = endIdx + 1;
}

writeFileSync("src/lib/theme-presets.js", result);
console.log("Fixed bg-pattern escaping!");