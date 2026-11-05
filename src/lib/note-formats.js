/** Formats a note body can be read and typed in. `markdown` is the default. */
export const NOTE_FORMATS = [
  { id: "markdown", label: "Markdown" },
  { id: "plain", label: "Plain text" },
  { id: "yaml", label: "YAML" },
  { id: "xml", label: "XML" },
  { id: "json", label: "JSON" },
  { id: "toml", label: "TOML" },
  { id: "csv", label: "CSV" },
  { id: "ini", label: "INI" },
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
  { id: "rust", label: "Rust" },
  { id: "bash", label: "Bash" },
  { id: "sql", label: "SQL" },
];

/** The Format dropdown reads these groups, in this order — the only language list in the ribbon. */
export const FORMAT_GROUPS = [
  { label: "Writing", ids: ["markdown", "plain"] },
  { label: "Data and config", ids: ["yaml", "xml", "json", "toml", "csv", "ini"] },
  { label: "Web", ids: ["html", "css"] },
  { label: "Code", ids: ["javascript", "typescript", "python", "rust", "bash", "sql"] },
];

export const isMarkdown = (format) => !format || format === "markdown";

export const formatLabel = (id) => NOTE_FORMATS.find((item) => item.id === id)?.label || "Markdown";

export const indentUnit = (format) => (format === "python" ? "    " : "  ");

const MARKUP = ["xml", "html"];

/** A line opens a deeper block in this format. */
function opensBlock(line, format) {
  if (!line) return false;
  if (MARKUP.includes(format)) {
    const tag = line.match(/<(\/?)([\w:.-]+)([^>]*)>$/);
    return Boolean(tag) && !tag[1] && !tag[3].trimEnd().endsWith("/");
  }
  if (format === "python" || format === "yaml") return /:$/.test(line);
  if (format === "bash") return /(\bthen|\bdo|\belse|\belif|\{)$/.test(line);
  if (["javascript", "typescript", "json", "css", "rust"].includes(format)) return /[{[(]$/.test(line);
  return false;
}

/** The text after the caret starts with a closer, so the new line sits one level out. */
function startsCloser(after, format) {
  const next = (after || "").replace(/^[ \t]*/, "");
  if (!next) return false;
  if (MARKUP.includes(format)) return next.startsWith("</");
  return /^[}\]\)]/.test(next);
}

/** Indentation the line created by pressing Enter should carry. */
export function autoIndent(format, before, after = "") {
  const unit = indentUnit(format);
  const line = before.slice(before.lastIndexOf("\n") + 1);
  const lead = (line.match(/^[ \t]*/) || [""])[0];
  if (opensBlock(line.trimEnd(), format)) return `${lead}${unit}`;
  if (startsCloser(after, format)) return lead.slice(0, Math.max(0, lead.length - unit.length));
  return lead;
}

/** Removes one indent level from the start of a line. */
export function dedent(line, format) {
  const unit = indentUnit(format);
  if (line.startsWith(unit)) return line.slice(unit.length);
  if (line.startsWith("\t")) return line.slice(1);
  return line.replace(/^ /, "");
}