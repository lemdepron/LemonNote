import { createContext, useContext, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import RibbonButton from "@/components/ribbon/RibbonButton";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Shared state for every ribbon tab: the live selection, a `run` that applies an
 * edit through the editor bridge, and the note-level typography.
 */
export const RibbonContext = createContext(null);
export const useRibbon = () => useContext(RibbonContext);

/** A ribbon button that disables itself on non-Markdown notes and runs an edit builder on click. */
export function Btn({ edit, onClick, ...props }) {
  const ctx = useRibbon();
  return (
    <RibbonButton
      {...props}
      disabled={!ctx.markdown || Boolean(props.disabled)}
      disabledReason={!ctx.markdown ? ctx.offReason : props.disabledReason}
      onClick={() => (edit ? ctx.run(edit(ctx.selection)) : onClick?.())}
    />
  );
}

/** Native dropdown. `groups` = [{ label, options: [{ value, label }] }] or `options` = [{ value, label }]. */
export function RibbonSelect({ value, onChange, options, groups, title, placeholder, disabled }) {
  return (
    <Select value={value ?? ""} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn("h-8 rounded-md border border-border/70 bg-card/60 px-1.5 font-mono text-[10.5px] text-foreground outline-none focus:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40 min-w-[72px]")} aria-label={title}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper">
        {placeholder !== undefined && (
          <SelectItem value="">{placeholder}</SelectItem>
        )}
        {groups
          ? groups.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.options.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))
          : options.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
      </SelectContent>
    </Select>
  );
}

/** A button that opens a popover. `children` is a function that receives `close`. */
export function RibbonMenu({ id, icon, label, hint, shortcut, disabled, disabledReason, width = 260, children, active, onOpenChange }) {
  const [open, setOpen] = useState(false);
  const ctx = useRibbon();
  const off = !ctx.markdown || Boolean(disabled);
  if (off) return <RibbonButton id={id} icon={icon} label={label} hint={hint} disabled disabledReason={!ctx.markdown ? ctx.offReason : disabledReason} />;
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) onOpenChange?.();
      }}
    >
      <PopoverTrigger asChild>
        <RibbonButton id={id} icon={icon} label={label} hint={hint} shortcut={shortcut} active={active || open} />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        style={{ width }}
        className="max-h-[70vh] overflow-y-auto p-2"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        {children(() => setOpen(false))}
      </PopoverContent>
    </Popover>
  );
}

/** A plain row inside a menu. */
export function MenuItem({ children, onClick, hint, active, style, className }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      title={hint}
      style={style}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-[12.5px] transition",
        active ? "bg-primary/15 text-primary" : "text-foreground/85 hover:bg-accent",
        className
      )}
    >
      {children}
    </button>
  );
}

export const MenuLabel = ({ children }) => (
  <div className="px-2 pb-1 pt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">{children}</div>
);

/** Colour grid. `items` = [{ id, label, value }]. */
export function Swatches({ items, onPick, current, columns = 8 }) {
  return (
    <div className="grid gap-1.5 p-1" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          title={item.label}
          aria-label={item.label}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPick(item.id)}
          style={{ background: item.value }}
          className={cn(
            "h-6 rounded-md border border-border/70 transition hover:scale-110",
            current === item.id && "ring-2 ring-primary"
          )}
        />
      ))}
    </div>
  );
}

/** Small grid of text buttons (symbols, quick languages). */
export function TextGrid({ items, onPick, columns = 8 }) {
  return (
    <div className="grid gap-1 p-1" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {items.map((item, index) => (
        <button
          key={`${item}-${index}`}
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPick(item)}
          className="h-7 rounded-md border border-border/60 text-[14px] text-foreground/90 transition hover:bg-accent"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export const Caret = () => <ChevronDown className="h-3 w-3 opacity-60" />;

/** Stepper: − value +. */
export function Stepper({ value, onChange, min, max, step = 1, title, format = String }) {
  const clamp = (n) => Math.min(max, Math.max(min, n));
  return (
    <div className="flex h-8 items-center rounded-md border border-border/70 bg-card/60" title={title}>
      <button
        type="button"
        aria-label={`Decrease ${title}`}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onChange(clamp(Math.round((value - step) * 100) / 100))}
        className="h-full px-2 text-[13px] text-muted-foreground hover:text-foreground"
      >
        −
      </button>
      <span className="min-w-[2.4rem] text-center font-mono text-[10.5px]">{format(value)}</span>
      <button
        type="button"
        aria-label={`Increase ${title}`}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onChange(clamp(Math.round((value + step) * 100) / 100))}
        className="h-full px-2 text-[13px] text-muted-foreground hover:text-foreground"
      >
        +
      </button>
    </div>
  );
}

/**
 * The tab strip plus the panel that holds the active tab's groups. Shared by the
 * note ribbon and the ink ribbon so both look and behave the same.
 * Sticky at the top with a solid background so content doesn't show through.
 * Uses --app-header-h CSS variable (set by VaultHeader) to sit below the header.
 */
export function RibbonFrame({ tabs, tab, onTab, children, trailing, leading, className, isFirstTabActive }) {
  return (
    <div className={cn("mt-6 sticky z-10", className)} style={{ top: "var(--app-header-h, 4rem)" }}>
      <div role="tablist" aria-label={t("ribbon.tabsAria")} className="flex gap-0.5 overflow-x-auto px-1 bg-background border-b border-border">
        {leading}
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onTab(item.id)}
            className={cn(
              "shrink-0 rounded-t-lg border border-b-0 px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] transition",
              tab === item.id ? "border-border bg-card text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto bg-background border-b border-border">
        <div
          role="tabpanel"
          className={cn(
            "flex w-max min-w-full items-stretch divide-x divide-border border border-border bg-card",
            "rounded-xl",
            isFirstTabActive ? "rounded-tl-none" : ""
          )}
        >
          {children}
          {trailing}
        </div>
      </div>
    </div>
  );
}
