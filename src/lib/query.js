import { extractWikiLinks, noteTags, plainText } from "./vault";

/**
 * A small dynamic query engine over the vault.
 *
 *   tag:basics -tag:roadmap           field filters (AND, `-` negates, ` OR ` unions)
 *   title:rust  body~/(async|await)/  substring and regex matching
 *   words>200  links<2                numeric comparisons
 *   updated<30d                       relative dates (d, w, m, y)
 *   sort:-created limit:40 group:tag  directives
 */

const DAY = 86400000;

export const QUERY_EXAMPLES = [
  "tag:basics -tag:roadmap",
  "words>120 sort:title",
  '"spaced repetition" OR tag:basics',
  "links>1 group:updated sort:-created",
];

export const wordCount = (note) => {
  const text = plainText(note?.body || "");
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
};

const lower = (value) => String(value ?? "").toLowerCase();

const NUMERIC_FIELDS = {
  words: wordCount,
  links: (note) => extractWikiLinks(note?.body || "").length,
  tags: (note) => noteTags(note).length,
  chars: (note) => (note?.body || "").length,
};

const DATE_FIELDS = {
  updated: (note) => note?.updated_date,
  created: (note) => note?.created_date,
};

const TEXT_FIELDS = {
  title: (note) => lower(note?.title),
  body: (note) => lower(note?.body),
  text: (note) => `${lower(note?.title)} ${lower(note?.body)}`,
};

function parseMoment(raw) {
  const relative = /^(\d+)([dwmy])$/i.exec(raw);
  if (relative) {
    const units = { d: 1, w: 7, m: 30, y: 365 };
    return Date.now() - Number(relative[1]) * units[relative[2].toLowerCase()] * DAY;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function compare(op, left, right) {
  if (op === ">" || op === ">=") return op === ">" ? left > right : left >= right;
  if (op === "<" || op === "<=") return op === "<" ? left < right : left <= right;
  return left === right;
}

function tokenize(input) {
  const tokens = [];
  const re = /"([^"]*)"|(\S+)/g;
  let match;
  while ((match = re.exec(input)) !== null) {
    if (match[1] !== undefined) tokens.push({ text: match[1], phrase: true });
    else if (match[2]) tokens.push({ text: match[2], phrase: false });
  }
  return tokens;
}

function normalizeSort(value) {
  const trimmed = String(value || "").trim().toLowerCase();
  if (!trimmed) return null;
  const descending = trimmed.startsWith("-");
  const raw = descending ? trimmed.slice(1) : trimmed;
  const map = {
    updated: "updated_date",
    updated_date: "updated_date",
    created: "created_date",
    created_date: "created_date",
    title: "title",
    words: "words",
    links: "links",
  };
  const key = map[raw];
  if (!key) return null;
  return { sortBy: key, sortDir: descending ? "desc" : "asc" };
}

function buildPredicate(field, op, rawValue, errors) {
  const value = rawValue.trim();
  if (!value) return null;

  if (op === "~") {
    const literal = /^\/(.*)\/([a-z]*)$/.exec(value);
    const pattern = literal ? literal[1] : value;
    const flags = literal ? literal[2].replace(/[^imsu]/g, "") : "i";
    let regex;
    try {
      regex = new RegExp(pattern, flags);
    } catch {
      errors.push(`Invalid pattern “${value}”`);
      return null;
    }
    const read =
      field === "tag"
        ? (note) => noteTags(note).join(" ")
        : TEXT_FIELDS[field] || TEXT_FIELDS.body;
    return (note) => regex.test(String(read(note) ?? ""));
  }

  if (field === "tag") {
    const needle = lower(value);
    return (note) => noteTags(note).some((tag) => tag.includes(needle));
  }

  if (field === "has") {
    const needle = lower(value);
    if (needle === "links") return (note) => extractWikiLinks(note?.body || "").length > 0;
    if (needle === "tags") return (note) => noteTags(note).length > 0;
    errors.push(`Unknown filter has:${value}`);
    return null;
  }

  if (NUMERIC_FIELDS[field]) {
    const target = Number(value);
    if (!Number.isFinite(target)) {
      errors.push(`“${value}” is not a number (${field})`);
      return null;
    }
    const read = NUMERIC_FIELDS[field];
    const comparator = op === "=" || !op ? "=" : op;
    return (note) => compare(comparator, read(note), target);
  }

  if (DATE_FIELDS[field]) {
    const target = parseMoment(value);
    if (target === null) {
      errors.push(`“${value}” is not a date (${field})`);
      return null;
    }
    const read = DATE_FIELDS[field];
    const comparator = op === "=" || !op ? ">=" : op;
    return (note) => {
      const stamp = new Date(read(note) || 0).getTime();
      if (!stamp) return false;
      return compare(comparator, stamp, target);
    };
  }

  if (TEXT_FIELDS[field]) {
    const needle = lower(value);
    const read = TEXT_FIELDS[field];
    return (note) => String(read(note) ?? "").includes(needle);
  }

  return null;
}

