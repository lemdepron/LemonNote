// Fix font string quoting in theme-presets.js
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// Fix font-heading and font-body values - they need to be quoted strings
// Pattern: "--font-heading": "Instrument Serif", ui-serif, Georgia, serif,
// Should be: "--font-heading": "\"Instrument Serif\", ui-serif, Georgia, serif",

let result = source;

// Fix font-heading
result = result.replace(
  /("--font-heading":\s*)"([^"]+)",\s*([^,]+),\s*([^,]+),\s*([^,]+),/g,
  '$1"$2, $3, $4, $5",'
);

// Fix font-body
result = result.replace(
  /("--font-body":\s*)"([^"]+)",\s*([^,]+),\s*([^,]+),\s*([^,]+),/g,
  '$1"$2, $3, $4, $5",'
);

// Also fix cases where there are only 3 parts
result = result.replace(
  /("--font-heading":\s*)"([^"]+)",\s*([^,]+),\s*([^,]+),/g,
  '$1"$2, $3, $4",'
);

result = result.replace(
  /("--font-body":\s*)"([^"]+)",\s*([^,]+),\s*([^,]+),/g,
  '$1"$2, $3, $4",'
);

// Fix cases where the value starts without opening quote (e.g., system-ui, sans-serif)
result = result.replace(
  /("--font-heading":\s*)([^",][^,]+),\s*([^,]+),\s*([^,]+),/g,
  '$1"$2, $3, $4",'
);

result = result.replace(
  /("--font-body":\s*)([^",][^,]+),\s*([^,]+),\s*([^,]+),/g,
  '$1"$2, $3, $4",'
);

writeFileSync("src/lib/theme-presets.js", result);
console.log("Font string quoting fixed!");