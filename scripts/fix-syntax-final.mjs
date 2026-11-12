import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// Fix the specific syntax error at line 1410
// The issue is an extra `},` line that breaks the array structure

const lines = source.split('\n');

// Fix line 1410 (index 1409) - remove the extra `},` line
// Original:
//     },
//   },
// ];
// Should be:
//     },
//   },
// ];

// Find the problematic pattern around GRADIENT_DUOTONE_THEMES
let inGradientDuotone = false;
let fixed = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('GRADIENT_DUOTONE_THEMES')) {
    inGradientDuotone = true;
  }
  
  if (inGradientDuotone && lines[i].trim() === '],') {
    // Check if previous line is an extra `},`
    if (i > 0 && lines[i-1].trim() === '},' && lines[i-2].trim() === '},') {
      // Remove the extra line
      lines.splice(i-1, 1);
      fixed = true;
      console.log("Fixed extra closing brace at line", i);
      break;
    }
  }
}

if (fixed) {
  writeFileSync("src/lib/theme-presets.js", lines.join('\n'));
  console.log("Fixed syntax error!");
} else {
  console.log("No fix applied - pattern not found");
}