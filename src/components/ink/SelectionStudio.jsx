import { useEffect, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Trash2, X } from "lucide-react";
import { Section, Slider } from "@/components/ink/StudioSection";

const NUDGE = 12;

export default function SelectionStudio({ selection, color, alpha, onTransform, onCommit, onRecolor, onDelete, onClear }) {
  const [draft, setDraft] = useState({ dx: 0, dy: 0, scale: 1, rotate: 0 });
  const count = selection.ids.length;

  useEffect(() => {
    setDraft({ dx: 0, dy: 0, scale: 1, rotate: 0 });
  }, [count]);

  if (!count) {
    return (
      <Section label="Vector lasso" hint="Switch to the lasso tool and circle any ink to move, scale, rotate or recolour it.">
        <p className="rounded-lg border border-dashed border-border/70 px-2 py-3 font-mono text-[9.5px] text-muted-foreground">
          nothing selected
        </p>
      </Section>
    );
  }

  const update = (patch) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    onTransform(next);
  };

  return (
    <div className="space-y-4">
      <Section label={`${count} stroke${count === 1 ? "" : "s"} selected`}>
        <div className="grid grid-cols-3 gap-1">
          <span />
          <button type="button" onClick={() => update({ dy: draft.dy - NUDGE })} aria-label="Move up" className="grid h-7 place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-foreground">
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <span />
          <button type="button" onClick={() => update({ dx: draft.dx - NUDGE })} aria-label="Move left" className="grid h-7 place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => update({ dx: 0, dy: 0, scale: 1, rotate: 0 })} aria-label="Reset transform" className="grid h-7 place-items-center rounded-md border border-border/60 font-mono text-[9px] text-muted-foreground hover:text-foreground">
            0
          </button>
          <button type="button" onClick={() => update({ dx: draft.dx + NUDGE })} aria-label="Move right" className="grid h-7 place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <span />
          <button type="button" onClick={() => update({ dy: draft.dy + NUDGE })} aria-label="Move down" className="grid h-7 place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-foreground">
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <span />
        </div>
        <Slider label="scale" value={Math.round(draft.scale * 100)} min={30} max={250} onChange={(value) => update({ scale: value / 100 })} display={`${Math.round(draft.scale * 100)}%`} />
        <Slider label="rotate" value={draft.rotate} min={-180} max={180} onChange={(rotate) => update({ rotate })} display={`${draft.rotate}°`} />
      </Section>

      <Section label="Actions">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => {
              onCommit();
              setDraft({ dx: 0, dy: 0, scale: 1, rotate: 0 });
            }}
            className="flex items-center justify-center gap-1 rounded-md border border-primary/50 bg-primary/15 px-2 py-1.5 font-mono text-[10px] text-primary transition hover:bg-primary/25"
          >
            <Check className="h-3 w-3" /> apply
          </button>
          <button
            type="button"
            onClick={onRecolor}
            className="flex items-center gap-1.5 rounded-md border border-border/60 px-2 py-1.5 text-left transition hover:border-border"
            title="Recolour selection with the current ink colour"
          >
            <span className="h-3.5 w-3.5 rounded-full border border-foreground/30" style={{ background: color, opacity: Math.max(0.3, alpha) }} />
            <span className="font-mono text-[10px] text-muted-foreground">recolour</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center justify-center gap-1 rounded-md border border-border/60 px-2 py-1.5 font-mono text-[10px] text-muted-foreground transition hover:border-destructive/50 hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" /> delete
          </button>
          <button
            type="button"
            onClick={onClear}
            className="flex items-center justify-center gap-1 rounded-md border border-border/60 px-2 py-1.5 font-mono text-[10px] text-muted-foreground transition hover:text-foreground"
          >
            <X className="h-3 w-3" /> deselect
          </button>
        </div>
      </Section>
    </div>
  );
}