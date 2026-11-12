// Fix all bg-pattern escaping issues
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// Fix all --bg-pattern values that have unescaped quotes
// The pattern is: "--bg-pattern": "url("data:..."
// Should be: "--bg-pattern": "url(\"data:...\)

let result = source;

// Fix all occurrences of the pattern
// Pattern: "--bg-pattern": "url("data:..."
// Replace with: "--bg-pattern": "url(\"data:...\)

// More precise pattern: find lines with --bg-pattern that have unescaped quotes in the URL
result = result.replace(
  /("--bg-pattern":\s*")url\("([^"]+)"/g,
  '$1url("\\"$2"'
);

writeFileSync("src/lib/theme-presets.js", result);
console.log("Fixed bg-pattern escaping!");