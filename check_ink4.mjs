import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/zh.json', 'utf8');
// Find the end of the top-level ink object
const idx = content.indexOf('"ink": {', 20000);
// Find the next top-level key after ink
const idx2 = content.indexOf('"insert": {', idx);
console.log('Insert after ink at:', idx2);
console.log('Context:', content.substring(idx2 - 200, idx2 + 200));