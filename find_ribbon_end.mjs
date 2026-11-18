import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/hi.json', 'utf8');
const ribbonStart = content.indexOf('  "ribbon": {');
console.log('Ribbon starts at:', ribbonStart);

let braceCount = 0;
let inString = false;
let escapeNext = false;
let ribbonEnd = -1;

for (let i = ribbonStart; i < content.length; i++) {
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
      ribbonEnd = i;
      break;
    }
  }
}

console.log('Ribbon ends at:', ribbonEnd);
console.log('Context:', content.substring(ribbonEnd - 50, ribbonEnd + 100));