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
  // "auto" cannot be expressed as the CSS `direction` property; the reader puts the
  // dir="auto" attribute on the block element itself, so each block follows its own content.
  if (["rtl", "ltr"].includes(data["data-dir"])) style.direction = data["data-dir"];
  // Paragraph indentation and spacing (0.5em steps)
  if (data["data-il"] !== undefined) {
    const val = parseFloat(data["data-il"]);
    if (Number.isFinite(val)) style.marginLeft = `${val}em`;
  }
  if (data["data-ir"] !== undefined) {
    const val = parseFloat(data["data-ir"]);
    if (Number.isFinite(val)) style.marginRight = `${val}em`;
  }
  if (data["data-sb"] !== undefined) {
    const val = parseFloat(data["data-sb"]);
    if (Number.isFinite(val)) style.marginTop = `${val}em`;
  }
  if (data["data-sa"] !== undefined) {
    const val = parseFloat(data["data-sa"]);
    if (Number.isFinite(val)) style.marginBottom = `${val}em`;
  }
  // Column break and page break markers (handled via CSS break-after)
  if (data["data-column-break"] === "true") style.breakAfter = "column";
  if (data["data-page-break"] === "true") style.breakAfter = "page";
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
    span: ["dataF", "dataC", "dataS", "dataSc", "dataLs", "id"],
    mark: ["dataH"],
    div: ["dataA", "dataDir", "dataIl", "dataIr", "dataSb", "dataSa", "dataColumnBreak", "dataPageBreak"],
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

/** Page mode settings for notes with ink overlay. */
export const PAGE_MODE_KEYS = [
  "pageWidth",
  "pageLineHeight",
];

/* ---------------------------- page backgrounds ----------------------------- */

export const PAGE_STYLES = [
  { id: "default", label: "Default", description: "Plain background" },
  { id: "grid", label: "Grid", description: "Square grid pattern" },
  { id: "lines", label: "Lines", description: "Ruled lines pattern" },
  { id: "blank", label: "Blank (void)", description: "No background pattern" },
];

export const DEFAULT_GRID_SIZE = 24;
export const DEFAULT_LINE_HEIGHT = 28;

/* ---------------------------- style sets ----------------------------------- */

export const STYLE_SETS = [
  {
    id: "classic",
    label: "Classic",
    description: "Traditional serif for reading comfort",
    font: "georgia",
    headingFont: "garamond",
    size: 16,
    lineHeight: 1.78,
    gap: 0.95,
    spacing: "normal",
  },
  {
    id: "modern",
    label: "Modern",
    description: "Clean sans-serif for contemporary feel",
    font: "segoe",
    headingFont: "calibri",
    size: 16,
    lineHeight: 1.6,
    gap: 0.8,
    spacing: "normal",
  },
  {
    id: "compact",
    label: "Compact",
    description: "Tight spacing for dense notes",
    font: "segoe",
    headingFont: "segoe",
    size: 14,
    lineHeight: 1.4,
    gap: 0.5,
    spacing: "tight",
  },
  {
    id: "report",
    label: "Report",
    description: "Professional layout for documents",
    font: "calibri",
    headingFont: "cambria",
    size: 15,
    lineHeight: 1.6,
    gap: 1.2,
    spacing: "normal",
    width: "normal",
    align: "justify",
  },
  {
    id: "arabic",
    label: "Arabic book",
    description: "Optimized for Arabic text",
    font: "arabic-typeset",
    headingFont: "arabic-trad",
    size: 18,
    lineHeight: 2,
    gap: 1.4,
    spacing: "wide",
    dir: "rtl",
  },
  {
    id: "mono",
    label: "Mono",
    description: "Monospace for code and technical notes",
    font: "consolas",
    headingFont: "consolas",
    size: 14,
    lineHeight: 1.5,
    gap: 0.7,
    spacing: "normal",
    editorFont: "mono",
    editorSize: 13,
  },
];

const STYLE_SET_BY_ID = new Map(STYLE_SETS.map((s) => [s.id, s]));

/* -------------------------- paragraph spacing ------------------------------ */

