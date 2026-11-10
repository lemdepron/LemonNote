# Multi-Tab Note Editing with Split Pane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement tabbed note editing with horizontal split pane in a single window, with persistent tabs, ribbon targeting focused pane, and edit conflict prevention.

**Architecture:** New `NoteContainer` component manages tabs and split panes. Each pane renders a `NotePane` (extracted from `NotePage`). Tab state persisted in localStorage via preferences. `PaneFocusContext` tracks which pane has focus for ribbon targeting. Each `NotePane` has independent autosave.

**Tech Stack:** React 18, Vite 8, Tailwind 3, react-router 7, plain JavaScript (.jsx), localStorage for tab persistence, IndexedDB via `localDb.js` for notes.

**Spec:** docs/superpowers/specs/2026-11-09-multi-tab-split-pane-design.md

## Global Constraints

- All data through `src/api/localDb.js`; pages never touch IndexedDB directly
- Do not rename internal names: `notecraft:prefs`, `notecraft:user`, IndexedDB name `notecraft`, CSS classes `nb-*`, theme preset ids
- No logins, no network calls (local-first)
- UI components in `src/components/ui/` are hand-written shadcn-style
- Keep changes small and focused; touch only files the task needs
- Do not add dependencies unless task needs them
- Windows 11 laptop first, iPhone second
- When adding tables to localDb.js: bump DB_VERSION and add migration test (not needed here)
- Run `npx eslint src --quiet` and `npm run build` after changes

## Review Focus

1. **Multiple editors registered simultaneously** — Editor bridge is global singleton; must handle multiple textareas without cross-contamination
2. **Ribbon targeting wrong pane** — Ribbon must read from focused pane's editor only
3. **Edit conflict: same note in two panes** — Second pane must be read-only; verify no write attempts
4. **Autosave race conditions** — Two panes saving different notes concurrently must not interfere
5. **Tab persistence corruption** — localStorage tab state must survive malformed data and migrate gracefully

---

### Task 1: Create PaneFocusContext for Ribbon Targeting

**Files:**
- Create: `src/context/PaneFocusContext.jsx`
- Modify: `src/components/ribbon/NoteRibbon.jsx` (consume context)

**Interfaces:**
- Consumes: —
- Produces: `PaneFocusProvider`, `usePaneFocus()` hook, `registerPane(paneId, editorRef)`, `unregisterPane(paneId)`, `focusPane(paneId)`

- [ ] **Step 1: Write the failing test**

Create test file `src/context/__tests__/PaneFocusContext.test.jsx` (or verify manually since no test framework configured):
```jsx
// Manual verification: context provides registerPane, unregisterPane, focusPane, getFocusedPane
```

- [ ] **Step 2: Run test to verify it fails**
Expected: File doesn't exist yet

- [ ] **Step 3: Implement `PaneFocusContext.jsx`**

Create context with:
- `PaneFocusProvider` wrapping children
- `panes` Map: paneId → { editorRef, noteId, isReadOnly }
- `focusedPaneId` state
- `registerPane(paneId, { editorRef, noteId, isReadOnly })`
- `unregisterPane(paneId)`
- `focusPane(paneId)` — sets focusedPaneId
- `usePaneFocus()` hook returning `{ focusedPane, registerPane, unregisterPane, focusPane }`

- [ ] **Step 4: Modify `NoteRibbon.jsx` to consume context**

Replace global `editor-bridge` usage with `usePaneFocus()` to get focused pane's editorRef

- [ ] **Step 5: Run verification**
Manual: Open two panes, switch focus, verify ribbon acts on correct pane

- [ ] **Step 6: Commit**

---

### Task 2: Create useNoteTabs Hook for Tab State Management

**Files:**
- Create: `src/hooks/useNoteTabs.js`

**Interfaces:**
- Consumes: `readPref`, `writePref` from `@/lib/preferences`
- Produces: `useNoteTabs()` hook returning:
  - `tabs` array: [{ noteId, paneIndex, isReadOnly }]
  - `activeTabIndex` number
  - `splitConfig` { enabled: boolean, ratio: number }
  - `openTab(noteId, paneIndex?)`
  - `closeTab(tabIndex)`
  - `reorderTabs(fromIndex, toIndex)`
  - `setActiveTab(index)`
  - `toggleSplit()`
  - `setSplitRatio(ratio)`

- [ ] **Step 1: Write the failing test**
Manual verification: hook returns expected interface

- [ ] **Step 2: Run test to verify it fails**
Expected: File doesn't exist

- [ ] **Step 3: Implement `useNoteTabs.js`**

- Load initial state from `readPref('openNoteTabs', [])`, `readPref('activeNoteTab', 0)`, `readPref('splitConfig', { enabled: false, ratio: 0.5 })`
- Validate loaded data (handle corruption)
- Persist all changes via `writePref`
- `openTab(noteId, paneIndex)` — adds tab, activates it, handles split pane assignment
- `closeTab(tabIndex)` — removes tab, activates adjacent
- `reorderTabs(from, to)` — moves tab in array, persists
- `toggleSplit()` — toggles splitConfig.enabled, reassigns paneIndex for tabs
- `setSplitRatio(ratio)` — updates ratio (0.2 to 0.8)

