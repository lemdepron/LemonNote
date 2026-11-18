import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/zh.json', 'utf8');
const zh = JSON.parse(content);
console.log('vault.shortcuts.canvas:', Object.keys(zh.vault.shortcuts.canvas));
console.log('vault.shortcuts.canvas.frameTypes:', zh.vault.shortcuts.canvas.frameTypes);