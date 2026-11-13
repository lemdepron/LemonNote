import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, MoreHorizontal } from "lucide-react";
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
import { computeIdealStates, GROUP_STATE, ICON_WIDTH } from "@/lib/ribbon-collapse";

export { GROUP_STATE };

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
 * never re-renders the groups, while `groupState` still updates them when the
 * state changes.
 */
export const RibbonCollapseApiContext = createContext(null);
export const RibbonCollapseStateContext = createContext(null);

export const useRibbonCollapseApi = () => useContext(RibbonCollapseApiContext);
export const useRibbonCollapseState = () => useContext(RibbonCollapseStateContext);

/**
 * Wraps the ribbon panel and decides, from the measured widths, which groups are
 * FULL (icons in two rows with the label), ICON (one button that opens the group)
 * or OVERFLOW (inside the "More" menu). The decision is a pure function of the
 * widths (see src/lib/ribbon-collapse.js), computed during render: there is no
 * hidden copy of the groups and no effect loop, so it cannot flicker.
 */
export function RibbonCollapseProvider({ children }) {
  const wrapRef = useRef(null);
  const [available, setAvailable] = useState(0);
  const [entries, setEntries] = useState(() => new Map());
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreNode, setMoreNode] = useState(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    // 2px for the panel border
    const measure = () => setAvailable(Math.max(0, Math.floor(el.clientWidth) - 2));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const api = useMemo(() => {
    const patch = (id, fn) =>
      setEntries((prev) => {
        const old = prev.get(id);
        if (!old) return prev;
        const next = fn(old);
        if (next === old) return prev;
        const map = new Map(prev);
        map.set(id, next);
        return map;
      });
    return {
      register: (id, priority) =>
        setEntries((prev) => {
          const old = prev.get(id);
          if (old && old.priority === priority) return prev;
          const map = new Map(prev);
          map.set(id, { id, priority, width: old?.width || 0, iconWidth: old?.iconWidth || ICON_WIDTH });
          return map;
        }),
      unregister: (id) =>
        setEntries((prev) => {
          if (!prev.has(id)) return prev;
          const map = new Map(prev);
          map.delete(id);
          return map;
        }),
      setWidth: (id, width) => patch(id, (e) => (e.width === width ? e : { ...e, width })),
      setIconWidth: (id, iconWidth) => patch(id, (e) => (e.iconWidth === iconWidth ? e : { ...e, iconWidth })),
    };
  }, []);

  const states = useMemo(() => computeIdealStates([...entries.values()], available), [entries, available]);
  const overflowCount = useMemo(() => [...states.values()].filter((v) => v === GROUP_STATE.OVERFLOW).length, [states]);

  const stateValue = useMemo(
    () => ({
      groupState: (id) => states.get(id) || GROUP_STATE.FULL,
      overflowCount,
      moreOpen,
      setMoreOpen,
      moreNode,
      setMoreNode,
    }),
    [states, overflowCount, moreOpen, moreNode]
  );

  return (
    <RibbonCollapseApiContext.Provider value={api}>
      <RibbonCollapseStateContext.Provider value={stateValue}>
        <div ref={wrapRef} className="w-full min-w-0">
          {children}
        </div>
      </RibbonCollapseStateContext.Provider>
    </RibbonCollapseApiContext.Provider>
  );
}

/**
 * The "More" button at the end of the ribbon row. It only appears when some
 * groups did not fit. The groups themselves render into the popover through a
 * portal (see RibbonGroup), so their buttons keep working normally.
 */
export function RibbonMore() {
  const state = useRibbonCollapseState();
  if (!state || state.overflowCount === 0) return null;
  return (
    <div className="flex shrink-0 items-center px-1.5">
      <Popover open={state.moreOpen} onOpenChange={state.setMoreOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            title={t("ribbon.more")}
            aria-label={t("ribbon.more")}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border/70 bg-card/60 transition hover:bg-accent hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="max-h-[70vh] w-[min(92vw,420px)] overflow-auto p-2"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <div ref={state.setMoreNode} className="flex flex-col gap-3" />
        </PopoverContent>
      </Popover>
    </div>
  );
}

const groupGridStyle = {
  display: "grid",
  gridAutoFlow: "column",
  gridTemplateRows: "repeat(2, 32px)",
  gridAutoColumns: "max-content",
  gap: "4px",
  alignItems: "center",
};

/**
 * The collapsed form of a ribbon group (ICON state): one 32px button with
 * group icon + chevron that opens the group's buttons in a popover.
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
          className="flex h-8 shrink-0 items-center justify-center gap-1 rounded-md border border-border/70 bg-card/60 px-2 transition hover:bg-accent hover:text-foreground"
        >
          {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : <span className="font-mono text-[10px] font-semibold uppercase leading-none">{String(label || "?").slice(0, 2)}</span>}
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
export function RibbonFrame({ tabs, tab, onTab, children, trailing, leading, className, isFirstTabActive, afterTabs }) {
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
        {afterTabs}
      </div>
      <RibbonCollapseProvider key={tab}>
        <div
          role="tabpanel"
          className={cn(
            "flex h-[96px] w-full min-w-0 items-stretch divide-x divide-border overflow-hidden border border-border bg-card",
            "rounded-xl",
            isFirstTabActive ? "rounded-ss-none" : ""
          )}
        >
          {children}
          <RibbonMore />
          {trailing}
        </div>
      </RibbonCollapseProvider>
    </div>
  );
}