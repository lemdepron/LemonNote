import { cn } from "@/lib/utils";

/**
 * A tag button for the ribbon - shows icon, label, and shortcut.
 * Can be used for built-in tags or custom tags.
 */
export default function TagButton({
  tagDef,
  active,
  onClick,
  onDoubleClick,
  showLabel = true,
  showShortcut = true,
  className,
}) {
  if (!tagDef) return null;

  const Icon = tagDef.icon;
  const isCustom = tagDef.custom;

  return (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
      title={`${tagDef.label}${tagDef.shortcut ? ` (${tagDef.shortcut})` : ""}`}
      className={cn(
        "relative flex items-center gap-1.5 rounded-lg border px-2 py-1.5 font-mono text-[11px] transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        active
          ? "bg-primary/15 text-primary border-primary/40 shadow-sm"
          : "text-foreground/80 hover:bg-accent border-border/70",
        isCustom && "opacity-90",
        className
      )}
      style={{
        // Custom color for built-in tags when active
        ...(active && tagDef.color && { borderColor: tagDef.color.replace("text-", "").replace("bg-", "") }),
      }}
    >
      {Icon && (
        <Icon
          className={cn(
            "h-3.5 w-3.5 flex-shrink-0 transition-colors",
            active ? "text-current" : tagDef.color?.replace("bg-", "text-") || "text-muted-foreground"
          )}
          aria-hidden="true"
        />
      )}
      {showLabel && <span className="truncate">{tagDef.label}</span>}
      {showShortcut && tagDef.shortcut && (
        <span className="ml-1 px-1.5 text-[9px] font-mono uppercase tracking-[0.1em] text-muted-foreground/60">
          {tagDef.shortcut}
        </span>
      )}
    </button>
  );
}