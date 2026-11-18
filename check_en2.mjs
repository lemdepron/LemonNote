import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/en.json', 'utf8');
const en = JSON.parse(content);
console.log('en.ribbon.ink:', Object.keys(en.ribbon.ink));
console.log('en.ribbon.ink.frames:', en.ribbon.ink.frames ? Object.keys(en.ribbon.ink.frames) : 'undefined');