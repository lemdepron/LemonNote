# Ink Tab Refactor - Implementation Plan

## Files to modify
1. `src/components/ribbon/tabs/InkTabs.jsx` - Main refactor

## Changes needed

### 1. InkTab (note WITHOUT ink) - Lines 650-762
- Remove "About" group (lines 706-710)
- Keep "Handwriting" group but change "Start inking" to be the primary action
- When any drawing tool is clicked and `!noteInk.hasPage`, auto-call `noteInk.onStart()` then apply the tool

### 2. InkDrawTab - Lines 88-330 (sub-tab "draw")
- Replace 6 pen buttons with single "Pen" button opening popover with all brushes
- Keep Favourite pens but limit to 4 visible, add horizontal scroll
- Keep Width slider always visible
- Move Opacity slider to Color popover
- Combine Eraser mode chips + size buttons into single Eraser button with popover
- Move Brush engine to "..." popover
- Move Coordinate graph to "..." popover
- Keep Undo/Redo, Zoom±/Fit always visible
- Move Clear page to "..." popover

### 3. InkColorTab - Lines 338-460 (sub-tab "color")
- Replace hex input + quick inks + recent + studio menu with single "Color" button opening ColorStudio popover
- ColorStudio already has hex input, quick inks, recent, mixer, palettes - use that as the single source

### 4. New "More" popover (replaces separate sub-tabs)
- Move Select, Pan, Shape, Pick, Insert space here
- Move Eraser settings (mode + radius) here
- Move Brush engine here
- Move Coordinate graph here
- Move Paper settings here
- Move Smart ink here
- Move Audio here
- Move Overlay toggle here
- Move Remove ink here
- Move Attach old page here

### 5. InkTab sub-tab bar (lines 714-732)
- Replace 6 sub-tabs with: Draw, Color, More (3 tabs only)
- Draw tab = consolidated drawing tools
- Color tab = single color button
- More tab = "..." popover with everything else

### 6. Icon fixes
- Replace S/M/L letter buttons with proper icons (Eraser size presets in popover)
- Ensure all buttons have icons, not just letters

### 7. Width optimization
- Target: all always-visible controls fit in ~800px at 1100px viewport
- Use popovers for anything that overflows

## Implementation order
1. Create new consolidated InkDrawTab content
2. Create new simplified InkColorTab
3. Create MorePopover component
4. Update InkTab to use 3 sub-tabs + auto-start logic
5. Test at 1100px and 1366px