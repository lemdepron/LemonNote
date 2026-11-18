import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/zh.json', 'utf8');
const idx = 20944; // third ink
console.log('Context around top-level ink:', content.substring(idx - 100, idx + 500));