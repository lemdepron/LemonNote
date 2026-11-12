const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json', 'utf8');

// Parse without reviver
const ru = JSON.parse(content);

console.log('vault.code.newFile:', ru.vault?.code?.newFile);
console.log('vault.code hasOwnProperty newFile:', ru.vault.code?.hasOwnProperty('newFile'));
console.log('vault.code keys:', Object.keys(ru.vault.code));

// Check the prototype chain
console.log('vault.code prototype:', Object.getPrototypeOf(ru.vault.code));