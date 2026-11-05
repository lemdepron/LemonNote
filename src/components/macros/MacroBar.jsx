import { useEffect, useRef, useState } from "react";
import { Circle, Play, Trash2 } from "lucide-react";
import { readPref, writePref } from "@/lib/preferences";
import { applyMacro, appendStep, captureStep, createMacro, describeMacro } from "@/lib/macros";
import { cn } from "@/lib/utils";

const MACRO_KEY = "macros";

export default function MacroBar({ body, onChange }) {
  const [macros, setMacros] = useState(() => readPref(MACRO_KEY, []));
  const [recording, setRecording] = useState(false);
  const [steps, setSteps] = useState([]);
  const [name, setName] = useState("");
  const snapshot = useRef(body);

  useEffect(() => {
    if (!recording) return;
    if (body === snapshot.current) return;
    setSteps((current) => appendStep(current, captureStep(snapshot.current, body)));
    snapshot.current = body;
  }, [body, recording]);

  const start = () => {
    snapshot.current = body;
    setSteps([]);
    setRecording(true);
  };

  const persist = (next) => {
    setMacros(next);
    writePref(MACRO_KEY, next);
  };

  const stop = () => {
    setRecording(false);
    if (!steps.length) return;
    persist([createMacro(name, steps), ...macros].slice(0, 30));
    setSteps([]);
    setName("");
  };

  const remove = (id) => persist(macros.filter((macro) => macro.id !== id));

  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-card/30 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="nb-label">macros</span>

        {recording ? (
          <>
            <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-primary">
              <Circle className="h-2.5 w-2.5 animate-pulse fill-current" />
              recording · {steps.length} step{steps.length === 1 ? "" : "s"}
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="macro name"
              aria-label="Macro name"
              className="h-7 w-32 rounded-md border border-border/70 bg-background/40 px-2 font-mono text-[11px] text-foreground outline-none focus:border-primary/40"
            />
            <button
              type="button"
              onClick={stop}
              disabled={!steps.length}
              className="h-7 rounded-md border border-primary/40 bg-primary/10 px-2.5 font-mono text-[10.5px] text-primary transition hover:bg-primary/15 disabled:opacity-40"
            >
              save macro
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={start}
              className="flex h-7 items-center gap-1.5 rounded-md border border-border/70 px-2.5 font-mono text-[10.5px] text-muted-foreground transition hover:border-primary/40 hover:text-primary"
            >
              <Circle className="h-2.5 w-2.5" />
              record
            </button>
            {macros.length === 0 && (
              <span className="text-[11.5px] text-muted-foreground">
                Record edits, then replay them as a batch transformation.
              </span>
            )}
          </>
        )}

        {macros.length > 0 && (
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {macros.map((macro) => (
              <span
                key={macro.id}
                className={cn(
                  "group flex items-center gap-1 rounded-md border border-border/70 bg-background/40 py-0.5 pl-2 pr-1"
                )}
                title={describeMacro(macro)}
              >
                <button
                  type="button"
                  onClick={() => onChange(applyMacro(body, macro.steps))}
                  className="flex items-center gap-1 font-mono text-[10.5px] text-foreground/85 transition hover:text-primary"
                  title="Replay on this note"
                >
                  <Play className="h-2.5 w-2.5" />
                  {macro.name}
                </button>
                <button
                  type="button"
                  onClick={() => remove(macro.id)}
                  aria-label={`Delete ${macro.name}`}
                  className="text-muted-foreground/60 transition hover:text-destructive"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}