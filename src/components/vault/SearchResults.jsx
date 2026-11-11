import { useNavigate } from "react-router-dom";
import { SearchX, Trash2, RotateCcw } from "lucide-react";
import { noteTags, relativeTime, snippet } from "@/lib/vault";
import Highlight from "@/components/vault/Highlight";
import { restoreNote } from "@/lib/notes";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export default function SearchResults({ query, results, loading, onRestore }) {
  const { t, localDigits } = useI18n();
  const navigate = useNavigate();

  const handleNoteClick = (noteId, event) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      window.open(`/note/${noteId}`, "_blank");
      return;
    }
    navigate(`/note/${noteId}`);
  };

  const handleRestore = async (event, noteId, title) => {
    event.stopPropagation();
    event.preventDefault();
    await restoreNote(noteId);
    toast.success(t("vault.trash.toastRestored", { title: title || t("common.untitledNote") }));
    if (onRestore) onRestore(noteId);
  };

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
        <p className="mt-3 text-[14px] text-foreground">{t("vault.search.noNoteMentions", { query })}</p>
        <p className="mt-1 text-[13px] text-muted-foreground">{t("vault.search.startWithTitle")}</p>
        <button
          type="button"
          onClick={() => navigate(`/note/new?title=${encodeURIComponent(query)}`)}
          className="mt-4 inline-flex items-center rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-[13px] text-primary transition hover:bg-primary/15"
        >
          {t("vault.search.createNote", { query })}
        </button>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {results.map((note) => (
        <li key={note.id}>
          <button
            type="button"
            onClick={(e) => handleNoteClick(note.id, e)}
            className={cn(
              "group block w-full rounded-lg px-2 py-3.5 transition hover:bg-card/50 text-start",
              note.trashed && "bg-destructive/5 border-destructive/20"
            )}
          >
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-[14.5px] font-medium tracking-tight text-foreground">
                <Highlight text={note.title || t("common.untitledNote")} query={query} />
                {note.trashed && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded bg-destructive/10 px-1.5 py-0.5 font-mono text-[9px] text-destructive" dir="auto">
                    <Trash2 className="h-2.5 w-2.5" /> {t("vault.search.bin")}
                  </span>
                )}
              </h3>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground" dir="auto">
                {localDigits(relativeTime(note.updated_date))}
              </span>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              <Highlight text={snippet(note.body, query, 190)} query={query} />
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {noteTags(note)
                .slice(0, 4)
                .map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-border/70 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                    dir="auto"
                  >
                    #{tag}
                  </span>
                ))}
              {note.trashed && (
                <button
                  type="button"
                  onClick={(e) => handleRestore(e, note.id, note.title)}
                  className="ml-auto flex h-6 items-center gap-1 rounded border border-destructive/50 bg-destructive/10 px-2 font-mono text-[10px] text-destructive transition hover:bg-destructive/20"
                >
                  <RotateCcw className="h-3 w-3" />
                  {t("vault.trash.restoreButton")}
                </button>
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}