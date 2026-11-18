# Canvas Merge Plan (C8)

## Overview
Two separate canvas systems exist:
- **(a) Cards Canvas**: `src/pages/CanvasPage.jsx`, `src/pages/CanvasHome.jsx`, `src/components/canvas/*`, data via `src/lib/canvas.js`. Fixed 9000×6500 plane. Nodes + edges.
- **(b) Ink Engine**: `src/lib/ink/engine.js`, `InkBoard.jsx`, `src/lib/ink/objects.js`, `src/lib/ink/paper.js`, `src/lib/ink/store.js`. Infinite / A4 / Letter paper sizes, floating objects (rect, rounded-rect, ellipse, line, arrow, triangle, star, stickers, text boxes, sticky notes), camera, selection, shape snapping. Stored as **ink pages** linked from a note by `ink_page_id`.

**Decision**: The ink engine is the base of the new unified canvas. The cards canvas becomes object types inside it.

---

## 1. New Document Shape (one JSON)

```json
{
  "version": 2,
  "paper": {
    "template": "grid",          // blank | ruled | grid | dots | stave | iso
    "size": "infinite",          // infinite | a4 | letter | a3 | a5 | 3:4 | 16:9 | free
    "tone": "dark"               // dark | light
  },
  "strokes": [                   // raw ink strokes (unchanged from ink engine)
    { "id": "...", "kind": "stroke", "tool": "pen", "brush": "...", "color": "...", "alpha": 1, "width": 3, "points": [[x,y],...], "pressures": [...] }
  ],
  "objects": [                   // all floating objects (old + new types)
    { "id": "...", "type": "card", "x": 100, "y": 100, "width": 240, "height": 154, "rotation": 0, "zOrder": 1, "title": "Capture", "body": "..." },
    { "id": "...", "type": "connector", "from": "obj-1", "to": "obj-2", "style": "straight", "points": [] },
    { "id": "...", "type": "frame", "frameType": "a4", "x": 0, "y": 0, "width": 794, "height": 1123, "rotation": 0, "zOrder": 0, "paper": { "template": "grid", "tone": "dark" } },
    { "id": "...", "type": "text-frame", "x": 200, "y": 200, "width": 400, "height": 300, "rotation": 0, "zOrder": 1, "markdown": "# Title\n\nContent", "fontSize": 16, "fontFamily": "inherit", "color": "#e9e2d0", "align": "left", "background": "transparent", "padding": 8 },
    { "id": "...", "type": "image", "x": 100, "y": 100, "width": 300, "height": 200, "rotation": 0, "zOrder": 1, "src": "local:abc123", "alt": "" },
    { "id": "...", "type": "pdf-page", "x": 100, "y": 100, "width": 794, "height": 1123, "rotation": 0, "zOrder": 1, "fileId": "local:abc123", "pageNumber": 1 },
    { "id": "...", "type": "shape", "shapeType": "rect", ... },     // existing
    { "id": "...", "type": "sticker", "stickerId": "star-1", ... },  // existing
    { "id": "...", "type": "textbox", ... },                        // existing
    { "id": "...", "type": "sticky", ... }                          // existing
  ],
  "camera": { "x": 0, "y": 0, "scale": 1 },
  "selection": { "ids": [], "transform": { "dx": 0, "dy": 0, "scale": 1, "rotate": 0 } },
  "groups": [                      // optional grouping of objects
    { "id": "group-1", "objectIds": ["obj-1", "obj-2"] }
  ]
}
```

### Object type registry (extend `src/lib/ink/objects.js`)

| type | purpose | key fields |
|------|---------|------------|
| `card` | old canvas node | `title`, `body` (markdown), `width`/`height` (default 240×154) |
| `connector` | old canvas edge | `from` (object id), `to` (object id), `style` (straight/elbow/curved), `points` (optional manual control points) |
| `frame` | paper-like container; can nest objects | `frameType` ("a4", "letter", "3:4", "16:9", "free"), `paper` (template/tone override), children live inside via `frameId` on child objects |
| `text-frame` | markdown-rich text box | `markdown`, `fontSize`, `fontFamily`, `color`, `align`, `background`, `padding` |
| `image` | embedded image | `src` (local:...), `alt` |
| `pdf-page` | rendered PDF page | `fileId` (local:...), `pageNumber` |

### Migration notes
- **Frames**: on infinite paper, frames are just large rects with their own paper settings. On sized paper, frames align to page grid.
- **Card size**: keep `CARD_WIDTH` (240) and `CARD_HEIGHT` (154) from `src/lib/canvas.js` as defaults.
- **Connector routing**: start with straight lines; elbow/curved later.

---

