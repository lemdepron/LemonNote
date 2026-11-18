import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/zh.json', 'utf8');
console.log('Error context:', content.substring(36600, 36750));