- [ ] **Step 4: Run verification**
Manual: Open dev tools, check localStorage `notecraft:prefs` for tab state

- [ ] **Step 5: Commit**

---

### Task 3: Create NotePane Component (Extracted from NotePage)

**Files:**
- Create: `src/components/notes/NotePane.jsx`
- Modify: `src/pages/NotePage.jsx` → becomes thin wrapper or deprecated

**Interfaces:**
- Consumes: `noteId` (string), `isReadOnly` (boolean), `paneId` (string), `onFocus` (fn), `onClose` (fn), `onSplit` (fn)
- Produces: Renders note editor/view with ribbon (if not read-only)

- [ ] **Step 1: Write the failing test**
Manual: Component renders without error

- [ ] **Step 2: Run test to verify it fails**
Expected: File doesn't exist

- [ ] **Step 3: Implement `NotePane.jsx`**

Extract logic from `NotePage.jsx`:
- Load note data via `db.entities.Note.get(noteId)`
- State: title, body, tags, format, typography, inkId, mode, viewMode, etc.
- Register pane with `PaneFocusContext` on mount (pass editorRef via callback)
- Handle focus: call `focusPane(paneId)` and `onFocus(paneId)`
- If `isReadOnly`: render `MarkdownView` only, no ribbon, no editor, no autosave
- If editable: full NotePage functionality (editor, ribbon, autosave, ink, etc.)
- Autosave debounce per pane (independent `revision` counter)
- Handle `onClose` and `onSplit` callbacks to notify container

- [ ] **Step 4: Run verification**
Manual: Render NotePane with a noteId, verify editor loads, autosave works

- [ ] **Step 5: Commit**

---

### Task 4: Create NoteTabs Component (Tab Strip UI)

**Files:**
- Create: `src/components/notes/NoteTabs.jsx`

**Interfaces:**
- Consumes: `tabs` array, `activeTabIndex`, `onActivateTab(index)`, `onCloseTab(index)`, `onReorderTabs(from, to)`, `onNewTab()`, `onSplit()`
- Produces: Tab strip UI with drag-reorder, close buttons, keyboard shortcuts

- [ ] **Step 1: Write the failing test**
Manual: Tab strip renders, interactions work

- [ ] **Step 2: Run test to verify it fails**
Expected: File doesn't exist

- [ ] **Step 3: Implement `NoteTabs.jsx`**

- Render tabs horizontally: `{noteId, isReadOnly}` → show title (truncated), close X, unsaved dot (if editing)
- Click tab → `onActivateTab(index)`
- Click close X → `onCloseTab(index)`
- Middle-click tab → close
- Drag to reorder → `onReorderTabs(from, to)` (use native HTML5 drag API or simple onMouseDown/onMouseMove)
- Keyboard: Ctrl+W → close active, Ctrl+Tab → next, Ctrl+Shift+Tab → previous
- "+" button at end → `onNewTab()` (opens vault home or new note)
- Split button → `onSplit()`
- Tooltip on hover shows full title
- Sticky positioning (stays visible when scrolling)

- [ ] **Step 4: Run verification**
Manual: Open multiple tabs, verify all interactions

- [ ] **Step 5: Commit**

---

### Task 5: Create SplitDivider Component

**Files:**
- Create: `src/components/notes/SplitDivider.jsx`

**Interfaces:**
- Consumes: `ratio` (0-1), `onRatioChange(newRatio)`, `disabled` (boolean)
- Produces: Draggable vertical divider

- [ ] **Step 1: Write the failing test**
Manual: Divider drags, ratio updates

- [ ] **Step 2: Run test to verify it fails**
Expected: File doesn't exist

- [ ] **Step 3: Implement `SplitDivider.jsx`**

- Vertical divider (horizontal split = left/right panes)
- Mouse down → track movement → update ratio (clamp 0.2 to 0.8)
- Visual feedback during drag
- Double-click → reset to 0.5
- CSS: `cursor: col-resize`, hover/focus states
- Accessible: keyboard support (ArrowLeft/Right to adjust)

- [ ] **Step 4: Run verification**
Manual: Drag divider, verify panes resize

- [ ] **Step 5: Commit**

---

### Task 6: Create NoteContainer Component (Main Orchestrator)

**Files:**
- Create: `src/components/notes/NoteContainer.jsx`
- Modify: `src/App.jsx` (route change)

**Interfaces:**
- Consumes: `useNoteTabs` hook, `NotePane`, `NoteTabs`, `SplitDivider`, `PaneFocusProvider`
- Produces: Top-level component at `/note/*` route

- [ ] **Step 1: Write the failing test**
Manual: Container renders, manages tabs and split

- [ ] **Step 2: Run test to verify it fails**
Expected: File doesn't exist

- [ ] **Step 3: Implement `NoteContainer.jsx`**

- Wrap in `PaneFocusProvider`
- Use `useNoteTabs()` for state
- Render `NoteTabs` with callbacks
- If split enabled: render `SplitView` with two `NotePane` children
  - Left pane: tabs[0] (or first tab with paneIndex 0)
  - Right pane: tabs[1] (or first tab with paneIndex 1)
  - `SplitDivider` between them
