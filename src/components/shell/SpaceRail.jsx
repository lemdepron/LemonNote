import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, Trash2 } from "lucide-react";
import { SPACES, spaceForPath } from "@/lib/spaces";
import { readPref, writePref } from "@/lib/preferences";
import { cn } from "@/lib/utils";

const PREF_KEY = "spaces:rail-collapsed";

function useSmallScreen() {
  const [small, setSmall] = useState(() => window.matchMedia("(max-width: 640px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const listener = (event) => setSmall(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);
  return small;
}

/**
 * The tab manifest rendered down the left edge.
 *
 * The rail is fixed, so the page shell reserves its width through the --rail-w
 * token set from the data-rail attribute. Collapsing is the user's decision and
 * nothing else overrides it: a collapsed rail opens on hover as an overlay, so
 * every tab label stays one gesture away without shifting the page.
 */
export default function SpaceRail() {
  const { pathname } = useLocation();
  const active = spaceForPath(pathname)?.id || null;
  const inBin = pathname.startsWith("/trash");
  const small = useSmallScreen();
  const [collapsed, setCollapsed] = useState(() => {
    const saved = readPref(PREF_KEY, null);
    return typeof saved === "boolean" ? saved : window.innerWidth < 768;
  });
  const [hovered, setHovered] = useState(false);

  const pinned = !collapsed;
  // Phones keep the icon rail; everywhere else hovering a collapsed rail opens it.
  const open = small ? false : pinned || hovered;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.rail = pinned && !small ? "expanded" : "collapsed";
    return () => {
      delete root.dataset.rail;
    };
  }, [pinned, small]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    setHovered(false);
    writePref(PREF_KEY, next);
  };

  return (
    <aside
      aria-label="Workspace tabs"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border/70 bg-card/90 backdrop-blur-xl",
        "transition-[width,box-shadow] duration-200 ease-out",
        open ? "w-[12.5rem]" : "w-[3.75rem]",
        open && !pinned ? "shadow-xl" : ""
      )}
    >
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
        {SPACES.filter((space) => space.rail !== false).map((space) => {
          const Icon = space.icon;
          const current = active === space.id && !inBin;
          return (
            <Link
              key={space.id}
              to={space.path}
              title={space.label}
              aria-label={space.label}
              aria-current={current ? "page" : undefined}
              className={cn(
                "relative flex shrink-0 items-center rounded-md py-2 transition",
                open ? "gap-2.5 px-2.5" : "justify-center px-0",
                current
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              {current && <span className="absolute inset-y-1.5 left-0 w-[2px] rounded-full bg-primary" />}
              <Icon className="h-4 w-4 shrink-0" />
              {open && (
                <span className="truncate font-mono text-[10.5px] uppercase tracking-[0.14em]">{space.label}</span>
              )}
            </Link>
          );
        })}

        <Link
          to="/trash"
          title="Bin"
          aria-label="Bin"
          aria-current={inBin ? "page" : undefined}
          className={cn(
            "relative flex shrink-0 items-center rounded-md py-2 transition",
            open ? "gap-2.5 px-2.5" : "justify-center px-0",
            inBin ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
          )}
        >
          {inBin && <span className="absolute inset-y-1.5 left-0 w-[2px] rounded-full bg-primary" />}
          <Trash2 className="h-4 w-4 shrink-0" />
          {open && <span className="truncate font-mono text-[10.5px] uppercase tracking-[0.14em]">Bin</span>}
        </Link>
      </nav>

      <div className="border-t border-border/60 px-2 py-2">
        {open && (
          <p className="px-1.5 pb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">
            one workspace
          </p>
        )}

        <div className={cn("flex items-center gap-2 py-1", open ? "px-1" : "justify-center")} title="Local vault">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border bg-muted/60 font-mono text-[10px] text-muted-foreground">
            N
          </span>
          {open && !small && (
            <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-muted-foreground">local vault</span>
          )}
        </div>

        {!small && (
          <button
            type="button"
            onClick={toggle}
            aria-pressed={pinned}
            aria-label={collapsed ? "Pin the tab rail open" : "Collapse the tab rail"}
            title={collapsed ? "Pin open" : "Collapse to icons"}
            className={cn(
              "flex w-full items-center rounded-md py-1.5 text-muted-foreground transition hover:bg-accent/60 hover:text-foreground",
              open ? "gap-1.5 px-1.5" : "justify-center px-0"
            )}
          >
            {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
            {open && (
              <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
                {collapsed ? "pin open" : "collapse"}
              </span>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}