// Update theme presets with new shape tokens - safer version
// Run: node scripts/update-theme-tokens-v2.mjs

import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// Family-specific token configurations
const FAMILY_CONFIG = {
  GLASS_LIGHT_THEMES: {
    light: {
      '--r-control': '0.75rem',
      '--r-card': '1rem',
      '--r-pill': '9999px',
      '--r-tab': '0.75rem',
      '--shadow-card': '0 8px 24px -4px hsl(var(--shadow) / 0.3), 0 4px 12px -2px hsl(var(--shadow) / 0.2)',
      '--shadow-pop': '0 12px 32px -4px hsl(var(--shadow) / 0.3), 0 6px 16px -3px hsl(var(--shadow) / 0.2)',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'rounded',
      '--button-style': 'pill',
      '--blur': '16px',
      '--surface-opacity': '0.85',
    },
    dark: {
      '--r-control': '0.75rem',
      '--r-card': '1rem',
      '--r-pill': '9999px',
      '--r-tab': '0.75rem',
      '--shadow-card': '0 8px 24px -4px hsl(var(--shadow) / 0.4), 0 4px 12px -2px hsl(var(--shadow) / 0.3)',
      '--shadow-pop': '0 12px 32px -4px hsl(var(--shadow) / 0.4), 0 6px 16px -3px hsl(var(--shadow) / 0.3)',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'rounded',
      '--button-style': 'pill',
      '--blur': '24px',
      '--surface-opacity': '0.85',
    }
  },
  GLASS_DARK_THEMES: {
    light: {
      '--r-control': '0.5rem',
      '--r-card': '0.75rem',
      '--r-pill': '9999px',
      '--r-tab': '0.5rem',
      '--shadow-card': '0 8px 24px -4px hsl(var(--shadow) / 0.3), 0 4px 12px -2px hsl(var(--shadow) / 0.2)',
      '--shadow-pop': '0 12px 32px -4px hsl(var(--shadow) / 0.3), 0 6px 16px -3px hsl(var(--shadow) / 0.2)',
      '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'square',
      '--button-style': 'square-offset',
      '--blur': '20px',
      '--surface-opacity': '0.8',
    },
    dark: {
      '--r-control': '0.5rem',
      '--r-card': '0.75rem',
      '--r-pill': '9999px',
      '--r-tab': '0.5rem',
      '--shadow-card': '0 8px 24px -4px hsl(var(--shadow) / 0.4), 0 4px 12px -2px hsl(var(--shadow) / 0.3)',
      '--shadow-pop': '0 12px 32px -4px hsl(var(--shadow) / 0.4), 0 6px 16px -3px hsl(var(--shadow) / 0.3)',
      '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'square',
      '--button-style': 'square-offset',
      '--blur': '32px',
      '--surface-opacity': '0.8',
    }
  },
  NEUBRUTALISM_THEMES: {
    light: {
      '--r-control': '0',
      '--r-card': '0',
      '--r-pill': '9999px',
      '--r-tab': '0',
      '--shadow-card': '4px 4px 0 0 hsl(var(--shadow))',
      '--shadow-pop': '6px 6px 0 0 hsl(var(--shadow))',
      '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'square',
      '--button-style': 'square-offset',
      '--blur': '0',
      '--surface-opacity': '1',
    },
    dark: {
      '--r-control': '0',
      '--r-card': '0',
      '--r-pill': '9999px',
      '--r-tab': '0',
      '--shadow-card': '4px 4px 0 0 hsl(var(--shadow))',
      '--shadow-pop': '6px 6px 0 0 hsl(var(--shadow))',
      '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'square',
      '--button-style': 'square-offset',
      '--blur': '0',
      '--surface-opacity': '1',
    }
  },
  EDITORIAL_THEMES: {
    light: {
      '--r-control': '0.25rem',
      '--r-card': '0.5rem',
      '--r-pill': '9999px',
      '--r-tab': '0.25rem',
      '--shadow-card': '0 1px 3px hsl(var(--shadow) / 0.2)',
      '--shadow-pop': '0 2px 6px hsl(var(--shadow) / 0.2)',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Georgia", serif',
      '--tab-style': 'underline',
      '--button-style': 'outline',
      '--blur': '0',
      '--surface-opacity': '1',
    },
    dark: {
      '--r-control': '0.25rem',
      '--r-card': '0.5rem',
      '--r-pill': '9999px',
      '--r-tab': '0.25rem',
      '--shadow-card': '0 1px 3px hsl(var(--shadow) / 0.3)',
      '--shadow-pop': '0 2px 6px hsl(var(--shadow) / 0.3)',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Georgia", serif',
      '--tab-style': 'underline',
      '--button-style': 'outline',
      '--blur': '0',
      '--surface-opacity': '1',
    }
  },
  PASTEL_THEMES: {
    light: {
      '--r-control': '1rem',
      '--r-card': '1.5rem',
      '--r-pill': '9999px',
      '--r-tab': '1rem',
      '--shadow-card': '0 4px 16px -2px hsl(var(--shadow) / 0.25), 0 2px 8px -1px hsl(var(--shadow) / 0.15)',
      '--shadow-pop': '0 8px 24px -4px hsl(var(--shadow) / 0.25), 0 4px 12px -2px hsl(var(--shadow) / 0.15)',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'pill',
      '--button-style': 'pill',
      '--blur': '0',
      '--surface-opacity': '1',
    },
    dark: {
      '--r-control': '1rem',
      '--r-card': '1.5rem',
      '--r-pill': '9999px',
      '--r-tab': '1rem',
      '--shadow-card': '0 4px 16px -2px hsl(var(--shadow) / 0.35), 0 2px 8px -1px hsl(var(--shadow) / 0.25)',
      '--shadow-pop': '0 8px 24px -4px hsl(var(--shadow) / 0.35), 0 4px 12px -2px hsl(var(--shadow) / 0.25)',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'pill',
      '--button-style': 'pill',
      '--blur': '0',
      '--surface-opacity': '1',
    }
  },
  GRADIENT_DUOTONE_THEMES: {
    light: {
      '--r-control': '9999px',
      '--r-card': '0.5rem',
      '--r-pill': '9999px',
      '--r-tab': '9999px',
      '--shadow-card': 'none',
      '--shadow-pop': 'none',
      '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--font-body': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--tab-style': 'pill',
      '--button-style': 'pill',
      '--blur': '0',
      '--surface-opacity': '1',
    },
    dark: {
      '--r-control': '9999px',
      '--r-card': '0.5rem',
      '--r-pill': '9999px',
      '--r-tab': '9999px',
      '--shadow-card': 'none',
      '--shadow-pop': 'none',
      '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--font-body': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--tab-style': 'pill',
      '--button-style': 'pill',
      '--blur': '0',
      '--surface-opacity': '1',
    }
  },
  NEUMORPHISM_THEMES: {
    light: {
      '--r-control': '1.25rem',
      '--r-card': '1.5rem',
      '--r-pill': '9999px',
      '--r-tab': '1.25rem',
      '--shadow-card': 'inset 2px 2px 4px hsl(var(--shadow) / 0.4), inset -2px -2px 4px hsl(var(--scrim) / 0.3), 4px 4px 8px -2px hsl(var(--shadow) / 0.3), -2px -2px 4px -1px hsl(var(--scrim) / 0.2)',
      '--shadow-pop': 'inset 3px 3px 6px hsl(var(--shadow) / 0.5), inset -3px -3px 6px hsl(var(--scrim) / 0.4), 6px 6px 12px -3px hsl(var(--shadow) / 0.3), -3px -3px 6px -2px hsl(var(--scrim) / 0.2)',
      '--heading-font': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'rounded',
      '--button-style': 'solid',
      '--blur': '0',
      '--surface-opacity': '1',
    },
    dark: {
      '--r-control': '1.25rem',
      '--r-card': '1.5rem',
      '--r-pill': '9999px',
      '--r-tab': '1.25rem',
      '--shadow-card': 'inset 2px 2px 4px hsl(var(--shadow) / 0.5), inset -2px -2px 4px hsl(var(--scrim) / 0.4), 4px 4px 8px -2px hsl(var(--shadow) / 0.4), -2px -2px 4px -1px hsl(var(--scrim) / 0.3)',
      '--shadow-pop': 'inset 3px 3px 6px hsl(var(--shadow) / 0.6), inset -3px -3px 6px hsl(var(--scrim) / 0.5), 6px 6px 12px -3px hsl(var(--shadow) / 0.4), -3px -3px 6px -2px hsl(var(--scrim) / 0.3)',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'rounded',
      '--button-style': 'solid',
      '--blur': '0',
      '--surface-opacity': '1',
    }
  },
  CYBERPUNK_THEMES: {
    light: {
      '--r-control': '0.25rem',
      '--r-card': '0.25rem',
      '--r-pill': '9999px',
      '--r-tab': '0.25rem',
      '--shadow-card': '0 0 16px hsl(var(--primary) / 0.5), 0 0 32px hsl(var(--accent) / 0.3)',
      '--shadow-pop': '0 0 24px hsl(var(--primary) / 0.6), 0 0 48px hsl(var(--accent) / 0.4)',
      '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--font-body': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--tab-style': 'square',
      '--button-style': 'square-offset',
      '--blur': '0',
      '--surface-opacity': '1',
    },
    dark: {
      '--r-control': '0.25rem',
      '--r-card': '0.25rem',
      '--r-pill': '9999px',
      '--r-tab': '0.25rem',
      '--shadow-card': '0 0 20px hsl(var(--primary) / 0.6), 0 0 40px hsl(var(--accent) / 0.4)',
      '--shadow-pop': '0 0 32px hsl(var(--primary) / 0.7), 0 0 64px hsl(var(--accent) / 0.5)',
      '--heading-font': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--font-body': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      '--tab-style': 'square',
      '--button-style': 'square-offset',
      '--blur': '0',
      '--surface-opacity': '1',
    }
  },
  BAUHAUS_THEMES: {
    light: {
      '--r-control': '0',
      '--r-card': '0',
      '--r-pill': '9999px',
      '--r-tab': '0',
      '--shadow-card': '4px 4px 0 0 hsl(var(--shadow))',
      '--shadow-pop': '6px 6px 0 0 hsl(var(--shadow))',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'square',
      '--button-style': 'square-offset',
      '--blur': '0',
      '--surface-opacity': '1',
    },
    dark: {
      '--r-control': '0',
      '--r-card': '0',
      '--r-pill': '9999px',
      '--r-tab': '0',
      '--shadow-card': '4px 4px 0 0 hsl(var(--shadow))',
      '--shadow-pop': '6px 6px 0 0 hsl(var(--shadow))',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'square',
      '--button-style': 'square-offset',
      '--blur': '0',
      '--surface-opacity': '1',
    }
  },
  CLAYMORPHISM_THEMES: {
    light: {
      '--r-control': '1.5rem',
      '--r-card': '2rem',
      '--r-pill': '9999px',
      '--r-tab': '1.5rem',
      '--shadow-card': 'inset 2px 2px 4px hsl(var(--shadow) / 0.4), inset -2px -2px 4px hsl(var(--scrim) / 0.3), 8px 8px 16px -4px hsl(var(--shadow) / 0.3), -4px -4px 8px -2px hsl(var(--scrim) / 0.2)',
      '--shadow-pop': 'inset 3px 3px 6px hsl(var(--shadow) / 0.5), inset -3px -3px 6px hsl(var(--scrim) / 0.4), 12px 12px 24px -6px hsl(var(--shadow) / 0.3), -6px -6px 12px -3px hsl(var(--scrim) / 0.2)',
      '--heading-font': '"Georgia", serif',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'rounded',
      '--button-style': 'solid',
      '--blur': '0',
      '--surface-opacity': '1',
    },
    dark: {
      '--r-control': '1.5rem',
      '--r-card': '2rem',
      '--r-pill': '9999px',
      '--r-tab': '1.5rem',
      '--shadow-card': 'inset 2px 2px 4px hsl(var(--shadow) / 0.5), inset -2px -2px 4px hsl(var(--scrim) / 0.4), 8px 8px 16px -4px hsl(var(--shadow) / 0.4), -4px -4px 8px -2px hsl(var(--scrim) / 0.3)',
      '--shadow-pop': 'inset 3px 3px 6px hsl(var(--shadow) / 0.6), inset -3px -3px 6px hsl(var(--scrim) / 0.5), 12px 12px 24px -6px hsl(var(--shadow) / 0.4), -6px -6px 12px -3px hsl(var(--scrim) / 0.3)',
      '--heading-font': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--font-body': '"Inter", ui-sans-serif, system-ui, sans-serif',
      '--tab-style': 'rounded',
      '--button-style': 'solid',
      '--blur': '0',
      '--surface-opacity': '1',
    }
  },
  HIGH_CONTRAST_THEMES: {
    light: {
      '--r-control': '0.25rem',
      '--r-card': '0.25rem',
      '--r-pill': '9999px',
      '--r-tab': '0.25rem',
      '--shadow-card': 'none',
      '--shadow-pop': 'none',
      '--heading-font': 'system-ui, sans-serif',
      '--font-body': 'system-ui, sans-serif',
      '--tab-style': 'underline',
      '--button-style': 'outline',
      '--blur': '0',
      '--surface-opacity': '1',
    },
    dark: {
      '--r-control': '0.25rem',
      '--r-card': '0.25rem',
      '--r-pill': '9999px',
      '--r-tab': '0.25rem',
      '--shadow-card': 'none',
      '--shadow-pop': 'none',
      '--heading-font': 'system-ui, sans-serif',
      '--font-body': 'system-ui, sans-serif',
      '--tab-style': 'underline',
      '--button-style': 'outline',
      '--blur': '0',
      '--surface-opacity': '1',
    }
  },
  SKEUOMORPHIC_THEMES: {
    light: {
      '--r-control': '0.5rem',
      '--r-card': '0.75rem',
      '--r-pill': '9999px',
      '--r-tab': '0.5rem',
      '--shadow-card': '0 2px 8px -2px hsl(var(--shadow) / 0.3), 0 1px 3px -1px hsl(var(--shadow) / 0.2)',
      '--shadow-pop': '0 4px 12px -2px hsl(var(--shadow) / 0.3), 0 2px 6px -1px hsl(var(--shadow) / 0.2)',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Georgia", serif',
      '--tab-style': 'rounded',
      '--button-style': 'solid',
      '--blur': '8px',
      '--surface-opacity': '0.9',
    },
    dark: {
      '--r-control': '0.5rem',
      '--r-card': '0.75rem',
      '--r-pill': '9999px',
      '--r-tab': '0.5rem',
      '--shadow-card': '0 2px 8px -2px hsl(var(--shadow) / 0.4), 0 1px 3px -1px hsl(var(--shadow) / 0.3)',
      '--shadow-pop': '0 4px 12px -2px hsl(var(--shadow) / 0.4), 0 2px 6px -1px hsl(var(--shadow) / 0.3)',
      '--heading-font': '"Instrument Serif", ui-serif, Georgia, serif',
      '--font-body': '"Instrument Serif", ui-serif, Georgia, serif',
      '--tab-style': 'rounded',
      '--button-style': 'solid',
      '--blur': '12px',
      '--surface-opacity': '0.9',
    }
  }
};

