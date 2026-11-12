const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json', 'utf8');

const vaultIdx = content.indexOf('"vault": {');
const secondCodeStart = 12816 + vaultIdx;
const codeEnd = 69756;

const beforeSecond = content.slice(secondCodeStart - 200, secondCodeStart);
console.log('Before second code (200 chars):');
console.log(beforeSecond);

console.log('---');

const afterSecond = content.slice(codeEnd, codeEnd + 100);
console.log('After second code (100 chars):');
console.log(afterSecond);