/**
 * Insertion helpers for the note ribbon.
 *
 * Every action works on the raw markdown string and the caret of the editor
 * textarea (#nb-editor), so a button inserts exactly where the writer is
 * typing instead of appending to the end of the note.
 */

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function imageRejection(file) {
  if (!IMAGE_TYPES.includes(file.type)) return "Use a png, jpg, webp or gif image.";
  if (file.size > MAX_IMAGE_BYTES) return "Images must stay under 5 MB.";
  return "";
}

/** Caret position inside the editor; falls back to the end of the note in read mode. */
export function editorCaret(body = "") {
  const node = document.getElementById("nb-editor");
  if (!node || typeof node.selectionStart !== "number") return { start: body.length, end: body.length };
  return { start: node.selectionStart, end: node.selectionEnd };
}

export function replaceRange(body, start, end, snippet) {
  return {
    body: `${body.slice(0, start)}${snippet}${body.slice(end)}`,
    caret: start + snippet.length,
  };
}

export function setEditorCaret(index) {
  requestAnimationFrame(() => {
    const node = document.getElementById("nb-editor");
    if (!node) return;
    node.focus();
    node.setSelectionRange(index, index);
  });
}

export function insertAtCaret(body, snippet, caretOffset) {
  const { start, end } = editorCaret(body);
  const next = replaceRange(body, start, end, snippet);
  setEditorCaret(typeof caretOffset === "number" ? start + caretOffset : next.caret);
  return next.body;
}

const TASK_MARKER = /^(TODO|DOING|DONE)[ \t]+/;

/** Puts a task marker at the start of the current line, replacing an existing one. */
export function prefixLine(body, marker) {
  const { start } = editorCaret(body);
  const lineStart = body.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const line = body.slice(lineStart);
  const existing = line.match(TASK_MARKER);
  const removed = existing ? existing[0].length : 0;
  const next = `${body.slice(0, lineStart)}${marker} ${line.slice(removed)}`;
  setEditorCaret(Math.max(lineStart, start + marker.length + 1 - removed));
  return next;
}

export function tableSnippet(rows, columns) {
  const line = (cells) => `| ${cells.join(" | ")} |`;
  const head = Array.from({ length: columns }, (_, index) => `Column ${index + 1}`);
  const body = Array.from({ length: rows }, () => line(Array.from({ length: columns }, () => "  ")));
  return `\n${line(head)}\n${line(Array.from({ length: columns }, () => "---"))}\n${body.join("\n")}\n\n`;
}

export function codeSnippet(language) {
  return `\n\`\`\`${language}\n\n\`\`\`\n\n`;
}

const FENCE_LINE = /^[ \t]*```.*$/gm;

/** Ranges of the fenced blocks in a note, opening fence through closing fence. */
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

/**
 * Inserts a fenced block at the caret. If the caret already sits inside a fence,
 * the new block goes after that block's closing fence instead, and the caret
 * lands on the empty line between the new fences.
 */
export function codeBlockInsert(body, language) {
  const snippet = codeSnippet(language);
  const caretInSnippet = snippet.indexOf("\n", 1) + 1;
  const { start, end } = editorCaret(body);
  const block = fencedBlocks(body).find((item) => start >= item.from && start <= item.to);

  if (!block) {
    const next = replaceRange(body, start, end, snippet);
    setEditorCaret(start + caretInSnippet);
    return next.body;
  }

  const next = `${body.slice(0, block.to)}${snippet}${body.slice(block.to)}`;
  setEditorCaret(block.to + caretInSnippet);
  return next;
}

export function imageSnippet(url, alt = "image") {
  return `\n![${alt || "image"}](${url})\n\n`;
}