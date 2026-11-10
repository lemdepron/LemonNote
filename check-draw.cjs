const fs = require('fs');
const en = fs.readFileSync('src/lib/locales/en.json', 'utf8');
const lines = en.split('\n');

let drawStart = -1, drawEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('"draw": {')) {
    drawStart = i;
    console.log('Draw start at line', i+1);
  }
  if (drawStart !== -1 && lines[i].trim() === '},' && i > drawStart) {
    drawEnd = i;
    console.log('Draw end at line', i+1);
    break;
  }
}
console.log('Draw object lines:', drawStart+1, 'to', drawEnd+1);
console.log('Draw object length:', drawEnd - drawStart + 1);

// Check for duplicate keys in draw object
const drawLines = lines.slice(drawStart, drawEnd + 1);
const keys = new Set();
for (const line of drawLines) {
  const match = line.match(/^\s*"([^"]+)":/);
  if (match) {
    if (keys.has(match[1])) {
      console.log('DUPLICATE KEY:', match[1]);
    }
    keys.add(match[1]);
  }
}
console.log('Unique keys in draw:', keys.size);