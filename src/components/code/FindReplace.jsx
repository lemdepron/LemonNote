import { useState } from "react";
import { X } from "lucide-react";

export default function FindReplace({ body, onChange, onClose }) {
  const [find, setFind] = useState("");
  const [replacement, setReplacement] = useState("");

  const matches = find ? body.split(find).length - 1 : 0;

  const replaceFirst = () => {
    if (!find) return;
    const at = body.indexOf(find);
    if (at < 0) return;
    onChange(body.slice(0, at) + replacement + body.slice(at + find.length));
  };

  const replaceAll = () => {
    if (!find) return;
    onChange(body.split(find).join(replacement));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card/40 px-2.5 py-2">
      <input
        value={find}
        onChange={(event) => setFind(event.target.value)}
        placeholder="Find"
        aria-label="Find"
        className="h-8 min-w-0 flex-1 rounded-md border border-border/70 bg-background/60 px-2 font-mono text-[12px] outline-none transition focus:border-primary/40"
      />
      <input
        value={replacement}
        onChange={(event) => setReplacement(event.target.value)}
        placeholder="Replace with"
        aria-label="Replace with"
        className="h-8 min-w-0 flex-1 rounded-md border border-border/70 bg-background/60 px-2 font-mono text-[12px] outline-none transition focus:border-primary/40"
      />
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        {find ? `${matches} match${matches === 1 ? "" : "es"}` : "ready"}
      </span>
      <button
        type="button"
        onClick={replaceFirst}
        disabled={!matches}
        className="h-8 shrink-0 rounded-md border border-border/70 px-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:text-foreground disabled:opacity-40"
      >
        replace
      </button>
      <button
        type="button"
        onClick={replaceAll}
        disabled={!matches}
        className="h-8 shrink-0 rounded-md border border-border/70 px-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:text-foreground disabled:opacity-40"
      >
        all
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close find and replace"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}