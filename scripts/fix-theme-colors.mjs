// Fix theme color distinctiveness by adjusting conflicting themes
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// Theme color adjustments to fix distinctiveness failures
// Each entry: { themeId, mode, newBackground, newPrimary, newForeground, newCard }
const COLOR_FIXES = [
  // Glass Dawn - shift background more yellow, primary more orange
  { themeId: 'glass-dawn', mode: 'dark', background: '30 20% 7%', foreground: '45 15% 93%', primary: '35 85% 68%' },
  { themeId: 'glass-dawn', mode: 'light', background: '48 65% 97%', primary: '32 88% 33%' },
  
  // Glass Dusk - shift background more blue, primary more indigo
  { themeId: 'glass-dusk', mode: 'light', background: '225 45% 97%', primary: '235 75% 33%' },
  { themeId: 'glass-dusk', mode: 'dark', background: '235 20% 7%', primary: '235 80% 68%' },
  
  // Glass Aurora - shift to more teal/cyan
  { themeId: 'glass-aurora', mode: 'dark', background: '195 25% 5%', primary: '185 75% 68%' },
  { themeId: 'glass-aurora', mode: 'light', background: '185 35% 96%', primary: '185 70% 33%' },
  
  // Glass Midnight - shift to more purple/magenta
  { themeId: 'glass-midnight', mode: 'dark', background: '285 25% 5%', primary: '305 90% 70%' },
  { themeId: 'glass-midnight', mode: 'light', background: '285 25% 96%', primary: '305 85% 33%' },
  
  // Pastel Morning - shift more peach/coral
  { themeId: 'pastel-morning', mode: 'dark', background: '18 15% 8%', primary: '18 70% 65%' },
  { themeId: 'pastel-morning', mode: 'light', background: '18 55% 97%', primary: '18 75% 33%' },
  
  // Pastel Evening - shift more lavender
  { themeId: 'pastel-evening', mode: 'dark', background: '255 15% 8%', primary: '255 65% 65%' },
  { themeId: 'pastel-evening', mode: 'light', background: '255 45% 97%', primary: '255 65% 33%' },
  
  // Duo Sunset - shift more red-orange
  { themeId: 'duo-sunset', mode: 'dark', background: '12 25% 6%', primary: '12 90% 68%' },
  { themeId: 'duo-sunset', mode: 'light', background: '12 65% 96%', primary: '12 85% 33%' },
  
  // Duo Ocean - shift more teal
  { themeId: 'duo-ocean', mode: 'dark', background: '185 25% 6%', primary: '185 80% 68%' },
  { themeId: 'duo-ocean', mode: 'light', background: '185 55% 96%', primary: '185 75% 33%' },
  
  // Neu Soft - shift more blue-gray
  { themeId: 'neu-soft', mode: 'dark', background: '220 18% 10%', primary: '220 30% 72%' },
  { themeId: 'neu-soft', mode: 'light', background: '220 22% 90%', primary: '220 35% 33%' },
  
  // Neu Deep - shift more charcoal
  { themeId: 'neu-deep', mode: 'dark', background: '215 20% 8%', primary: '215 35% 82%' },
  { themeId: 'neu-deep', mode: 'light', background: '215 18% 85%', primary: '215 45% 25%' },
  
  // Editorial Classic - shift more warm brown
  { themeId: 'editorial-classic', mode: 'dark', background: '35 20% 7%', primary: '35 40% 80%' },
  { themeId: 'editorial-classic', mode: 'light', background: '35 35% 95%', primary: '35 40% 22%' },
  
  // Editorial Modern - shift more cool gray
  { themeId: 'editorial-modern', mode: 'dark', background: '220 18% 6%', primary: '220 50% 78%' },
  { themeId: 'editorial-modern', mode: 'light', background: '220 25% 96%', primary: '220 45% 28%' },
  
  // Brutalist Ink - shift more sepia
  { themeId: 'brutalist-ink', mode: 'dark', background: '38 18% 7%', primary: '38 25% 88%' },
  { themeId: 'brutalist-ink', mode: 'light', background: '38 25% 93%', primary: '38 30% 14%' },
  
  // High Contrast Pure - shift to true black/white (keep distinct from Brutalist Stark)
  { themeId: 'hc-dark-pure', mode: 'dark', background: '0 0% 0%', primary: '0 0% 100%' },
  { themeId: 'hc-dark-pure', mode: 'light', background: '0 0% 100%', primary: '0 0% 0%' },
  
  // High Contrast Warm - shift more amber
  { themeId: 'hc-dark-warm', mode: 'dark', background: '42 20% 3%', primary: '42 45% 92%' },
  { themeId: 'hc-dark-warm', mode: 'light', background: '42 25% 97%', primary: '42 45% 12%' },
  
  // Paper Linen - shift more cream
  { themeId: 'paper-linen', mode: 'dark', background: '42 15% 9%', primary: '42 35% 78%' },
  { themeId: 'paper-linen', mode: 'light', background: '42 30% 95%', primary: '42 40% 26%' },
  
  // Paper Vellum - shift more yellow-cream
  { themeId: 'paper-vellum', mode: 'dark', background: '52 18% 10%', primary: '52 40% 84%' },
  { themeId: 'paper-vellum', mode: 'light', background: '52 45% 96%', primary: '52 45% 28%' },
];

function applyColorFixes(source) {
  let result = source;
  
  for (const fix of COLOR_FIXES) {
    // Find the theme object
    const themeStart = result.indexOf(`id: "${fix.themeId}"`);
    if (themeStart === -1) {
      console.warn(`Theme ${fix.themeId} not found`);
      continue;
    }
    
    // Find the mode object (light: or dark:)
    const modeStart = result.indexOf(`${fix.mode}:`, themeStart);
    if (modeStart === -1) {
      console.warn(`Mode ${fix.mode} not found for ${fix.themeId}`);
      continue;
    }
    
    // Find the opening brace of the mode object
    let bracePos = modeStart;
    while (bracePos < result.length && result[bracePos] !== '{') bracePos++;
    if (bracePos === result.length) continue;
    
    // Find the matching closing brace
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
    
    const modeStr = result.slice(bracePos, modeEnd + 1);
    let newModeStr = modeStr;
    
    // Replace the tokens
    if (fix.background) {
      newModeStr = newModeStr.replace(/"--background":\s*"[^"]*"/, `"--background": "${fix.background}"`);
    }
    if (fix.foreground) {
      newModeStr = newModeStr.replace(/"--foreground":\s*"[^"]*"/, `"--foreground": "${fix.foreground}"`);
    }
    if (fix.primary) {
      newModeStr = newModeStr.replace(/"--primary":\s*"[^"]*"/, `"--primary": "${fix.primary}"`);
    }
    if (fix.card) {
      newModeStr = newModeStr.replace(/"--card":\s*"[^"]*"/, `"--card": "${fix.card}"`);
    }
    
    // Also update dependent tokens that reference primary/background
    // chart-1 typically follows primary
    if (fix.primary) {
      newModeStr = newModeStr.replace(/"--chart-1":\s*"[^"]*"/, `"--chart-1": "${fix.primary}"`);
      newModeStr = newModeStr.replace(/"--node-ring":\s*"[^"]*"/, `"--node-ring": "${fix.primary}"`);
    }
    
    result = result.slice(0, bracePos) + newModeStr + result.slice(modeEnd + 1);
  }
  
  return result;
}

const result = applyColorFixes(source);
writeFileSync("src/lib/theme-presets.js", result);
console.log("Color fixes applied!");