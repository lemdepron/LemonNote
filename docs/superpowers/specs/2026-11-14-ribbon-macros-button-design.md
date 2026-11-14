# Ribbon Macros Button - Design Document

## Intent
Move the MacroBar from under the writing area into a popover triggered by a "Macros" button in the ribbon tab line, right after the Word Goal button.

## Current State
- MacroBar renders in 5 places (3 in NotePane.jsx, 2 in NotePage.jsx) under the editor
- It provides: Record, Stop/Save, Play macros, Delete macros
- Macro data persisted via `localStorage` key "macros" (preferences system)

## Target State
1. Single "Macros" button in ribbon tab line (after Word Goal button)
2. Clicking it opens a Popover with the full MacroBar controls
3. All 5 MacroBar instances removed from under writing area
4. No functionality lost

## Approaches Considered

### Approach 1: Reuse MacroBar component inside a Popover (RECOMMENDED)
- Create a wrapper that renders MacroBar inside PopoverContent
- Minimal code changes, preserves all existing logic
- MacroBar already handles its own state (recording, macros list, etc.)

### Approach 2: Create new MacroPopover component
- Duplicate MacroBar logic into a new component designed for popover
- More code, but could optimize for popover UX
- Risk of divergence from MacroBar

### Approach 3: Move MacroBar logic to a hook + render in popover
- Extract logic to `useMacros` hook
- Render UI in popover
- More refactoring than needed

## Selected Approach: Approach 1
Reuse MacroBar inside a Popover. The MacroBar component is self-contained with its own state management. We just need to wrap it in a Popover and trigger from a ribbon button.

## Implementation Plan

### Files to Modify

1. **src/components/ribbon/NoteRibbon.jsx**
   - Import Popover components
   - Create a `MacrosPopover` component (or inline) that wraps MacroBar in Popover
   - Add "Macros" button to `afterTabs` (after wordGoalButton)
   - Pass `body` and `onChange` from NoteRibbon props to the popover

2. **src/components/notes/NotePane.jsx**
   - Remove MacroBar import
   - Remove 3 instances of `<MacroBar ... />` (lines ~1479, ~1602, ~1626)

3. **src/pages/NotePage.jsx**
   - Remove MacroBar import
   - Remove 2 instances of `<MacroBar ... />` (lines ~1671, ~1695)

4. **src/lib/locales/en.json**
   - Add `ribbon.macros` key with label "Macros" and hint

5. **Other locale files** (ar, de, es, fa, fr, hi, ja, ru, ur, zh)
   - Add same translation key

## Translation Keys to Add
```json
"ribbon": {
  "macros": "Macros",
  "macrosHint": "Record and replay editing macros"
}
```

## Risk Assessment
- Low: MacroBar is self-contained, just moving its render location
- No data shape changes
- No new dependencies
- Existing macros in localStorage will continue to work

## Testing
- Run `npm run dev` and verify:
  1. Macros button appears in ribbon after Word Goal
  2. Click opens popover with all MacroBar controls
  3. Record → type → Stop → Save works
  4. Play macro replays edits
  5. Delete macro works
  6. No MacroBar under writing area
  7. Works at narrow window widths (scrolls, doesn't wrap)
  8. Works in RTL mode
  9. Keyboard focus (Tab) reaches the button
- Run `npx eslint src --quiet`
- Run `npm run build`
- Run `node scripts/i18n-check.mjs`
- Run `npm ci --dry-run`