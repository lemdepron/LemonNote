# Bookmarks, Figures, and Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three new note features — Bookmarks (named anchors with menu), Figures (captioned images with auto-numbering), and Charts (SVG charts from table data) — all working in the existing Markdown pipeline.

**Architecture:** Pure markdown/HTML additions that work with the existing `react-markdown` + `rehype-sanitize` pipeline. Bookmarks use `<span id="bm-name">` with sanitized `id` attribute. Figures use `<figure><figcaption>` blocks with CSS-counter numbering. Charts use fenced `chart` code blocks that reference tables by index, parsed and rendered as SVG in the reader. No new dependencies.

**Tech Stack:** React 18, Vite 8, plain JavaScript (`.jsx`/`.js`), `react-markdown`, `remark-gfm`, `rehype-raw`, `rehype-sanitize`, Tailwind 3.

**Spec:** User request in conversation (bookmarks, figures, charts).

## Global Constraints

- All data goes through `src/api/localDb.js` — no direct IndexedDB access
- Do not rename internal names: `notecraft:prefs`, `notecraft:user`, IndexedDB name `notecraft`, CSS classes `nb-*`, theme preset ids
- No logins, no network calls (local-first)
- UI components in `src/components/ui/` are hand-written shadcn-style
- Keep changes small and focused; touch only files the task needs
- No new dependencies unless the task needs them
- Windows 11 laptop first, iPhone second
- Run `npx eslint src --quiet` and `npm run build` after changes

## Review Focus

1. **XSS via bookmark names** — user-entered bookmark names become `id` attributes; must sanitize to valid HTML ID characters only
2. **Figure numbering gaps** — deleting a figure must renumber remaining figures in the reader without remounting
3. **Chart table reference out of bounds** — `table: N` where N >= number of tables in note; must render fallback gracefully
4. **Chart malformed config** — invalid JSON in chart fence; must show error message in reader, not crash
5. **Bookmark link scroll failure** — `[[Note#bookmark]]` where bookmark doesn't exist; must not throw, scroll to top of note

---

### Task 1: Sanitize Schema Update for Bookmarks

**Files:**
- Modify: `src/lib/text-style.js:118-129` (SANITIZE_SCHEMA)

**Interfaces:**
- Produces: `span` element allowed to have `id` attribute (for bookmarks)

- [ ] **Step 1: Add `id` to span attributes in SANITIZE_SCHEMA**

```javascript
// In SANITIZE_SCHEMA.attributes.span, add "id" to the array
span: ["dataF", "dataC", "dataS", "dataSc", "dataLs", "id"],
```

- [ ] **Step 2: Verify lint and build pass**

Run: `npx eslint src --quiet && npm run build`
Expected: No errors

---

### Task 2: Bookmark Insertion Logic

**Files:**
- Modify: `src/lib/format-actions.js` (add `insertBookmark` function)
- Test: Create `test/bookmark.test.js` (Node script with fake DOM)

**Interfaces:**
- Consumes: `selection` object `{ value, start, end }`
- Produces: Edit object `{ next, start, end, text, caret, select }` inserting `<span id="bm-name"></span>`

- [ ] **Step 1: Write failing test**

```javascript
// test/bookmark.test.js
const { insertBookmark } = require('../src/lib/format-actions.js');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

const selection = { value: 'Hello world', start: 5, end: 5 };
const result = insertBookmark(selection, 'my-bookmark');
console.assert(result !== null, 'should return edit');
console.assert(result.text.includes('id="bm-my-bookmark"'), 'should have bm- prefix');
console.log('Test passed');
```

Run: `node test/bookmark.test.js`
Expected: FAIL (function not defined)

- [ ] **Step 2: Implement `insertBookmark(selection, name)` in `src/lib/format-actions.js`**

```javascript
export function insertBookmark(selection, name) {
  const { value, start, end } = selection;
  const safeName = String(name).replace(/[^a-zA-Z0-9_-]/g, '-').replace(/^-+|-+$/g, '');
  if (!safeName) return null;
  const id = `bm-${safeName}`;
  const text = `<span id="${id}"></span>`;
  return make(value, start, end, text, start + text.length);
}
```

- [ ] **Step 3: Run test to verify it passes**

Run: `node test/bookmark.test.js`
Expected: PASS

---

### Task 3: Bookmark Menu Component (Insert Tab)

**Files:**
- Modify: `src/components/ribbon/tabs/InsertTab.jsx` (add Bookmark button + Bookmarks menu)
- Test: Manual browser test

**Interfaces:**
- Consumes: `useRibbon()` context (`selection`, `run`), note `body`
- Produces: UI for inserting bookmarks and listing existing bookmarks in current note

- [ ] **Step 1: Add Bookmark button in "Links" RibbonGroup**

Add after `insert.tag`:
```jsx
<Btn id="insert.bookmark" icon={Bookmark} label="Bookmark" hint="Insert a named anchor at the cursor" onClick={handleInsertBookmark} />
```

- [ ] **Step 2: Add Bookmarks menu in a new "Bookmarks" RibbonGroup**

Parse `body` for `<span id="bm-...">`, show list with jump-to links

- [ ] **Step 3: Verify lint and build pass**

Run: `npx eslint src --quiet && npm run build`
Expected: No errors

---

### Task 4: Wiki-link Anchor Support (Navigation + Scroll)

**Files:**
- Modify: `src/lib/vault.js` (update `preprocessMarkdown` and `extractWikiLinks`)
- Modify: `src/components/vault/MarkdownView.jsx` (handle anchor scroll on mount)

**Interfaces:**
- Consumes: Wiki-link `[[Title#anchor]]` in markdown
- Produces: Link with `href="/note/id#anchor"` + auto-scroll on reader mount

- [ ] **Step 1: Update `preprocessMarkdown` to preserve `#anchor` in wiki-links**

```javascript
// In preprocessMarkdown, change the wiki-link replacement to keep #anchor
return `[${clean}](${NOTE_LINK_PREFIX}${encodeTitle(clean)})`; // already works if clean includes #anchor
```

- [ ] **Step 2: Add scroll-to-anchor effect in MarkdownView**

```javascript
useEffect(() => {
  const hash = window.location.hash;
  if (hash) {
    const id = hash.slice(1);
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth' });
  }
}, [body, linkIndex, onOpenNote, onCreateNote]);
```

- [ ] **Step 3: Verify lint and build pass**

Run: `npx eslint src --quiet && npm run build`
Expected: No errors

---

### Task 5: Figure Insertion Logic

**Files:**
- Modify: `src/lib/format-actions.js` (add `insertFigure` function)
- Test: `test/figure.test.js`

**Interfaces:**
- Consumes: `selection`, `imageUrl`, `caption`
- Produces: Edit inserting `<figure><img src="..." alt="..."><figcaption>Figure N: caption</figcaption></figure>`

- [ ] **Step 1: Write failing test**

```javascript
// test/figure.test.js
const { insertFigure } = require('../src/lib/format-actions.js');
const selection = { value: 'Hello world', start: 5, end: 5 };
const result = insertFigure(selection, 'image.png', 'My caption');
console.assert(result !== null, 'should return edit');
console.assert(result.text.includes('<figure>'), 'should have figure');
console.assert(result.text.includes('<figcaption>'), 'should have figcaption');
console.log('Test passed');
```

- [ ] **Step 2: Implement `insertFigure(selection, src, caption)`**

```javascript
export function insertFigure(selection, src, caption) {
  const { value, start, end } = selection;
  const alt = caption || 'Figure';
  const text = `<figure>\n<img src="${src}" alt="${alt}">\n<figcaption>Figure ${caption ? '' : ''}${caption}</figcaption>\n</figure>\n\n`;
  return make(value, start, end, text, start + text.length);
}
```

- [ ] **Step 3: Run test to verify it passes**

Run: `node test/figure.test.js`
Expected: PASS

---

### Task 6: Figure Component in Insert Tab

**Files:**
- Modify: `src/components/ribbon/tabs/InsertTab.jsx` (add Figure button with dialog)
- Test: Manual browser test

**Interfaces:**
- Consumes: `onPickImage` prop, `selection`, `run`
- Produces: Figure dialog → inserts figure markdown

- [ ] **Step 1: Add Figure button in "Pictures" RibbonGroup**

```jsx
<Btn id="insert.figure" icon={ImagePlus} label="Figure" hint="Insert an image with a caption" onClick={handleInsertFigure} />
```

- [ ] **Step 2: Add Figure dialog component (reuse UrlMenu pattern)**

Prompt for caption, use existing `onPickImage` for image selection

- [ ] **Step 3: Verify lint and build pass**

Run: `npx eslint src --quiet && npm run build`
Expected: No errors

---

### Task 7: Figure Numbering in Reader (CSS Counters)

**Files:**
- Modify: `src/components/vault/MarkdownView.jsx` (add CSS counter styles)
- Test: Manual browser test

**Interfaces:**
- Consumes: `<figure><figcaption>` elements in rendered markdown
- Produces: Auto-numbered "Figure N: caption" display

- [ ] **Step 1: Add CSS counter styles to MarkdownView wrapper**

```javascript
const figureStyle = {
  counterReset: 'figure',
};
// On figcaption: counterIncrement + ::before content
```

- [ ] **Step 2: Apply styles via components.figcaption**

```javascript
figcaption({ children, ...props }) {
  return (
    <figcaption style={{ counterIncrement: 'figure' }}>
      <span style={{ display: 'inline-block' }}>Figure </span>
      {children}
    </figcaption>
  );
}
```

- [ ] **Step 3: Verify lint and build pass**

Run: `npx eslint src --quiet && npm run build`
Expected: No errors

---

### Task 8: Chart Configuration Parser

**Files:**
- Create: `src/lib/charts.js` (pure SVG chart renderer)
- Test: `test/charts.test.js` (Node script)

**Interfaces:**
- Consumes: `config` object `{ type: 'bar'|'line'|'pie', table: number, title?: string }`, `tableData` array of arrays
- Produces: SVG string

- [ ] **Step 1: Write failing tests for each chart type**

