const fs = require('fs');
let content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');

// Add missing closing brace for root object
content = content.trimEnd() + '\n}';
fs.writeFileSync('src/lib/locales/ur.json', content);
console.log('Added closing brace');