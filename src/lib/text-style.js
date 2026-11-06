/**
 * Everything the Format / Paragraph / View ribbon tabs can apply.
 *
 * Two kinds of styling exist:
 *  1. Inline and block styling that lives INSIDE the markdown text as small HTML
 *     tags with whitelisted data-attributes, for example
 *     `<span data-c="red">word</span>`. The reader maps each id to real CSS here,
 *     so a note can never inject arbitrary CSS (only ids from these tables work).
 *  2. Note-level typography saved on the note record as `note.style`
 *     (font, size, line spacing, width ...). It affects the whole note.
 */
import { defaultSchema } from "rehype-sanitize";

/* ------------------------------- fonts ------------------------------------ */

/** Font ids written into notes. Stacks fall back to generic families when a font is not installed. */
export const FONTS = [
  { id: "app", label: "App default", group: "App", stack: "var(--font-body)" },
  { id: "display", label: "App serif", group: "App", stack: "var(--font-display)" },
  { id: "segoe", label: "Segoe UI", group: "Sans", stack: '"Segoe UI", system-ui, sans-serif' },
  { id: "calibri", label: "Calibri", group: "Sans", stack: 'Calibri, "Segoe UI", sans-serif' },
  { id: "arial", label: "Arial", group: "Sans", stack: "Arial, Helvetica, sans-serif" },
  { id: "verdana", label: "Verdana", group: "Sans", stack: "Verdana, Geneva, sans-serif" },
  { id: "tahoma", label: "Tahoma", group: "Sans", stack: "Tahoma, Geneva, sans-serif" },
  { id: "trebuchet", label: "Trebuchet MS", group: "Sans", stack: '"Trebuchet MS", sans-serif' },
  { id: "georgia", label: "Georgia", group: "Serif", stack: "Georgia, serif" },
  { id: "cambria", label: "Cambria", group: "Serif", stack: 'Cambria, Georgia, serif' },
  { id: "times", label: "Times New Roman", group: "Serif", stack: '"Times New Roman", Times, serif' },
  { id: "palatino", label: "Palatino Linotype", group: "Serif", stack: '"Palatino Linotype", Palatino, serif' },
  { id: "garamond", label: "Garamond", group: "Serif", stack: "Garamond, Georgia, serif" },
  { id: "consolas", label: "Consolas", group: "Mono", stack: 'Consolas, "Courier New", monospace' },
  { id: "courier", label: "Courier New", group: "Mono", stack: '"Courier New", Courier, monospace' },
  { id: "lucida", label: "Lucida Console", group: "Mono", stack: '"Lucida Console", monospace' },
  { id: "mono", label: "App mono", group: "Mono", stack: "var(--font-mono)" },
  { id: "arabic-trad", label: "Traditional Arabic", group: "Arabic", stack: '"Traditional Arabic", Tahoma, serif' },
  { id: "arabic-sakkal", label: "Sakkal Majalla", group: "Arabic", stack: '"Sakkal Majalla", Tahoma, sans-serif' },
  { id: "arabic-typeset", label: "Arabic Typesetting", group: "Arabic", stack: '"Arabic Typesetting", Tahoma, serif' },
  { id: "comic", label: "Comic Sans MS", group: "Fun", stack: '"Comic Sans MS", cursive' },
  { id: "impact", label: "Impact", group: "Fun", stack: "Impact, Haettenschweiler, sans-serif" },
];

export const FONT_GROUPS = ["App", "Sans", "Serif", "Mono", "Arabic", "Fun"];

const FONT_BY_ID = new Map(FONTS.map((font) => [font.id, font]));
export const fontStack = (id) => FONT_BY_ID.get(id)?.stack || "";

/* ------------------------------- sizes ------------------------------------ */

export const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];
const SIZE_SET = new Set(SIZES.map(String));

/* ------------------------------- colours ---------------------------------- */

export const COLORS = [
  { id: "red", label: "Red", value: "#ef4444" },
  { id: "orange", label: "Orange", value: "#f97316" },
  { id: "amber", label: "Amber", value: "#f59e0b" },
  { id: "yellow", label: "Yellow", value: "#eab308" },
  { id: "lime", label: "Lime", value: "#84cc16" },
  { id: "green", label: "Green", value: "#22c55e" },
  { id: "teal", label: "Teal", value: "#14b8a6" },
  { id: "cyan", label: "Cyan", value: "#06b6d4" },
  { id: "blue", label: "Blue", value: "#3b82f6" },
  { id: "indigo", label: "Indigo", value: "#6366f1" },
  { id: "violet", label: "Violet", value: "#8b5cf6" },
  { id: "pink", label: "Pink", value: "#ec4899" },
  { id: "rose", label: "Rose", value: "#f43f5e" },
  { id: "gray", label: "Gray", value: "#9ca3af" },
  { id: "black", label: "Black", value: "#111827" },
  { id: "white", label: "White", value: "#f9fafb" },
];

