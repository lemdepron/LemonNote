# LemonNote: note interface spec

Source: the owner's hand sketch of 13 Nov 2026, plus the owner's answers. Put this file in the repo as `docs/note-interface-spec.md`. For the note page, this file is the design authority. If the code and this file disagree, this file wins, unless the owner says otherwise.

Goal in the owner's words: clear, lots of free space, arranged and compacted as much as possible.

## 1. Layout, top to bottom

```
+------+-----------------------------------------------------------------+
| RAIL | [Note 1 x] [Note 2 x]                                     [ + ] |  note tabs row
|      | <- Vault / Note 1  (click the title to rename)  [Write|Split|Read] [moon] |  breadcrumb row
|      | +-------------------------------------------------------------+ |
|      | | undo redo star | file | Home Ink Insert Design Layout View Share | goal  Macros |  TAB LINE (sticky)
|      | +-------------------------------------------------------------+ |
|      | | group | group | group | group ...   (2 icon rows, name below) |  PANEL (hides on scroll down)
|      | +-------------------------------------------------------------+ |
|      |                                                                 |
|      |   WRITING AREA: starts top-left, grows downward without limit   |
|      |                                                                 |
|      | Words: N  |  (crossed cloud) Not synced  |  Saved (check)      |  status bar
+------+-----------------------------------------------------------------+
```

## 2. Decisions (from the owner)

1. **Rail**, top to bottom: Vault, Graph, Canvas, Queries, Plugins, Bin, a divider, Sync (sync-arrows icon, label "soon", not clickable). At the bottom: Settings, the app logo inside a circle, and a `>>>` button that collapses or expands the rail.
2. **Note tabs row**: one tab per open note, each with a close mark. A `+` at the far right opens a new note.
3. **Breadcrumb row**: `<- Vault / Title`. Clicking the title renames the note. On the right: the Write / Split / Read switch, then a moon button. The moon switches between dark and light.
4. **Tab line** (one bordered box with the ribbon): Undo, Redo, Star (Quick Access, as in the current build), the File button (the page icon, same menu as the current build), the tabs Home, Ink, Insert, Design, Layout, View, Share (contextual Table and Code tabs still appear only in a table or code block), then the word-goal target button, then Macros (records edits, as in the current build, moved here from under the note).
5. **Panel pattern**: every group is up to six icon buttons in two rows (three columns), the group name under it, and thin vertical dividers between groups. If a group has more than six actions it shows five plus one `...` box; the box opens a small popover with the rest. A group may also hold one tall box (for example the Paragraph style picker with a scrolling list). **No group turns into a dropdown.** Only in a narrow window the panel scrolls sideways.
6. **Scroll** (the owner's drawing of 14 Nov 2026): scrolling DOWN leaves ONLY the tab line sticky at the top; the note tabs row, the breadcrumb row and the panel go away. The next scroll UP, even by a few pixels and anywhere in the page, brings ALL of it back: note tabs row, breadcrumb row, tab line and panel. At the very top of the page everything is shown.
7. **Writing area**: wide, no inner box, no limit downward, one scroll for the whole page.
8. **Status bar**: `Words: N`, `Not synced` with a crossed-cloud icon, `Saved` with a check. The number is the words written now.
9. **Icons**: lucide-react outline icons, but each icon must match its function and be easy to tell apart. Colour may be added through theme tokens (decided later, on the icons page).

10. **Compact controls** (owner's drawing of 14 Nov 2026): every select and dropdown, in the ribbon and in Settings, is as small as possible: the box is only as wide as its content, the open list is only as wide as its longest item, rows are about 26 px high, the selected item has a check mark, a small arrow shows when the list scrolls. The `...` popover of a group is a small grid of icon buttons (3 or 4 per row), each with a tooltip, not wide rows.
11. **Group names and panel size**: group names are small (about 10 px, no wide letter spacing); the panel is about 72 px high; no scrollbar may cover the group names; no vertical scrollbar in the panel. At a 1366 px wide window every tab must fit without sideways scrolling.
12. **Space**: the writing area starts right under the ribbon (gap 8 px or less, no divider line). The note tabs row is about 32 px high, the breadcrumb row about 36 px, the tab line about 32 px.
13. **Icon-only buttons**: the light/dark button shows only the sun or the moon, no word.
14. **Rail**: about 44 to 48 px wide, buttons 32 px, icons 18 to 20 px, small gaps.
15. **No ink status pills** ("Handwriting, N marks, open the Ink tab" and "Ink is shown in Read view") in the writing area, in any mode.

## 3. Sketch details I read, to confirm on screenshots

1. Home, group 1 (Clipboard): Paste, Cut, Copy, Format painter, Select; the sketch shows six slots.
2. Home, Font group: Bold, Italic, Underline, Strikethrough, Highlight, then a `...` box with Code, Clear formatting and one more.
3. Home, Align group: four alignments and the pilcrow toggle, then a `...` box with Text direction and Indent. The tall Paragraph style picker (Paragraph, Headline 1, Headline 2, scrolling list) sits next to it.
4. Tags and the Focus button are not in the sketch. Assumption: tag chips stay in the breadcrumb row after the title (small, hidden when the note has no tags, with a small `+`), and the Focus button stays right of the moon.

## 4. Not part of this work

The editor engine (it stays a plain textarea), the ink layer, storage, and translations beyond the keys a task needs.
