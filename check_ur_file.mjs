import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');
console.log('File length:', content.length);
console.log('Last char:', content[content.length - 1], content.charCodeAt(content.length - 1));
console.log('Second to last:', content[content.length - 2], content.charCodeAt(content.length - 2));

// Try parsing just the last part
const lastPart = content.substring(content.length - 50);
try {
  JSON.parse(lastPart);
  console.log('Last part parses OK');
} catch (e) {
  console.log('Last part error:', e.message);
}

// Try parsing the whole thing with a simple test
try {
  JSON.parse(content);
  console.log('Full parse OK');
} catch (e) {
  console.log('Full parse error:', e.message, 'at position', e.message.match(/position (\d+)/)?.[1]);
}