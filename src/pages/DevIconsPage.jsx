import { useMemo, useState } from "react";

/**
 * Development-only page at /dev/icons showing every ribbon button
 * with its ID, icon, tooltip, and tab.
 * Only renders when running `npm run dev`.
 */

// ──────────────────────────────────────────────────────────────────────────
// COMPLETE BUTTON INVENTORY — sourced from actual tab component files
// ──────────────────────────────────────────────────────────────────────────

const ALL_BUTTONS = [
  // ─── Home Tab ──────────────────────────────────────────────────────────
  // Clipboard group
  { id: "home.undo", tab: "Home", group: "Clipboard", icon: "Undo2", label: "Undo", hint: "Undo the last edit", hasPopover: false },
  { id: "home.redo", tab: "Home", group: "Clipboard", icon: "Redo2", label: "Redo", hint: "Redo", hasPopover: false },
  { id: "home.cut", tab: "Home", group: "Clipboard", icon: "Scissors", label: "Cut", hint: "Cut the selection", hasPopover: false },
  { id: "home.copy", tab: "Home", group: "Clipboard", icon: "Copy", label: "Copy", hint: "Copy the selection", hasPopover: false },
  { id: "home.selectAll", tab: "Home", group: "Clipboard", icon: "SquareDashedMousePointer", label: "Select all", hint: "Select the whole note", hasPopover: false },
  { id: "home.formatPainter", tab: "Home", group: "Clipboard", icon: "Brush", label: "Format painter", hint: "Copy formatting from selection", hasPopover: false },

  // Font group
  { id: "home.bold", tab: "Home", group: "Font", icon: "Bold", label: "Bold", hint: "Bold", hasPopover: false },
  { id: "home.italic", tab: "Home", group: "Font", icon: "Italic", label: "Italic", hint: "Italic", hasPopover: false },
  { id: "home.underline", tab: "Home", group: "Font", icon: "Underline", label: "Underline", hint: "Underline", hasPopover: false },
  { id: "home.strike", tab: "Home", group: "Font", icon: "Strikethrough", label: "Strikethrough", hint: "Strikethrough", hasPopover: false },
  { id: "home.highlight", tab: "Home", group: "Font", icon: "Highlighter", label: "Highlight", hint: "Highlight (yellow)", hasPopover: false },
  { id: "home.inlineCode", tab: "Home", group: "Font", icon: "Code", label: "Inline code", hint: "Inline code", hasPopover: false },
  { id: "home.clearFormatting", tab: "Home", group: "Font", icon: "Eraser", label: "Clear formatting", hint: "Clear formatting on the selection or the line", hasPopover: false },

  // Style (Paragraph style select) — no button, it's a Select
  // Lists group
  { id: "home.bulletList", tab: "Home", group: "Lists", icon: "List", label: "Bulleted list", hint: "Bulleted list", hasPopover: false },
  { id: "home.numberList", tab: "Home", group: "Lists", icon: "ListOrdered", label: "Numbered list", hint: "Numbered list", hasPopover: false },
  { id: "home.checklist", tab: "Home", group: "Lists", icon: "ListChecks", label: "Checklist", hint: "Checklist", hasPopover: false },
  { id: "home.quote", tab: "Home", group: "Lists", icon: "Quote", label: "Quote line", hint: "Quote", hasPopover: false },
  { id: "home.indent", tab: "Home", group: "Lists", icon: "IndentIncrease", label: "Indent", hint: "Indent", hasPopover: false },
  { id: "home.outdent", tab: "Home", group: "Lists", icon: "IndentDecrease", label: "Outdent", hint: "Outdent", hasPopover: false },

  // Align group
  { id: "home.alignLeft", tab: "Home", group: "Align", icon: "AlignLeft", label: "Align left", hint: "Align left", hasPopover: false },
  { id: "home.alignCenter", tab: "Home", group: "Align", icon: "AlignCenter", label: "Centre", hint: "Centre", hasPopover: false },
  { id: "home.alignRight", tab: "Home", group: "Align", icon: "AlignRight", label: "Align right", hint: "Align right", hasPopover: false },
  { id: "home.alignJustify", tab: "Home", group: "Align", icon: "AlignJustify", label: "Justify", hint: "Justify", hasPopover: false },
  { id: "home.ltr", tab: "Home", group: "Align", icon: "Pilcrow", label: "LTR", hint: "Left-to-right text direction", hasPopover: false },
  { id: "home.rtl", tab: "Home", group: "Align", icon: "FlipHorizontal2", label: "RTL", hint: "Right-to-left direction, for Arabic", hasPopover: false },
  { id: "home.dirAuto", tab: "Home", group: "Align", icon: "MoveHorizontal", label: "Auto", hint: "Auto text direction", hasPopover: false },

  // Lines group
  { id: "home.sortAsc", tab: "Home", group: "Lines", icon: "ArrowDownAZ", label: "Sort A–Z", hint: "Sort the selected lines A to Z (numbers sort by value)", hasPopover: false },
  { id: "home.sortDesc", tab: "Home", group: "Lines", icon: "ArrowUpAZ", label: "Sort Z–A", hint: "Sort the selected lines Z to A", hasPopover: false },
  { id: "home.reverse", tab: "Home", group: "Lines", icon: "ArrowLeftRight", label: "Reverse", hint: "Reverse the order of the selected lines", hasPopover: false },
  { id: "home.unique", tab: "Home", group: "Lines", icon: "ListX", label: "Unique", hint: "Remove duplicate lines", hasPopover: false },
  { id: "home.noBlanks", tab: "Home", group: "Lines", icon: "Minus", label: "No blanks", hint: "Remove blank lines", hasPopover: false },
  { id: "home.join", tab: "Home", group: "Lines", icon: "Merge", label: "Join", hint: "Join the selected lines into one", hasPopover: false },
  { id: "home.numberLines", tab: "Home", group: "Lines", icon: "Hash", label: "Number", hint: "Number the selected lines", hasPopover: false },
  { id: "home.trim", tab: "Home", group: "Lines", icon: "WrapText", label: "Trim", hint: "Trim spaces at the end of each line", hasPopover: false },

  // Typography group
  { id: "home.resetTypography", tab: "Home", group: "Typography", icon: "Trash2", label: "Reset typography", hint: "Reset the typography of this note to the app default", hasPopover: false },
  // Note: Font, Size, Tracking, Heading Font, Direction are RibbonSelects, not buttons

  // Tasks group
  { id: "home.todo", tab: "Home", group: "Tasks", icon: "Circle", label: "TODO", hint: "Mark the line TODO, or clear it if it already is", hasPopover: false },
  { id: "home.doing", tab: "Home", group: "Tasks", icon: "Timer", label: "DOING", hint: "Mark the line DOING, or clear it if it already is", hasPopover: false },
  { id: "home.done", tab: "Home", group: "Tasks", icon: "CircleCheck", label: "DONE", hint: "Mark the line DONE, or clear it if it already is", hasPopover: false },
  { id: "home.nextStatus", tab: "Home", group: "Tasks", icon: "ListRestart", label: "Next status", hint: "Cycle TODO → DOING → DONE → TODO", hasPopover: false },
  { id: "home.clearStatus", tab: "Home", group: "Tasks", icon: "CircleDashed", label: "Clear", hint: "Remove the status words from the selected lines", hasPopover: false },

  // AI group (only when AI enabled)
  { id: "home.ai.translate", tab: "Home", group: "AI", icon: "Globe", label: "Translate", hint: "Translate the text to English", hasPopover: false },
  { id: "home.ai.summarize", tab: "Home", group: "AI", icon: "List", label: "Summarize", hint: "Summarize the text", hasPopover: false },
  { id: "home.ai.fixGrammar", tab: "Home", group: "AI", icon: "Wand2", label: "Fix grammar", hint: "Fix grammar and spelling", hasPopover: false },
  { id: "home.ai.continue", tab: "Home", group: "AI", icon: "ArrowRight", label: "Continue writing", hint: "Continue writing from the cursor", hasPopover: false },
  { id: "home.ai.arabicEnglish", tab: "Home", group: "AI", icon: "Languages", label: "Arabic ↔ English", hint: "Translate between Arabic and English", hasPopover: false },

  // Search group
  { id: "home.findTags", tab: "Home", group: "Search", icon: "Search", label: "Find tags", hint: "Find and filter tags", hasPopover: false },

  // Note Type group — Select, not buttons

  // ─── Insert Tab ──────────────────────────────────────────────────────────
  // Pictures group
  { id: "insert.image", tab: "Insert", group: "Pictures", icon: "ImagePlus", label: "Image file", hint: "Insert an image from your computer", hasPopover: false },
  { id: "insert.imageUrl", tab: "Insert", group: "Pictures", icon: "Link", label: "Image URL", hint: "Insert an image from a web address", hasPopover: true },
  { id: "insert.figure", tab: "Insert", group: "Pictures", icon: "FileImage", label: "Figure", hint: "Insert an image with caption", hasPopover: false },

  // Media group
  { id: "insert.gif", tab: "Insert", group: "Media", icon: "Film", label: "GIF", hint: "Insert an animated GIF/WEBP/APNG", hasPopover: false },
  { id: "insert.file", tab: "Insert", group: "Media", icon: "Paperclip", label: "File attachment", hint: "Attach any file", hasPopover: false },
  { id: "insert.audio", tab: "Insert", group: "Media", icon: "Mic", label: "Record audio", hint: "Record audio", hasPopover: false },

  // Links group
  { id: "insert.noteLink", tab: "Insert", group: "Links", icon: "Link2", label: "Note link", hint: "Link another note with [[ ]]", hasPopover: false },
  { id: "insert.bookmark", tab: "Insert", group: "Links", icon: "Bookmark", label: "Bookmark", hint: "Insert a bookmark", hasPopover: true },
  { id: "insert.webLink", tab: "Insert", group: "Links", icon: "Link", label: "Web link", hint: "Turn the selection into a web link", hasPopover: true },
  { id: "insert.email", tab: "Insert", group: "Links", icon: "AtSign", label: "Email", hint: "Insert an email link", hasPopover: true },
  { id: "insert.tag", tab: "Insert", group: "Links", icon: "Hash", label: "Tag", hint: "Insert a #tag", hasPopover: true },

  // Bookmarks group
  { id: "insert.bookmarks", tab: "Insert", group: "Bookmarks", icon: "Bookmark", label: "Bookmarks", hint: "Jump to a bookmark in this note", hasPopover: true },

  // Blocks group
  { id: "insert.divider", tab: "Insert", group: "Blocks", icon: "Minus", label: "Divider", hint: "Horizontal line", hasPopover: false },
  { id: "insert.callout", tab: "Insert", group: "Blocks", icon: "MessageSquareQuote", label: "Callout", hint: "Highlighted note box", hasPopover: true },
  { id: "insert.collapsible", tab: "Insert", group: "Blocks", icon: "ChevronsDownUp", label: "Collapsible", hint: "A section that opens and closes", hasPopover: false },
  { id: "insert.footnote", tab: "Insert", group: "Blocks", icon: "Footprints", label: "Footnote", hint: "Add a footnote marker here and its text at the end of the note", hasPopover: false },
  { id: "insert.lineBreak", tab: "Insert", group: "Blocks", icon: "CornerDownLeft", label: "Line break", hint: "Force a new line inside a paragraph", hasPopover: false },
  { id: "insert.outline", tab: "Insert", group: "Blocks", icon: "ListTree", label: "Outline", hint: "Insert a list of this note's headings", hasPopover: false },
  { id: "insert.quoteBlock", tab: "Insert", group: "Blocks", icon: "TextQuote", label: "Quote", hint: "Block quote", hasPopover: false },
  { id: "insert.chart", tab: "Insert", group: "Blocks", icon: "BarChart", label: "Chart", hint: "Create a chart from a table", hasPopover: true },

  // Symbols group
  { id: "insert.symbols", tab: "Insert", group: "Symbols", icon: "Omega", label: "Symbols", hint: "Special characters", hasPopover: true },

  // Code Block group
  { id: "insert.codeBlock", tab: "Insert", group: "Code block", icon: "SquareCode", label: "Code block", hint: "Insert a fenced code block", hasPopover: true },
  { id: "insert.inlineCode", tab: "Insert", group: "Code block", icon: "Braces", label: "Inline code", hint: "Inline code", hasPopover: false },
  // Quick languages (text labels, no icons)
  { id: "insert.fence.js", tab: "Insert", group: "Code block", icon: "text", label: "JS", hint: "Insert a JavaScript code block", hasPopover: false },
  { id: "insert.fence.ts", tab: "Insert", group: "Code block", icon: "text", label: "TS", hint: "Insert a TypeScript code block", hasPopover: false },
  { id: "insert.fence.py", tab: "Insert", group: "Code block", icon: "text", label: "Py", hint: "Insert a Python code block", hasPopover: false },
  { id: "insert.fence.rs", tab: "Insert", group: "Code block", icon: "text", label: "Rust", hint: "Insert a Rust code block", hasPopover: false },
  { id: "insert.fence.go", tab: "Insert", group: "Code block", icon: "text", label: "Go", hint: "Insert a Go code block", hasPopover: false },
  { id: "insert.fence.java", tab: "Insert", group: "Code block", icon: "text", label: "Java", hint: "Insert a Java code block", hasPopover: false },
  { id: "insert.fence.cpp", tab: "Insert", group: "Code block", icon: "text", label: "C++", hint: "Insert a C++ code block", hasPopover: false },
  { id: "insert.fence.sql", tab: "Insert", group: "Code block", icon: "text", label: "SQL", hint: "Insert a SQL code block", hasPopover: false },
  { id: "insert.fence.sh", tab: "Insert", group: "Code block", icon: "text", label: "Shell", hint: "Insert a Shell code block", hasPopover: false },
  { id: "insert.fence.json", tab: "Insert", group: "Code block", icon: "text", label: "JSON", hint: "Insert a JSON code block", hasPopover: false },
  { id: "insert.fence.md", tab: "Insert", group: "Code block", icon: "text", label: "MD", hint: "Insert a Markdown code block", hasPopover: false },
  { id: "insert.fence.yaml", tab: "Insert", group: "Code block", icon: "text", label: "YAML", hint: "Insert a YAML code block", hasPopover: false },
  { id: "insert.fence.html", tab: "Insert", group: "Code block", icon: "text", label: "HTML", hint: "Insert an HTML code block", hasPopover: false },
  { id: "insert.fence.css", tab: "Insert", group: "Code block", icon: "text", label: "CSS", hint: "Insert a CSS code block", hasPopover: false },
  { id: "insert.fence.dockerfile", tab: "Insert", group: "Code block", icon: "text", label: "Docker", hint: "Insert a Dockerfile code block", hasPopover: false },
  { id: "insert.fence.plain", tab: "Insert", group: "Code block", icon: "text", label: "Plain", hint: "Insert a plain text code block", hasPopover: false },

  // Table group
  { id: "insert.table", tab: "Insert", group: "Table", icon: "Table", label: "Table", hint: "Insert a table — hover the grid or type a size", hasPopover: false },

  // Cards group
  { id: "insert.card", tab: "Insert", group: "Cards", icon: "Layers", label: "Make card", hint: "Turn the selected text into a flashcard", hasPopover: false },

  // Shapes group
  { id: "insert.shape.rect", tab: "Insert", group: "Shapes", icon: "Square", label: "Rectangle", hint: "Insert a rectangle shape", hasPopover: false },
  { id: "insert.shape.rounded", tab: "Insert", group: "Shapes", icon: "SquareDashed", label: "Rounded rect", hint: "Insert a rounded rectangle shape", hasPopover: false },
  { id: "insert.shape.ellipse", tab: "Insert", group: "Shapes", icon: "Circle", label: "Ellipse", hint: "Insert an ellipse shape", hasPopover: false },
  { id: "insert.shape.line", tab: "Insert", group: "Shapes", icon: "LineIcon", label: "Line", hint: "Insert a line shape", hasPopover: false },
  { id: "insert.shape.arrow", tab: "Insert", group: "Shapes", icon: "ArrowRight", label: "Arrow", hint: "Insert an arrow shape", hasPopover: false },
  { id: "insert.shape.triangle", tab: "Insert", group: "Shapes", icon: "Triangle", label: "Triangle", hint: "Insert a triangle shape", hasPopover: false },
  { id: "insert.shape.star", tab: "Insert", group: "Shapes", icon: "Star", label: "Star", hint: "Insert a star shape", hasPopover: false },

  // Stickers group
  { id: "insert.sticker", tab: "Insert", group: "Stickers", icon: "Star", label: "Stickers", hint: "Insert a sticker", hasPopover: true },

  // Text notes group
  { id: "insert.textbox", tab: "Insert", group: "Text notes", icon: "SquarePen", label: "Text box", hint: "Insert a text box", hasPopover: false },
  { id: "insert.sticky", tab: "Insert", group: "Text notes", icon: "StickyNote", label: "Sticky note", hint: "Insert a sticky note", hasPopover: false },

  // Time & Calendar group
  { id: "insert.today", tab: "Insert", group: "Time & Calendar", icon: "CalendarPlus", label: "Today", hint: "Open or create today's daily note", hasPopover: false },
  { id: "insert.yesterday", tab: "Insert", group: "Time & Calendar", icon: "CalendarClock", label: "Yesterday", hint: "Open yesterday's note", hasPopover: false },
  { id: "insert.tomorrow", tab: "Insert", group: "Time & Calendar", icon: "CalendarCheck", label: "Tomorrow", hint: "Open or create tomorrow's note", hasPopover: false },
  { id: "insert.prevDay", tab: "Insert", group: "Time & Calendar", icon: "ArrowLeft", label: "Previous", hint: "The day, week or month before this note", hasPopover: false },
  { id: "insert.nextDay", tab: "Insert", group: "Time & Calendar", icon: "ArrowRight", label: "Next", hint: "The day, week or month after this note", hasPopover: false },
  { id: "insert.thisWeek", tab: "Insert", group: "Time & Calendar", icon: "CalendarRange", label: "This week", hint: "Open or create this week's note", hasPopover: false },
  { id: "insert.thisMonth", tab: "Insert", group: "Time & Calendar", icon: "CalendarDays", label: "This month", hint: "Open or create this month's note", hasPopover: false },
  { id: "insert.date", tab: "Insert", group: "Time & Calendar", icon: "CalendarDays", label: "Today's date", hint: "Insert 2026-11-06 style date", hasPopover: false },
  { id: "insert.time", tab: "Insert", group: "Time & Calendar", icon: "Clock", label: "Time", hint: "Insert the current time", hasPopover: false },
  { id: "insert.logEntry", tab: "Insert", group: "Time & Calendar", icon: "ListOrdered", label: "Log entry", hint: "Start a new time-stamped log line", hasPopover: false },
  { id: "insert.dateFormats", tab: "Insert", group: "Time & Calendar", icon: "CalendarClock", label: "Formats", hint: "Every date and time format", hasPopover: true },
  { id: "insert.linkDay", tab: "Insert", group: "Time & Calendar", icon: "Link2", label: "Link day", hint: "Insert a [[link]] to a day note", hasPopover: true },
  { id: "insert.templates", tab: "Insert", group: "Time & Calendar", icon: "BookOpenCheck", label: "Templates", hint: "Ready-made journal blocks", hasPopover: true },

  // ─── Design Tab ──────────────────────────────────────────────────────────
  // Page Style group
  { id: "design.pageStyle", tab: "Design", group: "Page Style", icon: "Grid", label: "Page style", hint: "Background pattern for the reading and writing page", hasPopover: false },
  { id: "design.pageGridSize", tab: "Design", group: "Page Style", icon: "Grid", label: "Grid spacing", hint: "Grid spacing (px)", hasPopover: false },
  { id: "design.pageLineHeight", tab: "Design", group: "Page Style", icon: "Grid", label: "Line spacing", hint: "Line spacing (px)", hasPopover: false },
  // Note: These are Stepper/Select, not buttons with icons

  // Style Sets group
  { id: "design.styleSet", tab: "Design", group: "Style sets", icon: "FileText", label: "Style sets", hint: "Document formatting presets", hasPopover: false },

  // Themes group
  { id: "design.themePreset", tab: "Design", group: "Themes", icon: "Palette", label: "Theme preset", hint: "Apply a theme preset to this note only", hasPopover: true },
  { id: "design.themeAccent", tab: "Design", group: "Themes", icon: "Droplet", label: "Accent color", hint: "Pick an accent color for this note", hasPopover: true },
  { id: "design.themeHeadingFont", tab: "Design", group: "Themes", icon: "Type", label: "Heading font", hint: "Heading font for this note", hasPopover: false },
  { id: "design.themeBodyFont", tab: "Design", group: "Themes", icon: "Type", label: "Body font", hint: "Body font for this note", hasPopover: false },

  // Paragraph Spacing group
  { id: "design.paragraphPreset", tab: "Design", group: "Paragraph spacing", icon: "Type", label: "Paragraph preset", hint: "Paragraph spacing preset", hasPopover: false },
  { id: "design.gap", tab: "Design", group: "Paragraph spacing", icon: "Type", label: "Gap", hint: "Space between paragraphs (em)", hasPopover: false },
  { id: "design.lineHeight", tab: "Design", group: "Paragraph spacing", icon: "Type", label: "Line height", hint: "Line height", hasPopover: false },

  // Page Appearance group
  { id: "design.pageColor", tab: "Design", group: "Page appearance", icon: "PaintBucket", label: "Page color", hint: "Background color for the page", hasPopover: true },
  { id: "design.pageBorder", tab: "Design", group: "Page appearance", icon: "Square", label: "Page border", hint: "Page border style", hasPopover: false },
  { id: "design.pageBorderColor", tab: "Design", group: "Page appearance", icon: "Droplet", label: "Border color", hint: "Color of the page border", hasPopover: true },
  { id: "design.hideTitle", tab: "Design", group: "Page appearance", icon: "Eye", label: "Hide page title", hint: "Hide the large title above the note body in reader view", hasPopover: false },
  { id: "design.watermarkText", tab: "Design", group: "Page appearance", icon: "Stamp", label: "Watermark text", hint: "Text to show as watermark (e.g. DRAFT, CONFIDENTIAL)", hasPopover: true },
  { id: "design.watermarkColor", tab: "Design", group: "Page appearance", icon: "Droplet", label: "Watermark color", hint: "Color of the watermark text", hasPopover: true },
  { id: "design.watermarkOpacity", tab: "Design", group: "Page appearance", icon: "Droplet", label: "Watermark opacity", hint: "Watermark opacity", hasPopover: false },
  { id: "design.watermarkAngle", tab: "Design", group: "Page appearance", icon: "Droplet", label: "Watermark angle", hint: "Watermark angle", hasPopover: false },

  // Page Title Style group
  { id: "design.titleFont", tab: "Design", group: "Page title style", icon: "Type", label: "Title font", hint: "Font for the page title", hasPopover: false },
  { id: "design.titleSize", tab: "Design", group: "Page title style", icon: "Type", label: "Title size", hint: "Title font size (px)", hasPopover: false },
  { id: "design.titleAlign", tab: "Design", group: "Page title style", icon: "Type", label: "Title alignment", hint: "Title alignment", hasPopover: false },

  // Language group
  { id: "design.language", tab: "Design", group: "Language", icon: "Globe", label: "Language", hint: "Note language (for spell check and hyphenation)", hasPopover: false },

  // Defaults group
  { id: "design.saveAsDefault", tab: "Design", group: "Defaults", icon: "Save", label: "Set as default", hint: "Save current note's design as the default for new notes", hasPopover: false },
  { id: "design.loadDefault", tab: "Design", group: "Defaults", icon: "RotateCcw", label: "Apply default", hint: "Load the saved default style into this note", hasPopover: false },
  { id: "design.resetDesign", tab: "Design", group: "Defaults", icon: "Trash2", label: "Reset to defaults", hint: "Clear all design settings on this note", hasPopover: false },

  // ─── Layout Tab ──────────────────────────────────────────────────────────
  // Page Setup group
  { id: "layout.pageSize", tab: "Layout", group: "Page setup", icon: "FileText", label: "Page size", hint: "Paper size for printing and PDF export", hasPopover: false },
  { id: "layout.pageWidth", tab: "Layout", group: "Page setup", icon: "FileText", label: "Custom width", hint: "Custom page width (mm)", hasPopover: false },
  { id: "layout.pageHeight", tab: "Layout", group: "Page setup", icon: "FileText", label: "Custom height", hint: "Custom page height (mm)", hasPopover: false },
  { id: "layout.pageOrientation", tab: "Layout", group: "Page setup", icon: "FileText", label: "Orientation", hint: "Page orientation", hasPopover: false },
  { id: "layout.pageMargins", tab: "Layout", group: "Page setup", icon: "FileText", label: "Margins", hint: "Page margins", hasPopover: false },
  { id: "layout.marginTop", tab: "Layout", group: "Page setup", icon: "FileText", label: "Top margin", hint: "Top margin (mm)", hasPopover: false },
  { id: "layout.marginRight", tab: "Layout", group: "Page setup", icon: "FileText", label: "Right margin", hint: "Right margin (mm)", hasPopover: false },
  { id: "layout.marginBottom", tab: "Layout", group: "Page setup", icon: "FileText", label: "Bottom margin", hint: "Bottom margin (mm)", hasPopover: false },
  { id: "layout.marginLeft", tab: "Layout", group: "Page setup", icon: "FileText", label: "Left margin", hint: "Left margin (mm)", hasPopover: false },

  // Columns group
  { id: "layout.columnCount", tab: "Layout", group: "Columns", icon: "Columns", label: "Columns", hint: "Number of columns in the reader", hasPopover: false },
  { id: "layout.columnGap", tab: "Layout", group: "Columns", icon: "Columns", label: "Column gap", hint: "Gap between columns (em)", hasPopover: false },
  { id: "layout.columnBreak", tab: "Layout", group: "Columns", icon: "GripVertical", label: "Column break", hint: "Insert a column break at the cursor", hasPopover: false },
  { id: "layout.pageBreak", tab: "Layout", group: "Columns", icon: "LayoutDashboard", label: "Page break", hint: "Insert a page break at the cursor", hasPopover: false },

  // Editor group
  { id: "layout.lineNumbers", tab: "Layout", group: "Editor", icon: "Maximize2", label: "Line numbers", hint: "Show line numbers in the writing box", hasPopover: false },
  { id: "layout.hyphens", tab: "Layout", group: "Editor", icon: "Type", label: "Hyphenation", hint: "Hyphenation in the reader and editor", hasPopover: false },

  // Paragraph group
  { id: "layout.indentLeft", tab: "Layout", group: "Paragraph", icon: "Type", label: "Indent left", hint: "Indent left (em)", hasPopover: false },
  { id: "layout.indentRight", tab: "Layout", group: "Paragraph", icon: "Type", label: "Indent right", hint: "Indent right (em)", hasPopover: false },
  { id: "layout.spacingBefore", tab: "Layout", group: "Paragraph", icon: "Type", label: "Spacing before", hint: "Spacing before (em)", hasPopover: false },
  { id: "layout.spacingAfter", tab: "Layout", group: "Paragraph", icon: "Type", label: "Spacing after", hint: "Spacing after (em)", hasPopover: false },
  { id: "layout.alignLeft", tab: "Layout", group: "Paragraph", icon: "AlignLeft", label: "Align left", hint: "Align selected paragraphs left", hasPopover: false },
  { id: "layout.alignCenter", tab: "Layout", group: "Paragraph", icon: "AlignCenter", label: "Centre", hint: "Centre selected paragraphs", hasPopover: false },
  { id: "layout.alignRight", tab: "Layout", group: "Paragraph", icon: "AlignRight", label: "Align right", hint: "Align selected paragraphs right", hasPopover: false },
  { id: "layout.alignJustify", tab: "Layout", group: "Paragraph", icon: "AlignJustify", label: "Justify", hint: "Justify selected paragraphs", hasPopover: false },

  // Floating Objects group
  { id: "layout.position", tab: "Layout", group: "Floating objects", icon: "Move", label: "Position", hint: "Move the selected object to a preset position on the page", hasPopover: true },
  { id: "layout.wrapText", tab: "Layout", group: "Floating objects", icon: "MoveHorizontal", label: "Wrap Text", hint: "Choose how text wraps around the selected object", hasPopover: true },
  { id: "layout.bringForward", tab: "Layout", group: "Floating objects", icon: "ArrowUp", label: "Bring Forward", hint: "Move the selected object one layer forward", hasPopover: false },
  { id: "layout.sendBackward", tab: "Layout", group: "Floating objects", icon: "ArrowDown", label: "Send Backward", hint: "Move the selected object one layer backward", hasPopover: false },
  { id: "layout.bringToFront", tab: "Layout", group: "Floating objects", icon: "Plus", label: "Bring to Front", hint: "Move the selected object to the front layer", hasPopover: false },
  { id: "layout.sendToBack", tab: "Layout", group: "Floating objects", icon: "Minus", label: "Send to Back", hint: "Move the selected object to the back layer", hasPopover: false },
  { id: "layout.selectionPane", tab: "Layout", group: "Floating objects", icon: "List", label: "Selection Pane", hint: "Show a panel listing all floating objects", hasPopover: false },
  { id: "layout.align", tab: "Layout", group: "Floating objects", icon: "AlignHorizontalDistributeCenter", label: "Align", hint: "Align the selected object relative to the page", hasPopover: true },
  { id: "layout.group", tab: "Layout", group: "Floating objects", icon: "Group", label: "Group", hint: "Group or ungroup selected objects", hasPopover: true },
  { id: "layout.rotate", tab: "Layout", group: "Floating objects", icon: "RotateCw", label: "Rotate", hint: "Rotate or flip the selected object", hasPopover: true },
  { id: "layout.undo", tab: "Layout", group: "Floating objects", icon: "RotateCcw", label: "Undo", hint: "Undo last floating object change", hasPopover: false },
  { id: "layout.redo", tab: "Layout", group: "Floating objects", icon: "RotateCw", label: "Redo", hint: "Redo last floating object change", hasPopover: false },

  // ─── View Tab ────────────────────────────────────────────────────────────
  // Views group
  { id: "view.mode.read", tab: "View", group: "Views", icon: "Eye", label: "Read Mode", hint: "Rendered markdown with styling", hasPopover: false },
  { id: "view.mode.draft", tab: "View", group: "Views", icon: "PenLine", label: "Draft", hint: "Plain writing box, no styling", hasPopover: false },
  { id: "view.mode.print", tab: "View", group: "Views", icon: "FileText", label: "Print Layout", hint: "Pages with shadows, numbers, margins", hasPopover: false },
  { id: "view.mode.outline", tab: "View", group: "Views", icon: "List", label: "Outline", hint: "Collapsible heading tree", hasPopover: false },
  { id: "view.mode.immersive", tab: "View", group: "Views", icon: "BookOpen", label: "Immersive Reader", hint: "Distraction-free, large text, read-aloud", hasPopover: false },

  // Navigation Pane group
  { id: "view.navPane", tab: "View", group: "Navigation pane", icon: "AlignLeft", label: "Navigation pane", hint: "Show side panel with headings and find", hasPopover: false },
  { id: "view.find", tab: "View", group: "Navigation pane", icon: "Search", label: "Find", hint: "Find in this note (Ctrl+F)", hasPopover: false },

  // Zoom group
  { id: "view.zoomOut", tab: "View", group: "Zoom", icon: "ZoomOut", label: "Zoom out", hint: "Decrease zoom (Ctrl+-)", hasPopover: false },
  { id: "view.zoomIn", tab: "View", group: "Zoom", icon: "ZoomIn", label: "Zoom in", hint: "Increase zoom (Ctrl++)", hasPopover: false },
  // Zoom select/slider — not buttons

  // Page Display group
  { id: "view.ruler", tab: "View", group: "Page display", icon: "Ruler", label: "Ruler", hint: "Show horizontal ruler with page width and margins", hasPopover: false },
  { id: "view.gridlines", tab: "View", group: "Page display", icon: "Grid", label: "Gridlines", hint: "Show overlay grid on the page", hasPopover: false },

  // Scroll Mode group
  { id: "view.scrollVertical", tab: "View", group: "Scroll mode", icon: "MoveVertical", label: "Vertical", hint: "Vertical scrolling (default)", hasPopover: false },
  { id: "view.scrollHorizontal", tab: "View", group: "Scroll mode", icon: "MoveHorizontal", label: "Side to Side", hint: "Horizontal page flow (Print Layout only)", hasPopover: false },

  // Reading Page group
  { id: "view.width", tab: "View", group: "Reading page", icon: "Type", label: "Width", hint: "Width of the reading column", hasPopover: false },

  // Attach group
  { id: "view.attachFile", tab: "View", group: "Attach", icon: "Paperclip", label: "Attach file", hint: "Attach a file to this note", hasPopover: false },
  { id: "view.attachImage", tab: "View", group: "Attach", icon: "FileText", label: "Attach image", hint: "Attach an image to this note", hasPopover: false },

  // Table group
  { id: "view.insertTable", tab: "View", group: "Table", icon: "Table", label: "Insert table", hint: "Insert a table", hasPopover: false },

  // Editor group
  { id: "view.editorFont", tab: "View", group: "Editor", icon: "Type", label: "Editor font", hint: "Font of the writing box", hasPopover: false },
  { id: "view.editorSize", tab: "View", group: "Editor", icon: "Type", label: "Editor size", hint: "Editor text size (px)", hasPopover: false },
  { id: "view.spellCheck", tab: "View", group: "Editor", icon: "Type", label: "Spell check", hint: "Underline misspelled words in the writing box", hasPopover: false },

  // Statistics group — display only, no buttons

  // Accessibility group
  { id: "view.a11yCheck", tab: "View", group: "Accessibility", icon: "Shield", label: "Check accessibility", hint: "Check for missing alt text, skipped headings, weak links, and low contrast", hasPopover: false },

  // ─── Share Tab ───────────────────────────────────────────────────────────
  // Copy Note group
  { id: "share.copyMarkdown", tab: "Share", group: "Copy note", icon: "FileText", label: "As Markdown", hint: "Copy the whole note as Markdown", hasPopover: false },
  { id: "share.copyPlainText", tab: "Share", group: "Copy note", icon: "Clipboard", label: "As plain text", hint: "Copy the note without markdown symbols", hasPopover: false },
  { id: "share.copyRichText", tab: "Share", group: "Copy note", icon: "Copy", label: "As rich text", hint: "Copy formatted note for Word, email, etc.", hasPopover: false },

  // Export This Note group
  { id: "share.exportMarkdown", tab: "Share", group: "Export this note", icon: "FileText", label: "Markdown (.md)", hint: "Export as Markdown file", hasPopover: false },
  { id: "share.exportHtml", tab: "Share", group: "Export this note", icon: "FileCode", label: "HTML (.html)", hint: "Export as standalone HTML file", hasPopover: false },
  { id: "share.exportPdf", tab: "Share", group: "Export this note", icon: "FileText", label: "PDF (.pdf)", hint: "Export as PDF using note's page settings", hasPopover: false },
  { id: "share.exportPlainText", tab: "Share", group: "Export this note", icon: "Clipboard", label: "Plain text (.txt)", hint: "Export as plain text file", hasPopover: false },
  { id: "share.exportTableXlsx", tab: "Share", group: "Export this note", icon: "FileX", label: "Table as Excel (.xlsx)", hint: "Export the table at cursor as Excel file", hasPopover: false },
  { id: "share.exportTableCsv", tab: "Share", group: "Export this note", icon: "FileSpreadsheet", label: "Table as CSV (.csv)", hint: "Export the table at cursor as CSV file", hasPopover: false },

  // Share & Print group
  { id: "share.print", tab: "Share", group: "Share & print", icon: "Printer", label: "Print", hint: "Open print dialog for this note", hasPopover: false },
  { id: "share.email", tab: "Share", group: "Share & print", icon: "Mail", label: "Email this note", hint: "Open email client with note as body", hasPopover: false },
  { id: "share.link", tab: "Share", group: "Share & print", icon: "Link2", label: "Share by link", hint: "Sharing by link comes with Sync (not available yet)", hasPopover: false },

  // Vault group
  { id: "share.exportAllNotes", tab: "Share", group: "Vault", icon: "Archive", label: "All notes as zip", hint: "Export every note as a zip of .md files", hasPopover: false },
  { id: "share.exportBackup", tab: "Share", group: "Vault", icon: "Shield", label: "Full backup (.json)", hint: "Export complete vault backup", hasPopover: false },

  // ─── Ink Tab (main) ──────────────────────────────────────────────────────
  // Handwriting group (when no ink page exists)
  { id: "ink.start", tab: "Ink", group: "Handwriting", icon: "PenLine", label: "Start inking", hint: "Add a handwriting page to this note", hasPopover: false },
  { id: "ink.attachOld", tab: "Ink", group: "Handwriting", icon: "Paperclip", label: "Attach old page", hint: "Bring in a handwriting page from before", hasPopover: true },

  // ─── Ink → Draw Sub-tab ─────────────────────────────────────────────────
  // Mode group
  { id: "ink.draw.mode.draw", tab: "Ink → Draw", group: "Mode", icon: "FountainPenIcon", label: "Draw", hint: "Draw with the current pen", hasPopover: false },
  { id: "ink.draw.mode.shape", tab: "Ink → Draw", group: "Mode", icon: "ShapesIcon", label: "Shapes", hint: "Draw lines, boxes, circles and coordinate graphs", hasPopover: false },
  { id: "ink.draw.mode.select", tab: "Ink → Draw", group: "Mode", icon: "MousePointerIcon", label: "Select", hint: "Select, move, resize and rotate objects", hasPopover: false },
  { id: "ink.draw.mode.lasso", tab: "Ink → Draw", group: "Mode", icon: "LassoIcon", label: "Lasso", hint: "Select marks by circling them", hasPopover: false },
  { id: "ink.draw.mode.erase", tab: "Ink → Draw", group: "Mode", icon: "EraserIcon", label: "Eraser", hint: "Erase marks", hasPopover: false },
  { id: "ink.draw.mode.pan", tab: "Ink → Draw", group: "Mode", icon: "HandIcon", label: "Pan", hint: "Move the page around", hasPopover: false },
  { id: "ink.draw.mode.eyedropper", tab: "Ink → Draw", group: "Mode", icon: "EyedropperIcon", label: "Pick", hint: "Pick a colour from the page", hasPopover: false },
  { id: "ink.draw.mode.insertSpace", tab: "Ink → Draw", group: "Mode", icon: "InsertSpaceIcon", label: "Insert space", hint: "Drag to insert or remove vertical space", hasPopover: false },

  // Pens group (uses custom brush icons, not Lucide)
  { id: "ink.draw.brush.fountain", tab: "Ink → Draw", group: "Pens", icon: "FountainPenIcon", label: "Fountain", hint: "Fountain pen", hasPopover: false },
  { id: "ink.draw.brush.ballpoint", tab: "Ink → Draw", group: "Pens", icon: "BallpointPenIcon", label: "Ballpoint", hint: "Ballpoint pen", hasPopover: false },
  { id: "ink.draw.brush.calligraphy", tab: "Ink → Draw", group: "Pens", icon: "CalligraphyPenIcon", label: "Calligraphy", hint: "Calligraphy pen", hasPopover: false },
  { id: "ink.draw.brush.marker", tab: "Ink → Draw", group: "Pens", icon: "HighlighterIcon", label: "Marker", hint: "Marker/Highlighter", hasPopover: false },
  { id: "ink.draw.brush.watercolor", tab: "Ink → Draw", group: "Pens", icon: "WatercolorBrushIcon", label: "Watercolor", hint: "Watercolor brush", hasPopover: false },
  { id: "ink.draw.brush.pencil", tab: "Ink → Draw", group: "Pens", icon: "PencilIcon", label: "Pencil", hint: "Pencil", hasPopover: false },

  // Favourite pens group
  { id: "ink.draw.favPens", tab: "Ink → Draw", group: "Favourite pens", icon: "SavePenIcon", label: "Save pen", hint: "Save current pen as favourite", hasPopover: false },

  // Stroke group
  { id: "ink.draw.stroke.width", tab: "Ink → Draw", group: "Stroke", icon: "Brush", label: "Width", hint: "Stroke width", hasPopover: false },
  { id: "ink.draw.stroke.opacity", tab: "Ink → Draw", group: "Stroke", icon: "Brush", label: "Opacity", hint: "Stroke opacity", hasPopover: false },
  { id: "ink.draw.brushEngine", tab: "Ink → Draw", group: "Stroke", icon: "Brush", label: "Brush engine", hint: "Pen behaviour, eraser engine, shape and ruler assists", hasPopover: true },

  // Eraser group
  { id: "ink.draw.eraser.stroke", tab: "Ink → Draw", group: "Eraser", icon: "EraserIcon", label: "Stroke eraser", hint: "Stroke eraser mode", hasPopover: false },
  { id: "ink.draw.eraser.precision", tab: "Ink → Draw", group: "Eraser", icon: "EraserIcon", label: "Point eraser", hint: "Point eraser mode", hasPopover: false },
  { id: "ink.draw.eraser.small", tab: "Ink → Draw", group: "Eraser", icon: "EraserIcon", label: "Small eraser", hint: "Small eraser (12px)", hasPopover: false },
  { id: "ink.draw.eraser.medium", tab: "Ink → Draw", group: "Eraser", icon: "EraserIcon", label: "Medium eraser", hint: "Medium eraser (26px)", hasPopover: false },
  { id: "ink.draw.eraser.large", tab: "Ink → Draw", group: "Eraser", icon: "EraserIcon", label: "Large eraser", hint: "Large eraser (50px)", hasPopover: false },
  { id: "ink.draw.eraser.radius", tab: "Ink → Draw", group: "Eraser", icon: "EraserIcon", label: "Radius", hint: "Eraser radius", hasPopover: false },

  // History group
  { id: "ink.draw.history.undo", tab: "Ink → Draw", group: "History", icon: "Undo2", label: "Undo", hint: "Undo the last mark", hasPopover: false },
  { id: "ink.draw.history.redo", tab: "Ink → Draw", group: "History", icon: "Redo2", label: "Redo", hint: "Redo", hasPopover: false },

  // View group
  { id: "ink.draw.view.zoomOut", tab: "Ink → Draw", group: "View", icon: "ZoomOut", label: "Zoom out", hint: "Zoom out", hasPopover: false },
  { id: "ink.draw.view.zoomIn", tab: "Ink → Draw", group: "View", icon: "ZoomIn", label: "Zoom in", hint: "Zoom in", hasPopover: false },
  { id: "ink.draw.view.fit", tab: "Ink → Draw", group: "View", icon: "Maximize", label: "Fit", hint: "Fit the page to the ink", hasPopover: false },
  { id: "ink.draw.view.clear", tab: "Ink → Draw", group: "View", icon: "Trash2", label: "Clear page", hint: "Remove every mark on this page", hasPopover: false },

  // Shapes group
  { id: "ink.draw.shapes.coordGraph", tab: "Ink → Draw", group: "Shapes", icon: "CoordinateGraphIcon", label: "Coordinate graph", hint: "Insert a coordinate graph with axes, grid and tick marks", hasPopover: true },

  // ─── Ink → Color Sub-tab ────────────────────────────────────────────────
  // Current group
  { id: "ink.color.hex", tab: "Ink → Color", group: "Current", icon: "Pipette", label: "Hex input", hint: "3 or 6 digit hex, with or without #", hasPopover: false },
  { id: "ink.color.pipette", tab: "Ink → Color", group: "Current", icon: "Pipette", label: "Pick", hint: "Pick a colour from the page", hasPopover: false },

  // Quick inks group (color swatches, no icon)
  { id: "ink.color.quick", tab: "Ink → Color", group: "Quick inks", icon: "Circle", label: "Quick colors", hint: "Quick color palette", hasPopover: false },

  // Recent group
  { id: "ink.color.recent", tab: "Ink → Color", group: "Recent", icon: "History", label: "Recent colors", hint: "Colours you use appear here", hasPopover: false },

  // Studio group
  { id: "ink.color.studio", tab: "Ink → Color", group: "Studio", icon: "Palette", label: "Colour studio", hint: "Mixer, palettes, opacity and custom colours", hasPopover: true },
  { id: "ink.color.opacity", tab: "Ink → Color", group: "Studio", icon: "Droplets", label: "Opacity", hint: "Stroke opacity", hasPopover: false },

  // ─── Ink → Select Sub-tab ───────────────────────────────────────────────
  // Select group
  { id: "ink.select.select", tab: "Ink → Select", group: "Select", icon: "MousePointerIcon", label: "Select", hint: "Select, move, resize and rotate objects", hasPopover: false },
  { id: "ink.select.lasso", tab: "Ink → Select", group: "Select", icon: "LassoIcon", label: "Lasso", hint: "Select marks by circling them", hasPopover: false },

  // Object group
  { id: "ink.select.delete", tab: "Ink → Select", group: "Object", icon: "Trash2", label: "Delete", hint: "Delete the selected object", hasPopover: false },
  { id: "ink.select.front", tab: "Ink → Select", group: "Object", icon: "Layers", label: "Front", hint: "Bring to front", hasPopover: false },
  { id: "ink.select.back", tab: "Ink → Select", group: "Object", icon: "Layers", label: "Back", hint: "Send to back", hasPopover: false },

  // Strokes group
  { id: "ink.select.strokes.apply", tab: "Ink → Select", group: "Strokes", icon: "Check", label: "Apply", hint: "Commit the move, scale or rotation", hasPopover: false },
  { id: "ink.select.strokes.recolor", tab: "Ink → Select", group: "Strokes", icon: "Droplets", label: "Recolor", hint: "Paint the selection with the current ink", hasPopover: false },
  { id: "ink.select.strokes.delete", tab: "Ink → Select", group: "Strokes", icon: "Trash2", label: "Delete", hint: "Delete the selected marks", hasPopover: false },
  { id: "ink.select.strokes.deselect", tab: "Ink → Select", group: "Strokes", icon: "X", label: "Deselect", hint: "Clear the selection", hasPopover: false },

  // Transform group
  { id: "ink.select.transform.studio", tab: "Ink → Select", group: "Transform", icon: "SquareDashedMousePointer", label: "Selection studio", hint: "Move, scale and rotate the selection precisely", hasPopover: true },

  // ─── Ink → Paper Sub-tab ────────────────────────────────────────────────
  // Template group
  { id: "ink.paper.template", tab: "Ink → Paper", group: "Template", icon: "FileText", label: "Template", hint: "Paper template", hasPopover: false },
  { id: "ink.paper.tone", tab: "Ink → Paper", group: "Template", icon: "Palette", label: "Tone", hint: "Paper tone", hasPopover: false },

  // Page size group
  { id: "ink.paper.size", tab: "Ink → Paper", group: "Page size", icon: "FileText", label: "Page size", hint: "Page size", hasPopover: false },

  // Pages group
  { id: "ink.paper.prev", tab: "Ink → Paper", group: "Pages", icon: "ChevronLeft", label: "Previous page", hint: "Previous page", hasPopover: false },
  { id: "ink.paper.next", tab: "Ink → Paper", group: "Pages", icon: "ChevronRight", label: "Next page", hint: "Next page", hasPopover: false },

  // Studio group
  { id: "ink.paper.studio", tab: "Ink → Paper", group: "Studio", icon: "Layers", label: "Paper studio", hint: "All paper options in one place", hasPopover: true },
  { id: "ink.paper.clear", tab: "Ink → Paper", group: "Studio", icon: "Trash2", label: "Clear page", hint: "Remove every mark on this page", hasPopover: false },

  // ─── Ink → Smart ink Sub-tab ────────────────────────────────────────────
  // Recognise group
  { id: "ink.smart.recognize.text", tab: "Ink → Smart ink", group: "Recognise", icon: "ScanText", label: "Handwriting", hint: "Turn the lasso selection into text", hasPopover: false },
  { id: "ink.smart.recognize.math", tab: "Ink → Smart ink", group: "Recognise", icon: "Sigma", label: "Equation", hint: "Turn handwritten maths into LaTeX", hasPopover: false },

  // Results and search group
  { id: "ink.smart.results", tab: "Ink → Smart ink", group: "Results and search", icon: "BookOpen", label: "Results & search", hint: "Recognised text, insert it on the page, search all handwriting", hasPopover: true },

  // ─── Ink → Audio Sub-tab ────────────────────────────────────────────────
  // Record group
  { id: "ink.audio.record", tab: "Ink → Audio", group: "Record", icon: "Mic", label: "Record", hint: "Record audio while you write", hasPopover: false },

  // Playback group
  { id: "ink.audio.play", tab: "Ink → Audio", group: "Playback", icon: "Play", label: "Play", hint: "Play the recording and redraw the page", hasPopover: false },
  { id: "ink.audio.replayInk", tab: "Ink → Audio", group: "Playback", icon: "History", label: "Replay ink", hint: "Replay the strokes without sound", hasPopover: false },

  // Manage group
  { id: "ink.audio.studio", tab: "Ink → Audio", group: "Manage", icon: "Mic", label: "Audio studio", hint: "Scrub through the recording", hasPopover: true },
  { id: "ink.audio.clear", tab: "Ink → Audio", group: "Manage", icon: "MicOff", label: "Remove audio", hint: "Delete the recording from this page", hasPopover: false },

  // ─── Table Contextual Tab ───────────────────────────────────────────────
  // Insert group
  { id: "table.insert", tab: "Table", group: "Insert", icon: "Table", label: "Insert table", hint: "Insert a table — hover the grid or type a size", hasPopover: false },
  { id: "table.fromCsv", tab: "Table", group: "Insert", icon: "FileSpreadsheet", label: "From CSV/TSV", hint: "Insert a .csv or .tsv file as a table", hasPopover: false },
  { id: "table.fromXlsx", tab: "Table", group: "Insert", icon: "Upload", label: "From Excel (.xlsx)", hint: "Insert from an Excel workbook", hasPopover: false },

  // Table tools group (TableTools component - not individual buttons)

  // Arrange group
  { id: "table.sortAsc", tab: "Table", group: "Arrange", icon: "ArrowDownAZ", label: "Sort A–Z", hint: "Sort the rows by the column under the cursor", hasPopover: false },
  { id: "table.sortDesc", tab: "Table", group: "Arrange", icon: "ArrowUpAZ", label: "Sort Z–A", hint: "Sort the rows in reverse", hasPopover: false },
  { id: "table.moveRowUp", tab: "Table", group: "Arrange", icon: "ArrowUp", label: "Row up", hint: "Move this row up", hasPopover: false },
  { id: "table.moveRowDown", tab: "Table", group: "Arrange", icon: "ArrowDown", label: "Row down", hint: "Move this row down", hasPopover: false },
  { id: "table.moveColLeft", tab: "Table", group: "Arrange", icon: "ArrowLeft", label: "Col left", hint: "Move this column left", hasPopover: false },
  { id: "table.moveColRight", tab: "Table", group: "Arrange", icon: "ArrowRight", label: "Col right", hint: "Move this column right", hasPopover: false },
  { id: "table.duplicateRow", tab: "Table", group: "Arrange", icon: "CopyPlus", label: "Duplicate row", hint: "Copy this row below itself", hasPopover: false },
  { id: "table.transpose", tab: "Table", group: "Arrange", icon: "RotateCw", label: "Transpose", hint: "Swap rows and columns", hasPopover: false },

  // Data group
  { id: "table.sumRow", tab: "Table", group: "Data", icon: "Sigma", label: "Sum row", hint: "Add a Total row summing the numeric columns", hasPopover: false },
  { id: "table.averageRow", tab: "Table", group: "Data", icon: "Sigma", label: "Average row", hint: "Add an Average row", hasPopover: false },
  { id: "table.clearCells", tab: "Table", group: "Data", icon: "Eraser", label: "Clear cells", hint: "Empty every data cell, keep the header", hasPopover: false },
  { id: "table.tidy", tab: "Table", group: "Data", icon: "Wand2", label: "Tidy up", hint: "Align the | marks so the table is easy to read as text", hasPopover: false },

  // Convert group
  { id: "table.textToTable", tab: "Table", group: "Convert", icon: "TableProperties", label: "Text → table", hint: "Turn the selected CSV / TSV lines into a table", hasPopover: true },
  { id: "table.copyCsv", tab: "Table", group: "Convert", icon: "Download", label: "Copy as CSV", hint: "Copy this table as CSV text", hasPopover: false },

  // Export group
  { id: "table.exportXlsx", tab: "Table", group: "Export", icon: "FileX", label: "Excel (.xlsx)", hint: "Export this table as .xlsx", hasPopover: false },
  { id: "table.exportCsv", tab: "Table", group: "Export", icon: "FileSpreadsheet", label: "CSV (.csv)", hint: "Export this table as .csv", hasPopover: false },

  // ─── Code Contextual Tab ────────────────────────────────────────────────
  // Block tools group
  { id: "code.language", tab: "Code", group: "Block tools", icon: "Replace", label: "Language", hint: "Change the language of the block under the cursor", hasPopover: true },
  { id: "code.snippet", tab: "Code", group: "Block tools", icon: "SquareTerminal", label: "Snippet", hint: "Insert a small example block", hasPopover: true },
  { id: "code.unwrap", tab: "Code", group: "Block tools", icon: "PackageOpen", label: "Unwrap", hint: "Remove the fences and keep the code", hasPopover: false },
  { id: "code.copy", tab: "Code", group: "Block tools", icon: "ClipboardCopy", label: "Copy code", hint: "Copy the code of this block", hasPopover: false },

  // Edit lines group
  { id: "code.comment", tab: "Code", group: "Edit lines", icon: "MessageSquareOff", label: "Comment", hint: "Comment or uncomment the selected lines", hasPopover: false },
  { id: "code.indent", tab: "Code", group: "Edit lines", icon: "IndentIncrease", label: "Indent", hint: "Indent lines", hasPopover: false },
  { id: "code.outdent", tab: "Code", group: "Edit lines", icon: "IndentDecrease", label: "Outdent", hint: "Outdent lines", hasPopover: false },
  { id: "code.duplicate", tab: "Code", group: "Edit lines", icon: "CopyPlus", label: "Duplicate", hint: "Duplicate the current line", hasPopover: false },
  { id: "code.moveUp", tab: "Code", group: "Edit lines", icon: "ArrowUp", label: "Move line up", hint: "Move line up", hasPopover: false },
  { id: "code.moveDown", tab: "Code", group: "Edit lines", icon: "ArrowDown", label: "Move line down", hint: "Move line down", hasPopover: false },
  { id: "code.deleteLine", tab: "Code", group: "Edit lines", icon: "Trash2", label: "Delete line", hint: "Delete the current line", hasPopover: false },

  // JSON group
  { id: "code.prettyJson", tab: "Code", group: "JSON", icon: "FileJson", label: "Pretty", hint: "Format the JSON in the selection or in the block under the cursor", hasPopover: false },
  { id: "code.minifyJson", tab: "Code", group: "JSON", icon: "Shrink", label: "Minify", hint: "Squeeze the JSON onto one line", hasPopover: false },
];

