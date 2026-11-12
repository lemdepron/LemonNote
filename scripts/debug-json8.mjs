import { readFileSync } from "node:fs";

const content = readFileSync("src/lib/locales/en.json", "utf8");

// Detailed trace around vault
let depth = 0;
let inString = false;
let escape = false;
let vaultObjectDepth = -1;
let vaultEnd = -1;
let sawVaultKey = false;

for (let i = 0; i < content.length; i++) {
  const c = content[i];
  if (inString) {
    if (escape) escape = false;
    else if (c === "\\") escape = true;
    else if (c === '"') inString = false;
  } else {
    if (c === '"') {
      inString = true;
      if (depth === 1) {
        const context = content.slice(Math.max(0, i-10), i+10);
        if (context.includes('"vault"')) {
          sawVaultKey = true;
        }
      }
    }
    else if (c === "{") {
      depth++;
      if (sawVaultKey && depth === 2) {
        vaultObjectDepth = 2;
        sawVaultKey = false;
        console.log(`Enter vault object at pos ${i}, line ${content.slice(0,i).split("\n").length}, depth=${depth}`);
      }
    }
    else if (c === "}") {
      if (vaultObjectDepth > 0 && depth === vaultObjectDepth) {
        vaultEnd = i;
        vaultObjectDepth = -1;
        console.log(`EXIT vault object at pos ${i}, line ${content.slice(0,i).split("\n").length}, depth=${depth} (before decrement)`);
      }
      depth--;
      if (depth <= 3) {
        console.log(`Close brace at pos ${i}, line ${content.slice(0,i).split("\n").length}, depth=${depth} (after decrement)`);
      }
    }
  }
}

console.log("\nFinal vaultEnd:", vaultEnd, "line", content.slice(0, vaultEnd).split("\n").length);