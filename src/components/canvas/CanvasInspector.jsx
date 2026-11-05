import { cn } from "@/lib/utils";

const Link2 = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const Trash2 = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2m3 0-1 14H6L5 6" />
    <path d="M10 11v5m4-5v5" />
  </svg>
);

const X = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="m18 6-12 12M6 6l12 12" />
  </svg>
);

export default function CanvasInspector({ node, nodes, edges, linking, onChange, onDelete, onStartLink, onCancelLink, onRemoveEdge }) {
  if (!node) {
    return (
      <aside className="rounded-xl border border-border/70 bg-card/30 p-4">
        <p className="nb-label">inspector</p>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          Select a card to edit its text and wiring. Double-click empty space to drop a new card, then use the
          <Link2 className="mx-1 inline h-3 w-3 align-[-1px]" />
          handle on a card to draw a connection to another one.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-border/60 pt-3 font-mono text-[10.5px] text-muted-foreground">
          <dt>cards</dt>
          <dd className="text-right text-foreground/80">{nodes.length}</dd>
          <dt>connections</dt>
          <dd className="text-right text-foreground/80">{edges.length}</dd>
        </dl>
      </aside>
    );
  }

  const connections = edges
    .filter((edge) => edge.from === node.id || edge.to === node.id)
    .map((edge) => {
      const outgoing = edge.from === node.id;
      const other = nodes.find((item) => item.id === (outgoing ? edge.to : edge.from));
      return { edge, outgoing, other };
    });

  return (
    <aside className="rounded-xl border border-border/70 bg-card/40 p-4">
      <div className="flex items-center justify-between">
        <p className="nb-label">card</p>
        <span className="font-mono text-[10px] text-muted-foreground">
          {Math.round(node.x)}, {Math.round(node.y)}
        </span>
      </div>

      <label className="mt-3 block">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">title</span>
        <input
          value={node.title}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="Card title"
          className="mt-1 h-9 w-full rounded-lg border border-border/80 bg-background/60 px-2.5 text-[13px] text-foreground outline-none transition focus:border-primary/40"
        />
      </label>

      <label className="mt-3 block">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">text</span>
        <textarea
          value={node.body}
          onChange={(event) => onChange({ body: event.target.value })}
          rows={5}
          placeholder="What is this thought?"
          className="mt-1 w-full resize-none rounded-lg border border-border/80 bg-background/60 px-2.5 py-2 text-[12.5px] leading-relaxed text-foreground outline-none transition focus:border-primary/40"
        />
      </label>

      <button
        type="button"
        onClick={linking ? onCancelLink : onStartLink}
        className={cn(
          "mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border text-[12.5px] transition",
          linking
            ? "border-primary/50 bg-primary/10 text-primary"
            : "border-border/80 text-muted-foreground hover:border-primary/40 hover:text-foreground"
        )}
      >
        <Link2 className="h-3.5 w-3.5" />
        {linking ? "Cancel — pick another card" : "Connect to a card"}
      </button>

      <div className="mt-4 border-t border-border/60 pt-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">connections</p>
        {connections.length === 0 ? (
          <p className="mt-2 text-[12px] text-muted-foreground">Nothing linked yet.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {connections.map(({ edge, outgoing, other }) => (
              <li key={edge.id} className="flex items-center gap-1.5 rounded-md px-1 py-1 hover:bg-accent/50">
                <span className="font-mono text-[10px] text-muted-foreground/80">{outgoing ? "→" : "←"}</span>
                <span className="min-w-0 flex-1 truncate text-[12px] text-foreground/85">{other?.title || "Missing card"}</span>
                <button
                  type="button"
                  onClick={() => onRemoveEdge(edge.id)}
                  aria-label="Remove connection"
                  className="grid h-6 w-6 place-items-center rounded text-muted-foreground/60 transition hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="mt-4 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-destructive/30 text-[12.5px] text-destructive/90 transition hover:bg-destructive/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete card
      </button>
    </aside>
  );
}