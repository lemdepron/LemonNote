// Fix remaining 6 distinctiveness failures
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

const COLOR_FIXES = [
  // Brutalist Ink vs Editorial Classic (dark) - distance 10.79
  { themeId: 'brutalist-ink', mode: 'dark', background: '35 10% 4%', primary: '35 25% 88%' },
  { themeId: 'editorial-classic', mode: 'dark', background: '42 10% 5%', primary: '42 45% 80%' },
  
  // Brutalist Ink vs Paper Linen (dark) - distance 8.94
  { themeId: 'brutalist-ink', mode: 'dark', background: '35 10% 4%', primary: '35 25% 88%' },
  { themeId: 'paper-linen', mode: 'dark', background: '40 10% 7%', primary: '40 35% 78%' },
  
  // Editorial Classic vs Paper Linen (light) - distance 5.77
  { themeId: 'editorial-classic', mode: 'light', background: '42 35% 95%', primary: '42 40% 22%' },
  { themeId: 'paper-linen', mode: 'light', background: '48 35% 95%', primary: '48 45% 18%' },
  
  // Editorial Classic vs Paper Linen (dark) - distance 4.29
  { themeId: 'editorial-classic', mode: 'dark', background: '42 10% 5%', primary: '42 40% 80%' },
  { themeId: 'paper-linen', mode: 'dark', background: '40 10% 7%', primary: '40 35% 78%' },
  
  // Editorial Modern vs Neu Soft (light) - distance 10.74
  { themeId: 'editorial-modern', mode: 'light', background: '215 25% 96%', primary: '215 45% 28%' },
  { themeId: 'neu-soft', mode: 'light', background: '220 22% 88%', primary: '220 35% 25%' },
  
  // Editorial Modern vs Clay Cool (light) - distance 7.50
  { themeId: 'editorial-modern', mode: 'light', background: '215 25% 96%', primary: '215 45% 28%' },
  { themeId: 'clay-cool', mode: 'light', background: '205 15% 88%', primary: '205 60% 22%' },
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
console.log("Remaining distinctiveness fixes applied!");