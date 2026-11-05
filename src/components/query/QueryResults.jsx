import { Link } from "react-router-dom";
import { noteTags, relativeTime, snippet } from "@/lib/vault";
import { wordCount } from "@/lib/query";

function ResultRow({ note, query }) {
  const tags = noteTags(note).slice(0, 3);
  return (
    <li>
      <Link
        to={`/note/${note.id}`}
        className="flex flex-col gap-1 rounded-lg px-2.5 py-2 transition hover:bg-accent/50"
      >
        <span className="flex items-baseline gap-2">
          <span className="min-w-0 flex-1 truncate text-[13.5px] text-foreground">{note.title || "Untitled note"}</span>
          <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/60">
            {wordCount(note)}w · {relativeTime(note.updated_date)}
          </span>
        </span>
        <span className="line-clamp-1 text-[12px] text-muted-foreground">
          {snippet(note.body, "", 130) || "empty note"}
        </span>
        {tags.length > 0 && (
          <span className="flex flex-wrap gap-1 pt-0.5">
            {tags.map((tag) => (
              <span key={tag} className="rounded border border-border/60 px-1.5 font-mono text-[9.5px] text-muted-foreground">
                #{tag}
              </span>
            ))}
          </span>
        )}
      </Link>
    </li>
  );
}

export default function QueryResults({ result, loading, query }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((row) => (
          <div key={row} className="h-14 animate-pulse rounded-lg bg-card/40" />
        ))}
      </div>
    );
  }

  if (!result || result.total === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/70 px-5 py-10 text-center text-[13px] text-muted-foreground">
        Nothing matches this query yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {result.groups.map((group) => (
        <section key={group.key}>
          {result.groups.length > 1 && (
            <div className="mb-1 flex items-baseline gap-2 border-b border-border/50 pb-1">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">{group.key}</span>
              <span className="font-mono text-[9.5px] text-muted-foreground/60">{group.rows.length}</span>
            </div>
          )}
          <ul>
            {group.rows.map((note) => (
              <ResultRow key={note.id} note={note} query={query} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}