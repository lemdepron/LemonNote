# LemonNote: rules for the coding agent

You are working on **LemonNote**, a local-first knowledge workspace (Markdown notes, wiki-links, backlinks, tags, full-text search, canvas, tables, code files, flashcards, handwriting ink, journal, tasks, graph, extensions, themes).
Repo: https://github.com/lemdepron/LemonNote (public, GPL-3.0). Owner: GitHub user `lemdepron`.

## The owner

- A complete beginner developer on a **Windows 11 laptop**. Uses VS Code and PowerShell.
- Explain every result in **simple words**. For every command you tell the owner to run, say **where** to run it (PowerShell anywhere, PowerShell inside the project folder, VS Code terminal, or the browser).
- Never invent facts, file contents, package versions or API details. If you did not check it, say "I did not check this".
- Ask for the file, or read it, before editing it. Never assume a file exists.

## Stack

- React 18, Vite 8, Tailwind 3, react-router 7, TanStack Query, **plain JavaScript (`.jsx` / `.js`, no TypeScript)**, Tauri 2 in `src-tauri/`.
- The `@` alias means `src/` (defined in `vite.config.js`).
- Markdown rendering: `react-markdown` with `remark-gfm`, `rehype-raw` and `rehype-sanitize` (whitelist in `src/lib/text-style.js`). Never allow arbitrary `style`, `class` or scripts in notes.

## Hard rules

1. **All data goes through `src/api/localDb.js`.** Pages never touch IndexedDB directly. A later Rust engine will replace only the inside of this file, so keep its outside shape identical (`list`, `filter`, `get`, `create`, `bulkCreate`, `update`, `bulkUpdate`, `delete`, `deleteMany`; results look like `{ items, has_more, next_cursor }`).
2. **Do not rename** these internal names (saved settings would silently reset): `notecraft:prefs`, `notecraft:user`, the IndexedDB name `notecraft`, CSS classes `nb-*`, theme preset ids.
3. There are **no logins or accounts**. Do not add any.
4. Do not add network calls. Local-first means it must work offline. (Known exception to fix later: fonts still load from Google.)
5. UI components in `src/components/ui/` are hand-written shadcn-style files. Do not assume other shadcn files exist. There is no toast system yet.
6. Do not edit `node_modules`, `dist`, `src-tauri/target`, `package-lock.json` by hand.
7. Keep changes **small and focused**. Touch only the files the task needs. No drive-by refactors, no renames, no reformatting of untouched code.
8. Do not add a dependency unless the task needs it. If you add one, say which and why.
9. Windows 11 laptop first, iPhone second. Do not optimise for other hardware.
10. **When you add a table to localDb.js you MUST bump DB_VERSION and add a migration test.**

## Where things are

- Notes page: `src/pages/NotePage.jsx` (autosave, title, tags, editor, reader, ribbon).
- **Tabbed ribbon (10 tabs):** `src/components/ribbon/NoteRibbon.jsx`
  - Tabs: Home, Insert, Format, Paragraph, Table, Journal, Tasks, Code, View, Ink.
  - Tab files: `src/components/ribbon/tabs/` (`TextTabs.jsx`, `InsertTabs.jsx`, `DataTabs.jsx`, `InkTabs.jsx`). Shared UI: `RibbonKit.jsx`.
  - Pure text-edit logic (no React): `src/lib/format-actions.js`, `table-extras.js`, `journal-tools.js`, `text-style.js`, `code-fence-languages.js`.
  - The editor is a plain `<textarea>`. Ribbon buttons edit it through `src/lib/editor-bridge.js`.
  - Per-note typography is saved on the note as `note.style`.
- **Ink lives inside notes.** Each note may own one ink page, linked by `note.ink_page_id`.
  - Logic: `src/hooks/useInkPage.js`. Drawing surface: `src/components/ink/NoteInkSurface.jsx` and `InkBoard.jsx`. Storage: `src/lib/ink/store.js`.
  - Deleting a note forever also deletes its ink (`src/lib/notes.js`).
  - The old standalone Ink pages and `/ink` routes were removed on purpose.
- Data tables in `localDb.js`: `Note`, `Canvas`, `DataTable`, `CodeFile`, `InkPage`, `InkChunk`, `Flashcard`.

<<<<<<< HEAD

## Standard process for EVERY task (follow it unless the prompt says otherwise)