## 2. Migration Strategy

### 2.1 Old Cards Canvases → New Canvas
- **Source**: `Canvas` table in IndexedDB (via `localDb.js`).
- **Mapping**:
  - Each `Canvas` record → one new canvas document (stored as `InkPage` with a new `kind: "canvas"` flag, or a new table — see §3).
  - `nodes[]` → `objects[]` with `type: "card"`, preserving `x`, `y`, `title`, `body`.
  - `edges[]` → `objects[]` with `type: "connector"`, `from`, `to`.
  - Canvas `name` → document name.
  - Fixed 9000×6500 bounds → paper `size: "free"` with width 9000, height 6500 (or `infinite` with a large frame).
- **Migration script**: one-off Node script using `fake-indexeddb` to read `Canvas` records, write new `InkPage` records (or new table). Run on first app load after upgrade (version bump in `localDb.js`).

### 2.2 Old Ink Pages → New Canvas
- **Source**: `InkPage` + `InkChunk` tables.
- **Mapping**: Already compatible — `strokes[]`, `objects[]`, `paper`, `camera` map 1:1.
- **Change**: Add `version: 2` and `kind: "ink"` (or `kind: "canvas"` for unified) to the page record. No data transformation needed.
- **Backward compatibility**: Engine reads `version: 1` (current) and treats it as `kind: "ink"`.

### 2.3 Unified Entry Point
- Both old "Canvas" rail item and old "Ink" ribbon tab open the **same engine** (`InkBoard.jsx` / `InkEngine`).
- The document's `kind` field (or presence of `strokes` vs `cards`) determines which tool palette shows first (ink tools vs card/connector tools), but the full toolset is always available.

---

## 3. Files: Deleted, Renamed, Kept

### Delete
| File | Reason |
|------|--------|
| `src/pages/CanvasPage.jsx` | Replaced by unified canvas page |
| `src/pages/CanvasHome.jsx` | Replaced by unified home (or merged into VaultHome) |
| `src/components/canvas/CanvasStage.jsx` | Replaced by `InkBoard` + object renderer |
| `src/components/canvas/CanvasInspector.jsx` | Replaced by unified inspector |
| `src/components/canvas/CanvasCard.jsx` | Replaced by card object renderer |
| `src/lib/canvas.js` | Logic moves to `src/lib/ink/objects.js` + new `canvas-utils.js` |

### Rename / Move
| Old | New | Notes |
|-----|-----|-------|
| `src/lib/ink/engine.js` | `src/lib/canvas/engine.js` | Core engine, now generic "canvas" not "ink" |
| `src/lib/ink/store.js` | `src/lib/canvas/store.js` | Storage for unified canvas documents |
| `src/lib/ink/objects.js` | `src/lib/canvas/objects.js` | Object type registry + renderers |
| `src/lib/ink/paper.js` | `src/lib/canvas/paper.js` | Paper system (unchanged) |
| `src/lib/ink/shapes.js` | `src/lib/canvas/shapes.js` | Shape recognition (unchanged) |
| `src/lib/ink/smoothing.js` | `src/lib/canvas/smoothing.js` | Stroke smoothing (unchanged) |
| `src/lib/ink/brushes.js` | `src/lib/canvas/brushes.js` | Brush rendering (unchanged) |
| `src/lib/ink/raster.js` | `src/lib/canvas/raster.js` | Region rendering (unchanged) |
| `src/lib/ink/utils.js` | `src/lib/canvas/utils.js` | `nextId` etc. (unchanged) |
| `src/lib/ink/chunks.js` | `src/lib/canvas/chunks.js` | Stroke chunking (unchanged) |
| `src/lib/ink/path.js` | `src/lib/canvas/path.js` | Stroke pack/unpack (unchanged) |
| `src/components/ink/InkBoard.jsx` | `src/components/canvas/CanvasBoard.jsx` | Main canvas component |
| `src/components/ink/NoteInkSurface.jsx` | `src/components/canvas/CanvasSurface.jsx` | Surface wrapper |
| `src/components/ink/NoteInkOverlay.jsx` | `src/components/canvas/CanvasOverlay.jsx` | Overlay (selection, live stroke) |
| `src/components/ink/FloatingObjects.jsx` | `src/components/canvas/CanvasObjects.jsx` | Object rendering layer |
| `src/pages/NotePage.jsx` (ink tab) | → uses `CanvasBoard` | Ink tab becomes a mode of the canvas |

