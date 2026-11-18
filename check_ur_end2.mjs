import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');
console.log('Last 300 chars:', content.substring(content.length - 300));