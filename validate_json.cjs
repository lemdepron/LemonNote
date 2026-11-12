const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json', 'utf8');

try {
  JSON.parse(content);
  console.log('Full JSON parses OK');
} catch(e) {
  console.log('Full JSON parse error:', e.message);
  const posMatch = e.message.match(/position (\d+)/);
  if(e.message.includes('position')) {
    const pos = parseInt(e.message.match(/position (\d+)/)[1]);
    console.log('Error at position:', pos);
    console.log('Context:', content.slice(Math.max(0, pos-100), pos+100));
  }
}