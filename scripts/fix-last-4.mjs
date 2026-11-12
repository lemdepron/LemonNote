// Careful final fixes for last 4 conflicts
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// Push conflicting pairs in OPPOSITE directions
const COLOR_FIXES = [
  // Brutalist Ink (dark) - go more red-brown
  { themeId: 'brutalist-ink', mode: 'dark', background: '15 25% 5%', foreground: '15 15% 95%', primary: '15 35% 82%' },
  
  // Editorial Classic (dark) - go more yellow-brown (opposite direction)
  { themeId: 'editorial-classic', mode: 'dark', background: '42 25% 5%', foreground: '42 12% 94%', primary: '42 45% 82%' },
  
  // Editorial Classic (light) - go more distinct
  { themeId: 'editorial-classic', mode: 'light', background: '42 40% 95%', foreground: '42 25% 8%', primary: '42 45% 20%' },
  
  // High Contrast Warm (light) - go more amber
  { themeId: 'hc-dark-warm', mode: 'light', background: '35 40% 97%', foreground: '35 30% 3%', primary: '35 60% 6%' },
  
  // Editorial Modern (light) - go more distinct cool blue
  { themeId: 'editorial-modern', mode: 'light', background: '205 35% 96%', foreground: '205 20% 7%', primary: '205 55% 22%' },
  
  // Neu Soft (light) - go more distinct blue-gray (opposite from Editorial Modern)
  { themeId: 'neu-soft', mode: 'light', background: '220 25% 88%', foreground: '220 25% 11%', primary: '220 30% 25%' },
  
  // Clay Cool (light) - go more distinct slate (away from Editorial Modern)
  { themeId: 'clay-cool', mode: 'light', background: '200 20% 89%', foreground: '200 25% 9%', primary: '200 55% 22%' },
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
console.log("Careful final fixes applied!");