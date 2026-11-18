import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');
console.log('Last 200 chars:', content.substring(content.length - 200));