import {
  Eraser,
  Hand,
  Lasso,
  Maximize,
  PenTool,
  Pipette,
  Redo2,
  Shapes,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { BRUSHES, brushPreviewStyle } from "@/lib/ink/brushes";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "draw", label: "Draw", icon: PenTool },
  { id: "shape", label: "Shapes", icon: Shapes },
  { id: "lasso", label: "Lasso", icon: Lasso },
  { id: "erase", label: "Eraser", icon: Eraser },
  { id: "pan", label: "Pan", icon: Hand },
  { id: "eyedropper", label: "Eyedropper", icon: Pipette },
];

function IconButton({ label, active, onClick, disabled, children, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-md transition disabled:opacity-35",
        danger
          ? "text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
          : active
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export default function InkToolbar({
  tool,
  onTool,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  zoom,
  onZoom,
  onFit,
  onClear,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card/40 px-2.5 py-2">
      <div className="flex items-center gap-0.5">
        {MODES.map((item) => {
          const Icon = item.icon;
          return (
            <IconButton
              key={item.id}
              label={item.label}
              active={tool.mode === item.id}
              onClick={() => onTool({ mode: item.id })}
            >
              <Icon className="h-3.5 w-3.5" />
            </IconButton>
          );
        })}
      </div>

      <span className="h-5 w-px bg-border/70" />

      <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
        {BRUSHES.map((brush) => {
          const preview = brushPreviewStyle(brush.id, tool.color);
          const active = tool.brush === brush.id && tool.mode !== "erase";
          return (
            <button
              key={brush.id}
              type="button"
              onClick={() => onTool({ brush: brush.id, mode: "draw" })}
              title={`${brush.label} — ${brush.hint}`}
              aria-pressed={active}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] transition",
                active
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-transparent text-muted-foreground hover:border-border/70 hover:text-foreground"
              )}
            >
              <span
                className="block w-4 rounded-full"
                style={{ height: preview.height / 2 + 2, background: preview.color }}
              />
              <span className="hidden sm:inline">{brush.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      <span className="h-5 w-px bg-border/70" />

      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0.5}
          max={24}
          step={0.5}
          value={tool.width}
          onChange={(event) => onTool({ width: Number(event.target.value) })}
          aria-label="Stroke width"
          className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-border accent-primary"
        />
        <span className="w-8 font-mono text-[10px] text-muted-foreground">{tool.width}px</span>
        <span
          className="h-5 w-5 rounded-full border border-black/40"
          style={{ background: tool.color, opacity: Math.max(0.25, tool.alpha) }}
          title="Current ink colour"
        />
      </div>

      {tool.mode === "erase" && (
        <div className="flex items-center gap-1">
          {[
            { id: "stroke", label: "Stroke" },
            { id: "precision", label: "Point" },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => onTool({ eraserMode: mode.id })}
              className={cn(
                "rounded-md border px-1.5 py-1 font-mono text-[9.5px] transition",
                tool.eraserMode === mode.id
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border/70 text-muted-foreground hover:text-foreground"
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
      )}

      <div className="ml-auto flex items-center gap-0.5">
        <IconButton label="Undo" onClick={onUndo} disabled={!canUndo}>
          <Undo2 className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton label="Redo" onClick={onRedo} disabled={!canRedo}>
          <Redo2 className="h-3.5 w-3.5" />
        </IconButton>
        <span className="mx-1 h-5 w-px bg-border/70" />
        <IconButton label="Zoom out" onClick={() => onZoom(0.85)}>
          <ZoomOut className="h-3.5 w-3.5" />
        </IconButton>
        <span className="w-9 text-center font-mono text-[10px] text-muted-foreground">
          {Math.round((zoom || 1) * 100)}%
        </span>
        <IconButton label="Zoom in" onClick={() => onZoom(1.18)}>
          <ZoomIn className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton label="Fit to ink" onClick={onFit}>
          <Maximize className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton label="Clear page" onClick={onClear} danger>
          <Trash2 className="h-3.5 w-3.5" />
        </IconButton>
      </div>
    </div>
  );
}