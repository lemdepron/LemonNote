import { readFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

const startIdx = source.indexOf('const FRUIT_THEMES = [');
console.log('startIdx:', startIdx);

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
console.log('endIdx:', endIdx);

if (endIdx !== -1) {
  const arrStr = source.slice(startIdx, endIdx + 1);
  console.log('Array length:', arrStr.length);

  // Test the regex
  const objRegex = /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*surface:\s*"([^"]+)",\s*light:\s*\{([\s\S]*?)\},\s*dark:\s*\{([\s\S]*?)\}\s*\}/g;
  let match;
  while ((match = objRegex.exec(arrStr)) !== null) {
    console.log('Found:', match[1], match[2], match[3]);
  }
}