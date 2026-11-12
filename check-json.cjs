const content = require('fs').readFileSync('src/lib/locales/en.json', 'utf8');
let braceCount = 0;
let inString = false;
let escape = false;
let line = 1;
let col = 1;
for (let i = 0; i < content.length; i++) {
  const c = content[i];
  if (c === '\n') {
    line++;
    col = 1;
  } else {
    col++;
  }
  if (inString) {
    if (escape) escape = false;
    else if (c === '\\') escape = true;
    else if (c === '"') inString = false;
  } else {
    if (c === '"') inString = true;
    else if (c === '{') {
      braceCount++;
      console.log(`Open brace at line ${line}, col ${col}, count=${braceCount}`);
    }
    else if (c === '}') {
      braceCount--;
      console.log(`Close brace at line ${line}, col ${col}, count=${braceCount}`);
      if (braceCount < 0) console.log('Extra closing brace at line', line, 'col', col);
    }
  }
}
console.log('Final brace count:', braceCount);