- If not split: render single `NotePane` for activeTab
- Handle `onFocus` from panes → update `PaneFocusContext`
- Handle `onClose` → `closeTab`
- Handle `onSplit` → `toggleSplit`
- Handle new tab from URL: if URL has `:id` not in tabs, open it
- Backward compatibility: `/note/:id` → open that note as first tab

- [ ] **Step 4: Modify `src/App.jsx`**

Change route from `<Route path="/note/:id" element={<NotePageWithErrorBoundary />} />`
to `<Route path="/note/*" element={<NoteContainerWithErrorBoundary />} />`
(Keep NotePage for backward compat or redirect)

- [ ] **Step 5: Run verification**
Manual: Navigate to `/note/abc123`, verify loads. Open second tab via Ctrl+click. Toggle split.

- [ ] **Step 6: Commit**

---

### Task 7: Update LinkRail and VaultHome for Ctrl+Click New Tab

**Files:**
- Modify: `src/components/vault/LinkRail.jsx`
- Modify: `src/pages/VaultHome.jsx`
- Modify: `src/components/vault/SearchResults.jsx` (if exists)
- Modify: `src/components/vault/NoteCard.jsx` (if exists)

**Interfaces:**
- Consumes: `navigate` from react-router
- Produces: Ctrl+click opens in new tab (calls container's openTab via URL or context)

- [ ] **Step 1: Write the failing test**
Manual: Ctrl+click link opens new tab

- [ ] **Step 2: Run test to verify it fails**
Expected: Current behavior navigates in same tab

- [ ] **Step 3: Implement changes**

- In `LinkRail.jsx`: onClick → check `event.ctrlKey || event.metaKey`, if true: navigate to `/note/${noteId}?newTab=1` (or use a context to call openTab directly)
- In `VaultHome.jsx`: NoteCard and search results links → same Ctrl+click handling
- Container reads `newTab` param or uses a shared context to open in new tab

- [ ] **Step 4: Run verification**
Manual: Ctrl+click links in vault, search results, backlinks → new tab opens

- [ ] **Step 5: Commit**

---

### Task 8: Handle Read-Only Pane for Duplicate Notes

**Files:**
- Modify: `src/components/notes/NoteContainer.jsx`
- Modify: `src/components/notes/NotePane.jsx`

**Interfaces:**
- Consumes: `tabs` array from `useNoteTabs`
- Produces: `isReadOnly` prop for NotePane

- [ ] **Step 1: Write the failing test**
Manual: Open same note in two panes → second is read-only

- [ ] **Step 2: Run test to verify it fails**
Expected: Both panes editable

- [ ] **Step 3: Implement logic**

- In `NoteContainer`: when rendering panes, check if `noteId` already exists in another pane
- Pass `isReadOnly={true}` to second NotePane
- In `NotePane`: if `isReadOnly`, render `MarkdownView` only, skip ribbon, editor, autosave
- Show subtle indicator: "Read-only (editing in other pane)"

- [ ] **Step 4: Run verification**
Manual: Open note in left pane, split, open same note in right → right is read-only

- [ ] **Step 5: Commit**

---

### Task 9: Verify Autosave Works Independently in Both Panes

**Files:**
- Modify: `src/components/notes/NotePane.jsx` (verify autosave logic)

**Interfaces:**
- Consumes: `db.entities.Note.update/create`
- Produces: Independent saves per pane

- [ ] **Step 1: Write the failing test**
Manual: Edit in both panes rapidly, verify both save

- [ ] **Step 2: Run test to verify it fails**
Expected: May have conflicts

- [ ] **Step 3: Verify and fix if needed**

- Each NotePane has own `revision` state and debounce timer
- `savePending` ref per pane
- `latestRef` per pane
- No shared state between panes
- Verify `db.entities.Note.update` called with correct noteId for each pane

- [ ] **Step 4: Run verification**
Manual: Open two different notes in split, edit both rapidly, check IndexedDB

- [ ] **Step 5: Commit**

---

### Task 10: Run Lint and Build, Final Verification

**Files:**
- All modified/created files

- [ ] **Step 1: Run `npx eslint src --quiet`**
Expected: No errors

- [ ] **Step 2: Run `npm run build`**
Expected: No errors

- [ ] **Step 3: Hand-test checklist**

1. Open app at `http://localhost:5173`
2. Create note A, create note B
3. Ctrl+click note B from vault → opens in new tab
4. Verify tab strip shows both notes, can switch with Ctrl+Tab
5. Click "Split" → two panes side by side
6. Drag divider → panes resize
7. Edit note in left pane, edit note in right pane → both autosave
8. Open same note in both panes → right pane read-only
9. Reload page → tabs restored
10. Close tab with X, middle-click, Ctrl+W
11. Reorder tabs by dragging
12. Old URL `/note/:id` still works

- [ ] **Step 4: Commit**

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-11-09-multi-tab-split-pane.md`. Please review the plan. Does it capture what you want?