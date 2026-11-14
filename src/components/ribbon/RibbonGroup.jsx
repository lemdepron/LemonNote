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
  gap: "2px",
  alignItems: "center",
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
  const childrenArray = Array.isArray(children) ? children : [children].filter(Boolean);

  // Determine if we need the "more" button (more prop provided AND more than 5 children)
  // We reserve the 6th slot for the "..." button when more is provided
  const showMore = more && childrenArray.length >= 5;

  // Visible children: first 5 if showMore, otherwise all
  const visibleChildren = showMore ? childrenArray.slice(0, 5) : childrenArray;

  return (
    <div className={cn("flex shrink-0 flex-col px-2 pb-1 pt-1.5", className)} style={{ minWidth: "max-content" }}>
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
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-transparent bg-card/60 transition hover:bg-accent hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              onOpenAutoFocus={(event) => event.preventDefault()}
              onCloseAutoFocus={(event) => event.preventDefault()}
            >
              <div className="flex flex-col gap-1.5 p-0.5">
                <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
                  {label}
                </div>
                {more}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <span className={labelClass}>{label}</span>
    </div>
  );
}