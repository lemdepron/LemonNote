# HomeTab Redesign Plan

## Current Problem
At 1366px window width, Home panel content is 1978px wide but only 1100px visible. Target: content width ≤ 1100px at 1366px.

---

## (a) Table of Every Home Button and Control

| Group | ID | Current Icon | Function | Proposed Lucide Icon | Reason | Visible or "..." |
|-------|----|--------------|----------|---------------------|--------|------------------|
| **Clipboard** | home.undo | Undo2 | Undo last edit | Undo2 | Matches | Visible |
| | home.redo | Redo2 | Redo last edit | Redo2 | Matches | Visible |
| | home.cut | Scissors | Cut selection | Scissors | Matches | Visible |
| | home.copy | Copy | Copy selection | Copy | Matches | Visible |
| | home.selectAll | SquareDashedMousePointer | Select all | SelectAll | Matches | Visible |
| | home.formatPainter | Brush | Format painter | Brush | Matches | More |
| **Font** | home.bold | Bold | Bold | Bold | Matches | Visible |
| | home.italic | Italic | Italic | Italic | Matches | Visible |
| | home.underline | Underline | Underline | Underline | Matches | Visible |
| | home.strike | Strikethrough | Strikethrough | Strikethrough | Matches | Visible |
| | home.highlight | Highlighter | Highlight yellow | Highlighter | Matches | Visible |
| | home.inlineCode | Code | Inline code | Code | Matches | More |
| | home.clearFormatting | Eraser | Clear formatting | Eraser | Matches | More |
| **Style** | (paragraph style) | RibbonSelect | Paragraph/Heading style | Type/Pilcrow | Keep as tall box | Visible (tall) |
| **Lists** | home.bulletList | List | Bullet list | List | Matches | Visible |
| | home.numberList | ListOrdered | Numbered list | ListOrdered | Matches | Visible |
| | home.checklist | ListChecks | Checklist | ListChecks | Matches | Visible |
| | home.quote | Quote | Quote block | Quote | Matches | Visible |
| | home.indent | IndentIncrease | Indent | IndentIncrease | Matches | Visible |
| | home.outdent | IndentDecrease | Outdent | IndentDecrease | Matches | More |
| **Align** | home.alignLeft | AlignLeft | Align left | AlignLeft | Matches | Visible |
| | home.alignCenter | AlignCenter | Align center | AlignCenter | Matches | Visible |
| | home.alignRight | AlignRight | Align right | AlignRight | Matches | Visible |
| | home.alignJustify | AlignJustify | Justify | AlignJustify | Matches | Visible |
| | home.ltr | Type | LTR direction | Type | Represents text | Visible |
| | home.rtl | FlipHorizontal2 | RTL direction | FlipHorizontal2 | Matches | More |
| | home.dirAuto | ArrowLeftRight | Auto direction | ArrowLeftRight | Matches | More |
| **Lines** | home.sortAsc | ArrowDownAZ | Sort A-Z | ArrowDownAZ | Matches | Visible |
| | home.sortDesc | ArrowUpAZ | Sort Z-A | ArrowUpAZ | Matches | Visible |
| | home.reverse | ArrowLeftRight | Reverse lines | ArrowLeftRight | Matches | Visible |
| | home.unique | ListX | Unique lines | ListX | Matches | Visible |
| | home.noBlanks | Minus | Remove blanks | Minus | Matches | Visible |
| | home.numberLines | Hash | Number lines | Hash | Matches | More |
| | home.trim | Scissors | Trim lines | Scissors | Conflict with Cut | More |
| **Typography** | home.noteFont | RibbonSelect | Note font | FontFamily (select) | Select → compact select | Visible |
| | home.noteSize | Stepper | Note size (px) | Stepper | Keep stepper | Visible (tall) |
| | home.tracking | RibbonSelect | Letter spacing | TextWidth (select) | Select → compact select | Visible |
| | home.headingFont | RibbonSelect | Heading font | FontFamily (select) | Select → compact select | Visible |
| | home.noteDirection | RibbonSelect | Note direction | ArrowLeftRight (select) | Select → compact select | Visible |
| | home.resetTypography | RotateCcw | Reset typography | RotateCcw | Matches | More |
| **Tasks** | home.todo | Circle | Mark TODO | Circle | Matches | Visible (icon-only) |
| | home.doing | Timer | Mark DOING | Timer | Matches | Visible (icon-only) |
| | home.done | CircleCheck | Mark DONE | CircleCheck | Matches | Visible (icon-only) |
| | home.nextStatus | ListRestart | Cycle status | ListRestart | Matches | Visible (icon-only) |
| | home.clearStatus | CircleDashed | Clear status | CircleDashed | Matches | Visible (icon-only) |
| **AI** | home.ai.translate | Globe | Translate | Globe | Matches | Visible |
| | home.ai.summarize | FileText | Summarize | FileText | Matches | Visible |
| | home.ai.fixGrammar | Wand2 | Fix grammar | Wand2 | Matches | Visible |
| | home.ai.continue | ArrowRightToLine | Continue writing | ArrowRightToLine | Matches | Visible |
| | home.ai.arabicEnglish | Languages | Arabic ↔ English | Languages | Matches | Visible |
| **Search** | home.findTags | Search | Find Tags | Search | Matches | Visible |
| **Note Type** | (format select) | Select | Note format | FileText | Keep as select | Visible |

