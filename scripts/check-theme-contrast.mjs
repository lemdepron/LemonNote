// Theme contrast and distinctiveness checker
// Run: node scripts/check-theme-contrast.mjs (from project folder)
// Exits with code 1 if any theme fails WCAG AA (4.5:1) or distinctiveness threshold.

import { readFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// Remove single-line comments
function stripComments(str) {
  return str.replace(/\/\/.*$/gm, '');
}

// Find the matching closing brace for an object starting at startIdx
function findMatchingBrace(str, startIdx) {
  if (str[startIdx] !== '{') return -1;
  let depth = 0;
  for (let i = startIdx; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

// Extract theme arrays
function extractArray(name, str) {
  const startIdx = str.indexOf(`const ${name} = [`);
  if (startIdx === -1) return [];
  
  // Find the matching closing bracket for the array
  let bracketCount = 0;
  let endIdx = -1;
  for (let i = startIdx; i < str.length; i++) {
    if (str[i] === '[') bracketCount++;
    else if (str[i] === ']') {
      bracketCount--;
      if (bracketCount === 0) {
        endIdx = i;
        break;
      }
    }
  }
  if (endIdx === -1) return [];
  
  const arrStr = str.slice(startIdx, endIdx + 1);
  return parseThemeArray(arrStr);
}

function parseThemeArray(arrStr) {
  const themes = [];
  const cleanStr = stripComments(arrStr);
  
  // Find all theme objects by looking for "id:" pattern and then parsing the full object
  let searchIdx = 0;
  while (true) {
    const idIdx = cleanStr.indexOf('id:', searchIdx);
    if (idIdx === -1) break;
    
    // Find the start of this object (the { before id:)
    let objStart = idIdx;
    while (objStart > 0 && cleanStr[objStart] !== '{') objStart--;
    if (cleanStr[objStart] !== '{') break;
    
    // Find the matching closing brace
    const objEnd = findMatchingBrace(cleanStr, objStart);
    if (objEnd === -1) break;
    
    const objStr = cleanStr.slice(objStart, objEnd + 1);
    const theme = parseThemeObject(objStr);
    if (theme) themes.push(theme);
    
    searchIdx = objEnd + 1;
  }
  return themes;
}

function parseThemeObject(objStr) {
  // Extract id, name, surface
  const idMatch = objStr.match(/id:\s*"([^"]+)"/);
  const nameMatch = objStr.match(/name:\s*"([^"]+)"/);
  const surfaceMatch = objStr.match(/surface:\s*"([^"]+)"/);
  if (!idMatch || !nameMatch || !surfaceMatch) return null;
  
  const id = idMatch[1];
  const name = nameMatch[1];
  const surface = surfaceMatch[1];
  
  // Find light object
  const lightIdx = objStr.indexOf('light:');
  if (lightIdx === -1) return null;
  const lightBraceStart = objStr.indexOf('{', lightIdx);
  const lightBraceEnd = findMatchingBrace(objStr, lightBraceStart);
  if (lightBraceEnd === -1) return null;
  const lightStr = objStr.slice(lightBraceStart, lightBraceEnd + 1);
  
  // Find dark object
  const darkIdx = objStr.indexOf('dark:');
  if (darkIdx === -1) return null;
  const darkBraceStart = objStr.indexOf('{', darkIdx);
  const darkBraceEnd = findMatchingBrace(objStr, darkBraceStart);
  if (darkBraceEnd === -1) return null;
  const darkStr = objStr.slice(darkBraceStart, darkBraceEnd + 1);
  
  const parseTokens = (tokenStr) => {
    const tokens = {};
    const tokenRegex = /"--([^"]+)":\s*"([^"]+)"/g;
    let tokenMatch;
    while ((tokenMatch = tokenRegex.exec(tokenStr)) !== null) {
      tokens[`--${tokenMatch[1]}`] = tokenMatch[2];
    }
    return tokens;
  };
  
  return {
    id,
    name,
    surface,
    tokens: {
      light: parseTokens(lightStr),
      dark: parseTokens(darkStr),
    },
  };
}

const FRUIT_THEMES = extractArray("FRUIT_THEMES", source);
const PAPER_INK_THEMES = extractArray("PAPER_INK_THEMES", source);
const NATURE_THEMES = extractArray("NATURE_THEMES", source);
const NEON_NIGHT_THEMES = extractArray("NEON_NIGHT_THEMES", source);
const MONO_THEMES = extractArray("MONO_THEMES", source);

const ALL_THEMES = [
  ...FRUIT_THEMES,
  ...PAPER_INK_THEMES,
  ...NATURE_THEMES,
  ...NEON_NIGHT_THEMES,
  ...MONO_THEMES,
];

