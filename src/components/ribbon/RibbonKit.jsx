import { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";
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
  const { register, unregister } = useRibbonPanelPopover();
  const off = !ctx.markdown || Boolean(disabled);
  if (off) return <RibbonButton id={id} icon={icon} label={label} hint={hint} disabled disabledReason={!ctx.markdown ? ctx.offReason : disabledReason} />;
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          register();
          onOpenChange?.();
        } else {
          unregister();
        }
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
 * Context for tracking popover open state in the ribbon panel.
 * Used to prevent panel from hiding while a popover is open.
 */
export const RibbonPanelPopoverContext = createContext({ openCount: 0, register: () => {}, unregister: () => {} });
export const useRibbonPanelPopover = () => useContext(RibbonPanelPopoverContext);

/**
 * Provider for tracking popover open state in the ribbon panel.
 */
export function RibbonPanelPopoverProvider({ children }) {
  const [openCount, setOpenCount] = useState(0);
  const register = useCallback(() => setOpenCount((c) => c + 1), []);
  const unregister = useCallback(() => setOpenCount((c) => Math.max(0, c - 1)), []);
  return (
    <RibbonPanelPopoverContext.Provider value={{ openCount, register, unregister }}>
      {children}
    </RibbonPanelPopoverContext.Provider>
  );
}

/**
 * Hook for detecting scroll direction with asymmetric thresholds.
 * Returns { visible: boolean, showPanel: () => void, hidePanel: () => void }
 * 
 * Rules:
 * - Hide when scrolled DOWN at least 40px since last direction change
 * - Show when scrolled UP at least 16px since last direction change, or scrollY < 8px
 * - After ribbon tab click or focus in ribbon: grace mode (hide only after 80px down)
 * - Popover open keeps panel visible
 * - Listens to window scroll
 */
export function useRibbonPanelScroll({ deadZone = 8, hideThreshold = 40, showThreshold = 16, graceThreshold = 80 } = {}) {
  const [visible, setVisible] = useState(true);
  const { openCount } = useRibbonPanelPopover();

  // Refs to avoid stale closures in scroll handler
  const lastScrollYRef = useRef(0);
  const accumulatedRef = useRef(0);
  const directionRef = useRef(0); // 1 = down, -1 = up, 0 = none
  const graceModeRef = useRef(false);
  const atTopRef = useRef(true);

  const showPanel = useCallback(() => {
    setVisible(true);
    accumulatedRef.current = -showThreshold;
    directionRef.current = -1;
  }, []);

  const hidePanel = useCallback(() => {
    setVisible(false);
    accumulatedRef.current = hideThreshold;
    directionRef.current = 1;
  }, []);

  const enterGraceMode = useCallback(() => {
    graceModeRef.current = true;
    setVisible(true);
    accumulatedRef.current = -graceThreshold;
    directionRef.current = -1;
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const atTop = scrollY <= deadZone;

      // Always show panel at very top of page (scrollY < 8px)
      if (atTop) {
        atTopRef.current = true;
        if (!visible) setVisible(true);
        accumulatedRef.current = -showThreshold;
        directionRef.current = -1;
        graceModeRef.current = false;
        lastScrollYRef.current = scrollY;
        return;
      }

      atTopRef.current = false;

      // Don't hide if popover is open
      if (openCount > 0) {
        if (!visible) setVisible(true);
        lastScrollYRef.current = scrollY;
        return;
      }

      const delta = scrollY - lastScrollYRef.current;
      const absDelta = Math.abs(delta);

      // Ignore tiny movements (dead zone)
      if (absDelta < deadZone) {
        return;
      }

      const currentDirection = delta > 0 ? 1 : -1;
      const threshold = graceModeRef.current ? graceThreshold : (currentDirection > 0 ? hideThreshold : showThreshold);

      // Direction changed
      if (currentDirection !== directionRef.current && directionRef.current !== 0) {
        accumulatedRef.current = delta;
      } else {
        accumulatedRef.current += delta;
      }
      directionRef.current = currentDirection;

      // Exit grace mode once we scroll down past graceThreshold
      if (graceModeRef.current && directionRef.current === 1 && accumulatedRef.current >= graceThreshold) {
        graceModeRef.current = false;
      }

      // Hide logic
      if (directionRef.current === 1 && accumulatedRef.current >= threshold) {
        if (visible) setVisible(false);
        accumulatedRef.current = threshold;
      }
      // Show logic (scroll up)
      else if (directionRef.current === -1 && accumulatedRef.current <= -threshold) {
        if (!visible) setVisible(true);
        accumulatedRef.current = -threshold;
      }

      lastScrollYRef.current = scrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [deadZone, hideThreshold, showThreshold, graceThreshold, openCount, visible]);

  // Enter grace mode on focus/click in ribbon (tab click or focus inside ribbon)
  useEffect(() => {
    const onFocusIn = (event) => {
      const ribbon = document.querySelector('[data-ribbon-panel]');
      const tabLine = document.querySelector('[data-ribbon-tab-line]');
      if ((ribbon && ribbon.contains(event.target)) || (tabLine && tabLine.contains(event.target))) {
        enterGraceMode();
      }
    };
    
    const onClick = (event) => {
      const tabLine = document.querySelector('[data-ribbon-tab-line]');
      if (tabLine && tabLine.contains(event.target)) {
        enterGraceMode();
      }
    };
    
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("click", onClick);
    };
  }, [enterGraceMode]);

  return { visible, showPanel, hidePanel, enterGraceMode };
}

