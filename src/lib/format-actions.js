/**
 * Pure text edits behind the ribbon tabs. Each helper takes the editor
 * selection { value, start, end } and returns an edit the editor bridge can apply:
 *   { next, start, end, text, caret, select? }
 * `start..end` is the smallest region replaced by `text`; `select` ([from, to])
 * keeps the result highlighted so the next ribbon click can build on it.
 */

const lineStart = (value, index) => {
  const at = value.lastIndexOf("\n", index - 1);
  return at === -1 ? 0 : at + 1;
};
const lineEnd = (value, index) => {
  const at = value.indexOf("\n", index);
  return at === -1 ? value.length : at;
};

function make(value, start, end, text, caret, select) {
  return { next: `${value.slice(0, start)}${text}${value.slice(end)}`, start, end, text, caret, select };
}

/** Whole-line region covered by the selection (a trailing newline is not included). */
export function lineRange(selection) {
  const { value, start, end } = selection;
  const from = lineStart(value, start);
  const to = lineEnd(value, end > start && value[end - 1] === "\n" ? end - 1 : end);
  return { from, to, text: value.slice(from, to) };
}

/** Replaces the covered lines with a transformed list of lines. */
export function mapLines(selection, transform) {
  const { value } = selection;
  const { from, to, text } = lineRange(selection);
  const lines = text.split("\n");
  const out = transform(lines);
  if (!out) return null;
  const joined = out.join("\n");
  return make(value, from, to, joined, from + joined.length, [from, from + joined.length]);
}

/* ------------------------------ inline marks ------------------------------ */

/** Wraps the selection in `open`/`close`, or removes them when already there. */
export function toggleWrap(selection, open, close = open) {
  const { value, start, end } = selection;
  const text = value.slice(start, end);

  // Markers inside the selection.
  if (text.length >= open.length + close.length && text.startsWith(open) && text.endsWith(close)) {
    const inner = text.slice(open.length, text.length - close.length);
    return make(value, start, end, inner, start + inner.length, [start, start + inner.length]);
  }
  // Markers just outside the selection.
  if (value.slice(start - open.length, start) === open && value.slice(end, end + close.length) === close && end > start) {
    return make(value, start - open.length, end + close.length, text, start - open.length + text.length, [
      start - open.length,
      start - open.length + text.length,
    ]);
  }
  const wrapped = `${open}${text}${close}`;
  if (!text) return make(value, start, end, wrapped, start + open.length);
  return make(value, start, end, wrapped, start + wrapped.length, [start + open.length, start + open.length + text.length]);
}

/** *italic* must not mistake the stars of **bold** for its own. */
export function toggleItalic(selection) {
  const { value, start, end } = selection;
  const text = value.slice(start, end);
  if (!text || /^\*+$/.test(text)) return toggleWrap(selection, "*");

  // Stars inside the selection: an odd run (1 or 3) on both sides means italic is on.
  const lead = (/^\*+/.exec(text) || [""])[0].length;
  const trail = (/\*+$/.exec(text) || [""])[0].length;
  if (lead && trail && Math.min(lead, trail) % 2 === 1) {
    const inner = text.slice(1, text.length - 1);
    return make(value, start, end, inner, start + inner.length, [start, start + inner.length]);
  }

  // Stars just outside the selection.
  const before = (/\*+$/.exec(value.slice(0, start)) || [""])[0].length;
  const after = (/^\*+/.exec(value.slice(end)) || [""])[0].length;
  if (Math.min(before, after) % 2 === 1) {
    return make(value, start - 1, end + 1, text, start - 1 + text.length, [start - 1, start - 1 + text.length]);
  }
  const wrapped = `*${text}*`;
  return make(value, start, end, wrapped, start + wrapped.length, [start + 1, start + 1 + text.length]);
}

/**
 * Sets one data-attribute on a tag around the selection:
 * `<span data-c="red">text</span>`. Picking the same value again removes it,
 * another value replaces it.
 */
