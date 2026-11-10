# Design Tab Implementation Plan

## Overview
Implement a comprehensive Design tab in the NoteRibbon with 6 sections for per-note styling, using the existing `note.style` object saved in IndexedDB via `src/api/localDb.js`.

## Files to Modify
1. **`src/lib/text-style.js`** - Extend with new style properties, validation in `normalizeStyle`, and application in `readerProps`/`editorProps`
2. **`src/components/ribbon/tabs/DesignTab.jsx`** - Complete redesign with all 6 sections
3. **`src/index.css`** - Add CSS for page backgrounds, watermarks, page borders
4. **`src/lib/preferences.js`** - Add "Set as default" functionality (new key for default note style)

## Files to Create
- None (extending existing files only)

## Data Shape Changes (note.style)
New properties added to `note.style` (validated by `normalizeStyle`):
```javascript
{
  // Page style (background pattern)
  pageStyle: "default" | "grid" | "lines" | "blank",
  pageGridSize: number,      // grid spacing in px (default 24)
  pageLineHeight: number,    // line spacing in px (default 28)
  
  // Style sets (6 presets)
  styleSet: "classic" | "modern" | "compact" | "report" | "arabic" | "mono",
  
  // Theme (per-note override)
  themePreset: string,       // theme preset id from theme-presets.js
  themeAccent: string,       // hex color for accent
  themeHeadingFont: string,  // font id from FONTS
  themeBodyFont: string,     // font id from FONTS
  
  // Paragraph spacing
  paragraphPreset: "tight" | "normal" | "relaxed" | "double",
  
  // Page appearance
  pageColor: string,         // hex color
  pageBorder: "none" | "line" | "double" | "rounded",
  pageBorderColor: string,   // hex color
  
  // Watermark
  watermarkText: string,     // "DRAFT", "CONFIDENTIAL", etc.
  watermarkColor: string,    // hex color
  watermarkOpacity: number,  // 0-1
  watermarkAngle: "diagonal" | "horizontal",
}
```

## Risk Assessment
- **Low risk**: All changes are additive to `note.style`. Existing notes without these properties will use defaults.
- **Migration**: `normalizeStyle` safely ignores unknown keys. No migration needed.
- **Backwards compatibility**: All new properties are optional with sensible defaults.

## Implementation Order
1. Extend `text-style.js` with new constants and validation
2. Update `readerProps` and `editorProps` to apply new styles
3. Add CSS for page backgrounds, watermarks, page borders
4. Build the complete `DesignTab.jsx` with all 6 sections
5. Add "Set as default for new notes" button (saves to preferences)
6. Test and verify

## Testing
- Hand-test each section in the browser
- Verify old notes still open (no style property changes)
- Verify "Set as default" works for new notes
- Run `npx eslint src --quiet` and `npm run build`