// Sync rail icon (from SpaceRail.jsx)
const SYNC_RAIL_BUTTON = {
  id: "rail.sync",
  tab: "Rail (Vault)",
  group: "Spaces",
  icon: "ExternalLink",
  label: "Sync",
  hint: "Sync spaces (not available yet)",
  hasPopover: false,
};

// ──────────────────────────────────────────────────────────────────────────
// ICON COMPONENT — renders Lucide icons at specified size with theme color
// ──────────────────────────────────────────────────────────────────────────

const LucideIconCache = {};

async function getLucideIcon(name) {
  if (LucideIconCache[name]) return LucideIconCache[name];
  try {
    const mod = await import("lucide-react");
    const Icon = mod[name];
    if (Icon) {
      LucideIconCache[name] = Icon;
      return Icon;
    }
  } catch (e) {
    // Icon not found
  }
  LucideIconCache[name] = null;
  return null;
}

function IconDisplay({ name, size = 16 }) {
  const [Icon, setIcon] = useState(null);

  useMemo(() => {
    getLucideIcon(name).then(setIcon);
  }, [name]);

  if (!Icon) {
    return (
      <span
        className="inline-flex items-center justify-center font-mono text-[10px] text-muted-foreground"
        style={{ width: size, height: size }}
        title={`Icon not found: ${name}`}
      >
        ?
      </span>
    );
  }

  return (
    <Icon
      className="text-current"
      style={{ width: size, height: size, flexShrink: 0 }}
      aria-hidden="true"
    />
  );
}

