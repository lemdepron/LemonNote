import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/hi.json', 'utf8');
const ribbonStart = content.indexOf('  "ribbon": {');
console.log('Ribbon starts at:', ribbonStart);

let braceCount = 0;
let inString = false;
let escapeNext = false;
let keys = [];

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
      break;
    }
  }
  
  // Track keys at braceCount 1 (top-level keys inside ribbon)
  if (braceCount === 1 && c === '"') {
    // Look for the next quote to get the key
    let key = '';
    let j = i + 1;
    while (j < content.length && content[j] !== '"') {
      key += content[j];
      j++;
    }
    if (key && !keys.includes(key)) {
      keys.push(key);
    }
  }
}

console.log('Top-level keys in ribbon:', keys);