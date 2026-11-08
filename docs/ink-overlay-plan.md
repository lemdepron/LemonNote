# Ink Overlay Plan — Handwriting Directly Over Note Text

## Executive Verdict: **Feasible with Constraints**

The existing ink engine (`src/lib/ink/engine.js`) already supports transparent backgrounds, camera control, and pointer handling. The main work is wiring it as an **overlay layer** on top of the note content in `NotePage.jsx`, with stroke coordinates anchored to the **note's content area** (not the whole window). This is feasible in ~6 small steps, but the alignment risk when text is edited must be mitigated by a fixed-width "page" mode and an "Insert space" tool.

---

## 1. Can the Existing Engine Render on a Transparent Layer Over the Note?

**Yes, almost entirely as-is.** The engine draws on two stacked `<canvas>` elements inside `InkBoard.jsx` (base + overlay). To make it an overlay:

| What must change | Details |
|------------------|---------|
| **Background** | Remove the paper fill and border from `InkBoard`'s wrapper `<div>` (lines 160–166). The wrapper becomes a transparent container; the canvases themselves already have transparent backgrounds. |
| **Paper drawing** | In `engine.paintBase()` (line 595–608), `drawPaper()` is called unconditionally. Add a `paper: false` option or a `transparent: true` flag to skip paper rendering. The engine already receives `this.paper` — just don't draw it when in overlay mode. |
| **Camera** | The camera must be **locked to the note's scroll position and zoom**, not user-controllable. Instead of `wheel`/`pan`/`zoom` handlers in `InkBoard` (lines 105–126), the parent (`NotePage`) will call `engine.setCamera({ x, y, scale })` on every scroll/resize. |
| **Pointer events** | `InkBoard`'s overlay canvas has `touch-none` (line 171) and its own pointer handlers. In overlay mode, the overlay canvas must **only receive pointer events when the pen tool is active**. Otherwise, events must pass through to the textarea/Markdown view underneath. This is done by toggling `pointer-events: none` on the overlay canvas (or the wrapper) based on `tool.mode`. |
| **Resize** | The engine resizes to its wrapper's `getBoundingClientRect()` (line 63–64). In overlay mode, the wrapper must match the **note content area's scrollable size** (full content height × fixed content width). |

**No changes** needed to: stroke data model, smoothing, brushes, selection, lasso, eraser, export, audio playback.

---

## 2. Keeping Strokes Aligned While Scrolling

**Store strokes in "page coordinates" — fixed content width, pixels from top of content.**

- **X coordinate**: store as **fraction of a fixed content width** (e.g., `x / CONTENT_WIDTH`). `CONTENT_WIDTH` = the note's rendered width in pixels (e.g., 800 px for desktop, narrower on mobile). This makes strokes scale with the content width if the window resizes.
- **Y coordinate**: store as **absolute pixels from the top of the note content** (not from the viewport). This is the natural coordinate system of the engine when the camera is at `{ x: 0, y: 0, scale: 1 }`.

When the note scrolls:
- The parent computes `camera = { x: 0, y: -scrollTop, scale: 1 }` (or `scale = currentZoom` if the user zooms the whole note).
- `engine.setCamera(camera)` moves the ink layer exactly with the text.

When the window resizes:
- Recompute `CONTENT_WIDTH` (the textarea/read-view width).
- Rescale all strokes' X: `newX = oldFraction * newContentWidth`.
- Y stays the same (pixels from top).
- Update `engine.resize(newWidth, fullContentHeight, dpr)` and `engine.setCamera({ x: 0, y: -scrollTop, scale })`.

**Why not CSS transform?** The engine already applies camera via `ctx.setTransform` (line 579). Driving its camera from scroll is simpler and keeps stroke hit-testing in world coordinates.

---

## 3. What Happens When Text Above Strokes Is Edited / Wrapped / Resized

**Misalignment is inevitable without constraints.** If the user types above a stroke, the text pushes down; the stroke stays at its absolute Y → it no longer aligns with the words it was drawn beside.

### Mitigation Strategy (Required for v1)

1. **Fixed-width "page" mode for notes that have ink**  
   - When a note has any ink (`note.ink_page_id` exists), the note editor/reader renders at a **fixed content width** (e.g., 800 px desktop, 100% mobile) with **no horizontal wrapping changes**.  
   - Line height and font size become part of the "page" definition (saved in `note.style` or a new `note.page` field).  
   - This makes Y positions stable: one line of text always occupies the same pixel height.

