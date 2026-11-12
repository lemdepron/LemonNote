const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json.fixed', 'utf8');

try {
  const ru = JSON.parse(content);
  console.log('vault.code.newFile:', ru.vault?.code?.newFile);
  console.log('vault.code keys:', Object.keys(ru.vault.code));
  console.log('vault.code has newFile:', 'newFile' in ru.vault.code);
} catch(e) {
  console.log('Parse error:', e.message);
}