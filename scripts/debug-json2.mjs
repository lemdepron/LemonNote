import { readFileSync } from "node:fs";

const content = readFileSync("src/lib/locales/en.json", "utf8");

// Check the exact bytes around the vault closing and findTags opening
const vaultClosePos = content.indexOf("  },\n  \"findTags\"");
if (vaultClosePos >= 0) {
  console.log("Found vault close + findTags at:", vaultClosePos);
  console.log("Context:", JSON.stringify(content.slice(vaultClosePos - 50, vaultClosePos + 50)));
}

// Check if there's a missing comma between vault and findTags
const lines = content.split("\n");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("findTags")) {
    console.log(`Line ${i+1}: ${lines[i]}`);
    console.log(`Line ${i}: ${lines[i-1]}`);
    console.log(`Line ${i-1}: ${lines[i-2]}`);
    break;
  }
}

// Check the root object structure - count top-level properties
let depth = 0;
let inString = false;
let escape = false;
let topLevelProps = [];

for (let i = 0; i < content.length; i++) {
  const c = content[i];
  if (inString) {
    if (escape) escape = false;
    else if (c === "\\") escape = true;
    else if (c === '"') inString = false;
  } else {
    if (c === '"') inString = true;
    else if (c === "{") {
      depth++;
      if (depth === 2) {
        // This is a top-level property object opening
        // Find the property name by looking back
        let j = i - 1;
        while (j >= 0 && /\s/.test(content[j])) j--;
        if (content[j] === '"') {
          let k = j - 1;
          while (k >= 0 && content[k] !== '"') k--;
          if (k >= 0) {
            const propName = content.slice(k + 1, j + 1);
            topLevelProps.push(propName);
          }
        }
      }
    }
    else if (c === "}") {
      depth--;
    }
  }
}

console.log("Top-level properties:", topLevelProps);

// Now try to parse with a more detailed error
try {
  JSON.parse(content);
  console.log("Full JSON parses OK");
} catch (e) {
  console.log("Full JSON error:", e.message);
  // Try to find what the parser thinks is the end
  const match = e.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1]);
    console.log("Error at position:", pos, "line", content.slice(0, pos).split("\n").length);
    console.log("Context:", JSON.stringify(content.slice(Math.max(0, pos - 100), pos + 100)));
  }
}