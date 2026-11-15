import { useId, useRef } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/compact-popover";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const gridStyle = {
  display: "grid",
  gridAutoFlow: "column",
  gridTemplateRows: "repeat(2, 26px)",
  gridAutoColumns: "max-content",
  alignItems: "center",
  gap: "2px",
};

const labelClass =
  "mt-0.5 select-none whitespace-nowrap text-center font-mono text-[10px] tracking-normal leading-[12px] text-muted-foreground/55";

/** Fallback when a group has no icon: its first letters, never a bare chevron. */
function LetterIcon({ label, className }) {
  return (
    <span className={cn("font-mono text-[10px] font-semibold leading-none", className)}>
      {String(label || "?").slice(0, 2)}
    </span>
  );
}

/**
 * One section of the ribbon; controls flow in columns 2 rows high, name below.
 * `priority` is kept for compatibility but no longer controls collapse.
 * `more` - optional JSX content shown in a popover when the group overflows.
 *   The last slot (6th position) becomes a "..." button opening the popover.
 * A group may contain ONE tall box (a picker, a select, a stepper) that spans
 * both rows of one column using `style={{ gridRow: "span 2" }}`.
 */
export default function RibbonGroup({ label, icon, priority = 50, className, children, more }) {
  const id = useId();
  const popoverRef = useRef(null);

  // Convert children to array to count and manipulate
  const childrenArray = (Array.isArray(children) ? children : [children]).flat().filter(Boolean);

  // A group has 6 slots (3 columns x 2 rows). A control that spans both rows (a select,
  // a stepper) uses 2 slots. When everything fits (the "..." button needs 1 slot), show it all.
  // Otherwise show the first 5 slots, and put everything else, plus the `more` content,
  // into the "..." popover. Nothing is ever dropped.
  const slotsOf = (child) => (child?.props?.style?.gridRow === "span 2" ? 2 : 1);
  const totalSlots = childrenArray.reduce((sum, child) => sum + slotsOf(child), 0);
  const needsPopover = Boolean(more) || totalSlots > 6;
  const fitsWithButton = totalSlots + (needsPopover ? 1 : 0) <= 6;

  let visibleChildren = childrenArray;
  let overflowChildren = [];
  if (needsPopover && !fitsWithButton) {
    let used = 0;
    visibleChildren = [];
    childrenArray.forEach((child, index) => {
      const slots = slotsOf(child);
      if (overflowChildren.length === 0 && used + slots <= 5) {
        visibleChildren.push(child);
        used += slots;
      } else {
        overflowChildren.push(child);
      }
    });
  }
  const showMore = needsPopover;
  const popoverContent = (
    <>
      {overflowChildren}
      {more}
    </>
  );

  return (
    <div className={cn("flex shrink-0 flex-col px-1.5 pb-1 pt-1", className)} style={{ minWidth: "max-content" }}>
      <div style={gridStyle} role="group" aria-label={label}>
        {visibleChildren}
        {showMore && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                ref={popoverRef}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                title={t("ribbon.more")}
                aria-label={t("ribbon.more")}
                style={{ gridRow: 2 }}
                className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md border border-transparent bg-card/60 transition hover:bg-accent hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-auto max-w-[240px] p-1"
              onOpenAutoFocus={(event) => event.preventDefault()}
              onCloseAutoFocus={(event) => event.preventDefault()}
            >
              <div className="flex flex-col gap-1 p-0.5">
                <div className="px-1 pt-0.5 font-mono text-[9px] tracking-normal text-muted-foreground/70">
                  {label}
                </div>
                <div className="flex flex-wrap items-center gap-1">{popoverContent}</div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <span className={labelClass}>{label}</span>
    </div>
  );
}