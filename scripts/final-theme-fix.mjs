// Complete theme fix - all in one script
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// ============================================================
// STEP 1: Update shape tokens for all themes
// ============================================================

const FAMILY_CONFIG = {
  GLASS_LIGHT_THEMES: {
    shadowStyle: 'soft',
    light: {
      '--r-control': '0.75rem', '--r-card': '1rem', '--r-pill': '9999px', '--r-tab': '0.75rem',
      '--shadow-card': '0 8px 24px -4px hsl(var(--shadow) / 0.3), 0 4px 12px -2px hsl(var(--shadow) / 0.2)',
      '--shadow-pop': '0 12px 32px -4px hsl(var(--shadow) / 0.3), 0 6px 16px -3px hsl(var(--shadow) / 0.2)',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'rounded', '--button-style': 'pill',
      '--blur': '16px', '--surface-opacity': '0.85',
      '--bg-gradient': 'linear-gradient(135deg, hsl(45 60% 97%) 0%, hsl(35 70% 94%) 100%)',
      '--bg-pattern': 'none',
    },
    dark: {
      '--r-control': '0.75rem', '--r-card': '1rem', '--r-pill': '9999px', '--r-tab': '0.75rem',
      '--shadow-card': '0 8px 24px -4px hsl(var(--shadow) / 0.4), 0 4px 12px -2px hsl(var(--shadow) / 0.3)',
      '--shadow-pop': '0 12px 32px -4px hsl(var(--shadow) / 0.4), 0 6px 16px -3px hsl(var(--shadow) / 0.3)',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'rounded', '--button-style': 'pill',
      '--blur': '24px', '--surface-opacity': '0.85',
      '--bg-gradient-dark': 'linear-gradient(135deg, hsl(25 15% 8%) 0%, hsl(35 12% 6%) 100%)',
      '--bg-pattern': 'none',
    }
  },
  GLASS_DARK_THEMES: {
    shadowStyle: 'soft',
    light: {
      '--r-control': '0.5rem', '--r-card': '0.75rem', '--r-pill': '9999px', '--r-tab': '0.5rem',
      '--shadow-card': '0 8px 24px -4px hsl(var(--shadow) / 0.3), 0 4px 12px -2px hsl(var(--shadow) / 0.2)',
      '--shadow-pop': '0 12px 32px -4px hsl(var(--shadow) / 0.3), 0 6px 16px -3px hsl(var(--shadow) / 0.2)',
      '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'square', '--button-style': 'square-offset',
      '--blur': '20px', '--surface-opacity': '0.8',
      '--bg-gradient': 'linear-gradient(145deg, hsl(280 20% 96%) 0%, hsl(300 30% 93%) 100%)',
      '--bg-pattern': 'none',
    },
    dark: {
      '--r-control': '0.5rem', '--r-card': '0.75rem', '--r-pill': '9999px', '--r-tab': '0.5rem',
      '--shadow-card': '0 8px 24px -4px hsl(var(--shadow) / 0.4), 0 4px 12px -2px hsl(var(--shadow) / 0.3)',
      '--shadow-pop': '0 12px 32px -4px hsl(var(--shadow) / 0.4), 0 6px 16px -3px hsl(var(--shadow) / 0.3)',
      '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'square', '--button-style': 'square-offset',
      '--blur': '32px', '--surface-opacity': '0.8',
      '--bg-gradient-dark': 'radial-gradient(ellipse at 50% 0%, hsl(300 20% 12%) 0%, hsl(280 25% 4%) 70%)',
      '--bg-pattern': 'none',
    }
  },
  NEUBRUTALISM_THEMES: {
    shadowStyle: 'hard-offset',
    light: {
      '--r-control': '0', '--r-card': '0', '--r-pill': '9999px', '--r-tab': '0',
      '--shadow-card': '4px 4px 0 0 hsl(var(--shadow))',
      '--shadow-pop': '6px 6px 0 0 hsl(var(--shadow))',
      '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'square', '--button-style': 'square-offset',
      '--blur': '0', '--surface-opacity': '1',
      '--bg-gradient': 'none',
      '--bg-pattern': 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
    },
    dark: {
      '--r-control': '0', '--r-card': '0', '--r-pill': '9999px', '--r-tab': '0',
      '--shadow-card': '4px 4px 0 0 hsl(var(--shadow))',
      '--shadow-pop': '6px 6px 0 0 hsl(var(--shadow))',
      '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'square', '--button-style': 'square-offset',
      '--blur': '0', '--surface-opacity': '1',
      '--bg-gradient-dark': 'none',
      '--bg-pattern': 'url("data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\' viewBox=\\'0 0 100 100\\'%3E%3Cfilter id=\\'noise\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.9\\' numOctaves=\\'4\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'100\\' height=\\'100\\' filter=\\'url(%23noise)\\'' opacity=\\'0.05\\''/%3E%3C/svg%3E")',
    }
  },
  EDITORIAL_THEMES: {
    shadowStyle: 'soft',
    light: {
      '--r-control': '0.25rem', '--r-card': '0.5rem', '--r-pill': '9999px', '--r-tab': '0.25rem',
      '--shadow-card': '0 1px 3px hsl(var(--shadow) / 0.2)',
      '--shadow-pop': '0 2px 6px hsl(var(--shadow) / 0.2)',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Georgia", serif',
      '--tab-style': 'underline', '--button-style': 'outline',
      '--blur': '0', '--surface-opacity': '1',
      '--bg-gradient': 'none', '--bg-pattern': 'none',
    },
    dark: {
      '--r-control': '0.25rem', '--r-card': '0.5rem', '--r-pill': '9999px', '--r-tab': '0.25rem',
      '--shadow-card': '0 1px 3px hsl(var(--shadow) / 0.3)',
      '--shadow-pop': '0 2px 6px hsl(var(--shadow) / 0.3)',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Georgia", serif',
      '--tab-style': 'underline', '--button-style': 'outline',
      '--blur': '0', '--surface-opacity': '1',
      '--bg-gradient-dark': 'none', '--bg-pattern': 'none',
    }
  },
  PASTEL_THEMES: {
    shadowStyle: 'soft',
    light: {
      '--r-control': '1rem', '--r-card': '1.5rem', '--r-pill': '9999px', '--r-tab': '1rem',
      '--shadow-card': '0 4px 16px -2px hsl(var(--shadow) / 0.25), 0 2px 8px -1px hsl(var(--shadow) / 0.15)',
      '--shadow-pop': '0 8px 24px -4px hsl(var(--shadow) / 0.25), 0 4px 12px -2px hsl(var(--shadow) / 0.15)',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'pill', '--button-style': 'pill',
      '--blur': '0', '--surface-opacity': '1',
      '--bg-gradient': 'none', '--bg-pattern': 'none',
    },
    dark: {
      '--r-control': '1rem', '--r-card': '1.5rem', '--r-pill': '9999px', '--r-tab': '1rem',
      '--shadow-card': '0 4px 16px -2px hsl(var(--shadow) / 0.35), 0 2px 8px -1px hsl(var(--shadow) / 0.25)',
      '--shadow-pop': '0 8px 24px -4px hsl(var(--shadow) / 0.35), 0 4px 12px -2px hsl(var(--shadow) / 0.25)',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'pill', '--button-style': 'pill',
      '--blur': '0', '--surface-opacity': '1',
      '--bg-gradient-dark': 'none', '--bg-pattern': 'none',
    }
  },
  GRADIENT_DUOTONE_THEMES: {
    shadowStyle: 'none',
    light: {
      '--r-control': '9999px', '--r-card': '0.5rem', '--r-pill': '9999px', '--r-tab': '9999px',
      '--shadow-card': 'none', '--shadow-pop': 'none',
      '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--font-body': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--tab-style': 'pill', '--button-style': 'pill',
      '--blur': '0', '--surface-opacity': '1',
      '--bg-gradient': 'linear-gradient(135deg, hsl(15 50% 95%) 0%, hsl(35 70% 88%) 50%, hsl(45 80% 85%) 100%)',
      '--bg-pattern': 'none',
    },
    dark: {
      '--r-control': '9999px', '--r-card': '0.5rem', '--r-pill': '9999px', '--r-tab': '9999px',
      '--shadow-card': 'none', '--shadow-pop': 'none',
      '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--font-body': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--tab-style': 'pill', '--button-style': 'pill',
      '--blur': '0', '--surface-opacity': '1',
      '--bg-gradient-dark': 'linear-gradient(135deg, hsl(15 20% 6%) 0%, hsl(30 15% 8%) 50%, hsl(45 12% 10%) 100%)',
      '--bg-pattern': 'none',
    }
  },
  NEUMORPHISM_THEMES: {
    shadowStyle: 'inset-and-outset',
    light: {
      '--r-control': '1.25rem', '--r-card': '1.5rem', '--r-pill': '9999px', '--r-tab': '1.25rem',
      '--shadow-card': 'inset 2px 2px 4px hsl(var(--shadow) / 0.4), inset -2px -2px 4px hsl(var(--scrim) / 0.3), 4px 4px 8px -2px hsl(var(--shadow) / 0.3), -2px -2px 4px -1px hsl(var(--scrim) / 0.2)',
      '--shadow-pop': 'inset 3px 3px 6px hsl(var(--shadow) / 0.5), inset -3px -3px 6px hsl(var(--scrim) / 0.4), 6px 6px 12px -3px hsl(var(--shadow) / 0.3), -3px -3px 6px -2px hsl(var(--scrim) / 0.2)',
      '--heading-font': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'rounded', '--button-style': 'solid',
      '--blur': '0', '--surface-opacity': '1',
      '--bg-gradient': 'none', '--bg-pattern': 'none',
    },
    dark: {
      '--r-control': '1.25rem', '--r-card': '1.5rem', '--r-pill': '9999px', '--r-tab': '1.25rem',
      '--shadow-card': 'inset 2px 2px 4px hsl(var(--shadow) / 0.5), inset -2px -2px 4px hsl(var(--scrim) / 0.4), 4px 4px 8px -2px hsl(var(--shadow) / 0.4), -2px -2px 4px -1px hsl(var(--scrim) / 0.3)',
      '--shadow-pop': 'inset 3px 3px 6px hsl(var(--shadow) / 0.6), inset -3px -3px 6px hsl(var(--scrim) / 0.5), 6px 6px 12px -3px hsl(var(--shadow) / 0.4), -3px -3px 6px -2px hsl(var(--scrim) / 0.3)',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'rounded', '--button-style': 'solid',
      '--blur': '0', '--surface-opacity': '1',
      '--bg-gradient-dark': 'none', '--bg-pattern': 'none',
    }
  },
  CYBERPUNK_THEMES: {
    shadowStyle: 'hard-offset',
    light: {
      '--r-control': '0.25rem', '--r-card': '0.25rem', '--r-pill': '9999px', '--r-tab': '0.25rem',
      '--shadow-card': '0 0 16px hsl(var(--primary) / 0.5), 0 0 32px hsl(var(--accent) / 0.3)',
      '--shadow-pop': '0 0 24px hsl(var(--primary) / 0.6), 0 0 48px hsl(var(--accent) / 0.4)',
      '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--font-body': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--tab-style': 'square', '--button-style': 'square-offset',
      '--blur': '0', '--surface-opacity': '1',
      '--bg-gradient': 'none',
      '--bg-pattern': 'url("data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'40\\' height=\\'40\\' viewBox=\\'0 0 40 40\\'%3E%3Cpath d=\\'M0 40H40M40 0V40\\' stroke=\\'hsl(280 15% 50% / 0.1)\\' stroke-width=\\'1\\'/%3E%3C/svg%3E")',
    },
    dark: {
      '--r-control': '0.25rem', '--r-card': '0.25rem', '--r-pill': '9999px', '--r-tab': '0.25rem',
      '--shadow-card': '0 0 20px hsl(var(--primary) / 0.6), 0 0 40px hsl(var(--accent) / 0.4)',
      '--shadow-pop': '0 0 32px hsl(var(--primary) / 0.7), 0 0 64px hsl(var(--accent) / 0.5)',
      '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--font-body': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--tab-style': 'square', '--button-style': 'square-offset',
      '--blur': '0', '--surface-opacity': '1',
      '--bg-gradient-dark': 'radial-gradient(ellipse at 50% 50%, hsl(280 20% 12%) 0%, hsl(260 25% 5%) 70%)',
      '--bg-pattern': 'url("data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'40\\' height=\\'40\\' viewBox=\\'0 0 40 40\\'%3E%3Cpath d=\\'M0 40H40M40 0V40\\' stroke=\\'hsl(180 90% 55% / 0.08)\\' stroke-width=\\'1\\'/%3E%3C/svg%3E")',
    }
  },
  BAUHAUS_THEMES: {
    shadowStyle: 'hard-offset',
    light: {
      '--r-control': '0', '--r-card': '0', '--r-pill': '9999px', '--r-tab': '0',
      '--shadow-card': '4px 4px 0 0 hsl(var(--shadow))',
      '--shadow-pop': '6px 6px 0 0 hsl(var(--shadow))',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'square', '--button-style': 'square-offset',
      '--blur': '0', '--surface-opacity': '1',
      '--bg-gradient': 'none', '--bg-pattern': 'none',
    },
    dark: {
      '--r-control': '0', '--r-card': '0', '--r-pill': '9999px', '--r-tab': '0',
      '--shadow-card': '4px 4px 0 0 hsl(var(--shadow))',
      '--shadow-pop': '6px 6px 0 0 hsl(var(--shadow))',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'square', '--button-style': 'square-offset',
      '--blur': '0', '--surface-opacity': '1',
      '--bg-gradient-dark': 'none', '--bg-pattern': 'none',
    }
  },
  CLAYMORPHISM_THEMES: {
    shadowStyle: 'inset-and-outset',
    light: {
      '--r-control': '1.5rem', '--r-card': '2rem', '--r-pill': '9999px', '--r-tab': '1.5rem',
      '--shadow-card': 'inset 2px 2px 4px hsl(var(--shadow) / 0.4), inset -2px -2px 4px hsl(var(--scrim) / 0.3), 8px 8px 16px -4px hsl(var(--shadow) / 0.3), -4px -4px 8px -2px hsl(var(--scrim) / 0.2)',
      '--shadow-pop': 'inset 3px 3px 6px hsl(var(--shadow) / 0.5), inset -3px -3px 6px hsl(var(--scrim) / 0.4), 12px 12px 24px -6px hsl(var(--shadow) / 0.3), -6px -6px 12px -3px hsl(var(--scrim) / 0.2)',
      '--heading-font': '"Georgia", serif',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'rounded', '--button-style': 'solid',
      '--blur': '0', '--surface-opacity': '1',
      '--bg-gradient': 'none', '--bg-pattern': 'none',
    },
    dark: {
      '--r-control': '1.5rem', '--r-card': '2rem', '--r-pill': '9999px', '--r-tab': '1.5rem',
      '--shadow-card': 'inset 2px 2px 4px hsl(var(--shadow) / 0.5), inset -2px -2px 4px hsl(var(--scrim) / 0.4), 8px 8px 16px -4px hsl(var(--shadow) / 0.4), -4px -4px 8px -2px hsl(var(--scrim) / 0.3)',
      '--shadow-pop': 'inset 3px 3px 6px hsl(var(--shadow) / 0.6), inset -3px -3px 6px hsl(var(--scrim) / 0.5), 12px 12px 24px -6px hsl(var(--shadow) / 0.4), -6px -6px 12px -3px hsl(var(--scrim) / 0.3)',
      '--heading-font': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'rounded', '--button-style': 'solid',
      '--blur': '0', '--surface-opacity': '1',
      '--bg-gradient-dark': 'none', '--bg-pattern': 'none',
    }
  },
  HIGH_CONTRAST_THEMES: {
    shadowStyle: 'none',
    light: {
      '--r-control': '0.25rem', '--r-card': '0.25rem', '--r-pill': '9999px', '--r-tab': '0.25rem',
      '--shadow-card': 'none', '--shadow-pop': 'none',
      '--heading-font': 'system-ui, sans-serif',
      '--font-body': 'system-ui, sans-serif',
      '--tab-style': 'underline', '--button-style': 'outline',
      '--blur': '0', '--surface-opacity': '1',
      '--bg-gradient': 'none', '--bg-pattern': 'none',
    },
    dark: {
      '--r-control': '0.25rem', '--r-card': '0.25rem', '--r-pill': '9999px', '--r-tab': '0.25rem',
      '--shadow-card': 'none', '--shadow-pop': 'none',
      '--heading-font': 'system-ui, sans-serif',
      '--font-body': 'system-ui, sans-serif',
      '--tab-style': 'underline', '--button-style': 'outline',
      '--blur': '0', '--surface-opacity': '1',
      '--bg-gradient-dark': 'none', '--bg-pattern': 'none',
    }
  },
  SKEUOMORPHIC_THEMES: {
    shadowStyle: 'soft',
    light: {
      '--r-control': '0.5rem', '--r-card': '0.75rem', '--r-pill': '9999px', '--r-tab': '0.5rem',
      '--shadow-card': '0 2px 8px -2px hsl(var(--shadow) / 0.3), 0 1px 3px -1px hsl(var(--shadow) / 0.2)',
      '--shadow-pop': '0 4px 12px -2px hsl(var(--shadow) / 0.3), 0 2px 6px -1px hsl(var(--shadow) / 0.2)',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Georgia", serif',
      '--tab-style': 'rounded', '--button-style': 'solid',
      '--blur': '8px', '--surface-opacity': '0.9',
      '--bg-gradient': 'none',
      '--bg-pattern': 'url("data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'200\\' viewBox=\\'0 0 200 200\\'%3E%3Cfilter id=\\'linen\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.02 0.1\\' numOctaves=\\'4\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'200\\' height=\\'200\\' filter=\\'url(%23linen)\\'' opacity=\\'0.06\\''/%3E%3C/svg%3E")',
    },
    dark: {
      '--r-control': '0.5rem', '--r-card': '0.75rem', '--r-pill': '9999px', '--r-tab': '0.5rem',
      '--shadow-card': '0 2px 8px -2px hsl(var(--shadow) / 0.4), 0 1px 3px -1px hsl(var(--shadow) / 0.3)',
      '--shadow-pop': '0 4px 12px -2px hsl(var(--shadow) / 0.4), 0 2px 6px -1px hsl(var(--shadow) / 0.3)',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Instrument Serif", ui-serif, Georgia, serif',
      '--tab-style': 'rounded', '--button-style': 'solid',
      '--blur': '12px', '--surface-opacity': '0.9',
      '--bg-gradient-dark': 'none',
      '--bg-pattern': 'url("data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\' viewBox=\\'0 0 100 100\\'%3E%3Cfilter id=\\'vellum\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.05\\' numOctaves=\\'3\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'100\\' height=\\'100\\' filter=\\'url(%23vellum)\\'' opacity=\\'0.06\\''/%3E%3C/svg%3E")',
    }
  }
};

