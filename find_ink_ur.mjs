import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');
// Find the second ink (ribbon.ink)
const idx1 = content.indexOf('"ink": {');
const idx2 = content.indexOf('"ink": {', idx1 + 1);
console.log('First ink at:', idx1);
console.log('Second ink at:', idx2);
console.log('Context around second ink:', content.substring(idx2 - 50, idx2 + 500));