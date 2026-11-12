const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json', 'utf8');

const vaultIdx = content.indexOf('"vault": {');
const vaultContent = content.slice(vaultIdx);

const secondCodeIdx = 12816;
console.log('Second code section context:');
console.log(vaultContent.slice(Math.max(0, secondCodeIdx - 100), secondCodeIdx + 500));