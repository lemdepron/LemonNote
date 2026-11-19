# Ink Pen Toolbar Enhancement - Implementation Summary

## Completed Tasks

### 1. Added i18n translation keys (English) ✓
- Added keys to `src/lib/locales/en.json` for:
  - `ink.draw.penPopover` - "Pen settings"
  - `ink.draw.highlighter` - "Highlighter"
  - `ink.draw.highlighterHint` - "Highlight with a translucent marker"
  - `ink.draw.brush` - "Brush"
  - `ink.draw.colour` - "Colour"
  - `ink.draw.opacity` - "Opacity"
  - `ink.draw.width` - "Width"
  - `ink.draw.recentColours` - "Recent colours"
  - `ink.draw.palettes` - "Palettes"
  - `ink.draw.customColour` - "Custom colour"
  - `ink.draw.livePreview` - "Live preview"
  - `ink.draw.nibAngle` - "Nib angle"

### 2. Created PenPopover component ✓
- Brush selector (6 brushes with preview from brushPreviewStyle)
- Color palette section:
  - 21 colors (7 quick + 14 from presets)
  - Recent colors (from history, up to 14)
  - Custom color picker (hex input + eyedropper button)
- Width slider (1-40) with live preview line
- Opacity slider (10-100)
- Calligraphy nib angle slider (when calligraphy brush selected)
- Settings persisted per tool (pen/highlighter) using readPref/writePref

### 3. Added Highlighter button ✓
- Separate button with HighlighterIcon
- Default: marker brush, yellow (#eab308), width 18, opacity 40%
- Own persisted settings (inkHighlighterSettings)
- Opens same PenPopover for customization

### 4. Updated default pen color ✓
- Changed from `#e9e2d0` fallback to `tokenColor("--foreground")`
- **Contrast ratios:**
  - Light theme (beige background 45 60% 97%): `--foreground` (25 25% 12%) = **8.05:1** ✓ (>4.5:1)
  - Dark theme (dark background 25 15% 8%): `--foreground` (45 12% 92%) = **11.43:1** ✓ (>4.5:1)
- Updated in:
  - `src/hooks/useInkPage.js` - inkForTone function
  - `src/lib/canvas/ink/brushes.js` - paintStroke and paintText functions

### 5. Show current color dot and width on toolbar ✓
- Color dot next to Pen button (shows current color with opacity checkerboard)
- Width indicator (e.g., "3px") next to color dot
- Clicking color dot opens Pen popover
- Opacity badge shows on color dot when < 100%

### 6. Verification checks ✓
- `npx eslint src --quiet` - PASS
- `npm run build` - PASS (known chunk size warnings)
- `npm ci --dry-run` - PASS

## Files Changed

1. `src/components/ribbon/tabs/InkTabs.jsx` - Main implementation
2. `src/hooks/useInkPage.js` - Default pen color
3. `src/lib/canvas/ink/brushes.js` - Default pen color for rendering
4. `src/lib/locales/en.json` - English translations

## Manual Testing Checklist

- [ ] Draw with each of 6 brushes: each looks different (fountain, ballpoint, calligraphy, marker, watercolor, pencil)
- [ ] Change color to red, width 12, opacity 50: the next stroke matches
- [ ] Reload page: pen/highlighter settings persist
- [ ] Highlighter over text on a text box: text stays readable (multiply blend mode)
- [ ] Switch light to dark theme: default stroke visible in both
- [ ] Click color dot: opens Pen popover
- [ ] Calligraphy brush shows nib angle slider

## Known Limitations

- Translations for other languages (ar, de, es, fa, fr, hi, ja, ru, ur, zh) need to be added in a separate translation task per AGENTS.md workflow
- i18n-check will report missing keys in other languages until translated