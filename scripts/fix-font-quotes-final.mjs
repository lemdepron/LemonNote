// Fix font string quoting - ensure font stacks are properly quoted as single strings
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// Fix font-heading and font-body values
// Pattern: "--font-heading": "Instrument Serif", ui-serif, Georgia, serif,
// Should be: "--font-heading": "\"Instrument Serif\", ui-serif, Georgia, serif",

let result = source;

// Fix font-heading - find all occurrences and properly quote the entire font stack
result = result.replace(
  /("--font-heading":\s*)"([^"]+)",\s*([^,]+),\s*([^,]+),\s*([^,]+),/g,
  (match, prefix, part1, part2, part3, part4) => {
    return `${prefix}"${part1}, ${part2}, ${part3}, ${part4}",`;
  }
);

// Fix font-body
result = result.replace(
  /("--font-body":\s*)"([^"]+)",\s*([^,]+),\s*([^,]+),\s*([^,]+),/g,
  (match, prefix, part1, part2, part3, part4) => {
    return `${prefix}"${part1}, ${part2}, ${part3}, ${part4}",`;
  }
);

// Fix 3-part font stacks
result = result.replace(
  /("--font-heading":\s*)"([^"]+)",\s*([^,]+),\s*([^,]+),/g,
  (match, prefix, part1, part2, part3) => {
    return `${prefix}"${part1}, ${part2}, ${part3}",`;
  }
);

result = result.replace(
  /("--font-body":\s*)"([^"]+)",\s*([^,]+),\s*([^,]+),/g,
  (match, prefix, part1, part2, part3) => {
    return `${prefix}"${part1}, ${part2}, ${part3}",`;
  }
);

// Fix 2-part font stacks (e.g., system-ui, sans-serif)
result = result.replace(
  /("--font-heading":\s*)"([^"]+)",\s*([^,]+),/g,
  (match, prefix, part1, part2) => {
    return `${prefix}"${part1}, ${part2}",`;
  }
);

result = result.replace(
  /("--font-body":\s*)"([^"]+)",\s*([^,]+),/g,
  (match, prefix, part1, part2) => {
    return `${prefix}"${part1}, ${part2}",`;
  }
);

// Fix cases where there's no opening quote (e.g., system-ui, sans-serif)
result = result.replace(
  /("--font-heading":\s*)([^",][^,]+),\s*([^,]+),/g,
  (match, prefix, part1, part2) => {
    return `${prefix}"${part1}, ${part2}",`;
  }
);

result = result.replace(
  /("--font-body":\s*)([^",][^,]+),\s*([^,]+),/g,
  (match, prefix, part1, part2) => {
    return `${prefix}"${part1}, ${part2}",`;
  }
);

writeFileSync("src/lib/theme-presets.js", result);
console.log("Font string quoting fixed!");