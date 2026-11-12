// Fix final 4 distinctiveness failures
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

const COLOR_FIXES = [
  // Brutalist Ink vs Paper Linen (dark) - distance 10.42
  { themeId: 'brutalist-ink', mode: 'dark', background: '30 10% 3%', primary: '30 25% 88%' },
  { themeId: 'paper-linen', mode: 'dark', background: '42 10% 7%', primary: '42 40% 80%' },
  
  // Editorial Classic vs Paper Linen (light) - distance 7.39
  { themeId: 'editorial-classic', mode: 'light', background: '44 35% 95%', primary: '44 45% 20%' },
  { themeId: 'paper-linen', mode: 'light', background: '50 35% 95%', primary: '50 50% 16%' },
  
  // Editorial Classic vs Paper Linen (dark) - distance 4.29
  { themeId: 'editorial-classic', mode: 'dark', background: '44 10% 4%', primary: '44 45% 80%' },
  { themeId: 'paper-linen', mode: 'dark', background: '42 10% 6%', primary: '42 40% 82%' },
  
  // Editorial Modern vs Neu Soft (light) - distance 10.74
  { themeId: 'editorial-modern', mode: 'light', background: '215 25% 96%', primary: '215 50% 25%' },
  { themeId: 'neu-soft', mode: 'light', background: '220 25% 88%', primary: '220 30% 28%' },
];

function applyFixes(source) {
  let result = source;
  
  for (const fix of COLOR_FIXES) {
    const themeStart = result.indexOf(`id: "${fix.themeId}"`);
    if (themeStart === -1) {
      console.warn(`Theme ${fix.themeId} not found`);
      continue;
    }
    
    const modeStart = result.indexOf(`${fix.mode}:`, themeStart);
    if (modeStart === -1) {
      console.warn(`Mode ${fix.mode} not found for ${fix.themeId}`);
      continue;
    }
    
    let bracePos = modeStart;
    while (bracePos < result.length && result[bracePos] !== '{') bracePos++;
    if (bracePos === result.length) continue;
    
    let depth = 0;
    let modeEnd = -1;
    for (let i = bracePos; i < result.length; i++) {
      if (result[i] === '{') depth++;
      else if (result[i] === '}') {
        depth--;
        if (depth === 0) {
          modeEnd = i;
          break;
        }
      }
    }
    if (modeEnd === -1) continue;
    
    let modeStr = result.slice(bracePos, modeEnd + 1);
    
    for (const [key, value] of Object.entries(fix)) {
      if (key === 'themeId' || key === 'mode') continue;
      const tokenName = `--${key}`;
      const regex = new RegExp(`"${tokenName}":\\s*"[^"]*"`);
      if (regex.test(modeStr)) {
        modeStr = modeStr.replace(regex, `"${tokenName}": "${value}"`);
      }
    }
    
    if (fix.primary) {
      modeStr = modeStr.replace(/"--chart-1":\s*"[^"]*"/, `"--chart-1": "${fix.primary}"`);
      modeStr = modeStr.replace(/"--node-ring":\s*"[^"]*"/, `"--node-ring": "${fix.primary}"`);
    }
    
    result = result.slice(0, bracePos) + modeStr + result.slice(modeEnd + 1);
  }
  
  return result;
}

const fileSource = readFileSync("src/lib/theme-presets.js", "utf8");
const fixedSource = applyFixes(fileSource);
writeFileSync("src/lib/theme-presets.js", fixedSource);
console.log("Final distinctiveness fixes applied!");