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
    else if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        console.log("Root object closes at position", i, "line", content.slice(0, i).split("\n").length);
        console.log("Remaining content:", JSON.stringify(content.slice(i+1, i+50)));
        break;
      }
    }
  }
}
console.log("Final depth:", depth);