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
const cleanStr = arrStr.replace(/\/\/.*$/gm, '');

// Simpler regex - just find all { id: "..." } patterns
const simpleRegex = /id:\s*"([^"]+)"/g;
let match;
while ((match = simpleRegex.exec(cleanStr)) !== null) {
  console.log('Found id:', match[1]);
}

// Now try the full regex on a smaller piece
const firstObjEnd = cleanStr.indexOf('},') + 1;
const testStr = cleanStr.slice(0, firstObjEnd + 2000);
console.log('\nTest string (first 2000 chars after first obj):');
console.log(testStr.slice(0, 2000));

const objRegex = /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*surface:\s*"([^"]+)",\s*light:\s*\{([\s\S]*?)\},\s*dark:\s*\{([\s\S]*?)\}\s*\}/;
const testMatch = objRegex.exec(testStr);
if (testMatch) {
  console.log('\nFull regex matched!');
  console.log('id:', testMatch[1]);
  console.log('name:', testMatch[2]);
  console.log('surface:', testMatch[3]);
  console.log('light length:', testMatch[4].length);
  console.log('dark length:', testMatch[5].length);
} else {
  console.log('\nFull regex did NOT match');
  // Debug: find where it fails
  const partialRegex = /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*surface:\s*"([^"]+)"/;
  const partialMatch = partialRegex.exec(testStr);
  if (partialMatch) {
    console.log('Partial match (id,name,surface):', partialMatch[1], partialMatch[2], partialMatch[3]);
    const afterSurface = testStr.slice(partialMatch.index + partialMatch[0].length);
    console.log('After surface (200 chars):', afterSurface.slice(0, 200));
  }
}