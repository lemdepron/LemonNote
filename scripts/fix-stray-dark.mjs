// Fix the stray dark block in GRADIENT_DUOTONE_THEMES
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// Find the GRADIENT_DUOTONE_THEMES array and fix the stray dark block
const grStart = source.indexOf('const GRADIENT_DUOTONE_THEMES = [');
if (grStart === -1) {
  console.log("GRADIENT_DUOTONE_THEMES not found");
  process.exit(1);
}

// Find the end of the GRADIENT_DUOTONE_THEMES array
let bracketCount = 0;
let grEnd = -1;
for (let i = grStart; i < source.length; i++) {
  if (source[i] === '[') bracketCount++;
  else if (source[i] === ']') {
    bracketCount--;
    if (bracketCount === 0) {
      grEnd = i;
      break;
    }
  }
}

if (grEnd === -1) {
  console.log("Could not find end of GRADIENT_DUOTONE_THEMES");
  process.exit(1);
}

const grArray = source.slice(grStart, grEnd + 1);

// Check if there's a stray dark block after the first theme
// The structure should be: [ { light: {...}, dark: {...} } ]
// But there's a stray dark block after the first theme

// Find the first theme's closing
let braceCount = 0;
let firstThemeEnd = -1;
for (let i = 0; i < source.length; i++) {
  if (i >= grStart && i < grEnd) {
    if (source[i] === '{') bracketCount++;
    else if (source[i] === '}') {
      bracketCount--;
      if (bracketCount === 1 && firstThemeEnd === -1) {
        firstThemeEnd = i;
      }
    }
  }
}

if (firstThemeEnd !== -1) {
  // Check if there's a stray dark block after the first theme
  const afterFirstTheme = source.slice(firstThemeEnd + 1, grEnd);
  const strayDarkMatch = afterFirstTheme.match(/^\s*,\s*\n\s*dark: \{/);
  if (strayDarkMatch) {
    // Found stray dark block, remove it
    const strayStart = firstThemeEnd + 1 + strayDarkMatch.index;
    // Find the end of the stray dark block
    let braceCount = 0;
    let strayEnd = -1;
    for (let i = strayStart; i < source.length; i++) {
      if (source[i] === '{') bracketCount++;
      else if (source[i] === '}') {
        bracketCount--;
        if (bracketCount === 0) {
          strayEnd = i;
          break;
        }
      }
    }
    if (strayEnd !== -1) {
      // Find the end of the stray block (including trailing comma and whitespace)
      let endPos = strayEnd + 1;
      while (endPos < source.length && /\s/.test(source[endPos])) endPos++;
      if (endPos < source.length && source[endPos] === ',') endPos++;
      
      // Remove the stray block
      const result = source.slice(0, strayStart) + source.slice(endPos);
      writeFileSync("src/lib/theme-presets.js", result);
      console.log("Removed stray dark block!");
      process.exit(0);
    }
  }
}

console.log("No stray block found or could not fix");
process.exit(1);