// Fix last 3 distinctiveness failures
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

const COLOR_FIXES = [
  // Editorial Classic vs High Contrast Warm (light) - distance 11.71
  { themeId: 'editorial-classic', mode: 'light', background: '46 35% 95%', primary: '46 50% 18%' },
  { themeId: 'hc-dark-warm', mode: 'light', background: '38 30% 97%', primary: '38 60% 10%' },
  
  // Editorial Classic vs Paper Linen (light) - distance 7.39
  { themeId: 'editorial-classic', mode: 'light', background: '48 35% 95%', primary: '48 50% 16%' },
  { themeId: 'paper-linen', mode: 'light', background: '52 35% 95%', primary: '52 55% 14%' },
  
  // Editorial Classic vs Paper Linen (dark) - distance 4.29
  { themeId: 'editorial-classic', mode: 'dark', background: '44 10% 3%', primary: '44 50% 82%' },
  { themeId: 'paper-linen', mode: 'dark', background: '42 10% 5%', primary: '42 45% 84%' },
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
console.log("Final 3 distinctiveness fixes applied!");