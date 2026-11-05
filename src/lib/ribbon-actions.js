/**
 * Text edits the ribbon performs on the markdown body.
 *
 * Each helper takes the editor selection ({ value, start, end }) and returns the
 * smallest region to replace plus where the caret belongs afterwards, so the
 * editor can apply it as one undoable edit instead of rewriting the note.
 */

export const MAX_TABLE_ROWS = 200;
export const MAX_TABLE_COLUMNS = 50;

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

function lineStart(value, index) {
  const at = value.lastIndexOf("\n", index - 1);
  return at === -1 ? 0 : at + 1;
}

function lineEnd(value, index) {
  const at = value.indexOf("\n", index);
  return at === -1 ? value.length : at;
}

function edit(value, start, end, text, caret) {
  return {
    next: `${value.slice(0, start)}${text}${value.slice(end)}`,
    start,
    end,
    text,
    caret,
  };
}

export function insertText(selection, snippet, offset = snippet.length) {
  const { value, start, end } = selection;
  return edit(value, start, end, snippet, start + offset);
}

/* ------------------------------- task lines ------------------------------- */

const parseLine = (line) => {
  const indent = /^[ \t]*/.exec(line)[0];
  let rest = line.slice(indent.length);
  const bulletMatch = /^(?:[-*+]|\d+\.)[ \t]+/.exec(rest);
  const bullet = bulletMatch ? bulletMatch[0] : "";
  if (bulletMatch) rest = rest.slice(bullet.length);
  const box = /^\[([ xX])\][ \t]+/.exec(rest);
  const check = box ? box[1] : null;
  if (box) rest = rest.slice(box[0].length);
  const word = /^(TODO|DOING|DONE)(?:[ \t]+|$)/.exec(rest);
  const status = check ? (check.trim() ? "DONE" : "TODO") : word ? word[1] : null;
  if (word) rest = rest.slice(word[0].length);
  return { indent, bullet, word: word ? word[1] : null, status, text: rest };
};

/** Status of the line the caret sits on, or null when it holds no status. */
export function taskStatusAt(value, index) {
  return parseLine(value.slice(lineStart(value, index), lineEnd(value, index))).status;
}

/**
 * Turns every selected line into `- STATUS text`. A line already carrying that
 * status drops it again, checkboxes become TODO / DONE, and an empty line gets a
 * fresh status with the caret parked after it.
 */
export function toggleTask(selection, status) {
  const { value, start, end } = selection;
  const from = lineStart(value, start);
  const to = lineEnd(value, end > start && value[end - 1] === "\n" ? end - 1 : end);
  const lines = value.slice(from, to).split("\n");

  let caretLine = 0;
  const starts = [];
  let pos = from;
  lines.forEach((line, index) => {
    starts.push(pos);
    pos += line.length + 1;
    if (starts[index] <= end) caretLine = index;
  });

  const out = lines.map((line) => {
    const parsed = parseLine(line);
    const text = parsed.text.trim();
    if (!text) {
      if (lines.length > 1) return line;
      return `${parsed.indent}- ${status} `;
    }
    // Only the same status *word* toggles off; a checkbox always converts.
    if (parsed.word === status) return `${parsed.indent}${parsed.bullet}${text}`;
    return `${parsed.indent}- ${status} ${text}`;
  });

  const text = out.join("\n");
  let caret = from;
  for (let i = 0; i < caretLine; i += 1) caret += out[i].length + 1;
  caret += out[caretLine].length;
  return edit(value, from, to, text, caret);
}

/* --------------------------------- tables --------------------------------- */

const hasPipe = (line) => typeof line === "string" && line.includes("|");

export function splitRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

export function isSeparator(line) {
  if (!hasPipe(line)) return false;
  const cells = splitRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{1,}:?$/.test(cell));
}

function renderRows(rows) {
  return rows.map((row) => `| ${row.map((cell) => cell || "  ").join(" | ")} |`).join("\n");
}

function cellOffsetInLine(line, column) {
  let seen = 0;
  for (let i = 0; i < line.length; i += 1) {
    if (line[i] !== "|") continue;
    seen += 1;
    if (seen === column + 1) {
      let at = i + 1;
      while (line[at] === " ") at += 1;
      return at;
    }
  }
  return line.length;
}

