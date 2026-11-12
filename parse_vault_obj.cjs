const fs = require('fs');
const content = fs.readFileSync('src/lib/locales/ru.json.fixed', 'utf8');

const vaultIdx = content.indexOf('"vault": {');
let braceCount = 0;
let vaultEnd = -1;
for(let i = vaultIdx; i < content.length; i++) {
  if(content[i] === '{') braceCount++;
  else if(content[i] === '}') {
    braceCount--;
    if(braceCount === 0) {
      vaultEnd = i;
      break;
    }
  }
}

const vaultStr = '{' + content.slice(vaultIdx, vaultEnd + 1) + '}';
console.log('Vault string length:', vaultStr.length);

try {
  const obj = JSON.parse(vaultStr);
  const vault = obj.vault;
  console.log('Parsed successfully!');
  console.log('Vault keys:', Object.keys(vault));
  console.log('Has code:', 'code' in vault);
  if(vault.code) {
    console.log('code keys:', Object.keys(vault.code));
    console.log('newFile:', vault.code.newFile);
  }
} catch(e) {
  console.log('Parse error:', e.message);
  const posMatch = e.message.match(/position (\d+)/);
  if(posMatch) {
    const pos = parseInt(posMatch[1]);
    console.log('Error at position:', pos);
    console.log('Context:', vaultStr.slice(Math.max(0, pos-100), pos+100));
  }
}