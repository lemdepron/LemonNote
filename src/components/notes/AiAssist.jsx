import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { db } from "@/api/localDb";
import { cn } from "@/lib/utils";

const ACTIONS = [
  { id: "summarize", label: "Summarize" },
  { id: "outline", label: "Outline" },
  { id: "expand", label: "Continue" },
  { id: "tasks", label: "Extract tasks" },
  { id: "tags", label: "Suggest tags" },
];

export default function AiAssist({ title, body, onAppend, onReplace, onClose }) {
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const run = async (action) => {
    setBusy(action);
    setError("");
    setResult("");
    try {
      const response = await db.functions.invoke("assistNote", { action, title, body });
      const text = response?.data?.text || "";
      if (text) setResult(text);
      else setError("The assistant had nothing to add.");
    } catch (err) {
      setError("The assistant is unavailable right now.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="mb-4 rounded-xl border border-border/70 bg-card/40 p-3.5">
      <div className="flex items-center justify-between">
        <span className="nb-label">ai assist · drafts into your note</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close AI assist"
          className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => run(action.id)}
            disabled={Boolean(busy)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition disabled:opacity-50",
              busy === action.id
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/70 text-muted-foreground hover:text-foreground"
            )}
          >
            {busy === action.id && <Loader2 className="h-3 w-3 animate-spin" />}
            {action.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-[12.5px] text-destructive">{error}</p>}

      {result && (
        <>
          <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 font-mono text-[11.5px] leading-relaxed text-foreground/85">
            {result}
          </pre>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                onAppend(result);
                setResult("");
              }}
              className="h-8 rounded-md border border-primary/40 bg-primary/10 px-2.5 text-[12px] text-primary transition hover:bg-primary/15"
            >
              Append to note
            </button>
            <button
              type="button"
              onClick={() => {
                onReplace(result);
                setResult("");
              }}
              className="h-8 rounded-md border border-border/80 px-2.5 text-[12px] text-muted-foreground transition hover:text-foreground"
            >
              Replace body
            </button>
            <button
              type="button"
              onClick={() => setResult("")}
              className="h-8 rounded-md px-2.5 text-[12px] text-muted-foreground transition hover:text-foreground"
            >
              Discard
            </button>
          </div>
        </>
      )}
    </div>
  );
}