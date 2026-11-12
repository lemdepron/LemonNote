import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import {
  DEFAULT_PRESET,
  THEME_PRESETS,
  readPresetId,
  setPreset,
} from "@/lib/theme-presets";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const GROUPS = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

function ThemeMiniPreview({ preset, mode }) {
  const tokens = preset?.tokens?.[mode];
  if (!tokens || !tokens["--background"]) return null;

  const style = {
    // Apply theme tokens as inline styles
    '--background': `hsl(${tokens["--background"]})`,
    '--foreground': `hsl(${tokens["--foreground"]})`,
    '--card': `hsl(${tokens["--card"]})`,
    '--card-foreground': `hsl(${tokens["--card-foreground"]})`,
    '--primary': `hsl(${tokens["--primary"]})`,
    '--primary-foreground': `hsl(${tokens["--primary-foreground"]})`,
    '--secondary': `hsl(${tokens["--secondary"]})`,
    '--secondary-foreground': `hsl(${tokens["--secondary-foreground"]})`,
    '--border': `hsl(${tokens["--border"]})`,
    '--ring': `hsl(${tokens["--ring"]})`,
    '--r-control': tokens["--r-control"],
    '--r-card': tokens["--r-card"],
    '--r-pill': tokens["--r-pill"],
    '--r-tab': tokens["--r-tab"],
    '--border-width': tokens["--border-width"],
    '--shadow-card': tokens["--shadow-card"],
    '--shadow-pop': tokens["--shadow-pop"],
    '--font-heading': tokens["--font-heading"],
    '--font-body': tokens["--font-body"],
  };

  return (
    <div
      className="nb-theme-preview"
      style={style}
      data-shadow-style={tokens["--shadow-style"]}
      data-tab-style={tokens["--tab-style"]}
      data-button-style={tokens["--button-style"]}
    >
      <div className="nb-preview-card nb-card p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="nb-preview-chip nb-chip px-2 py-0.5 text-[10px] font-mono">Tag</span>
          <span className="nb-preview-tab nb-tab px-3 py-1 text-[10px] font-mono">Tab</span>
        </div>
        <button className="nb-preview-btn nb-button nb-btn-base w-full py-1.5 text-[11px] font-medium">Button</button>
      </div>
    </div>
  );
}

export default function ThemeGallery() {
  const { resolved, setMode } = useTheme();
  const [activeId, setActiveId] = useState(readPresetId);
  const [group, setGroup] = useState(() => (resolved === "light" ? "light" : "dark"));

  const presets = THEME_PRESETS.filter((preset) => !preset.mode || preset.mode === group);
  const dualCount = THEME_PRESETS.filter((preset) => preset.id !== DEFAULT_PRESET.id && !preset.mode).length;

  const applyPreset = (preset) => {
    if (preset.mode) setMode(preset.mode);
    else if (preset.id !== DEFAULT_PRESET.id) setMode(group);
    setPreset(preset.id);
    setActiveId(preset.id);
  };

  return (
    <section className="rounded-xl border border-border/60 bg-card/25 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="nb-label">theme presets</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {THEME_PRESETS.length - 1} palettes and surface textures — {dualCount} of them ship both a light and a
            dark build.
          </p>
        </div>
        <div className="flex items-center gap-1">
          {GROUPS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setGroup(item.id)}
              aria-pressed={group === item.id}
              className={cn(
                "h-7 rounded-md border px-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] transition",
                group === item.id
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => applyPreset(DEFAULT_PRESET)}
            title="Back to the built-in palette"
            aria-label="Reset to the built-in palette"
            className="grid h-7 w-7 place-items-center rounded-md border border-border/70 text-muted-foreground transition hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {presets.map((preset) => {
          const active = activeId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              aria-pressed={active}
              className={cn(
                "overflow-hidden rounded-lg border text-left transition",
                active
                  ? "border-primary/60 ring-1 ring-primary/30"
                  : "border-border/60 hover:border-primary/40"
              )}
            >
              <div className="relative h-28 w-full bg-[hsl(var(--card))]">
                <ThemeMiniPreview preset={preset} mode={group} />
              </div>
              <span className="flex items-center gap-1.5 border-t border-border/50 px-2 py-1.5">
                <span className="min-w-0 flex-1 truncate text-[11.5px] text-foreground">{preset.name}</span>
                {active ? (
                  <Check className="h-3 w-3 shrink-0 text-primary" />
                ) : (
                  <span className="shrink-0 font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground/60">
                    {preset.surface}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}