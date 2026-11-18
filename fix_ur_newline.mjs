import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');
// Add newline at the end if not present
if (!content.endsWith('\n')) {
  fs.writeFileSync('src/lib/locales/ur.json', content + '\n', 'utf8');
  console.log('Added newline');
} else {
  console.log('Already has newline');
}