const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json', 'utf8');

// Find all occurrences of "newFile" in the file
const matches = [];
let idx = content.indexOf('"newFile"');
while(idx >= 0) {
  matches.push(idx);
  idx = content.indexOf('"newFile"', idx + 1);
}
console.log('newFile occurrences:', matches.length);
matches.forEach(m => {
  console.log('  at', m, ':', content.slice(Math.max(0, m-30), m+30));
});

// Also check for "newFile" in the vault.code section specifically
const vaultIdx = content.indexOf('"vault": {');
const vaultContent = content.slice(vaultIdx);
const codeIdx = vaultContent.indexOf('"code": {');
const codeSection = vaultContent.slice(codeIdx, vaultContent.indexOf('"queries": {'));

const newFileMatches = [];
let nfIdx = codeSection.indexOf('"newFile"');
while(nfIdx >= 0) {
  newFileMatches.push(nfIdx);
  nfIdx = codeSection.indexOf('"newFile"', nfIdx + 1);
}
console.log('newFile in vault.code:', newFileMatches.length);
newFileMatches.forEach(m => {
  console.log('  at', m, ':', codeSection.slice(Math.max(0, m-30), m+30));
});