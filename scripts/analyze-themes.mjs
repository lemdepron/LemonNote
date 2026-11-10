// Analysis script to compute theme distances and categorize presets
import { readFileSync } from "node:fs";

// Read the theme-presets.js and extract the SPEC and PAIRS
const source = readFileSync("src/lib/theme-presets.js", "utf8");

// Parse the SPEC array
const specMatch = source.match(/const SPEC = \[([\s\S]*?)\];/);
const pairsMatch = source.match(/const PAIRS = \[([\s\S]*?)\];/);

function parseSpec(specStr) {
  const entries = [];
  const regex = /\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*(\d+),\s*(\d+),\s*(\d+)\]/g;
  let match;
  while ((match = regex.exec(specStr)) !== null) {
    entries.push({
      id: match[1],
      name: match[2],
      mode: match[3],
      surface: match[4],
      hue: parseInt(match[5]),
      paper: parseInt(match[6]),
      ink: parseInt(match[7])
    });
  }
  return entries;
}

function parsePairs(pairsStr) {
  const entries = [];
  const pairRegex = /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*surface:\s*"([^"]+)",\s*light:\s*\{([\s\S]*?)\},\s*dark:\s*\{([\s\S]*?)\}\s*\}/g;
  let match;
  while ((match = pairRegex.exec(pairsStr)) !== null) {
    const lightStr = match[4];
    const darkStr = match[5];
    
    const parseColorObj = (str) => {
      const obj = {};
      const colorRegex = /(\w+):\s*\[(\d+),\s*(\d+),\s*(\d+)\]/g;
      let m;
      while ((m = colorRegex.exec(str)) !== null) {
        obj[m[1]] = [parseInt(m[2]), parseInt(m[3]), parseInt(m[4])];
      }
      return obj;
    };
    
    entries.push({
      id: match[1],
      name: match[2],
      surface: match[3],
      light: parseColorObj(lightStr),
      dark: parseColorObj(darkStr)
    });
  }
  return entries;
}

const SPEC = parseSpec(specMatch[1]);
const PAIRS = parsePairs(pairsMatch[1]);

console.log(`SPEC (single-mode): ${SPEC.length} presets`);
console.log(`PAIRS (dual-mode): ${PAIRS.length} presets`);

// Token generation functions from theme-presets.js
const mod = (value) => ((value % 360) + 360) % 360;
const ch = (h, s, l) => `${h} ${s}% ${l}%`;

function lightTokens({ hue, paper, ink }) {
  const link = mod(hue + 152);
  return {
    "--background": ch(paper, 32, 96),
    "--foreground": ch(ink, 26, 12),
    "--card": ch(paper, 26, 92),
    "--primary": ch(hue, 68, 35),
    "--link": ch(link, 72, 25),
  };
}

function darkTokens({ hue, paper, ink }) {
  const link = mod(hue + 158);
  return {
    "--background": ch(hue, 22, 6),
    "--foreground": ch(paper, 16, 92),
    "--card": ch(hue, 18, 8.5),
    "--primary": ch(hue, 58, 68),
    "--link": ch(link, 46, 64),
  };
}

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

// Compute color distance in HSL space (simple Euclidean)
function colorDistance(hsl1, hsl2) {
  const [h1, s1, l1] = hsl1;
  const [h2, s2, l2] = hsl2;
  const dh = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));
  return Math.sqrt(dh*dh + (s1-s2)*(s1-s2) + (l1-l2)*(l1-l2));
}

// Get primary and background colors for a preset
function getPresetColors(preset) {
  if (preset.mode === "light") {
    const tokens = lightTokens({ hue: preset.hue, paper: preset.paper, ink: preset.ink });
    return {
      mode: "light",
      primary: parseHSL(tokens["--primary"]),
      background: parseHSL(tokens["--background"]),
      foreground: parseHSL(tokens["--foreground"]),
      card: parseHSL(tokens["--card"]),
      link: parseHSL(tokens["--link"]),
    };
  } else if (preset.mode === "dark") {
    const tokens = darkTokens({ hue: preset.hue, paper: preset.paper, ink: preset.ink });
    return {
      mode: "dark",
      primary: parseHSL(tokens["--primary"]),
      background: parseHSL(tokens["--background"]),
      foreground: parseHSL(tokens["--foreground"]),
      card: parseHSL(tokens["--card"]),
      link: parseHSL(tokens["--link"]),
    };
  } else {
    const lightTokens_ = lightTokens({ hue: preset.hue, paper: preset.paper, ink: preset.ink });
    const darkTokens_ = darkTokens({ hue: preset.hue, paper: preset.paper, ink: preset.ink });
    return {
      mode: "both",
      light: {
        primary: parseHSL(lightTokens_["--primary"]),
        background: parseHSL(lightTokens_["--background"]),
        foreground: parseHSL(lightTokens_["--foreground"]),
        card: parseHSL(lightTokens_["--card"]),
        link: parseHSL(lightTokens_["--link"]),
      },
      dark: {
        primary: parseHSL(darkTokens_["--primary"]),
        background: parseHSL(darkTokens_["--background"]),
        foreground: parseHSL(darkTokens_["--foreground"]),
        card: parseHSL(darkTokens_["--card"]),
        link: parseHSL(darkTokens_["--link"]),
      }
    };
  }
}

