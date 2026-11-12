// Aggressive fix for last 4 distinctiveness failures
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

const COLOR_FIXES = [
  // Editorial Classic vs High Contrast Warm (dark) - push in opposite directions
  { themeId: 'editorial-classic', mode: 'dark', background: '30 10% 2%', primary: '30 60% 82%' },
  { themeId: 'hc-dark-warm', mode: 'dark', background: '42 12% 2%', primary: '42 60% 94%' },
  
  // Editorial Classic vs Paper Linen (light) - push far apart
  { themeId: 'editorial-classic', mode: 'light', background: '25 40% 95%', primary: '25 55% 16%' },
  { themeId: 'paper-linen', mode: 'light', background: '55 35% 95%', primary: '55 60% 12%' },
  
  // Editorial Classic vs Paper Linen (dark) - push far apart
  { themeId: 'editorial-classic', mode: 'dark', background: '28 10% 2%', primary: '28 60% 82%' },
  { themeId: 'paper-linen', mode: 'dark', background: '50 10% 3%', primary: '50 55% 84%' },
  
  // High Contrast Warm vs Paper Linen (dark)
  { themeId: 'hc-dark-warm', mode: 'dark', background: '35 12% 1%', primary: '35 65% 96%' },
  { themeId: 'paper-linen', mode: 'dark', background: '45 10% 2%', primary: '45 55% 86%' },
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
console.log("Aggressive distinctiveness fixes applied!");