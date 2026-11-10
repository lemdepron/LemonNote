# Multi-Tab Note Editing with Split Pane - Design Document

## Intent and Why
Allow users to open multiple notes simultaneously in a single window using tabs, and split the view horizontally to view two notes side-by-side. This matches the UX of modern editors (VS Code, Obsidian, OneNote) and enables comparing/referencing notes while editing.

## Goals
1. Tab strip above note area with: title, close button, unsaved indicator, drag to reorder, middle-click to close, Ctrl+W to close, Ctrl+Tab to switch
2. Ctrl+click on links/search results/rail opens note in new tab
3. Open tabs persisted across restarts (localStorage)
4. Split pane: "Split" button opens second pane horizontally with draggable divider
5. Each pane has independent ribbon target (ribbon acts on focused pane)
6. Only ONE editable instance per note (second pane shows read-only)
7. Autosave works for both panes without conflicts

## Non-Goals
- Multi-window support (explicitly prohibited in AGENTS.md)
- Vertical split (horizontal only for v1)
- Tab grouping or workspaces
- Drag tabs between windows

## Constraints
- React 18, Vite 8, plain JavaScript (no TypeScript)
- Local-first, no network calls
- Windows 11 laptop first, iPhone second
- Keep changes small and focused
- Do not rename internal names (`notecraft:prefs`, IndexedDB name `notecraft`, CSS classes `nb-*`)
- All data through `src/api/localDb.js`
- No new dependencies unless necessary

## Approaches Considered

### Approach A: NoteContainer + NotePane (Selected)
- New `NoteContainer` manages tabs and split panes
- Each pane renders a `NotePane` component (extracted from `NotePage`)
- Tab state in localStorage via preferences system
- Clean separation, minimal routing changes

### Approach B: Refactor NotePage internally
- Keep `NotePage` but add tab/split state internally
- More complex state in one component
- Rejected: harder to maintain, mixes concerns

### Approach C: React Router nested routes
- URLs like `/note/tab1/noteId1/tab2/noteId2`
- Enables deep linking but complex routing
- Rejected: over-engineered for local-first app, URL pollution

## Architecture

### Components
```
NoteContainer (route /note/*)
├── NoteTabs (tab strip)
├── SplitView (horizontal split container)
│   ├── NotePane (left pane - editable or read-only)
│   └── NotePane (right pane - editable or read-only)
└── SplitDivider (draggable handle)
```

### State Management
- **Tab state** (open tabs, active tab, split config): `useNoteTabs` hook → localStorage (`notecraft:prefs`)
- **Pane focus**: `PaneFocusContext` → tracks which pane has focus for ribbon targeting
- **Per-pane note state**: Each `NotePane` manages its own note data (title, body, tags, etc.)

### Ribbon Integration
- `NoteRibbon` consumes `PaneFocusContext` to know which pane's editor to target
- Editor bridge (`editor-bridge.js`) is global singleton → each pane registers its own textarea
- On focus change, ribbon re-reads active pane's editor

### Edit Conflict Prevention
- Track `editingNoteId` per pane
- If same `noteId` opened in two panes: second pane gets `readOnly={true}`
- Read-only pane: no ribbon, no editor, shows MarkdownView only
- User can still navigate/scroll in read-only pane

### Autosave
- Each `NotePane` has independent `revision` counter and save debounce
- Saves go through `localDb.js` → IndexedDB
- No conflict because only one pane edits a given note at a time

## Data Shape (localStorage)
```json
{
  "openNoteTabs": [
    { "noteId": "abc123", "paneIndex": 0 },
    { "noteId": "def456", "paneIndex": 1 }
  ],
  "activeNoteTab": 0,
  "splitConfig": { "enabled": true, "ratio": 0.5 }
}
```

## Migration
- On first load after update: if `openNoteTabs` empty, create single tab for current note (from URL)
- Old URLs `/note/:id` still work → redirect to container with that note as first tab
- No IndexedDB migration needed (notes unchanged)

## File Changes

### New Files
1. `src/components/notes/NoteContainer.jsx` - Main container component
2. `src/components/notes/NotePane.jsx` - Single note pane (extracted from NotePage)
3. `src/components/notes/NoteTabs.jsx` - Tab strip UI
4. `src/components/notes/SplitDivider.jsx` - Draggable divider
5. `src/hooks/useNoteTabs.js` - Tab state management
6. `src/context/PaneFocusContext.jsx` - Focus tracking for ribbon

### Modified Files
1. `src/App.jsx` - Route change: `/note/*` → `NoteContainer`
2. `src/pages/NotePage.jsx` - Deprecated (or becomes thin wrapper)
3. `src/components/ribbon/NoteRibbon.jsx` - Use `PaneFocusContext`
4. `src/lib/editor-bridge.js` - Support multiple editor registration (or pane-specific)

## Testing Checklist
- [ ] Open multiple tabs via Ctrl+click on links
- [ ] Tab strip: close, reorder, middle-click, Ctrl+W, Ctrl+Tab
- [ ] Split pane: toggle, drag divider, resize
- [ ] Ribbon targets focused pane
- [ ] Same note in two panes → second is read-only
- [ ] Autosave works in both panes independently
- [ ] Tabs persist after reload
- [ ] Old URLs still work
- [ ] No console errors
- [ ] `npx eslint src --quiet` passes
- [ ] `npm run build` passes