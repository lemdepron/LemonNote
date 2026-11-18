# Text Frames (Locked Under Ink) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Markdown text frames to canvas that render with the same Markdown engine as notes, and lock when ink strokes overlap them.

**Architecture:** 
- TEXT_FRAME object type already exists in `src/lib/canvas/ink/objects.js` with `markdown` property
- Need to add rendering in both FloatingObjects (React overlay for editing) and InkEngine.paintBase() (canvas base layer)
- Need to add lock detection: when any stroke point overlaps text frame bounds, set `locked: true`
- Lock state shows lock icon + tooltip; unlock button with warning dialog

**Tech Stack:** React 18, Vite, Canvas 2D API, react-markdown (same as notes), Tailwind CSS

**Spec:** C11: Text frames, locked under ink

## Global Constraints

- All data goes through `src/api/localDb.js` (canvas uses localDb for persistence)
- Strings go through `t("key")` from `src/lib/i18n.js`; add to `en.json` first
- No native dialogs: use `alert-dialog.jsx` or toast
- Colours from theme tokens (`bg-background`, `text-foreground`, etc.)
- Logical CSS (`ms-`, `me-`, `start-`, `end-`) for RTL support
- `npm run build`, `npx eslint src --quiet`, `node scripts/i18n-check.mjs`, `npm ci --dry-run` must pass

## Review Focus

1. **Stroke overlap detection** - strokes in canvas coordinates, frame in canvas coordinates; must detect any stroke point inside frame bounds
2. **Lock state persistence** - `locked` flag on object must survive save/load
3. **Markdown rendering parity** - text frames must render math, code, images like notes
4. **Unlock warning** - must show confirmation dialog before unlocking
5. **RTL layout** - lock icon and unlock button must work in RTL

---

### Task 1: Add `renderTextFrame` function to canvas objects

**Files:**
- Modify: `src/lib/canvas/ink/objects.js` (add renderTextFrame function)
- Test: (manual - verify markdown renders in canvas context)

**Interfaces:**
- Consumes: object with `markdown`, `fontSize`, `fontFamily`, `color`, `align`, `background`, `padding`, `x`, `y`, `width`, `height`, `rotation`, `opacity`
- Produces: draws markdown-rendered content to canvas context

- [ ] **Step 1: Write a test helper to verify markdown renders**

Create a simple Node script to test renderTextFrame output (or verify manually in browser)

- [ ] **Step 2: Implement `renderTextFrame(ctx, object, scale, isEditing)` in `src/lib/canvas/ink/objects.js`**

Use the same markdown pipeline as notes (remarkGfm, remarkMath, rehypeRaw, rehypeKatex, rehypeHighlight, rehypeSanitize). Since this runs in canvas 2D context (not React), we need to render markdown to an offscreen canvas or use a different approach. 

Approach: Create an offscreen canvas, render markdown to it via a temporary React portal or by using the existing MarkdownView component logic adapted for canvas. However, this is complex. Simpler approach: render text as plain text with basic formatting for now, or use a lightweight markdown-to-canvas renderer.

Actually, the simplest approach: Since we can't easily run React in canvas 2D context, we'll render the markdown as HTML to an offscreen canvas using a hidden div, then draw that to the main canvas. Or we can create a simple markdown-to-text renderer for canvas.

Let me think... The notes use ReactMarkdown which outputs React elements. For canvas, we need to render to a 2D context. Options:
1. Use a hidden div, render ReactMarkdown there, capture as image via html2canvas or similar
2. Use a pure-JS markdown parser and render text manually to canvas
3. Use an offscreen canvas with a simple text renderer

For MVP, I'll implement a simple markdown-to-canvas renderer that handles basic markdown (headings, bold, italic, code, lists, blockquotes) and falls back to plain text for complex elements. This can be enhanced later.

- [ ] **Step 3: Test in browser** - add a text frame in design mode, verify markdown renders

---

### Task 2: Add TEXT_FRAME rendering in FloatingObjects (React overlay)

**Files:**
- Modify: `src/components/ink/FloatingObjects.jsx` (add TEXT_FRAME case in draw, add editing support)

