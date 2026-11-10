const fs = require('fs');
const path = require('path');

function findFiles(dir, pattern = /\.jsx$/) {
  const results = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...findFiles(fullPath, pattern));
    } else if (pattern.test(item)) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = findFiles('C:\\Users\\halaf\\projects\\LemonNote\\src');
let total = 0;
const details = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /(ml-|mr-|pl-|pr-|left-|right-|text-left|text-right|border-l|border-r|ml |mr |pr |pl |border-l |border-r )/g;
  const matches = content.match(regex);
  if (matches) {
    total += matches.length;
    details.push({ 
      file: file.replace('C:\\Users\\halaf\\projects\\LemonNote\\', ''), 
      count: matches.length, 
      matches: [...new Set(matches)] 
    });
  }
}

details.sort((a,b) => b.count - a.count);
console.log('Total:', total);
for (const d of details) {
  console.log(d.file, ':', d.count, d.matches.join(', '));
}