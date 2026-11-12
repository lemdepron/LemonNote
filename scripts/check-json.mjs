import { readFileSync } from "node:fs";

const content = readFileSync("src/lib/locales/en.json", "utf8");
console.log("File length:", content.length);
console.log("First char code:", content.charCodeAt(0));
console.log("Starts with BOM:", content.charCodeAt(0) === 0xFEFF);

// Check for trailing commas
const lines = content.split("\n");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.endsWith(",") && (line.endsWith("},") || line.endsWith("],") || line === "}," || line === "],")) {
    console.log(`Line ${i+1}: Possible trailing comma: ${lines[i]}`);
  }
}

// Try to find the exact error position
try {
  JSON.parse(content);
  console.log("JSON valid");
} catch (e) {
  console.log("Error:", e.message);
  const pos = e.message.match(/position (\d+)/);
  if (pos) {
    const p = parseInt(pos[1]);
    console.log("Context around error:", JSON.stringify(content.slice(Math.max(0, p-20), p+20)));
  }
}