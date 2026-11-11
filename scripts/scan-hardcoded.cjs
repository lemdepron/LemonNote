const fs = require('fs');
const path = require('path');

function scanDir(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', 'src-tauri', '.git', 'build'].includes(entry.name)) {
        scanDir(fullPath, files);
      }
    } else if (['.jsx', '.js'].includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

const sourceFiles = scanDir('src');
const patterns = [
  // JSX text content (between > and <)
  />\s*([A-Z][a-zA-Z][^<>{}\n]{3,})\s*</g,
  // placeholder="..."
  /placeholder\s*=\s*["']([^"']{3,})["']/g,
  // title="..."
  /title\s*=\s*["']([^"']{3,})["']/g,
  // aria-label="..."
  /aria-label\s*=\s*["']([^"']{3,})["']/g,
  // toast messages
  /toast\.(success|error|info|warning)\(\s*["']([^"']{3,})["']/g,
];

const results = {};
const englishRegex = /[A-Za-z]{3,}/;

for (const file of sourceFiles) {
  if (!file.includes('/pages/') && !file.includes('/components/')) continue;
  const content = fs.readFileSync(file, 'utf8');
  const fileResults = [];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const text = match[1] || match[0];
      if (englishRegex.test(text) && !text.includes('{') && !text.includes('}') && !text.startsWith('t(') && !text.startsWith('tr(')) {
        // Filter out common non-UI strings (CSS properties, etc.)
        const skipPatterns = [
          /^className/, /^onClick/, /^onChange/, /^href/, /^src/, /^alt/, /^id$/, /^type$/, /^role$/, 
          /^data-/, /^style$/, /^width$/, /^height$/, /^color$/, /^background/, /^margin/, /^padding/, 
          /^border/, /^font/, /^display/, /^position/, /^flex/, /^grid/, /^gap/, /^align/, /^justify/, 
          /^overflow/, /^zIndex/, /^transform/, /^transition/, /^opacity/, /^visibility/, /^cursor/, 
          /^pointer/, /^userSelect/, /^boxSizing/, /^outline/, /^textDecoration/, /^textTransform/, 
          /^whiteSpace/, /^wordBreak/, /^lineHeight/, /^letterSpacing/, /^fontSize/, /^fontWeight/, 
          /^fontFamily/, /^minWidth/, /^maxWidth/, /^minHeight/, /^maxHeight/, /^objectFit/, /^objectPosition/,
          /^resize$/, /^scroll$/, /^auto$/, /^hidden$/, /^visible$/, /^relative$/, /^absolute$/, /^fixed$/,
          /^sticky$/, /^static$/, /^inherit$/, /^initial$/, /^unset$/, /^revert$/, /^revert-layer$/, 
          /^all$/, /^none$/, /^block$/, /^inline$/, /^inline-block$/, /^inline-flex$/, /^inline-grid$/,
          /^table$/, /^table-row$/, /^table-cell$/, /^table-caption$/, /^table-column$/, /^table-column-group$/,
          /^table-footer-group$/, /^table-header-group$/, /^table-row-group$/, /^list-item$/, /^run-in$/,
          /^flow-root$/, /^contents$/, /^ruby$/, /^ruby-base$/, /^ruby-text$/, /^ruby-base-container$/,
          /^ruby-text-container$/, /^sub$/, /^super$/, /^text-top$/, /^text-bottom$/, /^middle$/, /^top$/,
          /^bottom$/, /^baseline$/, /^length$/, /^percentage$/, /^number$/, /^angle$/, /^time$/, /^frequency$/,
          /^resolution$/, /^flex-grow$/, /^flex-shrink$/, /^flex-basis$/, /^flex-direction$/, /^flex-wrap$/,
          /^flex-flow$/, /^justify-content$/, /^align-items$/, /^align-self$/, /^align-content$/,
          /^place-items$/, /^place-content$/, /^place-self$/, /^justify-items$/, /^justify-self$/, /^order$/,
          /^z-index$/, /^isolation$/, /^clip-path$/, /^mask$/, /^mask-image$/, /^mask-mode$/, /^mask-repeat$/,
          /^mask-position$/, /^mask-size$/, /^mask-composite$/, /^filter$/, /^backdrop-filter$/, /^mix-blend-mode$/,
          /^background-blend-mode$/, /^shape-outside$/, /^clip-rule$/, /^fill-rule$/, /^color-interpolation$/,
          /^color-rendering$/, /^text-rendering$/, /^image-rendering$/, /^shape-rendering$/, /^dominant-baseline$/,
          /^alignment-baseline$/, /^baseline-shift$/, /^glyph-orientation-vertical$/, /^glyph-orientation-horizontal$/,
          /^kerning$/, /^letter-spacing$/, /^word-spacing$/, /^writing-mode$/, /^text-orientation$/, /^text-combine-upright$/,
          /^unicode-bidi$/, /^direction$/, /^tab-size$/, /^text-indent$/, /^hanging-punctuation$/, /^text-shadow$/,
          /^text-decoration-line$/, /^text-decoration-color$/, /^text-decoration-style$/, /^text-decoration-thickness$/,
          /^text-underline-offset$/, /^text-underline-position$/, /^text-emphasis$/, /^text-emphasis-color$/,
          /^text-emphasis-style$/, /^text-emphasis-position$/, /^text-orientation$/, /^text-transform$/, /^white-space$/,
          /^word-break$/, /^word-wrap$/, /^overflow-wrap$/, /^line-break$/, /^hyphens$/, /^overflow-x$/, /^overflow-y$/,
          /^overscroll-behavior$/, /^overscroll-behavior-x$/, /^overscroll-behavior-y$/, /^touch-action$/, /^pointer-events$/,
          /^user-select$/, /^resize$/, /^scroll-snap$/, /^scroll-snap-type$/, /^scroll-snap-align$/, /^scroll-snap-stop$/,
          /^scroll-padding$/, /^scroll-margin$/, /^scroll-behavior$/, /^position$/, /^top$/, /^right$/, /^bottom$/, /^left$/,
          /^inset$/, /^inset-block$/, /^inset-inline$/, /^float$/, /^clear$/, /^display$/, /^visibility$/, /^opacity$/,
          /^z-index$/, /^overflow$/, /^overflow-x$/, /^overflow-y$/, /^clip$/, /^clip-path$/, /^object-fit$/, /^object-position$/,
          /^vertical-align$/, /^box-sizing$/, /^width$/, /^min-width$/, /^max-width$/, /^height$/, /^min-height$/, /^max-height$/,
          /^margin$/, /^margin-top$/, /^margin-right$/, /^margin-bottom$/, /^margin-left$/, /^padding$/, /^padding-top$/,
          /^padding-right$/, /^padding-bottom$/, /^padding-left$/, /^border$/, /^border-width$/, /^border-style$/, /^border-color$/,
          /^border-radius$/, /^border-top$/, /^border-right$/, /^border-bottom$/, /^border-left$/, /^outline$/, /^outline-width$/,
          /^outline-style$/, /^outline-color$/, /^outline-offset$/, /^background$/, /^background-color$/, /^background-image$/,
          /^background-repeat$/, /^background-position$/, /^background-size$/, /^background-attachment$/, /^background-origin$/,
          /^background-clip$/, /^box-shadow$/, /^color$/, /^font$/, /^font-family$/, /^font-size$/, /^font-weight$/, /^font-style$/,
          /^font-variant$/, /^font-stretch$/, /^line-height$/, /^letter-spacing$/, /^text-align$/, /^text-decoration$/, /^text-indent$/,
          /^text-transform$/, /^white-space$/, /^word-spacing$/, /^direction$/, /^unicode-bidi$/, /^tab-size$/, /^content$/,
          /^quotes$/, /^counter-reset$/, /^counter-increment$/, /^list-style$/, /^list-style-type$/, /^list-style-position$/,
          /^list-style-image$/, /^table-layout$/, /^border-collapse$/, /^border-spacing$/, /^caption-side$/, /^empty-cells$/,
          /^page-break-before$/, /^page-break-after$/, /^page-break-inside$/, /^orphans$/, /^widows$/, /^cursor$/, /^zoom$/,
          /^appearance$/, /^box-align$/, /^box-direction$/, /^box-flex$/, /^box-flex-group$/, /^box-lines$/, /^box-ordinal-group$/,
          /^box-orient$/, /^box-pack$/, /^grid-column$/, /^grid-row$/, /^grid-area$/, /^grid-template$/, /^grid-template-rows$/,
          /^grid-template-columns$/, /^grid-template-areas$/, /^grid-auto-rows$/, /^grid-auto-columns$/, /^grid-auto-flow$/,
          /^justify-items$/, /^justify-self$/, /^place-items$/, /^place-self$/, /^place-content$/, /^align-items$/, /^align-self$/,
          /^align-content$/, /^justify-content$/, /^flex$/, /^flex-grow$/, /^flex-shrink$/, /^flex-basis$/, /^flex-direction$/,
          /^flex-wrap$/, /^flex-flow$/, /^order$/, /^align-items$/, /^align-self$/, /^align-content$/, /^justify-content$/
        ];
        
        let shouldSkip = false;
        for (const skipPattern of skipPatterns) {
          if (skipPattern.test(text)) {
            shouldSkip = true;
            break;
          }
        }
        if (!shouldSkip) {
          const lineNum = content.substring(0, match.index).split('\n').length;
          fileResults.push({ line: lineNum, text: text.substring(0, 80) });
        }
      }
    }
  }
  
  if (fileResults.length > 0) {
    results[file] = fileResults;
  }
}

// Sort by file
const sortedFiles = Object.entries(results).sort((a, b) => a[0].localeCompare(b[0]));
console.log('Total files with hard-coded English:', sortedFiles.length);
console.log('Top 15 files:');
for (let i = 0; i < Math.min(15, sortedFiles.length); i++) {
  const [file, items] = sortedFiles[i];
  console.log(`${i+1}. ${file} (${items.length} strings)`);
  for (const item of items.slice(0, 3)) {
    console.log(`   Line ${item.line}: ${item.text}`);
  }
  if (items.length > 3) console.log(`   ... and ${items.length - 3} more`);
}