export const HIGHLIGHTS = [
  { id: "yellow", label: "Yellow", value: "rgba(250, 204, 21, 0.38)" },
  { id: "green", label: "Green", value: "rgba(74, 222, 128, 0.34)" },
  { id: "blue", label: "Blue", value: "rgba(96, 165, 250, 0.34)" },
  { id: "pink", label: "Pink", value: "rgba(244, 114, 182, 0.34)" },
  { id: "orange", label: "Orange", value: "rgba(251, 146, 60, 0.36)" },
  { id: "purple", label: "Purple", value: "rgba(167, 139, 250, 0.36)" },
  { id: "red", label: "Red", value: "rgba(248, 113, 113, 0.34)" },
  { id: "gray", label: "Gray", value: "rgba(156, 163, 175, 0.34)" },
];

const COLOR_BY_ID = new Map(COLORS.map((c) => [c.id, c.value]));
const HIGHLIGHT_BY_ID = new Map(HIGHLIGHTS.map((c) => [c.id, c.value]));

/* --------------------------- id -> CSS (reader) ---------------------------- */

/** Style for `<span data-f data-c data-s data-sc data-ls>`. Unknown ids are ignored. */
export function spanStyle(data = {}) {
  const style = {};
  const font = fontStack(data["data-f"]);
  if (font) style.fontFamily = font;
  const color = COLOR_BY_ID.get(data["data-c"]);
  if (color) style.color = color;
  if (SIZE_SET.has(String(data["data-s"]))) style.fontSize = `${data["data-s"]}px`;
  if (data["data-sc"] !== undefined) style.fontVariant = "small-caps";
  const spacing = LETTER_SPACING.find((item) => item.id === data["data-ls"]);
  if (spacing) style.letterSpacing = spacing.value;
  return style;
}

export const highlightStyle = (id) => ({ backgroundColor: HIGHLIGHT_BY_ID.get(id) || HIGHLIGHT_BY_ID.get("yellow"), color: "inherit", borderRadius: "3px", padding: "0 0.12em" });

export function blockStyle(data = {}) {
  const style = {};
  if (["left", "center", "right", "justify"].includes(data["data-a"])) style.textAlign = data["data-a"];
  if (["rtl", "ltr"].includes(data["data-dir"])) style.direction = data["data-dir"];
  return style;
}

/* --------------------------- sanitize whitelist ---------------------------- */

/**
 * Markdown notes may contain a few HTML tags. Everything else is stripped, and
 * only the data-attributes below survive (no style, no class, no scripts).
 */
export const SANITIZE_SCHEMA = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), "mark", "u", "small", "kbd", "details", "summary", "span", "div", "sub", "sup"],
  attributes: {
    ...defaultSchema.attributes,
    // hast stores data-x attributes as camelCase properties (data-f -> dataF).
    span: ["dataF", "dataC", "dataS", "dataSc", "dataLs"],
    mark: ["dataH"],
    div: ["dataA", "dataDir"],
    details: ["open"],
  },
};

/* --------------------------- letter spacing -------------------------------- */

export const LETTER_SPACING = [
  { id: "tight", label: "Tight", value: "-0.03em" },
  { id: "normal", label: "Normal", value: "normal" },
  { id: "wide", label: "Wide", value: "0.04em" },
  { id: "wider", label: "Wider", value: "0.09em" },
];

/* --------------------------- note-level typography -------------------------- */

export const LINE_HEIGHTS = [1.2, 1.4, 1.6, 1.78, 2, 2.3, 2.6];
export const PARAGRAPH_GAPS = [0.2, 0.5, 0.95, 1.4, 2];
export const WIDTHS = [
  { id: "narrow", label: "Narrow", value: "34rem" },
  { id: "normal", label: "Normal", value: "46rem" },
  { id: "wide", label: "Wide", value: "64rem" },
  { id: "full", label: "Full", value: "none" },
];
export const EDITOR_FONTS = [
  { id: "mono", label: "Monospace" },
  { id: "app", label: "Sans" },
  { id: "display", label: "Serif" },
  { id: "consolas", label: "Consolas" },
  { id: "segoe", label: "Segoe UI" },
  { id: "georgia", label: "Georgia" },
  { id: "tahoma", label: "Tahoma (Arabic)" },
];

export const DEFAULT_STYLE = Object.freeze({});

