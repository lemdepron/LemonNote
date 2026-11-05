import { readPref, writePref } from "./preferences";

/**
 * Theme presets.
 *
 * A preset is data only: raw HSL channels for the design tokens plus one of a
 * small set of surface textures painted on <body>. Applying one writes those
 * variables to the document root, exactly like a theme extension would, so the
 * whole app — canvases, ink paper, charts — follows along.
 */

const PRESET_KEY = "theme:preset";

const ch = (h, s, l) => `${h} ${s}% ${l}%`;
const mod = (value) => ((value % 360) + 360) % 360;

export const SURFACES = [
  "plain",
  "waves",
  "blend",
  "gradient",
  "stars",
  "aurora",
  "grain",
  "rings",
  "mesh",
  "dots",
  "topo",
  "paper",
  "noise",
];

function lightTokens({ hue, paper, ink }) {
  const link = mod(hue + 152);
  return {
    "--background": ch(paper, 32, 96),
    "--foreground": ch(ink, 26, 12),
    "--card": ch(paper, 26, 92),
    "--card-foreground": ch(ink, 26, 12),
    "--popover": ch(paper, 38, 99),
    "--popover-foreground": ch(ink, 26, 12),
    "--primary": ch(hue, 68, 35),
    "--primary-foreground": ch(paper, 44, 98),
    "--secondary": ch(paper, 20, 88),
    "--secondary-foreground": ch(ink, 22, 18),
    "--muted": ch(paper, 18, 90),
    "--muted-foreground": ch(ink, 12, 38),
    "--accent": ch(paper, 24, 85),
    "--accent-foreground": ch(ink, 22, 14),
    "--destructive": ch(8, 64, 40),
    "--destructive-foreground": "0 0% 100%",
    "--border": ch(paper, 16, 56),
    "--input": ch(paper, 16, 50),
    "--ring": ch(hue, 68, 38),
    "--link": ch(link, 72, 25),
    "--chart-1": ch(hue, 68, 38),
    "--chart-2": ch(link, 62, 30),
    "--chart-3": ch(mod(hue + 58), 46, 44),
    "--chart-4": ch(mod(hue + 200), 48, 38),
    "--chart-5": ch(mod(hue + 300), 54, 42),
    "--shadow": ch(ink, 32, 24),
    "--scrim": ch(ink, 28, 18),
    "--canvas": ch(paper, 22, 91),
    "--canvas-dot": ch(paper, 14, 46),
    "--edge": ch(link, 64, 28),
    "--node": ch(paper, 28, 95),
    "--node-ring": ch(hue, 68, 38),
    "--ink": ch(ink, 30, 13),
    "--ink-light": ch(paper, 42, 88),
    "--paper-outside": ch(paper, 20, 88),
    "--paper-page-slate": ch(paper, 18, 14),
    "--paper-page-paper": ch(paper, 46, 95),
    "--surface-a": ch(hue, 64, 60),
    "--surface-b": ch(link, 56, 54),
    "--surface-c": ch(mod(hue + 42), 62, 68),
  };
}

function darkTokens({ hue, paper, ink }) {
  const link = mod(hue + 158);
  return {
    "--background": ch(hue, 22, 6),
    "--foreground": ch(paper, 16, 92),
    "--card": ch(hue, 18, 8.5),
    "--card-foreground": ch(paper, 16, 92),
    "--popover": ch(hue, 18, 10),
    "--popover-foreground": ch(paper, 16, 92),
    "--primary": ch(hue, 58, 68),
    "--primary-foreground": ch(hue, 32, 8),
    "--secondary": ch(hue, 14, 13),
    "--secondary-foreground": ch(paper, 14, 90),
    "--muted": ch(hue, 14, 12),
    "--muted-foreground": ch(hue, 10, 62),
    "--accent": ch(hue, 14, 15),
    "--accent-foreground": ch(paper, 14, 92),
    "--destructive": ch(6, 62, 58),
    "--destructive-foreground": "0 0% 98%",
    "--border": ch(hue, 12, 40),
    "--input": ch(hue, 12, 42),
    "--ring": ch(hue, 58, 68),
    "--link": ch(link, 46, 64),
    "--chart-1": ch(hue, 58, 68),
    "--chart-2": ch(link, 44, 60),
    "--chart-3": ch(mod(hue + 46), 34, 68),
    "--chart-4": ch(mod(hue + 200), 40, 62),
    "--chart-5": ch(mod(hue + 300), 52, 64),
    "--shadow": ch(hue, 60, 2),
    "--scrim": ch(hue, 50, 2),
    "--canvas": ch(hue, 22, 5),
    "--canvas-dot": ch(hue, 12, 24),
    "--edge": ch(link, 44, 62),
    "--node": ch(hue, 14, 17),
    "--node-ring": ch(hue, 58, 68),
    "--ink": ch(hue, 30, 14),
    "--ink-light": ch(paper, 38, 88),
    "--paper-outside": ch(hue, 20, 4),
    "--paper-page-slate": ch(hue, 18, 9),
    "--paper-page-paper": ch(paper, 46, 94),
    "--surface-a": ch(hue, 62, 56),
    "--surface-b": ch(link, 54, 52),
    "--surface-c": ch(mod(hue + 40), 60, 62),
  };
}