function blockOffset(text, row, column) {
  const lines = text.split("\n");
  const index = clamp(row, 0, lines.length - 1);
  let offset = 0;
  for (let i = 0; i < index; i += 1) offset += lines[i].length + 1;
  return offset + cellOffsetInLine(lines[index], column);
}

/** The markdown table under the caret, or null when the caret sits outside one. */
export function tableAt(value, index) {
  const lines = value.split("\n");
  const starts = [];
  let pos = 0;
  lines.forEach((line) => {
    starts.push(pos);
    pos += line.length + 1;
  });

  let lineIndex = 0;
  lines.forEach((line, i) => {
    if (starts[i] <= index) lineIndex = i;
  });

  if (!hasPipe(lines[lineIndex])) return null;

  let from = lineIndex;
  let to = lineIndex;
  while (from > 0 && hasPipe(lines[from - 1])) from -= 1;
  while (to < lines.length - 1 && hasPipe(lines[to + 1])) to += 1;
  // A markdown table is a header row, then the --- separator row.
  if (to - from < 1 || !isSeparator(lines[from + 1])) return null;

  const rows = [];
  for (let i = from; i <= to; i += 1) rows.push(splitRow(lines[i]));
  const width = Math.max(...rows.map((row) => row.length));
  rows.forEach((row) => {
    while (row.length < width) row.push("");
  });

  const before = (lines[lineIndex].slice(0, index - starts[lineIndex]).match(/\|/g) || []).length;
  const lead = lines[lineIndex].trimStart().startsWith("|") ? 1 : 0;
  const column = clamp(before - lead, 0, width - 1);

  return {
    rows,
    width,
    lines,
    starts,
    from,
    to,
    rowIndex: lineIndex - from,
    column,
    start: starts[from],
    end: starts[to] + lines[to].length,
  };
}

export function tableMarkdown(rows, columns) {
  const head = Array.from({ length: columns }, (_, index) => `Column ${index + 1}`);
  const body = Array.from({ length: rows }, () => `| ${Array.from({ length: columns }, () => "  ").join(" | ")} |`);
  return `| ${head.join(" | ")} |\n| ${Array.from({ length: columns }, () => "---").join(" | ")} |\n${body.join("\n")}`;
}

/** Inserts a table at the caret with the cursor inside the first header cell. */
export function tableInsert(selection, rows, columns) {
  const { value, start, end } = selection;
  const rowCount = clamp(Math.round(rows) || 1, 1, MAX_TABLE_ROWS);
  const columnCount = clamp(Math.round(columns) || 1, 1, MAX_TABLE_COLUMNS);
  const lead = start > 0 && value[start - 1] !== "\n" ? "\n" : "";
  const snippet = `${lead}${tableMarkdown(rowCount, columnCount)}\n\n`;
  return edit(value, start, end, snippet, start + lead.length + 2);
}

export const TABLE_OPS = [
  "row-above",
  "row-below",
  "column-left",
  "column-right",
  "delete-row",
  "delete-column",
  "delete-table",
  "align-left",
  "align-centre",
  "align-right",
];

