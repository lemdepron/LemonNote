import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverAnchor = PopoverPrimitive.Anchor

const PopoverContent = React.forwardRef(({ className, align = "start", sideOffset = 4, children, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <TooltipProvider>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-auto max-w-[240px] rounded-[6px] border bg-popover p-1.5 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}>
        {children}
      </PopoverPrimitive.Content>
    </TooltipProvider>
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

/** Compact icon button for the popover grid (28px, with tooltip) */
export function CompactPopoverIconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  active,
  className,
  ...props
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          title={label}
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] border border-transparent bg-card/60 transition hover:bg-accent hover:text-foreground",
            disabled && "cursor-not-allowed opacity-40",
            active && "bg-primary/15 text-primary",
            className
          )}
          {...props}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center" className="text-[11px]">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

/** Compact row for selects/steppers inside the popover (26px height, small label) */
export function CompactPopoverRow({ label, children, className }) {
  return (
    <div className={cn("flex items-center gap-2 rounded-[4px] px-2 py-1.5 text-[12px]", className)}>
      {label && <span className="shrink-0 text-muted-foreground/80 font-mono text-[10px] uppercase tracking-[0.1em]">{label}</span>}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

/** Grid container for icon buttons (3-4 per row) */
export function CompactPopoverGrid({ children, columns = 4, className }) {
  return (
    <div
      className={cn("grid gap-1.5 p-0.5", className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {children}
    </div>
  )
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }