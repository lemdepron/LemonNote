import { useId, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { GroupMenu, MenuLabel, useRibbonCollapseApi, useRibbonCollapseState, GROUP_STATE } from "@/components/ribbon/RibbonKit";
import { cn } from "@/lib/utils";

const gridStyle = {
  display: "grid",
  gridAutoFlow: "column",
  gridTemplateRows: "repeat(2, 32px)",
  gridAutoColumns: "max-content",
  gap: "4px",
  alignItems: "center",
};

const labelClass =
  "mt-0.5 select-none whitespace-nowrap text-center font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/55";

/** Fallback when a group has no icon: its first letters, never a bare chevron. */
function LetterIcon({ label, className }) {
  return (
    <span className={cn("font-mono text-[10px] font-semibold uppercase leading-none", className)}>
      {String(label || "?").slice(0, 2)}
    </span>
  );
}

/**
 * One section of the ribbon; controls flow in columns 2 rows high, name below.
 * `priority` decides the collapse order: a lower number collapses first.
 * States (chosen by the provider from the measured widths):
 * - FULL: icon buttons in two rows with the group label under them
 * - ICON: one 32px button (group icon + chevron) that opens the group's buttons
 * - OVERFLOW: shown inside the "More" popover
 * `collapsedRender` can replace the ICON form (Home keeps its font-size stepper).
 */
export default function RibbonGroup({ label, icon, priority = 50, collapsedRender, className, children }) {
  const api = useRibbonCollapseApi();
  const state = useRibbonCollapseState();
  const id = useId();
  const fullRef = useRef(null);
  const iconRef = useRef(null);
  const groupState = state.groupState(id);

  useLayoutEffect(() => {
    api?.register(id, priority);
    return () => api?.unregister(id);
  }, [api, id, priority]);

  // Measure the natural width while the group is FULL; the value is kept while collapsed.
  useLayoutEffect(() => {
    if (groupState !== GROUP_STATE.FULL || !fullRef.current) return undefined;
    const el = fullRef.current;
    const measure = () => api?.setWidth(id, Math.ceil(el.getBoundingClientRect().width));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [api, id, groupState]);

  // Measure the real width of the collapsed form (button + padding, or a custom form).
  useLayoutEffect(() => {
    if (groupState !== GROUP_STATE.ICON || !iconRef.current) return undefined;
    const el = iconRef.current;
    const measure = () => api?.setIconWidth(id, Math.ceil(el.getBoundingClientRect().width));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [api, id, groupState]);

  if (groupState === GROUP_STATE.OVERFLOW) {
    if (!state.moreNode) return null;
    return createPortal(
      <section role="group" aria-label={label}>
        <MenuLabel>{label}</MenuLabel>
        <div style={gridStyle}>{children}</div>
      </section>,
      state.moreNode
    );
  }

  if (groupState === GROUP_STATE.ICON) {
    return (
      <div ref={iconRef} className="flex shrink-0 items-center px-1.5" role="group" aria-label={label}>
        {collapsedRender ? (
          collapsedRender()
        ) : (
          <GroupMenu icon={icon} label={label} width={320}>
            {() => (
              <>
                <MenuLabel>{label}</MenuLabel>
                <div style={gridStyle}>{children}</div>
              </>
            )}
          </GroupMenu>
        )}
      </div>
    );
  }

  return (
    <div ref={fullRef} className={cn("flex shrink-0 flex-col px-2 pb-1 pt-1.5", className)} style={{ minWidth: "max-content" }}>
      <div style={gridStyle} role="group" aria-label={label}>
        {children}
      </div>
      <span className={labelClass}>{label}</span>
    </div>
  );
}
