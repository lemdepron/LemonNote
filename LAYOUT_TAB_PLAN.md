# LayoutTab — Panel Pattern Migration Plan

## Current State Analysis

LayoutTab currently has **5 groups** with **36 controls** (selects, steppers, buttons, menus):

| Group | Controls | Current Icons | Issues |
|-------|----------|---------------|--------|
| **Page setup** | 9 (1 select + 2 steppers + 1 select + 1 select + 4 steppers) | FileText (wrong for most) | Steppers use FileText icon, no labels; custom width/height and margins need proper icons |
| **Columns** | 4 (2 selects + 2 buttons) | Columns, GripVertical, LayoutDashboard | OK but LayoutDashboard for pageBreak unclear |
| **Editor** | 2 (1 button + 1 select) | Maximize2, Type | hyphens uses Type icon |
| **Paragraph** | 8 (4 steppers + 4 buttons) | Type (wrong for all steppers), Align* | Steppers use Type icon with "0em" label |
| **Floating objects** | 13 (2 menus + 6 buttons + 1 button + 2 menus + 2 buttons) | Move, MoveHorizontal, ArrowUp, ArrowDown, Plus, Minus, List, AlignHorizontalDistributeCenter, Group, RotateCw, RotateCcw, RotateCw | bringForward/sendBackward arrows unclear; bringToFront/sendToBack Plus/Minus unclear; undo/redo icons duplicate rotate |

---

## Step 1a: Button/Control Inventory with Icon Fixes

| Group | ID | Type | Current Icon | Current Label | What It Does | Proposed Icon | Reason | Visible / "..." |
|-------|-----|------|--------------|---------------|--------------|---------------|--------|-----------------|
| **Page Setup** | layout.pageSize | RibbonSelect | — | Page size | Paper size dropdown | — | Select, no icon | Visible (1) |
| | layout.pageWidth | Stepper | FileText | Custom width | Custom page width (mm) | Maximize2 | Width/height dimension | "..." |
| | layout.pageHeight | Stepper | FileText | Custom height | Custom page height (mm) | Maximize2 | Width/height dimension | "..." |
| | layout.pageOrientation | RibbonSelect | FileText | Orientation | Portrait/Landscape | RotateCw | Page rotation | Visible (2) |
| | layout.pageMargins | RibbonSelect | — | Margins | Margin preset dropdown | — | Select, no icon | Visible (3) |
| | layout.marginTop | Stepper | FileText | Top margin | Top margin (mm) | ArrowUp | Top edge | "..." |
| | layout.marginRight | Stepper | FileText | Right margin | Right margin (mm) | ArrowRight | Right edge | "..." |
| | layout.marginBottom | Stepper | FileText | Bottom margin | Bottom margin (mm) | ArrowDown | Bottom edge | "..." |
| | layout.marginLeft | Stepper | FileText | Left margin | Left margin (mm) | ArrowLeft | Left edge | "..." |
| **Columns** | layout.columnCount | RibbonSelect | — | Columns | Number of columns | — | Select | Visible (1) |
| | layout.columnGap | RibbonSelect | — | Column gap | Gap between columns (em) | — | Select | Visible (2) |
| | layout.columnBreak | Btn | GripVertical | Column break | Insert column break | GripVertical | Vertical grip = column break | Visible (3) |
| | layout.pageBreak | Btn | LayoutDashboard | Page break | Insert page break | FileText | Page = page break | Visible (4) |
| **Editor** | layout.lineNumbers | Btn | Maximize2 | Line numbers | Toggle line numbers gutter | Maximize2 | Gutter/lines | Visible (1) |
| | layout.hyphens | RibbonSelect | Type | Hyphenation | Auto/none hyphenation | Scissors | Hyphenation = cutting words | Visible (2) |
| **Paragraph** | layout.indentLeft | Stepper | Type | Indent left | Left indent (em) | IndentIncrease | Standard indent icon | Visible (1) |
| | layout.indentRight | Stepper | Type | Indent right | Right indent (em) | IndentDecrease | Standard indent icon | Visible (2) |
| | layout.spacingBefore | Stepper | Type | Spacing before | Space before paragraph (em) | ArrowUp | Space above = up | Visible (3) |
| | layout.spacingAfter | Stepper | Type | Spacing after | Space after paragraph (em) | ArrowDown | Space below = down | Visible (4) |
| | layout.alignLeft | Btn | AlignLeft | Align left | Align left | AlignLeft | Correct | Visible (5) |
| | layout.alignCenter | Btn | AlignCenter | Centre | Align center | AlignCenter | Correct | "..." |
| | layout.alignRight | Btn | AlignRight | Align right | Align right | AlignRight | Correct | "..." |
| | layout.alignJustify | Btn | AlignJustify | Justify | Align justify | AlignJustify | Correct | "..." |
| **Floating Objects** | layout.position | RibbonMenu | Move | Position | Preset positions menu | Move | Move object | Visible (1) |
| | layout.wrapText | RibbonMenu | MoveHorizontal | Wrap Text | Text wrap options | MoveHorizontal | Text flow around | Visible (2) |
| | layout.bringForward | Btn | ArrowUp | Bring Forward | Layer +1 | ArrowUp | Forward = up in stack | Visible (3) |
| | layout.sendBackward | Btn | ArrowDown | Send Backward | Layer -1 | ArrowDown | Backward = down in stack | Visible (4) |
| | layout.bringToFront | Btn | Plus | Bring to Front | Top layer | Layers | Front = top layer | Visible (5) |
| | layout.sendToBack | Btn | Minus | Send to Back | Bottom layer | Layers | Back = bottom layer | "..." |
| | layout.selectionPane | Btn | List | Selection Pane | Toggle object list panel | List | List of objects | "..." |
| | layout.align | RibbonMenu | AlignHorizontalDistributeCenter | Align | Align to page edges | AlignHorizontalDistributeCenter | Align/distribute | "..." |
| | layout.group | RibbonMenu | Group | Group | Group/ungroup objects | Group | Group objects | "..." |
| | layout.rotate | RibbonMenu | RotateCw | Rotate | Rotate/flip menu | RotateCw | Rotate | "..." |
| | layout.undo | Btn | RotateCcw | Undo | Undo floating object change | RotateCcw | Undo arrow | "..." |
| | layout.redo | Btn | RotateCw | Redo | Redo floating object change | Redo2 | Redo distinct from rotate | "..." |