export function applyAttr(selection, tag, attr, value) {
  const { value: doc, start, end } = selection;
  const text = doc.slice(start, end);
  const open = (val) => (val === null || val === true ? `<${tag} data-${attr}>` : `<${tag} data-${attr}="${val}">`);
  const close = `</${tag}>`;
  const pattern = new RegExp(`^<${tag} data-${attr}(?:="([^"]*)")?>([\\s\\S]*)</${tag}>$`);

  const inside = pattern.exec(text);
  if (inside) {
    const same = value === null ? true : inside[1] === String(value);
    const inner = inside[2];
    const out = same ? inner : `${open(value)}${inner}${close}`;
    return make(doc, start, end, out, start + out.length, [start, start + out.length]);
  }

  const before = new RegExp(`<${tag} data-${attr}(?:="([^"]*)")?>$`).exec(doc.slice(0, start));
  if (before && doc.slice(end, end + close.length) === close && end > start) {
    const from = start - before[0].length;
    const same = value === null ? true : before[1] === String(value);
    const out = same ? text : `${open(value)}${text}${close}`;
    return make(doc, from, end + close.length, out, from + out.length, [from, from + out.length]);
  }

  const wrapped = `${open(value)}${text}${close}`;
  if (!text) return make(doc, start, end, wrapped, start + open(value).length);
  return make(doc, start, end, wrapped, start + wrapped.length, [start + open(value).length, start + open(value).length + text.length]);
}

/** Steps the font size of the selection through the SIZES list. */
export function stepFontSize(selection, direction) {
  const { value, start, end } = selection;
  const text = value.slice(start, end);
  if (!text && start === end) return null;

  // Find the current size in the selection
  const sizeMatch = text.match(/<span[^>]*data-s="(\d+)"[^>]*>([\s\S]*)<\/span>/i);
  let currentSize = null;
  if (sizeMatch) {
    currentSize = parseInt(sizeMatch[1], 10);
  } else {
    // Check just outside the selection
    const before = value.slice(Math.max(0, start - 20), start);
    const after = value.slice(end, Math.min(value.length, end + 20));
    const beforeMatch = before.match(/<span[^>]*data-s="(\d+)"[^>]*>$/i);
    const afterMatch = after.match(/^<\/span>/i);
    if (beforeMatch && afterMatch) {
      currentSize = parseInt(beforeMatch[1], 10);
    }
  }

  // Default to 16 if no size found
  if (!currentSize) currentSize = 16;

  const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];
  let idx = SIZES.indexOf(currentSize);
  if (idx === -1) idx = SIZES.indexOf(16); // fallback to 16 if size not in list
  const nextIdx = Math.max(0, Math.min(SIZES.length - 1, idx + direction));
  const nextSize = SIZES[nextIdx];

  // If at boundary and trying to go beyond, return null (no change)
  if ((direction > 0 && currentSize >= SIZES[SIZES.length - 1]) || 
      (direction < 0 && currentSize <= SIZES[0])) {
    return null;
  }

  return applyAttr(selection, "span", "s", String(nextSize));
}

