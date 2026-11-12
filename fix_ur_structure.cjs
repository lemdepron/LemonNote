const fs = require('fs');
const ur = JSON.parse(fs.readFileSync('src/lib/locales/ur.json', 'utf8'));

// Move nested sections from vault to root
if (ur.vault) {
  // ai
  if (ur.vault.ai) {
    ur.ai = ur.vault.ai;
    delete ur.vault.ai;
  }
  // backup
  if (ur.vault.backup) {
    ur.backup = ur.vault.backup;
    delete ur.vault.backup;
  }
  // common
  if (ur.vault.common) {
    ur.common = ur.vault.common;
    delete ur.vault.common;
  }
  // findTags
  if (ur.vault.findTags) {
    ur.findTags = ur.vault.findTags;
    delete ur.vault.findTags;
  }
  // search (keep vault.search if it exists, but also add root search)
  if (ur.vault.search) {
    ur.search = ur.vault.search;
    delete ur.vault.search;
  }
}

// Ensure correct key ordering (match English)
const keyOrder = ['rail', 'header', 'ribbon', 'fileMenu', 'dir', 'digits', 'lang', 'settings', 'ai', 'backup', 'common', 'findTags', 'search', 'vault'];
const reordered = {};
keyOrder.forEach(k => {
  if (ur.hasOwnProperty(k)) reordered[k] = ur[k];
});
// Add any remaining keys not in order
Object.keys(ur).forEach(k => {
  if (!reordered.hasOwnProperty(k)) reordered[k] = ur[k];
});

fs.writeFileSync('src/lib/locales/ur.json', JSON.stringify(reordered, null, 2) + '\n');
console.log('Fixed structure');
console.log('New root keys:', Object.keys(reordered).join(', '));