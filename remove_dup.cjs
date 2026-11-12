const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json', 'utf8');

const vaultIdx = content.indexOf('"vault": {');
const secondCodeStart = 12816 + vaultIdx;
const codeEnd = 69756;

console.log('vaultIdx:', vaultIdx);
console.log('secondCodeStart:', secondCodeStart);
console.log('codeEnd:', codeEnd);

const beforeSecond = content.slice(secondCodeStart - 100, secondCodeStart);
console.log('Before second code:', beforeSecond);

const afterSecond = content.slice(codeEnd, codeEnd + 50);
console.log('After second code:', afterSecond);

const newContent = content.slice(0, secondCodeStart) + content.slice(codeEnd + 1);

console.log('New content length:', newContent.length);
console.log('Original length:', content.length);

try {
  JSON.parse(newContent);
  console.log('New content parses OK');
  
  const ru = JSON.parse(newContent);
  console.log('vault.code.newFile:', ru.vault?.code?.newFile);
  console.log('vault.code keys:', Object.keys(ru.vault.code));
} catch(e) {
  console.log('Parse error:', e.message);
}