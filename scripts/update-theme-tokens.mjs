// Update theme presets with new shape tokens
// Run: node scripts/update-theme-tokens.mjs

import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// Helper to replace style tokens in a theme object string
function replaceStyleTokens(themeStr, family) {
  // Define new tokens per family
  const familyTokens = {
    "GLASS_LIGHT_THEMES": {
      light: {
        '--r-control': '0.75rem',
        '--r-card': '1rem',
        '--r-pill': '9999px',
        '--r-tab': '0.75rem',
        '--shadow-card': '0 8px 24px -4px hsl(var(--shadow) / 0.3), 0 4px 12px -2px hsl(var(--shadow) / 0.2)',
        '--shadow-pop': '0 12px 32px -4px hsl(var(--shadow) / 0.3), 0 6px 16px -3px hsl(var(--shadow) / 0.2)',
        '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
        '--tab-style': 'rounded',
        '--button-style': 'pill',
      },
      dark: {
        '--r-control': '0.75rem',
        '--r-card': '1rem',
        '--r-pill': '9999px',
        '--r-tab': '0.75rem',
        '--shadow-card': '0 8px 24px -4px hsl(var(--shadow) / 0.4), 0 4px 12px -2px hsl(var(--shadow) / 0.3)',
        '--shadow-pop': '0 12px 32px -4px hsl(var(--shadow) / 0.4), 0 6px 16px -3px hsl(var(--shadow) / 0.3)',
        '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
        '--tab-style': 'rounded',
        '--button-style': 'pill',
      }
    },
    "GLASS_DARK_THEMES": {
      light: {
        '--r-control': '0.5rem',
        '--r-card': '0.75rem',
        '--r-pill': '9999px',
        '--r-tab': '0.5rem',
        '--shadow-card': '0 8px 24px -4px hsl(var(--shadow) / 0.3), 0 4px 12px -2px hsl(var(--shadow) / 0.2)',
        '--shadow-pop': '0 12px 32px -4px hsl(var(--shadow) / 0.3), 0 6px 16px -3px hsl(var(--shadow) / 0.2)',
        '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
        '--tab-style': 'square',
        '--button-style': 'square-offset',
      },
      dark: {
        '--r-control': '0.5rem',
        '--r-card': '0.75rem',
        '--r-pill': '9999px',
        '--r-tab': '0.5rem',
        '--shadow-card': '0 8px 24px -4px hsl(var(--shadow) / 0.4), 0 4px 12px -2px hsl(var(--shadow) / 0.3)',
        '--shadow-pop': '0 12px 32px -4px hsl(var(--shadow) / 0.4), 0 6px 16px -3px hsl(var(--shadow) / 0.3)',
        '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
        '--tab-style': 'square',
        '--button-style': 'square-offset',
      }
    },
    "NEUBRUTALISM_THEMES": {
      light: {
        '--r-control': '0',
        '--r-card': '0',
        '--r-pill': '9999px',
        '--r-tab': '0',
        '--shadow-card': '4px 4px 0 0 hsl(var(--shadow))',
        '--shadow-pop': '6px 6px 0 0 hsl(var(--shadow))',
        '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
        '--tab-style': 'square',
        '--button-style': 'square-offset',
      },
      dark: {
        '--r-control': '0',
        '--r-card': '0',
        '--r-pill': '9999px',
        '--r-tab': '0',
        '--shadow-card': '4px 4px 0 0 hsl(var(--shadow))',
        '--shadow-pop': '6px 6px 0 0 hsl(var(--shadow))',
        '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
        '--tab-style': 'square',
        '--button-style': 'square-offset',
      }
    },
    "EDITORIAL_THEMES": {
      light: {
        '--r-control': '0.25rem',
        '--r-card': '0.5rem',
        '--r-pill': '9999px',
        '--r-tab': '0.25rem',
        '--shadow-card': '0 1px 3px hsl(var(--shadow) / 0.2)',
        '--shadow-pop': '0 2px 6px hsl(var(--shadow) / 0.2)',
        '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
        '--tab-style': 'underline',
        '--button-style': 'outline',
      },
      dark: {
        '--r-control': '0.25rem',
        '--r-card': '0.5rem',
        '--r-pill': '9999px',
        '--r-tab': '0.25rem',
        '--shadow-card': '0 1px 3px hsl(var(--shadow) / 0.3)',
        '--shadow-pop': '0 2px 6px hsl(var(--shadow) / 0.3)',
        '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
        '--tab-style': 'underline',
        '--button-style': 'outline',
      }
    },
    "PASTEL_THEMES": {
      light: {
        '--r-control': '1rem',
        '--r-card': '1.5rem',
        '--r-pill': '9999px',
        '--r-tab': '1rem',
        '--shadow-card': '0 4px 16px -2px hsl(var(--shadow) / 0.25), 0 2px 8px -1px hsl(var(--shadow) / 0.15)',
        '--shadow-pop': '0 8px 24px -4px hsl(var(--shadow) / 0.25), 0 4px 12px -2px hsl(var(--shadow) / 0.15)',
        '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
        '--tab-style': 'pill',
        '--button-style': 'pill',
      },
      dark: {
        '--r-control': '1rem',
        '--r-card': '1.5rem',
        '--r-pill': '9999px',
        '--r-tab': '1rem',
        '--shadow-card': '0 4px 16px -2px hsl(var(--shadow) / 0.35), 0 2px 8px -1px hsl(var(--shadow) / 0.25)',
        '--shadow-pop': '0 8px 24px -4px hsl(var(--shadow) / 0.35), 0 4px 12px -2px hsl(var(--shadow) / 0.25)',
        '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
        '--tab-style': 'pill',
        '--button-style': 'pill',
      }
    },
    "GRADIENT_DUOTONE_THEMES": {
      light: {
        '--r-control': '9999px',
        '--r-card': '0.5rem',
        '--r-pill': '9999px',
        '--r-tab': '9999px',
        '--shadow-card': 'none',
        '--shadow-pop': 'none',
        '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
        '--tab-style': 'pill',
        '--button-style': 'pill',
      },
      dark: {
        '--r-control': '9999px',
        '--r-card': '0.5rem',
        '--r-pill': '9999px',
        '--r-tab': '9999px',
        '--shadow-card': 'none',
        '--shadow-pop': 'none',
        '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
        '--tab-style': 'pill',
        '--button-style': 'pill',
      }
    },
    "NEUMORPHISM_THEMES": {
      light: {
        '--r-control': '1.25rem',
        '--r-card': '1.5rem',
        '--r-pill': '9999px',
        '--r-tab': '1.25rem',
        '--shadow-card': 'inset 2px 2px 4px hsl(var(--shadow) / 0.4), inset -2px -2px 4px hsl(var(--scrim) / 0.3), 4px 4px 8px -2px hsl(var(--shadow) / 0.3), -2px -2px 4px -1px hsl(var(--scrim) / 0.2)',
        '--shadow-pop': 'inset 3px 3px 6px hsl(var(--shadow) / 0.5), inset -3px -3px 6px hsl(var(--scrim) / 0.4), 6px 6px 12px -3px hsl(var(--shadow) / 0.3), -3px -3px 6px -2px hsl(var(--scrim) / 0.2)',
        '--heading-font': '"Inter", ui-sans-serif, system-ui, sans-serif',
        '--tab-style': 'rounded',
        '--button-style': 'solid',
      },
      dark: {
        '--r-control': '1.25rem',
        '--r-card': '1.5rem',
        '--r-pill': '9999px',
        '--r-tab': '1.25rem',
        '--shadow-card': 'inset 2px 2px 4px hsl(var(--shadow) / 0.5), inset -2px -2px 4px hsl(var(--scrim) / 0.4), 4px 4px 8px -2px hsl(var(--shadow) / 0.4), -2px -2px 4px -1px hsl(var(--scrim) / 0.3)',
        '--shadow-pop': 'inset 3px 3px 6px hsl(var(--shadow) / 0.6), inset -3px -3px 6px hsl(var(--scrim) / 0.5), 6px 6px 12px -3px hsl(var(--shadow) / 0.4), -3px -3px 6px -2px hsl(var(--scrim) / 0.3)',
        '--heading-font': '"Inter", ui-sans-serif, system-ui, sans-serif',
        '--tab-style': 'rounded',
        '--button-style': 'solid',
      }
    },
    "CYBERPUNK_THEMES": {
      light: {
        '--r-control': '0.25rem',
        '--r-card': '0.25rem',
        '--r-pill': '9999px',
        '--r-tab': '0.25rem',
        '--shadow-card': '0 0 16px hsl(var(--primary) / 0.5), 0 0 32px hsl(var(--accent) / 0.3)',
        '--shadow-pop': '0 0 24px hsl(var(--primary) / 0.6), 0 0 48px hsl(var(--accent) / 0.4)',
        '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
        '--tab-style': 'square',
        '--button-style': 'square-offset',
      },
      dark: {
        '--r-control': '0.25rem',
        '--r-card': '0.25rem',
        '--r-pill': '9999px',
        '--r-tab': '0.25rem',
        '--shadow-card': '0 0 20px hsl(var(--primary) / 0.6), 0 0 40px hsl(var(--accent) / 0.4)',
        '--shadow-pop': '0 0 32px hsl(var(--primary) / 0.7), 0 0 64px hsl(var(--accent) / 0.5)',
        '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
        '--tab-style': 'square',
        '--button-style': 'square-offset',
      }
    },
    "BAUHAUS_THEMES": {
      light: {
        '--r-control': '0',
        '--r-card': '0',
        '--r-pill': '9999px',
        '--r-tab': '0',
        '--shadow-card': '4px 4px 0 0 hsl(var(--shadow))',
        '--shadow-pop': '6px 6px 0 0 hsl(var(--shadow))',
        '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
        '--tab-style': 'square',
        '--button-style': 'square-offset',
      },
      dark: {
        '--r-control': '0',
        '--r-card': '0',
        '--r-pill': '9999px',
        '--r-tab': '0',
        '--shadow-card': '4px 4px 0 0 hsl(var(--shadow))',
        '--shadow-pop': '6px 6px 0 0 hsl(var(--shadow))',
        '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
        '--tab-style': 'square',
        '--button-style': 'square-offset',
      }
    },
    "CLAYMORPHISM_THEMES": {
      light: {
        '--r-control': '1.5rem',
        '--r-card': '2rem',
        '--r-pill': '9999px',
        '--r-tab': '1.5rem',
        '--shadow-card': 'inset 2px 2px 4px hsl(var(--shadow) / 0.4), inset -2px -2px 4px hsl(var(--scrim) / 0.3), 8px 8px 16px -4px hsl(var(--shadow) / 0.3), -4px -4px 8px -2px hsl(var(--scrim) / 0.2)',
        '--shadow-pop': 'inset 3px 3px 6px hsl(var(--shadow) / 0.5), inset -3px -3px 6px hsl(var(--scrim) / 0.4), 12px 12px 24px -6px hsl(var(--shadow) / 0.3), -6px -6px 12px -3px hsl(var(--scrim) / 0.2)',
        '--heading-font': '"Georgia", serif',
        '--tab-style': 'rounded',
        '--button-style': 'solid',
      },
      dark: {
        '--r-control': '1.5rem',
        '--r-card': '2rem',
        '--r-pill': '9999px',
        '--r-tab': '1.5rem',
        '--shadow-card': 'inset 2px 2px 4px hsl(var(--shadow) / 0.5), inset -2px -2px 4px hsl(var(--scrim) / 0.4), 8px 8px 16px -4px hsl(var(--shadow) / 0.4), -4px -4px 8px -2px hsl(var(--scrim) / 0.3)',
        '--shadow-pop': 'inset 3px 3px 6px hsl(var(--shadow) / 0.6), inset -3px -3px 6px hsl(var(--scrim) / 0.5), 12px 12px 24px -6px hsl(var(--shadow) / 0.4), -6px -6px 12px -3px hsl(var(--scrim) / 0.3)',
        '--heading-font': '"Georgia", serif',
        '--tab-style': 'rounded',
        '--button-style': 'solid',
      }
    },
    "HIGH_CONTRAST_THEMES": {
      light: {
        '--r-control': '0.25rem',
        '--r-card': '0.25rem',
        '--r-pill': '9999px',
        '--r-tab': '0.25rem',
        '--shadow-card': 'none',
        '--shadow-pop': 'none',
        '--heading-font': 'system-ui, sans-serif',
        '--tab-style': 'underline',
        '--button-style': 'outline',
      },
      dark: {
        '--r-control': '0.25rem',
        '--r-card': '0.25rem',
        '--r-pill': '9999px',
        '--r-tab': '0.25rem',
        '--shadow-card': 'none',
        '--shadow-pop': 'none',
        '--heading-font': 'system-ui, sans-serif',
        '--tab-style': 'underline',
        '--button-style': 'outline',
      }
    },
    "SKEUOMORPHIC_THEMES": {
      light: {
        '--r-control': '0.5rem',
        '--r-card': '0.75rem',
        '--r-pill': '9999px',
        '--r-tab': '0.5rem',
        '--shadow-card': '0 2px 8px -2px hsl(var(--shadow) / 0.3), 0 1px 3px -1px hsl(var(--shadow) / 0.2)',
        '--shadow-pop': '0 4px 12px -2px hsl(var(--shadow) / 0.3), 0 2px 6px -1px hsl(var(--shadow) / 0.2)',
        '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
        '--tab-style': 'rounded',
        '--button-style': 'solid',
      },
      dark: {
        '--r-control': '0.5rem',
        '--r-card': '0.75rem',
        '--r-pill': '9999px',
        '--r-tab': '0.5rem',
        '--shadow-card': '0 2px 8px -2px hsl(var(--shadow) / 0.4), 0 1px 3px -1px hsl(var(--shadow) / 0.3)',
        '--shadow-pop': '0 4px 12px -2px hsl(var(--shadow) / 0.4), 0 2px 6px -1px hsl(var(--shadow) / 0.3)',
        '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
        '--tab-style': 'rounded',
        '--button-style': 'solid',
      }
    }
  };

  const tokens = familyTokens[family];
  if (!tokens) return themeStr;

  // Replace the style layer section for light mode
  let result = themeStr;
  
  for (const mode of ['light', 'dark']) {
    const modeTokens = tokens[mode];
    const lookahead = mode === 'light' ? 'dark' : '\\}|\\]';
    const styleLayerRegex = new RegExp(`// Style layer[\\s\\S]*?(?=\\s*\\},\\s*${lookahead})`, 'g');
    
    const newStyleLayer = `      // Style layer
      "--r-control": "${modeTokens['--r-control']}",
      "--r-card": "${modeTokens['--r-card']}",
      "--r-pill": "${modeTokens['--r-pill']}",
      "--r-tab": "${modeTokens['--r-tab']}",
      "--border-width": "1px",
      "--shadow-style": "${mode === 'light' && family === 'NEUMORPHISM_THEMES' ? 'inset-and-outset' : family === 'NEUBRUTALISM_THEMES' || family === 'BAUHAUS_THEMES' ? 'hard-offset' : family === 'CLAYMORPHISM_THEMES' ? 'inset-and-outset' : family === 'CYBERPUNK_THEMES' ? 'hard-offset' : family === 'GRADIENT_DUOTONE_THEMES' || family === 'HIGH_CONTRAST_THEMES' ? 'none' : 'soft'}",
      "--shadow-card": "${modeTokens['--shadow-card']}",
      "--shadow-pop": "${modeTokens['--shadow-pop']}",
      "--blur": "${mode === 'dark' && family === 'GLASS_LIGHT_THEMES' ? '24px' : mode === 'dark' && family === 'GLASS_DARK_THEMES' ? '32px' : family === 'SKEUOMORPHIC_THEMES' ? '12px' : '0'}",
      "--surface-opacity": "${family === 'GLASS_LIGHT_THEMES' || family === 'GLASS_DARK_THEMES' ? '0.85' : family === 'SKEUOMORPHIC_THEMES' ? '0.9' : '1'}",
      "--font-heading": "${modeTokens['--heading-font']}",
      "--font-body": "${family === 'NEUBRUTALISM_THEMES' || family === 'CYBERPUNK_THEMES' || family === 'GRADIENT_DUOTONE_THEMES' ? '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace' : family === 'EDITORIAL_THEMES' || family === 'SKEUOMORPHIC_THEMES' ? '"Georgia", serif' : family === 'CLAYMORPHISM_THEMES' ? '"Georgia", serif' : '"Inter", ui-sans-serif, system-ui, sans-serif'}",
      "--tab-style": "${modeTokens['--tab-style']}",
      "--button-style": "${modeTokens['--button-style']}",
      "--bg-gradient": "${mode === 'light' ? getBgGradient(family, 'light') : 'none'}",
      "--bg-gradient-dark": "${mode === 'dark' ? getBgGradient(family, 'dark') : 'none'}",
      "--bg-pattern": "${getBgPattern(family)}"`;

    result = result.replace(styleLayerRegex, newStyleLayer);
  }

  return result;
}

