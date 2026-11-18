import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/zh.json', 'utf8');
const idx = content.indexOf('"wordGoal": {', 36600);
console.log('wordGoal at:', idx);
console.log('Context after:', content.substring(idx, idx + 500));