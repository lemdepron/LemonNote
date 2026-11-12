const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json', 'utf8');

const vaultIdx = content.indexOf('"vault": {');
console.log('vaultIdx:', vaultIdx);
console.log('Content length:', content.length);

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
console.log('Vault ends at absolute index:', vaultEnd);
console.log('Vault content length:', vaultEnd - vaultIdx + 1);
console.log('Remaining content after vault:', content.length - vaultEnd - 1);