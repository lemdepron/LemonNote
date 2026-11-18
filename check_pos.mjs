import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/zh.json', 'utf8');
console.log('Char at 36670:', JSON.stringify(content[36670]));
console.log('Char at 36671:', JSON.stringify(content[36671]));
console.log('Char at 36672:', JSON.stringify(content[36672]));
console.log('Char at 36673:', JSON.stringify(content[36673]));
console.log('Char at 36674:', JSON.stringify(content[36674]));
console.log('Char at 36675:', JSON.stringify(content[36675]));
console.log('Context:', content.substring(36660, 36700));