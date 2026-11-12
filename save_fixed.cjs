const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json', 'utf8');

const actualStart = 69228;
const actualEnd = 69756;

const newContent = content.slice(0, actualStart) + content.slice(actualEnd + 1);

fs.writeFileSync('src/lib/locales/ru.json.fixed', newContent);

try {
  JSON.parse(newContent);
  console.log('Fixed content parses OK');
} catch(e) {
  console.log('Parse error:', e.message);
  const posMatch = e.message.match(/position (\d+)/);
  if(posMatch) {
    const pos = parseInt(posMatch[1]);
    console.log('Error at position:', pos);
    console.log('Context:', newContent.slice(Math.max(0, pos-100), pos+100));
  }
}