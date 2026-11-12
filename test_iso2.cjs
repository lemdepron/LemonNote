const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json', 'utf8');

const vaultIdx = content.indexOf('"vault": {');
const vaultContent = content.slice(vaultIdx);
const codeIdx = vaultContent.indexOf('"code": {');
const codeSection = vaultContent.slice(codeIdx);
const queriesIdx = codeSection.indexOf('"queries": {');
const codeObjStr = codeSection.slice(0, queriesIdx).trim();

const cleaned = codeObjStr.endsWith(',') ? codeObjStr.slice(0, -1) : codeObjStr;

console.log('Code object string length:', cleaned.length);
console.log('Starts with:', cleaned.slice(0, 20));
console.log('Ends with:', cleaned.slice(-20));

// Wrap in braces to make valid JSON
const wrapped = '{' + cleaned + '}';

try {
  const codeObj = JSON.parse(wrapped);
  console.log('Parsed successfully!');
  console.log('Keys:', Object.keys(codeObj));
  console.log('newFile:', codeObj.newFile);
} catch(e) {
  console.log('Parse error:', e.message);
  const posMatch = e.message.match(/position (\d+)/);
  if(posMatch) {
    const pos = parseInt(posMatch[1]);
    console.log('Error at position:', pos);
    console.log('Context:', wrapped.slice(Math.max(0, pos-50), pos+50));
  }
}