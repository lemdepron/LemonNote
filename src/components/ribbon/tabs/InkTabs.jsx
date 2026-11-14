import { useState, useEffect, useCallback } from "react";
import {
  Brush, History, Layers, Maximize, Mic, MicOff, Palette, Pause, PenLine, Play, Redo2,
  ScanText, Sigma, SquareDashedMousePointer, Trash2, Undo2, ZoomIn, ZoomOut, Loader2, Square, X, Check, ChevronLeft, ChevronRight,
  Droplets, BookOpen, Paperclip, MoreHorizontal, Eraser, MousePointer2, Minus, Plus,
} from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import RibbonButton from "@/components/ribbon/RibbonButton";
import { MenuItem, RibbonMenu, RibbonSelect } from "@/components/ribbon/RibbonKit";
import { readPref, writePref } from "@/lib/preferences";
import { toast } from "@/lib/toast";
import { Slider } from "@/components/ink/StudioSection";
import BrushStudio from "@/components/ink/BrushStudio";
import AssistStudio from "@/components/ink/AssistStudio";
import ColorStudio from "@/components/ink/ColorStudio";
import SelectionStudio from "@/components/ink/SelectionStudio";
import PaperStudio from "@/components/ink/PaperStudio";
import SmartInkStudio from "@/components/ink/SmartInkStudio";
import AudioStudio from "@/components/ink/AudioStudio";
import { BRUSHES, brushPreviewStyle } from "@/lib/ink/brushes";
import { PAPER_SIZES, PAPER_TEMPLATES, PAPER_TONES } from "@/lib/ink/paper";
import { createCoordinateGraph } from "@/lib/ink/shapes";
import { relativeTime } from "@/lib/vault";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import {
  FountainPenIcon, BallpointPenIcon, CalligraphyPenIcon, HighlighterIcon,
  WatercolorBrushIcon, PencilIcon, EraserIcon, LassoIcon, HandIcon,
  EyedropperIcon, ShapesIcon, CoordinateGraphIcon, SavePenIcon, RemovePenIcon,
  InsertSpaceIcon, MousePointerIcon,
} from "@/components/ink/icons";
import { Popover, PopoverTrigger, PopoverContent, CompactPopoverIconButton, CompactPopoverGrid } from "@/components/ui/compact-popover";

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

function brushLabel(id) {
  return BRUSHES.find((brush) => brush.id === id)?.label || "Ballpoint";
}

/* ---------------------------------- Draw ---------------------------------- */

const INSERT_SPACE_TOAST_KEY = "inkInsertSpaceToastShown";

/** Pen picker popover content */
function PenPickerPopover({ tool, onTool, onClose }) {
  return (
    <div className="p-1">
      <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
        Pen
      </div>
      <CompactPopoverGrid columns={3}>
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
            <CompactPopoverIconButton
              key={brush.id}
              icon={Icon}
              label={`${brush.label} — ${brush.hint}`}
              active={active}
              onClick={() => {
                onTool({ brush: brush.id, mode: "draw" });
                onClose();
              }}
            >
              <div className="absolute bottom-1 right-1 h-1.5 w-4 rounded-full" style={{ background: preview.color, opacity: 0.8 }} />
            </CompactPopoverIconButton>
          );
        })}
      </CompactPopoverGrid>
    </div>
  );
}

/** Eraser settings popover */
function EraserPopover({ tool, onTool, onClose }) {
  return (
    <div className="p-1 space-y-3">
      <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
        Eraser
      </div>
      <div className="flex gap-1 px-0.5">
        <CompactPopoverIconButton
          icon={() => <EraserIcon mode="stroke" />}
          label="Stroke eraser — removes whole marks"
          active={tool.eraserMode === "stroke"}
          onClick={() => { onTool({ eraserMode: "stroke", mode: "erase" }); onClose(); }}
        />
        <CompactPopoverIconButton
          icon={() => <EraserIcon mode="precision" />}
          label="Point eraser — cuts the exact path"
          active={tool.eraserMode === "precision"}
          onClick={() => { onTool({ eraserMode: "precision", mode: "erase" }); onClose(); }}
        />
      </div>
      <div className="px-0.5">
        <Slider
          label="radius"
          value={tool.size}
          min={6}
          max={90}
          onChange={(size) => onTool({ size })}
          display={`${tool.size}px`}
        />
      </div>
      <div className="flex gap-1 px-0.5">
        <CompactPopoverIconButton
          icon={Minus}
          label="Small (12px)"
          active={tool.size === 12}
          onClick={() => { onTool({ size: 12, mode: "erase" }); onClose(); }}
        />
        <CompactPopoverIconButton
          icon={Eraser}
          label="Medium (26px)"
          active={tool.size === 26}
          onClick={() => { onTool({ size: 26, mode: "erase" }); onClose(); }}
        />
        <CompactPopoverIconButton
          icon={Plus}
          label="Large (50px)"
          active={tool.size === 50}
          onClick={() => { onTool({ size: 50, mode: "erase" }); onClose(); }}
        />
      </div>
    </div>
  );
}

