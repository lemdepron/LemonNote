import { useState, useEffect, useCallback } from "react";
import {
  Brush, History, Layers, Maximize, Mic, MicOff, Pause, PenLine, Play, Redo2,
  ScanText, Sigma, SquareDashedMousePointer, Trash2, Undo2, ZoomIn, ZoomOut, Loader2, Square, X, Check, ChevronLeft, ChevronRight,
  Droplets, BookOpen, Paperclip, MoreHorizontal, Eraser, MousePointer2, Minus, Plus, PenTool, LassoSelect,
  Image, StickyNote, Type, Circle, ArrowRight, Triangle, Hexagon, Star, SlidersHorizontal, RectangleCorner,
} from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import RibbonButton from "@/components/ribbon/RibbonButton";
import { MenuItem, RibbonMenu, RibbonSelect } from "@/components/ribbon/RibbonKit";
import { readPref, writePref } from "@/lib/preferences";
import { toast } from "@/lib/toast";
import { tokenColor } from "@/lib/theme";
import { Slider } from "@/components/ink/StudioSection";
import BrushStudio from "@/components/ink/BrushStudio";
import AssistStudio from "@/components/ink/AssistStudio";
import SelectionStudio from "@/components/ink/SelectionStudio";
import PaperStudio from "@/components/ink/PaperStudio";
import { BRUSHES, brushPreviewStyle } from "@/lib/canvas/ink/brushes";
import { PRESET_PALETTES } from "@/lib/canvas/ink/color";
import { PAPER_SIZES, PAPER_TEMPLATES, PAPER_TONES } from "@/lib/canvas/ink/paper";
import { createCoordinateGraph } from "@/lib/canvas/ink/shapes";
import { relativeTime } from "@/lib/vault";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import {
  FountainPenIcon, BallpointPenIcon, CalligraphyPenIcon, HighlighterIcon,
  WatercolorBrushIcon, PencilIcon, EraserIcon, LassoIcon, HandIcon,
  EyedropperIcon, ShapesIcon, CoordinateGraphIcon,
  InsertSpaceIcon, MousePointerIcon,
} from "@/components/ink/icons";
import { Popover, PopoverTrigger, PopoverContent, CompactPopoverIconButton, CompactPopoverGrid } from "@/components/ui/compact-popover";
import { Switch } from "@/components/ui/switch";
import { Pipette } from "lucide-react";

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

// Pen/Highlighter settings persistence
const PEN_SETTINGS_KEY = "inkPenSettings";
const HIGHLIGHTER_SETTINGS_KEY = "inkHighlighterSettings";

const DEFAULT_PEN_SETTINGS = {
  brush: "fountain",
  color: "", // Will be resolved to tokenColor("--foreground")
  width: 3,
  alpha: 1,
  nibAngle: -0.55,
};

const DEFAULT_HIGHLIGHTER_SETTINGS = {
  brush: "marker",
  color: "#eab308", // Yellow
  width: 18,
  alpha: 0.4,
  nibAngle: -0.55,
};

function readPenSettings() {
  try {
    const raw = readPref(PEN_SETTINGS_KEY, "{}");
    return { ...DEFAULT_PEN_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PEN_SETTINGS };
  }
}

function writePenSettings(settings) {
  writePref(PEN_SETTINGS_KEY, JSON.stringify(settings));
}

function readHighlighterSettings() {
  try {
    const raw = readPref(HIGHLIGHTER_SETTINGS_KEY, "{}");
    return { ...DEFAULT_HIGHLIGHTER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_HIGHLIGHTER_SETTINGS };
  }
}

function writeHighlighterSettings(settings) {
  writePref(HIGHLIGHTER_SETTINGS_KEY, JSON.stringify(settings));
}

// Shape settings persistence
const SHAPE_SETTINGS_KEY = "inkShapeSettings";

const DEFAULT_SHAPE_SETTINGS = {
  shapeType: "rect",
  shapeStrokeColor: "", // Will be resolved to tokenColor("--foreground")
  shapeStrokeWidth: 2,
  shapeFillColor: "none",
  shapeFillOpacity: 1,
};

function readShapeSettings() {
  try {
    const raw = readPref(SHAPE_SETTINGS_KEY, "{}");
    return { ...DEFAULT_SHAPE_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SHAPE_SETTINGS };
  }
}

