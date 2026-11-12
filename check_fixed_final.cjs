const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json.fixed', 'utf8');

const ru = JSON.parse(content);
console.log('ru.vault.code:', ru.vault?.code ? 'exists' : 'missing');
if(ru.vault?.code) {
  console.log('keys:', Object.keys(ru.vault.code));
  console.log('newFile:', ru.vault.code.newFile);
  console.log('has newFile:', 'newFile' in ru.vault.code);
}