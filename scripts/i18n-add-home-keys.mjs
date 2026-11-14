/**
 * Add the 7 new Home tab translation keys to all locale files.
 * Run: node scripts/i18n-add-home-keys.mjs
 */
import fs from "fs";
import path from "path";

const LOCALES_DIR = "src/lib/locales";
const LOCALE_FILES = ["ar.json", "de.json", "es.json", "fa.json", "fr.json", "hi.json", "ja.json", "ru.json", "ur.json", "zh.json"];

// The 7 new keys with their English values (to be translated)
const NEW_KEYS = {
  // In ribbon.home.ai
  "ribbon.home.ai.markdownOnly": "AI actions only work in Markdown notes",
  "ribbon.home.ai.notEnabled": "AI is not enabled. Configure it in Settings > AI",
  "ribbon.home.ai.copied": "Copied to clipboard",
  "ribbon.home.ai.copyFailed": "Failed to copy",
  // In ribbon.home (formatPainter toasts)
  "ribbon.home.formatPainterActive": "Format painter active — select text to apply",
  "ribbon.home.formatPainterLocked": "Format painter locked — press Esc to cancel",
  "ribbon.home.formatPainterCancelled": "Format painter cancelled",
};

function addKeysToLocale(localeFile) {
  const filePath = path.join(LOCALES_DIR, localeFile);
  const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // Ensure ribbon.home.ai exists
  if (!content.ribbon) content.ribbon = {};
  if (!content.ribbon.home) content.ribbon.home = {};
  if (!content.ribbon.home.ai) content.ribbon.home.ai = {};

  let changed = false;

  // Add AI keys
  for (const [key, enValue] of Object.entries(NEW_KEYS)) {
    if (key.startsWith("ribbon.home.ai.")) {
      const shortKey = key.replace("ribbon.home.ai.", "");
      if (!(shortKey in content.ribbon.home.ai)) {
        content.ribbon.home.ai[shortKey] = enValue; // TODO: translate
        changed = true;
      }
    }
  }

  // Add formatPainter toast keys to ribbon.home
  for (const [key, enValue] of Object.entries(NEW_KEYS)) {
    if (key.startsWith("ribbon.home.formatPainter")) {
      const shortKey = key.replace("ribbon.home.", "");
      if (!(shortKey in content.ribbon.home)) {
        content.ribbon.home[shortKey] = enValue; // TODO: translate
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n");
    console.log(`Updated ${localeFile}`);
  } else {
    console.log(`No changes needed for ${localeFile}`);
  }
}

for (const file of LOCALE_FILES) {
  addKeysToLocale(file);
}

console.log("\nDone. Remember to translate the new keys in each locale file!");