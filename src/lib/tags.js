/**
 * Line tags system for LemonNote.
 * Tags are written as {tag:name} at the start of a line.
 * They render as colored icons with tooltips in the editor and reader.
 */

import { CheckSquare, AlertCircle, HelpCircle, Lightbulb, Bookmark, User, MapPin, AlertTriangle } from "lucide-react";

// Built-in tag definitions - single source of truth
export const BUILTIN_TAGS = [
  {
    id: "todo",
    label: "To Do",
    icon: CheckSquare,
    color: "bg-emerald-500 text-emerald-500",
    bgColor: "bg-emerald-500/10 border-emerald-500/30",
    hoverColor: "hover:bg-emerald-500/20",
    shortcut: "Ctrl+1",
    order: 1,
  },
  {
    id: "important",
    label: "Important",
    icon: AlertCircle,
    color: "bg-red-500 text-red-500",
    bgColor: "bg-red-500/10 border-red-500/30",
    hoverColor: "hover:bg-red-500/20",
    shortcut: "Ctrl+2",
    order: 2,
  },
  {
    id: "question",
    label: "Question",
    icon: HelpCircle,
    color: "bg-blue-500 text-blue-500",
    bgColor: "bg-blue-500/10 border-blue-500/30",
    hoverColor: "hover:bg-blue-500/20",
    shortcut: "Ctrl+3",
    order: 3,
  },
  {
    id: "idea",
    label: "Idea",
    icon: Lightbulb,
    color: "bg-amber-500 text-amber-500",
    bgColor: "bg-amber-500/10 border-amber-500/30",
    hoverColor: "hover:bg-amber-500/20",
    shortcut: "Ctrl+4",
    order: 4,
  },
  {
    id: "remember",
    label: "Remember",
    icon: Bookmark,
    color: "bg-purple-500 text-purple-500",
    bgColor: "bg-purple-500/10 border-purple-500/30",
    hoverColor: "hover:bg-purple-500/20",
    shortcut: "Ctrl+5",
    order: 5,
  },
  {
    id: "contact",
    label: "Contact",
    icon: User,
    color: "bg-cyan-500 text-cyan-500",
    bgColor: "bg-cyan-500/10 border-cyan-500/30",
    hoverColor: "hover:bg-cyan-500/20",
    shortcut: "Ctrl+6",
    order: 6,
  },
  {
    id: "address",
    label: "Address",
    icon: MapPin,
    color: "bg-orange-500 text-orange-500",
    bgColor: "bg-orange-500/10 border-orange-500/30",
    hoverColor: "hover:bg-orange-500/20",
    shortcut: "Ctrl+7",
    order: 7,
  },
  {
    id: "critical",
    label: "Critical",
    icon: AlertTriangle,
    color: "bg-rose-600 text-rose-600",
    bgColor: "bg-rose-600/10 border-rose-600/30",
    hoverColor: "hover:bg-rose-600/20",
    shortcut: "Ctrl+8",
    order: 8,
  },
];

// Map for quick lookup
export const TAG_MAP = Object.fromEntries(BUILTIN_TAGS.map((tag) => [tag.id, tag]));

/**
 * Regex to match a line tag at the start of a line (after optional whitespace).
 * Format: {tag:name} where name is alphanumeric with hyphens/underscores
 */
const LINE_TAG_RE = /^(\s*)\{tag:([a-zA-Z][a-zA-Z0-9_-]*)\}/;

/**
 * Extract the tag from a line if it starts with a line tag.
 * Returns { tagId, restOfLine, leadingWhitespace } or null.
 */
export function extractLineTag(line) {
  const match = LINE_TAG_RE.exec(line);
  if (!match) return null;
  const [, leading, tagId] = match;
  const rest = line.slice(match[0].length);
  return { tagId: tagId.toLowerCase(), rest, leading };
}

/**
 * Check if a line has a line tag (any tag, not just built-in).
 */
export function hasLineTag(line) {
  return LINE_TAG_RE.test(line);
}

/**
 * Get the built-in tag definition for a tag ID, or a generic one for custom tags.
 */
export function getTagDef(tagId) {
  const normalized = String(tagId || "").toLowerCase();
  return TAG_MAP[normalized] || {
    id: normalized,
    label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
    icon: null,
    color: "text-muted-foreground",
    bgColor: "bg-muted/30 border-border/50",
    hoverColor: "hover:bg-muted/50",
    shortcut: null,
    order: 99,
    custom: true,
  };
}

/**
 * Build a line tag marker string: {tag:name}
 */
export function buildLineTag(tagId) {
  return `{tag:${tagId.toLowerCase()}}`;
}

/**
 * Helper to map lines in a selection - copied from format-actions to avoid circular imports.
 */
