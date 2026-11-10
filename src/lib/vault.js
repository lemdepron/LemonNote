export const NOTE_LINK_PREFIX = "/notecraft/";

export const escapeRegExp = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const titleKey = (title = "") => title.trim().toLowerCase();

/**
 * Check if a note is encrypted (locked).
 * @param {Object} note - Note object
 * @returns {boolean} - True if note is encrypted
 */
export function isNoteLocked(note) {
  return note?.is_encrypted === true;
}

/**
 * Filter out locked notes from an array.
 * @param {Array} notes - Array of notes
 * @returns {Array} - Notes with locked ones removed
 */
export function filterLockedNotes(notes = []) {
  return notes.filter((note) => !isNoteLocked(note));
}

/* ---------- wiki links ---------- */

export function extractWikiLinks(markdown = "") {
  const found = [];
  const re = /\[\[([^\[\]]+)\]\]/g;
  let match;
  while ((match = re.exec(markdown)) !== null) {
    const title = match[1].trim();
    if (title && !found.some((t) => titleKey(t) === titleKey(title))) found.push(title);
  }
  return found;
}

export function buildLinkIndex(notes = []) {
  const index = new Map();
  notes.forEach((note) => {
    if (!note?.title) return;
    if (isNoteLocked(note)) return; // Skip locked notes
    index.set(titleKey(note.title), note);
  });
  return index;
}

export function noteLinks(note) {
  if (isNoteLocked(note)) return [];
  return extractWikiLinks(note?.body || "");
}

export function backlinksFor(note, notes = []) {
  if (!note?.title) return [];
  const key = titleKey(note.title);
  return notes.filter(
    (other) =>
      !isNoteLocked(other) && // Skip locked notes
      other.id !== note.id &&
      extractWikiLinks(other.body || "").some((title) => titleKey(title) === key)
  );
}

/* ---------- tags ---------- */

