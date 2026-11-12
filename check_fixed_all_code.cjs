const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json.fixed', 'utf8');

const vaultIdx = content.indexOf('"vault": {');
const vaultContent = content.slice(vaultIdx);

// Find all "code": { in vault content
let count = 0;
let idx = vaultContent.indexOf('"code": {');
while(idx >= 0) {
  count++;
  console.log('Found "code": { at vaultContent index:', idx);
  console.log('Context:', vaultContent.slice(Math.max(0, idx - 50), idx + 200));
  console.log('---');
  idx = vaultContent.indexOf('"code": {', idx + 1);
}
console.log('Total occurrences in vault:', count);