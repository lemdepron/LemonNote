import { extractWikiLinks, noteTags, relativeTime } from "@/lib/vault";
import { countWords } from "@/lib/note-stats";

/** Single document panel: the one place words, size, read time, links, tags and dates appear. */
export default function NoteStatsPanel({ note }) {
  const body = note?.body || "";
  const words = countWords(body);
  const counts = [
    ["words", words],
    ["chars", body.length],
    ["read", `${Math.max(1, Math.round(words / 220))} min`],
    ["links", extractWikiLinks(body).length],
    ["tags", noteTags(note || {}).length],
  ];
  const dates = [
    ["created", note?.created_date ? relativeTime(note.created_date) : "—"],
    ["edited", note?.updated_date ? relativeTime(note.updated_date) : "—"],
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-card/30 p-3">
      <p className="nb-label">document</p>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
        {counts.map(([label, value]) => (
          <div key={label} className="flex items-baseline gap-1.5">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-foreground/90">{value}</dd>
          </div>
        ))}
      </dl>
      <dl className="mt-2 space-y-1 border-t border-border/50 pt-2 font-mono text-[11px]">
        {dates.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-foreground/90">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}