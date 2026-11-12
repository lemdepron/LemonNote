import { readFileSync } from "node:fs";

const content = readFileSync("src/lib/locales/en.json", "utf8");

// Detailed trace around vault (positions 53000-64000)
let depth = 0;
let inString = false;
let escape = false;

for (let i = 53000; i < 64000; i++) {
  const c = content[i];
  if (inString) {
    if (escape) escape = false;
    else if (c === "\\") escape = true;
    else if (c === '"') inString = false;
  } else {
    if (c === '"') inString = true;
    else if (c === "{") depth++;
    else if (c === "}") {
      if (depth <= 3) {
        console.log(`Pos ${i} (line ${content.slice(0,i).split("\n").length}): Close brace, depth=${depth} -> ${depth-1}, char=${JSON.stringify(content.slice(i-10, i+10))}`);
      }
      depth--;
    }
  }
}