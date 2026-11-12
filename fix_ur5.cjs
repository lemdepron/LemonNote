const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');

const taggedPos = content.indexOf('"tagged": "ٹےگڈ #{tag}"');
const commonPos = content.indexOf('"common": {');

// Keep everything up to and including tagged
const before = content.substring(0, taggedPos + '"tagged": "ٹےگڈ #{tag}"'.length);

// Keep everything from common onwards
const after = content.substring(commonPos - 2); // -2 for the newline and 2-space indent before common

const newContent = before + ',\n  ' + after;
fs.writeFileSync('src/lib/locales/ur.json', newContent);
console.log('Done');