function writeShapeSettings(settings) {
  writePref(SHAPE_SETTINGS_KEY, JSON.stringify(settings));
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

// Expanded color palette: 7 quick + 14 from presets = 21 total
const PALETTE_COLORS = [
  "#111827", "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", // 7 quick
  "#8b5cf6", "#ec4899", "#f9fafb", // 3 more from quick
  ...PRESET_PALETTES.flatMap((p) => p.colors), // 30 from presets
].filter((c, i, a) => a.indexOf(c) === i).slice(0, 21); // Unique, max 21

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
function EraserPopover({ tool, onTool, onClose, ink }) {
  const { t } = useI18n();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  return (
    <div className="p-1 space-y-3">
      <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
        {t("ink.draw.eraser")}
      </div>
      <div className="flex gap-1 px-0.5">
        <CompactPopoverIconButton
          icon={() => <EraserIcon mode="stroke" />}
          label={t("ink.eraser.mode.stroke")}
          active={tool.eraserMode === "stroke"}
          onClick={() => { onTool({ eraserMode: "stroke", mode: "erase" }); onClose(); }}
        />
        <CompactPopoverIconButton
          icon={() => <EraserIcon mode="precision" />}
          label={t("ink.eraser.mode.precision")}
          active={tool.eraserMode === "precision"}
          onClick={() => { onTool({ eraserMode: "precision", mode: "erase" }); onClose(); }}
        />
      </div>
      <div className="px-0.5">
        <Slider
          label={t("ink.eraser.size")}
          value={tool.size}
          min={4}
          max={60}
          onChange={(size) => onTool({ size })}
          display={`${tool.size}px`}
        />
      </div>
      <div className="flex gap-1 px-0.5">
        <CompactPopoverIconButton
          icon={Minus}
          label={t("ink.eraser.sizeSmall")}
          active={tool.size === 4}
          onClick={() => { onTool({ size: 4, mode: "erase" }); onClose(); }}
        />
        <CompactPopoverIconButton
          icon={Eraser}
          label={t("ink.eraser.sizeMedium")}
          active={tool.size === 16}
          onClick={() => { onTool({ size: 16, mode: "erase" }); onClose(); }}
        />
        <CompactPopoverIconButton
          icon={Plus}
          label={t("ink.eraser.sizeLarge")}
          active={tool.size === 32}
          onClick={() => { onTool({ size: 32, mode: "erase" }); onClose(); }}
        />
        <CompactPopoverIconButton
          icon={Trash2}
          label={t("ink.eraser.sizeMax")}
          active={tool.size === 60}
          onClick={() => { onTool({ size: 60, mode: "erase" }); onClose(); }}
        />
      </div>
      <div className="border-t border-border/60 pt-2">
        <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              onClick={() => setClearDialogOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-left font-mono text-[11px] text-destructive hover:bg-destructive/10 rounded-md transition"
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              <span>{t("ink.eraser.clearAll")}</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>{t("ink.eraser.clearAllTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("ink.eraser.clearAllDesc")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setClearDialogOpen(false)}>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  ink.engine()?.clearAllStrokes();
                  setClearDialogOpen(false);
                  onClose();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t("ink.eraser.clearAllConfirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

/** Pen settings popover - brushes, colours, width, opacity */
function PenPopover({ tool, onTool, onClose, isHighlighter, readHistory, rememberColor }) {
  const { t } = useI18n();
  const [tab, setTab] = useState("brushes");
  const [draftHex, setDraftHex] = useState(tool.color);
  const [history, setHistory] = useState(() => readHistory());
  const [paletteId, setPaletteId] = useState("inkwell");

  // Live preview stroke
  const previewStyle = brushPreviewStyle(tool.brush, tool.color);
  const previewColor = previewStyle.color;
  const previewHeight = previewStyle.height;

  const applyColor = (nextColor) => {
    const clean = nextColor.trim().replace("#", "");
    if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(clean)) {
      const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
      onTool({ color: `#${full.toLowerCase()}` });
      setHistory(rememberColor(`#${full.toLowerCase()}`));
    }
  };

  const applyAlpha = (alpha) => {
    onTool({ alpha: alpha / 100 });
  };

  const applyWidth = (width) => {
    onTool({ width });
  };

  const applyBrush = (brushId) => {
    onTool({ brush: brushId, mode: "draw" });
  };

  const palette = PALETTE_COLORS;

  return (
    <div className="p-1 space-y-3 max-w-[320px]">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border/60 pb-1">
        <button
          type="button"
          onClick={() => setTab("brushes")}
          className={cn(
            "px-2 py-1 rounded-t font-mono text-[10px] transition",
            tab === "brushes" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t("ink.draw.brush")}
        </button>
        <button
          type="button"
          onClick={() => setTab("colours")}
          className={cn(
            "px-2 py-1 rounded-t font-mono text-[10px] transition",
            tab === "colours" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t("ink.draw.colour")}
        </button>
      </div>

      {tab === "brushes" && (
        <div className="space-y-3">
          <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
            {t("ink.draw.brush")}
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
                  onClick={() => { applyBrush(brush.id); onClose(); }}
                >
                  <div className="absolute bottom-1 right-1 h-1.5 w-4 rounded-full" style={{ background: preview.color, opacity: 0.8 }} />
                </CompactPopoverIconButton>
              );
            })}
          </CompactPopoverGrid>

          {/* Calligraphy nib angle */}
          {tool.brush === "calligraphy" && (
            <div className="px-0.5">
              <Slider
                label={t("ink.draw.nibAngle") || "Nib angle"}
                value={Math.round((tool.nibAngle * 180) / Math.PI)}
                min={-90}
                max={90}
                onChange={(value) => onTool({ nibAngle: (value * Math.PI) / 180 })}
                display={`${Math.round((tool.nibAngle * 180) / Math.PI)}°`}
              />
            </div>
          )}
        </div>
      )}

      {tab === "colours" && (
        <div className="space-y-3">
          {/* Custom colour input + eyedropper */}
          <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
            {t("ink.draw.customColour")}
          </div>
          <div className="flex items-center gap-1.5 px-0.5">
            <input
              value={draftHex}
              onChange={(e) => {
                setDraftHex(e.target.value);
                const clean = e.target.value.trim().replace("#", "");
                if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(clean)) {
                  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
                  onTool({ color: `#${full.toLowerCase()}` });
                }
              }}
              aria-label={t("ink.draw.customColour")}
              spellCheck={false}
              className="h-9 min-w-0 flex-1 rounded-lg border border-border/70 bg-card/60 px-2 font-mono text-[12px] uppercase text-foreground outline-none transition focus:border-primary/40"
            />
            <button
              type="button"
              onClick={() => onTool({ eyedropper: true })}
              title="Eyedropper — sample any pixel on the canvas"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border/70 text-muted-foreground hover:text-foreground transition"
            >
              <Pipette className="h-4 w-4" />
            </button>
          </div>

          {/* Opacity */}
          <div className="px-0.5">
            <Slider
              label={`${t("ink.draw.opacity")} ${Math.round(tool.alpha * 100)}%`}
              value={Math.round(tool.alpha * 100)}
              min={10}
              max={100}
              onChange={applyAlpha}
              display={`${Math.round(tool.alpha * 100)}%`}
            />
          </div>

          {/* Width */}
          <div className="px-0.5">
            <Slider
              label={`${t("ink.draw.width")} ${tool.width}px`}
              value={tool.width}
              min={1}
              max={40}
              step={0.5}
              onChange={applyWidth}
              display={`${tool.width}px`}
            />
          </div>

          {/* Live preview */}
          <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
            {t("ink.draw.livePreview")}
          </div>
          <div className="px-0.5 h-8 flex items-center border border-border/60 rounded-md bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,hsl(var(--card))_0%_50%)] bg-[length:8px_8px]">
            <div
              className="h-full mx-2 rounded"
              style={{
                width: Math.min(200, tool.width * 8),
                background: previewColor,
                height: previewHeight,
              }}
            />
          </div>

          {/* Palettes */}
          <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
            {t("ink.draw.palettes")}
          </div>
          <div className="flex flex-wrap gap-1 px-0.5">
            {PALETTE_COLORS.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => applyColor(hex)}
                aria-label={`Colour ${hex}`}
                className={cn(
                  "h-6 w-6 rounded-full border transition hover:scale-105",
                  tool.color.toLowerCase() === hex.toLowerCase() ? "border-foreground/80 ring-1 ring-foreground/30" : "border-foreground/30"
                )}
                style={{ background: hex }}
              />
            ))}
          </div>

          {/* Recent colours */}
          <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
            {t("ink.draw.recentColours")}
          </div>
          <div className="flex flex-wrap gap-1 px-0.5">
            {history.length ? (
              history.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => applyColor(hex)}
                  aria-label={`Recent ${hex}`}
                  className={cn(
                    "h-6 w-6 rounded-full border transition hover:scale-105",
                    tool.color.toLowerCase() === hex.toLowerCase() ? "border-foreground/80 ring-1 ring-foreground/30" : "border-foreground/30"
                  )}
                  style={{
                    backgroundImage: `linear-gradient(${hex}, ${hex}), repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--card)) 0% 50%)`,
                    backgroundSize: "100% 100%, 8px 8px",
                  }}
                />
              ))
            ) : (
              <span className="font-mono text-[9.5px] text-muted-foreground">colours you ink with land here</span>
            )}
          </div>
        </div>
      )}
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
      <EraserPopover tool={tool} onTool={onTool} onClose={onClose} ink={ink} />

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

      {/* Smart ink - disabled with Coming soon */}
      <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
        {t("ink.more.smartInk")}
      </div>
      <CompactPopoverGrid columns={2}>
        <CompactPopoverIconButton
          icon={ScanText}
          label={t("ink.more.handwriting")}
          disabled={true}
          title={t("ink.comingSoon")}
        />
        <CompactPopoverIconButton
          icon={Sigma}
          label={t("ink.more.equation")}
          disabled={true}
          title={t("ink.comingSoon")}
        />
      </CompactPopoverGrid>
      <CompactPopoverIconButton
        icon={BookOpen}
        label={t("ink.more.resultsSearch")}
        disabled={true}
        title={t("ink.comingSoon")}
      >
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="w-full" onClick={() => {}} />
          </PopoverTrigger>
          <PopoverContent align="start" style={{ width: 300 }} className="max-h-[70vh] overflow-y-auto p-1">
            <div className="px-2 py-3 font-mono text-[11px] text-muted-foreground">
              {t("ink.comingSoon")}
            </div>
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

