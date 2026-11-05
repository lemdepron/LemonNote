import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * One ribbon action: icon plus its short label, with the action's shortcut in the
 * tooltip. `keepFocus` holds the caret in the editor while the button is pressed.
 */
const RibbonButton = forwardRef(function RibbonButton(
  { icon: Icon, label, hint, shortcut, onClick, spinning, active, disabled, disabledReason, keepFocus = true, className, ...rest },
  ref
) {
  const title = disabled ? disabledReason || hint || label : [hint || label, shortcut].filter(Boolean).join(" · ");

  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      onMouseDown={(event) => {
        if (keepFocus) event.preventDefault();
      }}
      onClick={(event) => {
        if (disabled) return;
        onClick?.(event);
      }}
      title={title}
      aria-label={title}
      aria-pressed={active || undefined}
      aria-disabled={disabled || undefined}
      className={cn(
        "flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-transparent px-2 text-[11.5px] leading-none transition",
        active
          ? "border-primary/40 bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-muted-foreground",
        className
      )}
    >
      {Icon && <Icon className={cn("h-3.5 w-3.5 shrink-0", spinning && "animate-spin")} />}
      {label && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
});

export default RibbonButton;