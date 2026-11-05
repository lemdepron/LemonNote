import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import { noteTags, relativeTime, snippet } from "@/lib/vault";
import Highlight from "@/components/vault/Highlight";

export default function SearchResults({ query, results, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((row) => (
          <div key={row} className="h-[74px] animate-pulse rounded-xl border border-border/60 bg-card/30" />
        ))}
      </div>
    );
  }

  if (!results?.length) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-card/20 px-6 py-12 text-center">
        <SearchX className="mx-auto h-5 w-5 text-muted-foreground" />
        <p className="mt-3 text-[14px] text-foreground">No note mentions “{query}”.</p>
        <p className="mt-1 text-[13px] text-muted-foreground">Start one with this title and the vault grows.</p>
        <Link
          to={`/note/new?title=${encodeURIComponent(query)}`}
          className="mt-4 inline-flex items-center rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-[13px] text-primary transition hover:bg-primary/15"
        >
          Create “{query}”
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {results.map((note) => (
        <li key={note.id}>
          <Link to={`/note/${note.id}`} className="group block rounded-lg px-2 py-3.5 transition hover:bg-card/50">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-[14.5px] font-medium tracking-tight text-foreground">
                <Highlight text={note.title || "Untitled note"} query={query} />
              </h3>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                {relativeTime(note.updated_date)}
              </span>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              <Highlight text={snippet(note.body, query, 190)} query={query} />
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {noteTags(note)
                .slice(0, 4)
                .map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-border/70 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}