const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json', 'utf8');

const vaultIdx = content.indexOf('"vault": {');
const vaultContent = content.slice(vaultIdx);

let count = 0;
let idx = vaultContent.indexOf('"code": {');
while(idx >= 0) {
  count++;
  console.log('Found "code": { at vaultContent index:', idx);
  idx = vaultContent.indexOf('"code": {', idx + 1);
}
console.log('Total occurrences in vault:', count);

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
console.log('Vault object ends at:', vaultEnd);

const vaultObjStr = content.slice(vaultIdx, vaultEnd + 1);
const codeMatches = vaultObjStr.match(/"code":/g);
console.log('"code": occurrences in vault:', codeMatches ? codeMatches.length : 0);