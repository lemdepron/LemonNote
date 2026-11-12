const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json', 'utf8');

const vaultIdx = content.indexOf('"vault": {');
const vaultContent = content.slice(vaultIdx);

const secondCodeIdx = 12816;
const secondCodeStart = secondCodeIdx + vaultIdx;

// Find the end of the second code object by counting braces
let braceCount = 0;
let inString = false;
let escapeNext = false;
let codeEnd = -1;

for(let i = secondCodeStart; i < content.length; i++) {
  const c = content[i];
  
  if(escapeNext) {
    escapeNext = false;
    continue;
  }
  
  if(c === '\\') {
    escapeNext = true;
    continue;
  }
  
  if(c === '"' && !escapeNext) {
    inString = !inString;
    continue;
  }
  
  if(!inString) {
    if(c === '{') braceCount++;
    else if(c === '}') {
      braceCount--;
      if(braceCount === 0) {
        codeEnd = i;
        break;
      }
    }
  }
}

console.log('Second code object ends at absolute index:', codeEnd);
console.log('Context around end:', content.slice(codeEnd - 50, codeEnd + 50));