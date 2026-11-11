import fs from "fs";
import path from "path";

// Read the English locale as source
const enPath = path.resolve("src/lib/locales/en.json");
const en = JSON.parse(fs.readFileSync(enPath, "utf-8"));

// Get the new keys we added
const newKeys = {
  settings: {
    backup: en.settings.backup
  },
  vault: en.vault,
  findTags: en.findTags,
  common: en.common
};

// All other locale files
const localeFiles = [
  "ar.json", "de.json", "es.json", "fa.json", 
  "fr.json", "hi.json", "ja.json", "ru.json", "ur.json", "zh.json"
];

const localesDir = path.resolve("src/lib/locales");

for (const file of localeFiles) {
  const filePath = path.join(localesDir, file);
  const locale = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  
  // Merge settings.backup
  if (!locale.settings) locale.settings = {};
  if (!locale.settings.backup) locale.settings.backup = {};
  Object.assign(locale.settings.backup, newKeys.settings.backup);
  
  // Merge vault
  if (!locale.vault) locale.vault = {};
  Object.assign(locale.vault, newKeys.vault);
  
  // Add findTags section
  locale.findTags = newKeys.findTags;
  
  // Merge common
  if (!locale.common) locale.common = {};
  Object.assign(locale.common, newKeys.common);
  
  // Write back
  fs.writeFileSync(filePath, JSON.stringify(locale, null, 2) + "\n");
  console.log(`Updated ${file}`);
}

console.log("All locale files updated!");