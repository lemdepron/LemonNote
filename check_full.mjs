import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/zh.json', 'utf8');

try {
  const parsed = JSON.parse(content);
  console.log('Full parse successful');
  console.log('Keys:', Object.keys(parsed));
  console.log('Has ink:', 'ink' in parsed);
  console.log('Has insert:', 'insert' in parsed);
  console.log('Has design:', 'design' in parsed);
  console.log('Has wordGoal:', 'wordGoal' in parsed);
} catch (e) {
  console.log('Parse error:', e.message);
}