/** Removes formatting marks and the whitelisted HTML tags from the selection (or the current line). */
export function clearFormatting(selection) {
  const { value, start, end } = selection;
  const from = start === end ? lineStart(value, start) : start;
  const to = start === end ? lineEnd(value, end) : end;
  const text = value.slice(from, to);
  const cleaned = text
    .replace(/<\/?(?:span|mark|u|small|kbd|sub|sup|div|details|summary)\b[^>]*>/g, "")
    .replace(/\*\*\*([^*\n]+)\*\*\*/g, "$1")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1$2")
    .replace(/~~([^~\n]+)~~/g, "$1")
    .replace(/(^|\s)#{1,6}\s+/g, "$1")
    .replace(/^>\s?/gm, "");
  if (cleaned === text) return null;
  return make(value, from, to, cleaned, from + cleaned.length, [from, from + cleaned.length]);
}

/** UPPER / lower / Title / Sentence / tOGGLE on the selection, or the word at the caret. */
export function changeCase(selection, mode) {
  const { value } = selection;
  let { start, end } = selection;
  if (start === end) {
    while (start > 0 && /[\p{L}\p{N}_']/u.test(value[start - 1])) start -= 1;
    while (end < value.length && /[\p{L}\p{N}_']/u.test(value[end])) end += 1;
  }
  const text = value.slice(start, end);
  if (!text) return null;
  const title = (s) => s.toLowerCase().replace(/(^|[\s(["'—-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
  const sentence = (s) => s.toLowerCase().replace(/(^\s*|[.!?؟]\s+)(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
  const toggle = (s) => [...s].map((ch) => (ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase())).join("");
  const map = { upper: (s) => s.toUpperCase(), lower: (s) => s.toLowerCase(), title, sentence, toggle };
  const out = (map[mode] || ((s) => s))(text);
  return make(value, start, end, out, start + out.length, [start, start + out.length]);
}

/* --------------------------------- lines ---------------------------------- */

const LIST_PREFIX = /^(\s*)(?:[-*+]\s+\[[ xX]\]\s+|[-*+]\s+|\d+\.\s+|>\s?)/;
const HEADING_PREFIX = /^(\s*)#{1,6}\s+/;

/** Paragraph / Heading 1–6. Choosing the heading the line already has turns it back to a paragraph. */
export function setHeading(selection, level) {
  return mapLines(selection, (lines) => {
    const filled = lines.filter((line) => line.trim());
    const levelOf = (line) => (/^\s*(#{1,6})\s/.exec(line) || [])[1]?.length || 0;
    const remove = level > 0 && filled.length > 0 && filled.every((line) => levelOf(line) === level);
    return lines.map((line) => {
      if (!line.trim()) return line;
      const bare = line.replace(HEADING_PREFIX, "$1");
      if (level === 0 || remove) return bare;
      return `${"#".repeat(level)} ${bare.trimStart()}`;
    });
  });
}

/** Bullet, numbered, checklist and quote prefixes; applying the same one again removes it. */
export function toggleLinePrefix(selection, kind) {
  return mapLines(selection, (lines) => {
    const filled = lines.filter((line) => line.trim());
    if (!filled.length) {
      const empty = { bullet: "- ", number: "1. ", check: "- [ ] ", quote: "> " }[kind];
      return [`${lines[0] || ""}${empty}`];
    }
    const has = {
      bullet: (l) => /^\s*[-*+]\s+(?!\[[ xX]\])/.test(l),
      number: (l) => /^\s*\d+\.\s+/.test(l),
      check: (l) => /^\s*[-*+]\s+\[[ xX]\]\s+/.test(l),
      quote: (l) => /^\s*>\s?/.test(l),
    }[kind];
    const strip = (l) => l.replace(LIST_PREFIX, "$1");
    if (filled.every(has)) return lines.map((l) => (l.trim() ? strip(l) : l));
    let n = 0;
    return lines.map((l) => {
      if (!l.trim()) return l;
      const bare = strip(l);
      const lead = (/^\s*/.exec(bare) || [""])[0];
      const rest = bare.slice(lead.length);
      n += 1;
      const prefix = { bullet: "- ", number: `${n}. `, check: "- [ ] ", quote: "> " }[kind];
      return `${lead}${prefix}${rest}`;
    });
  });
}

/** One indent level in / out for the covered lines (a 3-space step under numbered items). */
export function shiftIndent(selection, direction) {
  return mapLines(selection, (lines) =>
    lines.map((line) => {
      if (!line.trim()) return line;
      const unit = /^\s*\d+\./.test(line) ? "   " : "  ";
      if (direction > 0) return `${unit}${line}`;
      if (line.startsWith(unit)) return line.slice(unit.length);
      if (line.startsWith("\t")) return line.slice(1);
      return line.replace(/^ {1,2}/, "");
    })
  );
}

/** Sorts, reverses, de-duplicates or cleans the covered lines. */
export function lineTool(selection, tool) {
  return mapLines(selection, (lines) => {
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
    switch (tool) {
      case "sort-asc":
        return [...lines].sort((a, b) => collator.compare(a, b));
      case "sort-desc":
        return [...lines].sort((a, b) => collator.compare(b, a));
      case "reverse":
        return [...lines].reverse();
      case "unique": {
        const seen = new Set();
        return lines.filter((line) => {
          const key = line.trim().toLowerCase();
          if (!key) return true;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }
      case "remove-blank":
        return lines.filter((line) => line.trim());
      case "trim":
        return lines.map((line) => line.replace(/[ \t]+$/, ""));
      case "join":
        return [lines.map((line) => line.trim()).filter(Boolean).join(" ")];
      case "number":
        return lines.map((line, i) => `${i + 1}. ${line.replace(/^\s*\d+\.\s+/, "")}`);
      default:
        return null;
    }
  });
}

/** Duplicates, deletes or moves the line under the caret. */
export function lineMove(selection, action) {
  const { value } = selection;
  const { from, to } = lineRange(selection);
  const block = value.slice(from, to);
  if (action === "duplicate") {
    return make(value, to, to, `\n${block}`, to + 1 + (selection.start - from));
  }
  if (action === "delete") {
    if (to < value.length) return make(value, from, to + 1, "", from);
    if (from > 0) return make(value, from - 1, to, "", from - 1);
    return make(value, from, to, "", from);
  }
  if (action === "up") {
    if (from === 0) return null;
    const prevStart = lineStart(value, from - 1);
    const prev = value.slice(prevStart, from - 1);
    const text = `${block}\n${prev}`;
    return make(value, prevStart, to, text, prevStart + (selection.start - from), [prevStart, prevStart + block.length]);
  }
  if (action === "down") {
    if (to >= value.length) return null;
    const nextEnd = lineEnd(value, to + 1);
    const next = value.slice(to + 1, nextEnd);
    const text = `${next}\n${block}`;
    const begin = from + next.length + 1;
    return make(value, from, nextEnd, text, begin + (selection.start - from), [begin, begin + block.length]);
  }
  return null;
}

/* -------------------------------- blocks ---------------------------------- */

/** Inserts a block on its own lines with a blank line around it. */
export function insertBlock(selection, snippet, caretOffset = snippet.length) {
  const { value, start, end } = selection;
  const lead = start === 0 ? "" : value.slice(Math.max(0, start - 2), start) === "\n\n" ? "" : value[start - 1] === "\n" ? "\n" : "\n\n";
  const tail = value.slice(end, end + 2) === "\n\n" ? "" : value[end] === "\n" ? "\n" : "\n\n";
  const text = `${lead}${snippet}${tail}`;
  return make(value, start, end, text, start + lead.length + caretOffset);
}

/* ------------------------------ format painter ------------------------------ */

/** Extracts all formatting marks from a selection. */
export function readMarks(selection) {
  const { value, start, end } = selection;
  const text = value.slice(start, end);
  if (!text) return null;

  const marks = {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
    highlight: null,
    color: null,
    font: null,
    size: null,
    smallCaps: false,
    subscript: false,
    superscript: false,
    kbd: false,
    link: null,
  };

  // Check for markdown marks inside the selection
  if (text.startsWith("**") && text.endsWith("**") && !text.startsWith("***")) marks.bold = true;
  // Italic: single * on both ends, but not part of ** or ***
  if (text.startsWith("*") && text.endsWith("*") && !text.startsWith("**") && !text.startsWith("***")) marks.italic = true;
  if (text.startsWith("~~") && text.endsWith("~~")) marks.strikethrough = true;
  if (text.startsWith("`") && text.endsWith("`")) marks.code = true;

  // Check for HTML tags with data attributes
  // Pattern: <tag data-attr="value">text</tag>
  const spanMatch = text.match(/^<span((?:\s+data-[a-z-]+="[^"]*")*)>([\s\S]*)<\/span>$/i);
  if (spanMatch) {
    const attrs = spanMatch[1];
    if (attrs.includes('data-f=')) marks.font = attrs.match(/data-f="([^"]*)"/)?.[1] || true;
    if (attrs.includes('data-c=')) marks.color = attrs.match(/data-c="([^"]*)"/)?.[1] || true;
    if (attrs.includes('data-s=')) marks.size = attrs.match(/data-s="([^"]*)"/)?.[1] || true;
    if (attrs.includes('data-sc')) marks.smallCaps = true;
    if (attrs.includes('data-ls=')) marks.letterSpacing = attrs.match(/data-ls="([^"]*)"/)?.[1] || true;
  }

  const markMatch = text.match(/^<mark((?:\s+data-[a-z-]+="[^"]*")*)>([\s\S]*)<\/mark>$/i);
  if (markMatch) {
    const attrs = markMatch[1];
    if (attrs.includes('data-h=')) marks.highlight = attrs.match(/data-h="([^"]*)"/)?.[1] || true;
  }

  if (text.startsWith("<u>") && text.endsWith("</u>")) marks.underline = true;
  if (text.startsWith("<sub>") && text.endsWith("</sub>")) marks.subscript = true;
  if (text.startsWith("<sup>") && text.endsWith("</sup>")) marks.superscript = true;
  if (text.startsWith("<kbd>") && text.endsWith("</kbd>")) marks.kbd = true;

  // Check for link
  const linkMatch = text.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (linkMatch) marks.link = { label: linkMatch[1], url: linkMatch[2] };

  // Also check for marks just outside the selection (common case when cursor is at edge)
  if (!marks.bold) {
    const before = value.slice(Math.max(0, start - 2), start);
    const after = value.slice(end, Math.min(value.length, end + 2));
    if (before === "**" && after === "**") marks.bold = true;
  }
  if (!marks.italic) {
    const before = value.slice(Math.max(0, start - 1), start);
    const after = value.slice(end, Math.min(value.length, end + 1));
    // Only mark italic if it's not part of bold (i.e., not **)
    if (before === "*" && after === "*" && 
        !(value.slice(Math.max(0, start - 2), start) === "**" && value.slice(end, Math.min(value.length, end + 2)) === "**")) {
      marks.italic = true;
    }
  }
  if (!marks.underline) {
    const before = value.slice(Math.max(0, start - 3), start);
    const after = value.slice(end, Math.min(value.length, end + 4));
    if (before === "<u>" && after === "</u>") marks.underline = true;
  }
  if (!marks.strikethrough) {
    const before = value.slice(Math.max(0, start - 2), start);
    const after = value.slice(end, Math.min(value.length, end + 2));
    if (before === "~~" && after === "~~") marks.strikethrough = true;
  }
  if (!marks.code) {
    const before = value.slice(Math.max(0, start - 1), start);
    const after = value.slice(end, Math.min(value.length, end + 1));
    if (before === "`" && after === "`") marks.code = true;
  }

  // Only return marks that are actually set
  const result = {};
  for (const [key, val] of Object.entries(marks)) {
    if (val !== false && val !== null && val !== undefined) result[key] = val;
  }
  return Object.keys(result).length ? result : null;
}

/** Applies a set of marks to a selection. */
export function applyMarks(selection, marks) {
  if (!marks) return null;
  const { value, start, end } = selection;
  let { next, start: s, end: e, text, caret, select } = { next: value, start, end, text: value.slice(start, end), caret: end, select: [start, end] };

  // Apply in order: outer marks first (span, mark), then inner marks (bold, italic, etc.)
  // This ensures proper nesting

  // Span attributes (font, color, size, small-caps)
  if (marks.font !== undefined || marks.color !== undefined || marks.size !== undefined || marks.smallCaps) {
    const attrResult = applyAttr({ value: next, start: s, end: e }, "span", "f", marks.font ?? null);
    if (attrResult) ({ next, start: s, end: e, text: attrResult.text, caret: attrResult.caret, select: attrResult.select } = attrResult);
    if (marks.color !== undefined) {
      const colorResult = applyAttr({ value: next, start: s, end: e }, "span", "c", marks.color ?? null);
      if (colorResult) ({ next, start: s, end: e, text: colorResult.text, caret: colorResult.caret, select: colorResult.select } = colorResult);
    }
    if (marks.size !== undefined) {
      const sizeResult = applyAttr({ value: next, start: s, end: e }, "span", "s", marks.size ?? null);
      if (sizeResult) ({ next, start: s, end: e, text: sizeResult.text, caret: sizeResult.caret, select: sizeResult.select } = sizeResult);
    }
    if (marks.smallCaps) {
      const scResult = applyAttr({ value: next, start: s, end: e }, "span", "sc", null);
      if (scResult) ({ next, start: s, end: e, text: scResult.text, caret: scResult.caret, select: scResult.select } = scResult);
    }
  }

  // Highlight
  if (marks.highlight !== undefined) {
    const hResult = applyAttr({ value: next, start: s, end: e }, "mark", "h", marks.highlight ?? null);
    if (hResult) ({ next, start: s, end: e, text: hResult.text, caret: hResult.caret, select: hResult.select } = hResult);
  }

  // Underline
  if (marks.underline) {
    const uResult = toggleWrap({ value: next, start: s, end: e }, "<u>", "</u>");
    if (uResult) ({ next, start: s, end: e, text: uResult.text, caret: uResult.caret, select: uResult.select } = uResult);
  }

  // Strikethrough
  if (marks.strikethrough) {
    const stResult = toggleWrap({ value: next, start: s, end: e }, "~~");
    if (stResult) ({ next, start: s, end: e, text: stResult.text, caret: stResult.caret, select: stResult.select } = stResult);
  }

  // Bold
  if (marks.bold) {
    const bResult = toggleWrap({ value: next, start: s, end: e }, "**");
    if (bResult) ({ next, start: s, end: e, text: bResult.text, caret: bResult.caret, select: bResult.select } = bResult);
  }

  // Italic
  if (marks.italic) {
    const iResult = toggleItalic({ value: next, start: s, end: e });
    if (iResult) ({ next, start: s, end: e, text: iResult.text, caret: iResult.caret, select: iResult.select } = iResult);
  }

  // Code
  if (marks.code) {
    const cResult = toggleWrap({ value: next, start: s, end: e }, "`");
    if (cResult) ({ next, start: s, end: e, text: cResult.text, caret: cResult.caret, select: cResult.select } = cResult);
  }

  // Subscript
  if (marks.subscript) {
    const subResult = toggleWrap({ value: next, start: s, end: e }, "<sub>", "</sub>");
    if (subResult) ({ next, start: s, end: e, text: subResult.text, caret: subResult.caret, select: subResult.select } = subResult);
  }

  // Superscript
  if (marks.superscript) {
    const supResult = toggleWrap({ value: next, start: s, end: e }, "<sup>", "</sup>");
    if (supResult) ({ next, start: s, end: e, text: supResult.text, caret: supResult.caret, select: supResult.select } = supResult);
  }

  // Kbd
  if (marks.kbd) {
    const kResult = toggleWrap({ value: next, start: s, end: e }, "<kbd>", "</kbd>");
    if (kResult) ({ next, start: s, end: e, text: kResult.text, caret: kResult.caret, select: kResult.select } = kResult);
  }

  // Link
  if (marks.link && marks.link.url) {
    const lResult = linkWithUrl({ value: next, start: s, end: e }, marks.link.url);
    if (lResult) ({ next, start: s, end: e, text: lResult.text, caret: lResult.caret, select: lResult.select } = lResult);
  }

  return { next, start: s, end: e, text, caret, select };
}

/** Wraps the covered lines in a `<div data-a data-dir>` block; "left" + "ltr" removes it. */
export function setBlock(selection, patch) {
  const { value } = selection;
  const { from, to, text } = lineRange(selection);
  const pattern = /^<div((?: data-(?:a|dir)="[a-z]+")*)>\n\n([\s\S]*?)\n\n<\/div>$/;
  const existing = pattern.exec(text);
  let attrs = { a: null, dir: null };
  let body = text;
  if (existing) {
    body = existing[2];
    for (const m of existing[1].matchAll(/data-(a|dir)="([a-z]+)"/g)) attrs[m[1]] = m[2];
  }
  attrs = { ...attrs, ...patch };
  const same = (key) => existing && patch[key] !== undefined && existing[1].includes(`data-${key}="${patch[key]}"`);
  if (Object.keys(patch).every((key) => same(key))) {
    Object.keys(patch).forEach((key) => {
      attrs[key] = null;
    });
  }
  if (attrs.a === "left") attrs.a = null;
  if (attrs.dir === "ltr") attrs.dir = null;
  const attrText = `${attrs.a ? ` data-a="${attrs.a}"` : ""}${attrs.dir ? ` data-dir="${attrs.dir}"` : ""}`;
  const out = attrText ? `<div${attrText}>\n\n${body}\n\n</div>` : body;
  if (out === text) return null;
  return make(value, from, to, out, from + out.length, [from, from + out.length]);
}

/* --------------------------------- links ---------------------------------- */

export function linkWithUrl(selection, url) {
  const { value, start, end } = selection;
  const label = value.slice(start, end) || url;
  const text = `[${label}](${url})`;
  return make(value, start, end, text, start + text.length);
}

export function wikiLink(selection) {
  const { value, start, end } = selection;
  const label = value.slice(start, end);
  if (label) return make(value, start, end, `[[${label}]]`, start + label.length + 4);
  return make(value, start, end, "[[]]", start + 2);
}

/** Static outline of the headings in the note, written as nested bullets. */
export function outlineOf(value) {
  const lines = String(value || "").split("\n");
  const out = [];
  let fence = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (fence) continue;
    const m = /^(#{1,6})\s+(.+?)\s*#*$/.exec(line);
    if (m) out.push(`${"  ".repeat(m[1].length - 1)}- ${m[2]}`);
  }
  return out.join("\n");
}

/** Next unused footnote number, and the snippet that defines it. */
export function footnoteParts(value) {
  const used = [...String(value).matchAll(/\[\^(\d+)\]/g)].map((m) => Number(m[1]));
  const n = used.length ? Math.max(...used) + 1 : 1;
  return { ref: `[^${n}]`, definition: `[^${n}]: ` };
}

/* ------------------------------- code blocks ------------------------------ */

/** The fenced code block that contains `index`, or null. */
export function fenceAt(value, index) {
  const re = /^[ \t]*```([^\n`]*)$/gm;
  const fences = [];
  let m;
  while ((m = re.exec(value)) !== null) fences.push({ at: m.index, end: m.index + m[0].length, lang: m[1].trim() });
  for (let i = 0; i < fences.length; i += 2) {
    const open = fences[i];
    const close = fences[i + 1];
    const to = close ? close.end : value.length;
    if (index >= open.at && index <= to) {
      return {
        lang: open.lang,
        from: open.at,
        to,
        bodyStart: open.end + 1,
        bodyEnd: close ? close.at : value.length,
        openEnd: open.end,
      };
    }
  }
  return null;
}

export function setFenceLanguage(selection, language) {
  const block = fenceAt(selection.value, selection.start);
  if (!block) return null;
  const { value } = selection;
  const line = value.slice(block.from, block.openEnd);
  const lead = (/^[ \t]*/.exec(line) || [""])[0];
  return make(value, block.from, block.openEnd, `${lead}\`\`\`${language}`, selection.start);
}

export function unwrapFence(selection) {
  const block = fenceAt(selection.value, selection.start);
  if (!block) return null;
  const { value } = selection;
  const inner = value.slice(block.bodyStart, block.bodyEnd).replace(/\n$/, "");
  const after = value[block.to] === "\n" ? block.to + 1 : block.to;
  return make(value, block.from, after, `${inner}\n`, block.from + inner.length);
}

export function wrapSelectionInFence(selection, language) {
  const { value, start, end } = selection;
  const text = value.slice(start, end);
  if (!text) return null;
  const lead = start > 0 && value[start - 1] !== "\n" ? "\n" : "";
  const out = `${lead}\`\`\`${language}\n${text.replace(/\n$/, "")}\n\`\`\`\n`;
  return make(value, start, end, out, start + out.length);
}

export const COMMENT_STYLES = {
  line: ["javascript", "typescript", "js", "ts", "jsx", "tsx", "rust", "c", "cpp", "csharp", "java", "go", "swift", "kotlin", "php", "dart", "scala", "groovy", "zig", "solidity", "glsl", "json5"],
  hash: ["python", "bash", "shell", "sh", "zsh", "yaml", "toml", "ruby", "perl", "r", "powershell", "makefile", "dockerfile", "nginx", "elixir", "julia", "nim", "conf", "gitignore"],
  dash: ["sql", "lua", "haskell", "ada", "vhdl", "elm"],
  semi: ["ini", "lisp", "clojure", "scheme", "asm"],
  percent: ["latex", "tex", "matlab", "erlang"],
  markup: ["html", "xml", "markdown", "svg", "vue"],
  css: ["css", "scss", "less"],
};

export function commentMarkers(language) {
  const id = String(language || "").toLowerCase();
  if (COMMENT_STYLES.hash.includes(id)) return ["# ", ""];
  if (COMMENT_STYLES.dash.includes(id)) return ["-- ", ""];
  if (COMMENT_STYLES.semi.includes(id)) return ["; ", ""];
  if (COMMENT_STYLES.percent.includes(id)) return ["% ", ""];
  if (COMMENT_STYLES.markup.includes(id)) return ["<!-- ", " -->"];
  if (COMMENT_STYLES.css.includes(id)) return ["/* ", " */"];
  return ["// ", ""];
}

/** Comments out the covered lines, or uncomments them when every one is already commented. */
export function toggleComment(selection, language) {
  const [open, close] = commentMarkers(language);
  const o = open.trim();
  const c = close.trim();
  return mapLines(selection, (lines) => {
    const filled = lines.filter((l) => l.trim());
    const isCommented = (l) => {
      const t = l.trim();
      return t.startsWith(o) && (!c || t.endsWith(c));
    };
    if (filled.length && filled.every(isCommented)) {
      return lines.map((l) => {
        if (!l.trim()) return l;
        let out = l.replace(o, "").replace(/^(\s*) /, "$1");
        if (c) out = out.replace(new RegExp(`\\s?${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`), "");
        return out;
      });
    }
    return lines.map((l) => {
      if (!l.trim()) return l;
      const lead = (/^\s*/.exec(l) || [""])[0];
      return `${lead}${open}${l.slice(lead.length)}${close}`;
    });
  });
}

/** Pretty-prints or minifies JSON text. Returns null when the text is not valid JSON. */
export function formatJsonText(text, mode) {
  try {
    const parsed = JSON.parse(text);
    return mode === "minify" ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
  } catch {
    return null;
  }
}

/** Formats the JSON in the fence at the caret (or the selection). */
export function formatJsonSelection(selection, mode) {
  const { value, start, end } = selection;
  let from = start;
  let to = end;
  if (start === end) {
    const block = fenceAt(value, start);
    if (!block) return null;
    from = block.bodyStart;
    to = block.bodyEnd;
  }
  const raw = value.slice(from, to);
  const trailing = /\n$/.test(raw) ? "\n" : "";
  const out = formatJsonText(raw, mode);
  if (out === null) return null;
  return make(value, from, to, `${out}${trailing}`, from + out.length);
}

/* --------------------------------- tasks ---------------------------------- */

const TASK_RE = /^(\s*(?:[-*+]\s+|\d+\.\s+)?)(?:\[( |x|X)\]|(TODO|DOING|DONE))\s+(.*)$/;
const ORDER = { DOING: 0, TODO: 1, DONE: 2 };

const statusOf = (line) => {
  const m = TASK_RE.exec(line);
  if (!m) return null;
  return m[3] || (m[2] === " " ? "TODO" : "DONE");
};

/**
 * Bulk task edits. With a collapsed caret they run on the whole note,
 * otherwise on the selected lines only.
 */
export function taskTool(selection, tool) {
  const { value, start, end } = selection;
  const scope = start === end ? { value, start: 0, end: value.length } : selection;
  return mapLines(scope, (lines) => {
    const set = (line, status) => {
      const m = TASK_RE.exec(line);
      return m ? `${m[1]}${status} ${m[4]}` : line;
    };
    switch (tool) {
      case "all-done":
        return lines.map((l) => (statusOf(l) ? set(l, "DONE") : l));
      case "reset":
        return lines.map((l) => (statusOf(l) ? set(l, "TODO") : l));
      case "clear":
        return lines.map((l) => {
          const m = TASK_RE.exec(l);
          return m ? `${m[1].replace(/^(\s*)(\d+\.|[*+])\s+/, "$1- ")}${m[4]}` : l;
        });
      case "sort-status":
      case "done-last": {
        const tasks = lines.map((l, i) => ({ l, i, s: statusOf(l) })).filter((t) => t.s);
        if (tasks.length < 2) return null;
        const rank = (t) => (tool === "done-last" ? (t.s === "DONE" ? 1 : 0) : ORDER[t.s]);
        const sorted = [...tasks].sort((a, b) => rank(a) - rank(b) || a.i - b.i);
        const slots = tasks.map((t) => t.i);
        const out = [...lines];
        sorted.forEach((t, k) => {
          out[slots[k]] = t.l;
        });
        return out;
      }
      default:
        return null;
    }
  });
}

/** Puts `due:YYYY-MM-DD` at the end of the line, replacing an earlier one. */
export function dueDate(selection, key) {
  return mapLines({ ...selection, end: selection.start }, (lines) =>
    lines.map((line) => {
      const bare = line.replace(/\s+due:\d{4}-\d{2}-\d{2}/, "");
      return key ? `${bare} due:${key}` : bare;
    })
  );
}
