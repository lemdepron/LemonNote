// Fix last 4 distinctiveness failures
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

const COLOR_FIXES = [
  // Editorial Classic vs High Contrast Warm (dark) - distance 10.32
  { themeId: 'editorial-classic', mode: 'dark', background: '42 10% 2%', primary: '42 55% 82%' },
  { themeId: 'hc-dark-warm', mode: 'dark', background: '38 12% 2%', primary: '38 55% 94%' },
  
  // Editorial Classic vs Paper Linen (light) - distance 5.35
  { themeId: 'editorial-classic', mode: 'light', background: '50 35% 95%', primary: '50 55% 14%' },
  { themeId: 'paper-linen', mode: 'light', background: '54 35% 95%', primary: '54 60% 12%' },
  
  // Editorial Classic vs Paper Linen (dark) - distance 4.29
  { themeId: 'editorial-classic', mode: 'dark', background: '46 10% 2%', primary: '46 55% 82%' },
  { themeId: 'paper-linen', mode: 'dark', background: '42 10% 4%', primary: '42 50% 84%' },
  
  // High Contrast Warm vs Paper Linen (dark) - distance 9.80
  { themeId: 'hc-dark-warm', mode: 'dark', background: '38 12% 2%', primary: '38 60% 94%' },
  { themeId: 'paper-linen', mode: 'dark', background: '42 10% 3%', primary: '42 50% 86%' },
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
console.log("Last 4 distinctiveness fixes applied!");