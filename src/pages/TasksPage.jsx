import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/api/localDb";
import useVault from "@/hooks/useVault";
import VaultHeader from "@/components/vault/VaultHeader";
import TaskLine from "@/components/tasks/TaskLine";
import { collectTasks, nextState, setTaskState, TASK_STATES } from "@/lib/tasks";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  const { notes, loading, reload } = useVault();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("ALL");
  const [busy, setBusy] = useState(false);

  const tasks = useMemo(() => collectTasks(notes), [notes]);
  const counts = useMemo(
    () =>
      TASK_STATES.reduce((acc, state) => {
        acc[state.id] = tasks.filter((task) => task.state === state.id).length;
        return acc;
      }, {})
    ,
    [tasks]
  );

  const cycle = async (task) => {
    const note = notes.find((item) => item.id === task.noteId);
    if (!note || busy) return;
    setBusy(true);
    const body = setTaskState(note.body, task.line, nextState(task.state));
    await db.entities.Note.update(note.id, { body });
    await reload();
    setBusy(false);
  };

  const groups = TASK_STATES.filter((state) => filter === "ALL" || filter === state.id);

  return (
    <div className="nb-shell min-h-screen">
      <VaultHeader />
      <main className="mx-auto max-w-[900px] px-5 pb-24 pt-10 sm:px-6 lg:px-8">
        <p className="nb-label">Tasks · written as blocks</p>
        <h1 className="mt-3 font-display text-[32px] leading-tight tracking-tight sm:text-[40px]">
          Every task, straight from your notes.
        </h1>
        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-muted-foreground">
          Write <span className="font-mono text-[12px] text-foreground/80">TODO</span>,{" "}
          <span className="font-mono text-[12px] text-foreground/80">DOING</span> or{" "}
          <span className="font-mono text-[12px] text-foreground/80">DONE</span> at the start of any list line —
          click a task here to move it along.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={cn(
              "rounded-md border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition",
              filter === "ALL"
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/70 text-muted-foreground hover:text-foreground"
            )}
          >
            all · {tasks.length}
          </button>
          {TASK_STATES.map((state) => (
            <button
              key={state.id}
              type="button"
              onClick={() => setFilter(state.id)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition",
                filter === state.id
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 text-muted-foreground hover:text-foreground"
              )}
            >
              {state.label} · {counts[state.id] ?? 0}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-6 space-y-2">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="h-11 animate-pulse rounded-lg border border-border/60 bg-card/30" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-border/80 bg-card/20 px-6 py-14 text-center">
            <p className="text-[14px]">No tasks yet.</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Add a line like “- TODO Review the outline” to any note.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {groups.map((state) => {
              const rows = tasks.filter((task) => task.state === state.id);
              if (!rows.length) return null;
              return (
                <section key={state.id}>
                  <h2 className="nb-label">
                    {state.label} · {rows.length}
                  </h2>
                  <ul className="mt-2 divide-y divide-border/50 rounded-xl border border-border/60 bg-card/25">
                    {rows.map((task) => (
                      <TaskLine
                        key={`${task.noteId}-${task.line}-${task.state}`}
                        task={task}
                        busy={busy}
                        onCycle={cycle}
                        onOpen={() => navigate(`/note/${task.noteId}`)}
                      />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}