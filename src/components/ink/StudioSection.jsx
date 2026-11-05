import { cn } from "@/lib/utils";

export function Section({ label, hint, children, className }) {
  return (
    <section className={cn("space-y-2", className)}>
      <p className="nb-label">{label}</p>
      {children}
      {hint ? (
        <p className="font-mono text-[9px] leading-relaxed text-muted-foreground/70">{hint}</p>
      ) : null}
    </section>
  );
}

export function Chip({ active, onClick, children, title, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        "rounded-md border px-2 py-1 font-mono text-[10px] transition",
        active
          ? "border-primary/50 bg-primary/15 text-primary"
          : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Slider({ label, value, min, max, step = 1, onChange, display, className }) {
  return (
    <label className={cn("block", className)}>
      <span className="flex items-baseline justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
        <span>{label}</span>
        <span className="text-foreground/70">{display ?? value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1.5 h-1 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
      />
    </label>
  );
}

export function Swatch({ color, alpha = 1, active, onClick, size = "h-5 w-5", onRemove }) {
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={onClick}
        aria-label={`Colour ${color}`}
        aria-pressed={active}
        className={cn(
          "rounded-full border transition",
          size,
          active ? "border-foreground/80 ring-1 ring-foreground/30" : "border-foreground/30 hover:scale-105"
        )}
        style={{
          backgroundImage: `linear-gradient(${color}, ${color}), repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--card)) 0% 50%)`,
          backgroundSize: "100% 100%, 8px 8px",
          opacity: alpha < 1 ? 0.55 + alpha * 0.45 : 1,
        }}
      />
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${color}`}
          className="absolute -right-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full border border-border bg-popover text-[8px] text-muted-foreground transition hover:text-destructive"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}