import { useState, useEffect, useCallback } from "react";
import {
  Brush, History, Layers, Maximize, Mic, MicOff, Palette, Pause, PenLine, Pipette, Play, Redo2,
  ScanText, Sigma, SquareDashedMousePointer, Trash2, Undo2, ZoomIn, ZoomOut, Loader2, Square, X, Check, ChevronLeft, ChevronRight,
  Droplets, BookOpen, Paperclip,
} from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import RibbonButton from "@/components/ribbon/RibbonButton";
import { MenuItem, RibbonContext, RibbonMenu, RibbonSelect } from "@/components/ribbon/RibbonKit";
import { readPref, writePref } from "@/lib/preferences";
import { toast } from "@/lib/toast";
import { Chip, Slider } from "@/components/ink/StudioSection";
import BrushStudio from "@/components/ink/BrushStudio";
import AssistStudio from "@/components/ink/AssistStudio";
import ColorStudio from "@/components/ink/ColorStudio";
import SelectionStudio from "@/components/ink/SelectionStudio";
import PaperStudio from "@/components/ink/PaperStudio";
import SmartInkStudio from "@/components/ink/SmartInkStudio";
import AudioStudio from "@/components/ink/AudioStudio";
import { BRUSHES, brushPreviewStyle } from "@/lib/ink/brushes";
import { PAPER_SIZES, PAPER_TEMPLATES, PAPER_TONES } from "@/lib/ink/paper";
import { readHistory, rememberColor } from "@/lib/ink/palette";
import { createCoordinateGraph } from "@/lib/ink/shapes";
import { relativeTime } from "@/lib/vault";
import { cn } from "@/lib/utils";
import {
  FountainPenIcon, BallpointPenIcon, CalligraphyPenIcon, HighlighterIcon,
  WatercolorBrushIcon, PencilIcon, EraserIcon, LassoIcon, HandIcon,
  EyedropperIcon, ShapesIcon, CoordinateGraphIcon, SavePenIcon, RemovePenIcon,
  InsertSpaceIcon, MousePointerIcon,
} from "@/components/ink/icons";

function getModes(tool) {
  return [
    { id: "draw", label: "Draw", icon: FountainPenIcon, hint: "Draw with the current pen" },
    { id: "shape", label: "Shapes", icon: ShapesIcon, hint: "Draw lines, boxes, circles and coordinate graphs" },
    { id: "select", label: "Select", icon: MousePointerIcon, hint: "Select, move, resize and rotate objects" },
    { id: "lasso", label: "Lasso", icon: LassoIcon, hint: "Select marks by circling them" },
    { id: "erase", label: "Eraser", icon: () => <EraserIcon mode={tool?.eraserMode || "stroke"} />, hint: "Erase marks" },
    { id: "pan", label: "Pan", icon: HandIcon, hint: "Move the page around" },
    { id: "eyedropper", label: "Pick", icon: EyedropperIcon, hint: "Pick a colour from the page" },
    { id: "insertSpace", label: "Insert space", icon: InsertSpaceIcon, hint: "Drag to insert or remove vertical space between ink marks" },
  ];
}

const QUICK_COLORS = ["#111827", "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#f9fafb"];

const dot = (color, alpha = 1) => (
  <span className="h-4 w-4 rounded-full border border-foreground/30" style={{ background: color, opacity: Math.max(0.3, alpha) }} />
);

// Favourite pens persistence
const FAV_PENS_KEY = "inkFavouritePens";
const MAX_FAV_PENS = 8;

