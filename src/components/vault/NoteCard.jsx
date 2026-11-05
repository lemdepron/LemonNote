import { Link } from "react-router-dom";
import { noteTags, noteLinks, relativeTime, snippet } from "@/lib/vault";

export default function NoteCard({ note }) {
  const tags = noteTags(note);
  const links = noteLinks(note).length;

  return (
    <Link
      to={`/note/${note.id}`}
      className="group flex h-full flex-col rounded-xl border border-border/70 bg-card/40 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-lg hover:shadow-[hsl(var(--shadow)/0.2)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-medium leading-snug tracking-tight text-foreground">
          {note.title || "Untitled note"}
        </h3>
        <span className="mt-0.5 shrink-0 font-mono text-[10px] text-muted-foreground">
          {relativeTime(note.updated_date)}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
        {snippet(note.body, "", 150) || "Empty note"}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
        {tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-border/70 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
          >
            #{tag}
          </span>
        ))}
        {links > 0 && (
          <span className="ml-auto font-mono text-[10px] text-muted-foreground/70">{links} links</span>
        )}
      </div>
    </Link>
  );
}