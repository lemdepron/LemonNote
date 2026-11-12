const fs = require('fs');
const path = require('path');

function scanDir(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', 'src-tauri', '.git', 'build'].includes(entry.name)) {
        scanDir(fullPath, files);
      }
    } else if (['.jsx', '.js'].includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

const pagesDir = 'src/pages';
const componentsDir = 'src/components';
const pagesFiles = scanDir(pagesDir).filter(f => f.includes('/pages/'));
const compFiles = scanDir(componentsDir).filter(f => f.includes('/components/'));

let totalFiles = 0;
let totalStrings = 0;
const results = {};

function checkFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  let count = 0;
  
  // Count placeholders
  const placeholders = content.match(/placeholder\s*=\s*["'][A-Za-z]{3,}["']/g) || [];
  count += placeholders.length;
  
  // Count aria-labels
  const ariaLabels = content.match(/aria-label\s*=\s*["'][A-Za-z]{3,}["']/g) || [];
  count += ariaLabels.length;
  
  // Count titles
  const titles = content.match(/title\s*=\s*["'][A-Za-z]{3,}["']/g) || [];
  count += titles.length;
  
  // Count toast messages
  const toasts = content.match(/toast\.(success|error|info|warning)\(\s*["'][A-Za-z]{3,}["']/g) || [];
  count += toasts.length;
  
  // Count JSX text
  const jsxText = content.match(/>[A-Z][a-z]{2,}</g) || [];
  count += jsxText.length;
  
  return count;
}

for (const file of pagesFiles) {
  const count = checkFile(file);
  if (count > 0) {
    results[file] = count;
    totalFiles++;
    totalStrings += count;
  }
}
for (const file of compFiles) {
  const count = checkFile(file);
  if (count > 0) {
    results[file] = count;
    totalFiles++;
    totalStrings += count;
  }
}

const sorted = Object.entries(results).sort((a, b) => b[1] - a[1]);
console.log('Total files with hard-coded English:', totalFiles);
console.log('Total hard-coded strings:', totalStrings);
console.log('');
console.log('Top 15 files:');
for (let i = 0; i < Math.min(15, sorted.length); i++) {
  console.log(`${i+1}. ${sorted[i][0]} (${sorted[i][1]} strings)`);
}