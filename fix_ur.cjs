const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');

// Find the position of 'tagged' key
const taggedPos = content.indexOf('"tagged": "ٹےگڈ #{tag}"');
if (taggedPos === -1) {
  console.log('tagged not found');
  process.exit(1);
}

// Find the second 'common' (the one after duplicates)
const firstCommonPos = content.indexOf('"common": {');
const secondCommonPos = content.indexOf('"common": {', firstCommonPos + 1);
if (secondCommonPos === -1) {
  console.log('second common not found');
  process.exit(1);
}

// The duplicates are between tagged and second common
// Include the comma after tagged
const taggedEnd = taggedPos + '"tagged": "ٹےگڈ #{tag}"'.length;
const beforeDuplicates = content.substring(0, taggedEnd);
const afterDuplicates = content.substring(secondCommonPos - 2); // -2 to include the newline and indentation before common

const newContent = beforeDuplicates + ',\n  ' + afterDuplicates;
fs.writeFileSync('src/lib/locales/ur.json', newContent);
console.log('Done');