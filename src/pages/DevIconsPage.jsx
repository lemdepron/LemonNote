import { useMemo } from "react";

/**
 * Development-only page at /dev/icons showing every ribbon button
 * with its ID, icon, tooltip, and tab.
 * Only renders when running `npm run dev`.
 */

// All button data extracted from ribbon-registry.js and tab files
const ALL_BUTTONS = [
  // Home tab - from ribbon-registry.js
  { id: "home.undo", tab: "Home", group: "Clipboard", icon: "Undo2", label: "Undo", hint: "Undo the last edit" },
  { id: "home.redo", tab: "Home", group: "Clipboard", icon: "Redo2", label: "Redo", hint: "Redo" },
  { id: "home.cut", tab: "Home", group: "Clipboard", icon: "Scissors", label: "Cut", hint: "Cut the selection" },
  { id: "home.copy", tab: "Home", group: "Clipboard", icon: "Copy", label: "Copy", hint: "Copy the selection" },
  { id: "home.selectAll", tab: "Home", group: "Clipboard", icon: "SquareDashedMousePointer", label: "Select all", hint: "Select the whole note" },
  { id: "home.formatPainter", tab: "Home", group: "Clipboard", icon: "Brush", label: "Format painter", hint: "Copy formatting from selection" },

  { id: "home.bold", tab: "Home", group: "Font", icon: "Bold", label: "Bold", hint: "Bold" },
  { id: "home.italic", tab: "Home", group: "Font", icon: "Italic", label: "Italic", hint: "Italic" },
  { id: "home.underline", tab: "Home", group: "Font", icon: "Underline", label: "Underline", hint: "Underline" },
  { id: "home.strike", tab: "Home", group: "Font", icon: "Strikethrough", label: "Strikethrough", hint: "Strikethrough" },
  { id: "home.highlight", tab: "Home", group: "Font", icon: "Highlighter", label: "Highlight", hint: "Highlight (yellow)" },
  { id: "home.inlineCode", tab: "Home", group: "Font", icon: "Code", label: "Inline code", hint: "Inline code" },
  { id: "home.clearFormatting", tab: "Home", group: "Font", icon: "Eraser", label: "Clear formatting", hint: "Clear formatting on the selection or the line" },

  { id: "home.bulletList", tab: "Home", group: "Lists", icon: "List", label: "Bulleted list", hint: "Bulleted list" },
  { id: "home.numberList", tab: "Home", group: "Lists", icon: "ListOrdered", label: "Numbered list", hint: "Numbered list" },
  { id: "home.checklist", tab: "Home", group: "Lists", icon: "ListChecks", label: "Checklist", hint: "Checklist" },
  { id: "home.quote", tab: "Home", group: "Lists", icon: "Quote", label: "Quote line", hint: "Quote" },
  { id: "home.indent", tab: "Home", group: "Lists", icon: "IndentIncrease", label: "Indent", hint: "Indent" },
  { id: "home.outdent", tab: "Home", group: "Lists", icon: "IndentDecrease", label: "Outdent", hint: "Outdent" },

  { id: "home.alignLeft", tab: "Home", group: "Align", icon: "AlignLeft", label: "Align left", hint: "Align left" },
  { id: "home.alignCenter", tab: "Home", group: "Align", icon: "AlignCenter", label: "Centre", hint: "Centre" },
  { id: "home.alignRight", tab: "Home", group: "Align", icon: "AlignRight", label: "Align right", hint: "Align right" },
  { id: "home.alignJustify", tab: "Home", group: "Align", icon: "AlignJustify", label: "Justify", hint: "Justify" },
  { id: "home.ltr", tab: "Home", group: "Align", icon: "Pilcrow", label: "LTR", hint: "Left-to-right text direction" },
  { id: "home.rtl", tab: "Home", group: "Align", icon: "FlipHorizontal2", label: "RTL", hint: "Right-to-left direction, for Arabic" },
  { id: "home.dirAuto", tab: "Home", group: "Align", icon: "ArrowLeftRight", label: "Auto", hint: "Auto text direction" },

  { id: "home.sortAsc", tab: "Home", group: "Lines", icon: "ArrowDownAZ", label: "Sort A–Z", hint: "Sort the selected lines A to Z (numbers sort by value)" },
  { id: "home.sortDesc", tab: "Home", group: "Lines", icon: "ArrowUpAZ", label: "Sort Z–A", hint: "Sort the selected lines Z to A" },
  { id: "home.reverse", tab: "Home", group: "Lines", icon: "ArrowLeftRight", label: "Reverse", hint: "Reverse the order of the selected lines" },
  { id: "home.unique", tab: "Home", group: "Lines", icon: "ListX", label: "Unique", hint: "Remove duplicate lines" },
  { id: "home.noBlanks", tab: "Home", group: "Lines", icon: "Minus", label: "No blanks", hint: "Remove blank lines" },
  { id: "home.join", tab: "Home", group: "Lines", icon: "Merge", label: "Join", hint: "Join the selected lines into one" },
  { id: "home.numberLines", tab: "Home", group: "Lines", icon: "Hash", label: "Number", hint: "Number the selected lines" },
  { id: "home.trim", tab: "Home", group: "Lines", icon: "WrapText", label: "Trim", hint: "Trim spaces at the end of each line" },

  { id: "home.resetTypography", tab: "Home", group: "Typography", icon: "Trash2", label: "Reset typography", hint: "Reset the typography of this note to the app default" },

  { id: "home.todo", tab: "Home", group: "Tasks", icon: "Circle", label: "TODO", hint: "Mark the line TODO, or clear it if it already is" },
  { id: "home.doing", tab: "Home", group: "Tasks", icon: "Timer", label: "DOING", hint: "Mark the line DOING, or clear it if it already is" },
  { id: "home.done", tab: "Home", group: "Tasks", icon: "CircleCheck", label: "DONE", hint: "Mark the line DONE, or clear it if it already is" },
  { id: "home.nextStatus", tab: "Home", group: "Tasks", icon: "ListRestart", label: "Next status", hint: "Cycle TODO → DOING → DONE → TODO" },
  { id: "home.clearStatus", tab: "Home", group: "Tasks", icon: "CircleDashed", label: "Clear", hint: "Remove the status words from the selected lines" },

  // Home tab - AI buttons (from HomeTab.jsx)
  { id: "home.ai.translate", tab: "Home", group: "AI", icon: "Globe", label: "Translate", hint: "Translate the text to English" },
  { id: "home.ai.summarize", tab: "Home", group: "AI", icon: "List", label: "Summarize", hint: "Summarize the text" },
  { id: "home.ai.fixGrammar", tab: "Home", group: "AI", icon: "Wand2", label: "Fix grammar", hint: "Fix grammar and spelling" },
  { id: "home.ai.continue", tab: "Home", group: "AI", icon: "ArrowRight", label: "Continue writing", hint: "Continue writing from the cursor" },
  { id: "home.ai.arabicEnglish", tab: "Home", group: "AI", icon: "Languages", label: "Arabic ↔ English", hint: "Translate between Arabic and English" },

  // Home tab - Search & Note Type
  { id: "home.findTags", tab: "Home", group: "Search", icon: "Search", label: "Find tags", hint: "Find and filter tags" },

  // Insert tab - from ribbon-registry.js + InsertTab.jsx
  { id: "insert.image", tab: "Insert", group: "Pictures", icon: "ImagePlus", label: "Image file", hint: "Insert an image from your computer" },
  { id: "insert.imageUrl", tab: "Insert", group: "Pictures", icon: "Link2", label: "Image URL", hint: "Insert an image from a web address" },
  { id: "insert.figure", tab: "Insert", group: "Pictures", icon: "ImagePlus", label: "Figure", hint: "Insert an image with caption" },

  { id: "insert.gif", tab: "Insert", group: "Media", icon: "FileVideo", label: "GIF", hint: "Insert an animated GIF/WEBP/APNG" },
  { id: "insert.file", tab: "Insert", group: "Media", icon: "Paperclip", label: "File attachment", hint: "Attach any file" },
  { id: "insert.audio", tab: "Insert", group: "Media", icon: "Mic", label: "Record audio", hint: "Record audio" },

  { id: "insert.noteLink", tab: "Insert", group: "Links", icon: "Link2", label: "Note link", hint: "Link another note with [[ ]]" },
  { id: "insert.bookmark", tab: "Insert", group: "Links", icon: "Bookmark", label: "Bookmark", hint: "Insert a bookmark" },
  { id: "insert.webLink", tab: "Insert", group: "Links", icon: "Link", label: "Web link", hint: "Turn the selection into a web link" },
  { id: "insert.email", tab: "Insert", group: "Links", icon: "AtSign", label: "Email", hint: "Insert an email link" },
  { id: "insert.tag", tab: "Insert", group: "Links", icon: "Hash", label: "Tag", hint: "Insert a #tag" },
  { id: "insert.bookmarks", tab: "Insert", group: "Bookmarks", icon: "Bookmark", label: "Bookmarks", hint: "Jump to a bookmark in this note" },

  { id: "insert.divider", tab: "Insert", group: "Blocks", icon: "Minus", label: "Divider", hint: "Horizontal line" },
  { id: "insert.callout", tab: "Insert", group: "Blocks", icon: "MessageSquareQuote", label: "Callout", hint: "Highlighted note box" },
  { id: "insert.collapsible", tab: "Insert", group: "Blocks", icon: "ChevronsDownUp", label: "Collapsible", hint: "A section that opens and closes" },
  { id: "insert.footnote", tab: "Insert", group: "Blocks", icon: "Footprints", label: "Footnote", hint: "Add a footnote marker here and its text at the end of the note" },
  { id: "insert.lineBreak", tab: "Insert", group: "Blocks", icon: "CornerDownLeft", label: "Line break", hint: "Force a new line inside a paragraph" },
  { id: "insert.outline", tab: "Insert", group: "Blocks", icon: "ListTree", label: "Outline", hint: "Insert a list of this note's headings" },
  { id: "insert.quoteBlock", tab: "Insert", group: "Blocks", icon: "TextQuote", label: "Quote", hint: "Block quote" },
  { id: "insert.chart", tab: "Insert", group: "Blocks", icon: "BarChart", label: "Chart", hint: "Create a chart from a table" },

  { id: "insert.symbols", tab: "Insert", group: "Symbols", icon: "Omega", label: "Symbols", hint: "Special characters" },

  { id: "insert.codeBlock", tab: "Insert", group: "Code block", icon: "SquareCode", label: "Code block", hint: "Insert a fenced code block" },
  { id: "insert.inlineCode", tab: "Insert", group: "Code block", icon: "Braces", label: "Inline code", hint: "Inline code" },
  { id: "insert.fence.js", tab: "Insert", group: "Code block", icon: "SquareCode", label: "JS", hint: "Insert a JavaScript code block" },
  { id: "insert.fence.ts", tab: "Insert", group: "Code block", icon: "SquareCode", label: "TS", hint: "Insert a TypeScript code block" },
  { id: "insert.fence.py", tab: "Insert", group: "Code block", icon: "SquareCode", label: "Py", hint: "Insert a Python code block" },
  { id: "insert.fence.rs", tab: "Insert", group: "Code block", icon: "SquareCode", label: "Rust", hint: "Insert a Rust code block" },
  { id: "insert.fence.go", tab: "Insert", group: "Code block", icon: "SquareCode", label: "Go", hint: "Insert a Go code block" },
  { id: "insert.fence.java", tab: "Insert", group: "Code block", icon: "SquareCode", label: "Java", hint: "Insert a Java code block" },
  { id: "insert.fence.cpp", tab: "Insert", group: "Code block", icon: "SquareCode", label: "C++", hint: "Insert a C++ code block" },
  { id: "insert.fence.sql", tab: "Insert", group: "Code block", icon: "SquareCode", label: "SQL", hint: "Insert a SQL code block" },
  { id: "insert.fence.sh", tab: "Insert", group: "Code block", icon: "SquareCode", label: "Shell", hint: "Insert a Shell code block" },
  { id: "insert.fence.json", tab: "Insert", group: "Code block", icon: "SquareCode", label: "JSON", hint: "Insert a JSON code block" },
  { id: "insert.fence.md", tab: "Insert", group: "Code block", icon: "SquareCode", label: "MD", hint: "Insert a Markdown code block" },
  { id: "insert.fence.yaml", tab: "Insert", group: "Code block", icon: "SquareCode", label: "YAML", hint: "Insert a YAML code block" },
  { id: "insert.fence.html", tab: "Insert", group: "Code block", icon: "SquareCode", label: "HTML", hint: "Insert an HTML code block" },
  { id: "insert.fence.css", tab: "Insert", group: "Code block", icon: "SquareCode", label: "CSS", hint: "Insert a CSS code block" },
  { id: "insert.fence.dockerfile", tab: "Insert", group: "Code block", icon: "SquareCode", label: "Docker", hint: "Insert a Dockerfile code block" },
  { id: "insert.fence.plain", tab: "Insert", group: "Code block", icon: "SquareCode", label: "Plain", hint: "Insert a plain text code block" },

  { id: "insert.table", tab: "Insert", group: "Table", icon: "Table", label: "Table", hint: "Insert a table — hover the grid or type a size" },
  { id: "insert.card", tab: "Insert", group: "Cards", icon: "Layers", label: "Make card", hint: "Turn the selected text into a flashcard" },

  { id: "insert.shape.rect", tab: "Insert", group: "Shapes", icon: "Square", label: "Rectangle", hint: "Insert a rectangle shape" },
  { id: "insert.shape.rounded", tab: "Insert", group: "Shapes", icon: "Square", label: "Rounded rect", hint: "Insert a rounded rectangle shape" },
  { id: "insert.shape.ellipse", tab: "Insert", group: "Shapes", icon: "Circle", label: "Ellipse", hint: "Insert an ellipse shape" },
  { id: "insert.shape.line", tab: "Insert", group: "Shapes", icon: "LineIcon", label: "Line", hint: "Insert a line shape" },
  { id: "insert.shape.arrow", tab: "Insert", group: "Shapes", icon: "LineIcon", label: "Arrow", hint: "Insert an arrow shape" },
  { id: "insert.shape.triangle", tab: "Insert", group: "Shapes", icon: "Triangle", label: "Triangle", hint: "Insert a triangle shape" },
  { id: "insert.shape.star", tab: "Insert", group: "Shapes", icon: "Star", label: "Star", hint: "Insert a star shape" },

  { id: "insert.sticker", tab: "Insert", group: "Stickers", icon: "Star", label: "Stickers", hint: "Insert a sticker" },

  { id: "insert.textbox", tab: "Insert", group: "Text notes", icon: "Square", label: "Text box", hint: "Insert a text box" },
  { id: "insert.sticky", tab: "Insert", group: "Text notes", icon: "Square", label: "Sticky note", hint: "Insert a sticky note" },

  { id: "insert.today", tab: "Insert", group: "Time & Calendar", icon: "CalendarPlus", label: "Today", hint: "Open or create today's daily note" },
  { id: "insert.yesterday", tab: "Insert", group: "Time & Calendar", icon: "CalendarClock", label: "Yesterday", hint: "Open yesterday's note" },
  { id: "insert.tomorrow", tab: "Insert", group: "Time & Calendar", icon: "CalendarCheck", label: "Tomorrow", hint: "Open or create tomorrow's note" },
  { id: "insert.prevDay", tab: "Insert", group: "Time & Calendar", icon: "ArrowLeft", label: "Previous", hint: "The day, week or month before this note" },
  { id: "insert.nextDay", tab: "Insert", group: "Time & Calendar", icon: "ArrowRight", label: "Next", hint: "The day, week or month after this note" },
  { id: "insert.thisWeek", tab: "Insert", group: "Time & Calendar", icon: "CalendarRange", label: "This week", hint: "Open or create this week's note" },
  { id: "insert.thisMonth", tab: "Insert", group: "Time & Calendar", icon: "CalendarDays", label: "This month", hint: "Open or create this month's note" },
  { id: "insert.date", tab: "Insert", group: "Time & Calendar", icon: "CalendarDays", label: "Today's date", hint: "Insert 2026-11-06 style date" },
  { id: "insert.time", tab: "Insert", group: "Time & Calendar", icon: "Clock", label: "Time", hint: "Insert the current time" },
  { id: "insert.logEntry", tab: "Insert", group: "Time & Calendar", icon: "ListOrdered", label: "Log entry", hint: "Start a new time-stamped log line" },
  { id: "insert.dateFormats", tab: "Insert", group: "Time & Calendar", icon: "CalendarDays", label: "Formats", hint: "Every date and time format" },
  { id: "insert.linkDay", tab: "Insert", group: "Time & Calendar", icon: "Link2", label: "Link day", hint: "Insert a [[link]] to a day note" },
  { id: "insert.templates", tab: "Insert", group: "Time & Calendar", icon: "BookOpenCheck", label: "Templates", hint: "Ready-made journal blocks" },

  // Design tab - from DesignTab.jsx
  { id: "design.pageStyle", tab: "Design", group: "Page Style", icon: "Grid", label: "Page style", hint: "Background pattern for the reading and writing page" },
  { id: "design.pageGridSize", tab: "Design", group: "Page Style", icon: "Grid", label: "Grid spacing", hint: "Grid spacing (px)" },
  { id: "design.pageLineHeight", tab: "Design", group: "Page Style", icon: "Grid", label: "Line spacing", hint: "Line spacing (px)" },

  { id: "design.styleSet", tab: "Design", group: "Style sets", icon: "FileText", label: "Style sets", hint: "Document formatting presets" },

  { id: "design.themePreset", tab: "Design", group: "Themes", icon: "Circle", label: "Theme preset", hint: "Apply a theme preset to this note only" },
  { id: "design.themeAccent", tab: "Design", group: "Themes", icon: "Droplet", label: "Accent color", hint: "Pick an accent color for this note" },
  { id: "design.themeHeadingFont", tab: "Design", group: "Themes", icon: "Type", label: "Heading font", hint: "Heading font for this note" },
  { id: "design.themeBodyFont", tab: "Design", group: "Themes", icon: "Type", label: "Body font", hint: "Body font for this note" },

  { id: "design.paragraphPreset", tab: "Design", group: "Paragraph spacing", icon: "Type", label: "Paragraph preset", hint: "Paragraph spacing preset" },
  { id: "design.gap", tab: "Design", group: "Paragraph spacing", icon: "Type", label: "Gap", hint: "Space between paragraphs (em)" },
  { id: "design.lineHeight", tab: "Design", group: "Paragraph spacing", icon: "Type", label: "Line height", hint: "Line height" },

  { id: "design.pageColor", tab: "Design", group: "Page appearance", icon: "Droplet", label: "Page color", hint: "Background color for the page" },
  { id: "design.pageBorder", tab: "Design", group: "Page appearance", icon: "Square", label: "Page border", hint: "Page border style" },
  { id: "design.pageBorderColor", tab: "Design", group: "Page appearance", icon: "Hash", label: "Border color", hint: "Color of the page border" },
  { id: "design.hideTitle", tab: "Design", group: "Page appearance", icon: "Eye", label: "Hide page title", hint: "Hide the large title above the note body in reader view" },
  { id: "design.watermarkText", tab: "Design", group: "Page appearance", icon: "Eye", label: "Watermark text", hint: "Text to show as watermark (e.g. DRAFT, CONFIDENTIAL)" },
  { id: "design.watermarkColor", tab: "Design", group: "Page appearance", icon: "Droplet", label: "Watermark color", hint: "Color of the watermark text" },
  { id: "design.watermarkOpacity", tab: "Design", group: "Page appearance", icon: "Droplet", label: "Watermark opacity", hint: "Watermark opacity" },
  { id: "design.watermarkAngle", tab: "Design", group: "Page appearance", icon: "Droplet", label: "Watermark angle", hint: "Watermark angle" },

  { id: "design.titleFont", tab: "Design", group: "Page title style", icon: "Type", label: "Title font", hint: "Font for the page title" },
  { id: "design.titleSize", tab: "Design", group: "Page title style", icon: "Type", label: "Title size", hint: "Title font size (px)" },
  { id: "design.titleAlign", tab: "Design", group: "Page title style", icon: "Type", label: "Title alignment", hint: "Title alignment" },

  { id: "design.language", tab: "Design", group: "Language", icon: "Globe", label: "Language", hint: "Note language (for spell check and hyphenation)" },

  { id: "design.saveAsDefault", tab: "Design", group: "Defaults", icon: "Save", label: "Set as default", hint: "Save current note's design as the default for new notes" },
  { id: "design.loadDefault", tab: "Design", group: "Defaults", icon: "RotateCcw", label: "Apply default", hint: "Load the saved default style into this note" },
  { id: "design.resetDesign", tab: "Design", group: "Defaults", icon: "Trash2", label: "Reset to defaults", hint: "Clear all design settings on this note" },

  // Layout tab - from LayoutTab.jsx
  { id: "layout.pageSize", tab: "Layout", group: "Page setup", icon: "FileText", label: "Page size", hint: "Paper size for printing and PDF export" },
  { id: "layout.pageWidth", tab: "Layout", group: "Page setup", icon: "FileText", label: "Custom width", hint: "Custom page width (mm)" },
  { id: "layout.pageHeight", tab: "Layout", group: "Page setup", icon: "FileText", label: "Custom height", hint: "Custom page height (mm)" },
  { id: "layout.pageOrientation", tab: "Layout", group: "Page setup", icon: "FileText", label: "Orientation", hint: "Page orientation" },
  { id: "layout.pageMargins", tab: "Layout", group: "Page setup", icon: "FileText", label: "Margins", hint: "Page margins" },
  { id: "layout.marginTop", tab: "Layout", group: "Page setup", icon: "FileText", label: "Top margin", hint: "Top margin (mm)" },
  { id: "layout.marginRight", tab: "Layout", group: "Page setup", icon: "FileText", label: "Right margin", hint: "Right margin (mm)" },
  { id: "layout.marginBottom", tab: "Layout", group: "Page setup", icon: "FileText", label: "Bottom margin", hint: "Bottom margin (mm)" },
  { id: "layout.marginLeft", tab: "Layout", group: "Page setup", icon: "FileText", label: "Left margin", hint: "Left margin (mm)" },

  { id: "layout.columnCount", tab: "Layout", group: "Columns", icon: "Columns", label: "Columns", hint: "Number of columns in the reader" },
  { id: "layout.columnGap", tab: "Layout", group: "Columns", icon: "Columns", label: "Column gap", hint: "Gap between columns (em)" },
  { id: "layout.columnBreak", tab: "Layout", group: "Columns", icon: "GripVertical", label: "Column break", hint: "Insert a column break at the cursor" },
  { id: "layout.pageBreak", tab: "Layout", group: "Columns", icon: "FileText", label: "Page break", hint: "Insert a page break at the cursor" },

  { id: "layout.lineNumbers", tab: "Layout", group: "Editor", icon: "Maximize2", label: "Line numbers", hint: "Show line numbers in the writing box" },
  { id: "layout.hyphens", tab: "Layout", group: "Editor", icon: "Type", label: "Hyphenation", hint: "Hyphenation in the reader and editor" },

  { id: "layout.indentLeft", tab: "Layout", group: "Paragraph", icon: "AlignLeft", label: "Indent left", hint: "Indent left (em)" },
  { id: "layout.indentRight", tab: "Layout", group: "Paragraph", icon: "AlignRight", label: "Indent right", hint: "Indent right (em)" },
  { id: "layout.spacingBefore", tab: "Layout", group: "Paragraph", icon: "AlignLeft", label: "Spacing before", hint: "Spacing before (em)" },
  { id: "layout.spacingAfter", tab: "Layout", group: "Paragraph", icon: "AlignRight", label: "Spacing after", hint: "Spacing after (em)" },
  { id: "layout.alignLeft", tab: "Layout", group: "Paragraph", icon: "AlignLeft", label: "Align left", hint: "Align selected paragraphs left" },
  { id: "layout.alignCenter", tab: "Layout", group: "Paragraph", icon: "AlignCenter", label: "Centre", hint: "Centre selected paragraphs" },
  { id: "layout.alignRight", tab: "Layout", group: "Paragraph", icon: "AlignRight", label: "Align right", hint: "Align selected paragraphs right" },
  { id: "layout.alignJustify", tab: "Layout", group: "Paragraph", icon: "AlignJustify", label: "Justify", hint: "Justify selected paragraphs" },

  { id: "layout.position", tab: "Layout", group: "Floating objects", icon: "Move", label: "Position", hint: "Move the selected object to a preset position on the page" },
  { id: "layout.wrapText", tab: "Layout", group: "Floating objects", icon: "ArrowLeftRight", label: "Wrap Text", hint: "Choose how text wraps around the selected object" },
  { id: "layout.bringForward", tab: "Layout", group: "Floating objects", icon: "Layers", label: "Bring Forward", hint: "Move the selected object one layer forward" },
  { id: "layout.sendBackward", tab: "Layout", group: "Floating objects", icon: "Layers", label: "Send Backward", hint: "Move the selected object one layer backward" },
  { id: "layout.bringToFront", tab: "Layout", group: "Floating objects", icon: "Plus", label: "Bring to Front", hint: "Move the selected object to the front layer" },
  { id: "layout.sendToBack", tab: "Layout", group: "Floating objects", icon: "Minus", label: "Send to Back", hint: "Move the selected object to the back layer" },
  { id: "layout.selectionPane", tab: "Layout", group: "Floating objects", icon: "Grid", label: "Selection Pane", hint: "Show a panel listing all floating objects" },
  { id: "layout.align", tab: "Layout", group: "Floating objects", icon: "AlignHorizontalDistributeCenter", label: "Align", hint: "Align the selected object relative to the page" },
  { id: "layout.group", tab: "Layout", group: "Floating objects", icon: "Group", label: "Group", hint: "Group or ungroup selected objects" },
  { id: "layout.rotate", tab: "Layout", group: "Floating objects", icon: "RotateCw", label: "Rotate", hint: "Rotate or flip the selected object" },
  { id: "layout.undo", tab: "Layout", group: "Floating objects", icon: "RotateCcw", label: "Undo", hint: "Undo last floating object change" },
  { id: "layout.redo", tab: "Layout", group: "Floating objects", icon: "RotateCw", label: "Redo", hint: "Redo last floating object change" },

  // View tab - from ViewTab.jsx
  { id: "view.mode.read", tab: "View", group: "Views", icon: "Eye", label: "Read Mode", hint: "Rendered markdown with styling" },
  { id: "view.mode.draft", tab: "View", group: "Views", icon: "PenLine", label: "Draft", hint: "Plain writing box, no styling" },
  { id: "view.mode.print", tab: "View", group: "Views", icon: "FileText", label: "Print Layout", hint: "Pages with shadows, numbers, margins" },
  { id: "view.mode.outline", tab: "View", group: "Views", icon: "List", label: "Outline", hint: "Collapsible heading tree" },
  { id: "view.mode.immersive", tab: "View", group: "Views", icon: "BookOpen", label: "Immersive Reader", hint: "Distraction-free, large text, read-aloud" },

  { id: "view.navPane", tab: "View", group: "Navigation pane", icon: "AlignLeft", label: "Navigation pane", hint: "Show side panel with headings and find" },
  { id: "view.find", tab: "View", group: "Navigation pane", icon: "Search", label: "Find", hint: "Find in this note (Ctrl+F)" },

  { id: "view.zoomOut", tab: "View", group: "Zoom", icon: "ZoomOut", label: "Zoom out", hint: "Decrease zoom (Ctrl+-)" },
  { id: "view.zoomIn", tab: "View", group: "Zoom", icon: "ZoomIn", label: "Zoom in", hint: "Increase zoom (Ctrl++)" },

  { id: "view.ruler", tab: "View", group: "Page display", icon: "Ruler", label: "Ruler", hint: "Show horizontal ruler with page width and margins" },
  { id: "view.gridlines", tab: "View", group: "Page display", icon: "Grid", label: "Gridlines", hint: "Show overlay grid on the page" },

  { id: "view.scrollVertical", tab: "View", group: "Scroll mode", icon: "MoveVertical", label: "Vertical", hint: "Vertical scrolling (default)" },
  { id: "view.scrollHorizontal", tab: "View", group: "Scroll mode", icon: "MoveHorizontal", label: "Side to Side", hint: "Horizontal page flow (Print Layout only)" },

  { id: "view.width", tab: "View", group: "Reading page", icon: "Type", label: "Width", hint: "Width of the reading column" },

  { id: "view.editorFont", tab: "View", group: "Editor", icon: "Type", label: "Editor font", hint: "Font of the writing box" },
  { id: "view.editorSize", tab: "View", group: "Editor", icon: "Type", label: "Editor size", hint: "Editor text size (px)" },
  { id: "view.spellCheck", tab: "View", group: "Editor", icon: "Type", label: "Spell check", hint: "Underline misspelled words in the writing box" },

  { id: "view.a11yCheck", tab: "View", group: "Accessibility", icon: "Shield", label: "Check accessibility", hint: "Check for missing alt text, skipped headings, weak links, and low contrast" },

  // Share tab - from ShareTab.jsx
  { id: "share.copyMarkdown", tab: "Share", group: "Copy note", icon: "FileText", label: "As Markdown", hint: "Copy the whole note as Markdown" },
  { id: "share.copyPlainText", tab: "Share", group: "Copy note", icon: "Clipboard", label: "As plain text", hint: "Copy the note without markdown symbols" },
  { id: "share.copyRichText", tab: "Share", group: "Copy note", icon: "Copy", label: "As rich text", hint: "Copy formatted note for Word, email, etc." },

  { id: "share.exportMarkdown", tab: "Share", group: "Export this note", icon: "FileText", label: "Markdown (.md)", hint: "Export as Markdown file" },
  { id: "share.exportHtml", tab: "Share", group: "Export this note", icon: "FileCode", label: "HTML (.html)", hint: "Export as standalone HTML file" },
  { id: "share.exportPdf", tab: "Share", group: "Export this note", icon: "FileSpreadsheet", label: "PDF (.pdf)", hint: "Export as PDF using note's page settings" },
  { id: "share.exportPlainText", tab: "Share", group: "Export this note", icon: "Clipboard", label: "Plain text (.txt)", hint: "Export as plain text file" },
  { id: "share.exportTableXlsx", tab: "Share", group: "Export this note", icon: "FileX", label: "Table as Excel (.xlsx)", hint: "Export the table at cursor as Excel file" },
  { id: "share.exportTableCsv", tab: "Share", group: "Export this note", icon: "FileSpreadsheet", label: "Table as CSV (.csv)", hint: "Export the table at cursor as CSV file" },

  { id: "share.print", tab: "Share", group: "Share & print", icon: "Printer", label: "Print", hint: "Open print dialog for this note" },
  { id: "share.email", tab: "Share", group: "Share & print", icon: "Mail", label: "Email this note", hint: "Open email client with note as body" },
  { id: "share.link", tab: "Share", group: "Share & print", icon: "Link2", label: "Share by link", hint: "Sharing by link comes with Sync (not available yet)" },

  { id: "share.exportAllNotes", tab: "Share", group: "Vault", icon: "Archive", label: "All notes as zip", hint: "Export every note as a zip of .md files" },
  { id: "share.exportBackup", tab: "Share", group: "Vault", icon: "Shield", label: "Full backup (.json)", hint: "Export complete vault backup" },

  // Ink tab (main) - from InkTabs.jsx (InkTab)
  { id: "ink.start", tab: "Ink", group: "Handwriting", icon: "PenLine", label: "Start inking", hint: "Add a handwriting page to this note" },
  { id: "ink.attachOld", tab: "Ink", group: "Handwriting", icon: "Paperclip", label: "Attach old page", hint: "Bring in a handwriting page from before" },

  // Ink sub-tabs - Draw
  { id: "ink.draw.mode.draw", tab: "Ink → Draw", group: "Mode", icon: "FountainPenIcon", label: "Draw", hint: "Draw with the current pen" },
  { id: "ink.draw.mode.shape", tab: "Ink → Draw", group: "Mode", icon: "ShapesIcon", label: "Shapes", hint: "Draw lines, boxes, circles and coordinate graphs" },
  { id: "ink.draw.mode.select", tab: "Ink → Draw", group: "Mode", icon: "MousePointerIcon", label: "Select", hint: "Select, move, resize and rotate objects" },
  { id: "ink.draw.mode.lasso", tab: "Ink → Draw", group: "Mode", icon: "LassoIcon", label: "Lasso", hint: "Select marks by circling them" },
  { id: "ink.draw.mode.erase", tab: "Ink → Draw", group: "Mode", icon: "EraserIcon", label: "Eraser", hint: "Erase marks" },
  { id: "ink.draw.mode.pan", tab: "Ink → Draw", group: "Mode", icon: "HandIcon", label: "Pan", hint: "Move the page around" },
  { id: "ink.draw.mode.eyedropper", tab: "Ink → Draw", group: "Mode", icon: "EyedropperIcon", label: "Pick", hint: "Pick a colour from the page" },
  { id: "ink.draw.mode.insertSpace", tab: "Ink → Draw", group: "Mode", icon: "InsertSpaceIcon", label: "Insert space", hint: "Drag to insert or remove vertical space" },

  { id: "ink.draw.brush.fountain", tab: "Ink → Draw", group: "Pens", icon: "FountainPenIcon", label: "Fountain", hint: "Fountain pen" },
  { id: "ink.draw.brush.ballpoint", tab: "Ink → Draw", group: "Pens", icon: "BallpointPenIcon", label: "Ballpoint", hint: "Ballpoint pen" },
  { id: "ink.draw.brush.calligraphy", tab: "Ink → Draw", group: "Pens", icon: "CalligraphyPenIcon", label: "Calligraphy", hint: "Calligraphy pen" },
  { id: "ink.draw.brush.marker", tab: "Ink → Draw", group: "Pens", icon: "HighlighterIcon", label: "Marker", hint: "Marker/Highlighter" },
  { id: "ink.draw.brush.watercolor", tab: "Ink → Draw", group: "Pens", icon: "WatercolorBrushIcon", label: "Watercolor", hint: "Watercolor brush" },
  { id: "ink.draw.brush.pencil", tab: "Ink → Draw", group: "Pens", icon: "PencilIcon", label: "Pencil", hint: "Pencil" },

  { id: "ink.draw.favPens", tab: "Ink → Draw", group: "Favourite pens", icon: "SavePenIcon", label: "Save pen", hint: "Save current pen as favourite" },

  { id: "ink.draw.stroke.width", tab: "Ink → Draw", group: "Stroke", icon: "Brush", label: "Width", hint: "Stroke width" },
  { id: "ink.draw.stroke.opacity", tab: "Ink → Draw", group: "Stroke", icon: "Brush", label: "Opacity", hint: "Stroke opacity" },
  { id: "ink.draw.brushEngine", tab: "Ink → Draw", group: "Stroke", icon: "Brush", label: "Brush engine", hint: "Pen behaviour, eraser engine, shape and ruler assists" },

  { id: "ink.draw.eraser.stroke", tab: "Ink → Draw", group: "Eraser", icon: "EraserIcon", label: "Stroke eraser", hint: "Stroke eraser mode" },
  { id: "ink.draw.eraser.precision", tab: "Ink → Draw", group: "Eraser", icon: "EraserIcon", label: "Point eraser", hint: "Point eraser mode" },
  { id: "ink.draw.eraser.small", tab: "Ink → Draw", group: "Eraser", icon: "EraserIcon", label: "Small eraser", hint: "Small eraser (12px)" },
  { id: "ink.draw.eraser.medium", tab: "Ink → Draw", group: "Eraser", icon: "EraserIcon", label: "Medium eraser", hint: "Medium eraser (26px)" },
  { id: "ink.draw.eraser.large", tab: "Ink → Draw", group: "Eraser", icon: "EraserIcon", label: "Large eraser", hint: "Large eraser (50px)" },
  { id: "ink.draw.eraser.radius", tab: "Ink → Draw", group: "Eraser", icon: "EraserIcon", label: "Radius", hint: "Eraser radius" },

  { id: "ink.draw.history.undo", tab: "Ink → Draw", group: "History", icon: "Undo2", label: "Undo", hint: "Undo the last mark" },
  { id: "ink.draw.history.redo", tab: "Ink → Draw", group: "History", icon: "Redo2", label: "Redo", hint: "Redo" },

  { id: "ink.draw.view.zoomOut", tab: "Ink → Draw", group: "View", icon: "ZoomOut", label: "Zoom out", hint: "Zoom out" },
  { id: "ink.draw.view.zoomIn", tab: "Ink → Draw", group: "View", icon: "ZoomIn", label: "Zoom in", hint: "Zoom in" },
  { id: "ink.draw.view.fit", tab: "Ink → Draw", group: "View", icon: "Maximize", label: "Fit", hint: "Fit the page to the ink" },
  { id: "ink.draw.view.clear", tab: "Ink → Draw", group: "View", icon: "Trash2", label: "Clear page", hint: "Remove every mark on this page" },

  { id: "ink.draw.shapes.coordGraph", tab: "Ink → Draw", group: "Shapes", icon: "CoordinateGraphIcon", label: "Coordinate graph", hint: "Insert a coordinate graph with axes, grid and tick marks" },

  // Ink Color tab
  { id: "ink.color.hex", tab: "Ink → Color", group: "Current", icon: "Pipette", label: "Hex input", hint: "3 or 6 digit hex, with or without #" },
  { id: "ink.color.pipette", tab: "Ink → Color", group: "Current", icon: "Pipette", label: "Pick", hint: "Pick a colour from the page" },
  { id: "ink.color.quick", tab: "Ink → Color", group: "Quick inks", icon: "Circle", label: "Quick colors", hint: "Quick color palette" },
  { id: "ink.color.recent", tab: "Ink → Color", group: "Recent", icon: "History", label: "Recent colors", hint: "Colours you use appear here" },
  { id: "ink.color.studio", tab: "Ink → Color", group: "Studio", icon: "Palette", label: "Colour studio", hint: "Mixer, palettes, opacity and custom colours" },
  { id: "ink.color.opacity", tab: "Ink → Color", group: "Studio", icon: "Droplets", label: "Opacity", hint: "Stroke opacity" },

  // Ink Select tab
  { id: "ink.select.select", tab: "Ink → Select", group: "Select", icon: "MousePointerIcon", label: "Select", hint: "Select, move, resize and rotate objects" },
  { id: "ink.select.lasso", tab: "Ink → Select", group: "Select", icon: "LassoIcon", label: "Lasso", hint: "Select marks by circling them" },
  { id: "ink.select.delete", tab: "Ink → Select", group: "Object", icon: "Trash2", label: "Delete", hint: "Delete the selected object" },
  { id: "ink.select.front", tab: "Ink → Select", group: "Object", icon: "Layers", label: "Front", hint: "Bring to front" },
  { id: "ink.select.back", tab: "Ink → Select", group: "Object", icon: "Layers", label: "Back", hint: "Send to back" },
  { id: "ink.select.strokes.apply", tab: "Ink → Select", group: "Strokes", icon: "Check", label: "Apply", hint: "Commit the move, scale or rotation" },
  { id: "ink.select.strokes.recolor", tab: "Ink → Select", group: "Strokes", icon: "Droplets", label: "Recolor", hint: "Paint the selection with the current ink" },
  { id: "ink.select.strokes.delete", tab: "Ink → Select", group: "Strokes", icon: "Trash2", label: "Delete", hint: "Delete the selected marks" },
  { id: "ink.select.strokes.deselect", tab: "Ink → Select", group: "Strokes", icon: "X", label: "Deselect", hint: "Clear the selection" },
  { id: "ink.select.transform.studio", tab: "Ink → Select", group: "Transform", icon: "SquareDashedMousePointer", label: "Selection studio", hint: "Move, scale and rotate the selection precisely" },

  // Ink Paper tab
  { id: "ink.paper.template", tab: "Ink → Paper", group: "Template", icon: "FileText", label: "Template", hint: "Paper template" },
  { id: "ink.paper.tone", tab: "Ink → Paper", group: "Template", icon: "Palette", label: "Tone", hint: "Paper tone" },
  { id: "ink.paper.size", tab: "Ink → Paper", group: "Page size", icon: "FileText", label: "Page size", hint: "Page size" },
  { id: "ink.paper.prev", tab: "Ink → Paper", group: "Pages", icon: "ChevronLeft", label: "Previous page", hint: "Previous page" },
  { id: "ink.paper.next", tab: "Ink → Paper", group: "Pages", icon: "ChevronRight", label: "Next page", hint: "Next page" },
  { id: "ink.paper.studio", tab: "Ink → Paper", group: "Studio", icon: "Layers", label: "Paper studio", hint: "All paper options in one place" },
  { id: "ink.paper.clear", tab: "Ink → Paper", group: "Studio", icon: "Trash2", label: "Clear page", hint: "Remove every mark on this page" },

  // Ink Smart tab
  { id: "ink.smart.recognize.text", tab: "Ink → Smart ink", group: "Recognise", icon: "ScanText", label: "Handwriting", hint: "Turn the lasso selection into text" },
  { id: "ink.smart.recognize.math", tab: "Ink → Smart ink", group: "Recognise", icon: "Sigma", label: "Equation", hint: "Turn handwritten maths into LaTeX" },
  { id: "ink.smart.results", tab: "Ink → Smart ink", group: "Results and search", icon: "BookOpen", label: "Results & search", hint: "Recognised text, insert it on the page, search all handwriting" },

  // Ink Audio tab
  { id: "ink.audio.record", tab: "Ink → Audio", group: "Record", icon: "Mic", label: "Record", hint: "Record audio while you write" },
  { id: "ink.audio.play", tab: "Ink → Audio", group: "Playback", icon: "Play", label: "Play", hint: "Play the recording and redraw the page" },
  { id: "ink.audio.replayInk", tab: "Ink → Audio", group: "Playback", icon: "History", label: "Replay ink", hint: "Replay the strokes without sound" },
  { id: "ink.audio.studio", tab: "Ink → Audio", group: "Manage", icon: "Mic", label: "Audio studio", hint: "Scrub through the recording" },
  { id: "ink.audio.clear", tab: "Ink → Audio", group: "Manage", icon: "MicOff", label: "Remove audio", hint: "Delete the recording from this page" },

  // Table Contextual tab - from TableContextTab.jsx
  { id: "table.insert", tab: "Table", group: "Insert", icon: "Table", label: "Insert table", hint: "Insert a table — hover the grid or type a size" },
  { id: "table.fromCsv", tab: "Table", group: "Insert", icon: "FileSpreadsheet", label: "From CSV/TSV", hint: "Insert a .csv or .tsv file as a table" },
  { id: "table.fromXlsx", tab: "Table", group: "Insert", icon: "Upload", label: "From Excel (.xlsx)", hint: "Insert from an Excel workbook" },

  { id: "table.tools", tab: "Table", group: "Table tools", icon: "Table", label: "Table tools", hint: "Table editing tools" },

  { id: "table.sortAsc", tab: "Table", group: "Arrange", icon: "ArrowDownAZ", label: "Sort A–Z", hint: "Sort the rows by the column under the cursor" },
  { id: "table.sortDesc", tab: "Table", group: "Arrange", icon: "ArrowUpAZ", label: "Sort Z–A", hint: "Sort the rows in reverse" },
  { id: "table.moveRowUp", tab: "Table", group: "Arrange", icon: "ArrowUp", label: "Row up", hint: "Move this row up" },
  { id: "table.moveRowDown", tab: "Table", group: "Arrange", icon: "ArrowDown", label: "Row down", hint: "Move this row down" },
  { id: "table.moveColLeft", tab: "Table", group: "Arrange", icon: "ArrowLeft", label: "Col left", hint: "Move this column left" },
  { id: "table.moveColRight", tab: "Table", group: "Arrange", icon: "ArrowRight", label: "Col right", hint: "Move this column right" },
  { id: "table.duplicateRow", tab: "Table", group: "Arrange", icon: "CopyPlus", label: "Duplicate row", hint: "Copy this row below itself" },
  { id: "table.transpose", tab: "Table", group: "Arrange", icon: "ArrowLeftRight", label: "Transpose", hint: "Swap rows and columns" },

  { id: "table.sumRow", tab: "Table", group: "Data", icon: "Sigma", label: "Sum row", hint: "Add a Total row summing the numeric columns" },
  { id: "table.averageRow", tab: "Table", group: "Data", icon: "Sigma", label: "Average row", hint: "Add an Average row" },
  { id: "table.clearCells", tab: "Table", group: "Data", icon: "Eraser", label: "Clear cells", hint: "Empty every data cell, keep the header" },
  { id: "table.tidy", tab: "Table", group: "Data", icon: "Wand2", label: "Tidy up", hint: "Align the | marks so the table is easy to read as text" },

  { id: "table.textToTable", tab: "Table", group: "Convert", icon: "TableProperties", label: "Text → table", hint: "Turn the selected CSV / TSV lines into a table" },
  { id: "table.copyCsv", tab: "Table", group: "Convert", icon: "Download", label: "Copy as CSV", hint: "Copy this table as CSV text" },

  { id: "table.exportXlsx", tab: "Table", group: "Export", icon: "FileX", label: "Excel (.xlsx)", hint: "Export this table as .xlsx" },
  { id: "table.exportCsv", tab: "Table", group: "Export", icon: "FileSpreadsheet", label: "CSV (.csv)", hint: "Export this table as .csv" },

  // Code Contextual tab - from CodeContextTab.jsx
  { id: "code.language", tab: "Code", group: "Block tools", icon: "Replace", label: "Language", hint: "Change the language of the block under the cursor" },
  { id: "code.snippet", tab: "Code", group: "Block tools", icon: "SquareTerminal", label: "Snippet", hint: "Insert a small example block" },
  { id: "code.unwrap", tab: "Code", group: "Block tools", icon: "PackageOpen", label: "Unwrap", hint: "Remove the fences and keep the code" },
  { id: "code.copy", tab: "Code", group: "Block tools", icon: "ClipboardCopy", label: "Copy code", hint: "Copy the code of this block" },

  { id: "code.comment", tab: "Code", group: "Edit lines", icon: "MessageSquareOff", label: "Comment", hint: "Comment or uncomment the selected lines" },
  { id: "code.indent", tab: "Code", group: "Edit lines", icon: "IndentIncrease", label: "Indent", hint: "Indent lines" },
  { id: "code.outdent", tab: "Code", group: "Edit lines", icon: "IndentDecrease", label: "Outdent", hint: "Outdent lines" },
  { id: "code.duplicate", tab: "Code", group: "Edit lines", icon: "CopyPlus", label: "Duplicate", hint: "Duplicate the current line" },
  { id: "code.moveUp", tab: "Code", group: "Edit lines", icon: "ArrowUp", label: "Move line up", hint: "Move line up" },
  { id: "code.moveDown", tab: "Code", group: "Edit lines", icon: "ArrowDown", label: "Move line down", hint: "Move line down" },
  { id: "code.deleteLine", tab: "Code", group: "Edit lines", icon: "Trash2", label: "Delete line", hint: "Delete the current line" },

  { id: "code.prettyJson", tab: "Code", group: "JSON", icon: "FileJson", label: "Pretty", hint: "Format the JSON in the selection or in the block under the cursor" },
  { id: "code.minifyJson", tab: "Code", group: "JSON", icon: "Shrink", label: "Minify", hint: "Squeeze the JSON onto one line" },
];