2. **"Insert space" tool (ribbon button)**  
   - When the user needs more room between paragraphs, they click "Insert space" → a fixed-height blank block is inserted at the cursor (e.g., 40 px).  
   - All strokes below that point are shifted down by that height (batch update in `useInkPage.applyStrokes`).  
   - This is the **only** way vertical space changes; free typing above strokes is blocked or warned.

3. **Warning banner**  
   - If the user switches to a different font size / line height / width while ink exists, show a banner: *"Changing layout will misalign handwriting. Use 'Insert space' instead."*  
   - Do not auto-migrate; let the user decide.

4. **No automatic reflow**  
   - Do NOT try to "attach strokes to text lines" or reflow ink. The engine has no concept of text lines. Keep it simple: fixed page + manual space insertion.

---

## 4. Pointer Event Switching: Pen Active = Overlay Receives Events

| Tool state | Overlay canvas `pointer-events` | Textarea / Markdown view |
|------------|--------------------------------|--------------------------|
| **Pen / Eraser / Lasso / Shape / Eyedropper** (ink tools) | `auto` (receives pointer) | `none` (blocked) |
| **Pan** (two-finger / alt+drag) | `auto` (engine handles pan) | `none` |
| **Any other ribbon tab** (Home, Insert, Format, Table, Code, View, Tasks, Journal) | `none` (events pass through) | `auto` (normal editing/clicking) |

**Implementation:**
- In `InkBoard`, the overlay canvas already has `className={cn("absolute inset-0 h-full w-full touch-none", CURSORS[tool?.mode] || CURSORS.draw)}` (line 171).
- Add a style: `pointerEvents: inkToolModes.includes(tool?.mode) ? 'auto' : 'none'`.
- `inkToolModes = ['draw', 'erase', 'lasso', 'shape', 'eyedropper', 'pan']`.
- When `pointer-events: none`, the browser passes clicks/taps to the textarea or Markdown view underneath.

**Touch vs Mouse vs Pen:**
- **Pen** (stylus): pressure/tilt works natively via `PointerEvent`. Engine already reads `event.pressure`, `event.tiltX/Y` (line 130–137).
- **Touch**: single-finger = draw (if pen tool active), two-finger = pan (browser default pinch-zoom on the page still works because the overlay has `touch-none` only when ink tool is active; when inactive, `pointer-events: none` lets touch through).
- **Mouse**: left-click = draw/erase/lasso, middle/right/Alt = pan. Engine handles this (line 226).

**Scroll conflict:** When ink tool is active, the overlay covers the note. The note cannot be scrolled by touch/mouse wheel. Solution: **pan tool** (two-finger or Alt+drag) moves the camera, which the parent syncs to `window.scrollTo(0, -camera.y)`. Or simpler: when ink tool is active, disable note scrolling entirely; user pans the ink layer, which moves the note via `onCamera` callback.

---

## 5. Performance with Long Notes (Layer Height = Content Height)

**Risk:** A 50-page note → content height ~50,000 px. Two canvases at 50,000 × 800 × 2 DPR = **160 MB GPU memory per canvas** (base + overlay = 320 MB). Too high.

**Solutions (pick one for v1):**

| Approach | Pros | Cons |
|----------|------|------|
| **A. Tiled rendering** (engine renders only visible region + margin) | Constant memory, any length | Major engine rewrite; `paintBase`/`paintOverlay` must cull strokes outside view |
| **B. Max height cap** (e.g., 15,000 px ≈ 15 pages) | Simple, no engine changes | Long notes truncated; user must split |
| **C. SVG overlay for text, canvas only for ink** | Text stays crisp, canvas smaller | Complex integration; two coordinate systems |
| **D. Virtualized ink layer** (split note into "ink pages" matching paper pages) | Reuses existing multi-page engine (`paper.size = 'a4'`) | Strokes can't cross page boundaries |

**Recommendation for v1: Option D — Virtualized ink pages.**  
The engine already supports multi-page paper (`paper.size = 'a4'`, `pageStep`, `focusPage`). Each A4 page = 794 × 1123 px at 96 DPI.  
- Note content is divided into fixed-height "ink pages" (same height as paper pages).  
- Only the visible ink page(s) are rendered (engine already does this via `viewRect()` culling in `paintBase`/`paintOverlay`).  
- Strokes are stored with `pageIndex` (already in stroke data via `session` timestamp or we add `page` field).  
- When scrolling, parent calls `engine.focusPage(index)` for the visible page.  
- This reuses the engine's existing pagination and keeps memory constant (~2 pages visible = ~4 MB).