function mapLines(selection, transform) {
  const { value } = selection;
  const { from, to, text } = lineRange(selection);
  const lines = text.split("\n");
  const out = transform(lines);
  if (!out) return null;
  const joined = out.join("\n");
  return { next: `${value.slice(0, from)}${joined}${value.slice(to)}`, start: from, end: to, text: joined, caret: from + joined.length, select: [from, from + joined.length] };
}

function lineStart(value, index) {
  const at = value.lastIndexOf("\n", index - 1);
  return at === -1 ? 0 : at + 1;
}
function lineEnd(value, index) {
  const at = value.indexOf("\n", index);
  return at === -1 ? value.length : at;
}
function lineRange(selection) {
  const { value, start, end } = selection;
  const from = lineStart(value, start);
  const to = lineEnd(value, end > start && value[end - 1] === "\n" ? end - 1 : end);
  return { from, to, text: value.slice(from, to) };
}

/**
 * Toggle a line tag on the selection (add if not present, remove if present).
 * Works on the whole note when caret is collapsed, or on selected lines.
 * Returns an edit object for the editor bridge, or null if no change.
 */
export function toggleLineTag(selection, tagId) {
  const { value, start, end } = selection;
  const normalizedTag = String(tagId).toLowerCase();
  const marker = buildLineTag(normalizedTag);

  // Determine scope: whole note if caret collapsed, otherwise selected lines
  const scope = start === end ? { value, start: 0, end: value.length } : selection;

  return mapLines(scope, (lines) => {
    return lines.map((line) => {
      const extracted = extractLineTag(line);
      if (extracted && extracted.tagId === normalizedTag) {
        // Tag exists - remove it
        return extracted.leading + extracted.rest;
      } else if (!extracted || extracted.tagId !== normalizedTag) {
        // Tag doesn't exist or different tag - add/replace at start of line (after leading whitespace)
        const leadingMatch = /^(\s*)/.exec(line);
        const leading = leadingMatch ? leadingMatch[1] : "";
        const rest = line.slice(leading.length);
        // Remove any existing line tag first
        const withoutTag = rest.replace(LINE_TAG_RE, "");
        return leading + marker + " " + withoutTag;
      }
      return line;
    });
  });
}

/**
 * Remove all line tags from the selection (or whole note if caret collapsed).
 */
export function clearLineTags(selection) {
  const { value, start, end } = selection;
  const scope = start === end ? { value, start: 0, end: value.length } : selection;

  return mapLines(scope, (lines) => {
    return lines.map((line) => line.replace(LINE_TAG_RE, "$1"));
  });
}

/**
 * Get all unique line tag IDs used in a note body.
 */
export function getLineTagsInNote(body) {
  const tags = new Set();
  const lines = String(body || "").split("\n");
  for (const line of lines) {
    const extracted = extractLineTag(line);
    if (extracted) tags.add(extracted.tagId);
  }
  return [...tags].sort();
}

/**
 * Scan all notes in the vault and collect every tagged line.
 * Returns array of { noteId, noteTitle, tagId, tagLabel, lineNumber, lineText, created_date, updated_date }
 */
export function findAllTaggedLines(notes) {
  const results = [];
  for (const note of notes || []) {
    if (note.trashed) continue;
    const lines = String(note.body || "").split("\n");
    for (let i = 0; i < lines.length; i++) {
      const extracted = extractLineTag(lines[i]);
      if (extracted) {
        const tagDef = getTagDef(extracted.tagId);
        results.push({
          noteId: note.id,
          noteTitle: note.title || "Untitled",
          tagId: extracted.tagId,
          tagLabel: tagDef.label,
          tagIcon: tagDef.icon,
          tagColor: tagDef.color,
          tagBgColor: tagDef.bgColor,
          lineNumber: i + 1,
          lineText: extracted.rest.trim(),
          created_date: note.created_date,
          updated_date: note.updated_date,
        });
      }
    }
  }
  // Sort by tag, then by note update date (newest first)
  return results.sort((a, b) => {
    const tagOrder = (getTagDef(a.tagId).order || 99) - (getTagDef(b.tagId).order || 99);
    if (tagOrder !== 0) return tagOrder;
    return new Date(b.updated_date || 0) - new Date(a.updated_date || 0);
  });
}

/**
 * Filter tagged lines by tag ID, date range, and search query.
 */
export function filterTaggedLines(lines, { tagId, dateRange, query } = {}) {
  let result = lines;
  if (tagId) {
    result = result.filter((l) => l.tagId === tagId);
  }
  if (dateRange) {
    const now = Date.now();
    const days = { today: 1, week: 7, month: 30 }[dateRange] || 0;
    if (days) {
      const cutoff = now - days * 24 * 60 * 60 * 1000;
      result = result.filter((l) => new Date(l.updated_date || 0).getTime() >= cutoff);
    }
  }
  if (query) {
    const q = query.toLowerCase();
    result = result.filter(
      (l) =>
        l.noteTitle.toLowerCase().includes(q) ||
        l.lineText.toLowerCase().includes(q)
    );
  }
  return result;
}

