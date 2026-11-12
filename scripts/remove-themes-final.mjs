// Remove the 5 themes that were supposed to be removed
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

const THEMES_TO_REMOVE = [
  'pastel-evening',
  'duo-ocean',
  'neu-deep',
  'hc-dark-pure',
  'paper-vellum',
];

let result = source;

for (const themeId of THEMES_TO_REMOVE) {
  let searchPos = 0;
  while (true) {
    const commentPos = result.indexOf(`// `, searchPos);
    if (commentPos === -1) break;
    
    const idPos = result.indexOf(`id: "${themeId}"`, commentPos);
    if (idPos !== -1 && idPos - commentPos < 200) {
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
        let endPos = themeEnd + 1;
        if (endPos < result.length && result[endPos] === ',') endPos++;
        result = result.slice(0, themeStart) + result.slice(endPos);
        console.log(`Removed ${themeId}`);
      }
      break;
    }
    searchPos = commentPos + 1;
  }
}

// Fix family comments
result = result.replace('// FAMILY 5: SOFT PASTEL / ORGANIC — 2 themes', '// FAMILY 5: SOFT PASTEL / ORGANIC — 1 theme');
result = result.replace('// FAMILY 6: GRADIENT DUOTONE — 2 themes', '// FAMILY 6: GRADIENT DUOTONE — 1 theme');
result = result.replace('// FAMILY 7: NEUMORPHISM — 2 themes', '// FAMILY 7: NEUMORPHISM — 1 theme');
result = result.replace('// FAMILY 11: HIGH-CONTRAST DARK — 2 themes', '// FAMILY 11: HIGH-CONTRAST DARK — 1 theme');
result = result.replace('// FAMILY 12: SKEUOMORPHIC PAPER — 2 themes', '// FAMILY 12: SKEUOMORPHIC PAPER — 1 theme');

writeFileSync("src/lib/theme-presets.js", result);
console.log("Themes removed and comments fixed!");