export const PARAGRAPH_PRESETS = [
  { id: "tight", label: "Tight", gap: 0.5, lineHeight: 1.4 },
  { id: "normal", label: "Normal", gap: 0.95, lineHeight: 1.78 },
  { id: "relaxed", label: "Relaxed", gap: 1.4, lineHeight: 2 },
  { id: "double", label: "Double", gap: 2, lineHeight: 2.3 },
];

/* ------------------------------ page borders ------------------------------- */

export const PAGE_BORDERS = [
  { id: "none", label: "None" },
  { id: "line", label: "Line" },
  { id: "double", label: "Double" },
  { id: "rounded", label: "Rounded" },
];

/* ------------------------------ watermarks --------------------------------- */

export const WATERMARK_ANGLES = [
  { id: "diagonal", label: "Diagonal" },
  { id: "horizontal", label: "Horizontal" },
];

export const DEFAULT_WATERMARK_OPACITY = 0.08;

/* ------------------------------ page setup ----------------------------------- */

export const PAGE_SIZES = [
  { id: "a4", label: "A4 (210×297 mm)", width: 210, height: 297 },
  { id: "a5", label: "A5 (148×210 mm)", width: 148, height: 210 },
  { id: "letter", label: "Letter (8.5×11 in)", width: 215.9, height: 279.4 },
  { id: "legal", label: "Legal (8.5×14 in)", width: 215.9, height: 355.6 },
  { id: "custom", label: "Custom size…" },
];

export const PAGE_ORIENTATIONS = [
  { id: "portrait", label: "Portrait" },
  { id: "landscape", label: "Landscape" },
];

