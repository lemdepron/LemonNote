import { useEffect, useState } from "react";
import { Layers, Loader2 } from "lucide-react";
import { db } from "@/api/localDb";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import RibbonButton from "@/components/ribbon/RibbonButton";
import { newCard } from "@/lib/cards";
import { editorCaret } from "@/lib/note-insert";
import { cn } from "@/lib/utils";

/** Turns the selected note text into a flashcard: selection is the answer, the prompt is typed here. */
export default function CardComposer({ body, noteId, noteTitle, disabled, disabledReason, shortcut, openSignal }) {
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [status, setStatus] = useState({ busy: false, message: "" });

  useEffect(() => {
    if (openSignal) setOpen(true);
  }, [openSignal]);

  const capture = () => {
    const { start, end } = editorCaret(body);
    const answer = body.slice(start, end).trim();
    setFront("");
    setBack(answer);
    setStatus({ busy: false, message: answer ? "" : "Select the answer text in the note first." });
    setOpen(true);
  };

  const save = async () => {
    if (!front.trim() || !back || status.busy) return;
    setStatus({ busy: true, message: "" });
    try {
      await db.entities.Flashcard.create(
        newCard({ front, back, noteId: noteId || "", noteTitle: noteTitle || "" })
      );
      setFront("");
      setStatus({ busy: false, message: "Card added to the deck." });
    } catch {
      setStatus({ busy: false, message: "Could not save the card." });
    }
  };

  if (disabled) {
    return (
      <RibbonButton
        icon={Layers}
        label="Make card"
        hint="Turn the selected text into a flashcard"
        shortcut={shortcut}
        disabled
        disabledReason={disabledReason}
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <RibbonButton
          icon={Layers}
          label="Make card"
          hint="Turn the selected text into a flashcard"
          shortcut={shortcut}
          keepFocus={false}
          onClick={capture}
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        <p className="nb-label">new flashcard</p>

        <label className="mt-2 block">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">prompt</span>
          <input
            autoFocus
            value={front}
            onChange={(event) => setFront(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") save();
            }}
            placeholder="What does this ask?"
            className="mt-1 h-8 w-full rounded-md border border-border/80 bg-background/60 px-2 text-[12.5px] text-foreground outline-none focus:border-primary/40"
          />
        </label>

        <div className="mt-2 rounded-md border border-border/60 bg-muted/40 px-2 py-1.5">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">answer</span>
          <p className="mt-1 max-h-20 overflow-y-auto whitespace-pre-wrap text-[12px] leading-snug text-foreground/85">
            {back || "Nothing selected."}
          </p>
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={!front.trim() || !back || status.busy}
            className="h-7 shrink-0 rounded-md bg-primary px-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
          >
            {status.busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add card"}
          </button>
          <span
            className={cn(
              "min-w-0 flex-1 font-mono text-[9.5px] uppercase tracking-[0.1em]",
              status.message === "Card added to the deck." ? "text-[hsl(var(--link))]" : "text-muted-foreground"
            )}
          >
            {status.message}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}