/* id, name, mode, surface, accent hue, paper hue, ink hue */
const SPEC = [
  ["parchment", "Parchment", "light", "waves", 32, 42, 25],
  ["terracotta", "Terracotta", "light", "waves", 16, 32, 20],
  ["coral-reef", "Coral reef", "light", "waves", 10, 22, 18],
  ["peach-cream", "Peach cream", "light", "blend", 24, 36, 26],
  ["sunbeam", "Sunbeam", "light", "gradient", 46, 52, 30],
  ["wheat-field", "Wheat field", "light", "waves", 48, 45, 34],
  ["honey-comb", "Honey comb", "light", "rings", 40, 44, 30],
  ["citrus-press", "Citrus press", "light", "blend", 58, 56, 30],
  ["olive-grove", "Olive grove", "light", "grain", 82, 72, 60],
  ["fern-press", "Fern press", "light", "waves", 142, 132, 120],
  ["sage-studio", "Sage studio", "light", "grain", 118, 104, 90],
  ["mint-frost", "Mint frost", "light", "blend", 158, 150, 140],
  ["seafoam", "Seafoam", "light", "waves", 168, 160, 150],
  ["teal-wash", "Teal wash", "light", "blend", 176, 172, 160],
  ["arctic-day", "Arctic day", "light", "gradient", 196, 200, 210],
  ["glacier", "Glacier", "light", "blend", 190, 196, 206],
  ["skyfold", "Skyfold", "light", "gradient", 206, 212, 220],
  ["periwinkle", "Periwinkle", "light", "gradient", 248, 246, 250],
  ["indigo-linen", "Indigo linen", "light", "gradient", 234, 226, 232],
  ["quartz", "Quartz", "light", "gradient", 264, 280, 270],
  ["lavender-mist", "Lavender mist", "light", "stars", 276, 284, 276],
  ["lilac-haze", "Lilac haze", "light", "blend", 288, 278, 286],
  ["plum-dawn", "Plum dawn", "light", "blend", 306, 314, 300],
  ["rose-paper", "Rose paper", "light", "waves", 334, 342, 330],
  ["blush-line", "Blush line", "light", "waves", 348, 352, 340],
  ["clay-print", "Clay print", "light", "grain", 20, 30, 18],
  ["cloud-nine", "Cloud nine", "light", "blend", 212, 216, 222],
  ["opal", "Opal", "light", "blend", 292, 300, 286],

  ["midnight-grid", "Midnight grid", "dark", "plain", 220, 220, 218],
  ["ink-black", "Ink black", "dark", "plain", 250, 246, 244],
  ["gunmetal", "Gunmetal", "dark", "plain", 200, 204, 206],
  ["slate-blue", "Slate blue", "dark", "plain", 212, 210, 208],
  ["sapphire", "Sapphire", "dark", "gradient", 232, 228, 224],
  ["cobalt-night", "Cobalt night", "dark", "gradient", 216, 214, 210],
  ["glacial-blue", "Glacial blue", "dark", "waves", 190, 194, 198],
  ["abyss", "Abyss", "dark", "aurora", 198, 200, 196],
  ["aurora", "Aurora", "dark", "aurora", 164, 170, 176],
  ["cyber-teal", "Cyber teal", "dark", "gradient", 176, 178, 172],
  ["neon-rift", "Neon rift", "dark", "gradient", 300, 296, 288],
  ["quantum", "Quantum", "dark", "gradient", 284, 286, 280],
  ["toxic-orchid", "Toxic orchid", "dark", "blend", 312, 308, 300],
  ["amethyst", "Amethyst", "dark", "blend", 268, 272, 264],
  ["obsidian-rose", "Obsidian rose", "dark", "stars", 332, 334, 326],
  ["maroon-velvet", "Maroon velvet", "dark", "blend", 346, 344, 338],
  ["ruby-tide", "Ruby tide", "dark", "waves", 352, 350, 344],
  ["volcanic", "Volcanic", "dark", "blend", 8, 10, 6],
  ["ember-night", "Ember night", "dark", "blend", 20, 24, 18],
  ["copper-den", "Copper den", "dark", "waves", 28, 30, 26],
  ["desert-night", "Desert night", "dark", "waves", 36, 34, 30],
  ["solar-flare", "Solar flare", "dark", "gradient", 42, 44, 38],
  ["witch-hazel", "Witch hazel", "dark", "stars", 54, 50, 44],
  ["toxic-lime", "Toxic lime", "dark", "gradient", 92, 96, 88],
  ["moss-night", "Moss night", "dark", "grain", 122, 120, 112],
  ["deep-forest", "Deep forest", "dark", "waves", 152, 148, 144],
  ["binary", "Binary", "dark", "stars", 140, 142, 136],
  ["starfield", "Starfield", "dark", "stars", 232, 234, 228],
];

function buildPreset([id, name, mode, surface, hue, paper, ink]) {
  const spec = { hue, paper, ink };
  const tokens = mode === "light" ? lightTokens(spec) : darkTokens(spec);
  return { id, name, mode, surface, tokens: { [mode]: tokens } };
}

/* ---------- contrast (WCAG 2.1) ---------- */

export const AA_BODY = 4.5;

const clamp = (value, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, value));

function hslToRgb([h, s, l]) {
  const sat = s / 100;
  const lig = l / 100;
  const k = (n) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n) => lig - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)];
}

const linear = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

