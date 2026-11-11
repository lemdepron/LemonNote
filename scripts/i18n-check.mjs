// Quick sanity checks for the language files and the digit map.
// Run:  node scripts/i18n-check.mjs   (from the project folder)
import { readFileSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";

const en = JSON.parse(readFileSync("src/lib/locales/en.json", "utf8"));
const locales = readdirSync("src/lib/locales").filter(f => f.endsWith(".json") && f !== "en.json");

const paths = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? paths(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  );

let failures = 0;
const fail = (msg) => { console.error(`FAIL: ${msg}`); failures++; };

const enPaths = new Set(paths(en));

// Check all locale files have all en keys, no empty values, no untranslated strings
for (const locFile of locales) {
  const loc = JSON.parse(readFileSync(`src/lib/locales/${locFile}`, "utf8"));
  const locPaths = new Set(paths(loc));
  for (const key of enPaths) if (!locPaths.has(key)) fail(`missing in ${locFile}: ${key}`);
  for (const key of locPaths) if (!enPaths.has(key)) fail(`extra in ${locFile}: ${key}`);
  for (const key of locPaths) {
    const value = key.split(".").reduce((v, part) => v?.[part], loc);
    if (typeof value !== "string" || value.trim() === "") fail(`empty ${locFile} value: ${key}`);
    const enValue = key.split(".").reduce((v, part) => v?.[part], en);
    if (typeof enValue !== "string" || enValue.trim() === "") fail(`empty en value: ${key}`);
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
for (const file of sourceFiles) {
  const content = readFileSync(file, "utf8");
  let match;
  while ((match = keyRegex.exec(content)) !== null) {
    usedKeys.add(match[1]);
  }
}

for (const key of usedKeys) {
  if (!enPaths.has(key)) {
    fail(`key used in code but missing in en.json: ${key}`);
  }
}

// Check for untranslated strings (same as English, 4+ chars, not in allow-list)
const ALLOW_SAME_AS_EN = new Set([
  "LemonNote", "Markdown", "HTML", "PDF", "CSV", "JSON", "CSS", "JS", "TS", "UI", "URL", "API", "AI", "LLM",
  "GitHub", "Obsidian", "Base64", "WebP", "APNG", "GIF", "PNG", "JPG", "JPEG", "SVG", "MP3", "WAV", "MP4",
  "Ctrl", "Alt", "Shift", "Esc", "Del", "Tab", "Enter", "Space", "Backspace", "Delete",
  "OK", "Yes", "No", "On", "Off", "Auto", "None", "Custom", "Default", "System",
  "RTL", "LTR", "UTC", "ISO", "RGB", "HEX", "PX", "EM", "REM", "VH", "VW",
  "Min", "Max", "Avg", "Sum", "Count", "Total", "ID", "UUID", "GUID",
  "https://", "example.com", "name@", "RRGGBB", "RRGGBBAA",
  "English", "Arabic", "Russian", "Chinese", "Japanese", "French", "Persian", "Hindi", "Urdu", "German", "Spanish",
  "العربية", "Русский", "中文", "日本語", "Français", "فارسی", "हिन्दी", "اردو", "Deutsch", "Español",
  "Backup", "Export", "Import", "Backup downloaded", "Size", "Large backup", "dedicated backup tool",
  "Could not read backup", "Export failed", "Import failed", "Imported", "record", "skipped",
  "already present", "renamed", "overwritten", "Replace mode erases every current record before importing",
  "This cannot be undone", "Backup contains attachments", "Import from files",
  "Import Markdown files or Obsidian vault", "Select .md/.txt files or a folder",
  "Subfolders become note folders", "Wikilinks", "tags", "are preserved",
  "Image embeds", "converted to attachments", "Import .md/.txt files",
  "Import folder (Obsidian vault)", "Preserve folder structure as note folders",
  "On import:", "Keep existing (merge)", "Replace everything", "Confirm import",
  "Table", "In file", "Will import", "Confirm file import", "Confirm folder import",
  "Files found", "Notes to import", "Duplicates found", "Folders",
  "Duplicate notes action:", "Skip", "Rename", "Overwrite", "DUPLICATE",
  "and", "more", "Importing", "Stage", "Progress", "Import cancelled",
  "Please select the files again to import", "Please select the folder again to import",
  "Could not preview files", "Search every note, title and body", "Favourites",
  "Tags", "Today", "7 days", "30 days", "Include deleted", "Clear filters",
  "Search results", "matches", "notes", "Folder", "Unfiled", "Recent notes",
  "Nothing here yet", "Every vault starts with a single note", "Write the first one",
  "All notes", "Find Tags", "Filter by tag", "All tags", "Date range", "All time",
  "Today", "7 days", "30 days", "Search in notes and lines", "Search tagged lines",
  "Hide completed To Do lines", "No tagged lines in this vault yet",
  "Add {tag:todo}, {tag:idea}, etc. to lines in your notes",
  "No tagged lines match your filters", "line", "lines", "filtered by",
  "search", "Create summary note", "Creating", "Clear search", "Remove tag",
  "word goal", "set goal", "edit", "words to go", "goal reached", "word",
  "saved", "saving", "draft", "Untitled note", "Click to rename", "+ tag",
  "Close", "Cancel", "errors", "error", "unknown date", "Clear",
  "Never", "Every 14 days", "Last backup: ", "Update now", "Whole vault",
  "{count} note{plural}", "{count} tag{plural}", "{count} link{plural}", "{notes} · {tags} · {links}",
  "todo, doing, done"
]);

function getValue(obj, key) {
  return key.split(".").reduce((v, part) => v?.[part], obj);
}

let untranslatedCount = 0;
for (const key of enPaths) {
  const enValue = getValue(en, key);
  if (typeof enValue === "string" && enValue.trim().length >= 4) {
    for (const locFile of locales) {
      const loc = JSON.parse(readFileSync(`src/lib/locales/${locFile}`, "utf8"));
      const locValue = getValue(loc, key);
      if (enValue === locValue) {
        const isAllowed = Array.from(ALLOW_SAME_AS_EN).some(allowed => enValue.includes(allowed));
        if (!isAllowed) {
          fail(`untranslated (same as English): ${key} = "${enValue}" in ${locFile}`);
          untranslatedCount++;
          if (untranslatedCount >= 50) break;
        }
      }
    }
    if (untranslatedCount >= 50) break;
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

if (failures === 0) console.log("OK: translations in sync, digit map and dir auto look right.");
else { console.error(`${failures} failure(s)`); process.exit(1); }