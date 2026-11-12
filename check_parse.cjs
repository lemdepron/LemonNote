const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json', 'utf8');
const ru = JSON.parse(content);
console.log('vault.code keys:', Object.keys(ru.vault.code));
console.log('vault.code.newFile:', ru.vault.code.newFile);