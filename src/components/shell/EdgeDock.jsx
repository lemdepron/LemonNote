import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFocusMode } from "@/lib/focusMode";
import { readPref, writePref } from "@/lib/preferences";

const DOCK_KEY = "dockPanel";

/**
 * Full-screen view docks every floating panel into a semi-transparent icon rail
 * on the right margin. Flyouts stay mounted while collapsed, so panel state and
 * data connections survive collapsing, expanding and switching panels.
 */
export default function EdgeDock({ panels }) {
  const { focus } = useFocusMode();
  const [openId, setOpenId] = useState(() => readPref(DOCK_KEY, null));

  const close = () => {
    setOpenId(null);
    writePref(DOCK_KEY, null);
  };

  const toggle = (id) => {
    const next = openId === id ? null : id;
    setOpenId(next);
    writePref(DOCK_KEY, next);
  };

  useEffect(() => {
    if (!focus) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") {
        setOpenId(null);
        writePref(DOCK_KEY, null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);

  if (!focus || !panels?.length) return null;

  const render = (panel) => (typeof panel.content === "function" ? panel.content(close) : panel.content);

  return (
    <div className="pointer-events-none fixed inset-y-0 right-0 z-40 flex items-center">
      <div className="nb-fade pointer-events-auto relative flex flex-col items-center gap-1.5 pr-1 sm:pr-2">
        {panels.map((panel) => {
          const Icon = panel.icon;
          const active = openId === panel.id;
          return (
            <button
              key={panel.id}
              type="button"
              data-dock="trigger"
              onClick={() => toggle(panel.id)}
              aria-label={panel.label}
              aria-pressed={active}
              className={cn(
                "group relative grid h-9 w-9 place-items-center rounded-lg border backdrop-blur transition-[transform,opacity,background-color,border-color,color] duration-200 ease-out transform-gpu hover:scale-[1.06] active:scale-95",
                active
                  ? "border-primary/50 bg-primary/15 text-primary opacity-100"
                  : "border-border/60 bg-card/40 text-muted-foreground opacity-45 hover:border-border hover:bg-card/80 hover:text-foreground hover:opacity-100"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="pointer-events-none absolute right-full top-1/2 z-20 mr-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border/70 bg-popover px-2 py-1 font-mono text-[10px] text-foreground opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                {panel.label}
              </span>
            </button>
          );
        })}

        {panels.map((panel) => {
          const active = openId === panel.id;
          return (
            <div
              key={panel.id}
              data-dock="flyout"
              aria-hidden={!active}
              className={cn(
                "absolute right-full top-1/2 z-30 mr-2 w-[min(320px,86vw)] origin-right -translate-y-1/2 overflow-hidden rounded-xl border border-border/70 bg-popover/95 shadow-2xl shadow-[hsl(var(--shadow)/0.5)] backdrop-blur-xl transition-[opacity,transform] duration-200 ease-out transform-gpu will-change-transform",
                active
                  ? "pointer-events-auto translate-x-0 scale-100 opacity-100"
                  : "pointer-events-none translate-x-2 scale-95 opacity-0"
              )}
            >
              <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                <span className="nb-label">{panel.label}</span>
                <button
                  type="button"
                  onClick={close}
                  aria-label={`Collapse ${panel.label}`}
                  className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="max-h-[78vh] overflow-y-auto p-2">{render(panel)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}