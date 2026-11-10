// Quick sanity checks for the language files and the digit map.
// Run:  node scripts/i18n-check.mjs   (from the project folder)
import { readFileSync } from "node:fs";

const en = JSON.parse(readFileSync("src/lib/locales/en.json", "utf8"));
const ar = JSON.parse(readFileSync("src/lib/locales/ar.json", "utf8"));

const paths = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? paths(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  );

let failures = 0;
const fail = (msg) => { console.error(`FAIL: ${msg}`); failures++; };

const enPaths = new Set(paths(en));
const arPaths = new Set(paths(ar));

for (const key of enPaths) if (!arPaths.has(key)) fail(`missing in ar.json: ${key}`);
for (const key of arPaths) if (!enPaths.has(key)) fail(`missing in en.json: ${key}`);

for (const key of arPaths) {
  const value = key.split(".").reduce((v, part) => v?.[part], ar);
  if (typeof value !== "string" || value.trim() === "") fail(`empty ar value: ${key}`);
  const enValue = key.split(".").reduce((v, part) => v?.[part], en);
  if (typeof enValue !== "string" || enValue.trim() === "") fail(`empty en value: ${key}`);
}

// The Arabic-Indic digit map in i18n.js: 10 distinct digits ٠-٩ in order.
const i18nSource = readFileSync("src/lib/i18n.js", "utf8");
const match = i18nSource.match(/const AR_DIGITS = "([^"]+)"/);
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

if (failures === 0) console.log("OK: translations in sync, digit map and dir auto look right.");
else { console.error(`${failures} failure(s)`); process.exit(1); }
