import { Section, Slider } from "@/components/ink/StudioSection";
import { cn } from "@/lib/utils";

function Toggle({ label, on, onText, offText, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg border px-2 py-1.5 text-left transition",
        on ? "border-primary/50 bg-primary/10" : "border-border/60 hover:border-border"
      )}
    >
      <span className="text-[11px] text-foreground/90">{label}</span>
      <span
        className={cn(
          "rounded px-1.5 py-0.5 font-mono text-[9px]",
          on ? "bg-primary/20 text-primary" : "bg-muted/60 text-muted-foreground"
        )}
      >
        {on ? onText : offText}
      </span>
    </button>
  );
}

/** Assist switches: shape snapping and the ruler guide. */
export default function AssistStudio({ tool, onTool }) {
  return (
    <Section label="Assists">
      <Toggle
        label="Shape recognition"
        on={tool.shapeRecognition}
        onText="snap on"
        offText="freehand"
        onClick={() => onTool({ shapeRecognition: !tool.shapeRecognition })}
      />
      <Toggle
        label="Ruler guide"
        on={tool.ruler}
        onText="locked"
        offText="off"
        onClick={() => onTool({ ruler: !tool.ruler })}
      />
      {tool.ruler ? (
        <Slider
          label="guide angle"
          value={tool.rulerAngle}
          min={0}
          max={180}
          onChange={(rulerAngle) => onTool({ rulerAngle })}
          display={`${tool.rulerAngle}°`}
        />
      ) : null}
    </Section>
  );
}