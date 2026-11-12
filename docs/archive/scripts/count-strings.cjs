const fs = require('fs');
const path = require('path');

function findHardcodedStrings(dir) {
  const files = fs.readdirSync(dir);
  let results = [];
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(findHardcodedStrings(fullPath));
    } else if (file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const patterns = [
        /label=['"]([^'"]{3,})['"]/g,
        /hint=['"]([^'"]{3,})['"]/g,
        /placeholder=['"]([^'"]{3,})['"]/g,
        /aria-label=['"]([^'"]{3,})['"]/g,
        /title=['"]([^'"]{3,})['"]/g,
        /toast\.(success|error|info|warn)\(['"]([^'"]{3,})['"]/g
      ];
      
      let count = 0;
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const str = match[1] || match[2];
          if (str && str.length > 2 && !str.includes('${') && !str.includes('{') && !str.includes('t(') && !str.includes('tr(')) {
            count++;
          }
        }
      }
      results.push({ file: fullPath.replace('C:\\Users\\halaf\\projects\\LemonNote\\', ''), count });
    }
  }
  return results;
}

const results = findHardcodedStrings('C:\\Users\\halaf\\projects\\LemonNote\\src\\components');
results.sort((a, b) => b.count - a.count);
console.log('=== COMPONENTS ===');
for (const r of results) {
  if (r.count > 5) console.log(r.file, ':', r.count);
}

console.log('---');

const results2 = findHardcodedStrings('C:\\Users\\halaf\\projects\\LemonNote\\src\\pages');
results2.sort((a, b) => b.count - a.count);
console.log('=== PAGES ===');
for (const r of results2) {
  if (r.count > 5) console.log(r.file, ':', r.count);
}