import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import SpaceRail from "@/components/shell/SpaceRail";
import CommandPalette from "@/components/shell/CommandPalette";
import ThemeToggle from "@/components/shell/ThemeToggle";
import { useI18n } from "@/lib/i18n";

export default function VaultHeader({ children }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const inputRef = useRef(null);
  const onHome = location.pathname === "/";
  const query = onHome ? params.get("q") || "" : "";
  const [paletteOpen, setPaletteOpen] = useState(false);

  const updateQuery = (value) => {
    if (!onHome) {
      navigate(value ? `/?q=${encodeURIComponent(value)}` : "/");
      return;
    }
    const next = Object.fromEntries(params.entries());
    if (value) next.q = value;
    else delete next.q;
    setParams(next, { replace: true });
  };

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }
      const target = event.target;
      const typing = target instanceof HTMLElement && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable);
      if (event.key === "/" && !typing && !paletteOpen && !onHome) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, onHome]);

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex shrink-0 items-center gap-2.5">
          <img
            src="/logo-64.png"
            alt=""
            className="h-7 w-7 rounded-[7px] border border-primary/30 bg-primary/10 transition group-hover:border-primary/60"
            aria-hidden="true"
          />
          <span className="hidden font-display text-[20px] leading-none tracking-tight sm:inline">LemonNote</span>
        </Link>
        <div className="ms-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none">
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder={t("header.searchVault")}
              aria-label={t("header.quickSearchAria")}
              className="h-9 w-full min-w-0 rounded-lg border border-border/80 bg-card/60 ps-8 pe-2 text-[13px] text-foreground outline-none transition focus:border-primary/40 focus:bg-card sm:w-56 sm:pe-12"
            />
            <kbd className="pointer-events-none absolute end-2 top-1/2 hidden -translate-y-1/2 rounded border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground sm:block">
            /
            </kbd>
          </div>

          <Button
            asChild
            size="sm"
            className="h-9 gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Link to="/note/new">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("header.newNote")}</span>
            </Link>
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </header>
    {children && (
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    )}
    <SpaceRail />
    <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}