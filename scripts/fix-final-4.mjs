// Fix last 4 conflicts
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

const COLOR_FIXES = [
  // Editorial Classic (dark) - unique warm brown
  { themeId: 'editorial-classic', mode: 'dark', background: '30 30% 4%', foreground: '30 10% 95%', primary: '30 50% 80%' },
  
  // High Contrast Warm (dark) - distinct amber
  { themeId: 'hc-dark-warm', mode: 'dark', background: '38 22% 3%', foreground: '38 10% 98%', primary: '38 55% 94%' },
  
  // Paper Linen (light) - distinct cream
  { themeId: 'paper-linen', mode: 'light', background: '48 45% 95%', foreground: '46 25% 9%', primary: '46 50% 18%' },
  
  // Paper Linen (dark) - distinct cream
  { themeId: 'paper-linen', mode: 'dark', background: '46 18% 6%', foreground: '48 10% 94%', primary: '46 45% 82%' },
  
  // Editorial Modern (light) - distinct cool blue
  { themeId: 'editorial-modern', mode: 'light', background: '200 40% 96%', foreground: '200 20% 6%', primary: '200 60% 20%' },
  
  // Clay Cool (light) - distinct slate
  { themeId: 'clay-cool', mode: 'light', background: '205 15% 88%', foreground: '205 25% 8%', primary: '205 60% 22%' },
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
console.log("Last 4 fixes applied!");