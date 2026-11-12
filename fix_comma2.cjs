const fs = require('fs');
let content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');

// Find "shortcuts": { ... }, followed by "backup": { without comma
const pattern = /("shortcuts": \{[\s\S]*?\n    \}),\n    "backup": \{/;
const match = content.match(pattern);
if (match) {
  console.log('Found pattern');
  // Add comma after the closing brace of shortcuts
  content = content.replace(pattern, '$1,\n    "backup": {');
  fs.writeFileSync('src/lib/locales/ur.json', content);
  console.log('Fixed comma');
} else {
  console.log('Pattern not found');
  // Try alternative
  const altPattern = /("shortcuts": \{[\s\S]*?\n    \})\n    "backup": \{/;
  const altMatch = content.match(altPattern);
  if (altMatch) {
    console.log('Found alt pattern');
    content = content.replace(altPattern, '$1,\n    "backup": {');
    fs.writeFileSync('src/lib/locales/ur.json', content);
    console.log('Fixed comma (alt)');
  } else {
    console.log('Alt pattern not found');
  }
}