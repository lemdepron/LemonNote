import { readFileSync } from "node:fs";

const content = readFileSync("src/lib/locales/en.json", "utf8");

// Extract just the root object and see if it parses
const lines = content.split("\n");

// Find the vault object boundaries
let inVault = false;
let vaultStart = -1;
let vaultEnd = -1;
let braceDepth = 0;
let inString = false;
let escape = false;

for (let i = 0; i < content.length; i++) {
  const c = content[i];
  if (inString) {
    if (escape) escape = false;
    else if (c === "\\") escape = true;
    else if (c === '"') inString = false;
  } else {
    if (c === '"') inString = true;
    else if (c === "{") {
      braceDepth++;
      // Check if this is the vault object opening
      if (braceDepth === 2) {
        // Look back to see if we're at "vault":
        const context = content.slice(Math.max(0, i-20), i);
        if (context.includes('"vault"')) {
          vaultStart = i;
          inVault = true;
        }
      }
    }
    else if (c === "}") {
      if (inVault && braceDepth === 2) {
        vaultEnd = i;
        inVault = false;
      }
      braceDepth--;
    }
  }
}

console.log("Vault start:", vaultStart, "line", content.slice(0, vaultStart).split("\n").length);
console.log("Vault end:", vaultEnd, "line", content.slice(0, vaultEnd).split("\n").length);

// Try parsing just the vault object
if (vaultStart >= 0 && vaultEnd >= 0) {
  const vaultJson = content.slice(vaultStart, vaultEnd + 1);
  console.log("Vault JSON length:", vaultJson.length);
  try {
    JSON.parse(vaultJson);
    console.log("Vault object parses OK");
  } catch (e) {
    console.log("Vault object parse error:", e.message);
  }
}

// Try parsing from root start to vault end
const rootToVaultEnd = content.slice(0, vaultEnd + 1);
console.log("\nRoot to vault end length:", rootToVaultEnd.length);
try {
  JSON.parse(rootToVaultEnd);
  console.log("Root to vault end parses OK");
} catch (e) {
  console.log("Root to vault end parse error:", e.message);
  const pos = e.message.match(/position (\d+)/);
  if (pos) {
    const p = parseInt(pos[1]);
    console.log("Context:", JSON.stringify(rootToVaultEnd.slice(Math.max(0, p-20), p+20)));
  }
}

// Try parsing the whole file but stop at vault end
const afterVault = content.slice(vaultEnd + 1);
console.log("\nAfter vault starts with:", JSON.stringify(afterVault.slice(0, 50)));