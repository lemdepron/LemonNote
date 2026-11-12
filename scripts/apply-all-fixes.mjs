// Comprehensive color and token fix with proper quoting
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// All color fixes combined
const COLOR_FIXES = [
  // Glass Aurora (light) - fix button contrast
  { themeId: 'glass-aurora', mode: 'light', primary: '190 70% 30%', 'primary-foreground': '0 0% 100%' },
  
  // Brutalist Ink
  { themeId: 'brutalist-ink', mode: 'light', background: '38 25% 92%', foreground: '38 30% 7%', primary: '38 35% 10%' },
  { themeId: 'brutalist-ink', mode: 'dark', background: '15 25% 5%', foreground: '15 15% 95%', primary: '15 35% 82%' },
  
  // Editorial Classic
  { themeId: 'editorial-classic', mode: 'light', background: '25 45% 95%', foreground: '25 25% 7%', primary: '25 50% 18%' },
  { themeId: 'editorial-classic', mode: 'dark', background: '30 30% 4%', foreground: '30 10% 95%', primary: '30 50% 80%' },
  
  // Editorial Modern
  { themeId: 'editorial-modern', mode: 'light', background: '200 40% 96%', foreground: '200 20% 6%', primary: '200 60% 20%' },
  
  // High Contrast Warm
  { themeId: 'hc-dark-warm', mode: 'light', background: '35 40% 97%', foreground: '35 30% 3%', primary: '35 60% 6%' },
  { themeId: 'hc-dark-warm', mode: 'dark', background: '38 22% 3%', foreground: '38 10% 98%', primary: '38 55% 94%' },
  
  // Paper Linen
  { themeId: 'paper-linen', mode: 'light', background: '52 50% 95%', foreground: '50 25% 8%', primary: '50 55% 15%' },
  { themeId: 'paper-linen', mode: 'dark', background: '46 18% 6%', foreground: '48 10% 94%', primary: '46 45% 82%' },
  
  // Pastel Morning
  { themeId: 'pastel-morning', mode: 'light', background: '12 60% 97%', foreground: '12 30% 10%', primary: '12 80% 28%' },
  { themeId: 'pastel-morning', mode: 'dark', background: '15 15% 7%', foreground: '15 10% 93%', primary: '15 70% 68%' },
  
  // Duo Sunset
  { themeId: 'duo-sunset', mode: 'light', background: '6 70% 96%', foreground: '4 40% 8%', primary: '4 90% 25%' },
  { themeId: 'duo-sunset', mode: 'dark', background: '8 25% 5%', foreground: '12 10% 93%', primary: '10 90% 68%' },
  
  // Neu Soft
  { themeId: 'neu-soft', mode: 'light', background: '220 25% 88%', foreground: '220 25% 11%', primary: '220 30% 25%' },
  { themeId: 'neu-soft', mode: 'dark', background: '218 18% 10%', foreground: '218 10% 90%', primary: '218 30% 72%' },
  
  // Clay Cool
  { themeId: 'clay-cool', mode: 'light', background: '205 15% 88%', foreground: '205 25% 8%', primary: '205 60% 22%' },
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

// Apply color fixes
let result = applyFixes(source);

// Remove duplicate themes
const THEMES_TO_REMOVE = [
  'pastel-evening',
  'duo-ocean',
  'neu-deep',
  'hc-dark-pure',
  'paper-vellum',
];

for (const themeId of THEMES_TO_REMOVE) {
  const start = result.indexOf(`  // `);
  // Find the specific theme comment
  let searchPos = 0;
  while (true) {
    const commentPos = result.indexOf(`// `, searchPos);
    if (commentPos === -1) break;
    
    const idPos = result.indexOf(`id: "${themeId}"`, commentPos);
    if (idPos !== -1 && idPos - commentPos < 200) {
      // Found the theme, remove from comment to closing },
      const themeStart = commentPos;
      let bracePos = idPos;
      while (bracePos < result.length && result[bracePos] !== '{') bracePos++;
      
      let depth = 0;
      let themeEnd = -1;
      for (let i = bracePos; i < result.length; i++) {
        if (result[i] === '{') depth++;
        else if (result[i] === '}') {
          depth--;
          if (depth === 0) {
            themeEnd = i;
            break;
          }
        }
      }
      
      if (themeEnd !== -1) {
        // Include trailing comma if present
        let endPos = themeEnd + 1;
        if (result[endPos] === ',') endPos++;
        result = result.slice(0, themeStart) + result.slice(endPos);
        console.log(`Removed ${themeId}`);
      }
      break;
    }
    searchPos = commentPos + 1;
  }
}

// Fix HIGH_CONTRAST_THEMES comment (was "2 themes" now "1 theme")
result = result.replace(
  '// FAMILY 11: HIGH-CONTRAST DARK — 2 themes',
  '// FAMILY 11: HIGH-CONTRAST DARK — 1 theme'
);

// Fix PASTEL_THEMES comment (was "2 themes" now "1 theme")
result = result.replace(
  '// FAMILY 5: SOFT PASTEL / ORGANIC — 2 themes',
  '// FAMILY 5: SOFT PASTEL / ORGANIC — 1 theme'
);

// Fix GRADIENT_DUOTONE_THEMES comment (was "2 themes" now "1 theme")
result = result.replace(
  '// FAMILY 6: GRADIENT DUOTONE — 2 themes',
  '// FAMILY 6: GRADIENT DUOTONE — 1 theme'
);

// Fix NEUMORPHISM_THEMES comment (was "2 themes" now "1 theme")
result = result.replace(
  '// FAMILY 7: NEUMORPHISM — 2 themes',
  '// FAMILY 7: NEUMORPHISM — 1 theme'
);

// Fix SKEUOMORPHIC_THEMES comment (was "2 themes" now "1 theme")
result = result.replace(
  '// FAMILY 12: SKEUOMORPHIC PAPER — 2 themes',
  '// FAMILY 12: SKEUOMORPHIC PAPER — 1 theme'
);

writeFileSync("src/lib/theme-presets.js", result);
console.log("All fixes applied with proper quoting!");