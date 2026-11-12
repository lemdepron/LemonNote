// Fix distinctiveness failures by adjusting conflicting theme colors
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// Color adjustments for conflicting theme pairs
// Each entry: { themeId, mode, background, foreground, primary, foreground }
const COLOR_FIXES = [
  // Glass Dawn vs Pastel Morning (dark) - distance 10.51
  { themeId: 'glass-dawn', mode: 'dark', background: '30 20% 6%', primary: '32 85% 68%' },
  { themeId: 'pastel-morning', mode: 'dark', background: '15 12% 8%', primary: '12 75% 68%' },
  
  // Glass Dawn vs Duo Sunset (dark) - distance 11.27
  { themeId: 'glass-dawn', mode: 'dark', background: '28 18% 6%', primary: '30 88% 67%' },
  { themeId: 'duo-sunset', mode: 'dark', background: '8 22% 5%', primary: '6 90% 68%' },
  
  // Brutalist Ink vs Editorial Classic (dark) - distance 10.70
  { themeId: 'brutalist-ink', mode: 'dark', background: '38 12% 5%', primary: '38 20% 88%' },
  { themeId: 'editorial-classic', mode: 'dark', background: '40 10% 6%', primary: '40 40% 80%' },
  
  // Brutalist Ink vs High Contrast Warm (light) - distance 9.65
  { themeId: 'brutalist-ink', mode: 'light', background: '38 25% 93%', primary: '38 30% 12%' },
  { themeId: 'hc-dark-warm', mode: 'light', background: '40 25% 97%', primary: '40 45% 12%' },
  
  // Brutalist Ink vs High Contrast Warm (dark) - distance 9.50
  { themeId: 'brutalist-ink', mode: 'dark', background: '38 10% 5%', primary: '38 25% 88%' },
  { themeId: 'hc-dark-warm', mode: 'dark', background: '38 12% 3%', primary: '38 50% 92%' },
  
  // Brutalist Ink vs Paper Linen (dark) - distance 10.82
  { themeId: 'brutalist-ink', mode: 'dark', background: '38 10% 5%', primary: '38 25% 88%' },
  { themeId: 'paper-linen', mode: 'dark', background: '40 10% 8%', primary: '40 35% 78%' },
  
  // Editorial Classic vs High Contrast Warm (light) - distance 11.80
  { themeId: 'editorial-classic', mode: 'light', background: '42 35% 95%', primary: '42 40% 22%' },
  { themeId: 'hc-dark-warm', mode: 'light', background: '40 25% 97%', primary: '40 45% 12%' },
  
  // Editorial Classic vs High Contrast Warm (dark) - distance 10.17
  { themeId: 'editorial-classic', mode: 'dark', background: '42 10% 6%', primary: '42 40% 80%' },
  { themeId: 'hc-dark-warm', mode: 'dark', background: '38 12% 3%', primary: '38 50% 92%' },
  
  // Editorial Classic vs Paper Linen (light) - distance 5.87
  { themeId: 'editorial-classic', mode: 'light', background: '42 35% 95%', primary: '42 40% 22%' },
  { themeId: 'paper-linen', mode: 'light', background: '44 35% 95%', primary: '44 40% 20%' },
  
  // Editorial Classic vs Paper Linen (dark) - distance 6.00
  { themeId: 'editorial-classic', mode: 'dark', background: '42 10% 6%', primary: '42 40% 80%' },
  { themeId: 'paper-linen', mode: 'dark', background: '40 10% 8%', primary: '40 35% 78%' },
  
  // Editorial Modern vs Neu Soft (light) - distance 8.09
  { themeId: 'editorial-modern', mode: 'light', background: '215 25% 96%', primary: '215 45% 28%' },
  { themeId: 'neu-soft', mode: 'light', background: '220 22% 88%', primary: '220 35% 25%' },
  
  // High Contrast Warm vs Paper Linen (light) - distance 10.05
  { themeId: 'hc-dark-warm', mode: 'light', background: '38 30% 97%', primary: '38 55% 10%' },
  { themeId: 'paper-linen', mode: 'light', background: '46 35% 95%', primary: '46 45% 18%' },
  
  // High Contrast Warm vs Paper Linen (dark) - distance 11.26
  { themeId: 'hc-dark-warm', mode: 'dark', background: '38 12% 3%', primary: '38 55% 94%' },
  { themeId: 'paper-linen', mode: 'dark', background: '40 10% 8%', primary: '40 35% 78%' },
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
console.log("Distinctiveness fixes applied!");