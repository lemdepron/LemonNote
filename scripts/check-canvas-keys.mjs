// Check that all t()/ct() keys used in CanvasPage.jsx and canvas components exist in en.json
// Run: node scripts/check-canvas-keys.mjs
import { readFileSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";

const en = JSON.parse(readFileSync("src/lib/locales/en.json", "utf8"));

// Flatten object to dot-notation paths
const paths = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? paths(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  );

const enPaths = new Set(paths(en));

let failures = 0;
const fail = (msg) => { console.error(`FAIL: ${msg}`); failures++; };

// Files to scan for canvas keys
const canvasFiles = [
  "src/pages/CanvasPage.jsx",
  "src/components/canvas/CanvasBoard.jsx",
  "src/components/ink/FloatingObjects.jsx",
  "src/lib/canvas/ink/objects.js",
  "src/lib/canvas/ink/renderers.js",
];

// Regex to catch t("...") and ct("...") calls
const keyRegex = /(?:^|[^a-zA-Z0-9_])(?:t|ct)\(\s*["']([a-z][a-z0-9_.]*)["']/g;

function stripComments(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

for (const file of canvasFiles) {
  try {
    const content = stripComments(readFileSync(file, "utf8"));
    let match;
    while ((match = keyRegex.exec(content)) !== null) {
      const key = match[1];
      // Skip template family keys (ending with .)
      if (key.endsWith(".")) continue;
      
      // For CanvasPage.jsx, ct() prepends "vault.canvas."
      // For other files, t() is used directly with full keys
      const fullKey = file === "src/pages/CanvasPage.jsx" && !key.startsWith("vault.canvas.") && !key.startsWith("ribbon.") && !key.startsWith("settings.") && !key.startsWith("ink.") && !key.startsWith("canvas.") && !key.startsWith("common.") && !key.startsWith("lang.") && !key.startsWith("digits.") && !key.startsWith("dir.") && !key.startsWith("vault.") && !key.startsWith("fileMenu.") && !key.startsWith("backup.") && !key.startsWith("findTags.") 
        ? `vault.canvas.${key}` 
        : key;
      
      if (!enPaths.has(fullKey)) {
        fail(`key used in ${file} but missing in en.json: ${fullKey} (from ${key})`);
      }
    }
  } catch (e) {
    console.warn(`WARN: Could not read ${file}: ${e.message}`);
  }
}

console.log(`\n${failures} failure(s)`);

if (failures > 0) process.exit(1);
else console.log("PASS: All canvas keys found in en.json");