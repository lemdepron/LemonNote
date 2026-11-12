// Fix all remaining bg-pattern issues
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

let result = source;

// Fix all remaining bg-pattern issues by replacing the exact problematic patterns
const fixes = [
  // CYBER GRID light (line ~1610)
  {
    search: '"--bg-pattern": "none",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(280 15% 50% / 0.1)\' stroke-width=\'1\'/%3E%3C/svg%3E")",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(280 15% 50% / 0.1)\' stroke-width=\'1\'/%3E%3C/svg%3E\")",',
    replace: '"--bg-pattern": "url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(280 15% 50% / 0.1)\' stroke-width=\'1\'/%3E%3C/svg%3E\")",'
  },
  // CYBER GRID dark (line ~1669)
  {
    search: '"--bg-pattern": "none",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(180 90% 55% / 0.08)\' stroke-width=\'1\'/%3E%3C/svg%3E")",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(180 90% 55% / 0.08)\' stroke-width=\'1\'/%3E%3C/svg%3E\")",',
    replace: '"--bg-pattern": "url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(180 90% 55% / 0.08)\' stroke-width=\'1\'/%3E%3C/svg%3E\")",'
  },
  // CYBER SYNTH light (line ~1735)
  {
    search: '"--bg-pattern": "url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(280 15% 50% / 0.1)\' stroke-width=\'1\'/%3E%3C/svg%3E\")",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100%25\' height=\'100%25\'%3E%3Cfilter id=\'scanline\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0 0.02\' numOctaves=\'1\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23scanline)\' opacity=\'0.03\'/%3E%3C/svg%3E\")",',
    replace: '"--bg-pattern": "url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100%25\' height=\'100%25\'%3E%3Cfilter id=\'scanline\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0 0.02\' numOctaves=\'1\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23scanline)\' opacity=\'0.03\'/%3E%3C/svg%3E\")",'
  },
  // CYBER SYNTH dark (line ~1794)
  {
    search: '"--bg-pattern": "url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(180 90% 55% / 0.08)\' stroke-width=\'1\'/%3E%3C/svg%3E\")",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100%25\' height=\'100%25\'%3E%3Cfilter id=\'scanline\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0 0.02\' numOctaves=\'1\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23scanline)\' opacity=\'0.06\'/%3E%3C/svg%3E\")",',
    replace: '"--bg-pattern": "url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100%25\' height=\'100%25\'%3E%3Cfilter id=\'scanline\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0 0.02\' numOctaves=\'1\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23scanline)\' opacity=\'0.06\'/%3E%3C/svg%3E\")",'
  }
];

let output = source;
for (const fix of fixes) {
  if (output.includes(fix.search)) {
    output = output.split(fix.search).join(fix.replace);
    console.log("Fixed one bg-pattern");
  } else {
    console.log("WARNING: Pattern not found");
  }
}

writeFileSync("src/lib/theme-presets.js", output);
console.log("Fixed remaining bg-pattern values!");