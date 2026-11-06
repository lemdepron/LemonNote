import { Loader2, PenLine } from "lucide-react";
import InkBoard from "@/components/ink/InkBoard";

/**
 * The drawing area of a note, shown while the Ink tab is open. The pens, colours
 * and paper controls live in the ribbon above it.
 */
export default function NoteInkSurface({ noteInk }) {
  if (noteInk.loading) {
    return <div className="h-[60vh] animate-pulse rounded-xl border border-border/60 bg-card/30" />;
  }

  if (!noteInk.hasPage) {
    return (
      <div className="grid min-h-[40vh] place-items-center rounded-xl border border-dashed border-border/70 bg-card/20 px-6 py-12 text-center">
        <div className="max-w-sm">
          <PenLine className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-3 font-display text-[22px] tracking-tight">No handwriting in this note yet</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Draw, sketch or write by hand on a page that belongs to this note. It saves automatically.
          </p>
          <button
            type="button"
            onClick={noteInk.onStart}
            disabled={noteInk.starting}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {noteInk.starting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Start inking
          </button>
        </div>
      </div>
    );
  }

  const { page } = noteInk;
  return (
    <div>
      <div className="relative flex h-[72vh] min-h-[440px] gap-3">
        <InkBoard {...noteInk.board} autoFit className="min-h-0 flex-1" />
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {noteInk.markCount} marks · {page?.paper?.size === "infinite" ? "infinite" : `page ${noteInk.pageIndex + 1}`} ·{" "}
        {noteInk.status === "saving" ? "saving…" : noteInk.status === "saved" ? "saved" : "autosave on"}
      </p>
    </div>
  );
}