export const MARGINS = [
  { id: "normal", label: "Normal (25.4 mm)", top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
  { id: "narrow", label: "Narrow (12.7 mm)", top: 12.7, right: 12.7, bottom: 12.7, left: 12.7 },
  { id: "wide", label: "Wide (50.8 mm)", top: 50.8, right: 50.8, bottom: 50.8, left: 50.8 },
  { id: "custom", label: "Custom margins…" },
];

export const COLUMN_COUNTS = [1, 2, 3];
export const COLUMN_GAPS = [0.5, 1, 1.5, 2, 2.5, 3];

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
  if (["ltr", "rtl", "auto"].includes(raw.dir)) out.dir = raw.dir;
  if (raw.indent === true) out.indent = true;
  if (raw.dropCap === true) out.dropCap = true;
  if (raw.spell === false) out.spell = false;
  // Page mode settings for ink overlay
  if (Number.isFinite(raw.pageWidth) && raw.pageWidth >= 400 && raw.pageWidth <= 1200) out.pageWidth = Math.round(raw.pageWidth);
  if (Number.isFinite(raw.pageLineHeight) && raw.pageLineHeight >= 1 && raw.pageLineHeight <= 3.5) out.pageLineHeight = raw.pageLineHeight;
  // Page style (background pattern)
  if (PAGE_STYLES.some((item) => item.id === raw.pageStyle)) out.pageStyle = raw.pageStyle;
  if (Number.isFinite(raw.pageGridSize) && raw.pageGridSize >= 8 && raw.pageGridSize <= 100) out.pageGridSize = Math.round(raw.pageGridSize);
  if (Number.isFinite(raw.pageLineHeight) && raw.pageLineHeight >= 16 && raw.pageLineHeight <= 60) out.pageLineHeight = Math.round(raw.pageLineHeight);
  // Style set
  if (STYLE_SET_BY_ID.has(raw.styleSet)) out.styleSet = raw.styleSet;
  // Theme (per-note override)
  if (typeof raw.themePreset === "string" && raw.themePreset) out.themePreset = raw.themePreset;
  if (typeof raw.themeAccent === "string" && /^#[0-9a-fA-F]{6}$/.test(raw.themeAccent)) out.themeAccent = raw.themeAccent;
  if (FONT_BY_ID.has(raw.themeHeadingFont)) out.themeHeadingFont = raw.themeHeadingFont;
  if (FONT_BY_ID.has(raw.themeBodyFont)) out.themeBodyFont = raw.themeBodyFont;
  // Paragraph spacing preset
  if (PARAGRAPH_PRESETS.some((item) => item.id === raw.paragraphPreset)) out.paragraphPreset = raw.paragraphPreset;
  // Page appearance
  if (typeof raw.pageColor === "string" && /^#[0-9a-fA-F]{6}$/.test(raw.pageColor)) out.pageColor = raw.pageColor;
  if (PAGE_BORDERS.some((item) => item.id === raw.pageBorder)) out.pageBorder = raw.pageBorder;
  if (typeof raw.pageBorderColor === "string" && /^#[0-9a-fA-F]{6}$/.test(raw.pageBorderColor)) out.pageBorderColor = raw.pageBorderColor;
  // Watermark
  if (typeof raw.watermarkText === "string") out.watermarkText = raw.watermarkText.slice(0, 30);
  if (typeof raw.watermarkColor === "string" && /^#[0-9a-fA-F]{6}$/.test(raw.watermarkColor)) out.watermarkColor = raw.watermarkColor;
  if (Number.isFinite(raw.watermarkOpacity) && raw.watermarkOpacity >= 0 && raw.watermarkOpacity <= 1) out.watermarkOpacity = raw.watermarkOpacity;
  if (WATERMARK_ANGLES.some((item) => item.id === raw.watermarkAngle)) out.watermarkAngle = raw.watermarkAngle;
  // Page setup (Layout tab)
  if (PAGE_SIZES.some((item) => item.id === raw.pageSize)) out.pageSize = raw.pageSize;
  if (raw.pageSize === "custom" && Number.isFinite(raw.pageWidth) && raw.pageWidth > 0 && raw.pageWidth <= 1000 && Number.isFinite(raw.pageHeight) && raw.pageHeight > 0 && raw.pageHeight <= 1000) {
    out.pageWidth = Math.round(raw.pageWidth);
    out.pageHeight = Math.round(raw.pageHeight);
  }
  if (PAGE_ORIENTATIONS.some((item) => item.id === raw.pageOrientation)) out.pageOrientation = raw.pageOrientation;
  if (MARGINS.some((item) => item.id === raw.pageMargins)) out.pageMargins = raw.pageMargins;
  if (raw.pageMargins === "custom") {
    ["marginTop", "marginRight", "marginBottom", "marginLeft"].forEach((key) => {
      if (Number.isFinite(raw[key]) && raw[key] >= 0 && raw[key] <= 200) out[key] = Math.round(raw[key] * 10) / 10;
    });
  }
  // Columns
  if (COLUMN_COUNTS.includes(raw.columnCount)) out.columnCount = raw.columnCount;
  if (COLUMN_GAPS.includes(raw.columnGap)) out.columnGap = raw.columnGap;
  // Editor
  if (raw.showLineNumbers === true) out.showLineNumbers = true;
  if (["auto", "none"].includes(raw.hyphens)) out.hyphens = raw.hyphens;
  // Per-note language (for spelling and hyphenation)
  if (["en", "ar", "es", "fr", "de", "zh", "ja", "ko", "pt", "ru", "it", "nl", "tr", "pl", "hi"].includes(raw.language)) out.language = raw.language;
  return out;
}

/** Inline style + class names for the reading view of a note. */
export function readerProps(style, hasInk = false) {
  const s = normalizeStyle(style);
  const css = {};
  if (s.font) css.fontFamily = fontStack(s.font);
  if (s.size) css.fontSize = `${s.size}px`;
  if (s.lineHeight) css.lineHeight = s.lineHeight;
  if (s.spacing) css.letterSpacing = LETTER_SPACING.find((item) => item.id === s.spacing).value;
  if (s.align) css.textAlign = s.align;
  // "auto" is handled per block in MarkdownView (dir="auto" on every block element).
  if (s.dir && s.dir !== "auto") css.direction = s.dir;
  if (s.gap !== undefined) css["--nt-gap"] = `${s.gap}em`;
  if (s.headingFont) css["--nt-heading"] = fontStack(s.headingFont);
  
  // Columns (CSS multi-column layout)
  if (s.columnCount && s.columnCount > 1) {
    css.columnCount = s.columnCount;
    css.columnGap = `${s.columnGap || 1.5}em`;
  }
  
  // Hyphenation
  if (s.hyphens) css.hyphens = s.hyphens;
  
  // Page style (background pattern for reading page)
  if (s.pageStyle && s.pageStyle !== "default") {
    css["--nt-page-style"] = s.pageStyle;
    if (s.pageGridSize) css["--nt-page-grid-size"] = `${s.pageGridSize}px`;
    if (s.pageLineHeight) css["--nt-page-line-height"] = `${s.pageLineHeight}px`;
  }
  
  // Page color
  if (s.pageColor) css["--nt-page-color"] = s.pageColor;
  
  // Page border
  if (s.pageBorder && s.pageBorder !== "none") {
    css["--nt-page-border"] = s.pageBorder;
    if (s.pageBorderColor) css["--nt-page-border-color"] = s.pageBorderColor;
  }
  
  // Watermark
  if (s.watermarkText) {
    css["--nt-watermark-text"] = `"${s.watermarkText.replace(/"/g, '\\"')}"`;
    if (s.watermarkColor) css["--nt-watermark-color"] = s.watermarkColor;
    if (s.watermarkOpacity !== undefined) css["--nt-watermark-opacity"] = String(s.watermarkOpacity);
    if (s.watermarkAngle) css["--nt-watermark-angle"] = s.watermarkAngle;
  }
  
  // Per-note theme overrides
  if (s.themeAccent) css["--nt-theme-accent"] = s.themeAccent;
  if (s.themeHeadingFont) css["--nt-theme-heading-font"] = fontStack(s.themeHeadingFont);
  if (s.themeBodyFont) css["--nt-theme-body-font"] = fontStack(s.themeBodyFont);
  
  // Content width from typography settings (not 736px ink width - that's only for Write mode)
  const width = WIDTHS.find((item) => item.id === s.width);
  if (width && width.value !== "none") {
    css.maxWidth = width.value;
  }
  
  const classes = [s.indent ? "nt-indent" : "", s.dropCap ? "nt-dropcap" : ""].filter(Boolean).join(" ");
  return { style: css, className: classes };
}

/** Inline style for the markdown textarea. */
export function editorProps(style, hasInk = false, isPageMode = false) {
  const s = normalizeStyle(style);
  const css = {};
  if (s.editorFont) css.fontFamily = fontStack(s.editorFont);
  if (s.editorSize) css.fontSize = `${s.editorSize}px`;
  if (s.lineHeight) css.lineHeight = s.lineHeight;
  // The writing box is one <textarea>, so "auto" applies to the whole box (an HTML
  // dir attribute, not the CSS property). Per-line direction is only possible in the reader.
  if (s.dir && s.dir !== "auto") css.direction = s.dir;
  if (s.align && s.align !== "justify") css.textAlign = s.align;
  
  // Hyphenation in editor
  if (s.hyphens) css.hyphens = s.hyphens;
  
  // Page style (background pattern for editor)
  if (s.pageStyle && s.pageStyle !== "default") {
    css["--nt-page-style"] = s.pageStyle;
    if (s.pageGridSize) css["--nt-page-grid-size"] = `${s.pageGridSize}px`;
    if (s.pageLineHeight) css["--nt-page-line-height"] = `${s.pageLineHeight}px`;
  }
  
  // Page color
  if (s.pageColor) css["--nt-page-color"] = s.pageColor;
  
  // Page border
  if (s.pageBorder && s.pageBorder !== "none") {
    css["--nt-page-border"] = s.pageBorder;
    if (s.pageBorderColor) css["--nt-page-border-color"] = s.pageBorderColor;
  }
  
  // Per-note theme overrides
  if (s.themeAccent) css["--nt-theme-accent"] = s.themeAccent;
  if (s.themeHeadingFont) css["--nt-theme-heading-font"] = fontStack(s.themeHeadingFont);
  if (s.themeBodyFont) css["--nt-theme-body-font"] = fontStack(s.themeBodyFont);
  
  // Fixed page width for notes with ink in page mode (Write mode with ink)
  if (isPageMode) {
    const pageWidth = s.pageWidth || 736; // 46rem = 736px default
    css.maxWidth = `${pageWidth}px`;
    if (s.pageLineHeight) {
      css.lineHeight = s.pageLineHeight;
    }
  }
  
  return { style: css, dir: s.dir === "auto" ? "auto" : undefined, spellCheck: s.spell !== false };
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
