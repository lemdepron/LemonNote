const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json.fixed', 'utf8');

const vaultIdx = content.indexOf('"vault": {');
let braceCount = 0;
let vaultEnd = -1;
for(let i = vaultIdx; i < content.length; i++) {
  if(content[i] === '{') braceCount++;
  else if(content[i] === '}') {
    braceCount--;
    if(braceCount === 0) {
      vaultEnd = i;
      break;
    }
  }
}

const vaultStr = content.slice(vaultIdx, vaultEnd + 1);

// Find the code section
const codeIdx = vaultStr.indexOf('"code": {');
console.log('codeIdx:', codeIdx);

// Show 200 chars before and 500 after
const start = Math.max(0, codeIdx - 200);
const end = codeIdx + 800;
const context = vaultStr.slice(start, end);
console.log('---CONTEXT START---');
console.log(context);
console.log('---CONTEXT END---');

// Check for any non-ASCII or special characters
const codeSection = vaultStr.slice(codeIdx, codeIdx + 500);
console.log('---CODE SECTION RAW---');
for(let i = 0; i < codeSection.length; i++) {
  const c = codeSection[i];
  const code = c.charCodeAt(0);
  if(code > 127 || code < 32) {
    console.log(`Pos ${i}: char='${c}' code=${code} hex=0x${code.toString(16)}`);
  }
}