function getBgGradient(family, mode) {
  const gradients = {
    'GLASS_LIGHT_THEMES': { light: 'linear-gradient(135deg, hsl(45 60% 97%) 0%, hsl(35 70% 94%) 100%)', dark: 'linear-gradient(135deg, hsl(25 15% 8%) 0%, hsl(35 12% 6%) 100%)' },
    'GLASS_DARK_THEMES': { light: 'linear-gradient(145deg, hsl(280 20% 96%) 0%, hsl(300 30% 93%) 100%)', dark: 'radial-gradient(ellipse at 50% 0%, hsl(300 20% 12%) 0%, hsl(280 25% 4%) 70%)' },
    'GRADIENT_DUOTONE_THEMES': { light: 'linear-gradient(135deg, hsl(15 50% 95%) 0%, hsl(35 70% 88%) 50%, hsl(45 80% 85%) 100%)', dark: 'linear-gradient(135deg, hsl(15 20% 6%) 0%, hsl(30 15% 8%) 50%, hsl(45 12% 10%) 100%)' },
    'SKEUOMORPHIC_THEMES': { light: 'none', dark: 'none' },
  };
  return gradients[family]?.[mode] || 'none';
}

function getBgPattern(family) {
  const patterns = {
    'NEUBRUTALISM_THEMES': 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
    'SKEUOMORPHIC_THEMES': 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Cfilter id=\'linen\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.02 0.1\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23linen)\' opacity=\'0.06\'/%3E%3C/svg%3E")',
    'CYBERPUNK_THEMES': 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(280 15% 50% / 0.1)\' stroke-width=\'1\'/%3E%3C/svg%3E")',
    'BAUHAUS_THEMES': 'none',
  };
  return patterns[family] || 'none';
}

