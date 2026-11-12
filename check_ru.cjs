const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json', 'utf8');
const idx = content.indexOf('"vault": {');
console.log('index:', idx);
if(idx >= 0) console.log(content.slice(idx, idx+2000));