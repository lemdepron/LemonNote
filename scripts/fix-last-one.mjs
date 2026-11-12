// Fix last conflict: Editorial Classic vs Paper Linen (light)
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// Push Editorial Classic more orange-brown, Paper Linen more yellow-cream
const COLOR_FIXES = [
  { themeId: 'editorial-classic', mode: 'light', background: '25 45% 95%', foreground: '25 25% 7%', primary: '25 50% 18%' },
  { themeId: 'paper-linen', mode: 'light', background: '52 50% 95%', foreground: '50 25% 8%', primary: '50 55% 15%' },
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

const result = applyFixes(source);
writeFileSync("src/lib/theme-presets.js", result);
console.log("Last conflict fix applied!");