// ──────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ──────────────────────────────────────────────────────────────────────────

function DevIconsPage() {
  const [filterTab, setFilterTab] = useState("");

  // Group buttons by tab
  const buttonsByTab = useMemo(() => {
    const grouped = {};
    ALL_BUTTONS.forEach((btn) => {
      if (!grouped[btn.tab]) grouped[btn.tab] = [];
      grouped[btn.tab].push(btn);
    });
    // Add sync rail button
    if (!grouped[SYNC_RAIL_BUTTON.tab]) grouped[SYNC_RAIL_BUTTON.tab] = [];
    grouped[SYNC_RAIL_BUTTON.tab].push(SYNC_RAIL_BUTTON);
    return grouped;
  }, []);

  // Analyze for issues
  const analysis = useMemo(() => {
    const issues = {
      duplicateIcons: [],   // same icon used by 2+ buttons in SAME tab for different actions
      missingIconOrLabel: [], // button has no icon AND no text label
    };

    // Check each tab for duplicate icons
    Object.entries(buttonsByTab).forEach(([tab, buttons]) => {
      const iconUsage = {};
      buttons.forEach((btn) => {
        // Only check Lucide icons (not "text" or custom ink icons)
        if (btn.icon && btn.icon !== "text" && !btn.icon.endsWith("Icon")) {
          if (!iconUsage[btn.icon]) iconUsage[btn.icon] = [];
          iconUsage[btn.icon].push(btn);
        }
      });

      Object.entries(iconUsage).forEach(([icon, btns]) => {
        if (btns.length > 1) {
          // Check if they have different actions (different id or label)
          const uniqueActions = new Set(btns.map((b) => `${b.id}:${b.label}`));
          if (uniqueActions.size > 1) {
            issues.duplicateIcons.push({
              tab,
              icon,
              buttons: btns.map((b) => `${b.id} (${b.label})`),
            });
          }
        }
      });
    });

    // Check for buttons with no icon AND no label
    ALL_BUTTONS.forEach((btn) => {
      const hasIcon = btn.icon && btn.icon !== "text";
      const hasLabel = btn.label && btn.label.trim().length > 0;
      if (!hasIcon && !hasLabel) {
        issues.missingIconOrLabel.push(`${btn.tab}: ${btn.id} (${btn.group})`);
      }
    });

    return issues;
  }, [buttonsByTab]);

  const allTabs = Object.keys(buttonsByTab).sort();
  const filteredTabs = filterTab ? [filterTab] : allTabs;

  // Generate plain-text copy
  const plainText = useMemo(() => {
    let out = "RIBBON BUTTON INVENTORY\n";
    out += "=".repeat(80) + "\n\n";
    allTabs.forEach((tab) => {
      out += `TAB: ${tab}\n`;
      out += "-".repeat(80) + "\n";
      buttonsByTab[tab].forEach((btn) => {
        out += `  ${btn.group} > ${btn.id} | ${btn.icon} | ${btn.label} | ${btn.hint} | popover: ${btn.hasPopover}\n`;
      });
      out += "\n";
    });
    return out;
  }, [buttonsByTab, allTabs]);

  return (
    <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto" }}>
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ marginBottom: "8px", fontSize: "24px", fontWeight: 600 }}>🔧 Dev: All Ribbon Buttons</h1>
        <p style={{ color: "var(--muted-foreground)", fontSize: "14px", maxWidth: "800px" }}>
          Only visible in <code>npm run dev</code>. Lists every ribbon button from all tabs (Home, Insert, Design, Layout, View, Share, Ink + 6 sub-tabs, Table, Code)
          with tab, group, button ID, Lucide icon name (or "text"/custom), tooltip, and popover flag.
          Icons shown at 16px and 24px in current theme colors. Strings are English only on this dev page.
        </p>
      </header>

      {/* Tab Filter */}
      <div style={{ marginBottom: "24px", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
        <label style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>Filter by tab:</label>
        <select
          value={filterTab}
          onChange={(e) => setFilterTab(e.target.value)}
          className="h-8 rounded-md border border-border/70 bg-card/60 px-2 text-[12px] outline-none focus:border-primary/40"
        >
          <option value="">All tabs</option>
          {allTabs.map((tab) => (
            <option key={tab} value={tab}>{tab}</option>
          ))}
        </select>
        <span style={{ fontSize: "12px", color: "var(--muted-foreground)", marginLeft: "16px" }}>
          Total buttons: <strong>{ALL_BUTTONS.length + 1}</strong> (incl. rail)
        </span>
      </div>

      {/* Analysis / Warnings */}
      <details open style={{ marginBottom: "24px", padding: "16px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--accent)" }}>
        <summary style={{ fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>
          📊 Icon Analysis — {analysis.duplicateIcons.length} duplicate-icon warnings, {analysis.missingIconOrLabel.length} missing icon/label warnings
        </summary>

        <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "16px" }}>
          {/* Duplicate Icons */}
          <div style={{ padding: "12px", background: "var(--card)", borderRadius: "6px", border: "1px solid var(--border)" }}>
            <h3 style={{ margin: "0 0 8px", color: "var(--destructive)", fontSize: "13px" }}>🔄 Duplicate Icons in Same Tab (different actions)</h3>
            {analysis.duplicateIcons.length === 0 ? (
              <p style={{ color: "var(--muted-foreground)", margin: 0, fontSize: "12px" }}>None</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "11px" }}>
                {analysis.duplicateIcons.map((item, i) => (
                  <li key={i} style={{ marginBottom: "8px" }}>
                    <strong>{item.tab} → {item.icon}</strong> — {item.buttons.join(", ")}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Missing Icon or Label */}
          <div style={{ padding: "12px", background: "var(--card)", borderRadius: "6px", border: "1px solid var(--border)" }}>
            <h3 style={{ margin: "0 0 8px", color: "var(--destructive)", fontSize: "13px" }}>⚠️ Buttons with No Icon AND No Label</h3>
            {analysis.missingIconOrLabel.length === 0 ? (
              <p style={{ color: "var(--muted-foreground)", margin: 0, fontSize: "12px" }}>None</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "11px" }}>
                {analysis.missingIconOrLabel.map((item, i) => (
                  <li key={i} style={{ marginBottom: "4px" }}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </details>

      {/* Button Tables by Tab */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {filteredTabs.map((tab) => {
          const buttons = buttonsByTab[tab];
          const groups = {};
          buttons.forEach((btn) => {
            if (!groups[btn.group]) groups[btn.group] = [];
            groups[btn.group].push(btn);
          });

          return (
            <section key={tab} style={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
              <header style={{ padding: "12px 16px", background: "var(--accent)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>{tab}</h2>
                <span className="font-mono text-[11px] text-muted-foreground">{buttons.length} buttons</span>
              </header>
              <div style={{ padding: "16px" }}>
                {Object.entries(groups).map(([groupName, groupButtons]) => (
                  <div key={groupName} style={{ marginBottom: "16px" }}>
                    <h3 style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{groupName}</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "8px" }}>
                      {groupButtons.map((btn) => {
                        const isDuplicate = analysis.duplicateIcons.some(
                          (d) => d.tab === btn.tab && d.icon === btn.icon && d.buttons.some((b) => b.includes(btn.id))
                        );
                        const isMissing = analysis.missingIconOrLabel.includes(`${btn.tab}: ${btn.id} (${btn.group})`);
                        const showWarning = isDuplicate || isMissing;

                        return (
                          <div
                            key={btn.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "8px 10px",
                              background: "var(--card)",
                              border: "1px solid var(--border)",
                              borderRadius: "6px",
                              borderLeft: showWarning ? "3px solid var(--destructive)" : "3px solid transparent",
                            }}
                            title={showWarning ? (isDuplicate ? "Duplicate icon in this tab" : "No icon and no label") : ""}
                          >
                            {/* Warning indicator */}
                            {showWarning && (
                              <span
                                className="flex-shrink-0"
                                style={{ width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}
                                title={isDuplicate ? "Duplicate icon in this tab" : "No icon and no label"}
                              >
                                ⚠
                              </span>
                            )}

                            {/* Icon at 16px */}
                            <div style={{ width: "24px", display: "flex", justifyContent: "center" }}>
                              <IconDisplay name={btn.icon} size={16} />
                            </div>

                            {/* Icon at 24px */}
                            <div style={{ width: "32px", display: "flex", justifyContent: "center" }}>
                              <IconDisplay name={btn.icon} size={24} />
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                <code className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-accent/50" style={{ whiteSpace: "nowrap" }}>{btn.id}</code>
                                {btn.hasPopover && (
                                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary" title="Opens a popover">⬢ popover</span>
                                )}
                              </div>
                              <div className="font-medium text-[12px] truncate" style={{ color: "var(--foreground)" }}>{btn.label || "(no label)"}</div>
                              <div className="font-mono text-[10px] text-muted-foreground truncate">{btn.hint}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Plain-text copy box */}
      <details style={{ marginTop: "32px", padding: "16px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--accent)" }}>
        <summary style={{ fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>
          📋 Plain-text Copy (read-only)
        </summary>
        <div style={{ marginTop: "12px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <button
            onClick={() => {
              navigator.clipboard.writeText(plainText);
            }}
            className="h-8 rounded-md border border-border/70 bg-card/60 px-3 text-[12px] font-medium text-foreground hover:bg-accent transition"
          >
            Copy to Clipboard
          </button>
          <span className="font-mono text-[11px] text-muted-foreground self-center">
            {plainText.split("\n").length - 1} lines
          </span>
        </div>
        <textarea
          readOnly
          value={plainText}
          style={{
            marginTop: "12px",
            width: "100%",
            minHeight: "300px",
            maxHeight: "500px",
            padding: "12px",
            fontSize: "11px",
            fontFamily: "monospace",
            lineHeight: "1.5",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            background: "var(--background)",
            color: "var(--foreground)",
            outline: "none",
            resize: "vertical",
          }}
          aria-label="Full button inventory as plain text"
        />
      </details>
    </div>
  );
}

export default DevIconsPage;