**If the note is in "flow" layout (current default):** treat it as one infinite page (`paper.size = 'infinite'`). Cap at 15,000 px height (Option B) for v1. User can split long notes.

---

## 6. Step-by-Step Implementation Plan (≤ 6 Testable Steps)

### Step 1: Add Overlay Mode to InkEngine
- **File:** `src/lib/ink/engine.js`
- **Change:** Add `transparent` option to constructor. In `paintBase`, skip `drawPaper` when `this.transparent === true`. Expose `setTransparent(bool)`.
- **Test:** Create an `InkEngine` with `transparent: true`, call `paint()`, verify no paper grid/dots drawn (canvas stays transparent).

### Step 2: Make InkBoard Transparent & Pointer-Event-Aware
- **File:** `src/components/ink/InkBoard.jsx`
- **Changes:**
  - Remove wrapper background/border/shadow (lines 160–166) when `transparent` prop is true.
  - Add `pointerEvents` style on overlay canvas: `inkToolModes.includes(tool?.mode) ? 'auto' : 'none'`.
  - Remove wheel/keyboard handlers (lines 105–126) when `transparent` — parent drives camera.
  - Accept `transparent` prop, pass to engine via `setTransparent` (new method).
- **Test:** Render `InkBoard` with `transparent={true}`, `tool={mode: 'draw'}` → can draw. Switch `tool={mode: 'select'}` (non-ink) → clicks pass through to element underneath.

### Step 3: Wire Overlay Into NotePage (Write Mode First)
- **File:** `src/pages/NotePage.jsx`
- **Changes:**
  - In the write/split/read area (around line 589–659), add a **fixed-position overlay container** that spans the note content area (same width as textarea/MarkdownView, height = `scrollHeight`).
  - Inside it, render `<InkBoard {...noteInk.board} transparent autoFit={false} height={contentHeight} />` when `inkId` exists.
  - On scroll/resize: compute `camera = { x: 0, y: -scrollTop, scale: 1 }` (or current zoom), call `engine.setCamera(camera)` via `noteInk.ink.engine()`.
  - On resize: recompute content width, rescale stroke X fractions, call `engine.resize(width, contentHeight, dpr)`.
- **Test:** Open a note with ink in Write mode. Scroll → ink moves with text. Resize window → ink re-scales horizontally. Switch to Read mode → ink stays aligned.

### Step 4: Fixed-Width "Page" Mode for Inked Notes
- **Files:** `src/pages/NotePage.jsx`, `src/components/vault/MarkdownEditor.jsx`, `src/components/vault/MarkdownView.jsx`, `src/lib/text-style.js`
- **Changes:**
  - When `note.ink_page_id` exists, force the editor/reader to a fixed content width (e.g., 800 px desktop, 100% mobile) and fixed line height (from `note.style` or default).
  - Save the "page width" and "line height" in `note.style` (or new `note.page`) so it persists.
  - Add a ribbon button "Insert space" (Ink tab) that inserts a blank block of fixed height at cursor and shifts strokes down via `applyStrokes`.
- **Test:** Create ink, type above it → text does not rewrap (fixed width). Click "Insert space" → gap appears, ink below shifts down. Change font size → warning banner appears, ink stays put.

### Step 5: Read Mode Overlay (Same as Write)
- **File:** `src/pages/NotePage.jsx`
- **Change:** In Read mode (`mode === 'read'`), render the same overlay container over `MarkdownView`. The MarkdownView is read-only, so pointer-events logic is simpler (ink tool active = overlay receives, else MarkdownView receives).
- **Test:** Open note with ink in Read mode. Scroll → ink aligned. Pen tool → draw on top of rendered text. Switch back to Write → strokes persist.

### Step 6: Performance Guard — Virtualized Ink Pages
- **Files:** `src/lib/ink/engine.js`, `src/hooks/useInkPage.js`, `src/components/ink/InkBoard.jsx`
- **Changes:**
  - For notes with ink, set `paper.size = 'a4'` (or 'letter') in `useInkPage` when loading/creating the page.
  - In `NotePage`, compute which A4 page(s) are visible from `scrollTop`, call `engine.focusPage(index)`.
  - Engine already culls strokes outside `viewRect()` — verify it works.
  - Cap infinite-paper notes at 15,000 px height with a warning.
