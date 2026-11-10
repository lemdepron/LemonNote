import { X, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Find bar for the editor textarea.
 * Shows above the editor with input, match counter, prev/next, close.
 */
export default function FindBar({
  isOpen,
  onClose,
  query,
  onQueryChange,
  matchCount,
  currentIndex,
  onPrev,
  onNext,
  hasFocus,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="flex items-center gap-2 p-2 border-b border-border/60 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60"
      role="search"
      aria-label="Find in editor"
    >
      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.1em] shrink-0">
        Find
      </span>

      <div className="relative flex-1 max-w-[320px]">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Enter") {
              e.shiftKey ? onPrev() : onNext();
            }
          }}
          autoFocus={true}
          placeholder="Find in editor..."
          className="w-full h-8 pl-8 pr-8 rounded-md border border-border/70 bg-card/60 px-2 font-mono text-[12px] text-foreground outline-none focus:border-primary/40 placeholder:text-muted-foreground/50"
          aria-label="Find text"
          aria-controls="nb-editor"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground transition"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {query && (
        <span className="font-mono text-[11px] text-muted-foreground shrink-0 min-w-[80px] text-right">
          {matchCount > 0 ? `${currentIndex + 1} of ${matchCount}` : "No matches"}
        </span>
      )}

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onPrev}
          disabled={matchCount === 0}
          className={cn(
            "h-8 w-8 rounded-md border border-border/70 bg-card/60 p-0.5 transition",
            matchCount === 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-accent"
          )}
          aria-label="Previous match (Shift+Enter)"
          aria-disabled={matchCount === 0}
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={matchCount === 0}
          className={cn(
            "h-8 w-8 rounded-md border border-border/70 bg-card/60 p-0.5 transition",
            matchCount === 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-accent"
          )}
          aria-label="Next match (Enter)"
          aria-disabled={matchCount === 0}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="h-8 w-8 rounded-md border border-border/70 bg-card/60 p-0.5 transition hover:bg-accent"
        aria-label="Close find bar (Esc)"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}