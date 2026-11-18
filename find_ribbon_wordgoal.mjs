import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/hi.json', 'utf8');
const ribbonStart = content.indexOf('  "ribbon": {');
let braceCount = 0;
let inString = false;
let escapeNext = false;

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
      console.log('Ribbon ends at:', i);
      console.log('Context after:', content.substring(i, i + 100));
      break;
    }
  }
  
  // Check for macros key inside ribbon
  if (braceCount === 1 && c === 'm' && content.substring(i, i + 7) === '"macros"') {
    console.log('Found macros at:', i);
    console.log('Context:', content.substring(i - 20, i + 50));
  }
}