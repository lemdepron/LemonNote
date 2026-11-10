import { useNavigate } from "react-router-dom";
import { Star as StarFilled } from "lucide-react";
import { noteTags, noteLinks, relativeTime, snippet } from "@/lib/vault";
import { useI18n } from "@/lib/i18n";

export default function NoteCard({ note }) {
  const { localDigits } = useI18n();
  const navigate = useNavigate();
  const tags = noteTags(note);
  const links = noteLinks(note).length;
  const isFavourite = note.favourite;

  const handleClick = (event) => {
    // Ctrl+click (or Cmd+click on Mac) opens in new tab
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      window.open(`/note/${note.id}`, "_blank");
      return;
    }
    navigate(`/note/${note.id}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group flex h-full flex-col rounded-xl border border-border/70 bg-card/40 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-lg hover:shadow-[hsl(var(--shadow)/0.2)] text-start"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-medium leading-snug tracking-tight text-foreground">
          {note.title || "Untitled note"}
        </h3>
        <div className="flex items-center gap-1.5">
          {isFavourite && (
            <StarFilled className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" aria-label="Favourite" />
          )}
          <span className="mt-0.5 shrink-0 font-mono text-[10px] text-muted-foreground">
            {localDigits(relativeTime(note.updated_date))}
          </span>
        </div>
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
          <span className="ms-auto font-mono text-[10px] text-muted-foreground/70">{localDigits(links)} links</span>
        )}
      </div>
    </button>
  );
}