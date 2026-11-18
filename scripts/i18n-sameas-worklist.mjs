// Generate translation worklist for "same-as-English" keys in a target language
// Usage: node scripts/i18n-sameas-worklist.mjs <lang> [batchSize=150]

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const [, , lang, batchSizeArg] = process.argv;
if (!lang) {
  console.error("Usage: node scripts/i18n-sameas-worklist.mjs <lang> [batchSize=150]");
  process.exit(1);
}
const batchSize = parseInt(batchSizeArg || "150", 10);

const en = JSON.parse(readFileSync("src/lib/locales/en.json", "utf8"));
const locPath = `src/lib/locales/${lang}.json`;
if (!existsSync(locPath)) {
  console.error(`Locale file not found: ${locPath}`);
  process.exit(1);
}
const loc = JSON.parse(readFileSync(locPath, "utf8"));

// Flatten object to dot-notation paths
function paths(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? paths(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  );
}

function getValue(obj, key) {
  return key.split(".").reduce((v, part) => v?.[part], obj);
}

function setValue(obj, key, value) {
  const parts = key.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in cur) || typeof cur[part] !== "object") cur[part] = {};
    cur = cur[part];
  }
  cur[parts[parts.length - 1]] = value;
}

const enPaths = new Set(paths(en));
const locPaths = new Set(paths(loc));

// Find keys in BOTH en and loc but with SAME value (untranslated)
const sameAsEnKeys = [...enPaths]
  .filter(k => locPaths.has(k))
  .filter(k => getValue(en, k) === getValue(loc, k))
  .sort();

console.log(`Found ${sameAsEnKeys.length} untranslated (same-as-English) keys for ${lang}`);

// Build flat object with English values
const workObj = {};
for (const key of sameAsEnKeys) {
  workObj[key] = getValue(en, key);
}

// Write batches
const outDir = "docs/i18n";
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

for (let i = 0; i < sameAsEnKeys.length; i += batchSize) {
  const batch = sameAsEnKeys.slice(i, i + batchSize);
  const batchObj = {};
  for (const key of batch) {
    batchObj[key] = workObj[key];
  }
  const batchNum = Math.floor(i / batchSize) + 1;
  const outFile = join(outDir, `work-sameas-${lang}-${batchNum}.json`);
  writeFileSync(outFile, JSON.stringify(batchObj, null, 2));
  console.log(`  Wrote ${batch.length} keys to ${outFile}`);
}

console.log(`Done. ${Math.ceil(sameAsEnKeys.length / batchSize)} batch file(s) created.`);