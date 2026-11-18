import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');
const pos = 17407;
console.log(content.substring(pos, pos + 5000));