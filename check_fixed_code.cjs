const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json.fixed', 'utf8');

const vaultIdx = content.indexOf('"vault": {');
const vaultContent = content.slice(vaultIdx, content.indexOf('}', content.indexOf('"vault": {')) + 1);

// Find the code section
const codeIdx = content.indexOf('"code": {');
console.log('codeIdx:', codeIdx);
if(codeIdx >= 0) {
  console.log('Context:', content.slice(codeIdx - 50, codeIdx + 200));
}