/** Shape type selector popover */
function ShapePopover({ tool, onTool, onClose, shapeSettings }) {
  const { t } = useI18n();
  const shapeTypes = [
    { id: "line", icon: Minus, labelKey: "vault.canvas.draw.tools.shapeTypeLine" },
    { id: "arrow", icon: ArrowRight, labelKey: "vault.canvas.draw.tools.shapeTypeArrow" },
    { id: "rect", icon: Square, labelKey: "vault.canvas.draw.tools.shapeTypeRectangle" },
    { id: "rounded-rect", icon: RectangleCorner, labelKey: "vault.canvas.draw.tools.shapeTypeRoundedRect" },
    { id: "ellipse", icon: Circle, labelKey: "vault.canvas.draw.tools.shapeTypeEllipse" },
    { id: "triangle", icon: Triangle, labelKey: "vault.canvas.draw.tools.shapeTypeTriangle" },
    { id: "star", icon: Star, labelKey: "vault.canvas.draw.tools.shapeTypeStar" },
  ];

  return (
    <div className="p-1 space-y-3">
      <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
        {t("vault.canvas.draw.tools.shapeTypes")}
      </div>
      <div className="grid grid-cols-4 gap-1 px-0.5">
        {shapeTypes.map((shape) => {
          const Icon = shape.icon;
          const active = tool.shapeType === shape.id && tool.mode === "shape";
          return (
            <CompactPopoverIconButton
              key={shape.id}
              icon={Icon}
              label={t(shape.labelKey)}
              active={active}
              onClick={() => {
                onTool({
                  mode: "shape",
                  shapeType: shape.id,
                  shapeStrokeColor: shapeSettings.shapeStrokeColor || tokenColor("--foreground"),
                  shapeStrokeWidth: shapeSettings.shapeStrokeWidth,
                  shapeFillColor: shapeSettings.shapeFillColor,
                  shapeFillOpacity: shapeSettings.shapeFillOpacity,
                });
                onClose();
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Shape options popover - stroke and fill settings */
function ShapeOptionsPopover({ tool, onTool, onClose, shapeSettings }) {
  const { t } = useI18n();
  const [tab, setTab] = useState("stroke");
  const [draftStrokeHex, setDraftStrokeHex] = useState(shapeSettings.shapeStrokeColor || tool.color);
  const [draftFillHex, setDraftFillHex] = useState(shapeSettings.shapeFillColor === "none" ? "" : shapeSettings.shapeFillColor);

  const applyStrokeColor = (nextColor) => {
    const clean = nextColor.trim().replace("#", "");
    if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(clean)) {
      const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
      onTool({ shapeStrokeColor: `#${full.toLowerCase()}` });
    }
  };

  const applyFillColor = (nextColor) => {
    if (!nextColor || nextColor === "none") {
      onTool({ shapeFillColor: "none" });
      return;
    }
    const clean = nextColor.trim().replace("#", "");
    if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(clean)) {
      const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
      onTool({ shapeFillColor: `#${full.toLowerCase()}` });
    }
  };

  const applyStrokeWidth = (width) => {
    onTool({ shapeStrokeWidth: width });
  };

  const applyFillOpacity = (opacity) => {
    onTool({ shapeFillOpacity: opacity / 100 });
  };

  return (
    <div className="p-1 space-y-3 max-w-[320px]">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border/60 pb-1">
        <button
          type="button"
          onClick={() => setTab("stroke")}
          className={cn(
            "px-2 py-1 rounded-t font-mono text-[10px] transition",
            tab === "stroke" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t("vault.canvas.draw.tools.shapeStrokeColor")}
        </button>
        <button
          type="button"
          onClick={() => setTab("fill")}
          className={cn(
            "px-2 py-1 rounded-t font-mono text-[10px] transition",
            tab === "fill" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t("vault.canvas.draw.tools.shapeFillColor")}
        </button>
      </div>

      {tab === "stroke" && (
        <div className="space-y-3">
          {/* Stroke colour */}
          <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
            {t("vault.canvas.draw.tools.shapeStrokeColor")}
          </div>
          <div className="flex items-center gap-1.5 px-0.5">
            <input
              value={draftStrokeHex}
              onChange={(e) => {
                setDraftStrokeHex(e.target.value);
                applyStrokeColor(e.target.value);
              }}
              aria-label={t("vault.canvas.draw.tools.shapeStrokeColor")}
              spellCheck={false}
              className="h-9 min-w-0 flex-1 rounded-lg border border-border/70 bg-card/60 px-2 font-mono text-[12px] uppercase text-foreground outline-none transition focus:border-primary/40"
            />
          </div>

          {/* Stroke width */}
          <div className="px-0.5">
            <Slider
              label={`${t("vault.canvas.draw.tools.shapeStrokeWidth")} ${shapeSettings.shapeStrokeWidth}px`}
              value={shapeSettings.shapeStrokeWidth}
              min={1}
              max={20}
              onChange={applyStrokeWidth}
              display={`${shapeSettings.shapeStrokeWidth}px`}
            />
          </div>

          {/* Quick colours */}
          <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
            Quick colours
          </div>
          <div className="flex flex-wrap gap-1 px-0.5">
            {PALETTE_COLORS.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => applyStrokeColor(hex)}
                aria-label={`Colour ${hex}`}
                className={cn(
                  "h-6 w-6 rounded-full border transition hover:scale-105",
                  (shapeSettings.shapeStrokeColor || tool.color).toLowerCase() === hex.toLowerCase() ? "border-foreground/80 ring-1 ring-foreground/30" : "border-foreground/30"
                )}
                style={{ background: hex }}
              />
            ))}
          </div>
        </div>
      )}

      {tab === "fill" && (
        <div className="space-y-3">
          {/* Fill colour */}
          <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
            {t("vault.canvas.draw.tools.shapeFillColor")}
          </div>
          <div className="flex items-center gap-1.5 px-0.5">
            <input
              value={draftFillHex}
              onChange={(e) => {
                setDraftFillHex(e.target.value);
                applyFillColor(e.target.value);
              }}
              aria-label={t("vault.canvas.draw.tools.shapeFillColor")}
              spellCheck={false}
              placeholder={t("vault.canvas.draw.tools.shapeFillNone")}
              className="h-9 min-w-0 flex-1 rounded-lg border border-border/70 bg-card/60 px-2 font-mono text-[12px] uppercase text-foreground outline-none transition focus:border-primary/40"
            />
            <button
              type="button"
              onClick={() => { onTool({ shapeFillColor: "none" }); setDraftFillHex(""); }}
              aria-label={t("vault.canvas.draw.tools.shapeFillNone")}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border/70 text-muted-foreground hover:text-foreground transition"
              title={t("vault.canvas.draw.tools.shapeFillNone")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Fill opacity */}
          <div className="px-0.5">
            <Slider
              label={`${t("vault.canvas.draw.tools.shapeFillOpacity")} ${Math.round(shapeSettings.shapeFillOpacity * 100)}%`}
              value={Math.round(shapeSettings.shapeFillOpacity * 100)}
              min={0}
              max={100}
              onChange={applyFillOpacity}
              display={`${Math.round(shapeSettings.shapeFillOpacity * 100)}%`}
            />
          </div>

          {/* Quick colours */}
          <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
            Quick colours
          </div>
          <div className="flex flex-wrap gap-1 px-0.5">
            <button
              type="button"
              onClick={() => { onTool({ shapeFillColor: "none" }); setDraftFillHex(""); }}
              aria-label={t("vault.canvas.draw.tools.shapeFillNone")}
              className={cn(
                "h-6 w-6 rounded-full border transition hover:scale-105",
                shapeSettings.shapeFillColor === "none" ? "border-foreground/80 ring-1 ring-foreground/30" : "border-foreground/30"
              )}
              style={{ background: "repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--card)) 0% 50%)", backgroundSize: "8px 8px" }}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            {PALETTE_COLORS.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => applyFillColor(hex)}
                aria-label={`Fill ${hex}`}
                className={cn(
                  "h-6 w-6 rounded-full border transition hover:scale-105",
                  (shapeSettings.shapeFillColor || "").toLowerCase() === hex.toLowerCase() ? "border-foreground/80 ring-1 ring-foreground/30" : "border-foreground/30"
                )}
                style={{ background: hex }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== Canvas Ribbon Tabs ============================== */

export function CanvasDrawTab({ ink, onAutoStart, afterDraw }) {
  const { t } = useI18n();
  const { tool, onTool, engine } = ink;
  const [favPens, setFavPens] = useState(() => readFavPens());
  const [penPopoverOpen, setPenPopoverOpen] = useState(false);
  const [highlighterPopoverOpen, setHighlighterPopoverOpen] = useState(false);
  const [eraserPopoverOpen, setEraserPopoverOpen] = useState(false);
  const [morePopoverOpen, setMorePopoverOpen] = useState(false);
  const [snapShapes, setSnapShapes] = useState(() => readPref("inkSnapShapes", "true") === "true");
  const [shapePopoverOpen, setShapePopoverOpen] = useState(false);

  // Load persisted settings for pen, highlighter, and shapes
  const [penSettings] = useState(() => readPenSettings());
  const [highlighterSettings] = useState(() => readHighlighterSettings());
  const [shapeSettings] = useState(() => readShapeSettings());

  // Determine if current tool is highlighter (marker brush with highlighter-like settings)
  const isHighlighterMode = tool.brush === "marker" && tool.alpha < 0.6;

  useEffect(() => {
    setFavPens(readFavPens());
  }, []);

  // Read history and rememberColor from palette module
  const readHistory = useCallback(() => {
    try {
      const raw = readPref("inkColorHistory", "[]");
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }, []);

  const rememberColor = useCallback((color) => {
    if (!color) return readHistory();
    const next = [color, ...readHistory().filter((entry) => entry !== color)].slice(0, 14);
    writePref("inkColorHistory", JSON.stringify(next));
    return next;
  }, [readHistory]);

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

  // Persist pen/highlighter/shape settings when they change
  const persistPenSettings = useCallback((changes) => {
    const next = { ...penSettings, ...changes };
    writePenSettings(next);
  }, [penSettings]);

  const persistHighlighterSettings = useCallback((changes) => {
    const next = { ...highlighterSettings, ...changes };
    writeHighlighterSettings(next);
  }, [highlighterSettings]);

  const persistShapeSettings = useCallback((changes) => {
    const next = { ...shapeSettings, ...changes };
    writeShapeSettings(next);
  }, [shapeSettings]);

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
    if (onAutoStart && changes && (changes.mode === "draw" || changes.brush || changes.shapeType)) {
      onAutoStart();
    }

    // Persist settings per tool
    if (isHighlighterMode) {
      persistHighlighterSettings(changes);
    } else if (changes.shapeType !== undefined || changes.shapeStrokeColor !== undefined || changes.shapeStrokeWidth !== undefined || changes.shapeFillColor !== undefined || changes.shapeFillOpacity !== undefined) {
      persistShapeSettings(changes);
    } else {
      persistPenSettings(changes);
    }

    handleToolChange(changes);
  }, [onAutoStart, handleToolChange, isHighlighterMode, persistPenSettings, persistHighlighterSettings, persistShapeSettings]);

  const handleSnapShapesChange = useCallback((checked) => {
    setSnapShapes(checked);
    writePref("inkSnapShapes", checked ? "true" : "false");
    onTool({ shapeRecognition: checked });
  }, [onTool]);

  // Switch to pen with persisted settings
  const activatePen = useCallback(() => {
    wrapToolChange({
      mode: "draw",
      brush: penSettings.brush,
      color: penSettings.color || tokenColor("--foreground"),
      width: penSettings.width,
      alpha: penSettings.alpha,
      nibAngle: penSettings.nibAngle,
    });
  }, [wrapToolChange, penSettings]);

  // Switch to highlighter with persisted settings
  const activateHighlighter = useCallback(() => {
    wrapToolChange({
      mode: "draw",
      brush: highlighterSettings.brush,
      color: highlighterSettings.color,
      width: highlighterSettings.width,
      alpha: highlighterSettings.alpha,
      nibAngle: highlighterSettings.nibAngle,
    });
  }, [wrapToolChange, highlighterSettings]);

  // Switch to shape tool with persisted settings
  const activateShape = useCallback(() => {
    wrapToolChange({
      mode: "shape",
      shapeType: shapeSettings.shapeType,
      shapeStrokeColor: shapeSettings.shapeStrokeColor || tokenColor("--foreground"),
      shapeStrokeWidth: shapeSettings.shapeStrokeWidth,
      shapeFillColor: shapeSettings.shapeFillColor,
      shapeFillOpacity: shapeSettings.shapeFillOpacity,
    });
  }, [wrapToolChange, shapeSettings]);

  // Show max 4 favourite pens in the panel, rest accessible via popover if needed
  const visibleFavPens = favPens.slice(0, 4);

  // Current color dot and width for display
  const currentPreview = brushPreviewStyle(tool.brush, tool.color);

  return (
    <>
      <RibbonGroup label={t("ink.groups.draw")} priority={70} icon={PenLine}>
        {/* Pen button with popover */}
        <Popover open={penPopoverOpen} onOpenChange={setPenPopoverOpen}>
          <PopoverTrigger asChild>
            <RibbonButton
              icon={PenTool}
              label={t("ink.draw.pen")}
              hint={t("ink.draw.penHint")}
              active={tool.mode === "draw" && !isHighlighterMode}
              onClick={activatePen}
            />
          </PopoverTrigger>
          <PopoverContent align="start" style={{ width: 340 }} className="max-h-[80vh] overflow-y-auto p-1">
            <PenPopover
              tool={tool}
              onTool={wrapToolChange}
              onClose={() => setPenPopoverOpen(false)}
              isHighlighter={false}
              readHistory={readHistory}
              rememberColor={rememberColor}
            />
          </PopoverContent>
        </Popover>

        {/* Current colour dot - clicking opens pen popover */}
        <button
          type="button"
          onClick={() => setPenPopoverOpen(true)}
          aria-label={t("ink.draw.colour")}
          className="relative h-8 w-8 shrink-0 rounded-md border border-border/60 transition hover:border-primary/50"
          style={{
            backgroundImage: `linear-gradient(${tool.color}, ${tool.color}), repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--card)) 0% 50%)`,
            backgroundSize: "100% 100%, 8px 8px",
            opacity: tool.alpha < 1 ? 0.55 + tool.alpha * 0.45 : 1,
          }}
        >
          {tool.alpha < 1 && (
            <span className="absolute -bottom-1 -right-1 font-mono text-[7px] text-foreground/70 bg-background px-0.5 rounded">
              {Math.round(tool.alpha * 100)}%
            </span>
          )}
        </button>

        {/* Width indicator */}
        <span className="self-center font-mono text-[10px] text-muted-foreground w-10 text-center">
          {tool.width}px
        </span>

        {/* Highlighter button with popover */}
        <Popover open={highlighterPopoverOpen} onOpenChange={setHighlighterPopoverOpen}>
          <PopoverTrigger asChild>
            <RibbonButton
              icon={HighlighterIcon}
              label={t("ink.draw.highlighter")}
              hint={t("ink.draw.highlighterHint")}
              active={isHighlighterMode}
              onClick={activateHighlighter}
            />
          </PopoverTrigger>
          <PopoverContent align="start" style={{ width: 340 }} className="max-h-[80vh] overflow-y-auto p-1">
            <PenPopover
              tool={tool}
              onTool={wrapToolChange}
              onClose={() => setHighlighterPopoverOpen(false)}
              isHighlighter={true}
              readHistory={readHistory}
              rememberColor={rememberColor}
            />
          </PopoverContent>
        </Popover>

        {/* Eraser - single button with popover for mode/radius */}
        <Popover open={eraserPopoverOpen} onOpenChange={setEraserPopoverOpen}>
          <PopoverTrigger asChild>
            <RibbonButton
              icon={Eraser}
              label={t("ink.draw.eraser")}
              hint={t("ink.draw.eraserHint")}
              active={tool.mode === "erase"}
              onClick={() => wrapToolChange({ mode: "erase", eraserMode: tool.eraserMode || "stroke" })}
            />
          </PopoverTrigger>
          <PopoverContent align="start" style={{ width: 200 }} className="max-h-[70vh] overflow-y-auto p-1">
            <EraserPopover tool={tool} onTool={wrapToolChange} onClose={() => setEraserPopoverOpen(false)} ink={ink} />
          </PopoverContent>
        </Popover>

        {/* Lasso */}
        <RibbonButton
          icon={LassoSelect}
          label={t("ink.draw.lasso")}
          hint={t("ink.draw.lassoHint")}
          active={tool.mode === "lasso"}
          onClick={() => wrapToolChange({ mode: "lasso" })}
        />

        {/* Shape tool with dropdown */}
        <Popover open={shapePopoverOpen} onOpenChange={setShapePopoverOpen}>
          <PopoverTrigger asChild>
            <RibbonButton
              icon={ShapesIcon}
              label={t("ink.draw.shapeTool")}
              hint={t("ink.draw.shapeToolHint")}
              active={tool.mode === "shape"}
              onClick={activateShape}
            />
          </PopoverTrigger>
          <PopoverContent align="start" style={{ width: 280 }} className="max-h-[80vh] overflow-y-auto p-1">
            <ShapePopover
              tool={tool}
              onTool={wrapToolChange}
              onClose={() => setShapePopoverOpen(false)}
              shapeSettings={shapeSettings}
            />
          </PopoverContent>
        </Popover>

        {/* Shape options button */}
        <Popover open={shapePopoverOpen} onOpenChange={setShapePopoverOpen}>
          <PopoverTrigger asChild>
            <RibbonButton
              icon={SlidersHorizontal}
              label={t("ink.draw.shapeOptions")}
              hint={t("ink.draw.shapeOptions")}
              onClick={() => setShapePopoverOpen(true)}
            />
          </PopoverTrigger>
          <PopoverContent align="start" style={{ width: 300 }} className="max-h-[80vh] overflow-y-auto p-1">
            <ShapeOptionsPopover
              tool={tool}
              onTool={wrapToolChange}
              onClose={() => setShapePopoverOpen(false)}
              shapeSettings={shapeSettings}
            />
          </PopoverContent>
        </Popover>

        {/* Snap shapes toggle */}
        <div style={{ gridRow: "span 2", minWidth: 100, display: "flex", alignItems: "center", gap: 8 }}>
          <Switch
            checked={snapShapes}
            onCheckedChange={handleSnapShapesChange}
            aria-label={t("ink.draw.snapShapes")}
          />
          <span className="font-mono text-[10px] text-muted-foreground">{t("ink.draw.snapShapes")}</span>
        </div>
      </RibbonGroup>
      {afterDraw}

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

export function CanvasFramesTab({ ink }) {
  const { t } = useI18n();
  const { page, pageIndex } = ink;
  const paper = page.paper || {};

  return (
    <>
      <RibbonGroup label={t("ink.frames.template")} priority={70} icon={BookOpen}>
        <RibbonSelect title={t("ink.frames.paperTemplate")} value={paper.template || "grid"} onChange={(template) => ink.onPaper({ template })} options={PAPER_TEMPLATES.map((item) => ({ value: item.id, label: item.label }))} />
        <RibbonSelect title={t("ink.frames.paperTone")} value={paper.tone || "dark"} onChange={(tone) => ink.onPaper({ tone })} options={PAPER_TONES.map((item) => ({ value: item.id, label: item.label }))} />
      </RibbonGroup>

      <RibbonGroup label={t("ink.frames.pageSize")} priority={60} icon={Maximize}>
        <RibbonSelect title={t("ink.frames.pageSize")} value={paper.size || "a4"} onChange={(size) => ink.onPaper({ size })} options={PAPER_SIZES.map((item) => ({ value: item.id, label: item.label }))} />
      </RibbonGroup>

      <RibbonGroup label={t("ink.frames.pages")} priority={50} icon={ChevronRight}>
        <RibbonButton icon={ChevronLeft} hint={t("ink.frames.previousPage")} disabled={pageIndex <= 0} onClick={() => ink.onPage(-1)} />
        <RibbonButton icon={ChevronRight} hint={t("ink.frames.nextPage")} onClick={() => ink.onPage(1)} />
        <span className="self-center font-mono text-[10.5px] text-muted-foreground">{t("ink.frames.pageNumber", { num: pageIndex + 1 })}</span>
      </RibbonGroup>

      <RibbonGroup label={t("ink.frames.paperStudio")} priority={40} icon={Layers}>
        <RibbonMenu icon={Layers} label={t("ink.frames.paperStudio")} hint={t("ink.frames.paperStudioHint")} width={300}>
          {() => <PaperStudio paper={paper} onPaper={ink.onPaper} pageIndex={pageIndex} onPage={ink.onPage} onClear={ink.onClear} />}
        </RibbonMenu>
        <RibbonButton icon={Trash2} label={t("ink.frames.clearPage")} hint={t("ink.frames.clearPageHint")} onClick={ink.onClear} />
      </RibbonGroup>

      <RibbonGroup label={t("ink.frames.shapes")} priority={30} icon={CoordinateGraphIcon}>
        <RibbonButton icon={CoordinateGraphIcon} label={t("ink.frames.coordinateGraph")} hint={t("ink.frames.coordinateGraphHint")} onClick={() => {
          const eng = ink.engine();
          if (!eng) return;
          const center = eng.centerWorld();
          const strokes = createCoordinateGraph(center.x, center.y, 400, 300, 50);
          eng.cb.onCommit?.(strokes);
        }} />
      </RibbonGroup>
    </>
  );
}

export function CanvasObjectsTab({ ink }) {
  const { t } = useI18n();
  const { tool, selection, engine, objectSelection, selectedObjectId, objects, deleteObject, bringToFront, sendToBack } = ink;
  const strokeCount = selection.ids.length;
  const obj = selectedObjectId ? objects.find((o) => o.id === selectedObjectId) : null;
  const objNone = { disabled: !obj, disabledReason: t("ink.objects.selectObjectFirst") };
  const strokeNone = { disabled: strokeCount === 0, disabledReason: t("ink.objects.selectFirst") };

  return (
    <>
      <RibbonGroup label={t("ink.groups.select")} priority={70} icon={MousePointer2}>
        <RibbonButton icon={MousePointerIcon} label={t("ink.objects.select")} hint={t("ink.objects.selectHint")} active={tool.mode === "select"} onClick={() => ink.onTool({ mode: "select" })} />
        <RibbonButton icon={LassoIcon} label={t("ink.objects.lasso")} hint={t("ink.objects.lassoHint")} active={tool.mode === "lasso"} onClick={() => ink.onTool({ mode: "lasso" })} />
        <span className="self-center font-mono text-[10.5px] text-muted-foreground min-w-[5rem] text-center">
          {obj ? `Object: ${obj.type}` : strokeCount ? `${strokeCount} strokes` : "nothing selected"}
        </span>
      </RibbonGroup>

      {obj && (
        <RibbonGroup label={t("ink.groups.object")} priority={60} icon={Layers}>
          <RibbonButton icon={Trash2} label={t("ink.objects.delete")} hint={t("ink.objects.deleteHint")} shortcut="Del" {...objNone} onClick={() => deleteObject(obj.id)} />
          <RibbonButton icon={Layers} label={t("ink.objects.front")} hint={t("ink.objects.frontHint")} {...objNone} onClick={() => bringToFront(obj.id)} />
          <RibbonButton icon={Layers} label={t("ink.objects.back")} hint={t("ink.objects.backHint")} {...objNone} onClick={() => sendToBack(obj.id)} />
        </RibbonGroup>
      )}

      {strokeCount > 0 && (
        <RibbonGroup label={t("ink.groups.strokes")} priority={50} icon={Check}>
          <RibbonButton icon={Check} label={t("ink.objects.apply")} hint={t("ink.objects.applyHint")} {...strokeNone} onClick={() => engine()?.commitSelection()} />
          <RibbonButton icon={Droplets} label={t("ink.objects.recolor")} hint={t("ink.objects.recolorHint")} {...strokeNone} onClick={() => engine()?.recolorSelection(tool.color, tool.alpha)} />
          <RibbonButton icon={Trash2} label={t("ink.objects.delete")} hint={t("ink.objects.deleteHint")} shortcut="Del" {...strokeNone} onClick={() => engine()?.deleteSelection()} />
          <RibbonButton icon={X} label={t("ink.objects.deselect")} hint={t("ink.objects.deselectHint")} {...strokeNone} onClick={() => engine()?.setSelection([])} />
        </RibbonGroup>
      )}

      {strokeCount > 0 && (
        <RibbonGroup label={t("ink.groups.transform")} priority={40} icon={SquareDashedMousePointer}>
          <RibbonMenu icon={SquareDashedMousePointer} label={t("ink.objects.selectionStudio")} hint={t("ink.objects.selectionStudioHint")} width={300} disabled={strokeCount === 0} disabledReason={t("ink.objects.selectFirst")}>
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

      {/* Object insertion tools */}
      <RibbonGroup label={t("ink.groups.shapes")} priority={30} icon={ShapesIcon}>
        <RibbonMenu icon={ShapesIcon} label={t("ink.objects.shapes")} hint={t("ink.objects.shapesHint")} width={220}>
          {() => (
            <div className="p-1 space-y-2">
              <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
                {t("ink.objects.shapes")}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: "rect", icon: Square, label: "Rectangle" },
                  { id: "rounded-rect", icon: RectangleCorner, label: "Rounded rect" },
                  { id: "ellipse", icon: Circle, label: "Circle/Ellipse" },
                  { id: "line", icon: Minus, label: "Line" },
                  { id: "arrow", icon: ArrowRight, label: "Arrow" },
                  { id: "triangle", icon: Triangle, label: "Triangle" },
                  { id: "polygon", icon: Hexagon, label: "Polygon" },
                  { id: "star", icon: Star, label: "Star" },
                ].map((shape) => {
                  const Icon = shape.icon;
                  return (
                    <button
                      key={shape.id}
                      type="button"
                      onClick={() => {
                        const eng = ink.engine();
                        if (!eng) return;
                        const center = eng.centerWorld();
                        ink.addObject("shape", center.x, center.y, { shapeType: shape.id });
                      }}
                      className="flex flex-col items-center gap-1 p-2 rounded-md border border-border/60 hover:bg-accent hover:border-primary/50 transition"
                    >
                      <Icon className="h-5 w-5 text-foreground" />
                      <span className="font-mono text-[9px] text-muted-foreground">{t(`vault.canvas.insert.objects.${shape.id === "rounded-rect" ? "roundedRect" : shape.id}`)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </RibbonMenu>
        <RibbonMenu icon={Image} label={t("ink.objects.stickers")} hint={t("ink.objects.stickersHint")} width={220}>
          {() => (
            <div className="p-1 space-y-2">
              <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
                {t("ink.objects.stickers")}
              </div>
              <div className="grid grid-cols-4 gap-1 max-h-60 overflow-y-auto">
                {[
                  "star-1", "heart", "smile", "thumbs-up", "lightning", "cloud", "sun", "moon",
                  "flower", "music", "camera", "bookmark", "flag", "tag", "paperclip", "bell",
                  "gift", "cake", "rocket", "leaf", "fire", "diamond", "sparkles", "check"
                ].map((stickerId) => (
                  <button
                    key={stickerId}
                    type="button"
                    onClick={() => {
                      const eng = ink.engine();
                      if (!eng) return;
                      const center = eng.centerWorld();
                      ink.addObject("sticker", center.x, center.y, { stickerId });
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-md border border-border/60 hover:bg-accent hover:border-primary/50 transition"
                  >
                    <span className="h-8 w-8 text-foreground">{stickerId}</span>
                    <span className="font-mono text-[8px] text-muted-foreground">{stickerId}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </RibbonMenu>
        <RibbonButton icon={Type} label={t("ink.objects.textbox")} hint={t("ink.objects.textboxHint")} onClick={() => {
          const eng = ink.engine();
          if (!eng) return;
          const center = eng.centerWorld();
          ink.addObject("textbox", center.x, center.y);
        }} />
        <RibbonButton icon={StickyNote} label={t("ink.objects.sticky")} hint={t("ink.objects.stickyHint")} onClick={() => {
          const eng = ink.engine();
          if (!eng) return;
          const center = eng.centerWorld();
          ink.addObject("sticky", center.x, center.y);
        }} />
      </RibbonGroup>
    </>
  );
}

export function CanvasViewTab({ ink }) {
  const { t } = useI18n();
  const { overlayMode } = ink;

  return (
    <>
      <RibbonGroup label={t("ink.groups.view")} priority={70} icon={Maximize}>
        <RibbonButton icon={ZoomOut} hint={t("ink.view.zoomOut")} onClick={() => ink.onZoom(0.85)} />
        <RibbonButton icon={ZoomIn} hint={t("ink.view.zoomIn")} onClick={() => ink.onZoom(1.18)} />
        <RibbonButton icon={Maximize} label={t("ink.view.fit")} hint={t("ink.view.fitHint")} onClick={ink.onFit} />
        <span className="self-center font-mono text-[10.5px] text-muted-foreground">{Math.round((ink.zoom || 1) * 100)}%</span>
      </RibbonGroup>

      <RibbonGroup label={t("ink.groups.overlay")} priority={60} icon={Layers}>
        <RibbonButton
          icon={overlayMode ? Maximize : Square}
          label={overlayMode ? t("ink.overlay.fullPage") : t("ink.overlay.inkOverText")}
          hint={overlayMode ? t("ink.overlay.fullPageHint") : t("ink.overlay.inkOverTextHint")}
          active={Boolean(overlayMode)}
          onClick={ink.onToggleOverlayMode}
        />
      </RibbonGroup>

      <RibbonGroup label={t("ink.groups.history")} priority={30} icon={History}>
        <RibbonButton icon={Undo2} label={t("ink.history.undo")} hint={t("ink.history.undoHint")} shortcut="Ctrl+Z" disabled={!ink.canUndo} onClick={ink.onUndo} />
        <RibbonButton icon={Redo2} label={t("ink.history.redo")} hint={t("ink.history.redoHint")} shortcut="Ctrl+Shift+Z" disabled={!ink.canRedo} onClick={ink.onRedo} />
      </RibbonGroup>
    </>
  );
}

/* ============================== Legacy InkTab (for note ribbon) ============================== */

/** Lets a note jump to ink: create a page, reopen a recent one, or browse them all. */
export function InkTab({ noteInk }) {
  const { t } = useI18n();
  const [legacy, setLegacy] = useState([]);
  const loadLegacy = () =>
    noteInk
      .listAttachable()
      .then(setLegacy)
      .catch(() => setLegacy([]));

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

  if (!noteInk.hasPage) {
    return (
      <RibbonGroup label={t("ink.tab.handwriting")} priority={70} icon={PenLine}>
        <RibbonButton
          icon={noteInk.starting ? Loader2 : PenLine}
          spinning={noteInk.starting}
          label={t("ink.tab.startInking")}
          hint={t("ink.tab.startInkingHint")}
          onClick={noteInk.onStart}
          keepFocus={false}
          showLabel
          style={{ gridRow: "span 2" }}
          className="h-[54px] flex-col gap-0.5 px-3"
        />
        {attach}
      </RibbonGroup>
    );
  }

  const statusText =
    noteInk.status === "saving" ? t("ink.tab.saving") : noteInk.status === "saved" ? t("ink.tab.saved") : t("ink.tab.autosave");

  return (
    <>
      {noteInk.ink && (
        <CanvasDrawTab
          ink={noteInk.ink}
          onAutoStart={handleAutoStart}
          afterDraw={<CanvasFramesTab ink={noteInk.ink} />}
        />
      )}
      <RibbonGroup label={t("ink.tab.handwritingPage")} priority={50} icon={BookOpen}>
        <div
          className="flex flex-col justify-center px-1 font-mono text-[10px] leading-snug text-muted-foreground"
          style={{ gridRow: "span 2", minWidth: "max-content" }}
        >
          <span>{t("ink.tab.marks", { count: noteInk.markCount })}</span>
          <span>{statusText}</span>
        </div>
        {noteInk.overlayMode !== undefined && (
          <RibbonButton
            icon={Layers}
            label={noteInk.overlayMode ? t("ink.overlay.fullPage") : t("ink.overlay.inkOverText")}
            hint={noteInk.overlayMode ? t("ink.overlay.fullPageHint") : t("ink.overlay.inkOverTextHint")}
            active={Boolean(noteInk.overlayMode)}
            onClick={noteInk.onToggleOverlayMode}
            keepFocus={false}
          />
        )}
        {attach}
        <RibbonButton icon={Trash2} label={t("ink.tab.removeInk")} hint={t("ink.tab.removeInkHint")} onClick={noteInk.onRemove} keepFocus={false} />
      </RibbonGroup>
    </>
  );
}