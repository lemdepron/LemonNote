// Fix remaining theme contrast and distinctiveness issues
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// Targeted color fixes for remaining conflicts
const COLOR_FIXES = [
  // Glass Aurora (light) - fix button contrast (4.37 -> need >= 4.5)
  { themeId: 'glass-aurora', mode: 'light', primary: '190 70% 30%', 'primary-foreground': '0 0% 100%' },
  
  // Brutalist Ink - shift more sepia to distinguish from Editorial Classic, HC Warm, Paper Linen
  { themeId: 'brutalist-ink', mode: 'light', background: '38 25% 92%', foreground: '38 30% 7%', primary: '38 35% 10%' },
  { themeId: 'brutalist-ink', mode: 'dark', background: '38 18% 6%', foreground: '38 15% 94%', primary: '38 25% 88%' },
  
  // Editorial Classic - shift more warm brown to distinguish from Brutalist Ink, HC Warm, Paper Linen
  { themeId: 'editorial-classic', mode: 'light', background: '32 35% 95%', foreground: '32 25% 9%', primary: '32 40% 22%' },
  { themeId: 'editorial-classic', mode: 'dark', background: '32 20% 6%', foreground: '32 12% 93%', primary: '32 35% 80%' },
  
  // Editorial Modern - shift more cool blue-gray to distinguish from Neu Soft, Clay Cool
  { themeId: 'editorial-modern', mode: 'light', background: '215 25% 96%', foreground: '215 20% 9%', primary: '215 45% 28%' },
  { themeId: 'editorial-modern', mode: 'dark', background: '215 18% 6%', foreground: '215 10% 93%', primary: '215 50% 78%' },
  
  // High Contrast Warm - shift more amber to distinguish from Paper Linen, Brutalist Ink, Editorial Classic
  { themeId: 'hc-dark-warm', mode: 'light', background: '38 30% 97%', foreground: '38 30% 4%', primary: '38 50% 10%' },
  { themeId: 'hc-dark-warm', mode: 'dark', background: '38 20% 3%', foreground: '38 10% 98%', primary: '38 50% 92%' },
  
  // Paper Linen - shift more cream to distinguish from Editorial Classic, HC Warm, Brutalist Ink
  { themeId: 'paper-linen', mode: 'light', background: '44 35% 95%', foreground: '42 25% 11%', primary: '42 40% 24%' },
  { themeId: 'paper-linen', mode: 'dark', background: '42 15% 8%', foreground: '44 10% 92%', primary: '42 35% 78%' },
  
  // Pastel Morning - shift more peach to distinguish from Duo Sunset
  { themeId: 'pastel-morning', mode: 'light', background: '15 55% 97%', foreground: '15 30% 11%', primary: '15 75% 32%' },
  { themeId: 'pastel-morning', mode: 'dark', background: '15 15% 7%', foreground: '15 10% 93%', primary: '15 70% 68%' },
  
  // Duo Sunset - shift more red-orange to distinguish from Pastel Morning
  { themeId: 'duo-sunset', mode: 'light', background: '10 65% 96%', foreground: '8 40% 9%', primary: '8 85% 30%' },
  { themeId: 'duo-sunset', mode: 'dark', background: '8 25% 5%', foreground: '12 10% 93%', primary: '10 90% 68%' },
  
  // Neu Soft - shift more blue-gray to distinguish from Editorial Modern
  { themeId: 'neu-soft', mode: 'light', background: '218 22% 90%', foreground: '218 25% 13%', primary: '218 35% 30%' },
  { themeId: 'neu-soft', mode: 'dark', background: '218 18% 10%', foreground: '218 10% 90%', primary: '218 30% 72%' },
  
  // Clay Cool - shift more slate to distinguish from Editorial Modern
  { themeId: 'clay-cool', mode: 'light', background: '208 25% 91%', foreground: '208 25% 11%', primary: '208 45% 32%' },
  { themeId: 'clay-cool', mode: 'dark', background: '208 15% 9%', foreground: '208 10% 92%', primary: '208 40% 62%' },
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
    
    // Apply each fix
    for (const [key, value] of Object.entries(fix)) {
      if (key === 'themeId' || key === 'mode') continue;
      const tokenName = `--${key}`;
      const regex = new RegExp(`"${tokenName}":\\s*"[^"]*"`);
      if (regex.test(modeStr)) {
        modeStr = modeStr.replace(regex, `"${tokenName}": "${value}"`);
      }
    }
    
    // Also update chart-1 and node-ring to match primary
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
console.log("Remaining color fixes applied!");