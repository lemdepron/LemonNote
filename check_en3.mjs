import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/en.json', 'utf8');
const en = JSON.parse(content);
console.log('en.pdf:', en.pdf);
console.log('en.settings:', en.settings);