---

## Step 1b: New Group Layout (Max 5 visible + "..." popover)

### Width Calculation
- Each control: ~44px (32px button + 4px gap + label space)
- 5 visible = ~220px per group
- 5 groups × 220px = 1100px
- RibbonPanel max ≈ 1150px (fits 1366px window with tab line padding)
- **Total: ~1100px ✓ fits**

### Proposed Groups (in priority order)

| Group | Priority | Visible (5) | In "..." Popover |
|-------|----------|-------------|------------------|
| **Page Setup** | 70 | pageSize, pageOrientation, pageMargins, columnBreak, pageBreak | pageWidth, pageHeight, marginTop, marginRight, marginBottom, marginLeft |
| **Columns** | 60 | columnCount, columnGap, columnBreak, pageBreak | (none — only 4 controls) |
| **Editor** | 50 | lineNumbers, hyphens | (none — only 2 controls) |
| **Paragraph** | 40 | indentLeft, indentRight, spacingBefore, spacingAfter, alignLeft | alignCenter, alignRight, alignJustify |
| **Floating Objects** | 30 | position, wrapText, bringForward, sendBackward, bringToFront | sendToBack, selectionPane, align, group, rotate, undo, redo |

**Note:** The "Columns" group currently shares columnBreak/pageBreak with Page Setup. Keep them in Columns only (they belong to column/page flow). Remove from Page Setup.

---

## Step 1c: Click Test Matrix (Every Button Must Work)