// Extract each family array and update it
const families = [
  'GLASS_LIGHT_THEMES',
  'GLASS_DARK_THEMES',
  'NEUBRUTALISM_THEMES',
  'EDITORIAL_THEMES',
  'PASTEL_THEMES',
  'GRADIENT_DUOTONE_THEMES',
  'NEUMORPHISM_THEMES',
  'CYBERPUNK_THEMES',
  'BAUHAUS_THEMES',
  'CLAYMORPHISM_THEMES',
  'HIGH_CONTRAST_THEMES',
  'SKEUOMORPHIC_THEMES',
];

let result = source;

for (const family of families) {
  // Find the family array
  const startIdx = result.indexOf(`const ${family} = [`);
  if (startIdx === -1) continue;
  
  // Find the matching closing bracket
  let bracketCount = 0;
  let endIdx = -1;
  for (let i = startIdx; i < result.length; i++) {
    if (result[i] === '[') bracketCount++;
    else if (result[i] === ']') {
      bracketCount--;
      if (bracketCount === 0) {
        endIdx = i;
        break;
      }
    }
  }
  
  if (endIdx === -1) continue;
  
  const familyStr = result.slice(startIdx, endIdx + 1);
  const updatedFamilyStr = replaceStyleTokens(familyStr, family);
  result = result.slice(0, startIdx) + updatedFamilyStr + result.slice(endIdx + 1);
}

