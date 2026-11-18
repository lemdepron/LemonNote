import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/zh.json', 'utf8');

// Try parsing up to wordGoal
const chunk = content.substring(0, 37000);
try {
  JSON.parse(chunk);
  console.log('Chunk up to 37000 parses OK');
} catch (e) {
  console.log('Chunk parse error:', e.message);
}

// Try parsing from ribbon end to wordGoal end
const ribbonEnd = 36671;
const wordGoalEnd = content.indexOf('  },', 36678) + 3;
console.log('wordGoalEnd:', wordGoalEnd);
const middle = content.substring(ribbonEnd, wordGoalEnd);
try {
  JSON.parse('{' + middle + '}');
  console.log('Middle parses OK');
} catch (e) {
  console.log('Middle parse error:', e.message);
}