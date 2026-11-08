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
  CircleDashed, ClipboardCopy, Clock, Code, Copy, CopyPlus, CornerDownLeft, Download, Eraser, FileJson, FileSpreadsheet,
  FlipHorizontal2, Footprints, Hash, Highlighter, ImagePlus, IndentDecrease, IndentIncrease, Italic, Layers, Link, Link2,
  List, ListChecks, ListOrdered, ListRestart, ListTree, ListX, Merge, MessageSquareOff, MessageSquareQuote, Minus, Omega,
  PackageOpen, Pilcrow, Quote, Redo2, Replace, Scissors, Shrink, Sigma, Space, SpellCheck, SquareCode,
  SquareDashedMousePointer, SquareTerminal, Strikethrough, Table, Table2, TableProperties, TextQuote, Timer, Trash2,
  Type, Underline, Undo2, Wand2, WrapText,
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
  "home.undo": { icon: Undo2, label: "Undo", hint: "Undo the last edit", kind: "call", fn: () => execEditor("undo") },
  "home.redo": { icon: Redo2, label: "Redo", hint: "Redo", kind: "call", fn: () => execEditor("redo") },
  "home.cut": {
    icon: Scissors, label: "Cut", hint: "Cut the selection", kind: "call",
    enabled: selectedSome, disabledReason: NEED_TEXT,
    fn: async (ctx) => {
      const text = selected(ctx);
      if (!text) return;
      await copyText(text);
      ctx.run({ next: "", start: ctx.selection.start, end: ctx.selection.end, text: "", caret: ctx.selection.start });
    },
  },
  "home.copy": {
    icon: Copy, label: "Copy", hint: "Copy the selection", kind: "call",
    enabled: selectedSome, disabledReason: NEED_TEXT,
    fn: async (ctx) => copyText(selected(ctx)),
  },
  "home.selectAll": { icon: SquareDashedMousePointer, label: "Select all", hint: "Select the whole note", kind: "call", fn: () => execEditor("selectAll") },

  /* Home — Font */
  "home.bold": { icon: Bold, label: "Bold", hint: "Bold", shortcut: "Ctrl+B", kind: "edit", make: (s) => toggleWrap(s, "**") },
  "home.italic": { icon: Italic, label: "Italic", hint: "Italic", shortcut: "Ctrl+I", kind: "edit", make: toggleItalic },
  "home.underline": { icon: Underline, label: "Underline", hint: "Underline", shortcut: "Ctrl+U", kind: "edit", make: (s) => toggleWrap(s, "<u>", "</u>") },
  "home.strike": { icon: Strikethrough, label: "Strikethrough", hint: "Strikethrough", shortcut: "Ctrl+Shift+X", kind: "edit", make: (s) => toggleWrap(s, "~~") },
  "home.highlight": { icon: Highlighter, label: "Highlight", hint: "Highlight (yellow)", shortcut: "Ctrl+Shift+H", kind: "edit", make: (s) => applyAttr(s, "mark", "h", "yellow") },
  "home.inlineCode": { icon: Code, label: "Inline code", hint: "Inline code", shortcut: "Ctrl+E", kind: "edit", make: (s) => toggleWrap(s, "`") },
  "home.clearFormatting": { icon: Eraser, label: "Clear formatting", hint: "Clear formatting on the selection or the line", kind: "edit", make: clearFormatting },

  /* Home — Lists */
  "home.bulletList": { icon: List, label: "Bulleted list", hint: "Bulleted list", kind: "edit", make: (s) => toggleLinePrefix(s, "bullet") },
  "home.numberList": { icon: ListOrdered, label: "Numbered list", hint: "Numbered list", kind: "edit", make: (s) => toggleLinePrefix(s, "number") },
  "home.checklist": { icon: ListChecks, label: "Checklist", hint: "Checklist", kind: "edit", make: (s) => toggleLinePrefix(s, "check") },
  "home.quote": { icon: Quote, label: "Quote line", hint: "Quote", kind: "edit", make: (s) => toggleLinePrefix(s, "quote") },
  "home.indent": { icon: IndentIncrease, label: "Indent", hint: "Indent", kind: "edit", make: (s) => shiftIndent(s, 1) },
  "home.outdent": { icon: IndentDecrease, label: "Outdent", hint: "Outdent", kind: "edit", make: (s) => shiftIndent(s, -1) },

  /* Home — Align */
  "home.alignLeft": { icon: AlignLeft, label: "Align left", hint: "Align left", kind: "edit", make: (s) => setBlock(s, { a: "left" }) },
  "home.alignCenter": { icon: AlignCenter, label: "Centre", hint: "Centre", kind: "edit", make: (s) => setBlock(s, { a: "center" }) },
  "home.alignRight": { icon: AlignRight, label: "Align right", hint: "Align right", kind: "edit", make: (s) => setBlock(s, { a: "right" }) },
  "home.alignJustify": { icon: AlignJustify, label: "Justify", hint: "Justify", kind: "edit", make: (s) => setBlock(s, { a: "justify" }) },
  "home.ltr": { icon: Pilcrow, label: "LTR", hint: "Left-to-right text direction", kind: "edit", make: (s) => setBlock(s, { dir: "ltr" }) },
  "home.rtl": { icon: FlipHorizontal2, label: "RTL", hint: "Right-to-left direction, for Arabic", kind: "edit", make: (s) => setBlock(s, { dir: "rtl" }) },

  /* Home — Lines */
  "home.sortAsc": { icon: ArrowDownAZ, label: "Sort A–Z", hint: "Sort the selected lines A to Z (numbers sort by value)", kind: "edit", make: (s) => lineTool(s, "sort-asc") },
  "home.sortDesc": { icon: ArrowUpAZ, label: "Sort Z–A", hint: "Sort the selected lines Z to A", kind: "edit", make: (s) => lineTool(s, "sort-desc") },
  "home.reverse": { icon: ArrowLeftRight, label: "Reverse", hint: "Reverse the order of the selected lines", kind: "edit", make: (s) => lineTool(s, "reverse") },
  "home.unique": { icon: ListX, label: "Unique", hint: "Remove duplicate lines", kind: "edit", make: (s) => lineTool(s, "unique") },
  "home.noBlanks": { icon: Minus, label: "No blanks", hint: "Remove blank lines", kind: "edit", make: (s) => lineTool(s, "remove-blank") },
  "home.join": { icon: Merge, label: "Join", hint: "Join the selected lines into one", kind: "edit", make: (s) => lineTool(s, "join") },
  "home.numberLines": { icon: Hash, label: "Number", hint: "Number the selected lines", kind: "edit", make: (s) => lineTool(s, "number") },
  "home.trim": { icon: WrapText, label: "Trim", hint: "Trim spaces at the end of each line", kind: "edit", make: (s) => lineTool(s, "trim") },

  /* Home — Typography */
  "home.resetTypography": {
    icon: Trash2, label: "Reset typography", hint: "Reset the typography of this note to the app default",
    kind: "call", fn: (ctx) => ctx.setTypography({}),
  },

  /* Home — Tasks */
  "home.todo": {
    icon: Circle, label: "TODO", hint: "Mark the line TODO, or clear it if it already is", shortcut: "Ctrl+Alt+1",
    kind: "edit", active: (ctx) => taskStatusAt(ctx.body || "", ctx.selection.start) === "TODO",
    make: (s) => toggleTask(s, "TODO"),
  },
  "home.doing": {
    icon: Timer, label: "DOING", hint: "Mark the line DOING, or clear it if it already is", shortcut: "Ctrl+Alt+2",
    kind: "edit", active: (ctx) => taskStatusAt(ctx.body || "", ctx.selection.start) === "DOING",
    make: (s) => toggleTask(s, "DOING"),
  },
  "home.done": {
    icon: CircleCheck, label: "DONE", hint: "Mark the line DONE, or clear it if it already is", shortcut: "Ctrl+Alt+3",
    kind: "edit", active: (ctx) => taskStatusAt(ctx.body || "", ctx.selection.start) === "DONE",
    make: (s) => toggleTask(s, "DONE"),
  },
  "home.nextStatus": {
    icon: ListRestart, label: "Next status", hint: "Cycle TODO → DOING → DONE → TODO", kind: "edit",
    make: (s, ctx) => {
      const CYCLE = { TODO: "DOING", DOING: "DONE", DONE: "TODO" };
      return toggleTask(s, CYCLE[taskStatusAt((ctx && ctx.body) || "", s.start)] || "TODO");
    },
  },
  "home.clearStatus": {
    icon: CircleDashed, label: "Clear", hint: "Remove the status words from the selected lines (or the whole note)",
    kind: "edit", make: (s) => taskTool(s, "clear"),
  },

  /* Insert */
  "insert.image": { icon: ImagePlus, label: "Image file", hint: "Insert an image from your computer", shortcut: "Ctrl+Alt+I", kind: "call", fn: (ctx) => ctx.pickImage?.() },
  "insert.imageUrl": {
    icon: Link2, label: "Image URL", hint: "Insert an image from a web address", kind: "menu", width: 300,
    menu: {
      type: "input", placeholder: "https://…/picture.png",
      build: (s, url) => insertText(s, `![${s.value.slice(s.start, s.end) || "image"}](${url})`),
    },
  },
  "insert.noteLink": { icon: Link2, label: "Note link", hint: "Link another note with [[ ]]", kind: "edit", make: wikiLink },
  "insert.webLink": {
    icon: Link, label: "Web link", hint: "Turn the selection into a web link", kind: "menu", width: 300,
    menu: { type: "input", placeholder: "https://example.com", build: linkWithUrl },
  },
  "insert.email": {
    icon: AtSign, label: "Email", hint: "Insert an email link", kind: "menu", width: 300,
    menu: { type: "input", placeholder: "name@example.com", build: (s, mail) => linkWithUrl(s, `mailto:${mail}`) },
  },
  "insert.tag": {
    icon: Hash, label: "Tag", hint: "Insert a #tag", kind: "menu", width: 300,
    menu: { type: "input", placeholder: "tag-name", build: (s, tag) => insertText(s, `#${tag.replace(/^#/, "")} `) },
  },
  "insert.divider": { icon: Minus, label: "Divider", hint: "Horizontal line", kind: "edit", make: (s) => insertBlock(s, "---") },
  "insert.callout": { icon: MessageSquareQuote, label: "Callout", hint: "Highlighted note box", kind: "menu", width: 200, menu: { type: "items", items: CALLOUT_ITEMS } },
  "insert.collapsible": {
    icon: ChevronsDownUp, label: "Collapsible", hint: "A section that opens and closes", kind: "edit",
    make: (s) => insertBlock(s, "<details>\n<summary>Title</summary>\n\nHidden text\n\n</details>", "<details>\n<summary>".length),
  },
  "insert.footnote": {
    icon: Footprints, label: "Footnote", hint: "Add a footnote marker here and its text at the end of the note", kind: "call",
    fn: (ctx) => {
      const { value, selection, run } = ctx;
      const { ref, definition } = footnoteParts(value);
      const withRef = insertText(selection, ref);
      const next = withRef.next.replace(/\n*$/, "") + `\n\n${definition}`;
      run({ next, start: 0, end: value.length, text: next, caret: next.length });
    },
  },
  "insert.lineBreak": { icon: CornerDownLeft, label: "Line break", hint: "Force a new line inside a paragraph", kind: "edit", make: (s) => insertText(s, "<br>\n") },
  "insert.outline": {
    icon: ListTree, label: "Outline", hint: "Insert a list of this note's headings", kind: "edit",
    enabled: (ctx) => Boolean(outlineOf(ctx.value)), disabledReason: "Add some # headings first",
    make: (s) => insertBlock(s, outlineOf(s.value)),
  },
  "insert.quoteBlock": { icon: TextQuote, label: "Quote", hint: "Block quote", kind: "edit", make: (s) => insertBlock(s, "> ", 2) },
  "insert.symbols": { icon: Omega, label: "Symbols", hint: "Special characters", kind: "menu", width: 330, menu: { type: "symbols" } },
  "insert.codeBlock": {
    icon: SquareCode, label: "Code block", hint: "Insert a fenced code block; wraps the selection when there is one",
    shortcut: "Ctrl+Alt+C", kind: "menu", width: 320, menu: { type: "languages" },
  },
  "insert.inlineCode": { icon: Braces, label: "Inline code", hint: "Inline code", shortcut: "Ctrl+E", kind: "edit", make: (s) => toggleWrap(s, "`") },
  "insert.table": { icon: Table, label: "Table", hint: "Insert a table — hover the grid or type a size", shortcut: "Ctrl+Alt+M", kind: "widget", widget: "tablePicker" },
  "insert.card": { icon: Layers, label: "Make card", hint: "Turn the selected text into a flashcard", shortcut: "Ctrl+Alt+K", kind: "widget", widget: "cardComposer" },

  "insert.today": { icon: CalendarPlus, label: "Today", hint: "Open or create today's daily note", shortcut: "Ctrl+Alt+D", kind: "navigate", target: "today" },
  "insert.yesterday": { icon: CalendarClock, label: "Yesterday", hint: "Open yesterday's note", kind: "navigate", target: "yesterday" },
  "insert.tomorrow": { icon: CalendarCheck, label: "Tomorrow", hint: "Open or create tomorrow's note", kind: "navigate", target: "tomorrow" },
  "insert.prevDay": {
    icon: ArrowLeft, label: "Previous", hint: "The day, week or month before this note", kind: "navigate", target: "prev",
    enabled: (ctx) => Boolean(neighbourTitle(ctx.noteTitle, -1)), disabledReason: NEED_DATE_TITLE,
  },
  "insert.nextDay": {
    icon: ArrowRight, label: "Next", hint: "The day, week or month after this note", kind: "navigate", target: "next",
    enabled: (ctx) => Boolean(neighbourTitle(ctx.noteTitle, 1)), disabledReason: NEED_DATE_TITLE,
  },
  "insert.thisWeek": { icon: CalendarRange, label: "This week", hint: "Open or create this week's note, e.g. 2026-W45", kind: "navigate", target: "thisWeek" },
  "insert.thisMonth": { icon: CalendarDays, label: "This month", hint: "Open or create this month's note, e.g. 2026-11", kind: "navigate", target: "thisMonth" },
  "insert.date": { icon: CalendarDays, label: "Today's date", hint: "Insert 2026-11-06 style date", shortcut: "Ctrl+Alt+T", kind: "edit", make: (s) => insertText(s, dateKey()) },
  "insert.time": { icon: Clock, label: "Time", hint: "Insert the current time", kind: "edit", make: (s) => insertText(s, timeNow()) },
  "insert.logEntry": { icon: ListOrdered, label: "Log entry", hint: "Start a new time-stamped log line", kind: "edit", make: (s) => insertText(s, `- ${timeNow()} `) },
  "insert.dateFormats": {
    icon: CalendarDays, label: "Formats", hint: "Every date and time format", kind: "menu", width: 280,
    menu: {
      type: "items",
      items: DATE_FORMATS.map((f) => ({ label: f.label, sub: () => f.make(new Date()), make: (s) => insertText(s, f.make(new Date())) })),
    },
  },
  "insert.linkDay": {
    icon: Link2, label: "Link day", hint: "Insert a [[link]] to a day note", kind: "menu", width: 200,
    menu: {
      type: "items",
      items: [["Today", 0], ["Yesterday", -1], ["Tomorrow", 1], ["In a week", 7], ["A week ago", -7]].map(([label, n]) => ({
        label, sub: () => shiftDay(dateKey(), n), make: (s) => insertText(s, `[[${shiftDay(dateKey(), n)}]]`),
      })),
    },
  },
  "insert.templates": {
    icon: BookOpen, label: "Templates", hint: "Ready-made journal blocks", kind: "menu", width: 240,
    menu: {
      type: "items",
      items: JOURNAL_TEMPLATES.map((item) => ({ label: item.label, make: (s) => insertBlock(s, item.text.replace(/\n$/, "")) })),
    },
  },

  /* Design */
  "design.resetTypography": {
    icon: Trash2, label: "Reset typography", hint: "Reset the typography of this note to the app default",
    kind: "call", fn: (ctx) => ctx.setTypography({}),
  },

  /* View */
  "view.spellCheck": {
    icon: SpellCheck, label: "Spell check", hint: "Underline misspelled words in the writing box", kind: "call",
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

  /* Layout */
  "layout.firstLineIndent": {
    icon: ArrowLeftRight, label: "First-line indent", hint: "Indent the first line of every paragraph in the reader",
    kind: "call", active: (ctx) => Boolean((ctx.typography || {}).indent), fn: toggleTypo("indent"),
  },
  "layout.dropCap": {
    icon: Space, label: "Drop cap", hint: "Large first letter on the first paragraph in the reader",
    kind: "call", active: (ctx) => Boolean((ctx.typography || {}).dropCap), fn: toggleTypo("dropCap"),
  },

  /* Share */
  "share.copyMarkdown": { icon: Table2, label: "As Markdown", hint: "Copy the whole note text", kind: "call", fn: async (ctx) => copyText(ctx.body) },
  "share.copyPlainText": {
    icon: Type, label: "As plain text", hint: "Copy the note without markdown symbols", kind: "call",
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
    icon: FileSpreadsheet, label: "From CSV file", hint: "Insert a .csv or .tsv file as a table", kind: "call",
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
  "table.addRowAbove": { icon: ArrowUpToLine, label: "Row above", hint: "Add a row above this one", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableOp(ctx.selection, "row-above")) },
  "table.addRowBelow": { icon: ArrowDownToLine, label: "Row below", hint: "Add a row below this one", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableOp(ctx.selection, "row-below")) },
  "table.addColumnLeft": { icon: ArrowLeftToLine, label: "Column left", hint: "Add a column to the left", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableOp(ctx.selection, "column-left")) },
  "table.addColumnRight": { icon: ArrowRightToLine, label: "Column right", hint: "Add a column to the right", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableOp(ctx.selection, "column-right")) },
  "table.deleteRow": { icon: Trash2, label: "Delete row", hint: "Remove the row the cursor is on", shortcut: "Alt+Shift+Backspace", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableOp(ctx.selection, "delete-row")) },
  "table.deleteColumn": { icon: Trash2, label: "Delete column", hint: "Remove the column the cursor is in", shortcut: "Alt+Shift+Delete", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableOp(ctx.selection, "delete-column")) },
  "table.deleteTable": { icon: Trash2, label: "Delete table", hint: "Remove the whole table", shortcut: "Ctrl+Alt+Shift+X", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableOp(ctx.selection, "delete-table")) },
  "table.alignLeft": { icon: AlignLeft, label: "Left", hint: "Align this column left", shortcut: "Ctrl+Alt+L", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableOp(ctx.selection, "align-left")) },
  "table.alignCentre": { icon: AlignCenter, label: "Centre", hint: "Centre this column", shortcut: "Ctrl+Alt+E", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableOp(ctx.selection, "align-centre")) },
  "table.alignRight": { icon: AlignRight, label: "Right", hint: "Align this column right", shortcut: "Ctrl+Alt+R", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableOp(ctx.selection, "align-right")) },

  "table.sortAsc": { icon: ArrowDownAZ, label: "Sort A–Z", hint: "Sort the rows by the column under the cursor (numbers by value)", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "sort-asc")) },
  "table.sortDesc": { icon: ArrowUpAZ, label: "Sort Z–A", hint: "Sort the rows in reverse", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "sort-desc")) },
  "table.moveRowUp": { icon: ArrowUp, label: "Row up", hint: "Move this row up", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "row-up")) },
  "table.moveRowDown": { icon: ArrowDown, label: "Row down", hint: "Move this row down", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "row-down")) },
  "table.moveColLeft": { icon: ArrowLeft, label: "Col left", hint: "Move this column left", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "column-left")) },
  "table.moveColRight": { icon: ArrowRight, label: "Col right", hint: "Move this column right", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "column-right")) },
  "table.duplicateRow": { icon: CopyPlus, label: "Duplicate row", hint: "Copy this row below itself", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "duplicate-row")) },
  "table.transpose": { icon: ArrowLeftRight, label: "Transpose", hint: "Swap rows and columns", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "transpose")) },

  "table.sumRow": { icon: Sigma, label: "Sum row", hint: "Add a Total row summing the numeric columns", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "totals-sum")) },
  "table.averageRow": { icon: Sigma, label: "Average row", hint: "Add an Average row", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "totals-average")) },
  "table.clearCells": { icon: Eraser, label: "Clear cells", hint: "Empty every data cell, keep the header", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "clear-cells")) },
  "table.tidy": { icon: Wand2, label: "Tidy up", hint: "Align the | marks so the table is easy to read as text", kind: "call", enabled: inTable, disabledReason: NEED_TABLE, fn: (ctx) => ctx.run(tableExtra(ctx.selection, "prettify")) },

  "table.textToTable": {
    icon: TableProperties, label: "Text → table", hint: "Turn the selected CSV / TSV lines into a table",
    kind: "menu", width: 200, menu: TEXT_TO_TABLE_MENU,
  },
  "table.copyCsv": {
    icon: Download, label: "Copy as CSV", hint: "Copy this table as CSV text", kind: "call",
    enabled: inTable, disabledReason: NEED_TABLE, fn: async (ctx) => copyText(tableToCsv(ctx.selection) || ""),
  },

  /* Code tab */
  "code.language": {
    icon: Replace, label: "Language", hint: "Change the language of the block under the cursor",
    kind: "menu", width: 300, menu: { type: "setLanguage" },
    enabled: inCodeBlock, disabledReason: NEED_BLOCK,
  },
  "code.snippet": {
    icon: SquareTerminal, label: "Snippet", hint: "Insert a small example block", kind: "menu", width: 220,
    menu: {
      type: "items",
      items: LANGUAGES.filter((item) => item.template).map((item) => ({
        label: item.label, make: (s) => insertBlock(s, `\`\`\`${item.id}\n${item.template}\`\`\``),
      })),
    },
  },
  "code.unwrap": { icon: PackageOpen, label: "Unwrap", hint: "Remove the fences and keep the code", kind: "edit", enabled: inCodeBlock, disabledReason: NEED_BLOCK, make: unwrapFence },
  "code.copy": {
    icon: ClipboardCopy, label: "Copy code", hint: "Copy the code of this block", kind: "call",
    enabled: inCodeBlock, disabledReason: NEED_BLOCK,
    fn: async (ctx) => {
      const block = fenceAt(ctx.value, ctx.selection.start);
      await copyText(ctx.value.slice(block.bodyStart, block.bodyEnd).replace(/\n$/, ""));
    },
  },
  "code.comment": {
    icon: MessageSquareOff, label: "Comment", hint: "Comment or uncomment the selected lines", shortcut: "Ctrl+/", kind: "edit",
    make: (s, ctx) => toggleComment(s, (fenceAt((ctx && ctx.value) || "", s.start) || {}).lang || "plain"),
  },
  "code.indent": { icon: IndentIncrease, label: "Indent lines", hint: "Indent lines", kind: "edit", make: (s) => shiftIndent(s, 1) },
  "code.outdent": { icon: IndentDecrease, label: "Outdent lines", hint: "Outdent lines", kind: "edit", make: (s) => shiftIndent(s, -1) },
  "code.duplicate": { icon: CopyPlus, label: "Duplicate", hint: "Duplicate the current line", kind: "edit", make: (s) => lineMove(s, "duplicate") },
  "code.moveUp": { icon: ArrowUp, label: "Move line up", hint: "Move line up", kind: "edit", make: (s) => lineMove(s, "up") },
  "code.moveDown": { icon: ArrowDown, label: "Move line down", hint: "Move line down", kind: "edit", make: (s) => lineMove(s, "down") },
  "code.deleteLine": { icon: Trash2, label: "Delete line", hint: "Delete the current line", kind: "edit", make: (s) => lineMove(s, "delete") },
  "code.prettyJson": { icon: FileJson, label: "Pretty", hint: "Format the JSON in the selection or in the block under the cursor", kind: "edit", make: (s) => formatJsonSelection(s, "pretty") },
  "code.minifyJson": { icon: Shrink, label: "Minify", hint: "Squeeze the JSON onto one line", kind: "edit", make: (s) => formatJsonSelection(s, "minify") },
};

/* Quick code languages ("JS", "Py"…) — no icon, a short text label. */
for (const [id, label] of QUICK_LANGUAGES) {
  ACTIONS[`insert.fence.${id}`] = {
    label,
    hint: `Insert a ${fenceLabel(id)} code block`,
    kind: "call",
    fn: (ctx) => runCodeFence(ctx, id),
  };
}

export const RIBBON_ACTIONS = ACTIONS;

export const getRibbonAction = (id) => ACTIONS[id];

/** Default pins: Bold, Italic, Underline, Undo, Redo, Highlight. */
export const DEFAULT_PINS = [
  "home.bold", "home.italic", "home.underline", "home.undo", "home.redo", "home.highlight",
];
