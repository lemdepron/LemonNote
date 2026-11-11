import { useId, useLayoutEffect, useRef } from "react";
import { GroupMenu, MenuLabel, useRibbonCollapseApi, useRibbonCollapseState } from "@/components/ribbon/RibbonKit";
import { cn } from "@/lib/utils";

/**
 * One section of the ribbon; controls flow in columns 2 rows high, name below.
 * `priority` decides the collapse order: a lower number collapses first.
 * When collapsed, the group becomes one dropdown button (icon + name + chevron)
 * that opens its buttons in a popover. `collapsedRender` can replace that
 * default form (the Home tab uses it to keep the font-size stepper visible).
 */
export default function RibbonGroup({ label, icon, priority = 50, collapsedRender, className, children }) {
  const api = useRibbonCollapseApi();
  const state = useRibbonCollapseState();
  const id = useId();
  const columnRef = useRef(null);
  const collapsed = state.isCollapsed(id);

  useLayoutEffect(() => {
    api?.register(id, priority);
    return () => api?.unregister(id);
  }, [api, id, priority]);

  // Measure the natural (expanded) width so the collapse logic knows what fits.
  useLayoutEffect(() => {
    if (collapsed || !columnRef.current) return undefined;
    const el = columnRef.current;
    const measure = () => api?.setWidth(id, el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [api, id, collapsed]);

  const gridStyle = {
    display: "grid",
    gridAutoFlow: "column",
    gridTemplateRows: "repeat(2, 32px)",
    gridAutoColumns: "max-content",
    gap: "4px",
    alignItems: "center",
  };

  return (
    <div
      ref={collapsed ? null : columnRef}
      className={cn("flex shrink-0 flex-col px-2 pb-1 pt-1.5", className)}
      style={{ minWidth: "max-content" }}
    >
      {collapsed ? (
        <div className="flex flex-1 items-center justify-center" role="group" aria-label={label}>
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
      ) : (
        <>
          <div style={gridStyle} role="group" aria-label={label}>
            {children}
          </div>
          <span className="mt-0.5 select-none whitespace-nowrap text-center font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/55">
            {label}
          </span>
        </>
      )}
    </div>
  );
}
