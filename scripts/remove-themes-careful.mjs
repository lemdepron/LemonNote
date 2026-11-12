// Carefully remove themes by parsing the JavaScript structure
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

const THEMES_TO_REMOVE = [
  { family: 'PASTEL_THEMES', id: 'pastel-evening' },
  { family: 'GRADIENT_DUOTONE_THEMES', id: 'duo-ocean' },
  { family: 'NEUMORPHISM_THEMES', id: 'neu-deep' },
  { family: 'HIGH_CONTRAST_THEMES', id: 'hc-dark-pure' },
  { family: 'SKEUOMORPHIC_THEMES', id: 'paper-vellum' },
];

function removeThemeFromFamily(source, familyName, themeId) {
  // Find the family array
  const familyStart = source.indexOf(`const ${familyName} = [`);
  if (familyStart === -1) return { source, removed: false };
  
  // Find the end of the family array
  let bracketCount = 0;
  let familyEnd = -1;
  for (let i = familyStart; i < source.length; i++) {
    if (source[i] === '[') bracketCount++;
    else if (source[i] === ']') {
      bracketCount--;
      if (bracketCount === 0) {
        familyEnd = i;
        break;
      }
    }
  }
  if (familyEnd === -1) return { source, removed: false };
  
  const familyStr = source.slice(familyStart, familyEnd + 1);
  
  // Find the theme within the family
  let searchPos = 0;
  while (true) {
    const commentPos = familyStr.indexOf(`// `, searchPos);
    if (commentPos === -1) break;
    
    const idPos = familyStr.indexOf(`id: "${themeId}"`, commentPos);
    if (idPos !== -1 && idPos - commentPos < 200) {
      const themeStart = commentPos;
      let bracePos = idPos;
      while (bracePos < familyStr.length && familyStr[bracePos] !== '{') bracePos++;
      
      let depth = 0;
      let themeEnd = -1;
      for (let i = bracePos; i < familyStr.length; i++) {
        if (familyStr[i] === '{') depth++;
        else if (familyStr[i] === '}') {
          depth--;
          if (depth === 0) {
            themeEnd = i;
            break;
          }
        }
      }
      
      if (themeEnd !== -1) {
        let endPos = themeEnd + 1;
        if (endPos < familyStr.length && familyStr[endPos] === ',') endPos++;
        const newFamilyStr = familyStr.slice(0, themeStart) + familyStr.slice(endPos);
        const newSource = source.slice(0, familyStart) + newFamilyStr + source.slice(familyEnd + 1);
        return { source: newSource, removed: true };
      }
      break;
    }
    searchPos = commentPos + 1;
  }
  
  return { source, removed: false };
}

let result = source;
let totalRemoved = 0;

for (const { family, id } of THEMES_TO_REMOVE) {
  const { source: newSource, removed } = removeThemeFromFamily(result, family, id);
  result = newSource;
  if (removed) {
    console.log(`Removed ${id} from ${family}`);
    totalRemoved++;
  } else {
    console.log(`Failed to remove ${id} from ${family}`);
  }
}

// Fix family comments
result = result.replace('// FAMILY 5: SOFT PASTEL / ORGANIC — 2 themes', '// FAMILY 5: SOFT PASTEL / ORGANIC — 1 theme');
result = result.replace('// FAMILY 6: GRADIENT DUOTONE — 2 themes', '// FAMILY 6: GRADIENT DUOTONE — 1 theme');
result = result.replace('// FAMILY 7: NEUMORPHISM — 2 themes', '// FAMILY 7: NEUMORPHISM — 1 theme');
result = result.replace('// FAMILY 11: HIGH-CONTRAST DARK — 2 themes', '// FAMILY 11: HIGH-CONTRAST DARK — 1 theme');
result = result.replace('// FAMILY 12: SKEUOMORPHIC PAPER — 2 themes', '// FAMILY 12: SKEUOMORPHIC PAPER — 1 theme');

writeFileSync("src/lib/theme-presets.js", result);
console.log(`Total removed: ${totalRemoved}`);