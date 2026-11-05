export const LANGUAGES = [
  { id: "rust", label: "Rust", template: 'fn main() {\n    let vault = "plain text forever";\n    println!("{vault}");\n}\n' },
  { id: "javascript", label: "JavaScript", template: 'const vault = {\n  notes: 8,\n  local: true,\n};\n\nconsole.log(vault);\n' },
  { id: "typescript", label: "TypeScript", template: 'type Note = {\n  title: string;\n  tags: string[];\n};\n\nexport const note: Note = { title: "Ideas", tags: ["draft"] };\n' },
  { id: "python", label: "Python", template: 'def open_vault(path: str) -> list[str]:\n    # read every markdown file\n    with open(path) as handle:\n        return handle.readlines()\n' },
  { id: "bash", label: "Bash", template: '#!/usr/bin/env bash\n# open every note in the vault\nfor file in notes/*.md; do\n  echo "opening $file"\ndone\n' },
  { id: "sql", label: "SQL", template: 'SELECT title, updated_date\nFROM notes\nWHERE body LIKE \'%backlink%\'\nORDER BY updated_date DESC;\n' },
  { id: "json", label: "JSON", template: '{\n  "vault": "notecraft",\n  "localFirst": true,\n  "notes": 8\n}\n' },
  { id: "yaml", label: "YAML", template: 'name: notecraft\nlocal: true\ntags:\n  - notes\n  - canvas\n' },
  { id: "toml", label: "TOML", template: '[vault]\nname = "notecraft"\nlocal = true\nnotes = 8\n' },
  { id: "xml", label: "XML", template: '<?xml version="1.0" encoding="UTF-8"?>\n<vault local="true">\n  <note id="1">Ideas</note>\n</vault>\n' },
  { id: "html", label: "HTML", template: '<article class="note">\n  <h1>Ideas</h1>\n  <p>Linked to <a href="#vault">the vault</a>.</p>\n</article>\n' },
  { id: "css", label: "CSS", template: '.vault-card {\n  border: 1px solid var(--border);\n  border-radius: 12px;\n}\n' },
  { id: "csv", label: "CSV", template: 'title,tags,updated\nIdeas,draft,2026-11-02\nVault,core,2026-10-30\n' },
  { id: "ini", label: "INI", template: '[vault]\nname=notecraft\nlocal=true\n' },
  { id: "markdown", label: "Markdown", template: '# Heading\n\nLink a note with [[Getting started]] and tag it #basics.\n' },
  { id: "plain", label: "Plain text", template: 'Notes, plain and unadorned.\n' },
];

const KEYWORDS = {
  rust: "fn let mut pub impl struct enum trait match if else for while loop return use mod self crate async await where dyn const static ref move as in break continue type",
  javascript: "const let var function return if else for while import from export default class new await async try catch throw typeof null undefined true false of switch case break",
  typescript: "const let var function return if else for while import from export default class new await async try catch throw typeof null undefined true false interface type enum extends implements public private readonly of",
  python: "def class return if elif else for while import from as with lambda try except finally raise in not and or is None True False pass yield async await",
  bash: "if then else elif fi for while in do done case esac function return echo export local readonly source set unset exit break continue true false",
  sql: "SELECT FROM WHERE ORDER BY GROUP HAVING JOIN LEFT RIGHT INNER OUTER ON AS AND OR NOT LIKE INSERT INTO VALUES UPDATE SET DELETE LIMIT DISTINCT COUNT",
  json: "true false null",
  yaml: "true false null yes no on off",
  toml: "true false",
  ini: "true false",
  csv: "true false",
};

const DQ = '"(?:\\\\.|[^"\\\\])*"';
const SQ = "'(?:\\\\.|[^'\\\\])*'";
const BT = '`(?:\\\\.|[^`\\\\])*`';
const STRINGS = `${DQ}|${SQ}|${BT}`;
const NUMBER = "\\b\\d+(?:\\.\\d+)?";

const C_COMMENT = "\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/";
const HASH_COMMENT = "#[^\\n]*";
const SEMI_COMMENT = "[;#][^\\n]*";
const MARKUP_COMMENT = "<!--[\\s\\S]*?-->";
const SQL_COMMENT = "--[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/";

const kw = (id) => {
  const words = KEYWORDS[id];
  return words ? `\\b(?:${words.split(" ").join("|")})\\b` : null;
};