| ID | Click Action | Expected Result | Status |
|----|--------------|-----------------|--------|
| layout.pageSize | Select dropdown → pick A5 | note.style.pageSize = "a5" | ✓ works |
| layout.pageWidth | Click +/− | note.style.pageWidth changes (mm) | ⚠ unproven — no icon/tooltip |
| layout.pageHeight | Click +/− | note.style.pageHeight changes (mm) | ⚠ unproven — no icon/tooltip |
| layout.pageOrientation | Select dropdown → pick Landscape | note.style.pageOrientation = "landscape" | ✓ works |
| layout.pageMargins | Select dropdown → pick Narrow | note.style.pageMargins = "narrow" | ✓ works |
| layout.marginTop | Click +/− | note.style.marginTop changes (mm) | ⚠ unproven — no icon/tooltip |
| layout.marginRight | Click +/− | note.style.marginRight changes (mm) | ⚠ unproven — no icon/tooltip |
| layout.marginBottom | Click +/− | note.style.marginBottom changes (mm) | ⚠ unproven — no icon/tooltip |
| layout.marginLeft | Click +/− | note.style.marginLeft changes (mm) | ⚠ unproven — no icon/tooltip |
| layout.columnCount | Select dropdown → pick 2 | note.style.columnCount = 2 | ✓ works |
| layout.columnGap | Select dropdown → pick 2 | note.style.columnGap = 2 | ✓ works |
| layout.columnBreak | Click button | Inserts `data-column-break="true"` at cursor | ✓ works (insertColumnBreak) |
| layout.pageBreak | Click button | Inserts `data-page-break="true"` at cursor | ✓ works (insertPageBreak) |
| layout.lineNumbers | Click button (toggle) | note.style.showLineNumbers toggles | ✓ works |
| layout.hyphens | Select dropdown → pick Auto | note.style.hyphens = "auto" | ✓ works |
| layout.indentLeft | Click +/− | note.style.il changes by 0.5em | ⚠ unproven — no icon/tooltip |
| layout.indentRight | Click +/− | note.style.ir changes by 0.5em | ⚠ unproven — no icon/tooltip |
| layout.spacingBefore | Click +/− | note.style.sb changes by 0.5em | ⚠ unproven — no icon/tooltip |
| layout.spacingAfter | Click +/− | note.style.sa changes by 0.5em | ⚠ unproven — no icon/tooltip |
| layout.alignLeft | Click button (toggle) | note.style.a = "left" (or drop) | ✓ works |
| layout.alignCenter | Click button (toggle) | note.style.a = "center" (or drop) | ✓ works |
| layout.alignRight | Click button (toggle) | note.style.a = "right" (or drop) | ✓ works |
| layout.alignJustify | Click button (toggle) | note.style.a = "justify" (or drop) | ✓ works |
| layout.position | Open menu → pick Top Center | Selected ink object moves to top-center | ✓ works (if ink+object selected) |
| layout.wrapText | Open menu → pick Square | Selected object wrap = "square" | ✓ works (if ink+object selected) |
| layout.bringForward | Click button | Selected object zOrder +1 | ✓ works (if ink+object selected) |
| layout.sendBackward | Click button | Selected object zOrder -1 | ✓ works (if ink+object selected) |
| layout.bringToFront | Click button | Selected object to max zOrder | ✓ works (if ink+object selected) |
| layout.sendToBack | Click button | Selected object to min zOrder | ✓ works (if ink+object selected) |
| layout.selectionPane | Click button (toggle) | Bottom-right panel opens/closes | ✓ works (if objects exist) |
| layout.align | Open menu → pick Align Left | Selected object x = margin | ✓ works (if ink+object selected) |
| layout.group | Open menu → pick Group | Selected objects get groupId | ✓ works (if ink+multi-select) |
| layout.rotate | Open menu → pick Rotate 90° | Selected object rotation +90° | ✓ works (if ink+object selected) |
| layout.undo | Click button | Undo last ink object change | ✓ works (if canUndo) |
| layout.redo | Click button | Redo last ink object change | ✓ works (if canRedo) |

### Dead or Unproven Buttons (Require Fix)

