import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/zh.json', 'utf8');
console.log('File length:', content.length);
console.log('Last 200 chars:', content.substring(content.length - 200));