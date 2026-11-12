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

const vaultStr = '{' + content.slice(vaultIdx, vaultEnd + 1) + '}';

// Use a reviver to track all keys
const allKeys = [];
const obj = JSON.parse(vaultStr, (key, value) => {
  if (key) console.log('Key:', key, 'Path: vault');
  return value;
});

console.log('Has code:', 'code' in obj.vault);
if(obj.vault.code) {
  console.log('code.newFile:', obj.vault.code.newFile);
}