| ID | Issue | Fix |
|----|-------|-----|
| layout.pageWidth | No icon, shows "210mm" with no label | Add Maximize2 icon + title tooltip |
| layout.pageHeight | No icon, shows "297mm" with no label | Add Maximize2 icon + title tooltip |
| layout.marginTop | No icon, shows "25.4mm" with no label | Add ArrowUp icon + title tooltip |
| layout.marginRight | No icon, shows "25.4mm" with no label | Add ArrowRight icon + title tooltip |
| layout.marginBottom | No icon, shows "25.4mm" with no label | Add ArrowDown icon + title tooltip |
| layout.marginLeft | No icon, shows "25.4mm" with no label | Add ArrowLeft icon + title tooltip |
| layout.indentLeft | No icon, shows "0em" with no label | Add IndentIncrease icon + title tooltip |
| layout.indentRight | No icon, shows "0em" with no label | Add IndentDecrease icon + title tooltip |
| layout.spacingBefore | No icon, shows "0em" with no label | Add ArrowUp icon + title tooltip |
| layout.spacingAfter | No icon, shows "0em" with no label | Add ArrowDown icon + title tooltip |
| layout.pageBreak | LayoutDashboard icon unclear | Change to FileText (page icon) |
| layout.hyphens | Type icon unclear | Change to Scissors (cut/hyphenate) |
| layout.bringToFront | Plus icon unclear | Change to Layers (layers = stack) |
| layout.sendToBack | Minus icon unclear | Change to Layers (layers = stack) |
| layout.redo | RotateCw duplicates rotate menu icon | Change to Redo2 (distinct) |

---

## Implementation Steps

### 1. Update Imports (LayoutTab.jsx)
Add new icons: `IndentIncrease`, `IndentDecrease`, `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Scissors`, `Layers`, `Redo2`, `FileText` (already), `RotateCw` (already)

### 2. Reorganize Groups per Plan
- Move columnBreak/pageBreak from Page Setup → Columns
- Add proper icons to all steppers with `title` tooltip
- Fix wrong icons per table above
- Apply `RibbonGroup` `more` prop for overflow

### 3. Add Tooltips to Steppers
Each Stepper needs a `title` prop describing what it does (e.g., "Custom page width (mm)", "Left margin (mm)", "Indent left (em)", "Spacing before (em)")

### 4. Ensure Right-Click "Add to Quick Access" Works
All buttons with `id` already get this via `RibbonButton` — verify all have unique `id` props

### 5. Pure Logic Tests (Node script)
Test the format-actions that these buttons trigger:
- insertPageBreak
- insertColumnBreak
- indent/spacing patch logic
- alignment toggle logic

### 6. Manual Test Checklist (per AGENTS.md)

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Steppers still show "0em" without label | Add `title` tooltip + icon; inside "..." popover they get full text label via MenuItem |
| Group width exceeds 1150px | Count: 5 groups × 5 visible = 25 controls × ~44px = 1100px ✓ |
| Floating object buttons disabled when no selection | Already handled via `disabled={!hasSelection}` |
| Old notes still open | No data shape changes — only UI reorganization |
| i18n keys missing | Use existing keys; no new visible text added |

---

## Files to Change

1. **src/components/ribbon/tabs/LayoutTab.jsx** — Main implementation
2. **scripts/ui-check.mjs** — New verification script (or update existing)

---

## Test by Hand (Numbered Steps)

1. Open a Markdown note → click Layout tab
2. Verify **Page Setup** group: pageSize, pageOrientation, pageMargins, columnBreak, pageBreak visible; click "..." → see pageWidth, pageHeight, 4 margins
3. Verify **Columns** group: columnCount, columnGap, columnBreak, pageBreak (all 4 visible, no "...")
4. Verify **Editor** group: lineNumbers, hyphens (both visible)
5. Verify **Paragraph** group: indentLeft, indentRight, spacingBefore, spacingAfter, alignLeft visible; "..." shows alignCenter, alignRight, alignJustify
6. Verify **Floating Objects** group: position, wrapText, bringForward, sendBackward, bringToFront visible; "..." shows sendToBack, selectionPane, align, group, rotate, undo, redo
7. Hover each stepper → tooltip shows correct description (e.g., "Custom page width (mm)")
8. Click indentLeft + → verify note.style.il increases by 0.5
9. Click spacingAfter + → verify note.style.sa increases by 0.5
10. Click alignCenter → verify note.style.a = "center"
11. With ink page + object selected: click bringForward → verify zOrder increases
12. Click selectionPane → verify panel opens bottom-right
13. Right-click any button → "Add to Quick Access" appears
14. Open an old note (created before this change) → verify it loads without error
15. Run `npx eslint src --quiet`, `npm run build`, `node scripts/i18n-check.mjs`, `npm ci --dry-run` → all pass

---

**STOP — Waiting for "go" to proceed with implementation.**