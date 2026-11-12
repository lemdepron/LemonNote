const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json', 'utf8');

// Find the code section in vault
const vaultIdx = content.indexOf('"vault": {');
const vaultContent = content.slice(vaultIdx);
const codeIdx = vaultContent.indexOf('"code": {');
const codeSection = vaultContent.slice(codeIdx);
const codeEndIdx = codeSection.indexOf('"queries": {');
const codeObjStr = codeSection.slice(0, codeEndIdx - 1);

console.log('Code section length:', codeObjStr.length);
console.log('Code section ends with:', codeObjStr.slice(-50));

// Try to parse just the code object
try {
  const codeObj = JSON.parse('{' + codeObjStr + '}');
  console.log('Parsed code keys:', Object.keys(codeObj));
  console.log('newFile:', codeObj.newFile);
} catch(e) {
  console.log('Parse error:', e.message);
  // Find the error position
  const errorPos = e.message.match(/position (\d+)/);
  if(errorPos) {
    const pos = parseInt(errorPos[1]);
    console.log('Error near:', codeObjStr.slice(Math.max(0, pos-50), pos+50));
  }
}