**Interfaces:**
- Consumes: object with markdown property
- Produces: renders markdown in canvas, shows textarea for editing when double-clicked

- [ ] **Step 1: Add TEXT_FRAME to the draw switch statement**
- [ ] **Step 2: Add TEXT_FRAME to double-click handler for editing**
- [ ] **Step 3: Add TEXT_FRAME to overlay positioning (reuse textbox logic)**
- [ ] **Step 4: Add TEXT_FRAME to onOverlayChange handler**
- [ ] **Step 5: Test in browser** - double-click text frame to edit markdown

---

### Task 3: Add TEXT_FRAME rendering in InkEngine.paintBase()

**Files:**
- Modify: `src/lib/canvas/ink/engine.js` (add TEXT_FRAME case in paintBase)

**Interfaces:**
- Consumes: object from this.objects array
- Produces: draws text frame to base canvas layer

- [ ] **Step 1: Import renderTextFrame in engine.js**
- [ ] **Step 2: Add TEXT_FRAME case in paintBase object rendering loop**
- [ ] **Step 3: Test in browser** - verify text frame appears in base layer (not just overlay)

---

### Task 4: Add lock detection and locked state

**Files:**
- Modify: `src/lib/canvas/ink/engine.js` (add checkFrameLocks method)
- Modify: `src/lib/canvas/ink/objects.js` (ensure TEXT_FRAME has locked property in defaults)

**Interfaces:**
- Consumes: strokes array, objects array
- Produces: updates objects with `locked: true` when stroke overlaps frame

- [ ] **Step 1: Add `locked: false` to TEXT_FRAME defaults (already exists via DEFAULT_OBJECT_PROPS)**
- [ ] **Step 2: Implement `checkFrameLocks()` in InkEngine** - iterate strokes, check if any point inside text frame bounds
- [ ] **Step 3: Call checkFrameLocks after stroke commit (onCommit callback)**
- [ ] **Step 4: Call checkFrameLocks after stroke replace (onReplace callback)**
- [ ] **Step 5: Test in browser** - draw stroke over text frame, verify it locks

---

### Task 5: Add lock icon and unlock button UI

**Files:**
- Modify: `src/components/ink/FloatingObjects.jsx` (draw lock icon when locked, show unlock button)
- Modify: `src/lib/i18n.js` / `src/lib/locales/en.json` (add translation keys)

**Interfaces:**
- Consumes: object.locked boolean
- Produces: lock icon with tooltip, unlock button with confirmation dialog

- [ ] **Step 1: Add translation keys to en.json**: `canvas.textFrame.locked`, `canvas.textFrame.unlock`, `canvas.textFrame.unlockWarning`
- [ ] **Step 2: Run `node scripts/i18n-check.mjs` to propagate to other locales**
- [ ] **Step 3: Add lock icon drawing in FloatingObjects drawHandles or separate drawLockIcon**
- [ ] **Step 4: Add unlock button (small button near lock icon)**
- [ ] **Step 5: Add unlock confirmation using alert-dialog.jsx**
- [ ] **Step 6: Test in browser** - lock icon appears, unlock shows warning, unlock works

---

### Task 6: Handle locked state in editing

**Files:**
- Modify: `src/components/ink/FloatingObjects.jsx` (prevent editing when locked)

**Interfaces:**
- Consumes: object.locked
- Produces: double-click does not open editor when locked

- [ ] **Step 1: Check object.locked in onDoubleClick handler for TEXT_FRAME**
- [ ] **Step 2: Test in browser** - locked text frame cannot be edited

---

### Task 7: Verify all checks pass

**Files:**
- Run: `npx eslint src --quiet`
- Run: `npm run build`
- Run: `node scripts/i18n-check.mjs`
- Run: `npm ci --dry-run`

- [ ] **Step 1: Run all verification commands**
- [ ] **Step 2: Fix any issues**
- [ ] **Step 3: Manual test in browser** - complete flow: create text frame, edit markdown, draw over it (locks), unlock (with warning), edit again