import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');
console.log('Error context:', content.substring(89000, 89450));