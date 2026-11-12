const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json.fixed', 'utf8');

const vaultIdx = content.indexOf('"vault": {');
console.log('vaultIdx in fixed:', vaultIdx);

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
console.log('Vault ends at:', vaultEnd);
console.log('Vault content length:', vaultEnd - vaultIdx + 1);

const vaultContent = content.slice(vaultIdx, vaultEnd + 1);

let count = 0;
let idx = vaultContent.indexOf('"code": {');
while(idx >= 0) {
  count++;
  console.log('Found "code": { at vaultContent index:', idx);
  idx = vaultContent.indexOf('"code": {', idx + 1);
}
console.log('Total occurrences in vault:', count);