import { readFileSync, writeFileSync } from "node:fs";

const content = readFileSync("src/lib/locales/en.json", "utf8");

// Find the vault object end (the closing brace of vault, not nested objects)
let depth = 0;
let inString = false;
let escape = false;
let vaultEnd = -1;
let inVault = false;

for (let i = 0; i < content.length; i++) {
  const c = content[i];
  if (inString) {
    if (escape) escape = false;
    else if (c === "\\") escape = true;
    else if (c === '"') inString = false;
  } else {
    if (c === '"') {
      // Check if this is "vault" at depth 1
      if (depth === 1) {
        const context = content.slice(Math.max(0, i-10), i+10);
        if (context.includes('"vault"')) {
          inVault = true;
        }
      }
      inString = true;
    }
    else if (c === "{") {
      depth++;
    }
    else if (c === "}") {
      if (inVault && depth === 2) {
        // This closes the vault object (depth 2)
        vaultEnd = i;
        inVault = false;
      }
      depth--;
    }
  }
}

console.log("Vault end position:", vaultEnd, "line", content.slice(0, vaultEnd).split("\n").length);
console.log("Char at vaultEnd:", content[vaultEnd]);
console.log("Context after vaultEnd:", JSON.stringify(content.slice(vaultEnd, vaultEnd + 50)));

// The vault object should end at vaultEnd, then there should be a comma, then findTags
// Let's check what's after vaultEnd
const afterVault = content.slice(vaultEnd + 1);
console.log("After vault:", JSON.stringify(afterVault.slice(0, 100)));

// Now let's try to parse the JSON in parts
// Part 1: Root object up to and including vault
const part1 = content.slice(0, vaultEnd + 1);
console.log("\nPart1 length:", part1.length);
try {
  JSON.parse(part1);
  console.log("Part1 (root up to vault) parses OK");
} catch (e) {
  console.log("Part1 error:", e.message);
}

// Part 2: The rest (findTags, ai, common) wrapped in an object
const part2 = "{" + afterVault;
console.log("\nPart2 length:", part2.length);
try {
  JSON.parse(part2);
  console.log("Part2 parses OK");
} catch (e) {
  console.log("Part2 error:", e.message);
  const pos = e.message.match(/position (\d+)/);
  if (pos) {
    const p = parseInt(pos[1]);
    console.log("Part2 context:", JSON.stringify(part2.slice(Math.max(0, p-50), p+50)));
  }
}