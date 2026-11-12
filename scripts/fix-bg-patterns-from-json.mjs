// Fix bg-pattern values using JSON data
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");
const fixes = JSON.parse(readFileSync("scripts/bg-pattern-fixes.json", "utf8"));

let result = source;

for (const fix of fixes.fixes) {
  const count = (result.match(new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  if (count > 0) {
    result = result.split(fix.search).join(fix.replace);
    console.log(`Fixed ${count} occurrence(s)`);
  } else {
    console.warn(`Pattern not found: ${fix.search.substring(0, 80)}...`);
  }
}

writeFileSync("src/lib/theme-presets.js", result);
console.log("Fixed specific bg-pattern values!");