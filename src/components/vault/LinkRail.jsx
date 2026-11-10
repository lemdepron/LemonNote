import { ArrowUpRight, Link2, Plus } from "lucide-react";
import { noteTags, relativeTime, titleKey } from "@/lib/vault";

export default function LinkRail({ outgoing = [], backlinks = [], linkIndex, onOpenNote, onCreateNote }) {
  const handleOpenNote = (noteId, event) => {
    // Ctrl+click (or Cmd+click on Mac) opens in new tab
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      window.open(`/note/${noteId}`, "_blank");
      return;
    }
    onOpenNote(noteId);
  };

  const handleCreateNote = (title, event) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      // For new notes, we can't easily open in new tab without knowing the ID first
      // Fall back to normal behavior
    }
    onCreateNote(title);
  };

  return (
    <aside className="space-y-7 lg:sticky lg:top-24 lg:self-start">
      <section>
        <p className="nb-label">Links out · {outgoing.length}</p>
        <ul className="mt-2.5 space-y-1">
          {outgoing.length === 0 && <li className="text-[12.5px] text-muted-foreground">No links yet.</li>}
          {outgoing.map((title) => {
            const target = linkIndex?.get(titleKey(title));
            return (
              <li key={title}>
                <button
                  type="button"
                  onClick={(e) => (target ? handleOpenNote(target.id, e) : handleCreateNote(title, e))}
                  className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] text-foreground/85 transition hover:bg-accent/70"
                >
                  {target ? (
                    <Link2 className="h-3 w-3 shrink-0 text-[hsl(var(--link))]" />
                  ) : (
                    <Plus className="h-3 w-3 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate">{title}</span>
                  <ArrowUpRight className="ml-auto h-3 w-3 shrink-0 text-muted-foreground/0 transition group-hover:text-muted-foreground" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <p className="nb-label">Backlinks · {backlinks.length}</p>
        <ul className="mt-2.5 space-y-1">
          {backlinks.length === 0 && (
            <li className="text-[12.5px] leading-relaxed text-muted-foreground">Nothing points here yet.</li>
          )}
          {backlinks.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={(e) => handleOpenNote(note.id, e)}
                className="block w-full rounded-md px-2 py-1.5 text-left transition hover:bg-accent/70"
              >
                <span className="flex items-center gap-1.5 text-[13px] text-foreground/85">
                  <span className="truncate">{note.title}</span>
                </span>
                <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">
                  {noteTags(note).length ? noteTags(note).map((tag) => `#${tag}`).join(" ") : relativeTime(note.updated_date)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}