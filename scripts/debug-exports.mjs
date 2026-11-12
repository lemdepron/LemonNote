import { readFileSync } from "node:fs";

const source = readFileSync("scripts/generate-theme-presets.mjs", "utf8");
const marker = "// Build exports";
const start = source.indexOf(marker);
console.log("Start:", start);

let inTemplate = false;
let backtickCount = 0;

for (let i = start; i < start + 2000; i++) {
  if (source[i] === '`') {
    if (!inTemplate) {
      inTemplate = true;
    } else {
      inTemplate = false;
    }
    backtickCount++;
    if (backtickCount === 2) {
      let j = i + 1;
      while (j < source.length && /\s/.test(source[j])) j++;
      if (source[j] === ';') {
        console.log("End found at:", j + 1);
        console.log("Context:", JSON.stringify(source.substring(j - 50, j + 20)));
        break;
      }
    }
  }
  if (source[i] === "`") inTemplate = !inTemplate;
}