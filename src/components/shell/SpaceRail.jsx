import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, Trash2, ChevronDown, ExternalLink, Settings } from "lucide-react";
import { SPACES, spaceForPath } from "@/lib/spaces";
import { readPref, writePref } from "@/lib/preferences";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const PREF_KEY = "spaces:rail-collapsed";
const MORE_PREF_KEY = "spaces:more-open";

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
  const [moreOpen, setMoreOpen] = useState(() => {
    const saved = readPref(MORE_PREF_KEY, null);
    return typeof saved === "boolean" ? saved : true;
  });

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

  const toggleMore = () => {
    const next = !moreOpen;
    setMoreOpen(next);
    writePref(MORE_PREF_KEY, next);
  };

  // Main spaces (excluding those with rail: false)
  const mainSpaces = SPACES.filter((space) => space.rail !== false);
  const spaceLabel = (id) => t(`rail.spaces.${id}`);

  // More group spaces: Queries, Plugins, Sync
  const moreSpaces = [
    { id: "queries", label: t("rail.spaces.queries"), path: "/queries", icon: SPACES.find(s => s.id === "queries")?.icon },
    { id: "extensions", label: t("rail.spaces.extensions"), path: "/extensions", icon: SPACES.find(s => s.id === "extensions")?.icon },
    { id: "sync", label: t("rail.spaces.sync"), path: "#", icon: ExternalLink, disabled: true, soon: true, title: t("rail.syncTitle") },
  ];

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
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
        {mainSpaces.map((space) => {
          const Icon = space.icon;
          const current = active === space.id && !inBin;
          return (
            <Link
              key={space.id}
              to={space.path}
              title={spaceLabel(space.id)}
              aria-label={spaceLabel(space.id)}
              aria-current={current ? "page" : undefined}
              className={cn(
                "relative flex shrink-0 items-center rounded-md py-2 transition",
                open ? "gap-2.5 px-2.5" : "justify-center px-0",
                current
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              {current && <span className="absolute inset-y-1.5 start-0 w-[2px] rounded-full bg-primary" />}
              <Icon className="h-4 w-4 shrink-0" />
              {open && (
                <span className="truncate font-mono text-[10.5px] uppercase tracking-[0.14em]">{spaceLabel(space.id)}</span>
              )}
            </Link>
          );
        })}

        <Link
          to="/trash"
          title={t("rail.bin")}
          aria-label={t("rail.bin")}
          aria-current={inBin ? "page" : undefined}
          className={cn(
            "relative flex shrink-0 items-center rounded-md py-2 transition",
            open ? "gap-2.5 px-2.5" : "justify-center px-0",
            inBin ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
          )}
        >
          {inBin && <span className="absolute inset-y-1.5 start-0 w-[2px] rounded-full bg-primary" />}
          <Trash2 className="h-4 w-4 shrink-0" />
          {open && <span className="truncate font-mono text-[10.5px] uppercase tracking-[0.14em]">{t("rail.bin")}</span>}
        </Link>

        {/* More group - collapsible */}
        <div className="border-t border-border/60 my-1 pt-1" />
        <button
          type="button"
          onClick={toggleMore}
          aria-expanded={moreOpen}
          aria-label={t("rail.moreGroupAria")}
          className={cn(
            "flex items-center gap-2 w-full rounded-md py-1.5 px-2 transition",
            open ? "justify-start" : "justify-center",
            "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
          )}
        >
          <span className="h-4 w-4 shrink-0 flex items-center justify-center">
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                moreOpen ? "rotate-180" : ""
              )}
            />
          </span>
          {open && (
            <span className="truncate font-mono text-[10.5px] uppercase tracking-[0.14em]">{t("rail.more")}</span>
          )}
        </button>

        {moreOpen && (
          <div className="flex flex-col gap-0.5 ps-0" role="group" aria-label={t("rail.moreGroupAria")}>
            {moreSpaces.map((space) => {
              const Icon = space.icon;
              const current = active === space.id && !space.disabled;
              const isDisabled = space.disabled;
              return (
                <Link
                  key={space.id}
                  to={space.path}
                  title={space.title}
                  aria-label={space.label}
                  aria-current={current ? "page" : undefined}
                  aria-disabled={isDisabled}
                  tabIndex={isDisabled ? -1 : undefined}
                  onClick={(e) => isDisabled && e.preventDefault()}
                  className={cn(
                    "relative flex shrink-0 items-center rounded-md py-2 transition",
                    open ? "gap-2.5 px-2.5" : "justify-center px-0",
                    isDisabled
                      ? "opacity-40 cursor-not-allowed text-muted-foreground"
                      : current
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  {current && !isDisabled && <span className="absolute inset-y-1.5 start-0 w-[2px] rounded-full bg-primary" />}
                  <Icon className="h-4 w-4 shrink-0" />
                  {open && (
                    <span className="truncate font-mono text-[10.5px] uppercase tracking-[0.14em] flex items-center gap-1">
                      {space.label}
                      {space.soon && (
                        <span className="px-1 py-0.5 rounded text-[8px] font-mono uppercase tracking-[0.1em] bg-muted border border-border text-muted-foreground">
                          {t("rail.soon")}
                        </span>
                      )}
                    </span>
                  )}
                  {!open && space.soon && (
                    <span className="absolute bottom-0 end-0 -translate-y-1/2 translate-x-1/2 rtl:translate-x-[-50%] px-0.5 py-0 rounded text-[7px] font-mono uppercase tracking-[0.1em] bg-muted border border-border text-muted-foreground whitespace-nowrap">
                      {t("rail.soon")}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="border-t border-border/60 px-2 py-2">
        {open && (
          <p className="px-1.5 pb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">
            {t("rail.oneWorkspace")}
          </p>
        )}

        <Link
          to="/settings"
          title={t("rail.settings")}
          aria-label={t("rail.settings")}
          aria-current={active === "settings" ? "page" : undefined}
          className={cn(
            "relative flex shrink-0 items-center rounded-md py-2 transition",
            open ? "gap-2.5 px-2.5" : "justify-center px-0",
            active === "settings"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
          )}
        >
          {active === "settings" && <span className="absolute inset-y-1.5 start-0 w-[2px] rounded-full bg-primary" />}
          <Settings className="h-4 w-4 shrink-0" />
          {open && <span className="truncate font-mono text-[10.5px] uppercase tracking-[0.14em]">{t("rail.settings")}</span>}
        </Link>

        <div className={cn("flex items-center gap-2 py-1", open ? "px-1" : "justify-center")} title={t("rail.localVault")}>
          <img
            src="/logo-64.png"
            alt=""
            className="h-7 w-7 shrink-0 rounded-full border border-border bg-muted/60"
            aria-hidden="true"
          />
          {open && !small && (
            <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-muted-foreground">{t("rail.localVault")}</span>
          )}
        </div>

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
            {collapsed ? <ChevronsRight className="h-3.5 w-3.5 rtl:rotate-180" /> : <ChevronsLeft className="h-3.5 w-3.5 rtl:rotate-180" />}
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