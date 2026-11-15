import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { calculateScrollState, initialScrollState, enterGraceMode } from "./scroll-direction";

/**
 * Context for the top-area scroll visibility state.
 * Provides { visible, enterGraceMode } to consumers.
 */
const ScrollContext = createContext({
  visible: true,
  enterGraceMode: () => {},
});

export const useScrollVisibility = () => useContext(ScrollContext);

/**
 * Provider that tracks window scroll and manages visibility of the top area.
 * Wraps the note tabs row, breadcrumb row, and ribbon panel.
 * 
 * Rules:
 * - Scroll DOWN: hide the top area (note tabs row, breadcrumb row, panel)
 *   Only the ribbon tab line (sticky) stays at top.
 * - Scroll UP, even by ~8px: show ALL of it at once
 * - At very top of page (scrollY <= 8): always show
 * - Dead zone: ignore tiny movements (< 8px)
 * - Hide threshold: 40px down since last direction change
 * - Show threshold: 16px up since last direction change
 * - Grace mode (after tab click/focus in top area): hide only after 80px down
 * - Popover open: keeps visible
 * - prefers-reduced-motion: no animation (handled in CSS)
 */
export function ScrollProvider({ children }) {
  const [visible, setVisible] = useState(true);
  const [state, setState] = useState(initialScrollState);
  const lastScrollYRef = useRef(0);
  const popoverCountRef = useRef(0);
  const prefersReducedMotionRef = useRef(false);

  // Track prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotionRef.current = mediaQuery.matches;
    const handler = (e) => { prefersReducedMotionRef.current = e.matches; };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const enterGraceModeCallback = useCallback(() => {
    setState((prev) => enterGraceMode(prev));
    setVisible(true);
  }, []);

  const registerPopover = useCallback(() => {
    popoverCountRef.current += 1;
    if (popoverCountRef.current === 1) {
      setVisible(true);
    }
  }, []);

  const unregisterPopover = useCallback(() => {
    popoverCountRef.current = Math.max(0, popoverCountRef.current - 1);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const newState = calculateScrollState(lastScrollYRef.current, scrollY, state, {
        popoverOpen: popoverCountRef.current > 0
      });
      setState(newState);
      setVisible(newState.visible);
      lastScrollYRef.current = scrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [state]);

  // Enter grace mode on focus/click in top area (includes ribbon tab line and panel)
  useEffect(() => {
    const onFocusIn = (event) => {
      const topArea = document.querySelector('[data-top-area]');
      const tabLine = document.querySelector('[data-ribbon-tab-line]');
      const ribbonPanel = document.querySelector('[data-ribbon-panel]');
      if ((topArea && topArea.contains(event.target)) || 
          (tabLine && tabLine.contains(event.target)) ||
          (ribbonPanel && ribbonPanel.contains(event.target))) {
        enterGraceModeCallback();
      }
    };
    
    const onClick = (event) => {
      const topArea = document.querySelector('[data-top-area]');
      const tabLine = document.querySelector('[data-ribbon-tab-line]');
      const ribbonPanel = document.querySelector('[data-ribbon-panel]');
      if ((topArea && topArea.contains(event.target)) || 
          (tabLine && tabLine.contains(event.target)) ||
          (ribbonPanel && ribbonPanel.contains(event.target))) {
        enterGraceModeCallback();
      }
    };
    
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("click", onClick);
    };
  }, [enterGraceModeCallback]);

  const value = {
    visible,
    enterGraceMode: enterGraceModeCallback,
    registerPopover,
    unregisterPopover,
    prefersReducedMotion: prefersReducedMotionRef.current
  };

  return (
    <ScrollContext.Provider value={value}>
      {children}
    </ScrollContext.Provider>
  );
}

/**
 * Consumer component that shows/hides its children based on scroll visibility.
 * Maintains layout height to prevent content jump.
 */
export function ScrollAwareTopArea({ children, className, style, "data-testid": testId }) {
  const { visible, prefersReducedMotion } = useScrollVisibility();
  const wrapperRef = useRef(null);

  const containerStyle = {
    transform: visible ? "translateY(0)" : "translateY(-100%)",
    opacity: visible ? 1 : 0,
    transition: prefersReducedMotion
      ? "none"
      : "transform 180ms ease-out, opacity 120ms ease-out",
    ...style
  };

  return (
    <div
      ref={wrapperRef}
      className={className}
      data-top-area
      data-testid={testId}
      style={{ height: "auto", minHeight: 0 }} // Height managed by children
    >
      <div style={containerStyle} role="region" aria-hidden={!visible}>
        {children}
      </div>
    </div>
  );
}

/**
 * One sticky block for breadcrumb row + ribbon tab line + ribbon panel.
 *
 * Why one block: the note tabs row, the breadcrumb and the panel used to move
 * themselves with transform inside the normal page flow. After the page had
 * scrolled, "visible" moved nothing into the window, so scrolling up never
 * brought them back. Here the whole block is position: sticky, so the same
 * transform really slides it in and out of the window.
 *
 * Hidden: the block is moved up by (tabs row height + breadcrumb height), so the
 * tab line lands exactly at the top of the window, and the panel (the last
 * rows of the block) is clipped away. The block keeps its place in the page flow,
 * so the text never jumps.
 * Needs the CSS variable --nb-tabs-h (set by NoteContainer) = height of the note tabs row.
 */
export function NoteTopStack({ children, className }) {
  const { visible, prefersReducedMotion } = useScrollVisibility();
  const ref = useRef(null);
  const [sizes, setSizes] = useState({ crumb: 0, panel: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => {
      // "crumb" = distance from the top of the block to the tab line (breadcrumb row + its gap).
      const tabLine = el.querySelector("[data-ribbon-tab-line]");
      const panel = el.querySelector("[data-ribbon-panel]");
      const lead = tabLine ? Math.round(tabLine.getBoundingClientRect().top - el.getBoundingClientRect().top) : 0;
      const next = { crumb: lead, panel: panel ? panel.offsetHeight : 0 };
      setSizes((prev) => (prev.crumb === next.crumb && prev.panel === next.panel ? prev : next));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hiddenShift = `calc(-1 * (var(--nb-tabs-h, 33px) + ${sizes.crumb}px))`;
  const style = {
    top: "var(--nb-tabs-h, 33px)",
    transform: visible ? "translateY(0)" : `translateY(${hiddenShift})`,
    clipPath: visible ? "none" : `inset(0 0 ${sizes.panel}px 0)`,
    transition: prefersReducedMotion ? "none" : "transform 180ms ease-out",
  };

  return (
    <div ref={ref} className={`sticky z-30 bg-background ${className || ""}`} style={style} data-top-stack data-top-area>
      {children}
    </div>
  );
}
