const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const clamp01 = (value) => clamp(Number(value) || 0, 0, 1);

export function hexToRgb(hex) {
  const raw = String(hex || "").replace("#", "").trim();
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw.slice(0, 6);
  const num = parseInt(full, 16);
  if (Number.isNaN(num) || full.length !== 6) return { r: 233, g: 226, b: 208 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgbToHex({ r, g, b }) {
  const part = (value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

export function rgbToHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const delta = max - min;
  if (!delta) return { h: 0, s: 0, l: Math.round(l * 100) };
  const s = delta / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === rn) h = ((gn - bn) / delta) % 6;
  else if (max === gn) h = (bn - rn) / delta + 2;
  else h = (rn - gn) / delta + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb({ h, s, l }) {
  const hn = ((Number(h) || 0) % 360 + 360) % 360;
  const sn = clamp01(Number(s) / 100);
  const ln = clamp01(Number(l) / 100);
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = ln - c / 2;
  let rgb = [0, 0, 0];
  if (hn < 60) rgb = [c, x, 0];
  else if (hn < 120) rgb = [x, c, 0];
  else if (hn < 180) rgb = [0, c, x];
  else if (hn < 240) rgb = [0, x, c];
  else if (hn < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return {
    r: Math.round((rgb[0] + m) * 255),
    g: Math.round((rgb[1] + m) * 255),
    b: Math.round((rgb[2] + m) * 255),
  };
}

export function parseColor(input) {
  if (input && typeof input === "object") {
    return {
      r: clamp(Math.round(input.r ?? 0), 0, 255),
      g: clamp(Math.round(input.g ?? 0), 0, 255),
      b: clamp(Math.round(input.b ?? 0), 0, 255),
      a: clamp01(input.a ?? 1),
    };
  }
  const value = String(input || "").trim().toLowerCase();
  if (!value) return { r: 233, g: 226, b: 208, a: 1 };
  if (value.startsWith("#")) {
    const raw = value.slice(1);
    if (raw.length === 8) {
      const rgb = hexToRgb(raw.slice(0, 6));
      return { ...rgb, a: parseInt(raw.slice(6), 16) / 255 };
    }
    return { ...hexToRgb(raw), a: 1 };
  }
  const numbers = value.match(/[-\d.]+/g)?.map(Number) ?? [];
  if (value.startsWith("rgb") && numbers.length >= 3) {
    return {
      r: clamp(numbers[0], 0, 255),
      g: clamp(numbers[1], 0, 255),
      b: clamp(numbers[2], 0, 255),
      a: numbers.length > 3 ? clamp01(numbers[3]) : 1,
    };
  }
  if (value.startsWith("hsl") && numbers.length >= 3) {
    const rgb = hslToRgb({ h: numbers[0], s: numbers[1], l: numbers[2] });
    return { ...rgb, a: numbers.length > 3 ? clamp01(numbers[3]) : 1 };
  }
  return { ...hexToRgb(value), a: 1 };
}

export function toCss(color, alpha) {
  const { r, g, b, a } = parseColor(color);
  return `rgba(${r}, ${g}, ${b}, ${alpha ?? a})`;
}

export function mixColors(a, b, t) {
  const first = parseColor(a);
  const second = parseColor(b);
  const ratio = clamp01(t);
  return rgbToHex({
    r: first.r + (second.r - first.r) * ratio,
    g: first.g + (second.g - first.g) * ratio,
    b: first.b + (second.b - first.b) * ratio,
  });
}

export function shade(color, amount) {
  return amount >= 0 ? mixColors(color, "#ffffff", amount) : mixColors(color, "#000000", -amount);
}

/** Smooth swatch strip between two colors — used by the palette gradients. */
export function gradientSteps(from, to, count = 6) {
  return Array.from({ length: count }, (_, index) => mixColors(from, to, index / (count - 1)));
}

export const PRESET_PALETTES = [
  {
    id: "inkwell",
    name: "Inkwell",
    colors: ["#e9e2d0", "#e5b567", "#7fc8c0", "#9d8cd6", "#e2705f", "#8fb97a"],
  },
  {
    id: "graphite",
    name: "Graphite",
    colors: ["#f4f1ea", "#c8c4ba", "#9b978f", "#6f6c66", "#4a4844", "#242322"],
  },
  {
    id: "highlighter",
    name: "Highlighter",
    colors: ["#ffe45e", "#9bf6a8", "#8fd7ff", "#ffb0d8", "#ffc478", "#c9a6ff"],
  },
  {
    id: "risograph",
    name: "Risograph",
    colors: ["#ff4d6d", "#ff9f1c", "#ffd166", "#2ec4b6", "#3a86ff", "#8338ec"],
  },
  {
    id: "journal",
    name: "Journal",
    colors: ["#1f3a5f", "#2e6f7e", "#5c8a4e", "#8a6d3b", "#7a4f6d", "#3c3c46"],
  },
];

export const ALPHA_STOPS = [1, 0.85, 0.65, 0.45, 0.25, 0.12];

export function colorCss(color, alpha) {
  return toCss(color, alpha);
}

export function readableOn(color) {
  const { r, g, b } = parseColor(color);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#12161b" : "#f6f2e8";
}