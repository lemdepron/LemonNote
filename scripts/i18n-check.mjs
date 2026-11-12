// Comprehensive i18n checker for LemonNote
// Run: node scripts/i18n-check.mjs
import { readFileSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";

const en = JSON.parse(readFileSync("src/lib/locales/en.json", "utf8"));
const locales = readdirSync("src/lib/locales").filter(f => f.endsWith(".json") && f !== "en.json");

// Flatten object to dot-notation paths
const paths = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? paths(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  );

const getValue = (obj, key) => key.split(".").reduce((v, part) => v?.[part], obj);

let failures = 0;
const fail = (msg) => { console.error(`FAIL: ${msg}`); failures++; };
const warn = (msg) => { console.warn(`WARN: ${msg}`); };

const enPaths = new Set(paths(en));

// Template literal key families - these are dynamic keys that must have ALL variants in en.json
const TEMPLATE_FAMILIES = {
  "rail.spaces": ["vault", "journal", "tasks", "cards", "graph", "canvas", "tables", "code", "queries", "extensions", "sync", "settings"],
  "vault.canvas.status": ["idle", "saving", "saved"],
  "vault.code.status": ["idle", "saving", "saved"],
  "vault.tables.status": ["idle", "saving", "saved"],
  "vault.tables.columnTypes": ["text", "number", "select", "date", "checkbox", "relation"],
  "vault.tasks.filters": ["ALL", "TODAY", "THIS_WEEK", "OVERDUE", "NO_DATE"],
  "vault.tasks.states": ["TODO", "DOING", "DONE"],
  "vault.recent": ["today", "week", "month"],
  "lang": ["en", "ar", "es", "fr", "de", "zh", "ja", "ko", "pt", "ru", "it", "nl", "tr", "pl", "hi"],
  "digits": ["latin", "arabicind"],
};

// Verify ALL template family keys exist in en.json
for (const [family, variants] of Object.entries(TEMPLATE_FAMILIES)) {
  for (const variant of variants) {
    const key = `${family}.${variant}`;
    if (!enPaths.has(key)) {
      fail(`template family key missing in en.json: ${key}`);
    }
  }
}

// Check all locale files have all en keys, no empty values, no untranslated strings
for (const locFile of locales) {
  const loc = JSON.parse(readFileSync(`src/lib/locales/${locFile}`, "utf8"));
  const locPaths = new Set(paths(loc));
  
  // Missing keys
  for (const key of enPaths) {
    if (!locPaths.has(key)) {
      fail(`missing in ${locFile}: ${key}`);
    }
  }
  
  // Extra keys
  for (const key of locPaths) {
    if (!enPaths.has(key)) {
      fail(`extra in ${locFile}: ${key}`);
    }
  }
  
  // Empty values
  for (const key of locPaths) {
    const value = getValue(loc, key);
    if (typeof value !== "string" || value.trim() === "") {
      fail(`empty ${locFile} value: ${key}`);
    }
  }
}

// Scan source files for t("..."), tr("..."), i18n.t("...") calls with literal keys
function scanSourceFiles(dir, fileList = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", "dist", "src-tauri", ".git", "build"].includes(entry.name)) {
        scanSourceFiles(fullPath, fileList);
      }
    } else if ([".jsx", ".js", ".tsx", ".ts"].includes(extname(entry.name))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const sourceFiles = scanSourceFiles("src");
const keyRegex = /(?:^|[^a-zA-Z0-9_])(?:t|tr|i18n\.t)\(\s*["']([a-z][a-z0-9_.]*)["']/g;
const usedKeys = new Set();
const usedKeysByFile = new Map();

for (const file of sourceFiles) {
  const content = readFileSync(file, "utf8");
  let match;
  while ((match = keyRegex.exec(content)) !== null) {
    const key = match[1];
    usedKeys.add(key);
    if (!usedKeysByFile.has(key)) usedKeysByFile.set(key, []);
    usedKeysByFile.get(key).push(file);
  }
}

// Check literal keys used in code exist in en.json
for (const key of usedKeys) {
  if (!enPaths.has(key)) {
    const files = usedKeysByFile.get(key).join(", ");
    fail(`key used in code but missing in en.json: ${key} (in ${files})`);
  }
}

// Check template literal families in code
const templateRegex = /(?:^|[^a-zA-Z0-9_])(?:t|tr|i18n\.t)\(\s*`([^`]+)`/g;
const templateFamiliesInCode = new Map(); // family -> Set of files

for (const file of sourceFiles) {
  const content = readFileSync(file, "utf8");
  let match;
  while ((match = templateRegex.exec(content)) !== null) {
    const template = match[1];
    // Extract family prefix (everything before ${)
    const familyMatch = template.match(/^([a-z][a-z0-9_.]*?)\$\{/);
    if (familyMatch) {
      const family = familyMatch[1];
      if (!templateFamiliesInCode.has(family)) templateFamiliesInCode.set(family, new Set());
      templateFamiliesInCode.get(family).add(file);
    }
  }
}

// Verify all template families used in code are declared and have all variants
for (const [family, files] of templateFamiliesInCode) {
  if (!TEMPLATE_FAMILIES[family]) {
    fail(`template family used in code but not declared in checker: ${family} (in ${Array.from(files).join(", ")})`);
  }
}

// Values that are allowed to be "same as English" without being untranslated
// These are: CSS values, code samples, shortcuts, numbers, brand names, file extensions, URLs
const ALLOW_SAME_AS_EN_PATTERNS = [
  // CSS / code samples
  /^#[0-9a-fA-F]{3,8}$/,           // hex colors
  /^rgb\(/, /^rgba\(/, /^hsl\(/, /^hsla\(/, // CSS color functions
  /^[0-9]+(px|em|rem|vh|vw|%)$/,   // CSS units
  /^--[a-z-]+:/,                   // CSS variables
  /^[A-Z][a-z]+[A-Z][a-zA-Z]*$/,   // camelCase code identifiers
  /^[\w-]+:\s*[\w-]+$/,            // CSS property: value
  
  // Shortcuts
  /^(Ctrl|Alt|Shift|Meta|Cmd|Option|Ctrl\+|Alt\+|Shift\+|Meta\+|Cmd\+|Option\+)[A-Za-z0-9+\-]+$/,
  
  // Numbers / measurements
  /^[0-9]+(\.[0-9]+)?$/,           // plain numbers
  /^[0-9]+(\.[0-9]+)?\s*(px|em|rem|vh|vw|%|mm|cm|in|pt|pc)$/,
  
  // Brand names (single words that are proper nouns)
  /^(LemonNote|Markdown|HTML|PDF|CSV|JSON|CSS|JS|TS|UI|URL|API|AI|LLM|GitHub|Obsidian|Base64|WebP|APNG|GIF|PNG|JPG|JPEG|SVG|MP3|WAV|MP4|RTL|LTR|UTC|ISO|RGB|HEX|ID|UUID|GUID|OK|Yes|No|On|Off|Auto|None|Custom|Default|System|Min|Max|Avg|Sum|Count|Total)$/,
  
  // Language names (English and native)
  /^(English|Arabic|Russian|Chinese|Japanese|French|Persian|Hindi|Urdu|German|Spanish|Korean|Portuguese|Italian|Dutch|Turkish|Polish)$/,
  /^(العربية|Русский|中文|日本語|Français|فارسی|हिन्दी|اردو|Deutsch|Español|한국어|Português|Italiano|Nederlands|Türkçe|Polski)$/,
  
  // File extensions
  /^\.[a-z0-9]+$/,
  
  // URLs
  /^https?:\/\//,
  
  // Placeholders with only variable content
  /^\{[a-z]+\}$/,
  /^\{[a-z]+\}\s*[a-z]+$/,
];

function isAllowedSameAsEnglish(value) {
  const trimmed = value.trim();
  if (trimmed.length < 4) return true; // too short to be meaningful
  
  for (const pattern of ALLOW_SAME_AS_EN_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }
  return false;
}

// Check for untranslated strings (same as English, 4+ chars, not in allow-list)
let untranslatedCount = 0;
for (const key of enPaths) {
  const enValue = getValue(en, key);
  if (typeof enValue === "string" && enValue.trim().length >= 4) {
    for (const locFile of locales) {
      const loc = JSON.parse(readFileSync(`src/lib/locales/${locFile}`, "utf8"));
      const locValue = getValue(loc, key);
      if (enValue === locValue) {
        if (!isAllowedSameAsEnglish(enValue)) {
          fail(`untranslated (same as English): ${key} = "${enValue}" in ${locFile}`);
          untranslatedCount++;
          if (untranslatedCount >= 50) break;
        }
      }
    }
    if (untranslatedCount >= 50) break;
  }
}

// Check placeholder consistency across locales
const placeholderRegex = /\{\{?[a-zA-Z][a-zA-Z0-9_]*\}?\}/g;
function extractPlaceholders(str) {
  if (typeof str !== "string") return [];
  return [...str.matchAll(placeholderRegex)].map(m => m[0]).sort();
}

for (const key of enPaths) {
  const enValue = getValue(en, key);
  const enPlaceholders = extractPlaceholders(enValue);
  if (enPlaceholders.length === 0) continue;
  
  for (const locFile of locales) {
    const loc = JSON.parse(readFileSync(`src/lib/locales/${locFile}`, "utf8"));
    const locValue = getValue(loc, key);
    const locPlaceholders = extractPlaceholders(locValue);
    
    if (JSON.stringify(enPlaceholders) !== JSON.stringify(locPlaceholders)) {
      fail(`placeholder mismatch in ${locFile}: ${key} — en has [${enPlaceholders.join(", ")}], ${locFile} has [${locPlaceholders.join(", ")}]`);
    }
  }
}

// The Arabic-Indic digit map in i18n.js: 10 distinct digits ٠-٩ in order.
const i18nJsSource = readFileSync("src/lib/i18n.js", "utf8");
const match = i18nJsSource.match(/const AR_DIGITS = "([^"]+)"/);
if (!match) fail("AR_DIGITS not found in i18n.js");
else {
  const digits = [...match[1]];
  if (digits.length !== 10) fail(`AR_DIGITS has ${digits.length} chars, expected 10`);
  if (new Set(digits).size !== 10) fail("AR_DIGITS has repeated digits");
  const expected = [..."٠١٢٣٤٥٦٧٨٩"];
  if (match[1] !== "٠١٢٣٤٥٦٧٨٩") fail(`AR_DIGITS is ${match[1]}, expected ${expected.join("")}`);
}

// The note direction option "auto" must be accepted by the style whitelist.
const textStyleSource = readFileSync("src/lib/text-style.js", "utf8");
if (!/["']ltr["'],\s*["']rtl["'],\s*["']auto["']/.test(textStyleSource)) {
  fail("normalizeStyle does not accept dir \"auto\"");
}

// Per-language summary
console.log("\n=== PER-LANGUAGE SUMMARY ===");
for (const locFile of locales) {
  const loc = JSON.parse(readFileSync(`src/lib/locales/${locFile}`, "utf8"));
  const locPaths = new Set(paths(loc));
  
  let missing = 0, extra = 0, empty = 0, sameAsEn = 0;
  
  for (const key of enPaths) {
    if (!locPaths.has(key)) missing++;
  }
  for (const key of locPaths) {
    if (!enPaths.has(key)) extra++;
    const value = getValue(loc, key);
    if (typeof value !== "string" || value.trim() === "") empty++;
    const enValue = getValue(en, key);
    if (typeof enValue === "string" && enValue === value && enValue.trim().length >= 4 && !isAllowedSameAsEnglish(enValue)) {
      sameAsEn++;
    }
  }
  
  console.log(`${locFile}: total=${locPaths.size}, missing=${missing}, extra=${extra}, empty=${empty}, same-as-en=${sameAsEn}`);
}

console.log(`\n=== TEMPLATE FAMILIES CHECKED ===`);
for (const [family, variants] of Object.entries(TEMPLATE_FAMILIES)) {
  console.log(`${family}: ${variants.length} variants (${variants.join(", ")})`);
}

if (failures === 0) {
  console.log("\nOK: translations in sync, digit map and dir auto look right.");
} else {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}