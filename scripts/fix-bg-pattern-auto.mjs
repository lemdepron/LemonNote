// Simple fix: escape double quotes in --bg-pattern values
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// Fix the pattern: "--bg-pattern": "url("data:..."
// The issue is unescaped double quotes in the URL string
// We need to escape the inner double quotes

let result = source;

// Pattern: "--bg-pattern": "url("data:..."
// Find and fix: the inner double quotes in the URL need to be escaped
// The pattern is: "--bg-pattern": "url("data:..."
// We need to replace the first " after url( with \"

let i = 0;
while (true) {
  const idx = result.indexOf('--bg-pattern": "url("data:', i);
  if (idx === -1) break;
  
  // Find the end of this string value (next comma or } at same level)
  // The string starts at idx, find the closing quote that ends the value
  let inString = false;
  let escapeNext = false;
  let endIdx = -1;
  
  for (let j = idx; j < result.length; j++) {
    const char = result[j];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    if (char === '"' && !inString) {
      inString = true;
    } else if (char === '"' && inString) {
      // Check if this is the end of the bg-pattern value
      // Look ahead for comma or }
      let k = j + 1;
      while (k < result.length && /\s/.test(result[k])) k++;
      if (k < result.length && (result[k] === ',' || result[k] === '}')) {
        endIdx = j;
        break;
      }
      inString = false;
    }
  }
  
  if (endIdx === -1) {
    i = idx + 1;
    continue;
  }
  
  // Now we have the full string value from idx to endIdx
  const value = result.substring(idx, endIdx + 1);
  
  // Fix the inner quotes in the URL part
  // The pattern is: "--bg-pattern": "url("data:... "
  // We need to escape the double quotes inside the URL
  let fixedValue = value.replace(/url\("data:/g, 'url(\\"data:');
  
  // Also need to handle the duplicated/concatenated strings that have %3Csvg...%3C/svg%3E")",%3Csvg...
  // The duplicated part starts after the first %3C/svg%3E
  fixedValue = fixedValue.replace(/%3C\/svg%3E"\)",%3Csvg/g, '%3C/svg%3E\\")",');
  
  result = result.slice(0, idx) + fixedValue + result.slice(idx + value.length);
  
  console.log("Fixed one bg-pattern at index", idx);
  
  i = idx + fixedValue.length;
}

writeFileSync("src/lib/theme-presets.js", result);
console.log("Fixed all bg-pattern values!");