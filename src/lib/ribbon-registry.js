/**
 * Registry of every pinnable ribbon button, keyed by its stable id ("home.bold").
 * The tab files tag their buttons with these ids; Quick Access renders pinned
 * buttons outside the tabs using these entries.
 *
 * Entry shapes:
 *  - { kind: "edit", make: (selection, ctx) => editResult } — runs an edit through the editor bridge.
 *  - { kind: "call", fn: (ctx, extras) => void } — anything that is not a text edit (undo, copy…).
 *  - { kind: "navigate", target } — opens a journal/period note (Quick Access owns db + router).
 *  - { kind: "menu", width, menu } — the button opens a popover; `menu.type` says which one.
 *    Types: "input" (type text + Insert), "items" (list of actions), "symbols", "languages", "setLanguage".
 *  - { kind: "widget", widget: "tablePicker" | "cardComposer" } — the composite pickers.
 * Optional: { enabled: (ctx) => bool, disabledReason: string | (ctx) => string, active, shortcut }.
 *
 * Imports are relative and UI-free so a Node test script can load this file directly.
 */
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowDown, ArrowDownAZ, ArrowDownToLine, ArrowLeft, ArrowLeftRight,
  ArrowLeftToLine, ArrowRight, ArrowRightToLine, ArrowUp, ArrowUpAZ, ArrowUpToLine, AtSign, Bold, BookOpen, Braces,
  CalendarCheck, CalendarClock, CalendarDays, CalendarPlus, CalendarRange, ChevronsDownUp, Circle, CircleCheck,
  CircleDashed, ClipboardCopy, Clock, Code, Copy, CopyPlus, CornerDownLeft, Download, Eraser, Eye, FileJson, FileSpreadsheet,
  FileText, FlipHorizontal2, Footprints, Grid, Hash, Highlighter, Image, ImagePlus, IndentDecrease, IndentIncrease, Italic, Layers, Link, Link2,
  List, ListChecks, ListOrdered, ListRestart, ListTree, ListX, Merge, MessageSquareOff, MessageSquareQuote, Minus, MoveHorizontal, MoveVertical, Omega,
  BarChart,
  PackageOpen, Paperclip, PenLine, Pilcrow, Quote, Redo2, Replace, Ruler, Scissors, Search, Shield, Shrink, Sigma, Space, SpellCheck, SquareCode,
  SquareDashedMousePointer, SquareTerminal, Strikethrough, Table, Table2, TableProperties, TextQuote, Timer, Trash2,
  Type, Underline, Undo2, Wand2, WrapText, ZoomIn, ZoomOut,
  Bookmark, Mic, Mic2, FileImage, Film, SquareDashed, Square, Star, Triangle, Smile, StickyNote, SquarePen, BookOpenCheck, Sidebar,
} from "lucide-react";

import { copyText, execEditor } from "./editor-bridge";
import {
  applyAttr, clearFormatting, fenceAt, footnoteParts, formatJsonSelection, insertBlock, linkWithUrl, lineMove,
  lineTool, outlineOf, setBlock, shiftIndent, taskTool, toggleComment, toggleItalic, toggleLinePrefix, toggleWrap,
  unwrapFence, wikiLink, wrapSelectionInFence,
} from "./format-actions";
import { insertText, tableAt, tableOp, taskStatusAt, toggleTask } from "./ribbon-actions";
import { delimitedToMarkdown, selectionToTable, tableExtra, tableToCsv } from "./table-extras";
import { dateKey, shiftDay } from "./journal";
import { DATE_FORMATS, JOURNAL_TEMPLATES, neighbourTitle } from "./journal-tools";
import { QUICK_LANGUAGES, fenceLabel } from "./code-fence-languages";
import { LANGUAGES } from "./code-languages";
import { writePref } from "./preferences";

/* Shared predicates and small helpers --------------------------------------------------- */

const selected = (ctx) => ctx.selection.value.slice(ctx.selection.start, ctx.selection.end);
const selectedSome = (ctx) => selected(ctx).length > 0;
const inTable = (ctx) => Boolean(tableAt(ctx.value, ctx.selection.start));
const inCodeBlock = (ctx) => Boolean(fenceAt(ctx.value, ctx.selection.start));

const NEED_TABLE = "Put the cursor inside a table first.";
const NEED_BLOCK = "Put the cursor inside a code block first.";
const NEED_TEXT = "Select some text first.";
const NEED_DATE_TITLE = "This note's title is not a date, week (2026-W45) or month (2026-11)";

const timeNow = () => DATE_FORMATS.find((f) => f.id === "time24").make(new Date());

/** Toggles a boolean key on the whole-note typography (`note.style`). */
const toggleTypo = (key) => (ctx) => {
  const t = ctx.typography || {};
  if (t[key]) {
    const next = { ...t };
    delete next[key];
    ctx.setTypography(next);
  } else {
    ctx.setTypography({ ...t, [key]: true });
  }
};

/** Inserts a fenced code block, wrapping the selection when there is one (same as the tabs). */
export function runCodeFence(ctx, id) {
  writePref("codeBlockLanguage", id);
  const wrapped = wrapSelectionInFence(ctx.selection, id);
  if (wrapped) return ctx.run(wrapped);
  const snippet = `\`\`\`${id}\n\n\`\`\``;
  ctx.run(insertBlock(ctx.selection, snippet, id.length + 4));
}

/* Menu payloads ------------------------------------------------------------------------- */

const CALLOUT_ITEMS = ["Note", "Tip", "Important", "Warning", "Danger"].map((text) => ({
  label: text,
  make: (s) => {
    const bodyText = s.value.slice(s.start, s.end);
    const snippet = `> **${text}**\n> ${bodyText || ""}`;
    return insertBlock(s, snippet, snippet.length);
  },
}));

