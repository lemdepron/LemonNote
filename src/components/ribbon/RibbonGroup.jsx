import { useId, useLayoutEffect, useRef } from "react";
import { GroupMenu, MenuLabel, useRibbonCollapseApi, useRibbonCollapseState, GROUP_STATE } from "@/components/ribbon/RibbonKit";
import { cn } from "@/lib/utils";

/**
 * One section of the ribbon; controls flow in columns 2 rows high, name below.
 * `priority` decides the collapse order: a lower number collapses first.
 * Three states:
 * - FULL: icon buttons in two rows with the group label under them
 * - ICON: one 32px button with group icon + chevron, opens popover with full content
 * - OVERFLOW: not rendered in main ribbon, appears in "More" popover
 * `collapsedRender` can replace the default ICON form (Home tab uses it to keep the font-size stepper visible).
 */
export default function RibbonGroup({ label, icon, priority = 50, collapsedRender, className, children }) {
  const api = useRibbonCollapseApi();
  const state = useRibbonCollapseState();
  const id = useId();
  const columnRef = useRef(null);
  const measureRef = useRef(null);
  const groupState = state.groupState(id);

  useLayoutEffect(() => {
    api?.register(id, priority);
    return () => api?.unregister(id);
  }, [api, id, priority]);

  // Measure the natural (expanded) width from the hidden measuring copy
  // so groups do not flicker or stay collapsed after the window grows.
  useLayoutEffect(() => {
    if (!measureRef.current) return undefined;
    const el = measureRef.current;
    const measure = () => api?.setWidth(id, el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [api, id]);

  const gridStyle = {
    display: "grid",
    gridAutoFlow: "column",
    gridTemplateRows: "repeat(2, 32px)",
    gridAutoColumns: "max-content",
    gap: "4px",
    alignItems: "center",
  };

  // OVERFLOW state: not rendered in main ribbon (handled by More menu)
  if (groupState === GROUP_STATE.OVERFLOW) {
    return (
      <div
        ref={measureRef}
        style={{ display: 'none' }}
        aria-hidden="true"
      >
        <div style={gridStyle} role="group" aria-label={label}>
          {children}
        </div>
        <span className="mt-0.5 select-none whitespace-nowrap text-center font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/55">
          {label}
        </span>
      </div>
    );
  }

  // ICON state: single 32px button with icon + chevron
  if (groupState === GROUP_STATE.ICON) {
    return (
      <div className="flex shrink-0 items-center" role="group" aria-label={label}>
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

  // FULL state: two-row grid with label below
  return (
    <div
      ref={(el) => { columnRef.current = el; measureRef.current = el; }}
      className={cn("flex shrink-0 flex-col px-2 pb-1 pt-1.5", className)}
      style={{ minWidth: "max-content" }}
    >
      <div style={gridStyle} role="group" aria-label={label}>
        {children}
      </div>
      <span className="mt-0.5 select-none whitespace-nowrap text-center font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/55">
        {label}
      </span>
    </div>
  );
}