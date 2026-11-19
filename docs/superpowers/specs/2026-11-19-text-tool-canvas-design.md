# Text Tool for Canvas - Design Document

## Intent
Improve the text box and sticky note tools in the canvas/ink system to provide a better text editing experience with inline formatting options.

## Current State
- `addTextBox` and `addSticky` tools create objects at click position (centered) and immediately switch back to select mode
- User must double-click to edit text
- Text properties (font, size, color, alignment) are only editable via the CanvasInspector sidebar
- No inline formatting toolbar
- Empty text boxes persist if user clicks away without typing

## Requirements

### Text Tool Behavior
1. **Click to create**: Click on canvas → text box/sticky appears at click position (top-left at click) with immediate editing
2. **Drag to size** (text box only): Click and drag to define width/height, then start editing
3. **Auto-delete empty**: If user finishes editing with empty content, the object is deleted
4. **Double-click to edit**: Existing behavior preserved for already-created objects

### Inline Text Formatting Toolbar
When a text box or sticky note is selected or being edited, show a toolbar with:
- **Font family**: 4 choices (App Sans, App Serif, App Mono, Georgia)
- **Font size**: 8-96 (dropdown with common sizes)
- **Bold** (toggle)
- **Italic** (toggle)
- **Alignment**: Left, Center, Right
- **Text color**: Same palette as D3 (COLORS from text-style.js)
- **Sticky note background**: 6 pastel colors

### Keyboard Support
- **Delete/Backspace**: Remove selected object (not while editing)
- **Escape**: Cancel editing, revert changes

### RTL Support
- Set `dir="auto"` on the editing textarea
- Arabic text should display right-to-left

## Technical Approach

### Files to Modify
1. **`src/components/canvas/CanvasBoard.jsx`** - Modify text tool creation logic
2. **`src/components/ink/FloatingObjects.jsx`** - Add formatting toolbar and improve editing
3. **`src/lib/locales/en.json`** (and other locales) - Add i18n keys

### Implementation Details

#### CanvasBoard.jsx Changes
- In `onPointerDown` for `addTextBox` and `addSticky`:
  - Create object at click position (not centered)
  - For text box: support drag-to-size by tracking drag start/end
  - Immediately set `editingObjectId` to new object
  - Switch tool to `select` after creation
- Handle drag-to-size for text box in `onPointerMove`/`endStroke`

#### FloatingObjects.jsx Changes
- Add state for showing formatting toolbar
- Render toolbar when text box/sticky is selected or editing
- Toolbar positioned near the object (top-center)
- Connect toolbar controls to `onUpdateObject` for the selected/editing object
- Add `dir="auto"` to overlay textarea
- Handle Delete key for selected objects (when not editing)

#### i18n Keys to Add
- `vault.canvas.textTools.fontFamily`
- `vault.canvas.textTools.fontSize`
- `vault.canvas.textTools.bold`
- `vault.canvas.textTools.italic`
- `vault.canvas.textTools.alignLeft`
- `vault.canvas.textTools.alignCenter`
- `vault.canvas.textTools.alignRight`
- `vault.canvas.textTools.textColor`
- `vault.canvas.textTools.stickyColor`
- Font family labels: `app`, `display`, `mono`, `georgia`

## Font Choices (4 App Fonts)
Based on `text-style.js` EDITOR_FONTS and theme CSS variables:
1. **App Sans** (`app`) - `var(--font-body)` = Inter
2. **App Serif** (`display`) - `var(--font-display)` = Instrument Serif
3. **App Mono** (`mono`) - `var(--font-mono)` = JetBrains Mono
4. **Georgia** (`georgia`) - Georgia, serif (widely available serif)

## Sticky Note Pastel Colors (6)
Light pastel backgrounds suitable for sticky notes:
1. Yellow `#fef08a` (current default)
2. Pink `#fce7f3`
3. Blue `#dbeafe`
4. Green `#dcfce7`
5. Purple `#f3e8ff`
6. Orange `#ffedd5`

## Risk Assessment
- **Low risk**: Changes are confined to canvas text tools
- **Data migration**: None needed - existing notes/objects unaffected
- **Backward compatibility**: Double-click editing still works
- **Testing needed**: RTL text, drag-to-size, auto-delete, toolbar interactions

## Acceptance Criteria
1. Click at three different places with text tool → three boxes at click positions, visible
2. Type text, click away → text persists
3. Click away from empty box → box deleted
4. Change size/color of one → updates after click away
5. Reload → all text still there
6. Type Arabic sentence → displays right-to-left (screenshot)