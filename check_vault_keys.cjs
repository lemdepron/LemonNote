const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json.fixed', 'utf8');

const ru = JSON.parse(content);
console.log('ru keys:', Object.keys(ru));
console.log('ru.vault keys:', Object.keys(ru.vault));
console.log('ru.vault.code:', ru.vault.code);
console.log('ru.vault.hasOwnProperty("code"):', ru.vault.hasOwnProperty('code'));
console.log('"code" in ru.vault:', 'code' in ru.vault);