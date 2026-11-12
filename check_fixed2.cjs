const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json.fixed', 'utf8');

try {
  const ru = JSON.parse(content);
  console.log('vault.code.newFile:', ru.vault?.code?.newFile);
  console.log('vault.code keys:', Object.keys(ru.vault.code));
  console.log('vault.code hasOwnProperty newFile:', ru.vault.code?.hasOwnProperty('newFile'));
  
  // Check how many "code" keys in vault
  const vaultKeys = Object.keys(ru.vault);
  console.log('vault keys:', vaultKeys);
  const codeKeys = vaultKeys.filter(k => k === 'code');
  console.log('code keys count:', codeKeys.length);
} catch(e) {
  console.log('Parse error:', e.message);
}