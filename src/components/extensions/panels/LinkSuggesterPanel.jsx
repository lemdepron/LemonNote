import { useEffect, useMemo, useState } from "react";
import { Link2 } from "lucide-react";
import { db } from "@/api/localDb";
import PanelShell from "@/components/extensions/PanelShell";
import { titleKey } from "@/lib/vault";

const isWordChar = (value) => Boolean(value) && /[\p{L}\p{N}]/u.test(value);

/** Split on existing wiki-links so nothing is ever nested inside one. */
const segments = (body = "") => String(body).split(/(\[\[[^\]]*\]\])/g);

function countIn(text, title) {
  const lower = text.toLowerCase();
  const needle = title.toLowerCase();
  let count = 0;
  let index = lower.indexOf(needle);
  while (index >= 0) {
    if (!isWordChar(text[index - 1]) && !isWordChar(text[index + needle.length])) count += 1;
    index = lower.indexOf(needle, index + needle.length);
  }
  return count;
}

function linkIn(text, title) {
  const lower = text.toLowerCase();
  const needle = title.toLowerCase();
  let out = "";
  let cursor = 0;
  let index = lower.indexOf(needle);
  while (index >= 0) {
    const bare = !isWordChar(text[index - 1]) && !isWordChar(text[index + needle.length]);
    if (bare) {
      out += `${text.slice(cursor, index)}[[${title}]]`;
      cursor = index + needle.length;
    }
    index = lower.indexOf(needle, index + needle.length);
  }
  return cursor === 0 ? text : out + text.slice(cursor);
}

const linkBody = (body, title) => segments(body).map((part) => (part.startsWith("[[") ? part : linkIn(part, title))).join("");

/** Extension panel: words in the open note that match another note's title. */
export default function LinkSuggesterPanel({ note, onEditBody }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const body = note?.body || "";

  useEffect(() => {
    let active = true;
    db.entities.Note.filter({ trashed: { $ne: true } }, { sort: "-updated_date", limit: 200 })
      .then((page) => {
        if (!active) return;
        setNotes(page?.items ?? []);
        setLoading(false);
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const suggestions = useMemo(() => {
    if (!body) return [];
    const current = titleKey(note?.title || "");
    return notes
      .filter((other) => other.id !== note?.id && titleKey(other.title) !== current)
      .map((other) => {
        const title = (other.title || "").trim();
        if (title.length < 3) return null;
        const count = segments(body).reduce(
          (total, part) => (part.startsWith("[[") ? total : total + countIn(part, title)),
          0
        );
        return count ? { id: other.id, title, count } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [notes, body, note?.id, note?.title]);

  const link = (suggestion) => {
    const linked = segments(body)
      .reduce((total, part) => total + (part.startsWith("[[") ? 0 : countIn(part, suggestion.title)), 0);
    onEditBody?.(linkBody(body, suggestion.title));
    setStatus(`linked ${linked} × ${suggestion.title}`);
  };

  return (
    <PanelShell
      label="link suggester"
      action={
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70">
          {suggestions.length} suggestions
        </span>
      }
    >
      {loading ? (
        <p className="mt-2 text-[12px] text-muted-foreground">Reading the vault…</p>
      ) : suggestions.length === 0 ? (
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          {body.trim() ? "No unlinked note titles in this note." : "Nothing written yet."}
        </p>
      ) : (
        <ul className="mt-2 space-y-1">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] text-foreground/85">
                  <mark className="rounded bg-primary/15 px-1 text-primary">{suggestion.title}</mark>
                </p>
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                  {suggestion.count}× matched
                </p>
              </div>
              <button
                type="button"
                onClick={() => link(suggestion)}
                aria-label={`Link ${suggestion.title}`}
                className="flex items-center gap-1 rounded border border-border/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground transition hover:border-primary/40 hover:text-primary"
              >
                <Link2 className="h-2.5 w-2.5" /> link
              </button>
            </li>
          ))}
        </ul>
      )}
      {status && (
        <p className="mt-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground/80">{status}</p>
      )}
    </PanelShell>
  );
}