function getPairColors(pair) {
  return {
    id: pair.id,
    name: pair.name,
    surface: pair.surface,
    light: {
      primary: pair.light.primary,
      background: pair.light.bg,
      foreground: pair.light.fg,
      card: pair.light.card || pair.light.bg,
      link: pair.light.link,
    },
    dark: {
      primary: pair.dark.primary,
      background: pair.dark.bg,
      foreground: pair.dark.fg,
      card: pair.dark.card || pair.dark.bg,
      link: pair.dark.link,
    }
  };
}

// Analyze all presets
console.log("\n=== SINGLE-MODE PRESETS ===");
SPEC.forEach(p => {
  const colors = getPresetColors(p);
  console.log(`${p.id} | ${p.name} | ${p.mode} | ${p.surface} | primary: ${colors.primary.join(" ")} | bg: ${colors.background.join(" ")}`);
});

console.log("\n=== DUAL-MODE PRESETS ===");
PAIRS.forEach(p => {
  const colors = getPairColors(p);
  console.log(`${p.id} | ${p.name} | both | ${p.surface}`);
  console.log(`  LIGHT: primary: ${colors.light.primary.join(" ")} | bg: ${colors.light.background.join(" ")}`);
  console.log(`  DARK:  primary: ${colors.dark.primary.join(" ")} | bg: ${colors.dark.background.join(" ")}`);
});

// Compute pairwise distances for light themes
console.log("\n=== PAIRWISE DISTANCES (LIGHT THEMES) ===");
const lightThemes = [];
SPEC.filter(p => p.mode === "light").forEach(p => {
  const c = getPresetColors(p);
  lightThemes.push({ id: p.id, name: p.name, primary: c.primary, bg: c.background });
});
PAIRS.forEach(p => {
  const c = getPairColors(p);
  lightThemes.push({ id: p.id, name: p.name, primary: c.light.primary, bg: c.light.background });
});

console.log(`Total light themes: ${lightThemes.length}`);

const THRESHOLD = 8;
console.log(`\nNear-duplicates (distance < ${THRESHOLD}):`);
for (let i = 0; i < lightThemes.length; i++) {
  for (let j = i + 1; j < lightThemes.length; j++) {
    const d1 = colorDistance(lightThemes[i].primary, lightThemes[j].primary);
    const d2 = colorDistance(lightThemes[i].bg, lightThemes[j].bg);
    const avgDist = (d1 + d2) / 2;
    if (avgDist < THRESHOLD) {
      console.log(`  ${lightThemes[i].id} (${lightThemes[i].name}) ~ ${lightThemes[j].id} (${lightThemes[j].name}): dist=${avgDist.toFixed(2)}`);
    }
  }
}

// Same for dark themes
console.log("\n=== PAIRWISE DISTANCES (DARK THEMES) ===");
const darkThemes = [];
SPEC.filter(p => p.mode === "dark").forEach(p => {
  const c = getPresetColors(p);
  darkThemes.push({ id: p.id, name: p.name, primary: c.primary, bg: c.background });
});
PAIRS.forEach(p => {
  const c = getPairColors(p);
  darkThemes.push({ id: p.id, name: p.name, primary: c.dark.primary, bg: c.dark.background });
});

console.log(`Total dark themes: ${darkThemes.length}`);

console.log(`\nNear-duplicates (distance < ${THRESHOLD}):`);
for (let i = 0; i < darkThemes.length; i++) {
  for (let j = i + 1; j < darkThemes.length; j++) {
    const d1 = colorDistance(darkThemes[i].primary, darkThemes[j].primary);
    const d2 = colorDistance(darkThemes[i].bg, darkThemes[j].bg);
    const avgDist = (d1 + d2) / 2;
    if (avgDist < THRESHOLD) {
      console.log(`  ${darkThemes[i].id} (${darkThemes[i].name}) ~ ${darkThemes[j].id} (${darkThemes[j].name}): dist=${avgDist.toFixed(2)}`);
    }
  }
}

// Print all themes in a table format
console.log("\n=== ALL LIGHT THEMES TABLE ===");
lightThemes.forEach(t => {
  console.log(`${t.id} | ${t.name} | primary: ${t.primary[0]} ${t.primary[1]}% ${t.primary[2]}% | bg: ${t.bg[0]} ${t.bg[1]}% ${t.bg[2]}%`);
});

console.log("\n=== ALL DARK THEMES TABLE ===");
darkThemes.forEach(t => {
  console.log(`${t.id} | ${t.name} | primary: ${t.primary[0]} ${t.primary[1]}% ${t.primary[2]}% | bg: ${t.bg[0]} ${t.bg[1]}% ${t.bg[2]}%`);
});