1. **PLAN first.** List the files you will create or change, any data-shape changes and the risk to existing notes. If saved data could change shape, propose a safe migration so old notes keep opening. Then STOP and wait for the owner to reply "go".
2. **BUILD** only what the task says. Small changes. No renames, no unrelated refactors.
3. **No dead buttons.** Never add a button, menu item or tab that does nothing. If a feature is not built yet, leave it out.
4. **TEST.** Put pure logic in `src/lib/` and test it with a small Node script (`npm i --no-save fake-indexeddb jsdom` if you need a fake browser). Report real results and say what you could not test (anything needing a real screen, mouse or pen).
5. **VERIFY** with the commands in the next section.
6. Give a numbered **hand-test list** for the browser, including one step that proves old notes still open.
7. Do not commit, push or tag. STOP and wait.

## Planned architecture: Page mode (do not build until a task asks)

Goal: a Word/OneNote-like page with text, floating objects and handwriting ink **on top of the text**.

- A note gets `note.layout` = `"flow"` (today's behaviour, the default) or `"page"`. Old notes stay `"flow"` and must never change.
- `note.page` stores page settings (paper size, orientation, margins, columns, page colour, border, watermark, zoom). `note.objects` stores floating objects (text boxes, shapes, stickers, images, sticky notes) with x, y, width, height, rotation, z-order, group id and wrap mode.
- Page mode renders the note as a sheet at its real paper size (96 dpi: A4 portrait = 794 x 1123 px) with margins as padding. First version is one continuous sheet with dashed page-break guides; real pagination happens in print through CSS.
- Layers, bottom to top: page background and watermark, text, objects, ink. Ink strokes use **sheet pixel coordinates** so zoom never changes them. Ink does NOT follow text edits (text above it changing height will misalign it); the app must warn about this.
- The ink engine (`src/lib/ink/engine.js`) already has `setCamera`; page mode needs a locked-camera, transparent-background mode driven by the scroll position and zoom of the sheet.
- Wrap modes for objects: in front of text and behind text first; top-and-bottom later; square/tight wrap is a later, optional step.
- Macros mean recorded sequences of ribbon commands (never user-written code). Multi-window needs cross-window sync (BroadcastChannel) first. GIFs are imported from local files only (no online search).

=======

> > > > > > > feature-backup

## Before you say "done"

Run these from the project folder and report the real output:

```powershell
npx eslint src --quiet
npm run build
```

- Both must finish with no errors. Warnings about chunk size and `EBUSY` watcher noise are harmless.
- If you changed behaviour, say exactly how the owner can **test it by hand** in the browser (`npm run dev`, then http://localhost:5173), step by step.
- Never claim something works if you did not run or test it. Say what you tested and what you did not.
- Do not commit, push, tag or release. The owner does that.

## Known limits (do not "fix" unless the task says so)

- Notes live in browser/app storage (IndexedDB). The installed `.exe` and the browser at `localhost:5173` have **separate** storage.
- AI assist and handwriting recognition are off (their old backend functions were removed).
- Installers are unsigned. No sync between devices.

## Roadmap (context only)

1. Fix bugs and add essential features **in JavaScript** (current phase): backup/export and import, toast messages, bundled fonts, smaller notes with images, inline ink preview in Read mode.
2. Later: Rust engine with SQLite behind `localDb.js`, notes as real `.md` files, sync, Android, iPhone, code signing.

## Task protocol (applies to every task)

1. Do ONE task only: the one in the prompt. Do not start other items from the roadmap.
2. Before editing, read the files you will touch. Then write a short plan (files to change, files to create) and follow it.
3. Never invent file names, function names or library APIs. If something is not in the project, say so and ask, or create it deliberately.
4. Keep changes small. Do not reformat or rename untouched code. Do not delete features unless the task says so.
5. After editing, run `npx eslint src --quiet` and `npm run build` and report the REAL output.
6. Finish with: (a) list of files changed or created, (b) what you tested and what you did NOT test, (c) "Test by hand" steps for a beginner, numbered, with exact clicks, (d) anything risky or left undone.
7. Never commit, push, tag or release. Never run destructive commands (`rm -rf`, `git reset --hard`, `git clean`).
8. Explain in simple words. State where every command runs.

## UI design decisions (decided by the owner)

- The note ribbon is compact: icon-only buttons, two icon rows high, the name appears as a tooltip on hover, it stays visible (sticky) when the page scrolls.
- Main ribbon tabs, in this order: Home, Ink, Insert, Design, Layout, View, Share. Two contextual tabs (Table, Code) appear only when the cursor is inside a table or a code block.
- The ink layer lives inside the note (no separate Ink page).
- The logo is the lemon notebook icon (`src-tauri/icons/icon.png`), not an emoji.
- Do NOT add multi-window features (New Window, Arrange All, Side by Side, Synchronous Scrolling, Switch Windows): windows keep separate in-memory data and can overwrite each other.
