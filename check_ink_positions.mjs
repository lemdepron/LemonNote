import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');
const positions = [702, 6295, 6927, 17407, 23871];
positions.forEach((pos, i) => {
  console.log(`\n--- Position ${i} (${pos}) ---`);
  console.log(content.substring(pos - 50, pos + 200));
});