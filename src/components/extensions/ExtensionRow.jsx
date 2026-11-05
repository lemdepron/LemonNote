import { AlertTriangle, Palette, PanelLeft, Radio, Target, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { inspectExtension, setExtensionEnabled } from "@/lib/extensions";
import { cn } from "@/lib/utils";

const KIND_META = {
  theme: { label: "theme", icon: Palette },
  panel: { label: "panel", icon: PanelLeft },
  banner: { label: "banner", icon: Target },
  hook: { label: "hook", icon: Zap },
  event: { label: "event", icon: Radio },
};

export default function ExtensionRow({ extension }) {
  const meta = KIND_META[extension.kind] || KIND_META.panel;
  const Icon = meta.icon;
  const facts = inspectExtension(extension.id);
  const chips = facts
    ? Object.entries(facts)
        .filter(([, value]) => value !== null && value !== undefined && value !== "")
        .map(([key, value]) => `${key}:${value}`)
    : [];

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-xl border px-3.5 py-3 transition",
        extension.enabled ? "border-primary/30 bg-primary/[0.04]" : "border-border/60 bg-card/25"
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border",
          extension.enabled ? "border-primary/40 bg-primary/10 text-primary" : "border-border/70 text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[13.5px] font-medium text-foreground">{extension.name}</p>
          <span className="shrink-0 rounded border border-border/70 px-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            {meta.label}
          </span>
        </div>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">{extension.description}</p>

        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {extension.permissions.map((permission) => (
            <span
              key={permission}
              className="rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground"
            >
              {permission}
            </span>
          ))}
          {chips.map((chip) => (
            <span key={chip} className="font-mono text-[9.5px] text-muted-foreground/70">
              {chip}
            </span>
          ))}
        </div>

        <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/60">
          {extension.author} · v{extension.version}
        </p>

        {extension.problems.length > 0 && (
          <p className="mt-1.5 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-destructive">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{extension.problems.join("; ")}</span>
          </p>
        )}
      </div>

      <Switch
        checked={extension.enabled}
        onCheckedChange={(value) => setExtensionEnabled(extension.id, value)}
        aria-label={`Toggle ${extension.name}`}
      />
    </li>
  );
}