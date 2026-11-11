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

// Extract all new theme families
const GLASS_LIGHT_THEMES = extractArray("GLASS_LIGHT_THEMES", source);
const GLASS_DARK_THEMES = extractArray("GLASS_DARK_THEMES", source);
const NEUBRUTALISM_THEMES = extractArray("NEUBRUTALISM_THEMES", source);
const EDITORIAL_THEMES = extractArray("EDITORIAL_THEMES", source);
const PASTEL_THEMES = extractArray("PASTEL_THEMES", source);
const GRADIENT_DUOTONE_THEMES = extractArray("GRADIENT_DUOTONE_THEMES", source);
const NEUMORPHISM_THEMES = extractArray("NEUMORPHISM_THEMES", source);
const CYBERPUNK_THEMES = extractArray("CYBERPUNK_THEMES", source);
const BAUHAUS_THEMES = extractArray("BAUHAUS_THEMES", source);
const CLAYMORPHISM_THEMES = extractArray("CLAYMORPHISM_THEMES", source);
const HIGH_CONTRAST_THEMES = extractArray("HIGH_CONTRAST_THEMES", source);
const SKEUOMORPHIC_THEMES = extractArray("SKEUOMORPHIC_THEMES", source);

const ALL_THEMES = [
  ...GLASS_LIGHT_THEMES,
  ...GLASS_DARK_THEMES,
  ...NEUBRUTALISM_THEMES,
  ...EDITORIAL_THEMES,
  ...PASTEL_THEMES,
  ...GRADIENT_DUOTONE_THEMES,
  ...NEUMORPHISM_THEMES,
  ...CYBERPUNK_THEMES,
  ...BAUHAUS_THEMES,
  ...CLAYMORPHISM_THEMES,
  ...HIGH_CONTRAST_THEMES,
  ...SKEUOMORPHIC_THEMES,
];

console.log(`Found ${ALL_THEMES.length} themes (excluding notecraft default)`);
console.log(`  Glass Light: ${GLASS_LIGHT_THEMES.length}`);
console.log(`  Glass Dark: ${GLASS_DARK_THEMES.length}`);
console.log(`  Neubrutalism: ${NEUBRUTALISM_THEMES.length}`);
console.log(`  Editorial: ${EDITORIAL_THEMES.length}`);
console.log(`  Soft Pastel: ${PASTEL_THEMES.length}`);
console.log(`  Gradient Duotone: ${GRADIENT_DUOTONE_THEMES.length}`);
console.log(`  Neumorphism: ${NEUMORPHISM_THEMES.length}`);
console.log(`  Cyberpunk: ${CYBERPUNK_THEMES.length}`);
console.log(`  Bauhaus: ${BAUHAUS_THEMES.length}`);
console.log(`  Claymorphism: ${CLAYMORPHISM_THEMES.length}`);
console.log(`  High Contrast: ${HIGH_CONTRAST_THEMES.length}`);
console.log(`  Skeuomorphic: ${SKEUOMORPHIC_THEMES.length}`);

// Color utilities
function parseHSL(str) {
  // Handle HSL with alpha: "h s l" or "h s l / a"
  const cleaned = str.replace(/\s*\/\s*[\d.]+$/, '').trim();
  return cleaned.split(/\s+/).map(parseFloat);
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

// Parse gradient stops for contrast sampling
function parseGradientStops(gradientStr) {
  if (!gradientStr || gradientStr === 'none') return [];
  // Simple parser for linear-gradient and radial-gradient
  // Extract color stops - this is a simplified version
  const stops = [];
  const colorRegex = /hsl\(([^)]+)\)/g;
  let match;
  while ((match = colorRegex.exec(gradientStr)) !== null) {
    stops.push(parseHSL(match[1]));
  }
  return stops;
}

// Sample gradient at multiple points for contrast checking
function sampleGradientContrast(gradientStr, fgHSL) {
  const stops = parseGradientStops(gradientStr);
  if (stops.length < 2) return Infinity;
  
  // Sample 9 points across the gradient
  const samples = 9;
  let minContrast = Infinity;
  
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    // Simple linear interpolation between first and last stop
    const h = stops[0][0] + (stops[stops.length - 1][0] - stops[0][0]) * t;
    const s = stops[0][1] + (stops[stops.length - 1][1] - stops[0][1]) * t;
    const l = stops[0][2] + (stops[stops.length - 1][2] - stops[0][2]) * t;
    const bgSample = [h, s, l];
    const contrast = contrastOf(fgHSL, bgSample);
    if (contrast < minContrast) minContrast = contrast;
  }
  
  return minContrast;
}

// Compute effective card background with surface opacity
function computeEffectiveCard(cardHSL, opacity) {
  // For simplicity, assume white/black page background
  // In reality this would composite with the page background
  // Here we just return the card color as-is since opacity is handled in CSS
  return cardHSL;
}

