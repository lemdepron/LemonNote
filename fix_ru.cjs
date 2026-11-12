const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json', 'utf8');

const vaultIdx = content.indexOf('"vault": {');
const secondCodeStart = 12816 + vaultIdx;
const codeEnd = 69756;

// The duplicate section starts at secondCodeStart and ends at codeEnd
// Before secondCodeStart, there's a newline and spaces, then the "code": { key
// We need to remove from the comma after the previous object to the end of the duplicate code object

// Find the actual start of the duplicate section (including the comma and newline before "code":)
let actualStart = secondCodeStart;
while(actualStart > 0 && (content[actualStart - 1] === '\n' || content[actualStart - 1] === ' ' || content[actualStart - 1] === '\t' || content[actualStart - 1] === ',')) {
  actualStart--;
}

console.log('Actual start:', actualStart);
console.log('Content at actualStart:', content.slice(actualStart, actualStart + 50));

// The end should include the trailing comma after the closing brace
let actualEnd = codeEnd;
while(actualEnd < content.length && (content[actualEnd] === ' ' || content[actualEnd] === '\n' || content[actualEnd] === '\t')) {
  actualEnd++;
}
if(content[actualEnd] === ',') actualEnd++;

console.log('Actual end:', actualEnd);
console.log('Content at actualEnd:', content.slice(actualEnd, actualEnd + 50));

// Remove from actualStart to actualEnd
const newContent = content.slice(0, actualStart) + content.slice(actualEnd);

console.log('New content length:', newContent.length);
console.log('Original length:', content.length);

try {
  JSON.parse(newContent);
  console.log('New content parses OK');
  
  const ru = JSON.parse(newContent);
  console.log('vault.code.newFile:', ru.vault?.code?.newFile);
  console.log('vault.code keys:', Object.keys(ru.vault.code));
  
  // Write the fixed file
  fs.writeFileSync('src/lib/locales/ru.json', newContent);
  console.log('File written successfully!');
} catch(e) {
  console.log('Parse error:', e.message);
  const posMatch = e.message.match(/position (\d+)/);
  if(posMatch) {
    const pos = parseInt(posMatch[1]);
    console.log('Error at position:', pos);
    console.log('Context:', newContent.slice(Math.max(0, pos-100), pos+100));
  }
}