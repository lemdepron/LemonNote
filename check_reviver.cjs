const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json', 'utf8');

// Parse with a reviver to track all keys
const allKeys = [];
const ru = JSON.parse(content, (key, value) => {
  if (key) allKeys.push(key);
  return value;
});

console.log('Total keys:', allKeys.length);
const newFileKeys = allKeys.filter(k => k.includes('newFile'));
console.log('newFile keys:', newFileKeys);

// Check vault.code specifically
if (ru.vault && ru.vault.code) {
  console.log('vault.code own keys:', Object.getOwnPropertyNames(ru.vault.code));
  console.log('Has newFile:', 'newFile' in ru.vault.code);
  console.log('newFile value:', ru.vault.code.newFile);
}