/** Ordered [token type, regex source] rules per language. Inner groups must be non-capturing. */
const RULES = {
  rust: [["comment", C_COMMENT], ["string", STRINGS], ["number", NUMBER], ["keyword", kw("rust")]],
  javascript: [["comment", C_COMMENT], ["string", STRINGS], ["number", NUMBER], ["keyword", kw("javascript")]],
  typescript: [["comment", C_COMMENT], ["string", STRINGS], ["number", NUMBER], ["keyword", kw("typescript")]],
  python: [["comment", HASH_COMMENT], ["string", STRINGS], ["number", NUMBER], ["keyword", kw("python")]],
  bash: [
    ["comment", HASH_COMMENT],
    ["string", `${DQ}|${SQ}`],
    ["key", "\\$\\{?[A-Za-z_@#][\\w]*\\}?"],
    ["number", NUMBER],
    ["keyword", kw("bash")],
  ],
  sql: [["comment", SQL_COMMENT], ["string", `${DQ}|${SQ}`], ["number", NUMBER], ["keyword", kw("sql")]],
  json: [["comment", C_COMMENT], ["string", DQ], ["number", NUMBER], ["keyword", kw("json")]],
  yaml: [
    ["comment", HASH_COMMENT],
    ["string", STRINGS],
    ["key", "[\\w.$/-]+(?=[ \\t]*:)"],
    ["number", NUMBER],
    ["keyword", kw("yaml")],
  ],
  toml: [
    ["comment", HASH_COMMENT],
    ["string", STRINGS],
    ["tag", "^\\[[^\\]\\n]+\\]"],
    ["key", "[\\w.-]+(?=[ \\t]*=)"],
    ["number", NUMBER],
    ["keyword", kw("toml")],
  ],
  ini: [
    ["comment", SEMI_COMMENT],
    ["string", DQ],
    ["tag", "^\\[[^\\]\\n]+\\]"],
    ["key", "[\\w.-]+(?=[ \\t]*=)"],
    ["number", NUMBER],
    ["keyword", kw("ini")],
  ],
  xml: [
    ["comment", MARKUP_COMMENT],
    ["string", DQ],
    ["tag", "<\\/?[\\w:.-]+"],
    ["key", "[\\w:.-]+(?==)"],
    ["number", NUMBER],
  ],
  html: [
    ["comment", MARKUP_COMMENT],
    ["string", DQ],
    ["tag", "<\\/?[\\w:.-]+"],
    ["key", "[\\w:.-]+(?==)"],
    ["number", NUMBER],
  ],
  css: [
    ["comment", "\\/\\*[\\s\\S]*?\\*\\/"],
    ["string", STRINGS],
    ["key", "[a-z-]+(?=[ \\t]*:)"],
    ["number", NUMBER],
  ],
  csv: [["string", DQ], ["number", NUMBER]],
  markdown: [["comment", HASH_COMMENT], ["string", STRINGS], ["number", NUMBER]],
};

export const TOKEN_CLASS = {
  comment: "nb-code-comment",
  string: "nb-code-string",
  keyword: "nb-code-keyword",
  number: "nb-code-number",
  tag: "nb-code-tag",
  key: "nb-code-key",
  plain: "",
};

const COMPILED = new Map();

const compile = (language) => {
  if (COMPILED.has(language)) return COMPILED.get(language);
  const rules = (RULES[language] || []).filter(([, source]) => Boolean(source));
  if (!rules.length) {
    const empty = { pattern: null, types: [] };
    COMPILED.set(language, empty);
    return empty;
  }
  const compiled = {
    pattern: new RegExp(rules.map(([, source]) => `(${source})`).join("|"), "gm"),
    types: rules.map(([type]) => type),
  };
  COMPILED.set(language, compiled);
  return compiled;
};

export function tokenize(code = "", language = "plain") {
  const { pattern, types } = compile(language);
  if (!code || !pattern) return [{ text: code, type: "plain" }];
  pattern.lastIndex = 0;

  const parts = [];
  let cursor = 0;
  let match;
  while ((match = pattern.exec(code)) !== null) {
    if (!match[0].length) {
      pattern.lastIndex += 1;
      continue;
    }
    if (match.index > cursor) parts.push({ text: code.slice(cursor, match.index), type: "plain" });
    let type = "plain";
    for (let index = 1; index < match.length; index += 1) {
      if (match[index] !== undefined) {
        type = types[index - 1];
        break;
      }
    }
    parts.push({ text: match[0], type });
    cursor = match.index + match[0].length;
  }
  if (cursor < code.length) parts.push({ text: code.slice(cursor), type: "plain" });
  return parts;
}

export const languageLabel = (id) => LANGUAGES.find((item) => item.id === id)?.label || "Plain text";

export const templateFor = (id) => LANGUAGES.find((item) => item.id === id)?.template || "";