export function extractInlineTags(markdown = "") {
  const tags = [];
  const re = /(^|[\s(])#([A-Za-z0-9_][A-Za-z0-9_/-]*)/g;
  let match;
  while ((match = re.exec(markdown)) !== null) {
    const tag = match[2].replace(/[-/]+$/, "").toLowerCase();
    if (tag && !tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

export function noteTags(note) {
  if (isNoteLocked(note)) return [];
  const explicit = Array.isArray(note?.tags) ? note.tags : [];
  return [...new Set([...explicit, ...extractInlineTags(note?.body || "")].map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
}

export function collectTags(notes = []) {
  const counts = new Map();
  notes.forEach((note) => {
    if (isNoteLocked(note)) return;
    noteTags(note).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
  });
  return [...counts.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/* ---------- search / text ---------- */

export function plainText(markdown = "") {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ---------- headings ---------- */

export function extractHeadings(markdown = "") {
  const lines = String(markdown || "").split("\n");
  const headings = [];
  let fence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (fence) continue;
    const m = /^(#{1,6})\s+(.+?)\s*#*$/.exec(line);
    if (m) {
      const level = m[1].length;
      const text = m[2].trim();
      // Generate an ID from the text for anchor linking
      const id = text.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "");
      headings.push({ level, text, id, line: i });
    }
  }
  return headings;
}

export function snippet(markdown = "", query = "", length = 180) {
  const text = plainText(markdown);
  if (!text) return "";
  if (!query) return text.length > length ? `${text.slice(0, length)}…` : text;
  const at = text.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0) return text.length > length ? `${text.slice(0, length)}…` : text;
  const start = Math.max(0, at - 60);
  const end = Math.min(text.length, start + length);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

export function highlightParts(text = "", query = "") {
  if (!query) return [{ text, match: false }];
  return text
    .split(new RegExp(`(${escapeRegExp(query)})`, "ig"))
    .filter((part) => part !== "")
    .map((part) => ({ text: part, match: part.toLowerCase() === query.toLowerCase() }));
}

export function relativeTime(value) {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(then).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ---------- folders ---------- */

export function noteFolder(note) {
  return note?.folder || "";
}

export function collectFolders(notes = []) {
  const counts = new Map();
  notes.forEach((note) => {
    const folder = noteFolder(note);
    counts.set(folder, (counts.get(folder) || 0) + 1);
  });
  // Sort: "Unfiled" (empty string) first, then alphabetically
  return [...counts.entries()]
    .map(([folder, count]) => ({ folder, count }))
    .sort((a, b) => {
      if (a.folder === "") return -1;
      if (b.folder === "") return 1;
      return a.folder.localeCompare(b.folder);
    });
}

export function getNotesInFolder(notes = [], folder) {
  if (!folder) {
    return notes.filter((note) => !noteFolder(note));
  }
  return notes.filter((note) => noteFolder(note) === folder);
}

export function getFolderPathParts(folder) {
  if (!folder) return [];
  return folder.split("/").filter(Boolean);
}

export function buildFolderTree(folders) {
  const root = { name: "", children: new Map(), count: 0, fullPath: "" };
  
  folders.forEach(({ folder, count }) => {
    const parts = getFolderPathParts(folder);
    let current = root;
    let currentPath = "";
    
    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (!current.children.has(part)) {
        current.children.set(part, { name: part, children: new Map(), count: 0, fullPath: currentPath });
      }
      current = current.children.get(part);
    });
    current.count = count;
  });
  
  // Calculate parent counts from children
  const calculateCounts = (node) => {
    let total = node.count;
    for (const child of node.children.values()) {
      total += calculateCounts(child);
    }
    node.count = total;
    return total;
  };
  
  calculateCounts(root);
  
  return root;
}

export function flattenFolderTree(node, level = 0) {
  const result = [];
  if (node.name !== "") {
    result.push({ ...node, level });
  }
  for (const child of node.children.values()) {
    result.push(...flattenFolderTree(child, level + 1));
  }
  return result;
}

/* ---------- recent edits ---------- */

export const RECENT_FILTERS = [
  { id: "today", label: "Today", days: 1 },
  { id: "week", label: "7 days", days: 7 },
  { id: "month", label: "30 days", days: 30 },
];

export function filterNotesByRecent(notes = [], filterId) {
  if (!filterId || filterId === "all") return notes;
  
  const filter = RECENT_FILTERS.find((f) => f.id === filterId);
  if (!filter) return notes;
  
  const cutoff = new Date(Date.now() - filter.days * 24 * 60 * 60 * 1000).toISOString();
  return notes.filter((note) => note.updated_date && note.updated_date >= cutoff);
}

/* ---------- markdown preparation ---------- */

const encodeTitle = (title) =>
  encodeURIComponent(title).replace(/[()!'*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

export function preprocessMarkdown(markdown = "") {
  let inFence = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      return line
        .split(/(`[^`]*`)/g)
        .map((segment, i) => {
          if (i % 2 === 1) return segment;
          let out = segment.replace(/\[\[([^\[\]]+)\]\]/g, (_, title) => {
            const clean = title.trim();
            return `[${clean}](${NOTE_LINK_PREFIX}${encodeTitle(clean)})`;
          });
          out = out.replace(/^(\s*[-*+]\s+)\[ \]\s+/, "$1\u2610 ");
          out = out.replace(/^(\s*[-*+]\s+)\[[xX]\]\s+/, "$1\u2611 ");
          return out;
        })
        .join("");
    })
    .join("\n");
}

/* ---------- starter vault ---------- */

export const STARTER_NOTES = [
  {
    title: "Welcome to LemonNote",
    tags: ["meta", "start-here"],
    body: `LemonNote is a **local-first knowledge workspace**. Every note you write here is a plain markdown document — no proprietary blocks, no database lock-in. This vault is yours alone.

The whole point is that notes should behave like a network, not a filing cabinet.

## Start with three habits

- **Link generously.** Typing \`[[\` anywhere in a note opens the link picker. Link to a note that doesn't exist yet and LemonNote offers to create it.
- **Tag lightly.** One or two \`#tags\` per note is plenty. See [[Tags and search]].
- **Read the backlinks.** Every note shows what points at it, so the graph grows in both directions.

## Where to go next

1. [[Getting started]] — the three-minute tour
2. [[Linking notes]] — how wiki-links and backlinks work
3. [[Markdown cheat sheet]] — everything the editor understands
4. [[Vault philosophy]] — why files beat features

> The vault is flat on purpose. Search, tags and links are the only organisation you need.`,
  },
  {
    title: "Getting started",
    tags: ["basics", "start-here"],
    body: `Three minutes and you'll know all of LemonNote. It has no folders to build, no settings to configure.

## 1. Search first

The fastest route to any idea is the search bar. It looks through titles and full note bodies as you type. Try searching for \`backlinks\`.

## 2. Write in markdown

The editor shows raw markdown beside a live preview. Use the Write / Split / Read switch at the top right. Everything on [[Markdown cheat sheet]] renders.

## 3. Connect

Wrap a note title in double brackets to link it: [[Welcome to LemonNote]]. Open that note and you'll find this one listed in its backlinks.

## 4. Capture the daily thought

Press the **New note** button, even for half a sentence. A note that exists can be linked; a thought in your head cannot. #basics

## 5. Turn lines into tasks

Start a list line with \`TODO\`, \`DOING\` or \`DONE\` and it collects under **Tasks** in the navigation, where clicking it moves it along the cycle:

- TODO write my first note
- TODO link it to two existing notes
- DOING read the markdown cheat sheet
- DONE open the vault`,
  },
  {
    title: "Linking notes",
    tags: ["basics", "links"],
    body: `Links are the only structure in LemonNote. A link is written as two square brackets around a note title, like [[Getting started]].

## Forward and backward

- **Outgoing links** are the ones in your text. The right rail lists them under *Links out*.
- **Backlinks** are computed, never stored. Open any note and LemonNote scans the rest of the vault for references to it. That means renaming a note's reference is all it takes — nothing to migrate.

## Unresolved links

Link to something that doesn't exist yet, like [[Graph view roadmap]], and the link renders dashed. Clicking it creates the note with that title, so you can write into the gap immediately.

## Linking blocks

Because a note is just text, linking a section is as simple as writing the title with an anchor: [[Tags and search]] #links

Related: [[Welcome to LemonNote]]`,
  },
  {
    title: "Tags and search",
    tags: ["basics", "search"],
    body: `Tags are cheap, flat and instant. Write \`#basics\` inline anywhere, or add tags to the note's tag row at the top of the editor. Both are merged into the same list.

## Two kinds of finding

- **Search** answers "where did I write about this?" — it reads every title and body.
- **Tags** answer "show me everything in this theme" — a single click from the vault home.

The vault home counts each tag, so you can see which themes your thinking actually concentrates in.

#basics #search

See also: [[Linking notes]]`,
  },
  {
    title: "Markdown cheat sheet",
    tags: ["reference"],
    body: `# Headings

## Second level
### Third level

**Bold**, *italic*, \`inline code\`, and [external links](https://commonmark.org).

- Bullet lists
- Nested items
  - like this

1. Numbered lists
2. Work too

- [x] Checkbox done
- [ ] Checkbox open

> Quotes are styled with a quiet rule on the left.

\`\`\`rust
fn main() {
    println!("LemonNote vault: plain text, forever");
}
\`\`\`

| Element | Supported |
| --- | --- |
| Wiki-links | yes |
| Checkboxes | yes |
| Code fences | yes |

Back to [[Getting started]].`,
  },
  {
    title: "Vault philosophy",
    tags: ["philosophy"],
    body: `Software outlives itself. Notes should not.

## Files are the contract

Every note is a markdown file on disk. Metadata — tags, links, editor state — lives in sidecar files next to it. The index is disposable: delete it and rebuild, and nothing is lost. That is the difference between owning your notes and renting them.

## Local-first by default

Offline is the normal state, not an error state. Sync is optional, end-to-end encrypted, and works over whatever you already pay for — a cloud folder, a Git remote, a USB stick.

## The graph is the product

A note is not valuable on its own. Its value is the edge it adds between two ideas. That is why [[Linking notes]] is the most important note in this vault, and why [[Welcome to LemonNote]] stays short.

#philosophy`,
  },
  {
    title: "Graph view roadmap",
    tags: ["roadmap"],
    body: `Planned for the desktop build, kept honest here as a placeholder note.

- [x] Backlinks panel on every note
- [x] Unresolved links create notes inline
- [ ] Local graph around the open note
- [ ] Force-directed vault graph with tag clusters
- [ ] Block-level transclusion

Links out: [[Linking notes]] · [[Welcome to LemonNote]]

#roadmap`,
  },
  {
    title: "Keyboard shortcuts",
    tags: ["reference"],
    body: `| Action | Shortcut |
| --- | --- |
| Search the vault | ⌘K / Ctrl K |
| New note | ⌘⇧N |
| Link picker | type \`[[\` |
| Toggle preview | ⌘E |

The editor autosaves. There is no save button to forget.

#reference · [[Getting started]]`,
  },
];