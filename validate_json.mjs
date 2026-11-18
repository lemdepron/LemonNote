import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/zh.json', 'utf8');

// Extract from ribbon end to insert start
const ribbonEnd = content.indexOf('    },', 20000); // ribbon end
const insertStart = content.indexOf('    "insert": {', 20000);
console.log('Ribbon end at:', ribbonEnd);
console.log('Insert start at:', insertStart);

const middle = content.substring(ribbonEnd, insertStart);
console.log('Middle section length:', middle.length);
console.log('Middle section:', middle);

// Try to parse just the ink object
const inkStart = content.indexOf('    "ink": {', 20000);
const inkEnd = content.indexOf('    },', inkStart) + 3;
console.log('Ink start:', inkStart);
console.log('Ink end:', inkEnd);

const inkObj = content.substring(inkStart, inkEnd);
console.log('Ink object length:', inkObj.length);

try {
  const parsed = JSON.parse('{' + inkObj + '}');
  console.log('Ink parsed successfully:', Object.keys(parsed));
} catch (e) {
  console.log('Ink parse error:', e.message);
}