/** Cleans a stored style object so only known keys with valid values remain. */
export function normalizeStyle(raw) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  if (FONT_BY_ID.has(raw.font)) out.font = raw.font;
  if (FONT_BY_ID.has(raw.headingFont)) out.headingFont = raw.headingFont;
  if (FONT_BY_ID.has(raw.editorFont)) out.editorFont = raw.editorFont;
  if (Number.isFinite(raw.size) && raw.size >= 10 && raw.size <= 40) out.size = Math.round(raw.size);
  if (Number.isFinite(raw.editorSize) && raw.editorSize >= 10 && raw.editorSize <= 32) out.editorSize = Math.round(raw.editorSize);
  if (Number.isFinite(raw.lineHeight) && raw.lineHeight >= 1 && raw.lineHeight <= 3.5) out.lineHeight = raw.lineHeight;
  if (Number.isFinite(raw.gap) && raw.gap >= 0 && raw.gap <= 4) out.gap = raw.gap;
  if (LETTER_SPACING.some((item) => item.id === raw.spacing)) out.spacing = raw.spacing;
  if (WIDTHS.some((item) => item.id === raw.width)) out.width = raw.width;
  if (["left", "center", "right", "justify"].includes(raw.align)) out.align = raw.align;
  if (["ltr", "rtl"].includes(raw.dir)) out.dir = raw.dir;
  if (raw.indent === true) out.indent = true;
  if (raw.dropCap === true) out.dropCap = true;
  if (raw.spell === false) out.spell = false;
  return out;
}

/** Inline style + class names for the reading view of a note. */
export function readerProps(style) {
  const s = normalizeStyle(style);
  const css = {};
  if (s.font) css.fontFamily = fontStack(s.font);
  if (s.size) css.fontSize = `${s.size}px`;
  if (s.lineHeight) css.lineHeight = s.lineHeight;
  if (s.spacing) css.letterSpacing = LETTER_SPACING.find((item) => item.id === s.spacing).value;
  if (s.align) css.textAlign = s.align;
  if (s.dir) css.direction = s.dir;
  if (s.gap !== undefined) css["--nt-gap"] = `${s.gap}em`;
  if (s.headingFont) css["--nt-heading"] = fontStack(s.headingFont);
  const width = WIDTHS.find((item) => item.id === s.width);
  if (width && width.value !== "none") {
    css.maxWidth = width.value;
  }
  const classes = [s.indent ? "nt-indent" : "", s.dropCap ? "nt-dropcap" : ""].filter(Boolean).join(" ");
  return { style: css, className: classes };
}

/** Inline style for the markdown textarea. */
export function editorProps(style) {
  const s = normalizeStyle(style);
  const css = {};
  if (s.editorFont) css.fontFamily = fontStack(s.editorFont);
  if (s.editorSize) css.fontSize = `${s.editorSize}px`;
  if (s.lineHeight) css.lineHeight = s.lineHeight;
  if (s.dir) css.direction = s.dir;
  if (s.align && s.align !== "justify") css.textAlign = s.align;
  return { style: css, spellCheck: s.spell !== false };
}

/* ------------------------------ symbols ----------------------------------- */

export const SYMBOLS = [
  { group: "Punctuation", items: ["—", "–", "…", "•", "·", "«", "»", "“", "”", "‘", "’", "§", "¶", "†", "‡", "※", "‰"] },
  { group: "Arrows", items: ["→", "←", "↑", "↓", "↔", "↕", "⇒", "⇐", "⇔", "↗", "↘", "↩", "↪", "⟶", "➜"] },
  { group: "Math", items: ["±", "×", "÷", "≠", "≈", "≤", "≥", "∞", "√", "∑", "∏", "∫", "∂", "∆", "∈", "∉", "∪", "∩", "⊂", "⊃", "∀", "∃", "∴", "∵", "¬", "∧", "∨", "π", "°", "′", "″", "½", "⅓", "¼", "¾", "²", "³", "⁰", "¹"] },
  { group: "Greek", items: ["α", "β", "γ", "δ", "ε", "θ", "λ", "μ", "σ", "φ", "ψ", "ω", "Δ", "Σ", "Φ", "Ψ", "Ω"] },
  { group: "Currency", items: ["$", "€", "£", "¥", "₹", "₽", "₩", "₺", "¢", "؋", "﷼"] },
  { group: "Marks", items: ["©", "®", "™", "✓", "✗", "✔", "✘", "★", "☆", "♥", "♦", "♠", "♣", "☐", "☑", "☒", "●", "○", "■", "□", "▲", "▼", "◆", "◇"] },
  { group: "Arabic", items: ["،", "؛", "؟", "ـ", "«", "»", "٪", "٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"] },
];
