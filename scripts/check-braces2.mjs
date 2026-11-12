import { readFileSync } from "node:fs";

const content = readFileSync("src/lib/locales/en.json", "utf8");
let depth = 0;
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
      depth++;
      if (depth <= 3) console.log(`Open brace at ${i} (line ${content.slice(0, i).split("\n").length}), depth=${depth}`);
    }
    else if (c === "}") {
      if (depth <= 3) console.log(`Close brace at ${i} (line ${content.slice(0, i).split("\n").length}), depth=${depth}`);
      depth--;
    }
  }
}
console.log("Final depth:", depth);