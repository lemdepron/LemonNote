# C12 Implementation Plan: "Open as canvas" and removing the Ink tab from text notes

## Overview
- **Remove Ink tab** from Markdown notes (it stays for non-Markdown formats where C3 already greys it out)
- **Add "Open as canvas" button** in File tab and Command Palette for Markdown notes
- Creates a canvas with one A4 frame + text frame containing the note's Markdown
- Links back to original note (which stays unchanged)
- Before any ink page deletion: list other notes with ink_page_id set

---

## Files to Modify

### 1. `src/components/ribbon/NoteRibbon.jsx`
- Remove "ink" from `MAIN_TABS` array (line 36)
- The Ink tab (`activeTab === "ink"` block on line 404) will no longer render

### 2. `src/components/ribbon/FilePanel.jsx`
- Add "Open as canvas" button in the "Print / Export" section (or a new section)
- Only show for Markdown notes (`note.format === "markdown"`)
- Creates a new CanvasDoc with A4 frame and text frame

### 3. `src/components/shell/CommandPalette.jsx`
- Add "Open as canvas" action in ACTIONS array
- Only visible when a Markdown note is active (or always, but only works for markdown)

### 4. `src/lib/notes.js` (or new utility)
- Add function `openNoteAsCanvas(note)` that creates the CanvasDoc

### 5. `src/api/localDb.js` 
- The CanvasDoc entity already exists (line 30-38)
- Need to create a CanvasDoc with kind: "canvas", one FRAME object (A4), one TEXT_FRAME object

### 6. Identify unused code in NotePage.jsx and NotePane.jsx
- `inkId`, `ink_page_id`, `inkOverlayMode`, `startingInk`, `noteInk` object
- `useInkPage` hook, `NoteInkOverlay`, `NoteInkSurface`, `startInk`, `removeInk`, `attachInk`, `listAttachable`
- `toggleInkOverlayMode`, `handleReadScroll`, `readContentRect` (used for overlay)

---

## Canvas Structure for "Open as Canvas"

```javascript
{
  kind: "canvas",
  name: note.title || "Untitled canvas",
  version: 2,
  paper: { template: "grid", size: "infinite", tone: "dark" },
  strokes: [],
  objects: [
    // A4 Frame (FRAME type)
    {
      type: "frame",
      frameType: "a4",  // 794x1123 pixels at 96 DPI
      x: 100, y: 100,   // positioned on canvas
      width: 794,
      height: 1123,
      paper: { template: "grid", tone: "dark" },
      // ... default frame props
    },
    // Text Frame inside A4 frame (TEXT_FRAME type)
    {
      type: "text-frame",
      markdown: note.body,
      x: 100 + 72, y: 100 + 72,  // inside A4 with 1 inch margin
      width: 794 - 144,  // A4 width minus 1 inch margins (72px each side)
      height: 1123 - 144,
      // ... default text frame props
    }
  ],
  camera: { x: 0, y: 0, scale: 1 },
  created_date: now,
  updated_date: now,
}
```

---

## i18n Keys to Add (en.json first)

### FileMenu section
- `fileMenu.printExport.openAsCanvas`: "Open as canvas"
- `fileMenu.printExport.openAsCanvasHint`: "Create a canvas with this note's content in an A4 frame"
- `fileMenu.printExport.canvasCreated`: "Canvas created: {name}"

### Command Palette
- Action label: "Open as canvas"
- Action keywords: "canvas whiteboard markdown"

---

## Testing Steps

1. Run `npm run dev`
2. Open a Markdown note
3. Verify Ink tab is gone from ribbon
4. Open File panel → Print/Export → "Open as canvas" button exists
5. Click it → navigates to new canvas at `/canvas/{id}`
6. Canvas shows A4 frame with note's Markdown in text frame
7. Original note unchanged
8. Command Palette (Ctrl+K) shows "Open as canvas" action
9. Run checks: `npx eslint src --quiet`, `npm run build`, `node scripts/i18n-check.mjs`, `npm ci --dry-run`