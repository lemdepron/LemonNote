const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');

const commonPos = content.indexOf('"common": {');
console.log('commonPos:', commonPos);

// Show 200 chars before common
console.log('Before common:', content.substring(commonPos - 200, commonPos));