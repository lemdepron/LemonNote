const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\halaf\\projects\\LemonNote\\src\\components\\ribbon\\tabs\\InsertTab.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix prompt call syntax errors
content = content.replace(
  /const tableIndex = prompt\(t\("ribbon\.insert\.chartTablePrompt", \{ count: tableCount \}\)\), '0'\);/g,
  'const tableIndex = prompt(`${t("ribbon.insert.chartTablePrompt").replace("{count}", tableCount)}`, \'0\');'
);

content = content.replace(
  /const title = prompt\(t\("ribbon\.insert\.chartTitlePrompt"\), ''\);/g,
  'const title = prompt(t("ribbon.insert.chartTitlePrompt"), \'\');'
);

// Fix codeBlockMenu label - remove interpolation, use template literal
content = content.replace(
  /label=\{t\("ribbon\.insert\.codeBlockMenu", \{ label: fenceLabel\(active\) \}\}\)\}/g,
  'label={`Block: ${fenceLabel(active)}`}'
);

// Fix codeBlockSearchPlaceholder - remove interpolation
content = content.replace(
  /placeholder=\{t\("ribbon\.insert\.codeBlockSearchPlaceholder", \{ count: ALL_FENCE_LANGUAGES\.length \}\)\}/g,
  'placeholder={`Search ${ALL_FENCE_LANGUAGES.length} languages…`}'
);

// Fix QUICK_LANGUAGES map - add t() for label and hint
content = content.replace(
  /label=\{label\} hint=\{`Insert a \$\{fenceLabel\(id\)\} code block`\}/g,
  'label={label} hint={t("ribbon.insert.quickLanguageHint", { lang: fenceLabel(id) })}'
);

// Fix stickers RibbonMenu hint
content = content.replace(
  /<RibbonMenu id="insert\.sticker" icon=\{Star\} label=\{t\("ribbon\.insert\.stickers"\)\} hint="Insert a built-in sticker" width=\{320\}>/g,
  '<RibbonMenu id="insert.sticker" icon={Star} label={t("ribbon.insert.stickers")} hint={t("ribbon.insert.stickersMenuHint")} width={320}>'
);

// Fix Symbols RibbonMenu hint
content = content.replace(
  /<RibbonMenu id="insert\.symbols" icon=\{Omega\} label=\{t\("ribbon\.insert\.symbols"\)\} hint="Special characters" width=\{330\}>/g,
  '<RibbonMenu id="insert.symbols" icon={Omega} label={t("ribbon.insert.symbols")} hint={t("ribbon.insert.symbolsMenuHint")} width={330}>'
);

// Fix codeBlock RibbonMenu hint
content = content.replace(
  /hint="Insert a fenced code block; wraps the selection when there is one"/g,
  'hint={t("ribbon.insert.codeBlockMenuHint")}'
);

// Fix the Figure caption prompt
content = content.replace(
  /prompt\(t\("ribbon\.insert\.figureCaptionPrompt"\)\)/g,
  'prompt(t("ribbon.insert.figureCaptionPrompt"))'
);

// Fix the Bookmark name prompt
content = content.replace(
  /prompt\(t\("ribbon\.insert\.bookmarkPrompt"\)\)/g,
  'prompt(t("ribbon.insert.bookmarkPrompt"))'
);

// Fix the chart type prompt
content = content.replace(
  /const type = prompt\(t\("ribbon\.insert\.chartTypePrompt"\), "bar"\);/g,
  'const type = prompt(t("ribbon.insert.chartTypePrompt"), "bar");'
);

// Fix needBlock constant - it's used in disabledReason
content = content.replace(
  /const needBlock = t\("ribbon\.insert\.needCodeBlock"\);/g,
  'const needBlock = t("ribbon.insert.needCodeBlock");'
);

// Check for any remaining hardcoded strings in JSX attributes
// Fix any remaining label/hint that are still hardcoded
// The QUICK_LANGUAGES hint needs a translation key
// We'll need to add "quickLanguageHint" to the locale files

fs.writeFileSync(filePath, content);
console.log('InsertTab.jsx fixed!');