function luminance([h, s, l]) {
  const [r, g, b] = hslToRgb([h, s, l]).map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two channel triples, e.g. 12.4. */
export function contrastOf(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Nudge a colour away from its background until it clears AA, keeping its hue. */
function ensureAA(fg, bg, min = AA_BODY) {
  const out = [fg[0], fg[1], fg[2]];
  const away = luminance(out) >= luminance(bg) ? 1 : -1;
  let guard = 0;
  while (contrastOf(out, bg) < min && guard < 80) {
    out[2] = clamp(out[2] + away * 1.5);
    guard += 1;
  }
  return out;
}

/** Move `base` toward `target` in saturation and lightness, keeping base's hue. */
function tone(base, target, t) {
  return [
    base[0],
    Math.round(base[1] + (target[1] - base[1]) * t),
    Math.round((base[2] + (target[2] - base[2]) * t) * 10) / 10,
  ];
}

const rotate = (color, deg) => [mod(color[0] + deg), color[1], color[2]];

/** Text that sits on a filled colour — whichever pole has more room. */
function onColor(color) {
  const ink = [color[0], 18, 10];
  const paper = [color[0], 30, 98];
  return contrastOf(ink, color) >= contrastOf(paper, color) ? ink : paper;
}

/**
 * One mode of a dual-mode preset. Only the identity colours are authored
 * (background, text, accent, link, hairlines, texture); every derived token
 * comes from them, so a new theme is a few lines of data.
 */
function pairTokens(spec, mode) {
  const light = mode === "light";
  const { bg, fg, primary, link, border, surface, card } = spec;
  const body = ensureAA(fg, bg);
  const soft = ensureAA(tone(bg, body, light ? 0.58 : 0.62), bg);
  const accent = primary;
  const ink = ensureAA(link || primary, bg);
  const line = border || tone(bg, body, light ? 0.22 : 0.28);
  const cardBg = card || tone(bg, body, light ? 0.045 : 0.08);
  const popover = card ? tone(card, body, 0.02) : tone(bg, body, light ? 0.02 : 0.11);

  return {
    "--background": ch(...bg),
    "--foreground": ch(...body),
    "--card": ch(...cardBg),
    "--card-foreground": ch(...body),
    "--popover": ch(...popover),
    "--popover-foreground": ch(...body),
    "--primary": ch(...accent),
    "--primary-foreground": ch(...ensureAA(onColor(accent), accent)),
    "--secondary": ch(...tone(bg, body, light ? 0.07 : 0.1)),
    "--secondary-foreground": ch(...body),
    "--muted": ch(...tone(bg, body, light ? 0.05 : 0.08)),
    "--muted-foreground": ch(...soft),
    "--accent": ch(...tone(bg, body, light ? 0.09 : 0.13)),
    "--accent-foreground": ch(...body),
    "--destructive": light ? ch(8, 62, 40) : ch(8, 64, 64),
    "--destructive-foreground": "0 0% 100%",
    "--border": ch(...line),
    "--input": ch(...tone(bg, body, light ? 0.26 : 0.32)),
    "--ring": ch(...accent),
    "--link": ch(...ink),
    "--chart-1": ch(...accent),
    "--chart-2": ch(...ink),
    "--chart-3": ch(...rotate(accent, 52)),
    "--chart-4": ch(...rotate(accent, 198)),
    "--chart-5": ch(...rotate(accent, 302)),
    "--shadow": light ? ch(body[0], 26, 28) : ch(bg[0], Math.min(74, bg[1] + 32), 2),
    "--scrim": light ? ch(body[0], 24, 20) : ch(bg[0], Math.min(70, bg[1] + 28), 2),
    "--canvas": ch(...tone(bg, body, 0.03)),
    "--canvas-dot": ch(...tone(bg, body, 0.32)),
    "--edge": ch(...ink),
    "--node": ch(...tone(bg, body, light ? 0.015 : 0.12)),
    "--node-ring": ch(...accent),
    "--ink": ch(body[0], 24, 13),
    "--ink-light": ch(bg[0], 38, 88),
    "--paper-outside": ch(...tone(bg, body, 0.06)),
    "--paper-page-slate": ch(bg[0], 16, light ? 14 : 9),
    "--paper-page-paper": ch(bg[0], 40, 95),
    "--surface-a": ch(...surface[0]),
    "--surface-b": ch(...surface[1]),
    "--surface-c": ch(...surface[2]),
  };
}

function buildPair(spec) {
  return {
    id: spec.id,
    name: spec.name,
    mode: null, // ships both builds; the app's resolved mode picks one
    surface: spec.surface,
    tokens: {
      light: pairTokens(spec.light, "light"),
      dark: pairTokens(spec.dark, "dark"),
    },
  };
}

/**
 * Dual-mode presets — one identity, authored twice: a light build and a dark
 * build. Nothing is hand-tuned per component; both are plain token data.
 */
const PAIRS = [
  {
    id: "greyline",
    name: "Greyline",
    surface: "dots",
    light: {
      bg: [220, 6, 97],
      fg: [220, 9, 14],
      primary: [220, 11, 24],
      link: [214, 30, 34],
      border: [220, 8, 72],
      surface: [[220, 8, 82], [220, 6, 66], [220, 10, 90]],
    },
    dark: {
      bg: [220, 7, 8],
      fg: [220, 5, 93],
      primary: [220, 6, 90],
      link: [212, 30, 74],
      border: [220, 7, 32],
      surface: [[220, 8, 34], [220, 6, 22], [220, 10, 44]],
    },
  },
  {
    id: "newsprint",
    name: "Newsprint",
    surface: "noise",
    light: {
      bg: [44, 12, 93],
      fg: [32, 12, 17],
      primary: [30, 14, 26],
      link: [24, 54, 32],
      border: [36, 10, 64],
      surface: [[42, 14, 80], [32, 10, 64], [46, 16, 88]],
    },
    dark: {
      bg: [34, 10, 9],
      fg: [44, 9, 90],
      primary: [40, 10, 86],
      link: [32, 48, 70],
      border: [34, 9, 32],
      surface: [[40, 12, 30], [32, 8, 20], [44, 14, 40]],
    },
  },
  {
    id: "vellum",
    name: "Vellum",
    surface: "paper",
    light: {
      bg: [46, 42, 96],
      fg: [36, 18, 16],
      primary: [32, 32, 30],
      link: [24, 46, 32],
      border: [40, 20, 74],
      surface: [[46, 36, 86], [38, 26, 72], [48, 44, 92]],
    },
    dark: {
      bg: [34, 14, 10],
      fg: [46, 24, 93],
      primary: [42, 30, 84],
      link: [36, 46, 72],
      border: [34, 12, 30],
      surface: [[40, 26, 32], [34, 18, 22], [44, 30, 40]],
    },
  },
  {
    id: "blueprint",
    name: "Blueprint",
    surface: "paper",
    light: {
      bg: [198, 34, 95],
      fg: [212, 48, 18],
      primary: [212, 58, 30],
      link: [212, 60, 28],
      border: [206, 30, 62],
      surface: [[200, 36, 80], [196, 30, 64], [204, 40, 88]],
    },
    dark: {
      bg: [210, 14, 10],
      fg: [200, 18, 92],
      primary: [196, 44, 72],
      link: [196, 50, 70],
      border: [206, 12, 32],
      surface: [[206, 18, 30], [198, 14, 20], [204, 20, 40]],
    },
  },
  {
    id: "concrete",
    name: "Concrete",
    surface: "plain",
    light: {
      bg: [0, 0, 86],
      fg: [0, 0, 10],
      primary: [0, 0, 8],
      link: [220, 10, 26],
      border: [0, 0, 8],
      surface: [[0, 0, 76], [0, 0, 60], [0, 0, 92]],
    },
    dark: {
      bg: [0, 0, 9],
      fg: [0, 0, 93],
      primary: [0, 0, 96],
      link: [210, 12, 80],
      border: [0, 0, 92],
      surface: [[0, 0, 30], [0, 0, 18], [0, 0, 42]],
    },
  },
  {
    id: "stencil",
    name: "Stencil",
    surface: "plain",
    light: {
      bg: [70, 16, 95],
      fg: [0, 0, 8],
      primary: [84, 72, 30],
      link: [84, 60, 22],
      border: [0, 0, 8],
      surface: [[84, 70, 44], [72, 60, 52], [90, 74, 60]],
    },
    dark: {
      bg: [0, 0, 9],
      fg: [70, 10, 94],
      primary: [84, 80, 58],
      link: [84, 78, 56],
      border: [70, 8, 92],
      surface: [[84, 70, 40], [70, 50, 30], [88, 72, 52]],
    },
  },
  {
    id: "frost-pane",
    name: "Frost pane",
    surface: "mesh",
    light: {
      bg: [196, 32, 95],
      fg: [204, 24, 20],
      primary: [200, 46, 34],
      link: [198, 52, 30],
      border: [200, 30, 86],
      card: [200, 60, 99],
      surface: [[196, 60, 80], [188, 54, 74], [204, 62, 88]],
    },
    dark: {
      bg: [204, 18, 12],
      fg: [196, 16, 94],
      primary: [192, 44, 78],
      link: [190, 48, 76],
      border: [200, 22, 34],
      card: [204, 16, 16],
      surface: [[200, 46, 46], [190, 44, 38], [208, 48, 54]],
    },
  },
  {
    id: "smoke-glass",
    name: "Smoke glass",
    surface: "noise",
    light: {
      bg: [30, 18, 95],
      fg: [24, 14, 18],
      primary: [24, 16, 30],
      link: [22, 34, 30],
      border: [30, 16, 84],
      card: [30, 34, 99],
      surface: [[30, 30, 82], [24, 20, 70], [34, 34, 90]],
    },
    dark: {
      bg: [24, 12, 12],
      fg: [30, 12, 93],
      primary: [28, 14, 82],
      link: [26, 30, 74],
      border: [24, 10, 34],
      card: [24, 12, 17],
      surface: [[28, 18, 34], [22, 12, 24], [32, 22, 44]],
    },
  },
  {
    id: "mesh-bloom",
    name: "Mesh bloom",
    surface: "mesh",
    light: {
      bg: [12, 58, 96],
      fg: [14, 36, 18],
      primary: [10, 64, 36],
      link: [340, 56, 34],
      border: [14, 40, 80],
      surface: [[12, 78, 70], [340, 68, 74], [30, 78, 72]],
    },
    dark: {
      bg: [350, 20, 11],
      fg: [14, 26, 93],
      primary: [12, 70, 72],
      link: [340, 58, 72],
      border: [350, 18, 32],
      surface: [[10, 68, 42], [340, 58, 40], [24, 66, 44]],
    },
  },
  {
    id: "contour",
    name: "Contour",
    surface: "topo",
    light: {
      bg: [88, 12, 94],
      fg: [90, 14, 20],
      primary: [92, 24, 32],
      link: [104, 30, 28],
      border: [88, 12, 70],
      surface: [[88, 18, 74], [96, 16, 62], [84, 16, 86]],
    },
    dark: {
      bg: [96, 10, 10],
      fg: [88, 9, 91],
      primary: [86, 20, 78],
      link: [96, 24, 74],
      border: [92, 9, 32],
      surface: [[88, 16, 32], [96, 14, 22], [84, 18, 42]],
    },
  },
  {
    id: "meridian",
    name: "Meridian",
    surface: "topo",
    light: {
      bg: [210, 14, 95],
      fg: [214, 18, 18],
      primary: [22, 46, 36],
      link: [18, 48, 34],
      border: [210, 14, 72],
      surface: [[210, 20, 82], [22, 38, 68], [206, 18, 88]],
    },
    dark: {
      bg: [214, 12, 10],
      fg: [210, 8, 92],
      primary: [22, 48, 66],
      link: [18, 50, 64],
      border: [210, 10, 32],
      surface: [[214, 18, 32], [22, 34, 34], [210, 14, 44]],
    },
  },
  {
    id: "dot-matrix",
    name: "Dot matrix",
    surface: "dots",
    light: {
      bg: [30, 10, 95],
      fg: [28, 12, 16],
      primary: [12, 58, 38],
      link: [12, 56, 34],
      border: [28, 10, 76],
      surface: [[28, 16, 84], [12, 30, 72], [30, 14, 90]],
    },
    dark: {
      bg: [28, 10, 9],
      fg: [30, 9, 92],
      primary: [14, 58, 70],
      link: [12, 56, 68],
      border: [28, 8, 32],
      surface: [[28, 16, 32], [12, 30, 32], [30, 14, 42]],
    },
  },
  {
    id: "halftone",
    name: "Halftone",
    surface: "dots",
    light: {
      bg: [0, 0, 96],
      fg: [0, 0, 10],
      primary: [16, 60, 38],
      link: [16, 58, 32],
      border: [0, 0, 72],
      surface: [[0, 0, 84], [16, 20, 70], [0, 0, 90]],
    },
    dark: {
      bg: [0, 0, 8],
      fg: [0, 0, 94],
      primary: [16, 64, 64],
      link: [16, 62, 62],
      border: [0, 0, 30],
      surface: [[16, 30, 32], [0, 0, 20], [16, 30, 44]],
    },
  },
  {
    id: "duotone-ink",
    name: "Duotone ink",
    surface: "noise",
    light: {
      bg: [42, 44, 95],
      fg: [220, 20, 16],
      primary: [220, 22, 24],
      link: [12, 62, 36],
      border: [40, 24, 74],
      surface: [[42, 44, 82], [220, 20, 72], [14, 60, 78]],
    },
    dark: {
      bg: [220, 16, 9],
      fg: [42, 28, 93],
      primary: [12, 64, 66],
      link: [12, 62, 64],
      border: [220, 14, 30],
      surface: [[220, 20, 30], [12, 48, 36], [42, 30, 44]],
    },
  },
  {
    id: "duotone-rust",
    name: "Duotone rust",
    surface: "noise",
    light: {
      bg: [30, 8, 96],
      fg: [18, 18, 16],
      primary: [14, 60, 34],
      link: [14, 56, 30],
      border: [24, 12, 72],
      surface: [[24, 20, 84], [14, 40, 66], [30, 26, 90]],
    },
    dark: {
      bg: [18, 10, 9],
      fg: [30, 9, 92],
      primary: [14, 56, 64],
      link: [14, 54, 62],
      border: [18, 8, 30],
      surface: [[20, 26, 32], [14, 30, 24], [28, 28, 42]],
    },
  },
  {
    id: "daybreak",
    name: "Daybreak",
    surface: "mesh",
    light: {
      bg: [36, 68, 96],
      fg: [18, 36, 20],
      primary: [16, 66, 40],
      link: [340, 52, 36],
      border: [32, 44, 78],
      surface: [[40, 84, 74], [14, 72, 72], [340, 64, 76]],
    },
    dark: {
      bg: [14, 16, 9],
      fg: [36, 34, 93],
      primary: [30, 70, 70],
      link: [340, 54, 70],
      border: [16, 14, 30],
      surface: [[30, 68, 40], [340, 58, 38], [16, 58, 34]],
    },
  },
  {
    id: "afterglow",
    name: "Afterglow",
    surface: "mesh",
    light: {
      bg: [340, 58, 96],
      fg: [330, 32, 20],
      primary: [336, 56, 38],
      link: [12, 62, 36],
      border: [338, 38, 80],
      surface: [[340, 72, 76], [12, 70, 74], [320, 58, 80]],
    },
    dark: {
      bg: [340, 20, 10],
      fg: [340, 24, 93],
      primary: [336, 62, 72],
      link: [12, 58, 70],
      border: [340, 18, 30],
      surface: [[336, 58, 38], [12, 48, 34], [320, 48, 42]],
    },
  },
  {
    id: "dune",
    name: "Dune",
    surface: "topo",
    light: {
      bg: [40, 40, 94],
      fg: [34, 28, 20],
      primary: [30, 42, 34],
      link: [22, 50, 32],
      border: [36, 26, 70],
      surface: [[40, 50, 78], [30, 34, 64], [44, 52, 86]],
    },
    dark: {
      bg: [32, 16, 10],
      fg: [40, 28, 92],
      primary: [36, 50, 76],
      link: [32, 52, 74],
      border: [32, 14, 30],
      surface: [[36, 40, 34], [28, 26, 24], [42, 44, 42]],
    },
  },
  {
    id: "sandstone",
    name: "Sandstone",
    surface: "paper",
    light: {
      bg: [34, 36, 91],
      fg: [26, 30, 18],
      primary: [24, 44, 32],
      link: [16, 50, 32],
      border: [32, 24, 66],
      surface: [[34, 44, 76], [26, 30, 62], [38, 48, 86]],
    },
    dark: {
      bg: [24, 16, 10],
      fg: [34, 26, 90],
      primary: [28, 46, 72],
      link: [24, 48, 70],
      border: [24, 14, 28],
      surface: [[30, 34, 32], [24, 22, 22], [34, 38, 40]],
    },
  },
  {
    id: "ocean-foam",
    name: "Ocean foam",
    surface: "dots",
    light: {
      bg: [176, 46, 95],
      fg: [184, 38, 20],
      primary: [178, 50, 32],
      link: [196, 50, 30],
      border: [178, 32, 72],
      surface: [[176, 60, 76], [196, 50, 78], [168, 52, 70]],
    },
    dark: {
      bg: [196, 26, 10],
      fg: [176, 18, 93],
      primary: [172, 46, 70],
      link: [176, 50, 68],
      border: [190, 22, 32],
      surface: [[176, 52, 38], [196, 46, 34], [168, 48, 46]],
    },
  },
  {
    id: "tidal",
    name: "Tidal",
    surface: "topo",
    light: {
      bg: [206, 38, 95],
      fg: [212, 44, 18],
      primary: [204, 52, 32],
      link: [188, 48, 28],
      border: [206, 28, 70],
      surface: [[204, 46, 78], [190, 42, 72], [210, 48, 86]],
    },
    dark: {
      bg: [210, 26, 9],
      fg: [200, 16, 92],
      primary: [192, 50, 70],
      link: [196, 52, 68],
      border: [206, 22, 30],
      surface: [[204, 48, 34], [190, 42, 28], [208, 46, 42]],
    },
  },
  {
    id: "zest",
    name: "Zest",
    surface: "dots",
    light: {
      bg: [58, 62, 95],
      fg: [54, 40, 20],
      primary: [52, 66, 30],
      link: [40, 60, 30],
      border: [56, 40, 76],
      surface: [[58, 74, 72], [40, 64, 70], [50, 70, 80]],
    },
    dark: {
      bg: [56, 18, 9],
      fg: [58, 34, 93],
      primary: [54, 74, 64],
      link: [48, 70, 62],
      border: [56, 16, 30],
      surface: [[58, 64, 40], [44, 56, 34], [60, 66, 44]],
    },
  },
  {
    id: "lavender-fog",
    name: "Lavender fog",
    surface: "noise",
    light: {
      bg: [270, 36, 96],
      fg: [272, 26, 22],
      primary: [268, 34, 38],
      link: [282, 34, 34],
      border: [270, 24, 78],
      surface: [[270, 44, 82], [284, 40, 76], [264, 42, 88]],
    },
    dark: {
      bg: [272, 18, 12],
      fg: [270, 18, 94],
      primary: [266, 40, 78],
      link: [278, 38, 76],
      border: [270, 14, 34],
      surface: [[270, 36, 44], [282, 34, 38], [264, 36, 52]],
    },
  },
  {
    id: "buttercream",
    name: "Buttercream",
    surface: "paper",
    light: {
      bg: [48, 70, 96],
      fg: [44, 26, 20],
      primary: [42, 58, 40],
      link: [30, 50, 34],
      border: [46, 50, 80],
      surface: [[48, 70, 82], [42, 52, 72], [52, 72, 90]],
    },
    dark: {
      bg: [44, 18, 10],
      fg: [48, 30, 93],
      primary: [46, 68, 74],
      link: [40, 62, 70],
      border: [44, 16, 30],
      surface: [[48, 68, 44], [40, 48, 38], [52, 70, 52]],
    },
  },
  {
    id: "sorbet",
    name: "Sorbet",
    surface: "mesh",
    light: {
      bg: [20, 66, 96],
      fg: [16, 30, 20],
      primary: [12, 60, 38],
      link: [336, 50, 38],
      border: [18, 40, 80],
      surface: [[20, 80, 74], [336, 64, 78], [44, 78, 78]],
    },
    dark: {
      bg: [16, 16, 10],
      fg: [20, 26, 93],
      primary: [14, 64, 72],
      link: [336, 52, 72],
      border: [18, 14, 30],
      surface: [[18, 66, 42], [336, 52, 42], [30, 60, 46]],
    },
  },
  {
    id: "holographic",
    name: "Holographic",
    surface: "mesh",
    light: {
      bg: [320, 24, 97],
      fg: [300, 16, 18],
      primary: [330, 52, 40],
      link: [206, 44, 34],
      border: [320, 20, 82],
      surface: [[320, 60, 82], [190, 52, 84], [268, 40, 86]],
    },
    dark: {
      bg: [300, 12, 10],
      fg: [320, 12, 94],
      primary: [330, 54, 74],
      link: [198, 44, 76],
      border: [300, 10, 32],
      surface: [[320, 48, 44], [192, 44, 44], [268, 34, 46]],
    },
  },
  {
    id: "moonstone",
    name: "Moonstone",
    surface: "mesh",
    light: {
      bg: [200, 16, 97],
      fg: [205, 14, 20],
      primary: [205, 18, 32],
      link: [190, 26, 34],
      border: [200, 12, 82],
      surface: [[200, 20, 86], [190, 16, 78], [210, 18, 92]],
    },
    dark: {
      bg: [205, 10, 11],
      fg: [200, 10, 93],
      primary: [196, 16, 82],
      link: [190, 24, 78],
      border: [205, 9, 32],
      surface: [[200, 16, 34], [190, 14, 26], [210, 14, 44]],
    },
  },
  {
    id: "risograph",
    name: "Risograph",
    surface: "noise",
    light: {
      bg: [44, 30, 94],
      fg: [40, 20, 16],
      primary: [326, 58, 42],
      link: [326, 54, 38],
      border: [42, 22, 74],
      surface: [[44, 34, 82], [326, 40, 70], [46, 32, 88]],
    },
    dark: {
      bg: [330, 14, 10],
      fg: [44, 18, 93],
      primary: [328, 62, 72],
      link: [328, 58, 70],
      border: [330, 12, 30],
      surface: [[330, 40, 34], [44, 20, 26], [330, 36, 42]],
    },
  },
  {
    id: "terrazzo",
    name: "Terrazzo",
    surface: "dots",
    light: {
      bg: [40, 24, 95],
      fg: [36, 16, 20],
      primary: [16, 26, 34],
      link: [200, 26, 34],
      border: [38, 18, 78],
      surface: [[340, 30, 80], [190, 30, 82], [46, 40, 86]],
    },
    dark: {
      bg: [36, 10, 12],
      fg: [40, 12, 92],
      primary: [30, 18, 78],
      link: [198, 24, 74],
      border: [36, 9, 32],
      surface: [[340, 20, 40], [190, 22, 38], [46, 30, 44]],
    },
  },
  {
    id: "photocopy",
    name: "Photocopy",
    surface: "noise",
    light: {
      bg: [0, 0, 99],
      fg: [0, 0, 6],
      primary: [0, 0, 6],
      link: [220, 8, 28],
      border: [0, 0, 10],
      surface: [[0, 0, 86], [0, 0, 70], [0, 0, 94]],
    },
    dark: {
      bg: [0, 0, 5],
      fg: [0, 0, 97],
      primary: [0, 0, 99],
      link: [210, 8, 82],
      border: [0, 0, 94],
      surface: [[0, 0, 26], [0, 0, 16], [0, 0, 34]],
    },
  },
  {
    id: "carbon",
    name: "Carbon",
    surface: "paper",
    light: {
      bg: [210, 8, 88],
      fg: [210, 12, 10],
      primary: [210, 14, 18],
      link: [200, 14, 26],
      border: [210, 8, 62],
      surface: [[210, 10, 78], [200, 10, 64], [210, 8, 92]],
    },
    dark: {
      bg: [210, 8, 7],
      fg: [210, 6, 92],
      primary: [200, 10, 86],
      link: [200, 12, 80],
      border: [210, 8, 26],
      surface: [[200, 12, 28], [210, 10, 18], [200, 10, 36]],
    },
  },
  {
    id: "chalkboard",
    name: "Chalkboard",
    surface: "noise",
    light: {
      bg: [150, 12, 92],
      fg: [160, 16, 18],
      primary: [160, 18, 28],
      link: [160, 20, 26],
      border: [150, 10, 70],
      surface: [[150, 16, 78], [160, 14, 64], [150, 14, 86]],
    },
    dark: {
      bg: [160, 12, 12],
      fg: [150, 14, 94],
      primary: [150, 14, 86],
      link: [150, 16, 84],
      border: [160, 10, 32],
      surface: [[160, 16, 34], [150, 14, 24], [160, 14, 42]],
    },
  },
  {
    id: "corrugated",
    name: "Corrugated",
    surface: "topo",
    light: {
      bg: [210, 8, 90],
      fg: [210, 10, 14],
      primary: [210, 12, 22],
      link: [206, 16, 28],
      border: [210, 8, 64],
      surface: [[210, 10, 78], [210, 8, 64], [210, 10, 90]],
    },
    dark: {
      bg: [210, 8, 9],
      fg: [210, 6, 91],
      primary: [210, 10, 84],
      link: [206, 14, 78],
      border: [210, 8, 30],
      surface: [[210, 10, 28], [210, 8, 20], [210, 10, 38]],
    },
  },
  {
    id: "graphite",
    name: "Graphite",
    surface: "paper",
    light: {
      bg: [220, 4, 93],
      fg: [220, 6, 20],
      primary: [220, 6, 30],
      link: [220, 10, 30],
      border: [220, 4, 70],
      surface: [[220, 5, 82], [220, 4, 68], [220, 5, 90]],
    },
    dark: {
      bg: [220, 4, 11],
      fg: [220, 4, 90],
      primary: [220, 4, 80],
      link: [220, 6, 74],
      border: [220, 4, 32],
      surface: [[220, 5, 28], [220, 4, 18], [220, 5, 38]],
    },
  },
  {
    id: "kraft",
    name: "Kraft",
    surface: "paper",
    light: {
      bg: [34, 38, 88],
      fg: [28, 26, 18],
      primary: [26, 34, 30],
      link: [18, 40, 30],
      border: [32, 26, 64],
      surface: [[34, 40, 74], [28, 30, 60], [36, 42, 84]],
    },
    dark: {
      bg: [28, 16, 10],
      fg: [34, 22, 90],
      primary: [30, 32, 72],
      link: [24, 38, 70],
      border: [28, 14, 28],
      surface: [[32, 30, 32], [26, 22, 22], [36, 34, 42]],
    },
  },
  {
    id: "marble",
    name: "Marble",
    surface: "topo",
    light: {
      bg: [220, 6, 96],
      fg: [222, 12, 18],
      primary: [222, 10, 28],
      link: [214, 14, 32],
      border: [220, 6, 80],
      surface: [[220, 10, 80], [210, 8, 88], [222, 8, 92]],
    },
    dark: {
      bg: [222, 8, 9],
      fg: [220, 5, 94],
      primary: [220, 6, 86],
      link: [212, 12, 80],
      border: [222, 6, 32],
      surface: [[220, 10, 32], [210, 8, 24], [222, 8, 42]],
    },
  },
  {
    id: "almond",
    name: "Almond",
    surface: "blend",
    light: {
      bg: [36, 44, 94],
      fg: [32, 24, 18],
      primary: [30, 28, 30],
      link: [22, 34, 32],
      border: [34, 30, 74],
      surface: [[36, 50, 82], [24, 30, 74], [40, 48, 90]],
    },
    dark: {
      bg: [30, 12, 10],
      fg: [36, 20, 92],
      primary: [34, 24, 80],
      link: [28, 30, 76],
      border: [30, 10, 28],
      surface: [[34, 30, 36], [26, 22, 26], [38, 32, 44]],
    },
  },
  {
    id: "ink-wash",
    name: "Ink wash",
    surface: "noise",
    light: {
      bg: [220, 6, 95],
      fg: [220, 8, 14],
      primary: [220, 10, 22],
      link: [6, 58, 38],
      border: [220, 6, 76],
      surface: [[220, 8, 82], [6, 30, 74], [220, 6, 92]],
    },
    dark: {
      bg: [220, 6, 7],
      fg: [220, 6, 93],
      primary: [220, 6, 88],
      link: [6, 54, 64],
      border: [220, 6, 30],
      surface: [[220, 8, 26], [6, 28, 30], [220, 6, 34]],
    },
  },
  {
    id: "cinder",
    name: "Cinder",
    surface: "mesh",
    light: {
      bg: [20, 14, 90],
      fg: [18, 10, 14],
      primary: [14, 18, 24],
      link: [12, 34, 32],
      border: [20, 10, 62],
      surface: [[16, 24, 74], [12, 20, 64], [24, 26, 84]],
    },
    dark: {
      bg: [16, 8, 8],
      fg: [20, 8, 90],
      primary: [16, 10, 84],
      link: [14, 22, 74],
      border: [16, 7, 28],
      surface: [[16, 18, 26], [12, 14, 18], [22, 20, 32]],
    },
  },
  {
    id: "pumice",
    name: "Pumice",
    surface: "noise",
    light: {
      bg: [40, 8, 92],
      fg: [40, 8, 22],
      primary: [40, 8, 32],
      link: [32, 16, 32],
      border: [40, 6, 70],
      surface: [[40, 8, 78], [40, 6, 64], [40, 7, 88]],
    },
    dark: {
      bg: [40, 6, 12],
      fg: [40, 6, 88],
      primary: [40, 6, 78],
      link: [36, 10, 72],
      border: [40, 5, 32],
      surface: [[40, 6, 30], [40, 5, 20], [40, 6, 40]],
    },
  },
  {
    id: "sakura",
    name: "Sakura",
    surface: "dots",
    light: {
      bg: [340, 34, 97],
      fg: [340, 22, 24],
      primary: [336, 40, 44],
      link: [336, 42, 40],
      border: [340, 30, 84],
      surface: [[340, 44, 88], [336, 38, 84], [344, 36, 94]],
    },
    dark: {
      bg: [338, 10, 11],
      fg: [340, 14, 94],
      primary: [338, 44, 74],
      link: [338, 40, 72],
      border: [338, 9, 32],
      surface: [[338, 32, 36], [336, 26, 30], [342, 28, 44]],
    },
  },
  {
    id: "tar-paper",
    name: "Tar paper",
    surface: "paper",
    light: {
      bg: [30, 6, 92],
      fg: [30, 6, 16],
      primary: [30, 6, 24],
      link: [20, 14, 32],
      border: [30, 5, 66],
      surface: [[30, 8, 80], [30, 5, 66], [30, 6, 90]],
    },
    dark: {
      bg: [30, 5, 9],
      fg: [30, 4, 90],
      primary: [30, 5, 82],
      link: [26, 10, 74],
      border: [30, 4, 26],
      surface: [[30, 6, 24], [30, 4, 16], [30, 5, 32]],
    },
  },
  {
    id: "bone",
    name: "Bone",
    surface: "paper",
    light: {
      bg: [44, 16, 95],
      fg: [40, 10, 20],
      primary: [38, 10, 32],
      link: [30, 16, 32],
      border: [42, 12, 78],
      surface: [[44, 18, 86], [40, 12, 76], [44, 14, 92]],
    },
    dark: {
      bg: [40, 6, 10],
      fg: [44, 8, 92],
      primary: [42, 8, 84],
      link: [38, 14, 78],
      border: [40, 5, 30],
      surface: [[42, 10, 28], [40, 6, 20], [44, 8, 40]],
    },
  },
  {
    id: "quadrille",
    name: "Quadrille",
    surface: "dots",
    light: {
      bg: [200, 20, 96],
      fg: [206, 26, 18],
      primary: [206, 30, 30],
      link: [196, 32, 28],
      border: [202, 18, 76],
      surface: [[200, 26, 84], [196, 24, 70], [204, 24, 90]],
    },
    dark: {
      bg: [206, 14, 10],
      fg: [200, 14, 92],
      primary: [196, 30, 78],
      link: [200, 32, 74],
      border: [204, 12, 30],
      surface: [[202, 22, 32], [196, 18, 24], [206, 20, 42]],
    },
  },
  {
    id: "cocoa",
    name: "Cocoa",
    surface: "paper",
    light: {
      bg: [26, 28, 90],
      fg: [22, 26, 16],
      primary: [20, 30, 26],
      link: [14, 36, 28],
      border: [24, 22, 70],
      surface: [[26, 32, 78], [20, 24, 64], [28, 30, 86]],
    },
    dark: {
      bg: [22, 14, 8],
      fg: [26, 18, 90],
      primary: [22, 24, 74],
      link: [20, 30, 70],
      border: [22, 10, 26],
      surface: [[24, 22, 28], [20, 16, 18], [28, 24, 36]],
    },
  },
  {
    id: "chrome",
    name: "Chrome",
    surface: "gradient",
    light: {
      bg: [210, 6, 94],
      fg: [210, 10, 16],
      primary: [210, 8, 26],
      link: [200, 12, 30],
      border: [210, 6, 72],
      surface: [[210, 10, 82], [210, 6, 66], [210, 8, 92]],
    },
    dark: {
      bg: [210, 6, 10],
      fg: [210, 4, 94],
      primary: [210, 6, 86],
      link: [204, 10, 80],
      border: [210, 5, 32],
      surface: [[210, 8, 32], [210, 5, 20], [210, 6, 46]],
    },
  },
  {
    id: "bauhaus",
    name: "Bauhaus",
    surface: "plain",
    light: {
      bg: [44, 26, 96],
      fg: [0, 0, 8],
      primary: [6, 70, 42],
      link: [222, 58, 34],
      border: [0, 0, 8],
      surface: [[6, 70, 56], [222, 58, 56], [44, 80, 60]],
    },
    dark: {
      bg: [0, 0, 9],
      fg: [44, 10, 94],
      primary: [6, 72, 62],
      link: [222, 60, 68],
      border: [44, 8, 92],
      surface: [[6, 66, 44], [222, 54, 42], [44, 70, 48]],
    },
  },
  {
    id: "shoji",
    name: "Shoji",
    surface: "plain",
    light: {
      bg: [40, 10, 98],
      fg: [36, 8, 24],
      primary: [32, 10, 38],
      link: [26, 14, 36],
      border: [40, 8, 86],
      surface: [[40, 12, 92], [36, 8, 84], [40, 10, 96]],
    },
    dark: {
      bg: [36, 6, 11],
      fg: [40, 8, 94],
      primary: [38, 8, 86],
      link: [32, 12, 80],
      border: [36, 5, 32],
      surface: [[38, 10, 30], [36, 6, 22], [38, 8, 42]],
    },
  },
  {
    id: "pigment",
    name: "Pigment",
    surface: "blend",
    light: {
      bg: [40, 44, 95],
      fg: [24, 32, 18],
      primary: [352, 52, 40],
      link: [352, 50, 36],
      border: [30, 26, 78],
      surface: [[352, 50, 72], [24, 40, 66], [40, 56, 86]],
    },
    dark: {
      bg: [352, 12, 9],
      fg: [40, 18, 93],
      primary: [352, 54, 66],
      link: [352, 52, 64],
      border: [352, 10, 28],
      surface: [[352, 40, 32], [24, 30, 26], [352, 34, 40]],
    },
  },
  {
    id: "washi",
    name: "Washi",
    surface: "paper",
    light: {
      bg: [42, 28, 96],
      fg: [38, 16, 18],
      primary: [30, 22, 30],
      link: [20, 30, 32],
      border: [40, 18, 78],
      surface: [[42, 30, 88], [38, 20, 78], [42, 24, 92]],
    },
    dark: {
      bg: [34, 10, 10],
      fg: [42, 14, 93],
      primary: [38, 18, 84],
      link: [32, 24, 78],
      border: [34, 8, 30],
      surface: [[38, 16, 30], [34, 10, 22], [42, 14, 40]],
    },
  },
];

export const DEFAULT_PRESET = {
  id: "notecraft",
  name: "LemonNote default",
  mode: null,
  surface: "plain",
  tokens: { light: {}, dark: {} },
};

export const THEME_PRESETS = [
  DEFAULT_PRESET,
  ...SPEC.map(buildPreset),
  ...PAIRS.map(buildPair),
];

export function readPresetId() {
  const stored = readPref(PRESET_KEY, DEFAULT_PRESET.id);
  return THEME_PRESETS.some((preset) => preset.id === stored) ? stored : DEFAULT_PRESET.id;
}

export function activePreset() {
  const id = readPresetId();
  return THEME_PRESETS.find((preset) => preset.id === id) || DEFAULT_PRESET;
}

export function setPreset(id) {
  const next = THEME_PRESETS.some((preset) => preset.id === id) ? id : DEFAULT_PRESET.id;
  writePref(PRESET_KEY, next);
  return next;
}

/** Token overrides for one mode — empty for the built-in palette. */
export function presetVars(preset, mode) {
  return (preset && preset.tokens && preset.tokens[mode]) || {};
}

const hsl = (value, alpha) => `hsl(${value}${alpha == null ? "" : ` / ${alpha}`})`;

/** The little swatch on a gallery card, drawn from the preset's own colours. */
export function presetPreview(preset, fallbackMode) {
  const mode = preset?.mode || fallbackMode;
  const t = (preset && mode && preset.tokens && preset.tokens[mode]) || null;
  if (!t || !t["--background"]) {
    return {
      backgroundColor: "hsl(var(--card))",
      backgroundImage: "linear-gradient(135deg, transparent 0%, hsl(var(--primary) / 0.45) 100%)",
    };
  }
  const bg = t["--background"];
  const card = t["--card"];
  const a = t["--surface-a"];
  const b = t["--surface-b"];
  const c = t["--surface-c"];
  const primary = t["--primary"];

  switch (preset.surface) {
    case "waves":
      return {
        backgroundColor: hsl(bg),
        backgroundImage: `repeating-linear-gradient(115deg, ${hsl(a, 0.42)} 0 2px, transparent 2px 13px), linear-gradient(150deg, transparent, ${hsl(primary, 0.28)})`,
      };
    case "blend":
      return {
        backgroundColor: hsl(bg),
        backgroundImage: `radial-gradient(75% 75% at 18% 8%, ${hsl(a, 0.6)}, transparent 70%), radial-gradient(75% 75% at 88% 92%, ${hsl(b, 0.55)}, transparent 70%)`,
      };
    case "gradient":
      return {
        backgroundColor: hsl(bg),
        backgroundImage: `linear-gradient(160deg, ${hsl(bg)} 0%, ${hsl(card)} 42%, ${hsl(a, 0.7)} 100%)`,
      };
    case "stars":
      return {
        backgroundColor: hsl(bg),
        backgroundImage: `radial-gradient(1px 1px at 10px 12px, ${hsl(a, 0.95)}, transparent 60%), radial-gradient(1px 1px at 34px 30px, ${hsl(b, 0.8)}, transparent 60%), radial-gradient(1.4px 1.4px at 22px 42px, ${hsl(primary, 0.7)}, transparent 60%)`,
        backgroundSize: "44px 44px, 44px 44px, 44px 44px",
      };
    case "aurora":
      return {
        backgroundColor: hsl(bg),
        backgroundImage: `radial-gradient(65% 70% at 15% 0%, ${hsl(a, 0.65)}, transparent 65%), radial-gradient(60% 65% at 92% 24%, ${hsl(b, 0.6)}, transparent 65%), radial-gradient(60% 60% at 50% 100%, ${hsl(primary, 0.4)}, transparent 70%)`,
      };
    case "grain":
      return {
        backgroundColor: hsl(bg),
        backgroundImage: `repeating-conic-gradient(from 0deg at 50% 50%, ${hsl(a, 0.35)} 0 2deg, transparent 2deg 5deg), linear-gradient(140deg, ${hsl(card)}, ${hsl(bg)})`,
      };
    case "rings":
      return {
        backgroundColor: hsl(bg),
        backgroundImage: `repeating-radial-gradient(circle at 82% 18%, ${hsl(a, 0.45)} 0 1px, transparent 1px 9px), linear-gradient(160deg, ${hsl(bg)}, ${hsl(card)})`,
      };
    case "mesh":
      return {
        backgroundColor: hsl(bg),
        backgroundImage: `radial-gradient(48% 58% at 14% 12%, ${hsl(a, 0.85)}, transparent 64%), radial-gradient(46% 56% at 88% 20%, ${hsl(b, 0.75)}, transparent 62%), radial-gradient(58% 62% at 62% 96%, ${hsl(c, 0.8)}, transparent 66%)`,
      };
    case "dots":
      return {
        backgroundColor: hsl(bg),
        backgroundImage: `radial-gradient(${hsl(a, 0.9)} 1px, transparent 1.2px)`,
        backgroundSize: "9px 9px",
      };
    case "topo":
      return {
        backgroundColor: hsl(bg),
        backgroundImage: `repeating-radial-gradient(circle at 24% 18%, ${hsl(a, 0.6)} 0 1px, transparent 1px 8px), repeating-radial-gradient(circle at 82% 86%, ${hsl(b, 0.5)} 0 1px, transparent 1px 10px)`,
      };
    case "paper":
      return {
        backgroundColor: hsl(bg),
        backgroundImage: `repeating-linear-gradient(0deg, ${hsl(a, 0.36)} 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, ${hsl(b, 0.26)} 0 1px, transparent 1px 5px)`,
      };
    case "noise":
      return {
        backgroundColor: hsl(bg),
        backgroundImage: `repeating-conic-gradient(from 20deg at 36% 64%, ${hsl(a, 0.42)} 0 1deg, transparent 1deg 3deg, ${hsl(b, 0.34)} 3deg 4deg, transparent 4deg 7deg)`,
        backgroundSize: "7px 7px",
      };
    default:
      return {
        backgroundColor: hsl(bg),
        backgroundImage: `linear-gradient(135deg, ${hsl(bg)}, ${hsl(card)} 60%, ${hsl(primary, 0.35)})`,
      };
  }
}

/* ---------- AA audit ---------- */

const readTriple = (value) => String(value).trim().split(/\s+/).map(parseFloat);

/** Body / soft / link contrast against the background, for every mode the preset ships. */
export function presetContrast(preset) {
  const report = {};
  ["light", "dark"].forEach((mode) => {
    const tokens = preset?.tokens?.[mode];
    if (!tokens || !tokens["--background"] || !tokens["--foreground"]) return;
    const bg = readTriple(tokens["--background"]);
    const ratio = (name) =>
      tokens[name] ? Number(contrastOf(readTriple(tokens[name]), bg).toFixed(2)) : null;
    report[mode] = {
      body: ratio("--foreground"),
      soft: ratio("--muted-foreground"),
      link: ratio("--link"),
    };
  });
  return report;
}

/** Every preset/mode/pair below `min` — an empty list means the gallery passes AA. */
export function auditContrast(min = AA_BODY) {
  const failures = [];
  THEME_PRESETS.forEach((preset) => {
    const report = presetContrast(preset);
    Object.entries(report).forEach(([mode, values]) => {
      Object.entries(values).forEach(([key, ratio]) => {
        if (ratio != null && ratio < min) failures.push({ theme: preset.name, mode, key, ratio });
      });
    });
  });
  return failures;
}

if (import.meta.env && import.meta.env.DEV) {
  const failures = auditContrast();
  if (failures.length) console.warn("[theme] AA contrast failures", failures);
}