import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronsRight, GitBranch, LayoutGrid, Puzzle, RefreshCw, Search, Settings, Trash2 } from "lucide-react";
import { SPACES, spaceForPath } from "@/lib/spaces";
import { readPref, writePref } from "@/lib/preferences";
import { useI18n } from "@/lib/i18n";
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
 * The tab manifest rendered along the leading edge (left in LTR, right in RTL).
 *
 * The rail is fixed, so the page shell reserves its width through the --rail-w
 * token set from the data-rail attribute. Collapsing is the user's decision and
 * nothing else overrides it: a collapsed rail opens on hover as an overlay, so
 * every tab label stays one gesture away without shifting the page.
 */
export default function SpaceRail() {
  const { t } = useI18n();
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

  // Rail items in the new order: Vault, Graph, Canvas, Queries, Plugins, Bin, divider, Sync, divider, Settings, Logo, Collapse
  const railItems = [
    { id: "vault", path: "/", icon: SPACES.find(s => s.id === "vault")?.icon },
    { id: "graph", path: "/graph", icon: GitBranch },
    { id: "canvas", path: "/canvas", icon: LayoutGrid },
    { id: "queries", path: "/queries", icon: Search },
    { id: "extensions", path: "/extensions", icon: Puzzle },
    { id: "bin", path: "/trash", icon: Trash2, isBin: true },
    { type: "divider" },
    { id: "sync", path: "#", icon: RefreshCw, disabled: true, soon: true, title: t("rail.syncTitle") },
    { type: "divider" },
    { id: "settings", path: "/settings", icon: Settings },
  ];

  const spaceLabel = (id) => t(`rail.spaces.${id}`);

  return (
    <aside
      aria-label={t("rail.tabsAria")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
      className={cn(
        "fixed inset-y-0 start-0 z-40 flex flex-col border-e border-border/70 bg-card/90 backdrop-blur-xl",
        "transition-[width,box-shadow] duration-200 ease-out",
        open ? "w-[12.5rem]" : "w-[3.75rem]",
        open && !pinned ? "shadow-xl" : ""
      )}
    >
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-2 py-3">
        {railItems.map((item, index) => {
          if (item.type === "divider") {
            return <div key={`divider-${index}`} className="border-t border-border/60 my-1" />;
          }

          const Icon = item.icon;
          const isBin = item.isBin === true;
          const isDisabled = item.disabled === true;
          const isSoon = item.soon === true;
          const current = active === item.id && !isDisabled && !isBin;
          const binCurrent = inBin && isBin;
          const settingsCurrent = active === "settings" && item.id === "settings";

          if (isBin) {
            return (
              <Link
                key={item.id}
                to={item.path}
                title={t("rail.bin")}
                aria-label={t("rail.bin")}
                aria-current={binCurrent ? "page" : undefined}
                className={cn(
                  "relative flex shrink-0 items-center rounded-md py-2 transition",
                  open ? "gap-2.5 px-2.5" : "justify-center px-0",
                  binCurrent
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                {binCurrent && <span className="absolute inset-y-1.5 start-0 w-[2px] rounded-full bg-primary" />}
                <Icon className="h-4 w-4 shrink-0" />
                {open && (
                  <span className="truncate font-mono text-[10.5px] uppercase tracking-[0.14em]">{t("rail.bin")}</span>
                )}
              </Link>
            );
          }

          return (
            <Link
              key={item.id}
              to={item.path}
              title={item.title || spaceLabel(item.id)}
              aria-label={item.title || spaceLabel(item.id)}
              aria-current={(current || settingsCurrent) ? "page" : undefined}
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : undefined}
              onClick={(e) => isDisabled && e.preventDefault()}
              className={cn(
                "relative flex shrink-0 items-center rounded-md py-2 transition",
                open ? "gap-2.5 px-2.5" : "justify-center px-0",
                isDisabled
                  ? "opacity-40 cursor-not-allowed text-muted-foreground"
                  : current || settingsCurrent
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              {(current || settingsCurrent) && !isDisabled && (
                <span className="absolute inset-y-1.5 start-0 w-[2px] rounded-full bg-primary" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              {open && (
                <span className="truncate font-mono text-[10.5px] uppercase tracking-[0.14em] flex items-center gap-1">
                  {item.title || spaceLabel(item.id)}
                  {isSoon && (
                    <span className="px-1 py-0.5 rounded text-[8px] font-mono uppercase tracking-[0.1em] bg-muted border border-border text-muted-foreground">
                      {t("rail.soon")}
                    </span>
                  )}
                </span>
              )}
              
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 px-2 py-2">
        {open && (
          <p className="px-1.5 pb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">
            {t("rail.oneWorkspace")}
          </p>
        )}

        <Link
          to="/"
          title={t("rail.localVault")}
          aria-label={t("rail.localVault")}
          className={cn("flex items-center gap-2 py-1", open ? "px-1" : "justify-center")}
        >
          <img
            src="/logo-64.png"
            alt=""
            className="h-7 w-7 shrink-0 rounded-full border border-border bg-muted/60"
            aria-hidden="true"
          />
          {open && !small && (
            <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-muted-foreground">{t("rail.localVault")}</span>
          )}
        </Link>

        {!small && (
          <button
            type="button"
            onClick={toggle}
            aria-pressed={pinned}
            aria-label={collapsed ? t("rail.pinOpenAria") : t("rail.collapseAria")}
            title={collapsed ? t("rail.pinOpen") : t("rail.collapse")}
            className={cn(
              "flex w-full items-center rounded-md py-1.5 text-muted-foreground transition hover:bg-accent/60 hover:text-foreground",
              open ? "gap-1.5 px-1.5" : "justify-center px-0"
            )}
          >
            <ChevronsRight
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200 rtl:rotate-180",
                open ? "rotate-180" : ""
              )}
            />
            {open && (
              <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
                {collapsed ? t("rail.pinOpen") : t("rail.collapse")}
              </span>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}