---

## (b) New Groups and Measured Width Estimates

### Proposed Group Merges
1. **Merge "Clipboard" + "Font" → "Edit"** (priority 90)
   - Saves one group's label, borders, padding overhead (~80px)
   - 10 visible items fit in 5 columns × 2 rows (RibbonGroup shows 5 visible, rest in "more")
   
2. **Keep "Style"** (priority 50) — tall paragraph style picker, unchanged

3. **Keep "Lists"** (priority 70) — 5 visible + 1 more, good width

4. **Keep "Align"** (priority 60) — 5 visible + 2 more, good width

5. **Keep "Lines"** (priority 40) — 5 visible + 2 more, good width

6. **Typography** (priority 1) — **4 selects become compact (R2), arranged in 2 rows**
   - Note Font, Tracking, Heading Font, Note Direction = 4 compact selects
   - Note Size stepper (tall, spans 2 rows)
   - Reset Typography in "more"
   - Estimated width: 4 × 100px (compact) + 80px (stepper) + 80px (label/padding) = ~560px → **~360px with compact selects**

7. **Tasks** (priority 30) — **All 5 buttons become icon-only**
   - Labels (TODO/DOING/DONE) + shortcuts move to tooltip
   - Estimated width: 5 × 32px + 60px (label) + 20px = ~240px → **~180px icon-only**

8. **AI** (priority 20) — 5 visible, keep as-is

9. **Search** (priority 15) — 1 button, keep

10. **Note Type** (priority 10) — 1 select, keep

### Estimated Total Width After Changes
| Group | Current Est. | After Changes |
|-------|-------------|---------------|
| Edit (merged) | 480px | ~320px |
| Style | 230px | 230px |
| Lists | 240px | 240px |
| Align | 240px | 240px |
| Lines | 240px | 240px |
| Typography | 448px | **~360px** |
| Tasks | 330px | **~180px** |
| AI | 240px | 240px |
| Search | 112px | 112px |
| Note Type | 152px | 152px |
| **Total** | **~2712px** | **~2314px** |

**Note:** Actual measurement at 1366px will be done after implementation. The compact selects (removing `min-w-[72px]`) and icon-only Tasks buttons are the main width savers. Additional merging (e.g., Lists+Lines) can be done if still over 1100px.

---

## (c) Click Behavior and Dead/Unproven List

