const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');

const firstCommonPos = content.indexOf('"common": {');
console.log('firstCommonPos:', firstCommonPos);

const secondCommonPos = content.indexOf('"common": {', firstCommonPos + 1);
console.log('secondCommonPos:', secondCommonPos);

if (secondCommonPos === -1) {
  let pos = content.indexOf('"common": {');
  let count = 0;
  while (pos !== -1) {
    console.log('Found at:', pos, 'context:', content.substring(pos, pos+50));
    pos = content.indexOf('"common": {', pos + 1);
    count++;
  }
  console.log('Total:', count);
}