import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/zh.json', 'utf8');
const idx = content.indexOf('"ink": {');
console.log('First ink at:', idx);
console.log('Context:', content.substring(idx - 50, idx + 200));