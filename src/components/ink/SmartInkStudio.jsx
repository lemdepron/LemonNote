import { useState } from "react";
import { Loader2, ScanText, Search, Sigma, Type } from "lucide-react";
import { Section } from "@/components/ink/StudioSection";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

export default function SmartInkStudio({ recognition, onRecognize, onInsert, search, onSearch, matches, searching, onOpenPage }) {
  const [draft, setDraft] = useState(search || "");
  const busy = Boolean(recognition.busy);
  const result = recognition.mode === "math" ? recognition.latex : recognition.text;

  return (
    <div className="space-y-4">
      <Section label="Recognise ink" hint="Uses the lasso selection when there is one, otherwise the page in view.">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onRecognize("text")}
            disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-md border border-border/60 px-2 py-1.5 font-mono text-[10px] text-foreground/90 transition hover:border-primary/50 hover:text-primary disabled:opacity-40"
          >
            {recognition.busy === "text" ? <Loader2 className="h-3 w-3 animate-spin" /> : <ScanText className="h-3 w-3" />}
            handwriting
          </button>
          <button
            type="button"
            onClick={() => onRecognize("math")}
            disabled={busy}
            className="flex items-center justify-center gap-1.5 rounded-md border border-border/60 px-2 py-1.5 font-mono text-[10px] text-foreground/90 transition hover:border-primary/50 hover:text-primary disabled:opacity-40"
          >
            {recognition.busy === "math" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sigma className="h-3 w-3" />}
            equation
          </button>
        </div>

        {recognition.error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5 font-mono text-[9.5px] text-destructive">
            {recognition.error}
          </p>
        ) : null}

        {result ? (
          <div className="space-y-1.5">
            <div className="max-h-40 overflow-y-auto rounded-md border border-border/70 bg-background/60 px-2 py-1.5">
              <p className="whitespace-pre-wrap break-words font-mono text-[10.5px] leading-relaxed text-foreground/90">
                {result}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onInsert(result)}
                className="flex items-center gap-1 rounded-md border border-primary/50 bg-primary/15 px-2 py-1 font-mono text-[10px] text-primary transition hover:bg-primary/25"
              >
                <Type className="h-3 w-3" /> insert as text
              </button>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard?.writeText(result);
                  toast.success("Copied to clipboard.");
                }}
                className="rounded-md border border-border/60 px-2 py-1 font-mono text-[10px] text-muted-foreground transition hover:text-foreground"
              >
                copy
              </button>
            </div>
          </div>
        ) : null}
      </Section>

      <Section label="Ink-to-text" hint="Recognised handwriting is indexed on the page, so search reaches every notebook.">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSearch(draft);
          }}
          className="flex items-center gap-1"
        >
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="search handwriting"
              aria-label="Search handwriting"
              className="h-8 w-full rounded-md border border-border/70 bg-card/60 pl-7 pr-2 font-mono text-[10.5px] text-foreground outline-none transition focus:border-primary/40"
            />
          </div>
          <button
            type="submit"
            className="grid h-8 w-8 place-items-center rounded-md border border-border/60 text-muted-foreground transition hover:text-foreground"
            aria-label="Run handwriting search"
          >
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          </button>
        </form>

        {matches?.length ? (
          <ul className="space-y-1">
            {matches.map((match) => (
              <li key={match.id}>
                <button
                  type="button"
                  onClick={() => onOpenPage(match.id)}
                  className={cn(
                    "w-full rounded-md border border-border/50 px-2 py-1.5 text-left transition hover:border-primary/40 hover:bg-card/60"
                  )}
                >
                  <span className="block truncate text-[11px] text-foreground/90">{match.name || "Untitled page"}</span>
                  <span className="mt-0.5 block truncate font-mono text-[9px] text-muted-foreground">
                    {(match.ocrText || "").slice(0, 90)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : search && !searching ? (
          <p className="font-mono text-[9.5px] text-muted-foreground">no indexed pages matched</p>
        ) : null}
      </Section>
    </div>
  );
}