/** One table-tools action on the table under the caret. */
export function tableOp(selection, op) {
  const block = tableAt(selection.value, selection.start);
  if (!block) return null;
  if (op === "delete-table") return removeTable(selection);

  const rows = block.rows.map((row) => [...row]);
  const empty = () => Array.from({ length: block.width }, () => "");
  let caretRow = block.rowIndex;
  let caretColumn = block.column;

  if (op === "row-above") {
    const at = Math.max(2, block.rowIndex);
    rows.splice(at, 0, empty());
    caretRow = at;
    caretColumn = 0;
  } else if (op === "row-below") {
    const at = Math.min(rows.length, Math.max(2, block.rowIndex + 1));
    rows.splice(at, 0, empty());
    caretRow = at;
    caretColumn = 0;
  } else if (op === "column-left" || op === "column-right") {
    const at = op === "column-left" ? block.column : block.column + 1;
    rows.forEach((row, index) => row.splice(at, 0, index === 1 ? "---" : ""));
    caretRow = block.rowIndex;
    caretColumn = at;
  } else if (op === "delete-row") {
    if (block.rowIndex < 2) return null;
    if (rows.length <= 3) {
      // The last data row is cleared rather than dropped, so the table keeps its header.
      rows[2] = empty();
      caretRow = 2;
      caretColumn = 0;
    } else {
      rows.splice(block.rowIndex, 1);
      caretRow = Math.min(block.rowIndex, rows.length - 1);
    }
  } else if (op === "delete-column") {
    if (block.width <= 1) return removeTable(selection);
    rows.forEach((row) => row.splice(block.column, 1));
    caretColumn = Math.min(block.column, rows[0].length - 1);
  } else if (op.startsWith("align-")) {
    const marks = { "align-left": "---", "align-centre": ":---:", "align-right": "---:" };
    rows[1][block.column] = marks[op];
  } else {
    return null;
  }

  const text = renderRows(rows);
  return edit(selection.value, block.start, block.end, text, block.start + blockOffset(text, caretRow, caretColumn));
}

function removeTable(selection) {
  const block = tableAt(selection.value, selection.start);
  if (!block) return null;
  const { value } = selection;
  const end = value[block.end] === "\n" ? block.end + 1 : block.end;
  return edit(value, block.start, end, "", block.start);
}

/** Where Tab / Shift+Tab should put the caret, or "add-row" in the last cell. */
export function tableCaretMove(selection, direction) {
  const block = tableAt(selection.value, selection.start);
  if (!block) return null;
  let { rowIndex: row, column: column } = block;
  const lastRow = block.rows.length - 1;

  if (direction < 0) {
    if (column > 0) column -= 1;
    else {
      row -= 1;
      if (row === 1) row = 0; // the separator row is never a stop
      if (row < 0) return { at: block.start };
      column = block.width - 1;
    }
  } else if (column < block.width - 1) column += 1;
  else {
    row += 1;
    if (row === 1) row = 2;
    if (row > lastRow) return "add-row";
    column = 0;
  }

  const lineIndex = block.from + row;
  return { at: block.starts[lineIndex] + cellOffsetInLine(block.lines[lineIndex] || "", column) };
}

/** Tab-separated text copied from a spreadsheet, as a markdown table. */
export function tsvToMarkdown(text) {
  const rows = String(text || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => line.split("\t"));
  if (rows.length < 2) return null;
  const width = Math.max(...rows.map((row) => row.length));
  if (width < 2) return null;
  const pad = (row) => {
    const cells = row.map((cell) => cell.replace(/\|/g, "\\|").trim());
    while (cells.length < width) cells.push("");
    return cells;
  };
  const line = (cells) => `| ${cells.join(" | ")} |`;
  const [head, ...body] = rows;
  return [line(pad(head)), line(Array.from({ length: width }, () => "---")), ...body.map((row) => line(pad(row)))].join(
    "\n"
  );
}

/* ------------------------------- code blocks ------------------------------ */

const FENCE_LINE = /^[ \t]*```.*$/gm;

function fencedBlocks(body) {
  const fences = [];
  let match;
  FENCE_LINE.lastIndex = 0;
  while ((match = FENCE_LINE.exec(body)) !== null) {
    fences.push({ start: match.index, end: match.index + match[0].length });
  }
  const blocks = [];
  for (let i = 0; i < fences.length; i += 2) {
    const close = fences[i + 1];
    blocks.push({ from: fences[i].start, to: close ? close.end : body.length });
  }
  return blocks;
}

export function codeBlockAt(selection, language) {
  const { value, start, end } = selection;
  const snippet = `\n\`\`\`${language}\n\n\`\`\`\n\n`;
  const caretIn = snippet.indexOf("\n", 1) + 1;
  const inside = fencedBlocks(value).find((block) => start >= block.from && start <= block.to);
  if (inside) return edit(value, inside.to, inside.to, snippet, inside.to + caretIn);
  return edit(value, start, end, snippet, start + caretIn);
}