/** More tools popover - contains rarely used tools */
function MoreToolsPopover({ ink, onClose }) {
  const { t } = useI18n();
  const { tool, onTool, engine, selection, objectSelection, selectedObjectId, objects, deleteObject, bringToFront, sendToBack, page, pageIndex, recognition, recording, replay } = ink;

  const strokeCount = selection.ids.length;
  const obj = selectedObjectId ? objects.find((o) => o.id === selectedObjectId) : null;
  const objNone = { disabled: !obj, disabledReason: "Select an object with the Select tool first" };
  const strokeNone = { disabled: strokeCount === 0, disabledReason: "Select marks with the lasso first" };
  const busy = Boolean(recognition.busy);

  const insertCoordinateGraph = useCallback(() => {
    const eng = engine();
    if (!eng) return;
    const center = eng.centerWorld();
    const strokes = createCoordinateGraph(center.x, center.y, 400, 300, 50);
    eng.cb.onCommit?.(strokes);
  }, [engine]);

  return (
    <div className="p-1 space-y-3 max-h-[70vh] overflow-y-auto">
      {/* Mode tools */}
      <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
        {t("ink.more.modes")}
      </div>
      <CompactPopoverGrid columns={4}>
        <CompactPopoverIconButton
          icon={MousePointer2}
          label={t("ink.mode.select")}
          active={tool.mode === "select"}
          onClick={() => { onTool({ mode: "select" }); onClose(); }}
        />
        <CompactPopoverIconButton
          icon={ShapesIcon}
          label={t("ink.mode.shape")}
          active={tool.mode === "shape"}
          onClick={() => { onTool({ mode: "shape" }); onClose(); }}
        />
        <CompactPopoverIconButton
          icon={HandIcon}
          label={t("ink.mode.pan")}
          active={tool.mode === "pan"}
          onClick={() => { onTool({ mode: "pan" }); onClose(); }}
        />
        <CompactPopoverIconButton
          icon={EyedropperIcon}
          label={t("ink.mode.pick")}
          active={tool.mode === "eyedropper"}
          onClick={() => { onTool({ mode: "eyedropper" }); onClose(); }}
        />
        <CompactPopoverIconButton
          icon={InsertSpaceIcon}
          label={t("ink.mode.insertSpace")}
          active={tool.mode === "insertSpace"}
          onClick={() => {
            const shown = readPref(INSERT_SPACE_TOAST_KEY, "false");
            if (shown !== "true") {
              writePref(INSERT_SPACE_TOAST_KEY, "true");
              toast.info("Text does not move. Ink below the line moves away from the text it was written on.", 6000);
            }
            onTool({ mode: "insertSpace" });
            onClose();
          }}
        />
      </CompactPopoverGrid>

      {/* Eraser settings */}
      <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
        {t("ink.more.eraser")}
      </div>
      <EraserPopover tool={tool} onTool={onTool} onClose={onClose} />

      {/* Brush engine */}
      <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
        {t("ink.more.brushEngine")}
      </div>
      <CompactPopoverIconButton
        icon={Brush}
        label={t("ink.more.brushEngineHint")}
        onClick={() => onClose()}
      >
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="w-full" onClick={() => {}} />
          </PopoverTrigger>
          <PopoverContent align="start" style={{ width: 300 }} className="max-h-[70vh] overflow-y-auto p-1">
            <BrushStudio tool={tool} onTool={onTool} />
            <div className="h-px bg-border/60" />
            <AssistStudio tool={tool} onTool={onTool} />
          </PopoverContent>
        </Popover>
      </CompactPopoverIconButton>

      {/* Coordinate graph */}
      <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
        {t("ink.more.shapes")}
      </div>
      <CompactPopoverIconButton
        icon={CoordinateGraphIcon}
        label={t("ink.more.coordinateGraph")}
        onClick={() => { insertCoordinateGraph(); onClose(); }}
      />

      {/* Paper settings */}
      <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
        {t("ink.more.paper")}
      </div>
      <CompactPopoverIconButton
        icon={Layers}
        label={t("ink.more.paperStudio")}
        onClick={() => onClose()}
      >
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="w-full" onClick={() => {}} />
          </PopoverTrigger>
          <PopoverContent align="start" style={{ width: 300 }} className="max-h-[70vh] overflow-y-auto p-1">
            <PaperStudio paper={page.paper || {}} onPaper={ink.onPaper} pageIndex={pageIndex} onPage={ink.onPage} onClear={ink.onClear} />
          </PopoverContent>
        </Popover>
      </CompactPopoverIconButton>

      {/* Smart ink */}
      <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
        {t("ink.more.smartInk")}
      </div>
      <CompactPopoverGrid columns={2}>
        <CompactPopoverIconButton
          icon={recognition.busy === "text" ? Loader2 : ScanText}
          spinning={recognition.busy === "text"}
          label={t("ink.more.handwriting")}
          disabled={busy}
          onClick={() => { ink.onRecognize("text"); onClose(); }}
        />
        <CompactPopoverIconButton
          icon={recognition.busy === "math" ? Loader2 : Sigma}
          spinning={recognition.busy === "math"}
          label={t("ink.more.equation")}
          disabled={busy}
          onClick={() => { ink.onRecognize("math"); onClose(); }}
        />
      </CompactPopoverGrid>
      <CompactPopoverIconButton
        icon={BookOpen}
        label={t("ink.more.resultsSearch")}
        onClick={() => onClose()}
      >
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="w-full" onClick={() => {}} />
          </PopoverTrigger>
          <PopoverContent align="start" style={{ width: 300 }} className="max-h-[70vh] overflow-y-auto p-1">
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
          </PopoverContent>
        </Popover>
      </CompactPopoverIconButton>

      {/* Audio */}
      <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
        {t("ink.more.audio")}
      </div>
      <CompactPopoverGrid columns={2}>
        <CompactPopoverIconButton
          icon={recording ? Square : Mic}
          label={recording ? t("ink.audio.stop") : t("ink.audio.record")}
          active={recording}
          onClick={() => { recording ? ink.onStop() : ink.onRecord(); onClose(); }}
        />
        <CompactPopoverIconButton
          icon={replay.syncing ? Loader2 : replay.playing ? Pause : Play}
          spinning={replay.syncing}
          label={replay.playing ? t("ink.audio.pause") : t("ink.audio.play")}
          disabled={!ink.page?.audio?.file_uri}
          onClick={() => { ink.onPlay(); onClose(); }}
        />
      </CompactPopoverGrid>
      <CompactPopoverIconButton
        icon={MicOff}
        label={t("ink.audio.remove")}
        disabled={!ink.page?.audio}
        onClick={() => { ink.onClearAudio(); onClose(); }}
      />
      <CompactPopoverIconButton
        icon={History}
        label={t("ink.audio.replayInk")}
        onClick={() => { ink.onReplayInk(); onClose(); }}
      />

      {/* Overlay toggle */}
      <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
        {t("ink.more.overlay")}
      </div>
      <CompactPopoverIconButton
        icon={ink.overlayMode ? Maximize : Square}
        label={ink.overlayMode ? t("ink.overlay.fullPage") : t("ink.overlay.inkOverText")}
        active={ink.overlayMode !== undefined && ink.overlayMode}
        onClick={() => { ink.onToggleOverlayMode?.(); onClose(); }}
      />

      {/* Destructive actions */}
      <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70 border-t border-border/60">
        {t("ink.more.destructive")}
      </div>
      <CompactPopoverIconButton
        icon={Trash2}
        label={t("ink.more.removeInk")}
        className="text-destructive hover:bg-destructive/10"
        onClick={() => { ink.onRemove(); onClose(); }}
      />
      <CompactPopoverIconButton
        icon={Paperclip}
        label={t("ink.more.attachOld")}
        onClick={() => onClose()}
      >
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="w-full" onClick={() => {}} />
          </PopoverTrigger>
          <PopoverContent align="start" style={{ width: 300 }} className="max-h-[70vh] overflow-y-auto p-1">
            {ink.legacy?.length === 0 ? (
              <p className="px-2 py-3 font-mono text-[11px] text-muted-foreground">No unattached ink pages.</p>
            ) : (
              ink.legacy?.map((page) => (
                <MenuItem
                  key={page.id}
                  onClick={() => { ink.onAttach(page.id); onClose(); }}
                >
                  <span className="truncate">{page.name || "Untitled page"}</span>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{relativeTime(page.updated_date)}</span>
                </MenuItem>
              ))
            )}
          </PopoverContent>
        </Popover>
      </CompactPopoverIconButton>
    </div>
  );
}

