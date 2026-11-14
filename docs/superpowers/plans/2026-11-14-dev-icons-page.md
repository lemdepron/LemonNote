# Dev Icons Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the Dev Icons page at `/dev/icons` to show every ribbon button from all tabs (including Ink sub-tabs, Table, Code) with tab, group, button id, icon name, tooltip, popover flag, icons at 16px/24px in current theme, warnings for duplicate icons in same tab and missing icon/label, and a plain-text copy box.

**Architecture:** The page currently has a hardcoded `ALL_BUTTONS` array. I will replace it with accurate data extracted from the actual tab component files. The page will use the existing Lucide icons via dynamic import, render them at two sizes with theme colors, group by tab with a filter, and provide a read-only text area with the full list.

**Tech Stack:** React 18, Vite, Tailwind 3, lucide-react icons, existing RibbonKit components

**Spec:** AGENTS.md task requirements

## Global Constraints

- Do NOT change any icon or colour in this task
- Do not add dependencies
- Strings on this dev page may be English only
- Page is for development: do not show it in the rail or any menu
- All data must match actual tab implementations

## Review Focus

1. Buttons missing from the list that exist in actual tab files
2. Buttons in the list that no longer exist in tab files
3. Icons not rendering at both 16px and 24px
4. Theme colors not applied to icons (should use current theme tokens)
5. Warning logic incorrect for duplicate icons in same tab or missing icon/label
6. Plain-text copy box not read-only or missing

---

### Task 1: Extract accurate button data from all tab files

**Files:**
- Modify: `src/pages/DevIconsPage.jsx`

**Interfaces:**
- Consumes: Current `ALL_BUTTONS` array, tab component files
- Produces: Updated `ALL_BUTTONS` array with all buttons from Home, Insert, Design, Layout, View, Share, Ink (main + 6 sub-tabs), Table, Code

- [ ] **Step 1.1: Analyze each tab file and build complete button inventory**

Extract from each tab file:
- HomeTab.jsx: Clipboard, Font, Lists, Align, Lines, Typography, Tasks, AI, Search, NoteType groups
- InsertTab.jsx: Pictures, Media, Links, Bookmarks, Blocks, Symbols, CodeBlock, Table, Shapes, Stickers, TextNotes, TimeCalendar, Cards
- DesignTab.jsx: PageStyle, StyleSets, Themes, ParagraphSpacing, PageAppearance, PageTitleStyle, Language, Defaults
- LayoutTab.jsx: PageSetup, Columns, Editor, Paragraph, FloatingObjects
- ViewTab.jsx: Views, NavigationPane, Zoom, PageDisplay, ScrollMode, ReadingPage, Editor, Statistics, Accessibility, Attach, Table
- ShareTab.jsx: CopyNote, ExportNote, SharePrint, Vault
- InkTabs.jsx: Main Ink tab (Start inking, Attach old), then 6 sub-tabs: Draw, Color, Select, Paper, Smart ink, Audio
- TableContextTab.jsx: Insert, TableTools, Arrange, Data, Convert, Export
- CodeContextTab.jsx: BlockTools, EditLines, JSON

- [ ] **Step 1.2: Build accurate ALL_BUTTONS array with required fields**

Each entry needs: `id`, `tab`, `group`, `icon` (Lucide name or "text"/"letters"), `label`, `hint`, `hasPopover` (boolean)

---

### Task 2: Add icon rendering at 16px and 24px with theme colors

**Files:**
- Modify: `src/pages/DevIconsPage.jsx`

- [ ] **Step 2.1: Create icon display component**

Use dynamic import from `lucide-react` to render icons. Use `currentColor` so they inherit theme text color.

- [ ] **Step 2.2: Show icons at both sizes in the table/list**

Display each button with 16px and 24px versions side by side.

---

### Task 3: Add grouping by tab with filter

**Files:**
- Modify: `src/pages/DevIconsPage.jsx`

- [ ] **Step 3.1: Add tab filter UI**

Dropdown or button group to filter by tab name.

- [ ] **Step 3.2: Group display by tab**

Show buttons grouped under their tab heading.

---

### Task 4: Add warning marks for duplicate icons in same tab and missing icon/label

**Files:**
- Modify: `src/pages/DevIconsPage.jsx`

- [ ] **Step 4.1: Detect duplicate icons within same tab**

For each tab, check if any icon (by Lucide name) is used by 2+ buttons with different actions (different id/label).

- [ ] **Step 4.2: Detect buttons with no icon AND no text label**

Flag buttons where icon is "text"/"letters" and label is empty/missing.

- [ ] **Step 4.3: Display warnings inline**

Show warning icon/badge next to affected buttons.

---

### Task 5: Add plain-text read-only copy box

**Files:**
- Modify: `src/pages/DevIconsPage.jsx`

- [ ] **Step 5.1: Generate plain-text representation**

Format: Tab > Group > ID | Icon | Label | Hint | Popover

- [ ] **Step 5.2: Add read-only textarea with copy button**

Large text area showing full list, with a "Copy" button.

---

### Task 6: Verify and test

**Files:**
- Modify: `src/pages/DevIconsPage.jsx`

- [ ] **Step 6.1: Run dev server and verify page loads**

Run `npm run dev`, navigate to `/dev/icons`

- [ ] **Step 6.2: Count buttons per tab and warnings**

Report exact counts in final output.

- [ ] **Step 6.3: Run lint and build checks**

```bash
npx eslint src --quiet
npm run build
node scripts/i18n-check.mjs
npm ci --dry-run
```