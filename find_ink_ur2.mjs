import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');
const idx2 = 16944;
// Find the end of this ink object
let braceCount = 0;
let inString = false;
let escapeNext = false;
let endPos = -1;

for (let i = idx2; i < content.length; i++) {
  const c = content[i];
  
  if (escapeNext) {
    escapeNext = false;
    continue;
  }
  
  if (c === '\\') {
    escapeNext = true;
    continue;
  }
  
  if (c === '"' && !escapeNext) {
    inString = !inString;
    continue;
  }
  
  if (inString) continue;
  
  if (c === '{') braceCount++;
  if (c === '}') {
    braceCount--;
    if (braceCount === 0) {
      endPos = i;
      break;
    }
  }
}

console.log('End position:', endPos);
console.log('Length:', endPos - idx2 + 1);
console.log('Object:', content.substring(idx2, endPos + 1));