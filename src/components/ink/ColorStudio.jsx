import { useEffect, useState } from "react";
import { Pipette, Plus } from "lucide-react";
import { Chip, Section, Slider, Swatch } from "@/components/ink/StudioSection";
import { PRESET_PALETTES, hslToRgb, parseColor, rgbToHex, rgbToHsl, shade } from "@/lib/ink/color";
import { readCustomPalette, readHistory, rememberColor, writeCustomPalette } from "@/lib/ink/palette";
import { cn } from "@/lib/utils";

const PALETTES = [
  ...PRESET_PALETTES.map((palette) => ({ id: palette.id, name: palette.name, colors: palette.colors })),
  { id: "custom", name: "Mine", colors: [] },
];

const RAMP = [0.8, 0.6, 0.4, 0.2, 0, -0.2, -0.4, -0.6, -0.8];
const HUE_STEPS = 24;

export default function ColorStudio({ color, alpha, onChange, eyedropper, onEyedropper }) {
  const [tab, setTab] = useState("rgb");
  const [draft, setDraft] = useState(color);
  const [history, setHistory] = useState(() => readHistory());
  const [custom, setCustom] = useState(() => readCustomPalette());
  const [paletteId, setPaletteId] = useState("inkwell");

  useEffect(() => {
    setDraft(color);
  }, [color]);

  const rgb = parseColor(color);
  const hsl = rgbToHsl(rgb);
  const palette = paletteId === "custom" ? custom : PALETTES.find((entry) => entry.id === paletteId)?.colors || [];

  const apply = (next) => {
    onChange({ color: next, alpha });
    setHistory(rememberColor(next));
  };

  const setChannel = (patch) => apply(rgbToHex({ ...rgb, ...patch }));
  const setHslChannel = (patch) => apply(rgbToHex(hslToRgb({ ...hsl, ...patch })));

  const commitHex = (value) => {
    setDraft(value);
    const clean = value.trim().replace("#", "");
    if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(clean)) {
      const full = clean.length === 3 ? clean.split("").map((char) => char + char).join("") : clean;
      apply(`#${full.toLowerCase()}`);
    }
  };

  const addToPalette = () => {
    const next = writeCustomPalette([color, ...custom]);
    setCustom(next);
    setPaletteId("custom");
  };

  const removeFromPalette = (hex) => {
    setCustom(writeCustomPalette(custom.filter((entry) => entry !== hex)));
  };

  return (
    <div className="space-y-4">
      <Section label="Ink colour">
        <div className="flex items-center gap-1.5">
          <input
            value={draft}
            onChange={(event) => commitHex(event.target.value)}
            aria-label="Hex colour"
            spellCheck={false}
            className="h-9 min-w-0 flex-1 rounded-lg border border-border/70 bg-card/60 px-2 font-mono text-[12px] uppercase text-foreground outline-none transition focus:border-primary/40"
          />
          <button
            type="button"
            onClick={onEyedropper}
            title="Eyedropper — sample any pixel on the canvas"
            aria-pressed={eyedropper}
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition",
              eyedropper
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border/70 text-muted-foreground hover:text-foreground"
            )}
          >
            <Pipette className="h-4 w-4" />
          </button>
        </div>
        <p className="font-mono text-[9px] text-muted-foreground/70">
          {eyedropper ? "eyedropper armed — click the canvas to sample" : "hex, rgb or hsl input · alpha lives below"}
        </p>
      </Section>

      <Section label={`Opacity ${Math.round(alpha * 100)}%`}>
        <div
          className="h-2 rounded-full border border-border/60"
          style={{
            backgroundImage: `linear-gradient(90deg, transparent, ${color}), repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--card)) 0% 50%)`,
            backgroundSize: "100% 100%, 8px 8px",
          }}
        />
        <Slider
          label="alpha"
          value={Math.round(alpha * 100)}
          min={0}
          max={100}
          onChange={(value) => onChange({ color, alpha: value / 100 })}
          display={`${Math.round(alpha * 100)}%`}
        />
      </Section>

      <Section label="Channels">
        <div className="flex gap-1">
          <Chip active={tab === "rgb"} onClick={() => setTab("rgb")}>
            RGB
          </Chip>
          <Chip active={tab === "hsl"} onClick={() => setTab("hsl")}>
            HSL
          </Chip>
        </div>
        {tab === "rgb" ? (
          <div className="space-y-1.5">
            <Slider label="R" value={rgb.r} min={0} max={255} onChange={(value) => setChannel({ r: value })} />
            <Slider label="G" value={rgb.g} min={0} max={255} onChange={(value) => setChannel({ g: value })} />
            <Slider label="B" value={rgb.b} min={0} max={255} onChange={(value) => setChannel({ b: value })} />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Slider label="H" value={hsl.h} min={0} max={360} onChange={(value) => setHslChannel({ h: value })} display={`${hsl.h}°`} />
            <Slider label="S" value={hsl.s} min={0} max={100} onChange={(value) => setHslChannel({ s: value })} display={`${hsl.s}%`} />
            <Slider label="L" value={hsl.l} min={0} max={100} onChange={(value) => setHslChannel({ l: value })} display={`${hsl.l}%`} />
          </div>
        )}
      </Section>

      <Section label="Ramp">
        <div className="flex overflow-hidden rounded-md border border-border/60">
          {RAMP.map((amount) => {
            const hex = shade(color, amount);
            return (
              <button
                key={amount}
                type="button"
                onClick={() => apply(hex)}
                aria-label={`Tint ${hex}`}
                className="h-5 flex-1 transition hover:opacity-80"
                style={{ background: hex }}
              />
            );
          })}
        </div>
        <div className="flex overflow-hidden rounded-md border border-border/60">
          {Array.from({ length: HUE_STEPS }, (_, index) => {
            const hex = rgbToHex(hslToRgb({ h: (index / HUE_STEPS) * 360, s: 72, l: 58 }));
            return (
              <button
                key={hex}
                type="button"
                onClick={() => apply(hex)}
                aria-label={`Hue ${hex}`}
                className="h-4 flex-1 transition hover:opacity-80"
                style={{ background: hex }}
              />
            );
          })}
        </div>
      </Section>

      <Section label="Palettes">
        <div className="flex flex-wrap gap-1">
          {PALETTES.map((entry) => (
            <Chip key={entry.id} active={paletteId === entry.id} onClick={() => setPaletteId(entry.id)}>
              {entry.name}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {palette.map((hex) => (
            <Swatch
              key={hex}
              color={hex}
              active={hex.toLowerCase() === color.toLowerCase()}
              onClick={() => apply(hex)}
              onRemove={paletteId === "custom" ? () => removeFromPalette(hex) : undefined}
            />
          ))}
          {paletteId === "custom" && !palette.length ? (
            <span className="font-mono text-[9.5px] text-muted-foreground">empty — add the current colour</span>
          ) : null}
          <button
            type="button"
            onClick={addToPalette}
            title="Add current colour to my palette"
            className="grid h-5 w-5 place-items-center rounded-full border border-dashed border-border text-muted-foreground transition hover:border-primary/50 hover:text-primary"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </Section>

      <Section label="Recently used">
        {history.length ? (
          <div className="flex flex-wrap gap-1.5">
            {history.map((hex) => (
              <Swatch key={hex} color={hex} active={hex === color} onClick={() => apply(hex)} />
            ))}
          </div>
        ) : (
          <p className="font-mono text-[9.5px] text-muted-foreground">colours you ink with land here</p>
        )}
      </Section>
    </div>
  );
}