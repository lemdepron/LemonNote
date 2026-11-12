const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');

const aiEnd = content.indexOf('"ai": {');
const backupStart = content.indexOf('"backup": {');
console.log('aiEnd:', aiEnd);
console.log('backupStart:', backupStart);
console.log('Between:', content.substring(aiEnd, backupStart));