const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json.fixed', 'utf8');

const vaultIdx = content.indexOf('"vault": {');
const vaultContent = content.slice(vaultIdx);

const codeIdx = vaultContent.indexOf('"code": {');
console.log('codeIdx in vaultContent:', codeIdx);

// Show context around the code section
const start = Math.max(0, codeIdx - 100);
const end = codeIdx + 500;
console.log('Context:');
console.log(vaultContent.slice(start, end));