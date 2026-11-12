const fs = require('fs');
const en = JSON.parse(fs.readFileSync('src/lib/locales/en.json', 'utf8'));
const ur = JSON.parse(fs.readFileSync('src/lib/locales/ur.json', 'utf8'));

console.log('=== ENGLISH ROOT KEYS ===');
console.log(Object.keys(en).sort().join(', '));

console.log('\n=== URDU ROOT KEYS ===');
console.log(Object.keys(ur).sort().join(', '));

console.log('\n=== KEYS IN EN BUT NOT IN UR ===');
Object.keys(en).forEach(k => {
  if (!ur.hasOwnProperty(k)) console.log('  MISSING:', k);
});

console.log('\n=== KEYS IN UR BUT NOT IN EN ===');
Object.keys(ur).forEach(k => {
  if (!en.hasOwnProperty(k)) console.log('  EXTRA:', k);
});

// Check vault structure
console.log('\n=== VAULT SUBKEYS IN EN ===');
if (en.vault) console.log(Object.keys(en.vault).sort().join(', '));

console.log('\n=== VAULT SUBKEYS IN UR ===');
if (ur.vault) console.log(Object.keys(ur.vault).sort().join(', '));