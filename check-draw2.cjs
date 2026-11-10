const fs = require('fs');
const en = fs.readFileSync('src/lib/locales/en.json', 'utf8');
const lines = en.split('\n');

let drawStart = -1, drawEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('"draw": {')) {
    drawStart = i;
  }
  if (drawStart !== -1 && lines[i].trim() === '},' && i > drawStart) {
    drawEnd = i;
    break;
  }
}

const drawLines = lines.slice(drawStart, drawEnd + 1);
const keys = {};
for (const line of drawLines) {
  const match = line.match(/^\s*"([^"]+)":/);
  if (match) {
    const key = match[1];
    if (keys[key]) {
      keys[key]++;
    } else {
      keys[key] = 1;
    }
  }
}

for (const [key, count] of Object.entries(keys)) {
  if (count > 1) {
    console.log('DUPLICATE:', key, 'appears', count, 'times');
  }
}