export function InkDrawTab({ ink, onAutoStart }) {
  const { t } = useI18n();
  const { tool, onTool, engine } = ink;
  const [favPens, setFavPens] = useState(() => readFavPens());
  const [penPickerOpen, setPenPickerOpen] = useState(false);
  const [eraserPopoverOpen, setEraserPopoverOpen] = useState(false);
  const [morePopoverOpen, setMorePopoverOpen] = useState(false);

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

  // Auto-start ink when a drawing tool is used on a note without ink
  const wrapToolChange = useCallback((changes) => {
    if (onAutoStart && changes && (changes.mode === "draw" || changes.brush)) {
      onAutoStart();
    }
    handleToolChange(changes);
  }, [onAutoStart, handleToolChange]);

  // Show max 4 favourite pens in the panel, rest accessible via popover if needed
  const visibleFavPens = favPens.slice(0, 4);

  return (
    <>
      <RibbonGroup label={t("ink.groups.draw")} priority={70} icon={PenLine}>
        {/* Pen picker - single button opening popover with all brushes */}
        <Popover open={penPickerOpen} onOpenChange={setPenPickerOpen}>
          <PopoverTrigger asChild>
            <RibbonButton
              icon={FountainPenIcon}
              label={t("ink.draw.pen")}
              hint={t("ink.draw.penHint")}
              active={tool.mode === "draw"}
              onClick={() => wrapToolChange({ mode: "draw" })}
            />
          </PopoverTrigger>
          <PopoverContent align="start" style={{ width: 220 }} className="max-h-[70vh] overflow-y-auto p-1">
            <PenPickerPopover tool={tool} onTool={wrapToolChange} onClose={() => setPenPickerOpen(false)} />
          </PopoverContent>
        </Popover>

        {/* Eraser - single button with popover for mode/radius */}
        <Popover open={eraserPopoverOpen} onOpenChange={setEraserPopoverOpen}>
          <PopoverTrigger asChild>
            <RibbonButton
              icon={() => <EraserIcon mode={tool.eraserMode || "stroke"} />}
              label={t("ink.draw.eraser")}
              hint={t("ink.draw.eraserHint")}
              active={tool.mode === "erase"}
              onClick={() => wrapToolChange({ mode: "erase", eraserMode: tool.eraserMode || "stroke" })}
            />
          </PopoverTrigger>
          <PopoverContent align="start" style={{ width: 200 }} className="max-h-[70vh] overflow-y-auto p-1">
            <EraserPopover tool={tool} onTool={wrapToolChange} onClose={() => setEraserPopoverOpen(false)} />
          </PopoverContent>
        </Popover>

        {/* Lasso */}
        <RibbonButton
          icon={LassoIcon}
          label={t("ink.draw.lasso")}
          hint={t("ink.draw.lassoHint")}
          active={tool.mode === "lasso"}
          onClick={() => wrapToolChange({ mode: "lasso" })}
        />

        {/* Width slider - always visible */}
        <div style={{ gridRow: "span 2", minWidth: 140 }}>
          <Slider
            label={t("ink.draw.width")}
            value={tool.width}
            min={0.5}
            max={24}
            step={0.5}
            onChange={(width) => wrapToolChange({ width })}
            display={`${tool.width}px`}
          />
        </div>

        {/* Favourite pens - max 4 visible, save button */}
        <div className="flex flex-wrap items-center gap-1.5" style={{ minWidth: 'max-content', gridRow: "span 2" }}>
          {visibleFavPens.map((pen, index) => {
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
                <RemovePenIcon className="absolute -end-1 -top-1 h-3.5 w-3.5 text-muted-foreground/50 hover:text-destructive" />
              </button>
            );
          })}
          {favPens.length < MAX_FAV_PENS && (
            <button
              type="button"
              onClick={saveFavPen}
              title={t("ink.draw.saveFavPen")}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-dashed border-border text-muted-foreground transition hover:border-primary/50 hover:text-primary"
            >
              <SavePenIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {favPens.length === 0 && (
          <div className="col-span-2" style={{ gridColumn: "span 2" }}>
            <p className="font-mono text-[9.5px] text-muted-foreground">{t("ink.draw.noFavPens")}</p>
          </div>
        )}
      </RibbonGroup>

      <RibbonGroup label={t("ink.groups.history")} priority={30} icon={History}>
        <RibbonButton icon={Undo2} label={t("ink.history.undo")} hint={t("ink.history.undoHint")} shortcut="Ctrl+Z" disabled={!ink.canUndo} onClick={ink.onUndo} />
        <RibbonButton icon={Redo2} label={t("ink.history.redo")} hint={t("ink.history.redoHint")} shortcut="Ctrl+Shift+Z" disabled={!ink.canRedo} onClick={ink.onRedo} />
      </RibbonGroup>

      <RibbonGroup label={t("ink.groups.view")} priority={25} icon={Maximize}>
        <RibbonButton icon={ZoomOut} hint={t("ink.view.zoomOut")} onClick={() => ink.onZoom(0.85)} />
        <RibbonButton icon={ZoomIn} hint={t("ink.view.zoomIn")} onClick={() => ink.onZoom(1.18)} />
        <RibbonButton icon={Maximize} label={t("ink.view.fit")} hint={t("ink.view.fitHint")} onClick={ink.onFit} />
        <span className="self-center font-mono text-[10.5px] text-muted-foreground">{Math.round((ink.zoom || 1) * 100)}%</span>
      </RibbonGroup>

      {/* More tools popover - contains all rarely used tools */}
      <RibbonGroup label={t("ink.groups.more")} priority={10} icon={MoreHorizontal} more={
        <MoreToolsPopover ink={ink} onClose={() => setMorePopoverOpen(false)} />
      }>
        <Popover open={morePopoverOpen} onOpenChange={setMorePopoverOpen}>
          <PopoverTrigger asChild>
            <RibbonButton
              icon={MoreHorizontal}
              label={t("ink.more.label")}
              hint={t("ink.more.hint")}
              onClick={() => {}}
            />
          </PopoverTrigger>
          <PopoverContent align="start" style={{ width: 320 }} className="max-h-[70vh] overflow-y-auto p-1">
            <MoreToolsPopover ink={ink} onClose={() => setMorePopoverOpen(false)} />
          </PopoverContent>
        </Popover>
      </RibbonGroup>
    </>
  );
}

/* ---------------------------------- Color ---------------------------------- */

export function InkColorTab({ ink, onAutoStart }) {
  const { t } = useI18n();
  const { tool, onTool } = ink;
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);

  const wrapToolChange = useCallback((changes) => {
    if (onAutoStart && changes && changes.color) {
      onAutoStart();
    }
    onTool(changes);
  }, [onAutoStart, onTool]);

  return (
    <>
      <RibbonGroup label={t("ink.groups.color")} priority={60} icon={Palette}>
        {/* Single color button opening full ColorStudio */}
        <Popover open={colorPopoverOpen} onOpenChange={setColorPopoverOpen}>
          <PopoverTrigger asChild>
            <RibbonButton
              icon={Palette}
              label={t("ink.color.picker")}
              hint={t("ink.color.pickerHint")}
              onClick={() => {}}
            />
          </PopoverTrigger>
          <PopoverContent align="start" style={{ width: 320 }} className="max-h-[70vh] overflow-y-auto p-1">
            <ColorStudio
              color={tool.color}
              alpha={tool.alpha}
              eyedropper={tool.mode === "eyedropper"}
              onEyedropper={() => wrapToolChange({ mode: tool.mode === "eyedropper" ? "draw" : "eyedropper" })}
              onChange={({ color, alpha }) => wrapToolChange({ color, alpha })}
            />
          </PopoverContent>
        </Popover>
      </RibbonGroup>
    </>
  );
}