- **Test:** Create a 30-page note with ink on every page. Scroll rapidly → memory stays ~10 MB, no lag. DevTools Performance tab shows constant frame time.

---

## 7. Feasibility Verdict with Reasons

| Aspect | Verdict | Reason |
|--------|---------|--------|
| **Transparent overlay rendering** | ✅ Feasible | Engine already draws on transparent canvases; only paper drawing must be optionally disabled. |
| **Scroll-aligned strokes** | ✅ Feasible | Camera-driven sync is trivial; fraction-based X + absolute Y is stable. |
| **Text-edit misalignment** | ⚠️ Risky without constraints | **Must** enforce fixed-width page + "Insert space" tool. Free typing above strokes will break alignment. |
| **Pointer event switching** | ✅ Feasible | CSS `pointer-events` toggle on overlay canvas is standard and reliable. |
| **Long-note performance** | ⚠️ Risky for infinite paper | Virtualized A4 pages (Option D) reuses engine pagination and bounds memory. Required for v1. |
| **Read + Write both** | ✅ Feasible | Same overlay component works over textarea or MarkdownView. |
| **Overall** | **Feasible with constraints** | The engine is 90% ready. The 10% is: transparent mode, camera lock, pointer-events toggle, and the fixed-page policy for inked notes. |

---

## What Could Go Wrong (Risks)

1. **Stroke X rescaling on resize** — fractions work but sub-pixel rounding may cause slight drift. Test at 125%, 150% OS scaling.
2. **Touch scrolling conflict** — when ink tool is active, the overlay covers the note. User expects two-finger scroll to move the note. Must implement: two-finger = pan camera → parent syncs `window.scrollTo`. Test on Windows touchscreen.
3. **MarkdownView line height** — `MarkdownView` uses browser layout; line height may not be exactly constant across fonts. Fixed-width page must also fix `line-height` in CSS (e.g., `line-height: 1.6` exactly).
4. **Ink over images/tables/code blocks** — the overlay is a single layer over the whole content area. Strokes drawn over an image will stay at that Y even if the image loads later and pushes text down. Mitigation: warn if note has images and ink; or treat images as fixed-height blocks.
5. **Mobile** — no hover, touch events differ. The `pointer-events` toggle works but test pen (rare on mobile) vs finger drawing.

---

## Files to Create / Change (Summary)

| File | Change Type |
|------|-------------|
| `src/lib/ink/engine.js` | Add `transparent` option, skip paper draw |
| `src/components/ink/InkBoard.jsx` | Transparent wrapper, pointer-events toggle, remove wheel/key handlers when transparent |
| `src/pages/NotePage.jsx` | Overlay container, camera sync on scroll/resize, fixed-width page logic, "Insert space" button |
| `src/components/vault/MarkdownEditor.jsx` | Fixed width/line-height when ink exists |
| `src/components/vault/MarkdownView.jsx` | Fixed width/line-height when ink exists |
| `src/lib/text-style.js` | Add page width/line-height to style schema |
| `src/hooks/useInkPage.js` | Default to A4 paper for inked notes, expose page shifting for "Insert space" |

---

## Test-by-Hand Checklist (for the Owner)

1. **Create a note, start inking** (Ink tab → "Start inking"). Draw a few strokes in Write mode.
2. **Scroll** — strokes move with text.
3. **Resize window** — strokes scale horizontally, stay aligned vertically.
4. **Switch to Read mode** — strokes visible over rendered Markdown, aligned.
5. **Type above a stroke** — text does NOT rewrap (fixed width). Stroke stays aligned.
6. **Click "Insert space" (Ink tab ribbon)** — blank gap inserted, strokes below shift down.
7. **Change font size** — warning banner appears, strokes do not move.
8. **Long note (20+ pages)** — scroll rapidly, no lag, memory stable (open DevTools → Performance).
9. **Touchscreen (if available)** — two-finger pans note when ink tool active; finger draws when pen tool active.
10. **Close and reopen note** — strokes persist, aligned.

---

## What Is NOT in This Plan (Future Work)

- Stroke-to-text attachment (inking "on" a specific word that moves with it).
- Square/tight text wrap around ink objects.
- Multi-window sync (BroadcastChannel).
- Handwriting recognition / search on overlay strokes (already works via `recognize` in `useInkPage`).
- Export note+ink as single PDF (print via CSS `@page` with ink layer composited).

---

*Plan created for LemonNote. No implementation code written. Ready for owner review.*