/**
 * The tab line (sticky): undo/redo/star, file, tabs, goal, macros.
 * This is the only part that stays sticky at the top.
 */
export function RibbonTabLine({ tabs, tab, onTab, leading, trailing, afterTabs, className, isFirstTabActive }) {
  return (
    <div
      role="tablist"
      aria-label={t("ribbon.tabsAria")}
      className={cn(
        "scrollbar-none flex gap-0.5 overflow-x-auto px-1 bg-background border-b border-border",
        "sticky top-0 z-30",
        className
      )}
      data-ribbon-tab-line
    >
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
  );
}

/**
 * The panel (auto-hide): the 96px row of groups.
 * Hides on scroll down, shows on scroll up.
 * Wrapper always maintains 96px height to prevent content jump.
 */
export function RibbonPanel({ children, trailing, className, isFirstTabActive }) {
  const { visible } = useRibbonPanelScroll();
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotion.current = mediaQuery.matches;
    const handler = (e) => { prefersReducedMotion.current = e.matches; };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const panelStyle = {
    transform: visible ? "translateY(0)" : "translateY(-100%)",
    opacity: visible ? 1 : 0,
    transition: prefersReducedMotion.current
      ? "none"
      : "transform 180ms ease-out, opacity 120ms ease-out",
  };

  return (
    <>
      {/* Wrapper that ALWAYS maintains 96px height in layout flow */}
      <div
        className={cn(
          "flex h-[96px] w-full min-w-0 items-stretch divide-x divide-border overflow-hidden border border-border bg-card",
          "rounded-xl",
          isFirstTabActive ? "rounded-ss-none" : "",
          className
        )}
        data-ribbon-panel
        aria-hidden={!visible}
      >
        {/* Inner panel that slides */}
        <div style={panelStyle} className="w-full" role="tabpanel">
          <div className="flex h-full w-full min-w-0 items-stretch overflow-x-auto scrollbar-thin" style={{ flexWrap: "nowrap" }}>
            {children}
            {trailing}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Combined frame for backwards compatibility.
 * Renders both tab line and panel.
 * @deprecated Use RibbonTabLine and RibbonPanel separately for sticky behavior.
 */
export function RibbonFrame({ tabs, tab, onTab, children, trailing, leading, className, isFirstTabActive, afterTabs }) {
  return (
    <div className={cn("bg-background", className)} data-ribbon-frame>
      <RibbonTabLine
        tabs={tabs}
        tab={tab}
        onTab={onTab}
        leading={leading}
        trailing={trailing}
        afterTabs={afterTabs}
        isFirstTabActive={isFirstTabActive}
      />
      <RibbonPanel
        children={children}
        trailing={trailing}
        isFirstTabActive={isFirstTabActive}
      />
    </div>
  );
}