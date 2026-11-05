import { cn } from "@/lib/utils";

/** The one card every extension panel uses, so new panels match the old ones. */
export default function PanelShell({ label, action, className, children }) {
  return (
    <div className={cn("rounded-xl border border-border/60 bg-card/30 p-3", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="nb-label">{label}</p>
        {action}
      </div>
      {children}
    </div>
  );
}