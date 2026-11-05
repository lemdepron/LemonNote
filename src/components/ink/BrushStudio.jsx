import { Chip, Section, Slider } from "@/components/ink/StudioSection";
import { BRUSHES } from "@/lib/ink/brushes";

/** What each pen does to the stroke — the panel explains behaviour instead of repeating the toolbar's pen picker. */
const BEHAVIOUR = {
  fountain: "pressure sets the width and the line tapers as the pen lifts.",
  ballpoint: "even width at any speed — the everyday line.",
  calligraphy: "the nib angle decides how thick each direction comes out.",
  marker: "translucent ink that builds where strokes cross — good for highlighting.",
  watercolor: "three wet passes bleed past the centreline and dry with a darker edge.",
  pencil: "grain and tilt add texture; tilt the stylus to widen the mark.",
};

export default function BrushStudio({ tool, onTool }) {
  const nibDegrees = Math.round((tool.nibAngle * 180) / Math.PI);
  const pen = BRUSHES.find((brush) => brush.id === tool.brush) || BRUSHES[0];

  return (
    <div className="space-y-4">
      <Section
        label="Pen behaviour"
        hint="Fountain and calligraphy read pen pressure; pencil reads tilt. Pen, width and colour live in the toolbar."
      >
        <p className="text-[11px] leading-relaxed text-foreground/85">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-primary">{pen.label}</span>{" "}
          {BEHAVIOUR[pen.id]}
        </p>
        {tool.brush === "calligraphy" ? (
          <Slider
            label="nib angle"
            value={nibDegrees}
            min={-90}
            max={90}
            onChange={(value) => onTool({ nibAngle: (value * Math.PI) / 180 })}
            display={`${nibDegrees}°`}
          />
        ) : null}
      </Section>

      <Section label="Eraser engine" hint="Stroke removes whole lines; point cuts the exact path.">
        <div className="flex gap-1">
          <Chip active={tool.eraserMode === "stroke"} onClick={() => onTool({ eraserMode: "stroke", mode: "erase" })}>
            Stroke
          </Chip>
          <Chip active={tool.eraserMode === "precision"} onClick={() => onTool({ eraserMode: "precision", mode: "erase" })}>
            Point
          </Chip>
        </div>
        <Slider label="radius" value={tool.size} min={6} max={90} onChange={(size) => onTool({ size })} display={`${tool.size}px`} />
      </Section>
    </div>
  );
}