// Also update the DEFAULT_PRESET with new tokens
const defaultPresetRegex = /const DEFAULT_PRESET = \{[\s\S]*?tokens: \{ light: \{\}, dark: \{\} \},/;
const newDefaultPreset = `const DEFAULT_PRESET = {
  id: "notecraft",
  name: "LemonNote default",
  mode: null,
  surface: "plain",
  tokens: {
    light: {
      "--r-control": "0.5rem",
      "--r-card": "0.75rem",
      "--r-pill": "9999px",
      "--r-tab": "0.5rem",
      "--border-width": "1px",
      "--shadow-style": "soft",
      "--shadow-card": "0 2px 8px -2px hsl(var(--shadow) / 0.3), 0 1px 3px -1px hsl(var(--shadow) / 0.2)",
      "--shadow-pop": "0 4px 12px -2px hsl(var(--shadow) / 0.3), 0 2px 6px -1px hsl(var(--shadow) / 0.2)",
      "--blur": "0",
      "--surface-opacity": "1",
      "--font-heading": "Inter, ui-sans-serif, system-ui, sans-serif",
      "--font-body": "Inter, ui-sans-serif, system-ui, sans-serif",
      "--tab-style": "rounded",
      "--button-style": "solid",
      "--bg-gradient": "none",
      "--bg-pattern": "none",
    },
    dark: {
      "--r-control": "0.5rem",
      "--r-card": "0.75rem",
      "--r-pill": "9999px",
      "--r-tab": "0.5rem",
      "--border-width": "1px",
      "--shadow-style": "soft",
      "--shadow-card": "0 2px 8px -2px hsl(var(--shadow) / 0.4), 0 1px 3px -1px hsl(var(--shadow) / 0.3)",
      "--shadow-pop": "0 4px 12px -2px hsl(var(--shadow) / 0.4), 0 2px 6px -1px hsl(var(--shadow) / 0.3)",
      "--blur": "0",
      "--surface-opacity": "1",
      "--font-heading": "Inter, ui-sans-serif, system-ui, sans-serif",
      "--font-body": "Inter, ui-sans-serif, system-ui, sans-serif",
      "--tab-style": "rounded",
      "--button-style": "solid",
      "--bg-gradient-dark": "none",
      "--bg-pattern": "none",
    },
  },
};`;

result = result.replace(defaultPresetRegex, newDefaultPreset);

writeFileSync("src/lib/theme-presets.js", result);
console.log("Theme presets updated with new shape tokens!");