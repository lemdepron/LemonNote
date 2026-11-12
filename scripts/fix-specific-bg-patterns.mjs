// Fix specific bg-pattern values that have unescaped quotes
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// The specific bg-pattern values that need fixing (from the original file)
const BG_PATTERN_FIXES = [
  // NEUBRUTALISM light
  {
    search: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
    replace: 'url(\\"data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\' viewBox=\\'0 0 100 100\\'%3E%3Cfilter id=\\'noise\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.9\\' numOctaves=\\'4\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'100\\' height=\\'100\\' filter=\\'url(%23noise)\\'' opacity=\\'0.03\\''/%3E%3C/svg%3E\\")'
  },
  // NEUBRUTALISM dark
  {
    search: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.05\'/%3E%3C/svg%3E")',
    replace: 'url(\\"data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\' viewBox=\\'0 0 100 100\\'%3E%3Cfilter id=\\'noise\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.9\\' numOctaves=\\'4\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'100\\' height=\\'100\\' filter=\\'url(%23noise)\\'' opacity=\\'0.05\\''/%3E%3C/svg%3E\\")'
  },
  // CYBERPUNK light
  {
    search: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(280 15% 50% / 0.1)\' stroke-width=\'1\'/%3E%3C/svg%3E")',
    replace: 'url(\\"data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'40\\' height=\\'40\\' viewBox=\\'0 0 40 40\\'%3E%3Cpath d=\\'M0 40H40M40 0V40\\' stroke=\\'hsl(280 15% 50% / 0.1)\\'' stroke-width=\\'1\\'/%3E%3C/svg%3E\\")'
  },
  // CYBERPUNK dark
  {
    search: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(180 90% 55% / 0.08)\' stroke-width=\'1\'/%3E%3C/svg%3E")',
    replace: 'url(\\"data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'40\\' height=\\'40\\' viewBox=\\'0 0 40 40\\'%3E%3Cpath d=\\'M0 40H40M40 0V40\\' stroke=\\'hsl(180 90% 55% / 0.08)\\'' stroke-width=\\'1\\'/%3E%3C/svg%3E\\")'
  },
  // SKEUOMORPHIC light (linen)
  {
    search: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Cfilter id=\'linen\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.02 0.1\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23linen)\' opacity=\'0.06\'/%3E%3C/svg%3E")',
    replace: 'url(\\"data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'200\\' viewBox=\\'0 0 200 200\\'%3E%3Cfilter id=\\'linen\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.02 0.1\\' numOctaves=\\'4\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'200\\' height=\\'200\\' filter=\\'url(%23linen)\\'' opacity=\\'0.06\\''/%3E%3C/svg%3E\\")'
  },
  // SKEUOMORPHIC dark (linen)
  {
    search: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Cfilter id=\'linen\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.02 0.1\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23linen)\' opacity=\'0.08\'/%3E%3C/svg%3E")',
    replace: 'url(\\"data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'200\\' viewBox=\\'0 0 200 200\\'%3E%3Cfilter id=\\'linen\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.02 0.1\\' numOctaves=\\'4\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'200\\' height=\\'200\\' filter=\\'url(%23linen)\\'' opacity=\\'0.08\\''/%3E%3C/svg%3E\\")'
  },
];

let result = readFileSync("src/lib/theme-presets.js", "utf8");

for (const fix of BG_PATTERN_FIXES) {
  result = result.replace(fix.search, fix.replace);
}

writeFileSync("src/lib/theme-presets.js", result);
console.log("Fixed specific bg-pattern values!");