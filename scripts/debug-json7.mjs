import { readFileSync } from "node:fs";

const content = readFileSync("src/lib/locales/en.json", "utf8");

// Find the vault object end by tracking depth properly
let depth = 0;
let inString = false;
let escape = false;
let vaultObjectDepth = -1;  // The depth of the vault object itself
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
      // Check if this is "vault" at depth 1 (root level)
      if (depth === 1) {
        const context = content.slice(Math.max(0, i-10), i+10);
        if (context.includes('"vault"')) {
          sawVaultKey = true;
        }
      }
    }
    else if (c === "{") {
      depth++;
      // If we just saw "vault" key and now we're opening its value object
      if (sawVaultKey && depth === 2) {
        vaultObjectDepth = 2;
        sawVaultKey = false;
      }
    }
    else if (c === "}") {
      // If we're closing the vault object (depth goes from vaultObjectDepth to vaultObjectDepth-1)
      if (vaultObjectDepth > 0 && depth === vaultObjectDepth) {
        vaultEnd = i;
        vaultObjectDepth = -1;
      }
      depth--;
    }
  }
}

console.log("Vault end:", vaultEnd, "line", content.slice(0, vaultEnd).split("\n").length);
console.log("Char at vaultEnd:", content[vaultEnd]);
console.log("Context after vaultEnd:", JSON.stringify(content.slice(vaultEnd, vaultEnd + 50)));

// Now try parsing root up to vault end
const part1 = content.slice(0, vaultEnd + 1);
console.log("\nPart1 (root up to vault) length:", part1.length);
try {
  JSON.parse(part1);
  console.log("Part1 parses OK");
} catch (e) {
  console.log("Part1 error:", e.message);
  const pos = e.message.match(/position (\d+)/);
  if (pos) {
    const p = parseInt(pos[1]);
    console.log("Context:", JSON.stringify(part1.slice(Math.max(0, p-50), p+50)));
  }
}

// The rest should be findTags, ai, common
const afterVault = content.slice(vaultEnd + 1);
console.log("\nAfter vault starts with:", JSON.stringify(afterVault.slice(0, 100)));