/* --------------------------------- Select ---------------------------------- */

export function InkSelectTab({ ink }) {
  const { t } = useI18n();
  const { tool, selection, engine, objectSelection, selectedObjectId, objects, deleteObject, bringToFront, sendToBack } = ink;
  const strokeCount = selection.ids.length;
  const obj = selectedObjectId ? objects.find((o) => o.id === selectedObjectId) : null;
  const objNone = { disabled: !obj, disabledReason: "Select an object with the Select tool first" };
  const strokeNone = { disabled: strokeCount === 0, disabledReason: "Select marks with the lasso first" };
  return (
    <>
      <RibbonGroup label={t("ink.groups.select")} priority={70} icon={MousePointer2}>
        <RibbonButton icon={MousePointerIcon} label={t("ink.select.select")} hint={t("ink.select.selectHint")} active={tool.mode === "select"} onClick={() => ink.onTool({ mode: "select" })} />
        <RibbonButton icon={LassoIcon} label={t("ink.select.lasso")} hint={t("ink.select.lassoHint")} active={tool.mode === "lasso"} onClick={() => ink.onTool({ mode: "lasso" })} />
        <span className="self-center font-mono text-[10.5px] text-muted-foreground min-w-[5rem] text-center">
          {obj ? `Object: ${obj.type}` : strokeCount ? `${strokeCount} strokes` : "nothing selected"}
        </span>
      </RibbonGroup>

      {obj && (
        <RibbonGroup label={t("ink.groups.object")} priority={60} icon={Layers}>
          <RibbonButton icon={Trash2} label={t("ink.object.delete")} hint={t("ink.object.deleteHint")} shortcut="Del" {...objNone} onClick={() => deleteObject(obj.id)} />
          <RibbonButton icon={Layers} label={t("ink.object.front")} hint={t("ink.object.frontHint")} {...objNone} onClick={() => bringToFront(obj.id)} />
          <RibbonButton icon={Layers} label={t("ink.object.back")} hint={t("ink.object.backHint")} {...objNone} onClick={() => sendToBack(obj.id)} />
        </RibbonGroup>
      )}

      {strokeCount > 0 && (
        <RibbonGroup label={t("ink.groups.strokes")} priority={50} icon={Check}>
          <RibbonButton icon={Check} label={t("ink.strokes.apply")} hint={t("ink.strokes.applyHint")} {...strokeNone} onClick={() => engine()?.commitSelection()} />
          <RibbonButton icon={Droplets} label={t("ink.strokes.recolor")} hint={t("ink.strokes.recolorHint")} {...strokeNone} onClick={() => engine()?.recolorSelection(tool.color, tool.alpha)} />
          <RibbonButton icon={Trash2} label={t("ink.strokes.delete")} hint={t("ink.strokes.deleteHint")} shortcut="Del" {...strokeNone} onClick={() => engine()?.deleteSelection()} />
          <RibbonButton icon={X} label={t("ink.strokes.deselect")} hint={t("ink.strokes.deselectHint")} {...strokeNone} onClick={() => engine()?.setSelection([])} />
        </RibbonGroup>
      )}

      {strokeCount > 0 && (
        <RibbonGroup label={t("ink.groups.transform")} priority={40} icon={SquareDashedMousePointer}>
          <RibbonMenu icon={SquareDashedMousePointer} label={t("ink.transform.studio")} hint={t("ink.transform.studioHint")} width={300} disabled={strokeCount === 0} disabledReason={t("ink.transform.disabled")}>
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
  const { t } = useI18n();
  const { page, pageIndex } = ink;
  const paper = page.paper || {};
  return (
    <>
      <RibbonGroup label={t("ink.groups.template")} priority={70} icon={BookOpen}>
        <RibbonSelect title={t("ink.paper.template")} value={paper.template || "grid"} onChange={(template) => ink.onPaper({ template })} options={PAPER_TEMPLATES.map((item) => ({ value: item.id, label: item.label }))} />
        <RibbonSelect title={t("ink.paper.tone")} value={paper.tone || "dark"} onChange={(tone) => ink.onPaper({ tone })} options={PAPER_TONES.map((item) => ({ value: item.id, label: item.label }))} />
      </RibbonGroup>

      <RibbonGroup label={t("ink.groups.pageSize")} priority={60} icon={Maximize}>
        <RibbonSelect title={t("ink.paper.size")} value={paper.size || "a4"} onChange={(size) => ink.onPaper({ size })} options={PAPER_SIZES.map((item) => ({ value: item.id, label: item.label }))} />
      </RibbonGroup>

      <RibbonGroup label={t("ink.groups.pages")} priority={50} icon={ChevronRight}>
        <RibbonButton icon={ChevronLeft} hint={t("ink.pages.prev")} disabled={pageIndex <= 0} onClick={() => ink.onPage(-1)} />
        <RibbonButton icon={ChevronRight} hint={t("ink.pages.next")} onClick={() => ink.onPage(1)} />
        <span className="self-center font-mono text-[10.5px] text-muted-foreground">{t("ink.pages.page", { num: pageIndex + 1 })}</span>
      </RibbonGroup>

      <RibbonGroup label={t("ink.groups.paperStudio")} priority={40} icon={Layers}>
        <RibbonMenu icon={Layers} label={t("ink.paper.studio")} hint={t("ink.paper.studioHint")} width={300}>
          {() => <PaperStudio paper={paper} onPaper={ink.onPaper} pageIndex={pageIndex} onPage={ink.onPage} onClear={ink.onClear} />}
        </RibbonMenu>
        <RibbonButton icon={Trash2} label={t("ink.paper.clear")} hint={t("ink.paper.clearHint")} onClick={ink.onClear} />
      </RibbonGroup>
    </>
  );
}

/* -------------------------------- Smart ink -------------------------------- */

export function InkSmartTab({ ink }) {
  const { t } = useI18n();
  const { recognition } = ink;
  const busy = Boolean(recognition.busy);
  return (
    <>
      <RibbonGroup label={t("ink.groups.recognise")} priority={70} icon={ScanText}>
        <RibbonButton icon={recognition.busy === "text" ? Loader2 : ScanText} spinning={recognition.busy === "text"} label={t("ink.smart.handwriting")} hint={t("ink.smart.handwritingHint")} disabled={busy} onClick={() => ink.onRecognize("text")} />
        <RibbonButton icon={recognition.busy === "math" ? Loader2 : Sigma} spinning={recognition.busy === "math"} label={t("ink.smart.equation")} hint={t("ink.smart.equationHint")} disabled={busy} onClick={() => ink.onRecognize("math")} />
      </RibbonGroup>

      <RibbonGroup label={t("ink.groups.results")} priority={60} icon={BookOpen}>
        <RibbonMenu icon={BookOpen} label={t("ink.smart.results")} hint={t("ink.smart.resultsHint")} width={300}>
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
  const { t } = useI18n();
  const { page, recording, replay } = ink;
  const audio = page.audio;
  return (
    <>
      <RibbonGroup label={t("ink.groups.record")} priority={70} icon={Mic}>
        <RibbonButton icon={recording ? Square : Mic} label={recording ? t("ink.audio.stop") : t("ink.audio.record")} hint={t("ink.audio.recordHint")} active={recording} onClick={recording ? ink.onStop : ink.onRecord} />
        {recording && <span className="self-center font-mono text-[10.5px] text-destructive">{t("ink.audio.recording")}</span>}
      </RibbonGroup>

      <RibbonGroup label={t("ink.groups.playback")} priority={60} icon={Play}>
        <RibbonButton icon={replay.syncing ? Loader2 : replay.playing ? Pause : Play} spinning={replay.syncing} label={replay.playing ? t("ink.audio.pause") : t("ink.audio.play")} hint={t("ink.audio.playHint")} disabled={!audio?.file_uri} disabledReason={t("ink.audio.noRecording")} onClick={ink.onPlay} />
        <RibbonButton icon={History} label={t("ink.audio.replayInk")} hint={t("ink.audio.replayInkHint")} onClick={ink.onReplayInk} />
        <span className="self-center font-mono text-[10.5px] text-muted-foreground">{audio ? `${clock(replay.time || 0)} / ${clock(audio.duration || 0)}` : t("ink.audio.noRecording")}</span>
      </RibbonGroup>

      <RibbonGroup label={t("ink.groups.manage")} priority={50} icon={Mic}>
        <RibbonMenu icon={Mic} label={t("ink.audio.studio")} hint={t("ink.audio.studioHint")} width={300}>
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
        <RibbonButton icon={MicOff} label={t("ink.audio.remove")} hint={t("ink.audio.removeHint")} disabled={!audio} disabledReason={t("ink.audio.noRecording")} onClick={ink.onClearAudio} />
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
  ["more", "More", null], // More is handled via popover in Draw tab
];

/**
 * The Ink tab of the note ribbon. `noteInk` is the note's own handwriting page
 * (see useInkPage in NotePage): until it exists the tab offers to start one.
 */
export function InkTab({ noteInk }) {
  const { t } = useI18n();
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
    <RibbonMenu icon={Paperclip} label={t("ink.tab.attachOld")} hint={t("ink.tab.attachOldHint")} width={300} disabled={false} onOpenChange={loadLegacy}>
      {(close) =>
        legacy.length === 0 ? (
          <p className="px-2 py-3 font-mono text-[11px] text-muted-foreground">{t("ink.tab.noAttachable")}</p>
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

  const handleAutoStart = useCallback(() => {
    if (!noteInk.hasPage) {
      noteInk.onStart();
    }
  }, [noteInk]);

  return (
    <>
      {!noteInk.hasPage ? (
        <>
          <RibbonGroup label={t("ink.tab.handwriting")} priority={70} icon={PenLine}>
            <RibbonButton
              icon={noteInk.starting ? Loader2 : PenLine}
              spinning={noteInk.starting}
              label={t("ink.tab.startInking")}
              hint={t("ink.tab.startInkingHint")}
              onClick={noteInk.onStart}
              keepFocus={false}
            />
            {attach}
          </RibbonGroup>
        </>
      ) : (
        <>
          <RibbonGroup label={t("ink.tab.ink")} priority={70} icon={PenLine}>
            <div className="grid grid-cols-3 gap-1" style={{ minWidth: 'max-content' }}>
              {SUBTABS.filter(([id]) => id !== "more").map(([id, label]) => (
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
            <RibbonGroup label={t("ink.tab.overlay")} priority={60} icon={Maximize}>
              <button
                type="button"
                onClick={noteInk.onToggleOverlayMode}
                className={cn(
                  "h-7 rounded-md border px-2 font-mono text-[10px] uppercase tracking-[0.08em] transition",
                  noteInk.overlayMode
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                title={noteInk.overlayMode ? t("ink.overlay.fullPageHint") : t("ink.overlay.inkOverTextHint")}
              >
                {noteInk.overlayMode ? t("ink.overlay.fullPage") : t("ink.overlay.inkOverText")}
              </button>
            </RibbonGroup>
          )}
          {noteInk.ink && <Section ink={noteInk.ink} onAutoStart={handleAutoStart} />}
          <RibbonGroup label={t("ink.tab.handwritingPage")} priority={50} icon={BookOpen}>
            <div className="flex flex-col justify-center px-1 font-mono text-[10px] leading-snug text-muted-foreground" style={{ minWidth: 'max-content' }}>
              <span>{t("ink.tab.marks", { count: noteInk.markCount })}</span>
              <span>{noteInk.status === "saving" ? t("ink.tab.saving") : noteInk.status === "saved" ? t("ink.tab.saved") : t("ink.tab.autosave")}</span>
            </div>
            {attach}
            <RibbonButton icon={Trash2} label={t("ink.tab.removeInk")} hint={t("ink.tab.removeInkHint")} onClick={noteInk.onRemove} keepFocus={false} />
          </RibbonGroup>
        </>
      )}
    </>
  );
}