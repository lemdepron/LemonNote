import { readFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

const startIdx = source.indexOf('const FRUIT_THEMES = [');
let bracketCount = 0;
let endIdx = -1;
for (let i = startIdx; i < source.length; i++) {
  if (source[i] === '[') bracketCount++;
  else if (source[i] === ']') {
    bracketCount--;
    if (bracketCount === 0) {
      endIdx = i;
      break;
    }
  }
}

const arrStr = source.slice(startIdx, endIdx + 1);

// Look for the first object
const firstObjStart = arrStr.indexOf('{');
const firstObjEnd = arrStr.indexOf('},') + 1;
console.log('First object:');
console.log(arrStr.slice(firstObjStart, firstObjEnd + 500));