// Sync rail icon (from SpaceRail.jsx)
const SYNC_RAIL_BUTTON = {
  id: "rail.sync",
  tab: "Rail (Vault)",
  group: "Spaces",
  icon: "ExternalLink",
  label: "Sync",
  hint: "Sync spaces (not available yet)",
};

function DevIconsPage() {
  // Group buttons by tab
  const buttonsByTab = useMemo(() => {
    const grouped = {};
    ALL_BUTTONS.forEach((btn) => {
      if (!grouped[btn.tab]) grouped[btn.tab] = [];
      grouped[btn.tab].push(btn);
    });
    return grouped;
  }, []);

  // Analyze for issues
  const analysis = useMemo(() => {
    const iconUsage = {};
    const issues = {
      duplicateIcons: [],      // (a) share the same icon with another button
      genericIcons: [],        // (b) use generic icon (FileText, ExternalLink, Square, Circle) for something else
      mismatchedIcons: [],     // (c) icon meaning doesn't match label
    };

    // Count icon usage
    ALL_BUTTONS.forEach((btn) => {
      if (!iconUsage[btn.icon]) iconUsage[btn.icon] = [];
      iconUsage[btn.icon].push(btn);
    });

    // Also check sync rail
    if (!iconUsage[SYNC_RAIL_BUTTON.icon]) iconUsage[SYNC_RAIL_BUTTON.icon] = [];
    iconUsage[SYNC_RAIL_BUTTON.icon].push(SYNC_RAIL_BUTTON);

    // (a) Duplicate icons - icons used by more than one button
    Object.entries(iconUsage).forEach(([icon, buttons]) => {
      if (buttons.length > 1) {
        issues.duplicateIcons.push({ icon, buttons: buttons.map((b) => `${b.tab}: ${b.id} (${b.label})`) });
      }
    });

    // (b) Generic icons - FileText, ExternalLink, Square, Circle used for something other than their literal meaning
    const genericIcons = ["FileText", "ExternalLink", "Square", "Circle", "Clipboard", "Type", "FileSpreadsheet", "FileCode", "FileJson", "FileX"];
    ALL_BUTTONS.forEach((btn) => {
      if (genericIcons.includes(btn.icon)) {
        // Check if the icon matches the literal meaning
        const isLiteralMatch =
          (btn.icon === "FileText" && (btn.label.includes("Markdown") || btn.label.includes("text") || btn.label.includes("File"))) ||
          (btn.icon === "ExternalLink" && btn.label.includes("link")) ||
          (btn.icon === "Square" && btn.label.toLowerCase().includes("square")) ||
          (btn.icon === "Circle" && btn.label.toLowerCase().includes("circle")) ||
          (btn.icon === "Clipboard" && btn.label.toLowerCase().includes("clipboard")) ||
          (btn.icon === "Type" && btn.label.toLowerCase().includes("type")) ||
          (btn.icon === "FileSpreadsheet" && btn.label.toLowerCase().includes("spreadsheet") || btn.label.toLowerCase().includes("excel") || btn.label.toLowerCase().includes("csv")) ||
          (btn.icon === "FileCode" && btn.label.toLowerCase().includes("html") || btn.label.toLowerCase().includes("code")) ||
          (btn.icon === "FileJson" && btn.label.toLowerCase().includes("json")) ||
          (btn.icon === "FileX" && btn.label.toLowerCase().includes("excel") || btn.label.toLowerCase().includes("xlsx"));

        if (!isLiteralMatch) {
          issues.genericIcons.push({ icon: btn.icon, button: `${btn.tab}: ${btn.id} (${btn.label})` });
        }
      }
    });

    // Check sync rail
    if (SYNC_RAIL_BUTTON.icon === "ExternalLink" && !SYNC_RAIL_BUTTON.label.toLowerCase().includes("link")) {
      issues.genericIcons.push({ icon: "ExternalLink", button: `${SYNC_RAIL_BUTTON.tab}: ${SYNC_RAIL_BUTTON.id} (${SYNC_RAIL_BUTTON.label})` });
    }

    // (c) Mismatched icons - icon meaning doesn't match label
    // This is more subjective, but we can flag obvious mismatches
    const mismatches = [
      // Square used for shapes that aren't squares
      { icon: "Square", labels: ["Rounded rect", "Text box", "Sticky note"] },
      // Circle used for ellipse (OK actually - circle is a type of ellipse)
      // ArrowLeftRight used for "Reverse" (lines) and "Transpose" (table) and "Wrap Text" - different meanings
      { icon: "ArrowLeftRight", labels: ["Reverse", "Transpose", "Wrap Text", "Auto direction"] },
      // ArrowUp/ArrowDown used for "Row up/Row down" (table) and "Move line up/down" (code) - OK, same meaning
      // Sigma used for "Sum row" and "Average row" - OK, both are aggregations
      // Trash2 used for many "Delete" actions - OK
      // Layers used for "Bring Forward", "Send Backward", "Paper studio", "Make card" - OK, all layer-related
      // Link2 used for "Note link", "Image URL", "Web link", "Link day" - OK, all link-related
      // FileText used for "Markdown", "Print Layout", "Page setup", "Page break", "Template", "Page size" - some mismatch
    ];

    mismatches.forEach(({ icon, labels }) => {
      ALL_BUTTONS.forEach((btn) => {
        if (btn.icon === icon && labels.includes(btn.label)) {
          issues.mismatchedIcons.push({ icon, button: `${btn.tab}: ${btn.id} (${btn.label})` });
        }
      });
    });

    return { iconUsage, issues };
  }, []);

  const tabs = Object.keys(buttonsByTab).sort();

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "8px" }}>🔧 Dev: All Ribbon Buttons</h1>
      <p style={{ color: "#666", marginBottom: "24px" }}>
        Only visible in <code>npm run dev</code>. Shows every ribbon button with its ID, icon, tooltip, and tab.
        Analysis below flags: (a) shared icons, (b) generic icons used incorrectly, (c) mismatched icons.
      </p>

      {/* Analysis Section */}
      <details open style={{ marginBottom: "24px", padding: "16px", border: "1px solid #ddd", borderRadius: "8px", background: "#fafafa" }}>
        <summary style={{ fontWeight: 600, cursor: "pointer", fontSize: "16px" }}>
          📊 Icon Analysis ({analysis.issues.duplicateIcons.length} duplicates, {analysis.issues.genericIcons.length} generic misuse, {analysis.issues.mismatchedIcons.length} mismatches)
        </summary>

        <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "16px" }}>
          {/* Duplicate Icons */}
          <div style={{ padding: "12px", background: "white", borderRadius: "6px", border: "1px solid #eee" }}>
            <h3 style={{ margin: "0 0 8px", color: "#b45309" }}>🔄 Shared Icons (used by 2+ buttons)</h3>
            {analysis.issues.duplicateIcons.length === 0 ? (
              <p style={{ color: "#666", margin: 0 }}>None</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px" }}>
                {analysis.issues.duplicateIcons.map((item, i) => (
                  <li key={i} style={{ marginBottom: "8px" }}>
                    <strong>{item.icon}</strong> — {item.buttons.join(", ")}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Generic Icons */}
          <div style={{ padding: "12px", background: "white", borderRadius: "6px", border: "1px solid #eee" }}>
            <h3 style={{ margin: "0 0 8px", color: "#b45309" }}>📦 Generic Icons Used Incorrectly</h3>
            {analysis.issues.genericIcons.length === 0 ? (
              <p style={{ color: "#666", margin: 0 }}>None</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px" }}>
                {analysis.issues.genericIcons.map((item, i) => (
                  <li key={i} style={{ marginBottom: "6px" }}>
                    <strong>{item.icon}</strong> — {item.button}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Mismatched Icons */}
          <div style={{ padding: "12px", background: "white", borderRadius: "6px", border: "1px solid #eee" }}>
            <h3 style={{ margin: "0 0 8px", color: "#b45309" }}>⚠️ Potentially Mismatched Icons</h3>
            {analysis.issues.mismatchedIcons.length === 0 ? (
              <p style={{ color: "#666", margin: 0 }}>None</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px" }}>
                {analysis.issues.mismatchedIcons.map((item, i) => (
                  <li key={i} style={{ marginBottom: "6px" }}>
                    <strong>{item.icon}</strong> — {item.button}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Sync Rail */}
          <div style={{ padding: "12px", background: "white", borderRadius: "6px", border: "1px solid #eee" }}>
            <h3 style={{ margin: "0 0 8px", color: "#b45309" }}>🔗 Rail Sync Button</h3>
            <p style={{ margin: 0, fontSize: "13px" }}>
              Current: <strong>ExternalLink</strong> for "Sync" — should be a sync/icon like <strong>RefreshCw</strong>, <strong>Sync</strong>, or <strong>ArrowClockwise</strong>
            </p>
          </div>
        </div>
      </details>

      {/* Buttons Grid */}
      <div style={{ display: "flex", gap: "24px" }}>
        {/* Tab Navigation */}
        <nav style={{ width: "220px", flexShrink: 0, position: "sticky", top: "24px", maxHeight: "calc(100vh - 48px)", overflow: "auto" }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {tabs.map((tab) => (
              <li key={tab} style={{ marginBottom: "4px" }}>
                <a
                  href={`#tab-${tab.replace(/\s+/g, "-").toLowerCase()}`}
                  style={{
                    display: "block",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    color: "#333",
                    fontSize: "13px",
                    background: "#f5f5f5",
                    border: "1px solid transparent",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => (e.target.style.background = "#eee")}
                  onMouseLeave={(e) => (e.target.style.background = "#f5f5f5")}
                >
                  {tab} ({buttonsByTab[tab].length})
                </a>
              </li>
            ))}
            <li style={{ marginTop: "16px", marginBottom: "4px" }}>
              <a
                href="#tab-rail-vault"
                style={{
                  display: "block",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  color: "#333",
                  fontSize: "13px",
                  background: "#f5f5f5",
                  border: "1px solid transparent",
                }}
              >
                Rail (Vault) (1)
              </a>
            </li>
          </ul>
        </nav>

        {/* Button Cards */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {tabs.map((tab) => (
            <section key={tab} id={`tab-${tab.replace(/\s+/g, "-").toLowerCase()}`} style={{ marginBottom: "32px" }}>
              <h2 style={{ margin: "0 0 16px", paddingBottom: "8px", borderBottom: "2px solid #e5e7eb", fontSize: "20px" }}>
                {tab} ({buttonsByTab[tab].length} buttons)
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                {buttonsByTab[tab].map((btn) => (
                  <div
                    key={btn.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "12px",
                      background: "white",
                      transition: "box-shadow 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#666", background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px" }}>
                        {btn.icon}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: "13px", flex: 1 }}>{btn.label}</span>
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                      {btn.id}
                    </div>
                    <div style={{ fontSize: "12px", color: "#555", lineHeight: 1.4 }}>
                      {btn.hint}
                    </div>
                    <div style={{ marginTop: "8px", fontSize: "10px", color: "#999", textTransform: "uppercase" }}>
                      Group: {btn.group}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Rail Sync */}
          <section id="tab-rail-vault" style={{ marginBottom: "32px" }}>
            <h2 style={{ margin: "0 0 16px", paddingBottom: "8px", borderBottom: "2px solid #e5e7eb", fontSize: "20px" }}>
              Rail (Vault) (1 button)
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "12px",
                  background: "#fef3c7",
                  transition: "box-shadow 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#666", background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px" }}>
                    {SYNC_RAIL_BUTTON.icon} ⚠️
                  </span>
                  <span style={{ fontWeight: 600, fontSize: "13px", flex: 1 }}>{SYNC_RAIL_BUTTON.label}</span>
                </div>
                <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
                  {SYNC_RAIL_BUTTON.id}
                </div>
                <div style={{ fontSize: "12px", color: "#555", lineHeight: 1.4 }}>
                  {SYNC_RAIL_BUTTON.hint}
                </div>
                <div style={{ marginTop: "8px", fontSize: "10px", color: "#b45309", fontWeight: 600 }}>
                  ⚠️ WRONG ICON: ExternalLink used for Sync — should be RefreshCw / Sync / ArrowClockwise
                </div>
                <div style={{ marginTop: "8px", fontSize: "10px", color: "#999", textTransform: "uppercase" }}>
                  Group: {SYNC_RAIL_BUTTON.group}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default DevIconsPage;