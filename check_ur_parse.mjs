import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');

// Try to find the problematic character
for (let i = 90870; i < 90900; i++) {
  console.log(`Position ${i}: '${content[i]}' (${content.charCodeAt(i)})`);
}