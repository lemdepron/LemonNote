import { cn } from "@/lib/utils";

const Line = ({ label, items, strong }) => {
  if (!items.length) return null;
  return (
    <div className="flex gap-2">
      <span className="w-[58px] shrink-0 pt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 break-words font-mono text-[11px] leading-relaxed",
          strong ? "text-primary" : "text-foreground/85"
        )}
      >
        {items.join(" · ")}
      </span>
    </div>
  );
};

export default function SpaceManifestCard({ space, attached }) {
  const Icon = space.icon;

  return (
    <article className="rounded-xl border border-border/70 bg-card/30 p-4">
      <header className="flex items-start gap-2.5">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border/70 bg-card/60 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium text-foreground">{space.label}</p>
          <p className="font-mono text-[10px] text-muted-foreground/70">{space.path}</p>
        </div>
        {space.panel && (
          <span className="shrink-0 rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-primary">
            {attached ? `${attached} panel${attached === 1 ? "" : "s"}` : "panel slot"}
          </span>
        )}
      </header>

      <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted-foreground">{space.purpose}</p>

      <div className="mt-3 space-y-1 border-t border-border/50 pt-2.5">
        <Line label="routes" items={space.routes} />
        <Line label="stores" items={space.entities} />
        <Line label="hooks" items={space.hooks} strong />
        <Line label="events" items={space.events} strong />
        <Line label="keys" items={space.shortcuts} />
      </div>
    </article>
  );
}