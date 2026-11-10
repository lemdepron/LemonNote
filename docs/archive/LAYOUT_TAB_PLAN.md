# Layout Tab Implementation Plan

## Overview
Implement the Layout tab in the ribbon with controls for page setup, columns, line numbers, hyphenation, and paragraph-level indentation/spacing. Also update PDF export to respect page settings.

## Files to Create/Modify

### 1. `src/lib/text-style.js` - Add new constants and extend normalizeStyle/readerProps/editorProps/blockStyle
- Add PAGE_SIZES, PAGE_ORIENTATIONS, MARGINS, COLUMN_COUNTS constants
- Add new CSS custom properties for columns, hyphens, page breaks
- Add data attributes to sanitize whitelist: data-il, data-ir, data-sb, data-sa
- Extend blockStyle() to map data-il, data-ir, data-sb, data-sa to CSS
- Extend normalizeStyle() to validate new page settings
- Extend readerProps() and editorProps() for column CSS and hyphenation

### 2. `src/lib/format-actions.js` - Extend setBlock() for paragraph indentation/spacing
- Extend setBlock() to handle data-il, data-ir, data-sb, data-sa attributes (steps of 0.5em)
- Add new function `insertPageBreak()` and `insertColumnBreak()` for break markers

### 3. `src/components/ribbon/tabs/LayoutTab.jsx` - Full rewrite with all controls
- Page Setup group: Size, Orientation, Margins
- Columns group: Column count, Column gap, Column break button, Page break button
- Editor group: Line numbers toggle, Hyphenation toggle
- Paragraph group: Indent Left, Indent Right, Spacing Before, Spacing After (steppers in 0.5em steps)
- Floating Objects group: Disabled buttons with "Needs floating objects" tooltip

### 4. `src/components/vault/MarkdownEditor.jsx` - Add line numbers gutter
- Add line numbers gutter that scrolls with textarea
- Toggle via typography setting

### 5. `src/components/vault/MarkdownView.jsx` - Add column CSS support
- Apply column-count, column-gap CSS from typography

### 6. `src/lib/note-export.js` - Update PDF export with @page rules
- Use CSS @page for page size, orientation, margins
- Support custom page sizes in mm

### 7. `src/lib/ribbon-registry.js` - Register Layout tab actions (if needed)
- Register new break insertion actions

## Data Shape Changes (note.style additions)
- pageSize: "a4" | "a5" | "letter" | "legal" | "custom"
- pageWidth: number (mm, for custom)
- pageHeight: number (mm, for custom)
- pageOrientation: "portrait" | "landscape"
- pageMargins: "normal" | "narrow" | "wide" | "custom"
- marginTop, marginRight, marginBottom, marginLeft: number (mm, for custom)
- columnCount: 1 | 2 | 3
- columnGap: number (em)
- showLineNumbers: boolean
- hyphens: "auto" | "none"

## Block-level attributes (in markdown as `<div data-il="1.5" data-sa="1">`)
- data-il: indent left (em, 0.5 steps)
- data-ir: indent right (em, 0.5 steps)
- data-sb: spacing before (em, 0.5 steps)
- data-sa: spacing after (em, 0.5 steps)

## Sanitize Whitelist Additions
- div: dataIl, dataIr, dataSb, dataSa (hast camelCase)
- Also need data-column-break and data-page-break for break markers

## Risk Assessment
- **Low risk**: New typography settings are additive; old notes without these settings work as before
- **Medium risk**: setBlock() changes affect block wrapper - need to ensure existing block attributes (data-a, data-dir) still work
- **Low risk**: PDF export changes only affect export, not live editing
- **Low risk**: Line numbers is purely visual in editor

## Migration Strategy
- No migration needed - new settings are optional and default to current behavior
- normalizeStyle() will ignore unknown values
- Old notes open with existing typography intact

## Test Plan
1. Create new note, open Layout tab
2. Change page size to A5, orientation to landscape, margins to narrow
3. Set columns to 2, gap to 1.5em
4. Insert column break and page break
5. Enable line numbers in editor
6. Enable hyphenation
7. Select paragraphs, adjust Indent Left/Right, Spacing Before/After
8. Verify reader shows columns, hyphenation, paragraph spacing
9. Export to PDF, verify @page rules applied
10. Open old note - verify it still works