| Button | Click Action | Expected Result | Dead/Unproven |
|--------|--------------|-----------------|---------------|
| Undo | `execEditor("undo")` | Undo last edit | Proven |
| Redo | `execEditor("redo")` | Redo last edit | Proven |
| Cut | `cut()` | Copy + delete selection | Proven |
| Copy | `copyText(selected)` | Copy to clipboard | Proven |
| Select All | `execEditor("selectAll")` | Select all text | Proven |
| Format Painter | `handleFormatPainter()` | Copy marks, activate painter | Proven |
| Bold/Italic/Underline/Strike/Highlight | `toggleWrap`/`toggleItalic`/`applyAttr` | Apply inline formatting | Proven |
| Inline Code | `toggleWrap(s, "\`")` | Wrap in backticks | Proven |
| Clear Formatting | `clearFormatting` | Remove inline styles | Proven |
| Paragraph Style | `setHeading` | Change block to heading/paragraph | Proven |
| Bullet/Number/Checklist/Quote | `toggleLinePrefix` | Toggle list type | Proven |
| Indent/Outdent | `shiftIndent` | Change indent level | Proven |
| Align L/C/R/J | `setBlock({a:id})` | Set text alignment | Proven |
| LTR/RTL/Auto | `setBlock({dir:value})` | Set text direction | Proven |
| Sort Asc/Desc | `lineTool(s, "sort-asc/desc")` | Sort selected lines | Proven |
| Reverse/Unique/No Blanks | `lineTool` | Transform lines | Proven |
| Number Lines/Trim | `lineTool` | Number/trim lines | Proven |
| Note Font/Heading Font | Compact select → `patch({font/headingFont:value})` | Change font | **Unproven** (new compact select) |
| Tracking | Compact select → `patch({spacing:value})` | Change letter spacing | **Unproven** |
| Note Direction | Compact select → `patch({dir:value})` | Change note direction | **Unproven** |
| Note Size | Stepper → `patch({size:value})` | Change font size | Proven |
| Reset Typography | `setTypography({})` | Clear all typography | Proven |
| TODO/DOING/DONE | `toggleTask(s, id)` | Set/clear task status | Proven |
| Next Status | `toggleTask(s, CYCLE[status])` | Cycle TODO→DOING→DONE | Proven |
| Clear Status | `tasks("clear")` | Remove status words | Proven |
| AI Translate/Summarize/Fix/Continue/Arabic-English | `runAI(action)` | Call AI, show preview | Proven |
| Find Tags | `onFindTags` | Open Find Tags panel | Proven |
| Note Format | Select → `onFormat(value)` | Change note type | Proven |

**Dead or Unproven:**
1. Four compact selects in Typography group — need verification they work with RibbonGroup grid layout
2. Tasks icon-only tooltips — need verification hint shows both name and shortcut
3. Merged Edit group — need verification 10 items flow correctly in 5 columns × 2 rows with "more"

---

## Implementation Plan

### Files to Change
1. **src/components/ribbon/tabs/HomeTab.jsx** — Main changes:
   - Merge Clipboard + Font groups into "Edit"
   - Change Tasks buttons to icon-only (remove `label`, put name+shortcut in `hint`)
   - Replace 4 `RibbonSelect` in Typography with compact selects (remove `min-w-[72px]`)
   - Fix trivial hardcoded English (shortcuts in Font group → add to i18n or move to hint)
   - Keep Paragraph Style as tall box

2. **src/components/ribbon/RibbonKit.jsx** — Optional: add `compact` prop to `RibbonSelect` to remove min-width

3. **src/lib/locales/en.json** — Add shortcut keys for Font group if trivial (Ctrl+B, Ctrl+I, etc.)

### Non-Trivial Hardcoded Texts (Not Fixed in This Task)
- Font group shortcuts: "Ctrl+B", "Ctrl+I", "Ctrl+U", "Ctrl+Shift+X", "Ctrl+Shift+H", "Ctrl+E" — require i18n keys with placeholders
- These are listed for future translation work

---

## Test by Hand (Beginner Steps)

1. **Open app**: Run `npm run dev` in PowerShell inside project folder, open http://localhost:5173
2. **Create a Markdown note**: Click "New note" → type some text
3. **Switch to Home tab**: Click "Home" in ribbon tab line
4. **Verify width**: Resize browser window to 1366px wide (use DevTools device toolbar or resize window). Home panel should not horizontally scroll; all groups visible.
5. **Test Tasks buttons**: Hover over TODO/DOING/DONE icons — tooltip should show "Mark the line TODO · Ctrl+Alt+1" (name + shortcut). Click each — status should toggle on current line.
6. **Test Typography selects**: Click Note Font, Tracking, Heading Font, Note Direction — compact dropdowns should open, selection should apply to note.
7. **Test Paragraph Style**: Dropdown should be tall box spanning 2 rows, show Paragraph/Heading 1-6.
8. **Test merged Edit group**: Verify Undo/Redo/Cut/Copy/Select All in row 1, Bold/Italic/Underline/Strike/Highlight in row 2. Click "..." — Format Painter, Inline Code, Clear Formatting should appear.
9. **Test old note opens**: Open an existing note from vault — should load without errors, all ribbon buttons work.
10. **Run checks**: In PowerShell in project folder:
    - `npx eslint src --quiet` (no errors)
    - `npm run build` (succeeds)
    - `node scripts/i18n-check.mjs` (no failures)
    - `npm ci --dry-run` (passes)

---

## Risk Assessment
- **Low**: Icon-only Tasks buttons, compact selects — standard patterns
- **Medium**: Merged Edit group with 10 items — verify grid flow and "more" popover
- **Low**: i18n — only trivial fixes, existing keys used
- **None deleted**: All functionality preserved