// Themes to remove
const THEMES_TO_REMOVE = ['pastel-evening', 'duo-ocean', 'neu-deep', 'hc-dark-pure', 'paper-vellum'];

// ============================================================
// STEP 2: Build style layer for a theme
// ============================================================

function buildStyleLayer(config, mode, shadowStyle) {
  const c = config[mode];
  const escapeForJson = (str) => JSON.stringify(str);
  const escapeBgPattern = (str) => str.replace(/"/g, '\\"');
  const lines = [
    '      // Style layer',
    `      "--r-control": "${c['--r-control']}",`,
    `      "--r-card": "${c['--r-card']}",`,
    `      "--r-pill": "${c['--r-pill']}",`,
    `      "--r-tab": "${c['--r-tab']}",`,
    `      "--border-width": "1px",`,
    `      "--shadow-style": "${shadowStyle}",`,
    `      "--shadow-card": "${c['--shadow-card']}",`,
    `      "--shadow-pop": "${c['--shadow-pop']}",`,
    `      "--blur": "${c['--blur']}",`,
    `      "--surface-opacity": "${c['--surface-opacity']}",`,
    `      "--font-heading": ${escapeForJson(c['--heading-font'])},`,
    `      "--font-body": ${escapeForJson(c['--font-body'])},`,
    `      "--tab-style": "${c['--tab-style']}",`,
    `      "--button-style": "${c['--button-style']}",`,
    `      "${mode === 'light' ? '--bg-gradient' : '--bg-gradient-dark'}": "${c[mode === 'light' ? '--bg-gradient' : '--bg-gradient-dark']}",`,
    `      "--bg-pattern": "${escapeBgPattern(c['--bg-pattern'])}",`,
  ];
  return lines.join('\n');
}

// ============================================================
// STEP 3: Color fixes for distinctiveness
// ============================================================

const COLOR_FIXES = [
  { themeId: 'glass-aurora', mode: 'light', primary: '190 70% 30%', 'primary-foreground': '0 0% 100%' },
  { themeId: 'brutalist-ink', mode: 'light', background: '38 25% 92%', foreground: '38 30% 7%', primary: '38 35% 10%' },
  { themeId: 'brutalist-ink', mode: 'dark', background: '15 25% 5%', foreground: '15 15% 95%', primary: '15 35% 82%' },
  { themeId: 'editorial-classic', mode: 'light', background: '25 45% 95%', foreground: '25 25% 7%', primary: '25 50% 18%' },
  { themeId: 'editorial-classic', mode: 'dark', background: '30 30% 4%', foreground: '30 10% 95%', primary: '30 50% 80%' },
  { themeId: 'editorial-modern', mode: 'light', background: '200 40% 96%', foreground: '200 20% 6%', primary: '200 60% 20%' },
  { themeId: 'hc-dark-warm', mode: 'light', background: '35 40% 97%', foreground: '35 30% 3%', primary: '35 60% 6%' },
  { themeId: 'hc-dark-warm', mode: 'dark', background: '38 22% 3%', foreground: '38 10% 98%', primary: '38 55% 94%' },
  { themeId: 'paper-linen', mode: 'light', background: '52 50% 95%', foreground: '50 25% 8%', primary: '50 55% 15%' },
  { themeId: 'paper-linen', mode: 'dark', background: '46 18% 6%', foreground: '48 10% 94%', primary: '46 45% 82%' },
  { themeId: 'pastel-morning', mode: 'light', background: '12 60% 97%', foreground: '12 30% 10%', primary: '12 80% 28%' },
  { themeId: 'pastel-morning', mode: 'dark', background: '15 15% 7%', foreground: '15 10% 93%', primary: '15 70% 68%' },
  { themeId: 'duo-sunset', mode: 'light', background: '6 70% 96%', foreground: '4 40% 8%', primary: '4 90% 25%' },
  { themeId: 'duo-sunset', mode: 'dark', background: '8 25% 5%', foreground: '12 10% 93%', primary: '10 90% 68%' },
  { themeId: 'neu-soft', mode: 'light', background: '220 25% 88%', foreground: '220 25% 11%', primary: '220 30% 25%' },
  { themeId: 'neu-soft', mode: 'dark', background: '218 18% 10%', foreground: '218 10% 90%', primary: '218 30% 72%' },
  { themeId: 'clay-cool', mode: 'light', background: '205 15% 88%', foreground: '205 25% 8%', primary: '205 60% 22%' },
  { themeId: 'clay-cool', mode: 'dark', background: '208 15% 9%', foreground: '208 10% 92%', primary: '208 40% 62%' },
];

const ALLOWED_TOKENS = ['--background', '--foreground', '--primary', '--primary-foreground', '--chart-1', '--node-ring'];

// ============================================================
// MAIN PROCESSING
// ============================================================

let result = source;

// Update style layers for all themes
const families = Object.keys(FAMILY_CONFIG);
let styleLayerCount = 0;
let familyIndex = 0;

while (true) {
  const styleLayerIdx = result.indexOf('// Style layer', styleLayerCount > 0 ? result.indexOf('// Style layer', styleLayerCount) : 0);
  if (styleLayerIdx === -1) break;
  
  const nextStyleLayer = result.indexOf('// Style layer', styleLayerIdx + 1);
  const nextBrace = result.indexOf('},', styleLayerIdx);
  const nextBracket = result.indexOf('],', styleLayerIdx);
  
  const bgPatternIdx = result.indexOf('"--bg-pattern"', styleLayerIdx);
  let endIdx = styleLayerIdx;
  if (bgPatternIdx !== -1) {
    let commaIdx = bgPatternIdx;
    while (commaIdx < result.length && result[commaIdx] !== ',') commaIdx++;
    if (commaIdx < result.length) endIdx = commaIdx + 1;
  }
  if (endIdx === styleLayerIdx) {
    endIdx = nextStyleLayer !== -1 ? nextStyleLayer : (nextBrace !== -1 ? nextBrace + 2 : styleLayerIdx + 500);
  }
  
  const family = families[familyIndex];
  const config = FAMILY_CONFIG[family];
  const shadowStyle = config.shadowStyle;
  const themeInFamily = Math.floor(styleLayerCount / 2) % 2;
  const mode = styleLayerCount % 2 === 0 ? 'light' : 'dark';
  
  const newStyleLayer = buildStyleLayer(config, mode, shadowStyle);
  result = result.slice(0, styleLayerIdx) + newStyleLayer + result.slice(endIdx);
  
  styleLayerCount++;
  if (styleLayerCount % 4 === 0) familyIndex++;
  if (familyIndex >= families.length) break;
}

// Apply color fixes
for (const fix of COLOR_FIXES) {
  const themeStart = result.indexOf(`id: "${fix.themeId}"`);
  if (themeStart === -1) continue;
  const modeStart = result.indexOf(`${fix.mode}:`, themeStart);
  if (modeStart === -1) continue;
  let bracePos = modeStart;
  while (bracePos < result.length && result[bracePos] !== '{') bracePos++;
  if (bracePos === result.length) continue;
  let depth = 0, modeEnd = -1;
  for (let i = bracePos; i < result.length; i++) {
    if (result[i] === '{') depth++;
    else if (result[i] === '}') { depth--; if (depth === 0) { modeEnd = i; break; } }
  }
  if (modeEnd === -1) continue;
  let modeStr = result.slice(bracePos, modeEnd + 1);
  for (const [key, value] of Object.entries(fix)) {
    if (key === 'themeId' || key === 'mode') continue;
    if (!ALLOWED_TOKENS.includes(`--${key}`)) continue;
    const tokenName = `--${key}`;
    const regex = new RegExp(`"${tokenName}":\\s*"[^"]*"`);
    if (regex.test(modeStr)) modeStr = modeStr.replace(regex, `"${tokenName}": "${value}"`);
  }
  if (fix.primary) {
    modeStr = modeStr.replace(/"--chart-1":\s*"[^"]*"/, `"--chart-1": "${fix.primary}"`);
    modeStr = modeStr.replace(/"--node-ring":\s*"[^"]*"/, `"--node-ring": "${fix.primary}"`);
  }
  result = result.slice(0, bracePos) + modeStr + result.slice(modeEnd + 1);
}

// Remove themes
for (const themeId of THEMES_TO_REMOVE) {
  let searchPos = 0;
  while (true) {
    const commentPos = result.indexOf(`// `, searchPos);
    if (commentPos === -1) break;
    const idPos = result.indexOf(`id: "${themeId}"`, commentPos);
    if (idPos !== -1 && idPos - commentPos < 200) {
      const themeStart = commentPos;
      let bracePos = idPos;
      while (bracePos < result.length && result[bracePos] !== '{') bracePos++;
      let depth = 0, themeEnd = -1;
      for (let i = bracePos; i < result.length; i++) {
        if (result[i] === '{') depth++;
        else if (result[i] === '}') { depth--; if (depth === 0) { themeEnd = i; break; } }
      }
      if (themeEnd !== -1) {
        let endPos = themeEnd + 1;
        if (endPos < result.length && result[endPos] === ',') endPos++;
        result = result.slice(0, themeStart) + result.slice(endPos);
        console.log(`Removed ${themeId}`);
      }
      break;
    }
    searchPos = commentPos + 1;
  }
}

// Fix family comments
result = result.replace('// FAMILY 5: SOFT PASTEL / ORGANIC — 2 themes', '// FAMILY 5: SOFT PASTEL / ORGANIC — 1 theme');
result = result.replace('// FAMILY 6: GRADIENT DUOTONE — 2 themes', '// FAMILY 6: GRADIENT DUOTONE — 1 theme');
result = result.replace('// FAMILY 7: NEUMORPHISM — 2 themes', '// FAMILY 7: NEUMORPHISM — 1 theme');
result = result.replace('// FAMILY 11: HIGH-CONTRAST DARK — 2 themes', '// FAMILY 11: HIGH-CONTRAST DARK — 1 theme');
result = result.replace('// FAMILY 12: SKEUOMORPHIC PAPER — 2 themes', '// FAMILY 12: SKEUOMORPHIC PAPER — 1 theme');

// Fix HIGH_CONTRAST_THEMES - remove stray dark block from removed hc-dark-pure
const hcStart = result.indexOf('const HIGH_CONTRAST_THEMES = [');
if (hcStart !== -1) {
  const darkBlockStart = result.indexOf('    dark: {', hcStart);
  if (darkBlockStart !== -1 && darkBlockStart - hcStart < 200) {
    // Find the end of this dark block
    let bracePos = darkBlockStart;
    while (bracePos < result.length && result[bracePos] !== '{') bracePos++;
    let depth = 0, blockEnd = -1;
    for (let i = bracePos; i < result.length; i++) {
      if (result[i] === '{') depth++;
      else if (result[i] === '}') { depth--; if (depth === 0) { blockEnd = i; break; } }
    }
    if (blockEnd !== -1) {
      let endPos = blockEnd + 1;
      if (endPos < result.length && result[endPos] === ',') endPos++;
      // Remove from the comment before dark block to end of block
      const commentBefore = result.lastIndexOf('// ', darkBlockStart);
      if (commentBefore !== -1 && darkBlockStart - commentBefore < 50) {
        result = result.slice(0, commentBefore) + result.slice(endPos);
      } else {
        result = result.slice(0, darkBlockStart) + result.slice(endPos);
      }
      console.log('Removed stray dark block from HIGH_CONTRAST_THEMES');
    }
  }

writeFileSync("src/lib/theme-presets.js", result);
console.log("All fixes applied!");