// Shadow style mapping per family
const SHADOW_STYLE = {
  GLASS_LIGHT_THEMES: 'soft',
  GLASS_DARK_THEMES: 'soft',
  NEUBRUTALISM_THEMES: 'hard-offset',
  EDITORIAL_THEMES: 'soft',
  PASTEL_THEMES: 'soft',
  GRADIENT_DUOTONE_THEMES: 'none',
  NEUMORPHISM_THEMES: 'inset-and-outset',
  CYBERPUNK_THEMES: 'hard-offset',
  BAUHAUS_THEMES: 'hard-offset',
  CLAYMORPHISM_THEMES: 'inset-and-outset',
  HIGH_CONTRAST_THEMES: 'none',
  SKEUOMORPHIC_THEMES: 'soft',
};

// Gradient and pattern per family
const FAMILY_EXTRAS = {
  GLASS_LIGHT_THEMES: {
    light: { '--bg-gradient': 'linear-gradient(135deg, hsl(45 60% 97%) 0%, hsl(35 70% 94%) 100%)', '--bg-pattern': 'none' },
    dark: { '--bg-gradient-dark': 'linear-gradient(135deg, hsl(25 15% 8%) 0%, hsl(35 12% 6%) 100%)', '--bg-pattern': 'none' },
  },
  GLASS_DARK_THEMES: {
    light: { '--bg-gradient': 'linear-gradient(145deg, hsl(280 20% 96%) 0%, hsl(300 30% 93%) 100%)', '--bg-pattern': 'none' },
    dark: { '--bg-gradient-dark': 'radial-gradient(ellipse at 50% 0%, hsl(300 20% 12%) 0%, hsl(280 25% 4%) 70%)', '--bg-pattern': 'none' },
  },
  NEUBRUTALISM_THEMES: {
    light: { '--bg-gradient': 'none', '--bg-pattern': 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E")' },
    dark: { '--bg-gradient-dark': 'none', '--bg-pattern': 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.05\'/%3E%3C/svg%3E")' },
  },
  EDITORIAL_THEMES: {
    light: { '--bg-gradient': 'none', '--bg-pattern': 'none' },
    dark: { '--bg-gradient-dark': 'none', '--bg-pattern': 'none' },
  },
  PASTEL_THEMES: {
    light: { '--bg-gradient': 'none', '--bg-pattern': 'none' },
    dark: { '--bg-gradient-dark': 'none', '--bg-pattern': 'none' },
  },
  GRADIENT_DUOTONE_THEMES: {
    light: { '--bg-gradient': 'linear-gradient(135deg, hsl(15 50% 95%) 0%, hsl(35 70% 88%) 50%, hsl(45 80% 85%) 100%)', '--bg-pattern': 'none' },
    dark: { '--bg-gradient-dark': 'linear-gradient(135deg, hsl(15 20% 6%) 0%, hsl(30 15% 8%) 50%, hsl(45 12% 10%) 100%)', '--bg-pattern': 'none' },
  },
  NEUMORPHISM_THEMES: {
    light: { '--bg-gradient': 'none', '--bg-pattern': 'none' },
    dark: { '--bg-gradient-dark': 'none', '--bg-pattern': 'none' },
  },
  CYBERPUNK_THEMES: {
    light: { '--bg-gradient': 'none', '--bg-pattern': 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(280 15% 50% / 0.1)\' stroke-width=\'1\'/%3E%3C/svg%3E")' },
    dark: { '--bg-gradient-dark': 'radial-gradient(ellipse at 50% 50%, hsl(280 20% 12%) 0%, hsl(260 25% 5%) 70%)', '--bg-pattern': 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M0 40H40M40 0V40\' stroke=\'hsl(180 90% 55% / 0.08)\' stroke-width=\'1\'/%3E%3C/svg%3E")' },
  },
  BAUHAUS_THEMES: {
    light: { '--bg-gradient': 'none', '--bg-pattern': 'none' },
    dark: { '--bg-gradient-dark': 'none', '--bg-pattern': 'none' },
  },
  CLAYMORPHISM_THEMES: {
    light: { '--bg-gradient': 'none', '--bg-pattern': 'none' },
    dark: { '--bg-gradient-dark': 'none', '--bg-pattern': 'none' },
  },
  HIGH_CONTRAST_THEMES: {
    light: { '--bg-gradient': 'none', '--bg-pattern': 'none' },
    dark: { '--bg-gradient-dark': 'none', '--bg-pattern': 'none' },
  },
  SKEUOMORPHIC_THEMES: {
    light: { '--bg-gradient': 'none', '--bg-pattern': 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Cfilter id=\'linen\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.02 0.1\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23linen)\' opacity=\'0.06\'/%3E%3C/svg%3E")' },
    dark: { '--bg-gradient-dark': 'none', '--bg-pattern': 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Cfilter id=\'linen\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.02 0.1\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23linen)\' opacity=\'0.08\'/%3E%3C/svg%3E")' },
  },
};

// Build replacement for a single theme's style layer
function buildStyleLayer(family, mode, isFirstTheme = false) {
  const config = FAMILY_CONFIG[family][mode];
  const shadowStyle = SHADOW_STYLE[family];
  const extras = FAMILY_EXTRAS[family][mode];
  
  const keys = [
    '--r-control',
    '--r-card',
    '--r-pill',
    '--r-tab',
    '--border-width',
    '--shadow-style',
    '--shadow-card',
    '--shadow-pop',
    '--blur',
    '--surface-opacity',
    '--font-heading',
    '--font-body',
    '--tab-style',
    '--button-style',
    ...Object.keys(extras)
  ];
  
  const values = {
    ...config,
    '--border-width': '1px',
    '--shadow-style': shadowStyle,
    ...extras
  };
  
  let result = '      // Style layer\n';
  for (const key of keys) {
    result += `      "${key}": "${values[key]}",\n`;
  }
  return result.trimEnd();
}

// Process the file by finding each family array and replacing style layers within
function processFamily(source, familyName) {
  const startIdx = source.indexOf(`const ${familyName} = [`);
  if (startIdx === -1) return source;
  
  let bracketCount = 0;
  let endIdx = -1;
  for (let i = startIdx; i < source.length; i++) {
    if (source[i] === '[') bracketCount++;
    else if (source[i] === ']') {
      bracketCount--;
      if (bracketCount === 0) {
        endIdx = i;
        break;
      }
    }
  }
  if (endIdx === -1) return source;
  
  let familyStr = source.slice(startIdx, endIdx + 1);
  
  // Find each theme object and replace its style layers
  let searchIdx = 0;
  let themeIndex = 0;
  while (true) {
    const idIdx = familyStr.indexOf('id:', searchIdx);
    if (idIdx === -1) break;
    
    // Find the start of this object
    let objStart = idIdx;
    while (objStart > 0 && familyStr[objStart] !== '{') objStart--;
    if (familyStr[objStart] !== '{') break;
    
    // Find the matching closing brace
    let depth = 0;
    let objEnd = -1;
    for (let i = objStart; i < familyStr.length; i++) {
      if (familyStr[i] === '{') depth++;
      else if (familyStr[i] === '}') {
        depth--;
        if (depth === 0) {
          objEnd = i;
          break;
        }
      }
    }
    if (objEnd === -1) break;
    
    let objStr = familyStr.slice(objStart, objEnd + 1);
    
    // Replace light mode style layer
    const lightStyleIdx = objStr.indexOf('// Style layer');
    if (lightStyleIdx !== -1) {
      // Find the end of light style layer (next mode or end of object)
      const darkIdx = objStr.indexOf('dark:', lightStyleIdx);
      const lightEnd = darkIdx !== -1 ? darkIdx : objEnd - objStart;
      
      const newLightStyle = buildStyleLayer(familyName, 'light', themeIndex === 0);
      const beforeLight = objStr.slice(0, lightStyleIdx);
      const afterLight = objStr.slice(lightEnd);
      objStr = beforeLight + newLightStyle + afterLight;
    }
    
    // Replace dark mode style layer
    const darkStyleIdx = objStr.indexOf('// Style layer', lightStyleIdx + 1);
    if (darkStyleIdx !== -1) {
      const newDarkStyle = buildStyleLayer(familyName, 'dark', themeIndex === 0);
      const beforeDark = objStr.slice(0, darkStyleIdx);
      const afterDark = objStr.slice(objStr.indexOf('}', darkStyleIdx));
      objStr = beforeDark + newDarkStyle + afterDark;
    }
    
    // Replace in familyStr
    familyStr = familyStr.slice(0, objStart) + objStr + familyStr.slice(objEnd + 1);
    
    searchIdx = objStart + objStr.length;
    themeIndex++;
  }
  
  return source.slice(0, startIdx) + familyStr + source.slice(endIdx + 1);
}

// Process all families
const families = Object.keys(FAMILY_CONFIG);
let result = source;
for (const family of families) {
  result = processFamily(result, family);
}

// Update DEFAULT_PRESET
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