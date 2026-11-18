// Comprehensive i18n checker for LemonNote - FIXED VERSION
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
// Note: keys include trailing dot because regex captures "family." pattern
const TEMPLATE_FAMILIES = {
  "rail.spaces.": ["vault", "journal", "tasks", "cards", "graph", "canvas", "tables", "code", "queries", "extensions", "sync", "settings"],
  "vault.canvas.status.": ["idle", "saving", "saved"],
  "vault.code.status.": ["idle", "saving", "saved"],
  "vault.tables.status.": ["idle", "saving", "saved"],
  "vault.tables.columnTypes.": ["text", "number", "select", "date", "checkbox", "relation"],
  "vault.tasks.filters.": ["ALL", "TODAY", "THIS_WEEK", "OVERDUE", "NO_DATE"],
  "vault.tasks.states.": ["TODO", "DOING", "DONE"],
  "vault.recent.": ["today", "week", "month"],
  "lang.": ["en", "ar", "es", "fr", "de", "zh", "ja", "ko", "pt", "ru", "it", "nl", "tr", "pl", "hi"],
  "digits.": ["latin", "arabicind"],
  "ribbon.tabs.": ["home", "ink", "insert", "design", "layout", "view", "share", "table", "code"],
};

// Verify ALL template family keys exist in en.json
for (const [family, variants] of Object.entries(TEMPLATE_FAMILIES)) {
  for (const variant of variants) {
    const key = `${family}${variant}`;
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
  
  // Untranslated strings (same as English)
  for (const key of locPaths) {
    if (enPaths.has(key)) {
      const enVal = getValue(en, key);
      const locVal = getValue(loc, key);
      if (typeof enVal === "string" && typeof locVal === "string" && locVal === enVal) {
        fail(`untranslated (same as English): ${key} = "${enVal}" in ${locFile}`);
      }
    }
  }
  
  // Placeholder mismatches
  for (const key of locPaths) {
    if (enPaths.has(key)) {
      const enVal = getValue(en, key);
      const locVal = getValue(loc, key);
      if (typeof enVal === "string" && typeof locVal === "string") {
        const enPlaceholders = enVal.match(/\{[^}]+\}/g) || [];
        const locPlaceholders = locVal.match(/\{[^}]+\}/g) || [];
        if (enPlaceholders.length !== locPlaceholders.length ||
            !enPlaceholders.every((p, i) => p === locPlaceholders[i])) {
          fail(`placeholder mismatch in ${locFile}: ${key} — en has [${enPlaceholders.join(", ")}], ${locFile} has [${locPlaceholders.join(", ")}]`);
        }
      }
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

// Helper to strip comments (single-line and multi-line)
function stripComments(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, "") // multi-line comments
    .replace(/\/\/.*$/gm, ""); // single-line comments
}

for (const file of sourceFiles) {
  const content = stripComments(readFileSync(file, "utf8"));
  let match;
  while ((match = keyRegex.exec(content)) !== null) {
    const key = match[1];
    usedKeys.add(key);
    if (!usedKeysByFile.has(key)) usedKeysByFile.set(key, []);
    usedKeysByFile.get(key).push(file);
  }
}

// Key used in code but missing in en.json (skip template family keys ending with .)
for (const key of usedKeys) {
  if (key.endsWith(".")) continue; // template families handled separately
  if (!enPaths.has(key)) {
    const files = usedKeysByFile.get(key).join(", ");
    fail(`key used in code but missing in en.json: ${key} (in ${files})`);
  }
}

// Template family used in code but not declared in checker
const templateFamilyRegex = /(?:^|[^a-zA-Z0-9_])(?:t|tr|i18n\.t)\(\s*["']([a-z][a-z0-9_.]*\.)["']/g;
const usedTemplateFamilies = new Set();
const usedTemplateFamiliesByFile = new Map();

for (const file of sourceFiles) {
  const content = stripComments(readFileSync(file, "utf8"));
  let match;
  while ((match = templateFamilyRegex.exec(content)) !== null) {
    const family = match[1];
    usedTemplateFamilies.add(family);
    if (!usedTemplateFamiliesByFile.has(family)) usedTemplateFamiliesByFile.set(family, []);
    usedTemplateFamiliesByFile.get(family).push(file);
  }
}

for (const family of usedTemplateFamilies) {
  if (!TEMPLATE_FAMILIES[family]) {
    const files = usedTemplateFamiliesByFile.get(family).join(", ");
    fail(`template family used in code but not declared in checker: ${family} (in ${files})`);
  }
}

console.log(`\n=== PER-LANGUAGE SUMMARY ===`);
for (const locFile of locales) {
  const loc = JSON.parse(readFileSync(`src/lib/locales/${locFile}`, "utf8"));
  const locPaths = new Set(paths(loc));
  let missing = 0, extra = 0, empty = 0, sameAsEn = 0;
  
  for (const key of enPaths) if (!locPaths.has(key)) missing++;
  for (const key of locPaths) if (!enPaths.has(key)) extra++;
  for (const key of locPaths) {
    const value = getValue(loc, key);
    if (typeof value !== "string" || value.trim() === "") empty++;
    if (enPaths.has(key) && getValue(loc, key) === getValue(en, key)) sameAsEn++;
  }
  
  console.log(`${locFile}: total=${locPaths.size}, missing=${missing}, extra=${extra}, empty=${empty}, same-as-en=${sameAsEn}`);
}

console.log(`\n=== TEMPLATE FAMILIES CHECKED ===`);
for (const [family, variants] of Object.entries(TEMPLATE_FAMILIES)) {
  console.log(`${family}: ${variants.length} variants (${variants.join(", ")})`);
}

console.log(`\n${failures} failure(s)`);

if (failures > 0) process.exit(1);