console.log(`Found ${ALL_THEMES.length} themes (excluding notecraft default)`);
console.log(`  Fruit: ${FRUIT_THEMES.length}`);
console.log(`  Paper & Ink: ${PAPER_INK_THEMES.length}`);
console.log(`  Nature: ${NATURE_THEMES.length}`);
console.log(`  Neon & Night: ${NEON_NIGHT_THEMES.length}`);
console.log(`  Mono: ${MONO_THEMES.length}`);

// Color utilities
function parseHSL(str) {
  return str.trim().split(/\s+/).map(parseFloat);
}

function hslToRgb([h, s, l]) {
  const sat = s / 100;
  const lig = l / 100;
  const k = (n) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n) => lig - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)];
}

const linear = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

function luminance([h, s, l]) {
  const [r, g, b] = hslToRgb([h, s, l]).map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastOf(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function colorDistance(hsl1, hsl2) {
  const [h1, s1, l1] = hsl1;
  const [h2, s2, l2] = hsl2;
  const dh = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));
  return Math.sqrt(dh*dh + (s1-s2)*(s1-s2) + (l1-l2)*(l1-l2));
}

// WCAG AA threshold
const AA_THRESHOLD = 4.5;
// Distinctiveness threshold (HSL distance)
const DISTINCT_THRESHOLD = 12;

let failures = 0;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failures++;
}

function pass(msg) {
  console.log(`PASS: ${msg}`);
}

// Check each preset
console.log("\n=== WCAG AA Contrast Checks ===");
ALL_THEMES.forEach(preset => {
  ["light", "dark"].forEach(mode => {
    const tokens = preset.tokens[mode];
    if (!tokens || !tokens["--background"] || !tokens["--foreground"]) return;

    const bg = parseHSL(tokens["--background"]);
    const fg = parseHSL(tokens["--foreground"]);
    const card = parseHSL(tokens["--card"]);
    const primary = parseHSL(tokens["--primary"]);
    const primaryFg = parseHSL(tokens["--primary-foreground"]);
    const link = parseHSL(tokens["--link"]);

    // Text on page
    const textPage = contrastOf(fg, bg);
    if (textPage < AA_THRESHOLD) fail(`${preset.name} (${mode}): text/page = ${textPage.toFixed(2)} < ${AA_THRESHOLD}`);

    // Text on card
    const textCard = contrastOf(fg, card);
    if (textCard < AA_THRESHOLD) fail(`${preset.name} (${mode}): text/card = ${textCard.toFixed(2)} < ${AA_THRESHOLD}`);

    // Button text on button
    const buttonText = contrastOf(primaryFg, primary);
    if (buttonText < AA_THRESHOLD) fail(`${preset.name} (${mode}): button-text/button = ${buttonText.toFixed(2)} < ${AA_THRESHOLD}`);

    // Link on page
    const linkPage = contrastOf(link, bg);
    if (linkPage < AA_THRESHOLD) fail(`${preset.name} (${mode}): link/page = ${linkPage.toFixed(2)} < ${AA_THRESHOLD}`);
  });
});

// Distinctiveness check
console.log("\n=== Distinctiveness Checks (threshold: " + DISTINCT_THRESHOLD + ") ===");
let duplicatePairs = 0;

for (let i = 0; i < ALL_THEMES.length; i++) {
  for (let j = i + 1; j < ALL_THEMES.length; j++) {
    const t1 = ALL_THEMES[i];
    const t2 = ALL_THEMES[j];
    ["light", "dark"].forEach(mode => {
      const tokens1 = t1.tokens[mode];
      const tokens2 = t2.tokens[mode];
      if (!tokens1 || !tokens2) return;

      const d1 = colorDistance(parseHSL(tokens1["--primary"]), parseHSL(tokens2["--primary"]));
      const d2 = colorDistance(parseHSL(tokens1["--background"]), parseHSL(tokens2["--background"]));
      const avgDist = (d1 + d2) / 2;
      if (avgDist < DISTINCT_THRESHOLD) {
        duplicatePairs++;
        fail(`${t1.name} ~ ${t2.name} (${mode}): distance = ${avgDist.toFixed(2)} < ${DISTINCT_THRESHOLD}`);
      }
    });
  }
}

if (duplicatePairs === 0) {
  pass(`All ${ALL_THEMES.length} themes are sufficiently distinct (min distance >= ${DISTINCT_THRESHOLD})`);
}

// Summary
console.log(`\n=== Summary ===`);
if (failures === 0) {
  console.log("ALL CHECKS PASSED");
  process.exit(0);
} else {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}