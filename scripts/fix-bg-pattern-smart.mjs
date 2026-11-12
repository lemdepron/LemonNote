// Robust fix: parse the file and fix all --bg-pattern values properly
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

let result = source;

// Find all --bg-pattern occurrences and fix them
// We'll scan through the file and when we find a --bg-pattern property,
// we'll extract the full string value and fix it properly.

let i = 0;
let fixedCount = 0;

while (true) {
  const idx = result.indexOf('--bg-pattern": "url(');
  if (idx === -1) break;
  
  // Find the start of the string value (the opening quote after url()
  const urlStart = result.indexOf('url("', idx);
  if (urlStart === -1) break;
  
  // Find the end of this string value - look for the closing quote that's followed by comma or }
  // We need to properly parse the string considering escaped quotes
  let inString = false;
  let escapeNext = false;
  let stringEnd = -1;
  let inUrlString = false;
  
  for (let j = urlStart + 4; j < result.length; j++) { // skip 'url("'
    const char = result[j];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    if (char === '"' && !inUrlString) {
      inUrlString = true;
    } else if (char === '"' && inUrlString) {
      // This might be the end of the URL string
      // Check if next non-whitespace is comma or }
      let k = j + 1;
      while (k < result.length && /\s/.test(result[k])) k++;
      if (k < result.length && (result[k] === ',' || result[k] === '}')) {
        // This is the end of the bg-pattern value
        const valueStart = idx + '--bg-pattern": "'.length;
        const valueEnd = j + 1; // include the closing quote
        
        const fullValue = result.substring(idx, j + 1);
        
        // Fix the value:
        // 1. Escape inner double quotes in the URL part
        // 2. Remove duplicated content after the first closing SVG tag
        let fixedValue = result.substring(idx, valueEnd);
        
        // Fix: escape inner double quotes in the url() part
        let fixed = fixedValue.replace(/url\("data:/g, 'url(\\"data:');
        
        // Fix duplicated content: %3C/svg%3E")",%3Csvg... -> %3C/svg%3E\\")",
        fixed = fixed.replace(/%3C\/svg%3E"\)",%3Csvg/g, '%3C/svg%3E\\")",');
        
        // Also fix cases where there's a concatenation like '")",%3Csvg...'
        fixed = fixed.replace(/%3C\/svg%3E"\)",%3Csvg/g, '%3C/svg%3E\\")",');
        
        // Replace in result
        result = result.slice(0, idx) + fixed + result.slice(idx + (j + 1 - idx));
        console.log("Fixed bg-pattern at index", idx);
        break;
      }
    }
  }
  
  // Move past this occurrence to avoid infinite loop
  const nextIdx = result.indexOf('--bg-pattern": "url(', idx + 1);
  if (nextIdx === -1 || nextIdx <= idx) break;
}

writeFileSync("src/lib/theme-presets.js", result);
console.log("Fixed all bg-pattern values!");