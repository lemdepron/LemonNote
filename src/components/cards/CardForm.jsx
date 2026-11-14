import { useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select-compact";

export default function CardForm({ notes, onCreate, onCancel }) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [noteId, setNoteId] = useState("");

  const submit = (event) => {
    event.preventDefault();
    if (!front.trim() || !back.trim()) return;
    const note = notes.find((item) => item.id === noteId);
    onCreate({ front, back, noteId, noteTitle: note?.title || "" });
    setFront("");
    setBack("");
    setNoteId("");
  };

  return (
    <form onSubmit={submit} className="mt-4 rounded-xl border border-border/70 bg-card/40 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="nb-label">front</span>
          <textarea
            value={front}
            onChange={(event) => setFront(event.target.value)}
            rows={3}
            placeholder="What does RLS stand for?"
            className="mt-1 w-full resize-none rounded-lg border border-border/80 bg-background/60 px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-primary/40"
          />
        </label>
        <label>
          <span className="nb-label">back</span>
          <textarea
            value={back}
            onChange={(event) => setBack(event.target.value)}
            rows={3}
            placeholder="Row-level security."
            className="mt-1 w-full resize-none rounded-lg border border-border/80 bg-background/60 px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-primary/40"
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1 basis-[200px]">
          <span className="nb-label">source note (optional)</span>
          <Select value={noteId} onValueChange={setNoteId}>
            <SelectTrigger className="mt-1 w-full">
              <SelectValue placeholder="No note" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="">No note</SelectItem>
              {notes.map((note) => (
                <SelectItem key={note.id} value={note.id}>
                  {note.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <button
          type="submit"
          className="h-9 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Add card
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-lg border border-border/80 px-3 text-[12.5px] text-muted-foreground transition hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}