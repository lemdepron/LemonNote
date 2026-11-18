const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/zh.json', 'utf8');
const insertStart = content.indexOf('  "insert": {');
console.log('Top-level insert at:', insertStart);
console.log('Context:', content.substring(insertStart - 200, insertStart + 100));