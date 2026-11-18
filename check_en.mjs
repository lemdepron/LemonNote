import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/en.json', 'utf8');
const en = JSON.parse(content);
console.log('en.ink:', Object.keys(en.ink));
console.log('en.ink.frames:', en.ink.frames ? Object.keys(en.ink.frames) : 'undefined');