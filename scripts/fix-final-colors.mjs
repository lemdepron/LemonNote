// Final aggressive color fixes for remaining distinctiveness failures
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// More aggressive shifts for the remaining conflicts
const COLOR_FIXES = [
  // Brutalist Ink - shift much more sepia/brown
  { themeId: 'brutalist-ink', mode: 'dark', background: '30 22% 5%', foreground: '30 15% 95%', primary: '30 30% 85%' },
  
  // Editorial Classic - shift more distinct warm brown
  { themeId: 'editorial-classic', mode: 'dark', background: '28 22% 5%', foreground: '28 12% 94%', primary: '28 40% 82%' },
  
  // High Contrast Warm - shift more amber/orange
  { themeId: 'hc-dark-warm', mode: 'light', background: '32 35% 97%', foreground: '32 30% 3%', primary: '32 55% 8%' },
  
  // Paper Linen - shift more distinct cream
  { themeId: 'paper-linen', mode: 'light', background: '48 40% 95%', foreground: '46 25% 10%', primary: '46 45% 20%' },
  { themeId: 'paper-linen', mode: 'dark', background: '46 15% 7%', foreground: '48 10% 93%', primary: '46 40% 80%' },
  
  // Editorial Modern - shift more distinct cool blue
  { themeId: 'editorial-modern', mode: 'light', background: '210 30% 96%', foreground: '210 20% 8%', primary: '210 50% 25%' },
  
  // Neu Soft - shift more distinct blue-gray
  { themeId: 'neu-soft', mode: 'light', background: '215 25% 89%', foreground: '215 25% 12%', primary: '215 40% 28%' },
  
  // Clay Cool - shift more distinct slate
  { themeId: 'clay-cool', mode: 'light', background: '205 25% 90%', foreground: '205 25% 10%', primary: '205 50% 28%' },
  
  // Pastel Morning - shift more distinct peach
  { themeId: 'pastel-morning', mode: 'light', background: '12 60% 97%', foreground: '12 30% 10%', primary: '12 80% 28%' },
  
  // Duo Sunset - shift more distinct red-orange
  { themeId: 'duo-sunset', mode: 'light', background: '6 70% 96%', foreground: '4 40% 8%', primary: '4 90% 25%' },
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
console.log("Final aggressive color fixes applied!");