### Keep (unchanged or minor imports update)
- `src/components/ribbon/tabs/InkTabs.jsx` → becomes `CanvasTabs.jsx` (or similar), imports from new paths
- `src/hooks/useInkPage.js` → `src/hooks/useCanvasPage.js`
- `src/components/shell/EdgeDock.jsx` → used for inspector on canvas page
- `src/components/vault/VaultHeader.jsx`, `SpaceListPage.jsx` → used for canvas home
- `src/api/localDb.js` → add new table `CanvasDoc` (or extend `InkPage` with `kind`)

### New Files
| File | Purpose |
|------|---------|
| `src/lib/canvas/canvas-utils.js` | Migration helpers, card↔object converters, connector routing |
| `src/lib/canvas/migration.js` | One-time migration from `Canvas` table to `CanvasDoc`/`InkPage` |
| `src/pages/CanvasPage.jsx` (new) | Unified canvas editor page (replaces old CanvasPage + Ink tab) |
| `src/pages/CanvasHome.jsx` (new) | Unified canvas home (lists all canvas docs) |
| `src/components/canvas/CanvasToolbar.jsx` | Unified toolbar (ink tools + card/connector tools) |
| `src/components/canvas/CanvasInspector.jsx` | Unified inspector for all object types |
| `src/components/canvas/CanvasCardRenderer.jsx` | Renders a card object |
| `src/components/canvas/CanvasConnectorRenderer.jsx` | Renders a connector |
| `src/components/canvas/CanvasFrameRenderer.jsx` | Renders a frame |
| `src/components/canvas/CanvasTextFrameRenderer.jsx` | Renders a text-frame (markdown) |
| `src/components/canvas/CanvasImageRenderer.jsx` | Renders an image object |
| `src/components/canvas/CanvasPdfPageRenderer.jsx` | Renders a pdf-page object |

---

## 4. Navigation: Rail "Canvas" + Ink Tab → Same Engine

### Vault Home (rail)
- **Canvas** rail item (currently `CanvasHome.jsx`) → shows list of **all** canvas documents (kind `canvas` + kind `ink`).
- Click → opens `CanvasPage.jsx` (new unified page) with the document loaded.

### Note Page (ribbon)
- **Ink** tab (currently `InkTab` in `InkTabs.jsx`) → if note has `ink_page_id`, loads that page in `CanvasBoard`; if not, creates a new canvas doc (kind `ink`) and links it.
- The tab UI becomes a **mode switch** inside the unified canvas: "Ink mode" (shows brush tools), "Card mode" (shows card/connector tools), "Design mode" (shapes, frames, text-frames). All modes share the same document.

### Route
- `/canvas/:id` → `CanvasPage.jsx` (new unified page)
- `/note/:id` → `NotePage.jsx` (unchanged); the Ink tab inside it embeds `CanvasBoard` in a modal or inline panel.

---

## 5. File Extension & Storage

### IndexedDB (via `localDb.js`)
- **New table**: `CanvasDoc` (or extend `InkPage` with `kind` field).
- Schema:
  ```js
  CanvasDoc: {
    kind: "canvas" | "ink",   // "canvas" = migrated from cards; "ink" = original ink
    name: string,
    version: 2,
    paper: { template, size, tone },
    strokes: [],              // only for kind "ink" or mixed
    objects: [],              // all objects (cards, connectors, frames, etc.)
    camera: { x, y, scale },
    created_date, updated_date
  }
  ```
- **Strokes chunking**: Reuse `InkChunk` table for large stroke arrays (already works).
- **Migration**: Bump `DB_VERSION` in `localDb.js` (currently 6 → 7), add migration in `onupgradeneeded` to create `CanvasDoc` store and migrate `Canvas` records.

### Export Format: `.lemoncanvas`
- Plain JSON file (the document shape from §1).
- Export: "Export canvas" button → downloads `{ ...document, exportedAt: ISO, exportedBy: "lemonnote", version: 2 }`.
- Import: File picker → reads JSON, validates `version`, creates new `CanvasDoc` record.
- **No zip, no bundle** — single JSON file. Images/PDFs referenced by `local:` IDs are NOT included (user must export separately if needed). Future: optional bundle with attachments.

---

## 6. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration loses data | High | Write migration as pure functions, test with `fake-indexeddb` + `jsdom` on real exported data before shipping. Keep old `Canvas` table until user confirms migration succeeded. |
| Performance regression (many objects) | Medium | Ink engine already handles 10k+ strokes; cards are lighter. Add object culling (skip render outside view). |
| Selection/transform differences | Medium | Card selection was simple click; ink uses lasso. Unify: click selects single object, lasso multi-select. Connector editing: click connector → shows handles. |
| Ink tab vs Canvas page UX divergence | Medium | Single `CanvasBoard` component used in both places. Props control which tool palette is default. |
| Paper size vs infinite canvas conflict | Low | Paper system already supports `infinite` + frames. Frames on infinite = free rectangles with own paper settings. |
| Connector routing on paper pages | Low | Start with straight lines; frames/pages don't auto-route. |
| DB version bump breaks existing installs | High | Migration runs automatically on `onupgradeneeded`. Test `npm ci --dry-run` + manual install on clean browser. |
| Export/import round-trip loss | Medium | Write schema validation (Zod or manual) for import. Export includes `version`. |