function parseToken(token, errors) {
  let text = token.text;
  let negate = false;
  if (!token.phrase && text.startsWith("-") && text.length > 1) {
    negate = true;
    text = text.slice(1);
  }

  const directive = /^(sort|limit|group):(.+)$/i.exec(text);
  if (directive) {
    const key = directive[1].toLowerCase();
    if (key === "limit") {
      const value = Math.min(300, Math.max(1, Number(directive[2]) || 60));
      return { directive: { key, value } };
    }
    if (key === "sort") {
      const value = normalizeSort(directive[2]);
      return value ? { directive: { key, value } } : null;
    }
    return { directive: { key, value: directive[2].toLowerCase() } };
  }

  const fielded = /^([a-z_]+):(.+)$/i.exec(text);
  if (fielded) {
    const predicate = buildPredicate(fielded[1].toLowerCase(), "=", fielded[2], errors);
    if (!predicate) return null;
    return { negate, predicate, label: text };
  }

  const parsed = /^([a-z_]+)(>=|<=|>|<|=|~)(.+)$/i.exec(text);
  if (parsed) {
    const predicate = buildPredicate(parsed[1].toLowerCase(), parsed[2], parsed[3], errors);
    if (!predicate) return null;
    return { negate, predicate, label: text };
  }

  const plain = buildPredicate("text", "=", token.text.replace(/^#/, ""), errors);
  if (!plain) return null;
  return { negate, predicate: plain, label: token.text };
}

export function parseQuery(input = "") {
  const errors = [];
  const groups = [];
  const settings = { sortBy: "updated_date", sortDir: "desc", limit: 60, group: "none" };

  String(input)
    .split(/\s+OR\s+/i)
    .forEach((segment) => {
      const clauses = [];
      tokenize(segment).forEach((token) => {
        const parsed = parseToken(token, errors);
        if (!parsed) return;
        if (parsed.directive) {
          if (parsed.directive.key === "sort") Object.assign(settings, parsed.directive.value);
          else settings[parsed.directive.key] = parsed.directive.value;
          return;
        }
        clauses.push(parsed);
      });
      if (clauses.length) groups.push(clauses);
    });

  return { ...settings, groups, errors, empty: groups.length === 0 };
}

const SORTERS = {
  updated_date: (note) => new Date(note?.updated_date || 0).getTime(),
  created_date: (note) => new Date(note?.created_date || 0).getTime(),
  title: (note) => lower(note?.title),
  words: wordCount,
  links: (note) => extractWikiLinks(note?.body || "").length,
};

const groupKey = (note, mode) => {
  if (mode === "tag") return noteTags(note)[0] || "untagged";
  if (mode === "updated" || mode === "created") {
    const source = mode === "updated" ? note.updated_date : note.created_date;
    const date = new Date(source || 0);
    if (Number.isNaN(date.getTime())) return "undated";
    return date.toISOString().slice(0, 10);
  }
  return "all";
};

export function runQuery(notes = [], parsed) {
  if (!parsed) return { rows: [], groups: [], total: 0 };

  const matched =
    parsed.groups.length === 0
      ? parsed.errors.length
        ? []
        : [...notes]
      : notes.filter((note) =>
          parsed.groups.some((group) =>
            group.every((clause) => {
              const hit = clause.predicate(note);
              return clause.negate ? !hit : hit;
            })
          )
        );

  const read = SORTERS[parsed.sortBy] || SORTERS.updated_date;
  const direction = parsed.sortDir === "asc" ? 1 : -1;
  matched.sort((a, b) => {
    const left = read(a);
    const right = read(b);
    if (left === right) return 0;
    return left > right ? direction : -direction;
  });

  const rows = matched.slice(0, parsed.limit);
  if (parsed.group === "none") {
    return { rows, groups: rows.length ? [{ key: "results", rows }] : [], total: matched.length };
  }

  const buckets = new Map();
  rows.forEach((note) => {
    const key = groupKey(note, parsed.group);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(note);
  });

  const groups = [...buckets.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, list]) => ({ key, rows: list }));

  return { rows, groups, total: matched.length };
}