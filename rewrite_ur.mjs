import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');
try {
  const parsed = JSON.parse(content);
  console.log('Parse successful');
  // Write back using JSON.stringify to ensure valid JSON
  fs.writeFileSync('src/lib/locales/ur.json', JSON.stringify(parsed, null, 2) + '\n', 'utf8');
  console.log('Rewritten successfully');
} catch (e) {
  console.log('Error:', e.message);
}