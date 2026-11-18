import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');
// Find all occurrences of "ink"
const matches = [];
let pos = 0;
while ((pos = content.indexOf('"ink":', pos)) !== -1) {
  matches.push(pos);
  pos++;
}
console.log('All "ink" positions:', matches);