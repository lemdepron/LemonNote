const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');
const pos = 73601;
console.log('Context at error:', content.substring(pos - 100, pos + 100));