function readFavPens() {
  try {
    const raw = readPref(FAV_PENS_KEY, "[]");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeFavPens(pens) {
  writePref(FAV_PENS_KEY, JSON.stringify(pens.slice(0, MAX_FAV_PENS)));
}

function hexIsValid(hex) {
  if (!hex) return false;
  const clean = hex.trim().replace("#", "");
  return /^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(clean);
}

function normalizeHex(hex) {
  const clean = hex.trim().replace("#", "");
  if (clean.length === 3) {
    return "#" + clean.split("").map((c) => c + c).join("").toLowerCase();
  }
  return "#" + clean.toLowerCase();
}

/* ---------------------------------- Draw ---------------------------------- */

const INSERT_SPACE_TOAST_KEY = "inkInsertSpaceToastShown";

export function InkDrawTab({ ink }) {
  const { tool, onTool, engine } = ink;
  const [favPens, setFavPens] = useState(() => readFavPens());

  useEffect(() => {
    setFavPens(readFavPens());
  }, []);

  const handleToolChange = useCallback((changes) => {
    if (changes.mode === "insertSpace") {
      const shown = readPref(INSERT_SPACE_TOAST_KEY, "false");
      if (shown !== "true") {
        writePref(INSERT_SPACE_TOAST_KEY, "true");
        toast.info("Text does not move. Ink below the line moves away from the text it was written on.", 6000);
      }
    }
    onTool(changes);
  }, [onTool]);

  const saveFavPen = useCallback(() => {
    const pen = {
      brush: tool.brush,
      color: tool.color,
      width: tool.width,
      alpha: tool.alpha,
      nibAngle: tool.nibAngle,
      eraserMode: tool.eraserMode,
      size: tool.size,
    };
    const next = [pen, ...favPens.filter((p) => p.brush !== pen.brush || p.color !== pen.color || p.width !== pen.width)].slice(0, MAX_FAV_PENS);
    setFavPens(next);
    writeFavPens(next);
  }, [tool, favPens]);

  const selectFavPen = useCallback((pen) => {
    onTool({
      brush: pen.brush,
      color: pen.color,
      width: pen.width,
      alpha: pen.alpha,
      nibAngle: pen.nibAngle,
      eraserMode: pen.eraserMode,
      size: pen.size,
      mode: "draw",
    });
  }, [onTool]);

  const removeFavPen = useCallback((index) => {
    const next = favPens.filter((_, i) => i !== index);
    setFavPens(next);
    writeFavPens(next);
  }, [favPens]);

  const insertCoordinateGraph = useCallback(() => {
    const eng = engine();
    if (!eng) return;
    const center = eng.centerWorld();
    const strokes = createCoordinateGraph(center.x, center.y, 400, 300, 50);
    eng.cb.onCommit?.(strokes);
  }, [engine]);

  return (
    <>
      <RibbonGroup label="Mode">
        {getModes(tool).map((mode) => (
          <RibbonButton
            key={mode.id}
            icon={mode.icon}
            label={mode.label}
            hint={mode.hint}
            active={tool.mode === mode.id}
            onClick={() => handleToolChange({ mode: mode.id })}
          />
        ))}
      </RibbonGroup>

      <RibbonGroup label="Pens">
        {BRUSHES.map((brush) => {
          const preview = brushPreviewStyle(brush.id, tool.color);
          const active = tool.brush === brush.id && tool.mode !== "erase";
          const Icon = {
            fountain: FountainPenIcon,
            ballpoint: BallpointPenIcon,
            calligraphy: CalligraphyPenIcon,
            marker: HighlighterIcon,
            watercolor: WatercolorBrushIcon,
            pencil: PencilIcon,
          }[brush.id] || FountainPenIcon;
          return (
            <button
              key={brush.id}
              type="button"
              onClick={() => onTool({ brush: brush.id, mode: "draw" })}
              title={`${brush.label} — ${brush.hint}`}
              aria-pressed={active}
              className={cn(
                "flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2 text-[11.5px] transition",
                active ? "border-primary/40 bg-primary/15 text-primary" : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="block w-4 rounded-full" style={{ height: preview.height / 2 + 2, background: preview.color }} />
              {brush.label.split(" ")[0]}
            </button>
          );
        })}
      </RibbonGroup>

      <RibbonGroup label="Favourite pens">
        <div className="flex flex-wrap items-center gap-1.5" style={{ minWidth: 'max-content' }}>
          {favPens.map((pen, index) => {
            const preview = brushPreviewStyle(pen.brush, pen.color);
            const active =
              tool.brush === pen.brush &&
              tool.color.toLowerCase() === pen.color.toLowerCase() &&
              tool.width === pen.width &&
              tool.mode !== "erase";
            return (
              <button
                key={index}
                type="button"
                onClick={() => selectFavPen(pen)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  removeFavPen(index);
                }}
                title={`${brushLabel(pen.brush)} — ${pen.color} — ${pen.width}px${pen.alpha < 1 ? ` — ${Math.round(pen.alpha * 100)}%` : ""} — Right-click to remove`}
                aria-pressed={active}
                className={cn(
                  "relative flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2 text-[10px] transition",
                  active ? "border-primary/50 bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <span className="block w-4 rounded-full" style={{ height: preview.height / 2 + 2, background: preview.color }} />
                {brushLabel(pen.brush).split(" ")[0]}
                <RemovePenIcon className="absolute -right-1 -top-1 h-3.5 w-3.5 text-muted-foreground/50 hover:text-destructive" />
              </button>
            );
          })}
          {favPens.length < MAX_FAV_PENS && (
            <button
              type="button"
              onClick={saveFavPen}
              title="Save current pen as favourite"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-dashed border-border text-muted-foreground transition hover:border-primary/50 hover:text-primary"
            >
              <SavePenIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {favPens.length === 0 && (
          <p className="font-mono text-[9.5px] text-muted-foreground">save your favourite pen setups here (max 8)</p>
        )}
      </RibbonGroup>

      <RibbonGroup label="Stroke">
        <Slider label="width" value={tool.width} min={0.5} max={24} step={0.5} onChange={(width) => onTool({ width })} display={`${tool.width}px`} />
        <Slider label="opacity" value={Math.round(tool.alpha * 100)} min={5} max={100} onChange={(value) => onTool({ alpha: value / 100 })} display={`${Math.round(tool.alpha * 100)}%`} />
        <RibbonMenu icon={Brush} label="Brush engine" hint="Pen behaviour, eraser engine, shape and ruler assists" width={300}>
          {() => (
            <div className="space-y-4 p-1">
              <BrushStudio tool={tool} onTool={onTool} />
              <div className="h-px bg-border/60" />
              <AssistStudio tool={tool} onTool={onTool} />
            </div>
          )}
        </RibbonMenu>
      </RibbonGroup>

      <RibbonGroup label="Eraser">
        <Chip active={tool.eraserMode === "stroke"} onClick={() => onTool({ eraserMode: "stroke", mode: "erase" })}>Stroke</Chip>
        <Chip active={tool.eraserMode === "precision"} onClick={() => onTool({ eraserMode: "precision", mode: "erase" })}>Point</Chip>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onTool({ size: 12, mode: "erase" })}
            title="Small eraser (12px)"
            className={cn(
              "rounded-md border px-2 py-1 font-mono text-[10px] transition",
              tool.size === 12 ? "border-primary/50 bg-primary/15 text-primary" : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            S
          </button>
          <button
            type="button"
            onClick={() => onTool({ size: 26, mode: "erase" })}
            title="Medium eraser (26px)"
            className={cn(
              "rounded-md border px-2 py-1 font-mono text-[10px] transition",
              tool.size === 26 ? "border-primary/50 bg-primary/15 text-primary" : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            M
          </button>
          <button
            type="button"
            onClick={() => onTool({ size: 50, mode: "erase" })}
            title="Large eraser (50px)"
            className={cn(
              "rounded-md border px-2 py-1 font-mono text-[10px] transition",
              tool.size === 50 ? "border-primary/50 bg-primary/15 text-primary" : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            L
          </button>
        </div>
        <Slider label="radius" value={tool.size} min={6} max={90} onChange={(size) => onTool({ size })} display={`${tool.size}px`} />
      </RibbonGroup>

      <RibbonGroup label="History">
        <RibbonButton icon={Undo2} label="Undo" hint="Undo the last mark" shortcut="Ctrl+Z" disabled={!ink.canUndo} onClick={ink.onUndo} />
        <RibbonButton icon={Redo2} label="Redo" hint="Redo" shortcut="Ctrl+Shift+Z" disabled={!ink.canRedo} onClick={ink.onRedo} />
      </RibbonGroup>

      <RibbonGroup label="View">
        <RibbonButton icon={ZoomOut} hint="Zoom out" onClick={() => ink.onZoom(0.85)} />
        <RibbonButton icon={ZoomIn} hint="Zoom in" onClick={() => ink.onZoom(1.18)} />
        <RibbonButton icon={Maximize} label="Fit" hint="Fit the page to the ink" onClick={ink.onFit} />
        <RibbonButton icon={Trash2} label="Clear page" hint="Remove every mark on this page" onClick={ink.onClear} />
        <span className="self-center font-mono text-[10.5px] text-muted-foreground">{Math.round((ink.zoom || 1) * 100)}%</span>
      </RibbonGroup>

      <RibbonGroup label="Shapes">
        <RibbonMenu icon={CoordinateGraphIcon} label="Coordinate graph" hint="Insert a coordinate graph with axes, grid and tick marks" width={220}>
          {() => (
            <div className="p-2 space-y-2">
              <p className="font-mono text-[10px] text-muted-foreground">Inserts a graph centered on the view</p>
              <button
                type="button"
                onClick={insertCoordinateGraph}
                className="w-full rounded-md border border-border/70 px-2 py-1.5 font-mono text-[11px] text-foreground hover:bg-accent transition"
              >
                Add coordinate graph
              </button>
            </div>
          )}
        </RibbonMenu>
      </RibbonGroup>
    </>
  );
}

function brushLabel(id) {
  return BRUSHES.find((brush) => brush.id === id)?.label || "Ballpoint";
}

/* ---------------------------------- Color ---------------------------------- */

export function InkColorTab({ ink }) {
  const { tool, onTool } = ink;
  const recent = readHistory().slice(0, 12);
  const [hexInput, setHexInput] = useState(tool.color);
  const [hexValid, setHexValid] = useState(true);

  // Sync hex input with tool color when it changes externally
  useEffect(() => {
    setHexInput(tool.color);
    setHexValid(true);
  }, [tool.color]);

  const handleHexChange = useCallback((value) => {
    setHexInput(value);
    const valid = hexIsValid(value);
    setHexValid(valid);
    if (valid) {
      const normalized = normalizeHex(value);
      onTool({ color: normalized });
      rememberColor(normalized);
    }
  }, [onTool]);

  const handleHexBlur = useCallback(() => {
    if (!hexValid) {
      setHexInput(tool.color);
      setHexValid(true);
    }
  }, [hexValid, tool.color]);

  const handleHexKeyDown = useCallback((e) => {
    if (e.key === "Enter" && hexValid) {
      const normalized = normalizeHex(hexInput);
      onTool({ color: normalized });
      rememberColor(normalized);
    } else if (e.key === "Escape") {
      setHexInput(tool.color);
      setHexValid(true);
    }
  }, [hexInput, hexValid, onTool]);

  return (
    <>
      <RibbonGroup label="Current">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            onBlur={handleHexBlur}
            onKeyDown={handleHexKeyDown}
            placeholder="#RRGGBB"
            aria-label="Hex colour"
            spellCheck={false}
            className={cn(
              "h-8 w-20 shrink-0 rounded-lg border px-2 font-mono text-[11px] uppercase outline-none transition",
              hexValid
                ? "border-border/70 bg-card/60 text-foreground focus:border-primary/40"
                : "border-destructive/50 bg-destructive/10 text-destructive"
            )}
          />
          <div
            className="h-5 w-5 shrink-0 rounded-full border transition"
            style={{
              background: hexValid ? hexInput : tool.color,
              borderColor: hexValid ? "transparent" : "hsl(var(--destructive))",
              opacity: hexValid ? 1 : 0.5,
            }}
            title={hexValid ? hexInput : "Invalid hex"}
          />
          <RibbonButton icon={Pipette} label="Pick" hint="Pick a colour from the page" active={tool.mode === "eyedropper"} onClick={() => onTool({ mode: tool.mode === "eyedropper" ? "draw" : "eyedropper" })} />
        </div>
        <p className="font-mono text-[9px] text-muted-foreground/70">
          {hexValid ? "3 or 6 digit hex, with or without #" : "Invalid hex — press Escape to revert"}
        </p>
      </RibbonGroup>

      <RibbonGroup label="Quick inks">
        <div className="flex flex-wrap items-center gap-1.5" style={{ minWidth: 'max-content' }}>
          {QUICK_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              title={color}
              aria-label={`Use ${color}`}
              onClick={() => {
                onTool({ color });
                rememberColor(color);
              }}
              className={cn("h-5 w-5 rounded-full border transition hover:scale-110", tool.color === color ? "border-foreground ring-1 ring-foreground/40" : "border-foreground/30")}
              style={{ background: color }}
            />
          ))}
        </div>
      </RibbonGroup>

      <RibbonGroup label="Recent">
        <div className="flex flex-wrap items-center gap-1.5" style={{ minWidth: 'max-content' }}>
          {recent.length === 0 && <span className="font-mono text-[10px] text-muted-foreground">colours you use appear here</span>}
          {recent.map((color) => (
            <button key={color} type="button" title={color} aria-label={`Use ${color}`} onClick={() => { onTool({ color }); rememberColor(color); }} className="h-5 w-5 rounded-full border border-foreground/30 transition hover:scale-110" style={{ background: color }} />
          ))}
        </div>
      </RibbonGroup>

      <RibbonGroup label="Studio">
        <RibbonMenu icon={Palette} label="Colour studio" hint="Mixer, palettes, opacity and custom colours" width={300}>
          {() => (
            <ColorStudio
              color={tool.color}
              alpha={tool.alpha}
              eyedropper={tool.mode === "eyedropper"}
              onEyedropper={() => onTool({ mode: tool.mode === "eyedropper" ? "draw" : "eyedropper" })}
              onChange={({ color, alpha }) => onTool({ color, alpha })}
            />
          )}
        </RibbonMenu>
        <Slider label="opacity" value={Math.round(tool.alpha * 100)} min={5} max={100} onChange={(value) => onTool({ alpha: value / 100 })} display={`${Math.round(tool.alpha * 100)}%`} />
      </RibbonGroup>
    </>
  );
}

/* --------------------------------- Select ---------------------------------- */

export function InkSelectTab({ ink }) {
  const { tool, selection, engine, objectSelection, selectedObjectId, objects, deleteObject, bringToFront, sendToBack } = ink;
  const strokeCount = selection.ids.length;
  const obj = selectedObjectId ? objects.find((o) => o.id === selectedObjectId) : null;
  const objNone = { disabled: !obj, disabledReason: "Select an object with the Select tool first" };
  const strokeNone = { disabled: strokeCount === 0, disabledReason: "Select marks with the lasso first" };
  return (
    <>
      <RibbonGroup label="Select">
        <RibbonButton icon={MousePointerIcon} label="Select" hint="Select, move, resize and rotate objects" active={tool.mode === "select"} onClick={() => ink.onTool({ mode: "select" })} />
        <RibbonButton icon={LassoIcon} label="Lasso" hint="Select marks by circling them" active={tool.mode === "lasso"} onClick={() => ink.onTool({ mode: "lasso" })} />
        <span className="self-center font-mono text-[10.5px] text-muted-foreground min-w-[5rem] text-center">
          {obj ? `Object: ${obj.type}` : strokeCount ? `${strokeCount} strokes` : "nothing selected"}
        </span>
      </RibbonGroup>

      {obj && (
        <RibbonGroup label="Object">
          <RibbonButton icon={Trash2} label="Delete" hint="Delete the selected object" shortcut="Del" {...objNone} onClick={() => deleteObject(obj.id)} />
          <RibbonButton icon={Layers} label="Front" hint="Bring to front" {...objNone} onClick={() => bringToFront(obj.id)} />
          <RibbonButton icon={Layers} label="Back" hint="Send to back" {...objNone} onClick={() => sendToBack(obj.id)} />
        </RibbonGroup>
      )}

      {strokeCount > 0 && (
        <RibbonGroup label="Strokes">
          <RibbonButton icon={Check} label="Apply" hint="Commit the move, scale or rotation" {...strokeNone} onClick={() => engine()?.commitSelection()} />
          <RibbonButton icon={Droplets} label="Recolor" hint="Paint the selection with the current ink" {...strokeNone} onClick={() => engine()?.recolorSelection(tool.color, tool.alpha)} />
          <RibbonButton icon={Trash2} label="Delete" hint="Delete the selected marks" shortcut="Del" {...strokeNone} onClick={() => engine()?.deleteSelection()} />
          <RibbonButton icon={X} label="Deselect" hint="Clear the selection" {...strokeNone} onClick={() => engine()?.setSelection([])} />
        </RibbonGroup>
      )}

      {strokeCount > 0 && (
        <RibbonGroup label="Transform">
          <RibbonMenu icon={SquareDashedMousePointer} label="Selection studio" hint="Move, scale and rotate the selection precisely" width={300} disabled={strokeCount === 0} disabledReason="Select marks with the lasso first">
            {() => (
              <SelectionStudio
                selection={selection}
                color={tool.color}
                alpha={tool.alpha}
                onTransform={(transform) => engine()?.setSelectionTransform(transform)}
                onCommit={() => engine()?.commitSelection()}
                onRecolor={() => engine()?.recolorSelection(tool.color, tool.alpha)}
                onDelete={() => engine()?.deleteSelection()}
                onClear={() => engine()?.setSelection([])}
              />
            )}
          </RibbonMenu>
        </RibbonGroup>
      )}
    </>
  );
}

/* ---------------------------------- Paper ---------------------------------- */

export function InkPaperTab({ ink }) {
  const { page, pageIndex } = ink;
  const paper = page.paper || {};
  return (
    <>
      <RibbonGroup label="Template">
        <RibbonSelect title="Paper template" value={paper.template || "grid"} onChange={(template) => ink.onPaper({ template })} options={PAPER_TEMPLATES.map((item) => ({ value: item.id, label: item.label }))} />
        <RibbonSelect title="Paper tone" value={paper.tone || "dark"} onChange={(tone) => ink.onPaper({ tone })} options={PAPER_TONES.map((item) => ({ value: item.id, label: item.label }))} />
      </RibbonGroup>

      <RibbonGroup label="Page size">
        <RibbonSelect title="Page size" value={paper.size || "a4"} onChange={(size) => ink.onPaper({ size })} options={PAPER_SIZES.map((item) => ({ value: item.id, label: item.label }))} />
      </RibbonGroup>

      <RibbonGroup label="Pages">
        <RibbonButton icon={ChevronLeft} hint="Previous page" disabled={pageIndex <= 0} onClick={() => ink.onPage(-1)} />
        <RibbonButton icon={ChevronRight} hint="Next page" onClick={() => ink.onPage(1)} />
        <span className="self-center font-mono text-[10.5px] text-muted-foreground">page {pageIndex + 1}</span>
      </RibbonGroup>

      <RibbonGroup label="Studio">
        <RibbonMenu icon={Layers} label="Paper studio" hint="All paper options in one place" width={300}>
          {() => <PaperStudio paper={paper} onPaper={ink.onPaper} pageIndex={pageIndex} onPage={ink.onPage} onClear={ink.onClear} />}
        </RibbonMenu>
        <RibbonButton icon={Trash2} label="Clear page" hint="Remove every mark on this page" onClick={ink.onClear} />
      </RibbonGroup>
    </>
  );
}

/* -------------------------------- Smart ink -------------------------------- */

export function InkSmartTab({ ink }) {
  const { recognition } = ink;
  const busy = Boolean(recognition.busy);
  return (
    <>
      <RibbonGroup label="Recognise">
        <RibbonButton icon={recognition.busy === "text" ? Loader2 : ScanText} spinning={recognition.busy === "text"} label="Handwriting" hint="Turn the lasso selection, or the page in view, into text" disabled={busy} onClick={() => ink.onRecognize("text")} />
        <RibbonButton icon={recognition.busy === "math" ? Loader2 : Sigma} spinning={recognition.busy === "math"} label="Equation" hint="Turn handwritten maths into LaTeX" disabled={busy} onClick={() => ink.onRecognize("math")} />
      </RibbonGroup>

      <RibbonGroup label="Results and search">
        <RibbonMenu icon={BookOpen} label="Results & search" hint="Recognised text, insert it on the page, search all handwriting" width={300}>
          {() => (
            <SmartInkStudio
              recognition={recognition}
              onRecognize={ink.onRecognize}
              onInsert={ink.onInsertText}
              search={ink.handwriting.query}
              onSearch={ink.onSearch}
              matches={ink.handwriting.matches}
              searching={ink.handwriting.searching}
              onOpenPage={(pageId) => ink.onOpenPage?.(pageId)}
            />
          )}
        </RibbonMenu>
        {recognition.error && <span className="self-center truncate max-w-[16rem] font-mono text-[10px] text-destructive" title={recognition.error}>{recognition.error}</span>}
      </RibbonGroup>
    </>
  );
}

/* ---------------------------------- Audio ---------------------------------- */

const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export function InkAudioTab({ ink }) {
  const { page, recording, replay } = ink;
  const audio = page.audio;
  return (
    <>
      <RibbonGroup label="Record">
        <RibbonButton icon={recording ? Square : Mic} label={recording ? "Stop" : "Record"} hint="Record audio while you write; every stroke is time-stamped" active={recording} onClick={recording ? ink.onStop : ink.onRecord} />
        {recording && <span className="self-center font-mono text-[10.5px] text-destructive">recording…</span>}
      </RibbonGroup>

      <RibbonGroup label="Playback">
        <RibbonButton icon={replay.syncing ? Loader2 : replay.playing ? Pause : Play} spinning={replay.syncing} label={replay.playing ? "Pause" : "Play"} hint="Play the recording and redraw the page as it was written" disabled={!audio?.file_uri} disabledReason="Record some audio first" onClick={ink.onPlay} />
        <RibbonButton icon={History} label="Replay ink" hint="Replay the strokes without sound" onClick={ink.onReplayInk} />
        <span className="self-center font-mono text-[10.5px] text-muted-foreground">{audio ? `${clock(replay.time || 0)} / ${clock(audio.duration || 0)}` : "no recording"}</span>
      </RibbonGroup>

      <RibbonGroup label="Manage">
        <RibbonMenu icon={Mic} label="Audio studio" hint="Scrub through the recording" width={300}>
          {() => (
            <AudioStudio
              recording={recording}
              audio={audio}
              playing={replay.playing}
              time={replay.time}
              syncing={replay.syncing}
              onRecord={ink.onRecord}
              onStop={ink.onStop}
              onPlay={ink.onPlay}
              onReplayInk={ink.onReplayInk}
              onScrub={ink.onScrub}
              onClear={ink.onClearAudio}
            />
          )}
        </RibbonMenu>
        <RibbonButton icon={MicOff} label="Remove audio" hint="Delete the recording from this page" disabled={!audio} disabledReason="This page has no recording" onClick={ink.onClearAudio} />
      </RibbonGroup>
    </>
  );
}

/* ------------------- Ink tab inside the NOTE ribbon (pages) ---------------- */

/** Lets a note jump to ink: create a page, reopen a recent one, or browse them all. */
/* ----------------------------- The Ink tab itself ----------------------------- */

const SUBTABS = [
  ["draw", "Draw", InkDrawTab],
  ["color", "Color", InkColorTab],
  ["select", "Select", InkSelectTab],
  ["paper", "Paper", InkPaperTab],
  ["smart", "Smart ink", InkSmartTab],
  ["audio", "Audio", InkAudioTab],
];

// Ink controls never depend on a markdown editor, so the shared kit sees an always-enabled context.
const INK_CONTEXT = { markdown: true, offReason: "", selection: { value: "", start: 0, end: 0 }, run() {}, typography: {}, setTypography() {} };

/**
 * The Ink tab of the note ribbon. `noteInk` is the note's own handwriting page
 * (see useInkPage in NotePage): until it exists the tab offers to start one.
 */
export function InkTab({ noteInk }) {
  const [sub, setSub] = useState(() => {
    const saved = readPref("inkRibbonTab", "draw");
    return SUBTABS.some(([id]) => id === saved) ? saved : "draw";
  });
  const [legacy, setLegacy] = useState([]);
  const choose = (id) => {
    setSub(id);
    writePref("inkRibbonTab", id);
  };
  const loadLegacy = () =>
    noteInk
      .listAttachable()
      .then(setLegacy)
      .catch(() => setLegacy([]));
  const Section = SUBTABS.find(([id]) => id === sub)?.[2] || InkDrawTab;

  const attach = (
    <RibbonMenu icon={Paperclip} label="Attach old page" hint="Bring in a handwriting page from before Ink moved inside notes" width={300} disabled={false} onOpenChange={loadLegacy}>
      {(close) =>
        legacy.length === 0 ? (
          <p className="px-2 py-3 font-mono text-[11px] text-muted-foreground">No unattached ink pages.</p>
        ) : (
          legacy.map((page) => (
            <MenuItem
              key={page.id}
              onClick={() => {
                noteInk.onAttach(page.id);
                close();
              }}
            >
              <span className="truncate">{page.name || "Untitled page"}</span>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{relativeTime(page.updated_date)}</span>
            </MenuItem>
          ))
        )
      }
    </RibbonMenu>
  );

  return (
    <RibbonContext.Provider value={INK_CONTEXT}>
      {!noteInk.hasPage ? (
        <>
          <RibbonGroup label="Handwriting">
            <RibbonButton
              icon={noteInk.starting ? Loader2 : PenLine}
              spinning={noteInk.starting}
              label="Start inking"
              hint="Add a handwriting page to this note"
              onClick={noteInk.onStart}
              keepFocus={false}
            />
            {attach}
          </RibbonGroup>
          <RibbonGroup label="About">
            <p className="max-w-[24rem] self-center font-mono text-[10.5px] leading-snug text-muted-foreground">
              Every note can carry its own handwriting page. Pens, colours, selection, paper, smart ink and audio appear here once you start.
            </p>
          </RibbonGroup>
        </>
      ) : (
        <>
          <RibbonGroup label="Ink">
            <div className="grid grid-cols-3 gap-1" style={{ minWidth: 'max-content' }}>
              {SUBTABS.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(id)}
                  aria-pressed={sub === id}
                  className={cn(
                    "h-7 rounded-md border px-2 font-mono text-[10px] uppercase tracking-[0.08em] transition",
                    sub === id ? "border-primary/50 bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </RibbonGroup>
          {noteInk.overlayMode !== undefined && (
            <RibbonGroup label="Overlay">
              <button
                type="button"
                onClick={noteInk.onToggleOverlayMode}
                className={cn(
                  "h-7 rounded-md border px-2 font-mono text-[10px] uppercase tracking-[0.08em] transition",
                  noteInk.overlayMode
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                title={noteInk.overlayMode ? "Switch to full-page ink surface" : "Show ink over note text in Read view"}
              >
                {noteInk.overlayMode ? "Full page" : "Ink over text"}
              </button>
            </RibbonGroup>
          )}
          {noteInk.ink && <Section ink={noteInk.ink} />}
          <RibbonGroup label="Handwriting page">
            <div className="flex flex-col justify-center px-1 font-mono text-[10px] leading-snug text-muted-foreground" style={{ minWidth: 'max-content' }}>
              <span>{noteInk.markCount} marks</span>
              <span>{noteInk.status === "saving" ? "saving…" : noteInk.status === "saved" ? "saved" : "autosave on"}</span>
            </div>
            {attach}
            <RibbonButton icon={Trash2} label="Remove ink" hint="Delete all handwriting in this note" onClick={noteInk.onRemove} keepFocus={false} />
          </RibbonGroup>
        </>
      )}
    </RibbonContext.Provider>
  );
}