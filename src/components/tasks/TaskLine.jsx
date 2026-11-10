import { cn } from "@/lib/utils";
import { TASK_STATES, getDueDateStatus, formatDueDate } from "@/lib/tasks";

const STYLES = {
  TODO: "border-border/80 bg-muted/40 text-muted-foreground",
  DOING: "border-primary/40 bg-primary/10 text-primary",
  DONE: "border-[hsl(var(--link))]/40 bg-[hsl(var(--link))]/10 text-[hsl(var(--link))]",
};

const DUE_STYLES = {
  overdue: "border-destructive/40 bg-destructive/10 text-destructive",
  today: "border-primary/40 bg-primary/10 text-primary",
  "this-week": "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  future: "border-border/40 bg-muted/40 text-muted-foreground",
  "no-date": "",
};

export default function TaskLine({ task, busy, onCycle, onOpen }) {
  const stateLabel = TASK_STATES.find((state) => state.id === task.state)?.label ?? task.state;
  const dueStatus = getDueDateStatus(task.dueDate);
  const dueText = formatDueDate(task.dueDate);

  return (
    <li className="flex items-center gap-3 px-2 py-2.5">
      <button
        type="button"
        onClick={() => onCycle(task)}
        disabled={busy}
        title="Cycle TODO → DOING → DONE"
        className={cn(
          "w-[74px] shrink-0 rounded-md border px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em] transition disabled:opacity-50",
          STYLES[task.state]
        )}
      >
        {stateLabel}
      </button>
      <button
        type="button"
        onClick={() => onOpen(task)}
        className={cn(
          "min-w-0 flex-1 truncate text-left text-[13.5px] transition hover:text-primary",
          task.state === "DONE" ? "text-muted-foreground line-through" : "text-foreground/90"
        )}
      >
        {task.text}
      </button>
      {task.dueDate && (
        <span
          className={cn(
            "shrink-0 rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] transition",
            DUE_STYLES[dueStatus]
          )}
          title={dueText}
        >
          {dueText}
        </span>
      )}
      <span className="hidden max-w-[24ch] shrink-0 truncate font-mono text-[10px] text-muted-foreground sm:block">
        {task.noteTitle}
      </span>
    </li>
  );
}