const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json', 'utf8');
const idx = content.indexOf('"vault": {');
const vaultContent = content.slice(idx);
const codeIdx = vaultContent.indexOf('"code": {');
console.log('vault.code index:', codeIdx);
if(codeIdx >= 0) console.log(vaultContent.slice(codeIdx, codeIdx+1000));