const TEXT_TO_TABLE_MENU = {
  type: "items",
  heading: "Separator",
  items: [["", "Detect automatically"], [",", "Comma"], ["\t", "Tab"], [";", "Semicolon"], ["|", "Pipe"]].map(
    ([sep, label]) => ({ label, make: (s) => selectionToTable(s, sep || undefined) })
  ),
};

/* The registry -------------------------------------------------------------------------- */

const ACTIONS = {
  /* Home — Clipboard */
  "home.undo": { icon: Undo2, label: "Undo", hint: "Undo the last edit", kind: "call", fn: () => execEditor("undo"), capability: "editText" },
  "home.redo": { icon: Redo2, label: "Redo", hint: "Redo", kind: "call", fn: () => execEditor("redo"), capability: "editText" },
  "home.cut": {
    icon: Scissors, label: "Cut", hint: "Cut the selection", kind: "call", capability: "editText",
    enabled: selectedSome, disabledReason: NEED_TEXT,
    fn: async (ctx) => {
      const text = selected(ctx);
      if (!text) return;
      await copyText(text);
      ctx.run({ next: "", start: ctx.selection.start, end: ctx.selection.end, text: "", caret: ctx.selection.start });
    },
  },
  "home.copy": {
    icon: Copy, label: "Copy", hint: "Copy the selection", kind: "call", capability: "editText",
    enabled: selectedSome, disabledReason: NEED_TEXT,
    fn: async (ctx) => copyText(selected(ctx)),
  },
  "home.selectAll": { icon: SquareDashedMousePointer, label: "Select all", hint: "Select the whole note", kind: "call", fn: () => execEditor("selectAll"), capability: "editText" },

  /* Home — Font */
  "home.bold": { icon: Bold, label: "Bold", hint: "Bold", shortcut: "Ctrl+B", kind: "edit", make: (s) => toggleWrap(s, "**"), capability: "richFormat" },
  "home.italic": { icon: Italic, label: "Italic", hint: "Italic", shortcut: "Ctrl+I", kind: "edit", make: toggleItalic, capability: "richFormat" },
  "home.underline": { icon: Underline, label: "Underline", hint: "Underline", shortcut: "Ctrl+U", kind: "edit", make: (s) => toggleWrap(s, "<u>", "</u>"), capability: "richFormat" },
  "home.strike": { icon: Strikethrough, label: "Strikethrough", hint: "Strikethrough", shortcut: "Ctrl+Shift+X", kind: "edit", make: (s) => toggleWrap(s, "~~"), capability: "richFormat" },
  "home.highlight": { icon: Highlighter, label: "Highlight", hint: "Highlight (yellow)", shortcut: "Ctrl+Shift+H", kind: "edit", make: (s) => applyAttr(s, "mark", "h", "yellow"), capability: "richFormat" },
  "home.inlineCode": { icon: Code, label: "Inline code", hint: "Inline code", shortcut: "Ctrl+E", kind: "edit", make: (s) => toggleWrap(s, "`"), capability: "richFormat" },
  "home.clearFormatting": { icon: Eraser, label: "Clear formatting", hint: "Clear formatting on the selection or the line", kind: "edit", make: clearFormatting, capability: "richFormat" },

  /* Home — Lists */
  "home.bulletList": { icon: List, label: "Bulleted list", hint: "Bulleted list", kind: "edit", make: (s) => toggleLinePrefix(s, "bullet"), capability: "richFormat" },
  "home.numberList": { icon: ListOrdered, label: "Numbered list", hint: "Numbered list", kind: "edit", make: (s) => toggleLinePrefix(s, "number"), capability: "richFormat" },
  "home.checklist": { icon: ListChecks, label: "Checklist", hint: "Checklist", kind: "edit", make: (s) => toggleLinePrefix(s, "check"), capability: "richFormat" },
  "home.quote": { icon: Quote, label: "Quote line", hint: "Quote", kind: "edit", make: (s) => toggleLinePrefix(s, "quote"), capability: "richFormat" },
  "home.indent": { icon: IndentIncrease, label: "Indent", hint: "Indent", kind: "edit", make: (s) => shiftIndent(s, 1), capability: "richFormat" },
  "home.outdent": { icon: IndentDecrease, label: "Outdent", hint: "Outdent", kind: "edit", make: (s) => shiftIndent(s, -1), capability: "richFormat" },

  /* Home — Align */
  "home.alignLeft": { icon: AlignLeft, label: "Align left", hint: "Align left", kind: "edit", make: (s) => setBlock(s, { a: "left" }), capability: "richFormat" },
  "home.alignCenter": { icon: AlignCenter, label: "Centre", hint: "Centre", kind: "edit", make: (s) => setBlock(s, { a: "center" }), capability: "richFormat" },
  "home.alignRight": { icon: AlignRight, label: "Align right", hint: "Align right", kind: "edit", make: (s) => setBlock(s, { a: "right" }), capability: "richFormat" },
  "home.alignJustify": { icon: AlignJustify, label: "Justify", hint: "Justify", kind: "edit", make: (s) => setBlock(s, { a: "justify" }), capability: "richFormat" },
  "home.ltr": { icon: Pilcrow, label: "LTR", hint: "Left-to-right text direction", kind: "edit", make: (s) => setBlock(s, { dir: "ltr" }), capability: "richFormat" },
  "home.rtl": { icon: FlipHorizontal2, label: "RTL", hint: "Right-to-left direction, for Arabic", kind: "edit", make: (s) => setBlock(s, { dir: "rtl" }), capability: "richFormat" },

  /* Home — Lines */
  "home.sortAsc": { icon: ArrowDownAZ, label: "Sort A–Z", hint: "Sort the selected lines A to Z (numbers sort by value)", kind: "edit", make: (s) => lineTool(s, "sort-asc"), capability: "richFormat" },
  "home.sortDesc": { icon: ArrowUpAZ, label: "Sort Z–A", hint: "Sort the selected lines Z to A", kind: "edit", make: (s) => lineTool(s, "sort-desc"), capability: "richFormat" },
  "home.reverse": { icon: ArrowLeftRight, label: "Reverse", hint: "Reverse the order of the selected lines", kind: "edit", make: (s) => lineTool(s, "reverse"), capability: "richFormat" },
  "home.unique": { icon: ListX, label: "Unique", hint: "Remove duplicate lines", kind: "edit", make: (s) => lineTool(s, "unique"), capability: "richFormat" },
  "home.noBlanks": { icon: Minus, label: "No blanks", hint: "Remove blank lines", kind: "edit", make: (s) => lineTool(s, "remove-blank"), capability: "richFormat" },
  "home.join": { icon: Merge, label: "Join", hint: "Join the selected lines into one", kind: "edit", make: (s) => lineTool(s, "join"), capability: "richFormat" },
  "home.numberLines": { icon: Hash, label: "Number", hint: "Number the selected lines", kind: "edit", make: (s) => lineTool(s, "number"), capability: "richFormat" },
  "home.trim": { icon: WrapText, label: "Trim", hint: "Trim spaces at the end of each line", kind: "edit", make: (s) => lineTool(s, "trim"), capability: "richFormat" },

  /* Home — Typography */
  "home.resetTypography": {
    icon: Trash2, label: "Reset typography", hint: "Reset the typography of this note to the app default", capability: "design",
    kind: "call", fn: (ctx) => ctx.setTypography({}),
  },

  /* Home — Tasks */
  "home.todo": {
    icon: Circle, label: "TODO", hint: "Mark the line TODO, or clear it if it already is", shortcut: "Ctrl+Alt+1", capability: "richFormat",
    kind: "edit", active: (ctx) => taskStatusAt(ctx.body || "", ctx.selection.start) === "TODO",
    make: (s) => toggleTask(s, "TODO"),
  },
  "home.doing": {
    icon: Timer, label: "DOING", hint: "Mark the line DOING, or clear it if it already is", shortcut: "Ctrl+Alt+2", capability: "richFormat",
    kind: "edit", active: (ctx) => taskStatusAt(ctx.body || "", ctx.selection.start) === "DOING",
    make: (s) => toggleTask(s, "DOING"),
  },
  "home.done": {
    icon: CircleCheck, label: "DONE", hint: "Mark the line DONE, or clear it if it already is", shortcut: "Ctrl+Alt+3", capability: "richFormat",
    kind: "edit", active: (ctx) => taskStatusAt(ctx.body || "", ctx.selection.start) === "DONE",
    make: (s) => toggleTask(s, "DONE"),
  },
  "home.nextStatus": {
    icon: ListRestart, label: "Next status", hint: "Cycle TODO → DOING → DONE → TODO", kind: "edit", capability: "richFormat",
    make: (s, ctx) => {
      const CYCLE = { TODO: "DOING", DOING: "DONE", DONE: "TODO" };
      return toggleTask(s, CYCLE[taskStatusAt((ctx && ctx.body) || "", s.start)] || "TODO");
    },
  },
  "home.clearStatus": {
    icon: CircleDashed, label: "Clear", hint: "Remove the status words from the selected lines (or the whole note)", capability: "richFormat",
    kind: "edit", make: (s) => taskTool(s, "clear"),
  },

  /* Insert */
  "insert.image": { icon: ImagePlus, label: "Image file", hint: "Insert an image from your computer", shortcut: "Ctrl+Alt+I", kind: "call", fn: (ctx) => ctx.pickImage?.(), capability: "images" },
  "insert.imageUrl": {
    icon: Link2, label: "Image URL", hint: "Insert an image from a web address", kind: "menu", width: 300, capability: "images",
    menu: {
      type: "input", placeholder: "https://…/picture.png",
      build: (s, url) => insertText(s, `![${s.value.slice(s.start, s.end) || "image"}](${url})`),
    },
  },
  "insert.noteLink": { icon: Link2, label: "Note link", hint: "Link another note with [[ ]]", kind: "edit", make: wikiLink, capability: "links" },
  "insert.webLink": {
    icon: Link, label: "Web link", hint: "Turn the selection into a web link", kind: "menu", width: 300, capability: "links",
    menu: { type: "input", placeholder: "https://example.com", build: linkWithUrl },
  },
  "insert.email": {
    icon: AtSign, label: "Email", hint: "Insert an email link", kind: "menu", width: 300, capability: "links",
    menu: { type: "input", placeholder: "name@example.com", build: (s, mail) => linkWithUrl(s, `mailto:${mail}`) },
  },
  "insert.tag": {
    icon: Hash, label: "Tag", hint: "Insert a #tag", kind: "menu", width: 300, capability: "links",
    menu: { type: "input", placeholder: "tag-name", build: (s, tag) => insertText(s, `#${tag.replace(/^#/, "")} `) },
  },
  "insert.divider": { icon: Minus, label: "Divider", hint: "Horizontal line", kind: "edit", make: (s) => insertBlock(s, "---"), capability: "insert" },
  "insert.callout": { icon: MessageSquareQuote, label: "Callout", hint: "Highlighted note box", kind: "menu", width: 200, menu: { type: "items", items: CALLOUT_ITEMS }, capability: "insert" },
  "insert.collapsible": {
    icon: ChevronsDownUp, label: "Collapsible", hint: "A section that opens and closes", kind: "edit", capability: "insert",
    make: (s) => insertBlock(s, "<details>\n<summary>Title</summary>\n\nHidden text\n\n</details>", "<details>\n<summary>".length),
  },
  "insert.footnote": {
    icon: Footprints, label: "Footnote", hint: "Add a footnote marker here and its text at the end of the note", kind: "call", capability: "insert",
    fn: (ctx) => {
      const { value, selection, run } = ctx;
      const { ref, definition } = footnoteParts(value);
      const withRef = insertText(selection, ref);
      const next = withRef.next.replace(/\n*$/, "") + `\n\n${definition}`;
      run({ next, start: 0, end: value.length, text: next, caret: next.length });
    },
  },
  "insert.lineBreak": { icon: CornerDownLeft, label: "Line break", hint: "Force a new line inside a paragraph", kind: "edit", make: (s) => insertText(s, "<br>\n"), capability: "insert" },
  "insert.outline": {
    icon: ListTree, label: "Outline", hint: "Insert a list of this note's headings", kind: "edit", capability: "insert",
    enabled: (ctx) => Boolean(outlineOf(ctx.value)), disabledReason: "Add some # headings first",
    make: (s) => insertBlock(s, outlineOf(s.value)),
  },
  "insert.quoteBlock": { icon: TextQuote, label: "Quote", hint: "Block quote", kind: "edit", make: (s) => insertBlock(s, "> ", 2), capability: "insert" },
  "insert.symbols": { icon: Omega, label: "Symbols", hint: "Special characters", kind: "menu", width: 330, menu: { type: "symbols" }, capability: "insert" },
  "insert.codeBlock": {
    icon: SquareCode, label: "Code block", hint: "Insert a fenced code block; wraps the selection when there is one", capability: "codeBlocks",
    shortcut: "Ctrl+Alt+C", kind: "menu", width: 320, menu: { type: "languages" },
  },
  "insert.inlineCode": { icon: Braces, label: "Inline code", hint: "Inline code", shortcut: "Ctrl+E", kind: "edit", make: (s) => toggleWrap(s, "`"), capability: "codeBlocks" },
  "insert.table": { icon: Table, label: "Table", hint: "Insert a table — hover the grid or type a size", shortcut: "Ctrl+Alt+M", kind: "widget", widget: "tablePicker", capability: "tables" },
  "insert.card": { icon: Layers, label: "Make card", hint: "Turn the selected text into a flashcard", shortcut: "Ctrl+Alt+K", kind: "widget", widget: "cardComposer", capability: "insert" },

  "insert.today": { icon: CalendarPlus, label: "Today", hint: "Open or create today's daily note", shortcut: "Ctrl+Alt+D", kind: "navigate", target: "today", capability: "insert" },
  "insert.yesterday": { icon: CalendarClock, label: "Yesterday", hint: "Open yesterday's note", kind: "navigate", target: "yesterday", capability: "insert" },
  "insert.tomorrow": { icon: CalendarCheck, label: "Tomorrow", hint: "Open or create tomorrow's note", kind: "navigate", target: "tomorrow", capability: "insert" },
  "insert.prevDay": {
    icon: ArrowLeft, label: "Previous", hint: "The day, week or month before this note", kind: "navigate", target: "prev", capability: "insert",
    enabled: (ctx) => Boolean(neighbourTitle(ctx.noteTitle, -1)), disabledReason: NEED_DATE_TITLE,
  },
  "insert.nextDay": {
    icon: ArrowRight, label: "Next", hint: "The day, week or month after this note", kind: "navigate", target: "next", capability: "insert",
    enabled: (ctx) => Boolean(neighbourTitle(ctx.noteTitle, 1)), disabledReason: NEED_DATE_TITLE,
  },
  "insert.thisWeek": { icon: CalendarRange, label: "This week", hint: "Open or create this week's note, e.g. 2026-W45", kind: "navigate", target: "thisWeek", capability: "insert" },
  "insert.thisMonth": { icon: CalendarDays, label: "This month", hint: "Open or create this month's note, e.g. 2026-11", kind: "navigate", target: "thisMonth", capability: "insert" },
  "insert.date": { icon: CalendarDays, label: "Today's date", hint: "Insert 2026-11-06 style date", shortcut: "Ctrl+Alt+T", kind: "edit", make: (s) => insertText(s, dateKey()), capability: "editText" },
  "insert.time": { icon: Clock, label: "Time", hint: "Insert the current time", kind: "edit", make: (s) => insertText(s, timeNow()), capability: "editText" },
  "insert.logEntry": { icon: ListOrdered, label: "Log entry", hint: "Start a new time-stamped log line", kind: "edit", make: (s) => insertText(s, `- ${timeNow()} `), capability: "editText" },
  "insert.dateFormats": {
    icon: CalendarDays, label: "Formats", hint: "Every date and time format", kind: "menu", width: 280, capability: "editText",
    menu: {
      type: "items",
      items: DATE_FORMATS.map((f) => ({ label: f.label, sub: () => f.make(new Date()), make: (s) => insertText(s, f.make(new Date())) })),
    },
  },
  "insert.linkDay": {
    icon: Link2, label: "Link day", hint: "Insert a [[link]] to a day note", kind: "menu", width: 200, capability: "links",
    menu: {
      type: "items",
      items: [["Today", 0], ["Yesterday", -1], ["Tomorrow", 1], ["In a week", 7], ["A week ago", -7]].map(([label, n]) => ({
        label, sub: () => shiftDay(dateKey(), n), make: (s) => insertText(s, `[[${shiftDay(dateKey(), n)}]]`),
      })),
    },
  },
  "insert.templates": {
    icon: BookOpen, label: "Templates", hint: "Ready-made journal blocks", kind: "menu", width: 240, capability: "insert",
    menu: {
      type: "items",
      items: JOURNAL_TEMPLATES.map((item) => ({ label: item.label, make: (s) => insertBlock(s, item.text.replace(/\n$/, "")) })),
    },
  },

  /* Insert — Figures & Media */
  "insert.figure": {
    icon: FileImage, label: "Figure", hint: "Insert an image with a caption", kind: "call", capability: "images",
    fn: (ctx) => ctx.insertFigure?.(),
  },
  "insert.gif": {
    icon: Film, label: "GIF", hint: "Insert an animated GIF, WebP or APNG", kind: "call", capability: "images",
    fn: (ctx) => ctx.pickGif?.(),
  },
  "insert.file": {
    icon: Paperclip, label: "Attach file", hint: "Attach any file (PDF, Word, zip, etc.)", kind: "call", capability: "insert",
    fn: (ctx) => ctx.pickFile?.(),
  },
  "insert.audio": {
    icon: Mic2, label: "Record audio", hint: "Record audio from microphone", kind: "call", capability: "insert",
    fn: (ctx) => ctx.toggleAudioRecord?.(),
  },

  /* Insert — Bookmarks */
  "insert.bookmark": {
    icon: Bookmark, label: "Bookmark", hint: "Insert a named anchor at the cursor", kind: "call", capability: "insert",
    fn: async (ctx) => {
      const name = await ctx.prompt?.("Bookmark name:");
      if (name) ctx.run(insertBookmark(ctx.selection, name));
    },
  },
  "insert.bookmarks": {
    icon: Bookmark, label: "Bookmarks", hint: "Jump to a bookmark in this note", kind: "menu", width: 240, capability: "insert",
    menu: { type: "bookmarks" },
  },

  /* Insert — Chart */
  "insert.chart": {
    icon: BarChart, label: "Chart", hint: "Create a chart from a table", kind: "call", capability: "images",
    enabled: (ctx) => Boolean(tableAt(ctx.value, ctx.selection.start)), disabledReason: NEED_TABLE,
    fn: async (ctx) => {
      const tableCount = (ctx.value.match(/\|.*\|/g) || []).length;
      if (!tableCount) return;
      const type = await ctx.prompt?.("Chart type (bar, line, pie):", "bar");
      if (!type || !['bar', 'line', 'pie'].includes(type)) return;
      const tableIndex = await ctx.prompt?.(`Table index (0 to ${tableCount - 1}):`, '0');
      if (tableIndex === null) return;
      const idx = parseInt(tableIndex, 10);
      if (isNaN(idx) || idx < 0 || idx >= tableCount) return;
      const title = await ctx.prompt?.("Chart title (optional):", '');
      ctx.run(insertChart(ctx.selection, { type, table: idx, title: title || undefined }));
    },
  },

  /* Insert — Shapes (ink layer) */
  "insert.shape.rect": { icon: Square, label: "Rectangle", hint: "Insert a rectangle", kind: "call", fn: (ctx) => ctx.ink?.addObject?.("shape", 100, 100, { shapeType: "rect" }), capability: "shapes" },
  "insert.shape.rounded": { icon: SquareDashed, label: "Rounded rect", hint: "Insert a rounded rectangle", kind: "call", fn: (ctx) => ctx.ink?.addObject?.("shape", 100, 100, { shapeType: "rounded-rect" }), capability: "shapes" },
  "insert.shape.ellipse": { icon: Circle, label: "Ellipse", hint: "Insert an ellipse", kind: "call", fn: (ctx) => ctx.ink?.addObject?.("shape", 100, 100, { shapeType: "ellipse" }), capability: "shapes" },
  "insert.shape.line": { icon: Minus, label: "Line", hint: "Insert a line", kind: "call", fn: (ctx) => ctx.ink?.addObject?.("shape", 100, 100, { shapeType: "line" }), capability: "shapes" },
  "insert.shape.arrow": { icon: ArrowRight, label: "Arrow", hint: "Insert an arrow", kind: "call", fn: (ctx) => ctx.ink?.addObject?.("shape", 100, 100, { shapeType: "arrow" }), capability: "shapes" },
  "insert.shape.triangle": { icon: Triangle, label: "Triangle", hint: "Insert a triangle", kind: "call", fn: (ctx) => ctx.ink?.addObject?.("shape", 100, 100, { shapeType: "triangle" }), capability: "shapes" },
  "insert.shape.star": { icon: Star, label: "Star", hint: "Insert a star", kind: "call", fn: (ctx) => ctx.ink?.addObject?.("shape", 100, 100, { shapeType: "star" }), capability: "shapes" },

  /* Insert — Stickers */
  "insert.sticker": {
    icon: Smile, label: "Stickers", hint: "Insert a built-in sticker", kind: "menu", width: 320, capability: "shapes",
    menu: { type: "stickers" },
  },

  /* Insert — Text notes (ink layer) */
  "insert.textbox": { icon: SquarePen, label: "Text box", hint: "Insert a text box", kind: "call", fn: (ctx) => ctx.ink?.addObject?.("textbox", 100, 100), capability: "ink" },
  "insert.sticky": { icon: StickyNote, label: "Sticky note", hint: "Insert a sticky note", kind: "call", fn: (ctx) => ctx.ink?.addObject?.("sticky", 100, 100), capability: "ink" },

  /* Design */
  "design.resetTypography": {
    icon: Trash2, label: "Reset typography", hint: "Reset the typography of this note to the app default", capability: "design",
    kind: "call", fn: (ctx) => ctx.setTypography({}),
  },

  /* View */
  "view.spellCheck": {
    icon: SpellCheck, label: "Spell check", hint: "Underline misspelled words in the writing box", kind: "call", capability: "editText",
    active: (ctx) => (ctx.typography || {}).spell !== false,
    fn: (ctx) => {
      const t = ctx.typography || {};
      if (t.spell === false) {
        const next = { ...t };
        delete next.spell;
        ctx.setTypography(next);
      } else {
        ctx.setTypography({ ...t, spell: false });
      }
    },
  },

  "view.mode.read": {
    icon: Eye, label: "Read Mode", hint: "Rendered markdown with styling", kind: "call", capability: "design",
    active: (ctx) => (ctx.typography || {}).viewMode === "read" || !(ctx.typography || {}).viewMode,
    fn: (ctx) => ctx.setTypography({ ...(ctx.typography || {}), viewMode: "read" }),
  },
  "view.mode.draft": {
    icon: PenLine, label: "Draft", hint: "Plain writing box, no styling", kind: "call", capability: "design",
    active: (ctx) => (ctx.typography || {}).viewMode === "draft",
    fn: (ctx) => ctx.setTypography({ ...(ctx.typography || {}), viewMode: "draft" }),
  },
  "view.mode.print": {
    icon: FileText, label: "Print Layout", hint: "Pages with shadows, numbers, margins", kind: "call", capability: "design",
    active: (ctx) => (ctx.typography || {}).viewMode === "print",
    fn: (ctx) => ctx.setTypography({ ...(ctx.typography || {}), viewMode: "print" }),
  },
  "view.mode.outline": {
    icon: List, label: "Outline", hint: "Collapsible heading tree", kind: "call", capability: "design",
    active: (ctx) => (ctx.typography || {}).viewMode === "outline",
    fn: (ctx) => ctx.setTypography({ ...(ctx.typography || {}), viewMode: "outline" }),
  },
  "view.mode.immersive": {
    icon: BookOpen, label: "Immersive Reader", hint: "Distraction-free, large text, read-aloud", kind: "call", capability: "design",
    active: (ctx) => (ctx.typography || {}).viewMode === "immersive",
    fn: (ctx) => ctx.setTypography({ ...(ctx.typography || {}), viewMode: "immersive" }),
  },

  "view.navPane": {
    icon: Sidebar, label: "Navigation pane", hint: "Show side panel with headings and find", kind: "call", capability: "design",
    active: (ctx) => Boolean((ctx.typography || {}).showNavPane),
    fn: (ctx) => ctx.setTypography({ ...(ctx.typography || {}), showNavPane: !(ctx.typography || {}).showNavPane }),
  },
  "view.find": {
    icon: Search, label: "Find", hint: "Find in this note (Ctrl+F)", kind: "call", capability: "design",
    fn: (ctx) => ctx.setTypography({ ...(ctx.typography || {}), showNavPane: true, navPaneTab: "find" }),
  },

  "view.zoomOut": {
    icon: ZoomOut, label: "Zoom out", hint: "Decrease zoom (Ctrl+-)", kind: "call", capability: "design",
    fn: (ctx) => {
      const current = typeof (ctx.typography || {}).zoom === "number" ? (ctx.typography || {}).zoom : 100;
      ctx.setTypography({ ...(ctx.typography || {}), zoom: Math.max(50, current - 10) });
    },
  },
  "view.zoomIn": {
    icon: ZoomIn, label: "Zoom in", hint: "Increase zoom (Ctrl++)", kind: "call", capability: "design",
    fn: (ctx) => {
      const current = typeof (ctx.typography || {}).zoom === "number" ? (ctx.typography || {}).zoom : 100;
      ctx.setTypography({ ...(ctx.typography || {}), zoom: Math.min(300, current + 10) });
    },
  },

  "view.ruler": {
    icon: Ruler, label: "Ruler", hint: "Show horizontal ruler with page width and margins", kind: "call", capability: "layout",
    active: (ctx) => Boolean((ctx.typography || {}).showRuler),
    fn: (ctx) => ctx.setTypography({ ...(ctx.typography || {}), showRuler: !(ctx.typography || {}).showRuler }),
  },
  "view.gridlines": {
    icon: Grid, label: "Gridlines", hint: "Show overlay grid on the page", kind: "call", capability: "layout",
    active: (ctx) => Boolean((ctx.typography || {}).showGridlines),
    fn: (ctx) => ctx.setTypography({ ...(ctx.typography || {}), showGridlines: !(ctx.typography || {}).showGridlines }),
  },
  "view.scrollVertical": {
    icon: MoveVertical, label: "Vertical", hint: "Vertical scrolling (default)", kind: "call", capability: "layout",
    active: (ctx) => !(ctx.typography || {}).scrollMode || (ctx.typography || {}).scrollMode === "vertical",
    fn: (ctx) => ctx.setTypography({ ...(ctx.typography || {}), scrollMode: "vertical" }),
  },
  "view.scrollHorizontal": {
    icon: MoveHorizontal, label: "Side to Side", hint: "Horizontal page flow (Print Layout only)", kind: "call", capability: "layout",
    active: (ctx) => (ctx.typography || {}).scrollMode === "horizontal",
    enabled: (ctx) => (ctx.typography || {}).viewMode === "print",
    fn: (ctx) => ctx.setTypography({ ...(ctx.typography || {}), scrollMode: "horizontal" }),
  },

  "view.attachFile": {
    icon: Paperclip, label: "Attach file", hint: "Attach any file (PDF, Word, zip, etc.)", kind: "call", capability: "insert",
    fn: (ctx) => {
      const input = document.createElement("input");
      input.type = "file";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const { addAttachment } = await import("./attachments");
        const attachment = await addAttachment(file);
        const snippet = `\n[${file.name}](${attachment.ref})\n\n`;
        ctx.run({ next: snippet, start: ctx.selection.start, end: ctx.selection.end, text: snippet, caret: ctx.selection.start + snippet.length });
      };
      input.click();
    },
  },
  "view.attachImage": {
    icon: Image, label: "Insert image", hint: "Insert an image from your computer", kind: "call", capability: "images",
    fn: (ctx) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const { addAttachment } = await import("./attachments");
        const attachment = await addAttachment(file);
        const snippet = `\n![${file.name.replace(/\.[^.]+$/, "")}](${attachment.ref})\n\n`;
        ctx.run({ next: snippet, start: ctx.selection.start, end: ctx.selection.end, text: snippet, caret: ctx.selection.start + snippet.length });
      };
      input.click();
    },
  },
  "view.insertTable": {
    icon: Table, label: "Insert table", hint: "Insert a markdown table", kind: "call", capability: "tables",
    fn: async (ctx) => {
      const { tableInsert } = await import("./ribbon-actions");
      const table = tableInsert(ctx.selection, 3, 3);
      if (table) ctx.run(table);
    },
  },

  "view.a11yCheck": {
    icon: Shield, label: "Check accessibility", hint: "Check for missing alt text, skipped headings, weak links, and low contrast", kind: "call", capability: "design",
    fn: async (ctx) => {
      const { runAccessibilityChecks } = await import("./accessibility");
      const issues = runAccessibilityChecks(ctx.body || "");
      // The tab handles opening the dialog; Quick Access could show a toast with count
      if (issues.length === 0) {
        console.log("No accessibility issues found");
      } else {
        console.log(`${issues.length} accessibility issues found`);
      }
    },
  },

  /* Layout */
  "layout.firstLineIndent": {
    icon: ArrowLeftRight, label: "First-line indent", hint: "Indent the first line of every paragraph in the reader", capability: "layout",
    kind: "call", active: (ctx) => Boolean((ctx.typography || {}).indent), fn: toggleTypo("indent"),
  },
  "layout.dropCap": {
    icon: Space, label: "Drop cap", hint: "Large first letter on the first paragraph in the reader", capability: "layout",
    kind: "call", active: (ctx) => Boolean((ctx.typography || {}).dropCap), fn: toggleTypo("dropCap"),
  },

  /* Share */
  "share.copyMarkdown": { icon: Table2, label: "As Markdown", hint: "Copy the whole note text", kind: "call", fn: async (ctx) => copyText(ctx.body), capability: "exportPdf" },
  "share.copyPlainText": {
    icon: Type, label: "As plain text", hint: "Copy the note without markdown symbols", kind: "call", capability: "exportPdf",
    fn: async (ctx) =>
      copyText(
        ctx.body
          .replace(/<\/?[a-z][^>]*>/gi, "")
          .replace(/^#{1,6}\s+/gm, "")
          .replace(/(\*\*|__|~~|`)/g, "")
          .replace(/\[\[([^\]]+)\]\]/g, "$1")
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      ),
  },

  /* Table tab */
  "table.fromCsv": {
    icon: FileSpreadsheet, label: "From CSV file", hint: "Insert a .csv or .tsv file as a table", kind: "call", capability: "tables",
    enabled: (ctx) => ctx.markdown, disabledReason: (ctx) => ctx.offReason,
    fn: (ctx) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".csv,.tsv,.txt,text/csv,text/tab-separated-values";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const text = await file.text();
        const md = delimitedToMarkdown(text);
        if (md) ctx.run(insertBlock(ctx.selection, md));
      };
      input.click();
    },
  },
  "table.addRowAbove": { icon: ArrowUpToLine, label: "Row above", hint: "Add a row above this one", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableOp(ctx.selection, "row-above")), capability: "tables" },
  "table.addRowBelow": { icon: ArrowDownToLine, label: "Row below", hint: "Add a row below this one", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableOp(ctx.selection, "row-below")), capability: "tables" },
  "table.addColumnLeft": { icon: ArrowLeftToLine, label: "Column left", hint: "Add a column to the left", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableOp(ctx.selection, "column-left")), capability: "tables" },
  "table.addColumnRight": { icon: ArrowRightToLine, label: "Column right", hint: "Add a column to the right", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableOp(ctx.selection, "column-right")), capability: "tables" },
  "table.deleteRow": { icon: Trash2, label: "Delete row", hint: "Remove the row the cursor is on", shortcut: "Alt+Shift+Backspace", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableOp(ctx.selection, "delete-row")), capability: "tables" },
  "table.deleteColumn": { icon: Trash2, label: "Delete column", hint: "Remove the column the cursor is in", shortcut: "Alt+Shift+Delete", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableOp(ctx.selection, "delete-column")), capability: "tables" },
  "table.deleteTable": { icon: Trash2, label: "Delete table", hint: "Remove the whole table", shortcut: "Ctrl+Alt+Shift+X", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableOp(ctx.selection, "delete-table")), capability: "tables" },
  "table.alignLeft": { icon: AlignLeft, label: "Left", hint: "Align this column left", shortcut: "Ctrl+Alt+L", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableOp(ctx.selection, "align-left")), capability: "tables" },
  "table.alignCentre": { icon: AlignCenter, label: "Centre", hint: "Centre this column", shortcut: "Ctrl+Alt+E", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableOp(ctx.selection, "align-centre")), capability: "tables" },
  "table.alignRight": { icon: AlignRight, label: "Right", hint: "Align this column right", shortcut: "Ctrl+Alt+R", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableOp(ctx.selection, "align-right")), capability: "tables" },

  "table.sortAsc": { icon: ArrowDownAZ, label: "Sort A–Z", hint: "Sort the rows by the column under the cursor (numbers by value)", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "sort-asc")), capability: "tables" },
  "table.sortDesc": { icon: ArrowUpAZ, label: "Sort Z–A", hint: "Sort the rows in reverse", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "sort-desc")), capability: "tables" },
  "table.moveRowUp": { icon: ArrowUp, label: "Row up", hint: "Move this row up", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "row-up")), capability: "tables" },
  "table.moveRowDown": { icon: ArrowDown, label: "Row down", hint: "Move this row down", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "row-down")), capability: "tables" },
  "table.moveColLeft": { icon: ArrowLeft, label: "Col left", hint: "Move this column left", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "column-left")), capability: "tables" },
  "table.moveColRight": { icon: ArrowRight, label: "Col right", hint: "Move this column right", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "column-right")), capability: "tables" },
  "table.duplicateRow": { icon: CopyPlus, label: "Duplicate row", hint: "Copy this row below itself", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "duplicate-row")), capability: "tables" },
  "table.transpose": { icon: ArrowLeftRight, label: "Transpose", hint: "Swap rows and columns", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "transpose")), capability: "tables" },

  "table.sumRow": { icon: Sigma, label: "Sum row", hint: "Add a Total row summing the numeric columns", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "totals-sum")), capability: "tables" },
  "table.averageRow": { icon: Sigma, label: "Average row", hint: "Add an Average row", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "totals-average")), capability: "tables" },
  "table.clearCells": { icon: Eraser, label: "Clear cells", hint: "Empty every data cell, keep the header", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "clear-cells")), capability: "tables" },
  "table.tidy": { icon: Wand2, label: "Tidy up", hint: "Align the | marks so the table is easy to read as text", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "prettify")), capability: "tables" },

  "table.textToTable": {
    icon: TableProperties, label: "Text → table", hint: "Turn the selected CSV / TSV lines into a table", capability: "tables",
    kind: "menu", width: 200, menu: TEXT_TO_TABLE_MENU,
  },
  "table.copyCsv": {
    icon: Download, label: "Copy as CSV", hint: "Copy this table as CSV text", kind: "call", capability: "tables",
    enabled: inTable, disabledReason: NEED_TABLE, fn: async (ctx) => copyText(tableToCsv(ctx.selection) || ""),
  },

  /* Code tab */
  "code.language": {
    icon: Replace, label: "Language", hint: "Change the language of the block under the cursor", capability: "codeBlocks",
    kind: "menu", width: 300, menu: { type: "setLanguage" },
    enabled: inCodeBlock, disabledReason: NEED_BLOCK,
  },
  "code.snippet": {
    icon: SquareTerminal, label: "Snippet", hint: "Insert a small example block", kind: "menu", width: 220, capability: "codeBlocks",
    menu: {
      type: "items",
      items: LANGUAGES.filter((item) => item.template).map((item) => ({
        label: item.label, make: (s) => insertBlock(s, `\`\`\`${item.id}\n${item.template}\`\`\``),
      })),
    },
  },
  "code.unwrap": { icon: PackageOpen, label: "Unwrap", hint: "Remove the fences and keep the code", kind: "edit", enabled: inCodeBlock, disabledReason: NEED_BLOCK, make: unwrapFence, capability: "codeBlocks" },
  "code.copy": {
    icon: ClipboardCopy, label: "Copy code", hint: "Copy the code of this block", kind: "call", capability: "codeBlocks",
    enabled: inCodeBlock, disabledReason: NEED_BLOCK,
    fn: async (ctx) => {
      const block = fenceAt(ctx.value, ctx.selection.start);
      await copyText(ctx.value.slice(block.bodyStart, block.bodyEnd).replace(/\n$/, ""));
    },
  },
  "code.comment": {
    icon: MessageSquareOff, label: "Comment", hint: "Comment or uncomment the selected lines", shortcut: "Ctrl+/", kind: "edit", capability: "codeBlocks",
    make: (s, ctx) => toggleComment(s, (fenceAt((ctx && ctx.value) || "", s.start) || {}).lang || "plain"),
  },
  "code.indent": { icon: IndentIncrease, label: "Indent lines", hint: "Indent lines", kind: "edit", make: (s) => shiftIndent(s, 1), capability: "codeBlocks" },
  "code.outdent": { icon: IndentDecrease, label: "Outdent lines", hint: "Outdent lines", kind: "edit", make: (s) => shiftIndent(s, -1), capability: "codeBlocks" },
  "code.duplicate": { icon: CopyPlus, label: "Duplicate", hint: "Duplicate the current line", kind: "edit", make: (s) => lineMove(s, "duplicate"), capability: "codeBlocks" },
  "code.moveUp": { icon: ArrowUp, label: "Move line up", hint: "Move line up", kind: "edit", make: (s) => lineMove(s, "up"), capability: "codeBlocks" },
  "code.moveDown": { icon: ArrowDown, label: "Move line down", hint: "Move line down", kind: "edit", make: (s) => lineMove(s, "down"), capability: "codeBlocks" },
  "code.deleteLine": { icon: Trash2, label: "Delete line", hint: "Delete the current line", kind: "edit", make: (s) => lineMove(s, "delete"), capability: "codeBlocks" },
  "code.prettyJson": { icon: FileJson, label: "Pretty", hint: "Format the JSON in the selection or in the block under the cursor", kind: "edit", make: (s) => formatJsonSelection(s, "pretty"), capability: "codeBlocks" },
  "code.minifyJson": { icon: Shrink, label: "Minify", hint: "Squeeze the JSON onto one line", kind: "edit", make: (s) => formatJsonSelection(s, "minify"), capability: "codeBlocks" },
};

/* Quick code languages ("JS", "Py"…) — no icon, a short text label. */
for (const [id, label] of QUICK_LANGUAGES) {
  ACTIONS[`insert.fence.${id}`] = {
    label,
    hint: `Insert a ${fenceLabel(id)} code block`,
    kind: "call",
    fn: (ctx) => runCodeFence(ctx, id),
    capability: "codeBlocks",
  };
}

export const RIBBON_ACTIONS = ACTIONS;

export const getRibbonAction = (id) => ACTIONS[id];

/** Default pins: Bold, Italic, Underline, Undo, Redo, Highlight. */
export const DEFAULT_PINS = [
  "home.bold", "home.italic", "home.underline", "home.undo", "home.redo", "home.highlight",
];
