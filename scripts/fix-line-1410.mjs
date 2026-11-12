import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");
const lines = source.split('\n');

// Remove the extra line at index 1409 (line 1410 in 1-based)
// Line 1409 (0-based) is the extra "}," line
if (lines[1409].trim() === '},' && lines[1408].trim() === '},' && lines[1410].trim() === '];') {
  lines.splice(1409, 1);
  writeFileSync("src/lib/theme-presets.js", lines.join('\n'));
  console.log("Fixed line 1410!");
} else {
  console.log("Pattern not as expected");
  console.log("Line 1408:", JSON.stringify(lines[1408]));
  console.log("Line 1409:", JSON.stringify(lines[1409]));
  console.log("Line 1410:", JSON.stringify(lines[1410]));
  console.log("Line 1411:", JSON.stringify(lines[1410]));
}