// Check neumorphic shadow contrast (raised vs pressed states)
function checkNeumorphicContrast(tokens, mode) {
  const bg = parseHSL(tokens["--background"]);
  const fg = parseHSL(tokens["--foreground"]);
  const shadow = parseHSL(tokens["--shadow"]);
  const scrim = parseHSL(tokens["--scrim"]);
  
  // Neumorphic raised: light shadow on top-left, dark shadow on bottom-right
  // Text must be readable on the "raised" surface (which is same as card)
  const card = parseHSL(tokens["--card"]);
  const textOnCard = contrastOf(fg, card);
  
  // For pressed state, the surface appears darker (inset shadow)
  // Simulate pressed surface by darkening card
  const pressedCard = [card[0], card[1], Math.max(0, card[2] - 10)];
  const textOnPressed = contrastOf(fg, pressedCard);
  
  return { textOnCard, textOnPressed };
}

// Check glass contrast with backdrop blur
function checkGlassContrast(tokens, mode) {
  const bg = parseHSL(tokens["--background"]);
  const fg = parseHSL(tokens["--foreground"]);
  const card = parseHSL(tokens["--card"]);
  
  // Card may have alpha - extract it
  const cardStr = tokens["--card"] || "";
  const alphaMatch = cardStr.match(/\/\s*([\d.]+)/);
  const opacity = alphaMatch ? parseFloat(alphaMatch[1]) : 1;
  
  // Effective card color when composited over background
  // Simplified: blend card with background at given opacity
  const cardRgb = hslToRgb(card);
  const bgRgb = hslToRgb(bg);
  const effectiveRgb = cardRgb.map((c, i) => c * opacity + bgRgb[i] * (1 - opacity));
  
  // Convert back to luminance
  const effectiveLum = 0.2126 * linear(effectiveRgb[0]) + 0.7152 * linear(effectiveRgb[1]) + 0.0722 * linear(effectiveRgb[2]);
  const fgLum = luminance(fg);
  const contrast = (Math.max(effectiveLum, fgLum) + 0.05) / (Math.min(effectiveLum, fgLum) + 0.05);
  
  return contrast;
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
    const shadowStyle = tokens["--shadow-style"] || "soft";
    const blur = tokens["--blur"] || "0";
    const surfaceOpacity = tokens["--surface-opacity"] ? parseFloat(tokens["--surface-opacity"]) : 1;
    const bgGradient = tokens["--bg-gradient"] || tokens["--bg-gradient-dark"] || "none";

    // Text on page
    const textPage = contrastOf(fg, bg);
    if (textPage < AA_THRESHOLD) fail(`${preset.name} (${mode}): text/page = ${textPage.toFixed(2)} < ${AA_THRESHOLD}`);

    // Text on card (accounting for surface opacity for glass themes)
    let textCard;
    if (surfaceOpacity < 1 && (preset.id.startsWith("glass-") || preset.id.startsWith("paper-vellum"))) {
      textCard = checkGlassContrast(tokens, mode);
    } else {
      textCard = contrastOf(fg, card);
    }
    if (textCard < AA_THRESHOLD) fail(`${preset.name} (${mode}): text/card = ${textCard.toFixed(2)} < ${AA_THRESHOLD}`);

    // Button text on button
    const buttonText = contrastOf(primaryFg, primary);
    if (buttonText < AA_THRESHOLD) fail(`${preset.name} (${mode}): button-text/button = ${buttonText.toFixed(2)} < ${AA_THRESHOLD}`);

    // Link on page
    const linkPage = contrastOf(link, bg);
    if (linkPage < AA_THRESHOLD) fail(`${preset.name} (${mode}): link/page = ${linkPage.toFixed(2)} < ${AA_THRESHOLD}`);

    // Gradient background contrast (sample multiple points)
    if (bgGradient !== "none") {
      const gradContrast = sampleGradientContrast(bgGradient, fg);
      if (gradContrast < AA_THRESHOLD) fail(`${preset.name} (${mode}): gradient text/page = ${gradContrast.toFixed(2)} < ${AA_THRESHOLD}`);
    }

    // Neumorphism specific checks
    if (shadowStyle === "neumorphic" || shadowStyle === "neumorphic-pressed") {
      const { textOnCard: neoCard, textOnPressed: neoPressed } = checkNeumorphicContrast(tokens, mode);
      if (neoCard < AA_THRESHOLD) fail(`${preset.name} (${mode}): neumorphic text/card = ${neoCard.toFixed(2)} < ${AA_THRESHOLD}`);
      if (neoPressed < AA_THRESHOLD) fail(`${preset.name} (${mode}): neumorphic pressed text/card = ${neoPressed.toFixed(2)} < ${AA_THRESHOLD}`);
    }

    // Focus ring contrast (ring on primary for buttons)
    if (tokens["--ring"] && tokens["--primary"]) {
      const ring = parseHSL(tokens["--ring"]);
      const ringOnPrimary = contrastOf(ring, primary);
      // Focus ring needs 3:1 against button background
      if (ringOnPrimary < 3) fail(`${preset.name} (${mode}): focus-ring/button = ${ringOnPrimary.toFixed(2)} < 3.0`);
    }

    // Border contrast for thick borders (UI components need 3:1)
    const borderWidth = tokens["--border-width"] || "1px";
    const borderWidthNum = parseFloat(borderWidth);
    if (borderWidthNum >= 2 && tokens["--border"]) {
      const border = parseHSL(tokens["--border"]);
      const borderOnBg = contrastOf(border, bg);
      if (borderOnBg < 3) fail(`${preset.name} (${mode}): border/background = ${borderOnBg.toFixed(2)} < 3.0 (thick border)`);
    }
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
  process.exit(0) 
} else {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}