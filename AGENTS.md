# LemonNote: rules for the coding agent

You are working on **LemonNote**, a local-first knowledge workspace (Markdown notes, wiki-links, backlinks, tags, full-text search, canvas, tables, code files, flashcards, handwriting ink, journal, tasks, graph, extensions, themes).
Repo: https://github.com/lemdepron/LemonNote (public, GPL-3.0). Owner: GitHub user `lemdepron`.

## Current phase: STABILISATION (read this first)

All 34 roadmap prompts (P1 to P34) were applied, then fix prompts F1 to F9. **Do not add new features** unless the task is explicitly a feature prompt (G6 styles, G7 tray). The work now is fixing bugs, polish, translation and design consistency, in the order given by the owner's prompts (G1, G2, ...). If a task needs a new feature, stop and say so.

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
2. **Do not rename** these internal names (saved settings would silently reset): `notecraft:prefs`, `notecraft:user`, the IndexedDB name `notecraft`, CSS classes `nb-*`, theme preset ids. Removing a duplicate theme preset is allowed only when the task lists its id; a saved id that no longer exists already falls back to the default theme.
3. There are **no logins or accounts**. Do not add any.
4. **No network calls** except the optional AI feature (off by default, never runs on its own) and the update check. The app must work fully offline. Fonts are bundled in `public/fonts/`; never add Google Fonts links.
5. UI components in `src/components/ui/` are hand-written shadcn-style files (currently: alert-dialog, button, dropdown-menu, popover, separator, switch, toaster). Do not assume other shadcn files exist; create the file if a task needs one.
6. Do not edit `node_modules`, `dist`, `src-tauri/target` by hand. `package-lock.json` is changed only by running `npm install` (see rule 12).
7. Keep changes **small and focused**. Touch only the files the task needs. No drive-by refactors, no renames, no reformatting of untouched code.
8. Do not add a dependency unless the task needs it. If you add one, say which and why.
9. Windows 11 laptop first, iPhone second. Do not optimise for other hardware.
10. **When you add a table to localDb.js you MUST bump DB_VERSION and add a migration test.**
11. **Strings and translation.** Every visible text (labels, tooltips, toasts, dialogs) goes through `t("key")` from `src/lib/i18n.js`. Add the key to `en.json` first, then to all other language files. After any text change run `node scripts/i18n-check.mjs`; it must report no failures. Do not leave empty values. Every key used in code must exist in `en.json` (the check scans for this). Never print a raw value that can be `null` or `undefined` in a label.
12. **Lock file and CI.** The GitHub release workflow runs `npm ci`, which fails if `package.json` and `package-lock.json` disagree. After any dependency change run `npm install` and then `npm ci --dry-run`; both must succeed. Tell the owner to commit `package-lock.json`.
13. **No native dialogs.** Do not use `window.alert`, `window.confirm` or `window.prompt`. Use `alert-dialog.jsx`, a small in-app dialog, or a toast. Do not use `window.__something` globals to pass data between components; use props, context or `src/lib/` modules.
14. **No native `<select>`.** Dropdowns use the themed Select component (`src/components/ui/select.jsx`, built on `@radix-ui/react-select`) so they follow the theme.
15. **Layout is direction-safe.** Use logical CSS (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`) instead of `left`/`right`/`ml-`/`mr-` in anything you touch. Arabic, Persian and Urdu are right-to-left.
16. **Colours come from theme tokens** (`bg-background`, `text-foreground`, `bg-primary`, ...). No hard-coded colours in components except inside theme data. Any new or changed theme must pass the contrast check: text on page and on card at least 4.5:1, button text on button at least 4.5:1, link on page at least 4.5:1.
17. **Overlays.** Panels that open over the page (Find Tags, Backup, import options, anything similar) use `src/components/ui/dialog.jsx` (modal) or a Popover with a fixed max width and max height, a scrolling body and a solid background. Content must never overflow its box. Check at a narrow window width and in right-to-left.
18. **Tab line sticky, panel hides on scroll.** Only the ribbon tab line (undo/redo/star, file, tabs, goal, macros) is sticky at the top of the window, below the app header. The note tabs row and breadcrumb row scroll away normally. The panel (96 px row of groups) hides on scroll down, shows on scroll up, always shown at page top. Dead zone ~8 px, re-show threshold ~80 px. Clicking a tab or focusing the ribbon shows the panel. No content jump: wrapper keeps full height, panel slides over text. Animates with short transition; prefers-reduced-motion disables animation. Panel must not hide while a popover from it is open.
19. **Do not create planning, summary or throwaway files** in the repo (no `*_SUMMARY.md`, `*_PLAN.md`, `changes.txt`, `HAND-TEST.md`, no `fix-*.cjs`, `debug-*.mjs`, `check-*.cjs`, no backup copies like `original_*.jsx`). Run one-off helper scripts from a temporary folder outside the repo, or delete them when done. Reusable checks go in `scripts/` with a one-line comment at the top and an entry in package.json. Put the report in your reply. A design document goes in `docs/` only if the task asks for it.

## Translation workflow

One language per task. Work in batches of at most 150 keys using `scripts/i18n-worklist.mjs` and `scripts/i18n-merge.mjs`. Translate for real; never copy the English text as the translation; keep placeholders exactly; list doubtful terms in `docs/i18n/review-<lang>.md`.

## Where things are

- Notes page: `src/pages/NotePage.jsx`; panes and tabs: `src/components/notes/` (`NotePane.jsx`, `NoteContainer.jsx`, `NoteTabs.jsx`). Autosave, title, tags, editor, reader and ribbon live there.
- **Ribbon:** `src/components/ribbon/NoteRibbon.jsx` (tab bar and frame in `RibbonKit.jsx`, Quick Access in `QuickAccess.jsx`, button registry in `src/lib/ribbon-registry.js`, File panel in `FilePanel.jsx`).
  - Main tabs, in this order: Home, Ink, Insert, Design, Layout, View, Share. Contextual tabs Table and Code appear only inside a table or code block.
  - Tab files: `src/components/ribbon/tabs/` (`HomeTab`, `InkTabs`, `InsertTab`, `DesignTab`, `LayoutTab`, `ViewTab`, `ShareTab`, `TableContextTab`, `CodeContextTab`). List the folder to see the current files.
  - Pure text-edit logic (no React): `src/lib/format-actions.js`, `table-extras.js`, `journal-tools.js`, `text-style.js`, `code-fence-languages.js`.
  - The editor is a plain `<textarea>`. Ribbon buttons edit it through `src/lib/editor-bridge.js`.
  - Per-note typography and design are saved on the note as `note.style`.
- **Vault (home) screen:** `src/pages/VaultHome.jsx`, `src/components/vault/` (`VaultHeader`, `VaultSidebar`, `TagRail`, `Backup`, `SearchResults`), `src/components/tags/FindTagsPanel.jsx`.
- **Settings:** `src/pages/SettingsPage.jsx`. Themes: `src/lib/theme-presets.js`, `src/lib/theme.js`, `src/components/themes/ThemeGallery.jsx`.
- **Translations:** `src/lib/i18n.js` and `src/lib/locales/*.json` (ar, de, en, es, fa, fr, hi, ja, ru, ur, zh). Check script: `scripts/i18n-check.mjs`.
- **Ink lives inside notes.** Each note may own one ink page, linked by `note.ink_page_id`.
  - Logic: `src/hooks/useInkPage.js`. Drawing: `src/components/ink/NoteInkSurface.jsx`, `NoteInkOverlay.jsx`, `InkBoard.jsx`, `FloatingObjects.jsx`. Storage: `src/lib/ink/store.js`. Floating objects: `src/lib/ink/objects.js`.
  - Deleting a note forever also deletes its ink and unused attachments (`src/lib/notes.js`).
- **Attachments:** `src/lib/attachments.js` (references look like `local:<id>`).
- **Encryption (per-note password):** `src/lib/encryption.js`. Locked notes are excluded from search, graph, backlinks and exports.
- **Desktop:** `src-tauri/` (config `tauri.conf.json`, permissions in `capabilities/`), release workflow `.github/workflows/release.yml`.
- Data tables in `localDb.js` (DB_VERSION is in that file): `Note`, `Canvas`, `DataTable`, `CodeFile`, `InkPage`, `InkChunk`, `Flashcard`, `Template` and the `_files` store.

## Standard process for EVERY task (follow it unless the prompt says otherwise)

1. **READ** the files you will touch. Never invent file names, function names or library APIs; if something is not in the project, say so.
2. **PLAN first.** List the files you will create or change, any data-shape changes and the risk to existing notes. If saved data could change shape, propose a safe migration so old notes keep opening. Then STOP and wait for the owner to reply "go".
3. **BUILD** only what the task says. Do ONE task only. No renames, no unrelated refactors, no deleting features unless the task says so.
4. **No dead buttons.** Never add a button, menu item or tab that does nothing.
5. **TEST.** Put pure logic in `src/lib/` and test it with a small Node script (`npm i --no-save fake-indexeddb jsdom` if you need a fake browser). Report real results and say what you could not test (anything needing a real screen, mouse or pen).
6. **VERIFY** (next section) and report the REAL output.
7. **Finish with:** (a) files changed or created, (b) what you tested and what you did NOT test, (c) a numbered "Test by hand" list for a beginner with exact clicks, including one step that proves an old note still opens, (d) anything risky or left undone.
8. Never commit, push, tag or release. Never run destructive commands (`rm -rf`, `git reset --hard`, `git clean`). STOP and wait.

## Honest reporting (very important)

Never write "done", "completed" or "all fixed" unless every check below passes. If a check fails, write the exact failing number (for example "i18n-check: 5862 failures") and say which part of the task is NOT finished. A task that asks for 10 languages is not done when 1 language is complete. If you could only do part of a task, say so in the first line of your report.

## Before you say "done"

Run these from the project folder and report the real output:

```powershell
npx eslint src --quiet
npm run build
node scripts/i18n-check.mjs
npm ci --dry-run
```

- ESLint and the build must finish with no errors. Warnings about chunk size, dynamic imports and `EBUSY` watcher noise are known and harmless.
- `i18n-check` must report no failures (if it fails for reasons outside your task, say which keys and how many, and do not hide it).
- `npm ci --dry-run` must pass on the committed `package-lock.json` (run `npm install` first if you changed dependencies, then tell the owner to commit the lock file).
- If you changed behaviour, say exactly how the owner can **test it by hand** in the browser (`npm run dev`, then http://localhost:5173), step by step.
- Never claim something works if you did not run or test it.

## Known limits (do not "fix" unless the task says so)

- Notes live in browser/app storage (IndexedDB). The installed `.exe` and the browser at `localhost:5173` have **separate** storage.
- AI features are optional and off until the owner configures a provider. Handwriting recognition is off.
- Installers are unsigned. No sync between devices.
- Multi-window features are NOT allowed (New Window, Arrange All, Side by Side, Synchronous Scrolling, Switch Windows): windows keep separate in-memory data and can overwrite each other.

## UI design decisions (decided by the owner)

- The note ribbon tab line is compact: icon-only buttons, two icon rows high, the name appears as a tooltip on hover and on keyboard focus, and it stays sticky at the top of the window below the app header. The panel (groups row) hides on scroll down, shows on scroll up, always shown at page top. Each group shows up to six buttons in two rows with the group name below; overflow goes into a "..." popover per group. No group collapses to a dropdown. In narrow windows the panel scrolls sideways.
- The ink layer lives inside the note (no separate Ink page).
- The logo is the lemon notebook icon (`src-tauri/icons/icon.png`), not an emoji.
- The default theme is **lemon**: lemon-yellow buttons with dark text on a warm cream page. Themes must look clearly different from each other (different colour family and character), not the same layout recoloured.

## Roadmap (context only)

1. **Now:** stabilisation (fix prompts F1 to F9: repo health, ribbon, selects, vault screen, themes, translations, icons, dialogs, feature gaps).
2. Later: Rust engine with SQLite behind `localDb.js`, notes as real `.md` files, sync, Android, iPhone, code signing.
3. Possible later feature, only when a task asks: "Page mode" (`note.layout` = `"flow"` or `"page"`, sheet at real paper size, floating objects and ink over the text). Check what already exists in the code before planning it. Old notes stay `"flow"` and must never change.
