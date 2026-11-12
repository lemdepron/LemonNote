const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\halaf\\projects\\LemonNote\\src\\components\\ribbon\\tabs\\InsertTab.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace RibbonGroup label="..." with label={t("ribbon.insert....")}
const groupLabels = {
  'Pictures': 'pictures',
  'Media': 'media',
  'Links': 'links',
  'Bookmarks': 'bookmarks',
  'Blocks': 'blocks',
  'Symbols': 'symbols',
  'Code block': 'codeBlock',
  'Table': 'table',
  'Shapes': 'shapes',
  'Stickers': 'stickers',
  'Text & Notes': 'textNotes',
  'Time and calendar': 'timeCalendar',
  'Cards': 'cards',
};

for (const [label, key] of Object.entries(groupLabels)) {
  const regex = new RegExp(`label="${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
  content = content.replace(regex, `label={t("ribbon.insert.${key}")}`);
}

// Replace Btn/UrlMenu label="..." and hint="..." and placeholder="..."
const btnStrings = {
  // Pictures group
  'Image file': { key: 'image', hint: 'Insert an image from your computer' },
  'Image URL': { key: 'imageUrl', hint: 'Insert an image from a web address', placeholder: 'https://…/picture.png' },
  'Figure': { key: 'figure', hint: 'Insert an image with a caption (Figure N: caption)' },
  // Media group
  'GIF': { key: 'gif', hint: 'Insert an animated GIF, WebP or APNG from your computer' },
  'Attach file': { key: 'file', hint: 'Attach any file (PDF, Word, zip, etc.) — opens in viewer or downloads' },
  'Record audio': { key: 'audio', hint: 'Record audio from microphone' },
  // Links group
  'Note link': { key: 'noteLink', hint: 'Link another note with [[ ]]' },
  'Bookmark': { key: 'bookmark', hint: 'Insert a named anchor at the cursor' },
  'Web link': { key: 'webLink', hint: 'Turn the selection into a web link', placeholder: 'https://example.com' },
  'Email': { key: 'email', hint: 'Insert an email link', placeholder: 'name@example.com' },
  'Tag': { key: 'tag', hint: 'Insert a #tag', placeholder: 'tag-name' },
  // Bookmarks group
  'Bookmarks': { key: 'bookmarksMenu', hint: 'Jump to a bookmark in this note' },
  // Blocks group
  'Divider': { key: 'divider', hint: 'Horizontal line' },
  'Callout': { key: 'callout', hint: 'Highlighted note box' },
  'Collapsible': { key: 'collapsible', hint: 'A section that opens and closes' },
  'Footnote': { key: 'footnote', hint: 'Add a footnote marker here and its text at the end of the note' },
  'Line break': { key: 'lineBreak', hint: 'Force a new line inside a paragraph' },
  'Outline': { key: 'outline', hint: "Insert a list of this note's headings" },
  'Quote': { key: 'quoteBlock', hint: 'Block quote' },
  'Chart': { key: 'chart', hint: 'Insert a chart from a table (bar, line, pie)' },
  // Symbols group
  'Symbols': { key: 'symbolsMenu', hint: 'Special characters' },
  // Code block group
  // Handled separately for dynamic label
  'Inline': { key: 'inlineCode', hint: 'Inline code' },
  // Table group - TablePicker handled separately
  // Shapes group
  'Rectangle': { key: 'shapeRect', hint: 'Insert a rectangle' },
  'Rounded rect': { key: 'shapeRounded', hint: 'Insert a rounded rectangle' },
  'Ellipse': { key: 'shapeEllipse', hint: 'Insert an ellipse' },
  'Line': { key: 'shapeLine', hint: 'Insert a line' },
  'Arrow': { key: 'shapeArrow', hint: 'Insert an arrow' },
  'Triangle': { key: 'shapeTriangle', hint: 'Insert a triangle' },
  'Star': { key: 'shapeStar', hint: 'Insert a star' },
  // Stickers group
  'Stickers': { key: 'stickersMenu', hint: 'Insert a built-in sticker' },
  // Text & Notes group
  'Text box': { key: 'textbox', hint: 'Insert a text box' },
  'Sticky note': { key: 'sticky', hint: 'Insert a sticky note' },
  // Time and calendar group
  'Today': { key: 'today', hint: "Open or create today's daily note" },
  'Yesterday': { key: 'yesterday', hint: "Open yesterday's note" },
  'Tomorrow': { key: 'tomorrow', hint: "Open or create tomorrow's note" },
  'Previous': { key: 'prevDay', hint: 'The day, week or month before this note' },
  'Next': { key: 'nextDay', hint: 'The day, week or month after this note' },
  'This week': { key: 'thisWeek', hint: "Open or create this week's note, e.g. 2026-W45" },
  'This month': { key: 'thisMonth', hint: "Open or create this month's note, e.g. 2026-11" },
  "Today's date": { key: 'date', hint: 'Insert 2026-11-06 style date' },
  'Time': { key: 'time', hint: 'Insert the current time' },
  'Log entry': { key: 'logEntry', hint: 'Start a new time-stamped log line' },
  'Formats': { key: 'dateFormats', hint: 'Every date and time format' },
  'Link day': { key: 'linkDay', hint: 'Insert a [[link]] to a day note' },
  'Templates': { key: 'templates', hint: 'Ready-made journal blocks' },
  // Cards group - CardComposer handled separately
};

// Replace label and hint for Btn and UrlMenu
for (const [label, info] of Object.entries(btnStrings)) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Replace label="label" hint="hint"
  if (info.hint) {
    const escapedHint = info.hint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`label="${escapedLabel}"\\s+hint="${escapedHint}"`, 'g');
    content = content.replace(regex, `label={t("ribbon.insert.${info.key}")} hint={t("ribbon.insert.${info.key}Hint")}`);
  } else {
    const regex = new RegExp(`label="${escapedLabel}"`, 'g');
    content = content.replace(regex, `label={t("ribbon.insert.${info.key}")}`);
  }
  
  // Replace placeholder
  if (info.placeholder) {
    const escapedPlaceholder = info.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`placeholder="${escapedPlaceholder}"`, 'g');
    content = content.replace(regex, `placeholder={t("ribbon.insert.${info.key}Placeholder")}`);
  }
}

// Special cases for dynamic hints
content = content.replace(
  /hint=\{isRecording \? "Stop recording" : "Record audio from microphone"\}/g,
  'hint={isRecording ? t("ribbon.insert.audioStopHint") : t("ribbon.insert.audioHint")}'
);

// Special case for code block menu label (dynamic)
content = content.replace(
  /label=\{`Block: \$\{fenceLabel\(active\)\}`\}/g,
  'label={t("ribbon.insert.codeBlockMenu", { label: fenceLabel(active) })}'
);

// Special case for code block search placeholder
content = content.replace(
  /placeholder=\{`Search \$\{ALL_FENCE_LANGUAGES\.length\} languages…`\}/g,
  'placeholder={t("ribbon.insert.codeBlockSearchPlaceholder", { count: ALL_FENCE_LANGUAGES.length })}'
);

// Special case for chart prompts - these are in prompt() calls, not JSX
// We'll handle toast messages and prompts separately

// Fix the "No bookmarks in this note" string
content = content.replace(
  /No bookmarks in this note/g,
  '{t("ribbon.insert.noBookmarks")}'
);

// Fix the "Add some # headings first" string
content = content.replace(
  /disabledReason="Add some # headings first"/g,
  'disabledReason={t("ribbon.insert.outlineDisabled")}'
);

// Fix the chart disabled reason
content = content.replace(
  /disabledReason="Put the cursor inside a table first"/g,
  'disabledReason={t("ribbon.insert.chartDisabled")}'
);

// Fix the "Put the cursor inside a code block first" string (needBlock constant)
content = content.replace(
  /const needBlock = "Put the cursor inside a code block first\.";/g,
  'const needBlock = t("ribbon.insert.needCodeBlock");'
);

// Fix the Figure caption prompt
content = content.replace(
  /prompt\('Figure caption \(optional\):'\)/g,
  'prompt(t("ribbon.insert.figureCaptionPrompt"))'
);

// Fix the Bookmark name prompt
content = content.replace(
  /prompt\('Bookmark name:'\)/g,
  'prompt(t("ribbon.insert.bookmarkPrompt"))'
);

// Fix the chart prompts
content = content.replace(
  /prompt\('Chart type \(bar, line, pie\):', 'bar'\)/g,
  'prompt(t("ribbon.insert.chartTypePrompt"), "bar")'
);
content = content.replace(
  /prompt\(`Table index \(0 to \$\{tableCount - 1\}\):`/, 'prompt(t("ribbon.insert.chartTablePrompt", { count: tableCount }))'
);
content = content.replace(
  /prompt\('Chart title \(optional\):'/, 'prompt(t("ribbon.insert.chartTitlePrompt"))'
);

// Fix toast messages
content = content.replace(
  /toast\.error\("Please select a GIF, WebP, or APNG file\."\)/g,
  'toast.error(t("ribbon.insert.gifError"))'
);
content = content.replace(
  /toast\.error\("File must be under \$\{formatSize\(MAX_SIZE\)\}\."\)/g,
  'toast.error(t("ribbon.insert.fileSizeError", { size: formatSize(MAX_SIZE) }))'
);
content = content.replace(
  /toast\.error\("Failed to insert GIF\."\)/g,
  'toast.error(t("ribbon.insert.gifInsertError"))'
);
content = content.replace(
  /toast\.error\("Failed to attach file\."\)/g,
  'toast.error(t("ribbon.insert.fileAttachError"))'
);
content = content.replace(
  /toast\.error\("Failed to start recording\."\)/g,
  'toast.error(t("ribbon.insert.recordingStartError"))'
);
content = content.replace(
  /toast\.error\("Failed to save recording\."\)/g,
  'toast.error(t("ribbon.insert.recordingSaveError"))'
);
content = content.replace(
  /toast\.error\("Microphone permission denied\. Please allow microphone access in your browser settings\."\)/g,
  'toast.error(t("ribbon.insert.micPermissionError"))'
);
content = content.replace(
  /toast\.info\("Recording… click again to stop\."\)/g,
  'toast.info(t("ribbon.insert.recordingToast"))'
);

fs.writeFileSync(filePath, content);
console.log('InsertTab.jsx updated!');