// Fix bg-pattern values by replacing the exact problematic strings
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

let result = source;

// Fix 1: Line 646 - NEUBRUTALISM light theme bg-pattern
// Original has: url("data:... with unescaped quotes and duplicated content
result = result.replace(
  '--bg-pattern": "url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E")",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E\")",',
  '--bg-pattern": "url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E\")",'
);

// Fix 2: Line 705 - NEUBRUTALISM dark theme bg-pattern
result = result.replace(
  '--bg-pattern": "url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.05\'/%3E%3C/svg%3E")",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.05\'/%3E%3C/svg%3E\")",',
  '--bg-pattern": "url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.05\'/%3E%3C/svg%3E\")",'
);

// Fix 3: Line 771 - BRUTALIST INK light
result = result.replace(
  '--bg-pattern": "url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E")",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E\")",',
  '--bg-pattern": "url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E\")",'
);

// Fix 4: Line 830 - BRUTALIST INK dark
result = result.replace(
  '--bg-pattern": "url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.05\'/%3E%3C/svg%3E")",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.05\'/%3E%3C/svg%3E\")",',
  '--bg-pattern": "url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.05\'/%3E%3C/svg%3E\")",'
);

// Fix 5: Line 1798 - CYBER GRID light (has duplicated content)
result = result.replace(
  '--bg-pattern": "none",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(280 15% 50% / 0.1)\' stroke-width=\'1\'/%3E%3C/svg%3E")",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100%25\' height=\'100%25\'%3E%3Cfilter id=\'scanline\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0 0.02\' numOctaves=\'1\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23scanline)\' opacity=\'0.03\'/%3E%3C/svg%3E\")",',
  '--bg-pattern": "url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(280 15% 50% / 0.1)\' stroke-width=\'1\'/%3E%3C/svg%3E\")",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100%25\' height=\'100%25\'%3E%3Cfilter id=\'scanline\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0 0.02\' numOctaves=\'1\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23scanline)\' opacity=\'0.03\'/%3E%3C/svg%3E\")",'
);

// Fix 6: Line 1857 - CYBER GRID dark
result = result.replace(
  '--bg-pattern": "none",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(180 90% 55% / 0.08)\' stroke-width=\'1\'/%3E%3C/svg%3E")",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100%25\' height=\'100%25\'%3E%3Cfilter id=\'scanline\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0 0.02\' numOctaves=\'1\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23scanline)\' opacity=\'0.06\'/%3E%3C/svg%3E\")",',
  '--bg-pattern": "url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(180 90% 55% / 0.08)\' stroke-width=\'1\'/%3E%3C/svg%3E\")",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100%25\' height=\'100%25\'%3E%3Cfilter id=\'scanline\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0 0.02\' numOctaves=\'1\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23scanline)\' opacity=\'0.06\'/%3E%3C/svg%3E\")",'
);

// Fix 7: Line 1929 - CYBER SYNTH light (first)
result = result.replace(
  '--bg-pattern": "url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(280 15% 50% / 0.1)\' stroke-width=\'1\'/%3E%3C/svg%3E")",',
  '--bg-pattern": "url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(280 15% 50% / 0.1)\' stroke-width=\'1\'/%3E%3C/svg%3E\")",'
);

// Fix 8: Line 1988 - CYBER SYNTH dark
result = result.replace(
  '--bg-pattern": "url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(180 90% 55% / 0.08)\' stroke-width=\'1\'/%3E%3C/svg%3E")",',
  '--bg-pattern": "url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(180 90% 55% / 0.08)\' stroke-width=\'1\'/%3E%3C/svg%3E\")",'
);

// Fix 9: Line 2054 - CYBER SYNTH light (second theme)
result = result.replace(
  '--bg-pattern": "url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(280 15% 50% / 0.1)\' stroke-width=\'1\'/%3E%3C/svg%3E")",',
  '--bg-pattern": "url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(280 15% 50% / 0.1)\' stroke-width=\'1\'/%3E%3C/svg%3E\")",'
);

// Fix 10: Line 2113 - CYBER SYNTH dark (second theme)
result = result.replace(
  '--bg-pattern": "url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(180 90% 55% / 0.08)\' stroke-width=\'1\'/%3E%3C/svg%3E")",',
  '--bg-pattern": "url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(180 90% 55% / 0.08)\' stroke-width=\'1\'/%3E%3C/svg%3E\")",'
);

// Fix 11: Line 2634 - PAPER LINEN light
result = result.replace(
  '--bg-pattern": "none",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Cfilter id=\'linen\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.02 0.1\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23linen)\' opacity=\'0.06\'/%3E%3C/svg%3E")",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Cfilter id=\'linen\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.02 0.1\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23linen)\' opacity=\'0.06\'/%3E%3C/svg%3E\")",',
  '--bg-pattern": "url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Cfilter id=\'linen\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.02 0.1\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23linen)\' opacity=\'0.06\'/%3E%3C/svg%3E\")",'
);

// Fix 12: Line 2693 - PAPER LINEN dark
result = result.replace(
  '--bg-pattern": "none",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Cfilter id=\'linen\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.02 0.1\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23linen)\' opacity=\'0.08\'/%3E%3C/svg%3E")",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Cfilter id=\'linen\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.02 0.1\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23linen)\' opacity=\'0.08\'/%3E%3C/svg%3E\")",',
  '--bg-pattern": "url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Cfilter id=\'linen\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.02 0.1\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23linen)\' opacity=\'0.08\'/%3E%3C/svg%3E\")",'
);

// Fix 13: Line 2755 - PAPER VELLUM light
result = result.replace(
  '--bg-pattern": "none",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Cfilter id=\'linen\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.02 0.1\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23linen)\' opacity=\'0.08\'/%3E%3C/svg%3E")",%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cfilter id=\'vellum\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.05\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23vellum)\' opacity=\'0.06\'/%3E%3C/svg%3E\")",',
  '--bg-pattern": "url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cfilter id=\'vellum\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.05\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23vellum)\' opacity=\'0.06\'/%3E%3C/svg%3E\")",'
);

writeFileSync("src/lib/theme-presets.js", result);
console.log("Fixed all 13 bg-pattern values!");