---

## 7. Step Order (each step ≤ one prompt)

| Step | Task | Files Touched | Verification |
|------|------|---------------|--------------|
| 1 | **Create new table + migration** in `localDb.js`: add `CanvasDoc` entity, bump `DB_VERSION` to 7, write migration from `Canvas` → `CanvasDoc` (kind="canvas"). | `src/api/localDb.js` | `node scripts/test-migration.mjs` (fake-indexeddb) reads old Canvas, writes new CanvasDoc, old notes still open. |
| 2 | **Move ink engine to `src/lib/canvas/`** (rename folder, update all imports). No logic changes. | `src/lib/ink/` → `src/lib/canvas/`, all importers | `npm run build` passes. |
| 3 | **Extend `objects.js`** with new types: `card`, `connector`, `frame`, `text-frame`, `image`, `pdf-page`. Add renderers for each. | `src/lib/canvas/objects.js` | Unit test: create each object type, serialize, deserialize, render to offscreen canvas. |
| 4 | **Create `CanvasBoard.jsx`** (rename `InkBoard.jsx`), make it accept `kind` prop (`"ink"` | `"canvas"`), default tool palette per kind. | `src/components/canvas/CanvasBoard.jsx` | Storybook or manual: open `/canvas/:id` and `/note/:id` ink tab, both load. |
| 5 | **Build `CanvasPage.jsx`** (new unified page) using `CanvasBoard`. Replace old `CanvasPage.jsx`. | `src/pages/CanvasPage.jsx`, `src/App.jsx` route | `/canvas/:id` loads, shows cards + connectors + ink strokes. |
| 6 | **Build `CanvasHome.jsx`** (new unified home) listing `CanvasDoc` (both kinds). Replace old `CanvasHome.jsx`. | `src/pages/CanvasHome.jsx`, `src/App.jsx` route | `/canvas` shows all canvases, create new works. |
| 7 | **Wire Ink tab in NotePage** to use `CanvasBoard` (inline or modal). Remove `InkTab` component. | `src/components/ribbon/tabs/InkTabs.jsx`, `src/pages/NotePage.jsx` | Open note → Ink tab → draws strokes, adds cards, saves. |
| 8 | **Unified Inspector** for all object types (card, connector, frame, text-frame, image, pdf-page, shape, sticker, textbox, sticky). | `src/components/canvas/CanvasInspector.jsx` | Click any object → inspector shows correct fields. |
| 9 | **Toolbar / Ribbon integration**: new `CanvasToolbar` (or extend `InkTabs`) with mode switch (Ink / Card / Design). | `src/components/ribbon/tabs/CanvasTabs.jsx` (new), `NoteRibbon.jsx` | Mode switch changes visible tools. |
| 10 | **Export / Import `.lemoncanvas`**: add buttons in inspector / home, implement JSON serialization. | `src/components/canvas/CanvasToolbar.jsx`, `src/lib/canvas/export.js` (new) | Export → file downloads; Import → new canvas appears in home. |
| 11 | **Cleanup**: delete old `src/components/canvas/`, `src/lib/canvas.js`, old `CanvasPage.jsx`, `CanvasHome.jsx`. | Deletions | `npm run build` passes, no dead imports. |
| 12 | **Polish**: i18n keys for new object types, contrast check for new renderers, RTL test, reduced-motion test. | `src/lib/locales/*.json`, renderers | `node scripts/i18n-check.mjs` passes, manual RTL check. |

---

## 8. Acceptance Criteria (for "go" on each step)

- `npx eslint src --quiet` → 0 errors
- `npm run build` → succeeds
- `node scripts/i18n-check.mjs` → 0 failures
- `npm ci --dry-run` → passes
- Manual test list (per step) passes

---

## 9. What This Plan Does NOT Cover (future prompts)

- Connector auto-routing (elbow, curved, avoid nodes)
- Frame nesting (objects inside frames, frame-in-frame)
- Real-time collaboration / sync
- PDF import as pages (pdf-page object type)
- Handwriting recognition on strokes
- Canvas templates (pre-made layouts)
- Presentation mode (full-screen walkthrough)

---

*End of plan. Owner reads and says "go" or requests changes.*