```javascript
// test/charts.test.js
const { renderChart } = require('../src/lib/charts.js');
const table = [['Month', 'Sales'], ['Jan', 10], ['Feb', 20]];
console.assert(renderChart({ type: 'bar', table: 0 }, table).includes('<svg'), 'bar chart renders SVG');
console.assert(renderChart({ type: 'line', table: 0 }, table).includes('<svg'), 'line chart renders SVG');
console.assert(renderChart({ type: 'pie', table: 0 }, table).includes('<svg'), 'pie chart renders SVG');
console.log('All chart tests passed');
```

- [ ] **Step 2: Implement `renderChart(config, tableData)` in `src/lib/charts.js`**

Pure SVG implementation:
- Bar: rectangles with height proportional to value
- Line: path with points connected by lines
- Pie: circle sectors with angles proportional to values
- Light/dark theme via CSS variables (`currentColor`, `var(--chart-grid)`, etc.)

- [ ] **Step 3: Run tests to verify they pass**

Run: `node test/charts.test.js`
Expected: PASS

---

### Task 9: Chart Insertion Logic

**Files:**
- Modify: `src/lib/format-actions.js` (add `insertChart` function)
- Test: `test/chart-insert.test.js`

**Interfaces:**
- Consumes: `selection`, `config` object
- Produces: Edit inserting fenced chart block

- [ ] **Step 1: Write failing test**

```javascript
// test/chart-insert.test.js
const { insertChart } = require('../src/lib/format-actions.js');
const selection = { value: 'Hello', start: 5, end: 5 };
const result = insertChart(selection, { type: 'bar', table: 0 });
console.assert(result !== null, 'should return edit');
console.assert(result.text.includes('```chart'), 'should have chart fence');
console.log('Test passed');
```

- [ ] **Step 2: Implement `insertChart(selection, config)`**

```javascript
export function insertChart(selection, config) {
  const { value, start, end } = selection;
  const json = JSON.stringify(config, null, 2);
  const text = `\n\`\`\`chart\n${json}\n\`\`\`\n\n`;
  return make(value, start, end, text, start + text.length);
}
```

- [ ] **Step 3: Run test to verify it passes**

Run: `node test/chart-insert.test.js`
Expected: PASS

---

### Task 10: Chart Component in Insert Tab

**Files:**
- Modify: `src/components/ribbon/tabs/InsertTab.jsx` (add Chart button, enabled when in table)
- Test: Manual browser test

**Interfaces:**
- Consumes: `selection`, `run`, `value` (to detect table at cursor), `body` (to find tables)
- Produces: Chart config dialog → inserts chart fence

- [ ] **Step 1: Add Chart button in "Blocks" RibbonGroup (or new group)**

Enabled only when `tableAt(value, selection.start)` returns truthy

- [ ] **Step 2: Add Chart config dialog**

Dropdown for type (bar/line/pie), table index selector (shows preview of tables in note), title input

- [ ] **Step 3: Verify lint and build pass**

Run: `npx eslint src --quiet && npm run build`
Expected: No errors

---

### Task 11: Chart Rendering in MarkdownView

**Files:**
- Modify: `src/components/vault/MarkdownView.jsx` (add `components.code` for `chart` language)
- Test: Manual browser test

**Interfaces:**
- Consumes: Fenced `chart` code block with JSON config
- Produces: SVG chart rendered in place of code block

- [ ] **Step 1: Add chart code block handler**

```javascript
code({ children, className, ...props }) {
  const lang = className?.replace(/^language-/, '');
  if (lang === 'chart') {
    try {
      const config = JSON.parse(children);
      // Extract tables from the note body (passed via context or props)
      const tableData = extractTable(config.table); // need access to parsed tables
      return <div dangerouslySetInnerHTML={{ __html: renderChart(config, tableData) }} />;
    } catch {
      return <pre className="chart-error">Invalid chart config</pre>;
    }
  }
  return <code className={className}>{children}</code>;
}
```

- [ ] **Step 2: Extract tables from markdown body for chart reference**

Parse markdown for GFM tables before ReactMarkdown renders, store in context

- [ ] **Step 3: Verify lint and build pass**

Run: `npx eslint src --quiet && npm run build`
Expected: No errors

---

### Task 12: Integration Testing & Polish

**Files:**
- Test: Manual browser test at `http://localhost:5173`
- Verify: `npx eslint src --quiet && npm run build`

**Checklist:**
- [ ] Bookmark: Insert → appears in menu → click jumps to location
- [ ] Bookmark: `[[Note#bookmark]]` links work and scroll
- [ ] Figure: Insert image + caption → renders with "Figure N:" numbering
- [ ] Figure: Multiple figures number sequentially; deletion renumbers
- [ ] Chart: Insert in table → config dialog → renders SVG chart
- [ ] Chart: Bar, line, pie all render correctly
- [ ] Chart: Light/dark themes work
- [ ] Old notes (without new features) still open correctly
- [ ] ESLint and build pass with no errors

---

## Execution Order

Tasks 1-4 (Bookmarks) → Tasks 5-7 (Figures) → Tasks 8-11 (Charts) → Task 12 (Integration)

Each task group can be worked independently after Task 1 (sanitize schema).