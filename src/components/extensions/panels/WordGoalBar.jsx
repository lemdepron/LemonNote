import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { readPref, writePref } from "@/lib/preferences";
import { countWords } from "@/lib/note-stats";
import { cn } from "@/lib/utils";

/** Extension banner: a per-note word target with a progress bar under the title. */
export default function WordGoalBar({ note }) {
  const noteKey = note?.id || "draft";
  const storageKey = `plugin:word-goal:${noteKey}`;
  const [goal, setGoal] = useState(() => Number(readPref(storageKey, 0)) || 0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setGoal(Number(readPref(storageKey, 0)) || 0);
    setEditing(false);
    setDraft("");
  }, [storageKey]);

  const words = countWords(note?.body || "");
  const pct = goal > 0 ? Math.min(100, Math.round((words / goal) * 100)) : 0;
  const done = goal > 0 && words >= goal;

  const open = () => {
    setDraft(goal ? String(goal) : "");
    setEditing(true);
  };

  const save = (event) => {
    event.preventDefault();
    const value = Math.max(0, Math.min(100000, Math.round(Number(draft)) || 0));
    writePref(storageKey, value);
    setGoal(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <form
        onSubmit={save}
        className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/[0.06] px-3 py-2"
      >
        <Target className="h-3.5 w-3.5 text-primary" />
        <label htmlFor="word-goal-input" className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          goal
        </label>
        <input
          id="word-goal-input"
          type="number"
          min="0"
          max="100000"
          step="50"
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="500"
          className="h-7 w-20 rounded-md border border-border/70 bg-background/70 px-2 font-mono text-[11px] text-foreground outline-none focus:border-primary/50"
        />
        <span className="font-mono text-[10px] text-muted-foreground">words</span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="submit"
            className="h-7 rounded-md border border-primary/40 bg-primary/10 px-2.5 text-[11.5px] text-primary transition hover:bg-primary/15"
          >
            Save goal
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="h-7 rounded-md border border-border/70 px-2 text-[11.5px] text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-border/60 bg-card/30 px-3 py-2">
      <div className="flex items-center gap-2">
        <Target className={cn("h-3.5 w-3.5", done ? "text-[hsl(var(--link))]" : "text-muted-foreground")} />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">word goal</span>
        {goal > 0 ? (
          <span className="font-mono text-[10.5px] text-foreground/85">
            {words} / {goal} · {pct}%
          </span>
        ) : (
          <span className="text-[11.5px] text-muted-foreground">no target yet</span>
        )}
        <button
          type="button"
          onClick={open}
          className="ml-auto rounded border border-border/70 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          {goal > 0 ? "edit" : "set goal"}
        </button>
      </div>
      {goal > 0 && (
        <>
          <div
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={goal}
            aria-valuenow={Math.min(words, goal)}
            aria-label="Word goal progress"
          >
            <div
              className={cn("h-full rounded-full transition-[width] duration-300 ease-out", done ? "bg-[hsl(var(--link))]" : "bg-primary")}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground/70">
            {done ? "goal reached" : `${Math.max(0, goal - words)} words to go`}
          </p>
        </>
      )}
    </div>
  );
}