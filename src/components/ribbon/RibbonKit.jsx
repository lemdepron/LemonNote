import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { pickNextToCollapse, pickNextToExpand } from "@/lib/ribbon-collapse";

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

/**
 * The collapse context is split in two so the stable API (register / measure)
 * never re-renders the groups, while `isCollapsed` still updates them when the
 * collapsed set changes.
 */
export const RibbonCollapseApiContext = createContext(null);
export const RibbonCollapseStateContext = createContext(null);

export const useRibbonCollapseApi = () => useContext(RibbonCollapseApiContext);
export const useRibbonCollapseState = () => useContext(RibbonCollapseStateContext);

/**
 * Wraps the ribbon panel. It measures the panel width, collects each group's
 * natural width and priority, and collapses the lowest-priority groups one at
 * a time (into a dropdown button) until the panel no longer overflows.
 */
export function RibbonCollapseProvider({ tab, children }) {
  const panelRef = useRef(null);
  const [entries, setEntries] = useState(() => new Map());
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [available, setAvailable] = useState(0);

  // Measure the visible panel width. `available` is only a re-run trigger; the
  // collapse decision itself uses the real `scrollWidth - clientWidth`.
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return undefined;
    const update = () => setAvailable(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tab]);

  const register = useCallback((id, priority) => {
    setEntries((prev) => {
      if (prev.has(id)) return prev;
      const next = new Map(prev);
      next.set(id, { id, priority, width: 0 });
      return next;
    });
  }, []);

  const unregister = useCallback((id) => {
    setEntries((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const setWidth = useCallback((id, width) => {
    setEntries((prev) => {
      const entry = prev.get(id);
      if (!entry || entry.width === width) return prev;
      const next = new Map(prev);
      next.set(id, { ...entry, width });
      return next;
    });
  }, []);

  // Collapse one group per pass while the content overflows; expand the
  // highest-priority collapsed group when there is room for it.
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el || !available) return;
    const overflow = el.scrollWidth - el.clientWidth;
    if (overflow > 1) {
      const next = pickNextToCollapse([...entries.values()], collapsed);
      if (next) setCollapsed((prev) => new Set(prev).add(next.id));
    } else if (overflow < -8) {
      const next = pickNextToExpand([...entries.values()], collapsed, -overflow);
      if (next) {
        setCollapsed((prev) => {
          const copy = new Set(prev);
          copy.delete(next.id);
          return copy;
        });
      }
    }
  }, [entries, available, collapsed, tab]);

  const api = useMemo(() => ({ register, unregister, setWidth }), [register, unregister, setWidth]);
  const state = useMemo(() => ({ isCollapsed: (id) => collapsed.has(id) }), [collapsed]);

  return (
    <RibbonCollapseApiContext.Provider value={api}>
      <RibbonCollapseStateContext.Provider value={state}>
        <div ref={panelRef} className="overflow-hidden bg-background border-b border-border">
          {children}
        </div>
      </RibbonCollapseStateContext.Provider>
    </RibbonCollapseApiContext.Provider>
  );
}

/**
 * The collapsed form of a ribbon group: one button (group icon + group name +
 * chevron) that opens the group's buttons in a popover.
 */
export function GroupMenu({ icon: Icon, label, width = 320, children }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          title={label}
          aria-label={label}
          aria-expanded={open}
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border/70 bg-card/60 px-2 font-mono text-[10.5px] text-foreground/85 transition hover:bg-accent hover:text-foreground"
        >
          {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
          <span className="whitespace-nowrap">{label}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        style={{ width }}
        className="max-h-[70vh] overflow-auto p-2"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        {children(() => setOpen(false))}
      </PopoverContent>
    </Popover>
  );
}

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
 * Not sticky on its own: the note ribbon renders this inside the sticky header
 * wrapper (VaultHeader), which gives one solid stack with a hairline bottom.
 */
export function RibbonFrame({ tabs, tab, onTab, children, trailing, leading, className, isFirstTabActive }) {
  return (
    <div className={cn("bg-background", className)}>
      <div role="tablist" aria-label={t("ribbon.tabsAria")} className="scrollbar-none flex gap-0.5 overflow-x-auto px-1 bg-background border-b border-border">
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
      <RibbonCollapseProvider key={tab}>
        <div
          role="tabpanel"
          className={cn(
            "flex w-max min-w-full items-stretch divide-x divide-border border border-border bg-card",
            "rounded-xl",
            isFirstTabActive ? "rounded-ss-none" : ""
          )}
        >
          {children}
          {trailing}
        </div>
      </RibbonCollapseProvider>
    </div>
  );
}
