const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json', 'utf8');

// Extract the vault.code section and parse it
const vaultIdx = content.indexOf('"vault": {');
const vaultContent = content.slice(vaultIdx);
const codeIdx = vaultContent.indexOf('"code": {');
const codeSection = vaultContent.slice(codeIdx, vaultContent.indexOf('"queries": {') - 1);

// Find the newFile key position in the code section
const nfIdx = codeSection.indexOf('"newFile"');
console.log('newFile at index:', nfIdx);

// Check the characters around newFile
const before = codeSection.slice(Math.max(0, nfIdx - 50), nfIdx);
const after = codeSection.slice(nfIdx, nfIdx + 50);
console.log('Before:', JSON.stringify(before));
console.log('After:', JSON.stringify(after));

// Check character codes
const keyStart = codeSection.indexOf('"', nfIdx);
const keyEnd = codeSection.indexOf('"', keyStart + 1);
const key = codeSection.slice(keyStart + 1, keyEnd);
console.log('Key:', key, 'length:', key.length);
console.log('Key char codes:', [...key].map(c => c.charCodeAt(0)));