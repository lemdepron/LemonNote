const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json', 'utf8');
const idx = content.indexOf('"code": {');
console.log('code index:', idx);
if(idx >= 0) console.log(content.slice(idx, idx+1000));