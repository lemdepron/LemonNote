import { Link } from "react-router-dom";
import { ArrowUpRight, Plus, Trash2 } from "lucide-react";
import VaultHeader from "@/components/vault/VaultHeader";
import { Button } from "@/components/ui/button";

export default function SpaceListPage({
  eyebrow,
  title,
  description,
  createLabel,
  items = [],
  loading,
  onCreate,
  onDelete,
  emptyTitle,
  emptyHint,
  icon: Icon,
}) {
  return (
    <div className="nb-shell min-h-screen">
      <VaultHeader />
      <main className="mx-auto max-w-[1180px] px-5 pb-24 pt-12 sm:px-6 lg:px-8">
        <div className="nb-rise flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="nb-label">{eyebrow}</p>
            <h1 className="mt-2.5 font-display text-[32px] leading-tight tracking-tight sm:text-[40px]">{title}</h1>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-muted-foreground">{description}</p>
          </div>
          <Button onClick={onCreate} className="h-9 gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] text-primary-foreground hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" />
            {createLabel}
          </Button>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((row) => (
              <div key={row} className="h-[112px] animate-pulse rounded-xl border border-border/60 bg-card/30" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-border/80 bg-card/20 px-6 py-16 text-center">
            {Icon && <Icon className="mx-auto h-5 w-5 text-muted-foreground/60" />}
            <p className="mt-3 text-[14px] text-foreground">{emptyTitle}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">{emptyHint}</p>
            <Button onClick={onCreate} variant="outline" className="mt-5 h-9 rounded-lg border-primary/40 text-[13px] text-primary">
              {createLabel}
            </Button>
          </div>
        ) : (
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <li key={item.id} className="group relative">
                <Link
                  to={item.href}
                  className="block rounded-xl border border-border/70 bg-card/40 p-4 pr-11 transition hover:border-primary/30 hover:bg-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate text-[14px] font-medium text-foreground">{item.name}</span>
                    <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition group-hover:text-primary" />
                  </div>
                  <p className="mt-2 font-mono text-[10.5px] text-muted-foreground">{item.meta}</p>
                </Link>
                <button
                  type="button"
                  onClick={() => onDelete?.(item.id)}
                  aria-label={`Delete ${item.name}`}
                  className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-md text-muted-foreground/60 opacity-0 transition hover:bg-destructive/10 hover:text-destructive focus:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}