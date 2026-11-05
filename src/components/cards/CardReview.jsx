import { cn } from "@/lib/utils";
import { RATINGS } from "@/lib/cards";

export default function CardReview({ card, revealed, busy, onReveal, onGrade }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/40 px-5 py-6 sm:px-7">
      <p className="nb-label">prompt</p>
      <p className="mt-2 whitespace-pre-wrap font-display text-[24px] leading-snug tracking-tight sm:text-[28px]">
        {card.front}
      </p>

      {revealed ? (
        <>
          <div className="mt-5 border-t border-border/60 pt-5">
            <p className="nb-label">answer</p>
            <p className="mt-2 whitespace-pre-wrap text-[14.5px] leading-relaxed text-foreground/90">{card.back}</p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RATINGS.map((rating) => (
              <button
                key={rating.id}
                type="button"
                disabled={busy}
                onClick={() => onGrade(rating.id)}
                className={cn(
                  "rounded-lg border px-3 py-2 font-mono text-[10.5px] uppercase tracking-[0.14em] transition disabled:opacity-50",
                  rating.id === "good"
                    ? "border-primary/50 bg-primary/15 text-primary hover:bg-primary/20"
                    : "border-border/80 text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                {rating.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={onReveal}
          className="mt-6 w-full rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-[13px] text-primary transition hover:bg-primary/15"
        >
          Show answer
        </button>
      )}
    </div>
  );
}