import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/zh.json', 'utf8');

// Find ribbon start
const ribbonStart = content.indexOf('  "ribbon": {');
console.log('Ribbon starts at:', ribbonStart);

// Find the matching closing brace for ribbon
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
  
  if (c === '\\\\') {
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
console.log('Ribbon end context:', content.substring(ribbonEnd - 50, ribbonEnd + 50));