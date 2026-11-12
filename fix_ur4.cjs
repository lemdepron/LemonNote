const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');

const taggedPos = content.indexOf('"tagged": "ٹےگڈ #{tag}"');
console.log('taggedPos:', taggedPos);

const commonPos = content.indexOf('"common": {');
console.log('commonPos:', commonPos);

// Show from tagged to common
console.log('Between tagged and common:', content.substring(taggedPos, commonPos));