import { forwardRef, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Star, StarOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRibbonAction } from "@/lib/ribbon-registry";
import { isPinned, togglePin } from "@/lib/quick-access";

const HOLD_MS = 500;

/**
 * Tiny "Add / Remove from Quick Access" menu for a registered ribbon button.
 * Shown after a right-click or a long press on the button.
 */
function PinMenu({ id, position, onDone }) {
  const pinned = isPinned(id);
  const left = Math.max(8, Math.min(position.x, window.innerWidth - 216));
  const top = Math.max(8, Math.min(position.y + 8, window.innerHeight - 56));

  useEffect(() => {
    const onPointerDown = (event) => {
      if (event.target.closest?.("[data-qa-pin-menu]")) return;
      onDone();
    };
    const onKey = (event) => {
      if (event.key === "Escape") onDone();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [onDone]);

  return createPortal(
    <div
      data-qa-pin-menu
      role="menu"
      className="fixed z-50 min-w-[208px] rounded-lg border border-border bg-card p-1 shadow-lg"
      style={{ left, top }}
    >
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          togglePin(id);
          onDone();
        }}
        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12.5px] text-foreground transition hover:bg-accent"
      >
        {pinned ? <StarOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
        {pinned ? "Remove from Quick Access" : "Add to Quick Access"}
      </button>
    </div>,
    document.body
  );
}

/**
 * One ribbon action: icon-only by default. The name (and shortcut) shows as a
 * tooltip on hover and keyboard focus. Every button keeps an aria-label.
 * Buttons for quick languages (JS, TS, Py, etc.) keep a 2-3 letter text label.
 *
 * Buttons that carry an `id` present in the ribbon registry show a small menu
 * on right-click / long-press to pin or unpin the button in Quick Access.
 */
const RibbonButton = forwardRef(function RibbonButton(
  { icon: Icon, label, hint, shortcut, onClick, spinning, active, disabled, disabledReason, keepFocus = true, className, showLabel = false, id, ...rest },
  ref
) {
  const canPin = Boolean(id && getRibbonAction(id));
  const [pinMenu, setPinMenu] = useState(null);
  const holdRef = useRef(null);
  const skipClickRef = useRef(false);

  const clearHold = () => window.clearTimeout(holdRef.current);

  const title = disabled
    ? disabledReason || hint || label
    : [hint || label, shortcut].filter(Boolean).join(" · ");

  return (
    <>
      <button
        ref={ref}
        type="button"
        {...rest}
        onMouseDown={(event) => {
          if (keepFocus) event.preventDefault();
        }}
        onContextMenu={(event) => {
          if (!canPin) return;
          event.preventDefault();
          clearHold();
          skipClickRef.current = false;
          setPinMenu({ x: event.clientX, y: event.clientY });
        }}
        onTouchStart={(event) => {
          clearHold();
          if (!canPin) return;
          const touch = event.touches[0];
          holdRef.current = window.setTimeout(() => {
            skipClickRef.current = true;
            setPinMenu({ x: touch.clientX, y: touch.clientY });
          }, HOLD_MS);
        }}
        onTouchMove={clearHold}
        onTouchEnd={clearHold}
        onTouchCancel={clearHold}
        onClick={(event) => {
          if (skipClickRef.current) {
            skipClickRef.current = false;
            event.preventDefault();
            return;
          }
          if (disabled) return;
          onClick?.(event);
        }}
        title={title}
        aria-label={title}
        data-ribbon-id={id || undefined}
        aria-pressed={active || undefined}
        aria-disabled={disabled || undefined}
        className={cn(
          "flex h-8 shrink-0 items-center justify-center rounded-md border border-transparent px-2 transition",
          active
            ? "border-primary/40 bg-primary/15 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
          disabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-muted-foreground",
          className
        )}
      >
        {Icon && <Icon className={cn("h-3.5 w-3.5 shrink-0", spinning && "animate-spin")} />}
        {showLabel && label && <span className="whitespace-nowrap font-mono text-[10.5px]">{label}</span>}
      </button>
      {pinMenu && <PinMenu id={id} position={pinMenu} onDone={() => setPinMenu(null)} />}
    </>
  );
});

export default RibbonButton;
