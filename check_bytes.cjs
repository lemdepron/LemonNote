const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');
const pos = 73601;
// Show raw bytes
for (let i = pos - 50; i < pos + 50; i++) {
  const c = content[i];
  const code = content.charCodeAt(i);
  console.log(`${i}: '${c}' (${code})`);
}