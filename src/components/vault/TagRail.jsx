import { cn } from "@/lib/utils";

export default function TagRail({ tags = [], activeTag = "", onSelect, noteCount = 0, linkCount = 0 }) {
  return (
    <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
      <section>
        <p className="nb-label">Tags</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.length === 0 && <p className="text-[13px] text-muted-foreground">No tags yet.</p>}
          {tags.map(({ tag, count }) => {
            const active = tag === activeTag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onSelect(tag)}
                className={cn(
                  "group flex items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-[11px] transition",
                  active
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border/70 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                #{tag}
                <span className={cn("text-[10px]", active ? "text-primary/70" : "text-muted-foreground/60")}>{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-border/70 bg-card/30 p-4">
        <p className="nb-label">Vault</p>
        <dl className="mt-3 space-y-2 font-mono text-[11px]">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">notes</dt>
            <dd className="text-foreground/90">{noteCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">links</dt>
            <dd className="text-foreground/90">{linkCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">tags</dt>
            <dd className="text-foreground/90">{tags.length}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">format</dt>
            <dd className="text-foreground/90">markdown</dd>
          </div>
        </dl>
      </section>

      <p className="text-[11.5px] leading-relaxed text-muted-foreground/70">
        Flat by design. Search, tags and links are the only structure — no folders to prune.
      </p>
    </aside>
  );
}