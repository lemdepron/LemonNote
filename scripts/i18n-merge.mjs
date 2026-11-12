#!/usr/bin/env node
// Merge a translated worklist file back into the locale JSON
// Usage: node scripts/i18n-merge.mjs <lang> <workFile>
// Refuses to merge if placeholder differs or key not in en.json

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const [, , lang, workFile] = process.argv;
if (!lang || !workFile) {
  console.error("Usage: node scripts/i18n-merge.mjs <lang> <workFile>");
  process.exit(1);
}

const en = JSON.parse(readFileSync("src/lib/locales/en.json", "utf8"));
const locPath = `src/lib/locales/${lang}.json`;
if (!existsSync(locPath)) {
  console.error(`Locale file not found: ${locPath}`);
  process.exit(1);
}
const loc = JSON.parse(readFileSync(locPath, "utf8"));

if (!existsSync(workFile)) {
  console.error(`Work file not found: ${workFile}`);
  process.exit(1);
}
const work = JSON.parse(readFileSync(workFile, "utf8"));

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

// Placeholder regex - matches {{name}} or {name}
const placeholderRegex = /\{\{?[a-zA-Z][a-zA-Z0-9_]*\}?\}/g;
function extractPlaceholders(str) {
  if (typeof str !== "string") return [];
  return [...str.matchAll(placeholderRegex)].map(m => m[0]).sort();
}

const enPaths = new Set(paths(en));
let merged = 0;
let skipped = 0;

for (const [key, translatedValue] of Object.entries(work)) {
  if (!enPaths.has(key)) {
    console.error(`SKIP: Key not in en.json: ${key}`);
    skipped++;
    continue;
  }

  const enValue = getValue(en, key);
  const enPlaceholders = extractPlaceholders(enValue);
  const translatedPlaceholders = extractPlaceholders(translatedValue);

  if (JSON.stringify(enPlaceholders) !== JSON.stringify(translatedPlaceholders)) {
    console.error(`SKIP: Placeholder mismatch for ${key}: en has [${enPlaceholders.join(", ")}], translated has [${translatedPlaceholders.join(", ")}]`);
    skipped++;
    continue;
  }

  if (translatedValue === enValue) {
    console.warn(`WARN: Value identical to English for ${key} (may need real translation)`);
  }

  setValue(loc, key, translatedValue);
  merged++;
}

writeFileSync(locPath, JSON.stringify(loc, null, 2));
console.log(`Merged ${merged} keys, skipped ${skipped} keys into ${lang}.json`);