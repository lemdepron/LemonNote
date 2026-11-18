import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Info, Plus, SlidersHorizontal, PenLine, MousePointer, Link as LinkIcon, Minus, Maximize2, RotateCcw, Layers, Square, Type, Image, FileText, Layout, Box, Download, Upload, FileText as FileTextIcon, Image as ImageIcon } from "lucide-react";
import { db } from "@/api/localDb";
import VaultHeader from "@/components/vault/VaultHeader";
import CanvasBoard from "@/components/canvas/CanvasBoard";
import EdgeDock from "@/components/shell/EdgeDock";
import FocusToggle from "@/components/shell/FocusToggle";
import { useFocusMode } from "@/lib/focusMode";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n";
import { OBJECT_TYPES, FRAME_TYPES, createObject, getDefaultSize } from "@/lib/canvas/objects";
import { exportCanvasDoc, triggerImport, exportCanvasToPdf, exportCanvasToPng } from "@/lib/canvas/export";
import { toast } from "@/lib/toast";

const TOOL_GROUPS_INK = [
  {
    name: "draw",
    label: "Draw",
    icon: PenLine,
    tools: [
      { id: "draw", label: "Pen", icon: PenLine, hint: "Freehand drawing" },
      { id: "erase", label: "Erase", icon: Minus, hint: "Erase strokes" },
      { id: "lasso", label: "Lasso", icon: Square, hint: "Select strokes" },
      { id: "shape", label: "Shapes", icon: Type, hint: "Draw shapes" },
    ],
  },
  {
    name: "navigate",
    label: "Navigate",
    icon: MousePointer,
    tools: [
      { id: "select", label: "Select", icon: MousePointer, hint: "Select and move objects" },
      { id: "pan", label: "Pan", icon: Maximize2, hint: "Pan the canvas" },
      { id: "insertSpace", label: "Insert Space", icon: RotateCcw, hint: "Insert vertical space" },
    ],
  },
  {
    name: "objects",
    label: "Objects",
    icon: Layers,
    tools: [
      { id: "addSticker", label: "Sticker", icon: Image, hint: "Add a sticker" },
      { id: "addTextBox", label: "Text Box", icon: Type, hint: "Add a text box" },
      { id: "addSticky", label: "Sticky Note", icon: FileText, hint: "Add a sticky note" },
    ],
  },
];

const TOOL_GROUPS_CANVAS = [
  {
    name: "cards",
    label: "Cards",
    icon: Square,
    tools: [
      { id: "select", label: "Select", icon: MousePointer, hint: "Select and move cards" },
      { id: "addCard", label: "Add Card", icon: Plus, hint: "Add a new card" },
      { id: "addConnector", label: "Connect", icon: LinkIcon, hint: "Connect two cards" },
    ],
  },
  {
    name: "navigate",
    label: "Navigate",
    icon: MousePointer,
    tools: [
      { id: "pan", label: "Pan", icon: Maximize2, hint: "Pan the canvas" },
      { id: "insertSpace", label: "Insert Space", icon: RotateCcw, hint: "Insert vertical space" },
    ],
  },
  {
    name: "ink",
    label: "Ink",
    icon: PenLine,
    tools: [
      { id: "draw", label: "Draw", icon: PenLine, hint: "Freehand drawing" },
      { id: "erase", label: "Erase", icon: Minus, hint: "Erase strokes" },
      { id: "lasso", label: "Lasso", icon: Square, hint: "Select strokes" },
      { id: "shape", label: "Shapes", icon: Type, hint: "Draw shapes" },
    ],
  },
];

const TOOL_GROUPS_DESIGN = [
  {
    name: "frames",
    label: "Frames",
    icon: Layout,
    tools: [
      { id: "addFrame", label: "Add Frame", icon: Layout, hint: "Add a paper frame (A4, Letter, etc.)" },
      { id: "addTextFrame", label: "Text Frame", icon: Type, hint: "Add a markdown text frame" },
    ],
  },
  {
    name: "media",
    label: "Media",
    icon: Image,
    tools: [
      { id: "addImage", label: "Image", icon: Image, hint: "Add an image" },
      { id: "addPdfPage", label: "PDF Page", icon: FileText, hint: "Add a PDF page" },
    ],
  },
  {
    name: "objects",
    label: "Objects",
    icon: Box,
    tools: [
      { id: "addShape", label: "Shape", icon: Square, hint: "Add a shape" },
      { id: "addSticker", label: "Sticker", icon: Image, hint: "Add a sticker" },
      { id: "addTextBox", label: "Text Box", icon: Type, hint: "Add a text box" },
      { id: "addSticky", label: "Sticky Note", icon: FileText, hint: "Add a sticky note" },
    ],
  },
  {
    name: "navigate",
    label: "Navigate",
    icon: MousePointer,
    tools: [
      { id: "select", label: "Select", icon: MousePointer, hint: "Select and move objects" },
      { id: "pan", label: "Pan", icon: Maximize2, hint: "Pan the canvas" },
      { id: "insertSpace", label: "Insert Space", icon: RotateCcw, hint: "Insert vertical space" },
    ],
  },
  {
    name: "ink",
    label: "Ink",
    icon: PenLine,
    tools: [
      { id: "draw", label: "Draw", icon: PenLine, hint: "Freehand drawing" },
      { id: "erase", label: "Erase", icon: Minus, hint: "Erase strokes" },
      { id: "lasso", label: "Lasso", icon: Square, hint: "Select strokes" },
      { id: "shape", label: "Shapes", icon: Type, hint: "Draw shapes" },
    ],
  },
];

export default function CanvasPage() {
  const { t, localDigits } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const [canvasDoc, setCanvasDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [pendingConnectorFrom, setPendingConnectorFrom] = useState(null);
  const [status, setStatus] = useState("idle");
  const [tool, setTool] = useState({ mode: "select" });
  const [paper, setPaper] = useState({ template: "grid", size: "infinite", tone: "dark" });
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
  const dirty = useRef(false);
  const { focus } = useFocusMode();
  const engineRef = useRef(null);

  // Load canvas doc
  useEffect(() => {
    let active = true;
    setLoading(true);
    db.entities.CanvasDoc.get(id)
      .then((record) => {
        if (!active) return;
        setCanvasDoc(record);
        setPaper(record.paper || { template: "grid", size: "infinite", tone: "dark" });
        setCamera(record.camera || { x: 0, y: 0, scale: 1 });
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setCanvasDoc(null);
        setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  // Auto-fit to frame width on first load in design mode
  const fittedRef = useRef(false);
  useEffect(() => {
    if (fittedRef.current) return;
    if (!canvasDoc) return;
    if (canvasDoc.kind !== "design") return;
    if (!engineRef.current) return;
    
    const frames = canvasDoc.objects?.filter((o) => o.type === OBJECT_TYPES.FRAME) || [];
    if (frames.length === 0) return;
    
    // Check if camera is still at default (not yet fitted)
    const cam = canvasDoc.camera || { x: 0, y: 0, scale: 1 };
    if (cam.x === 0 && cam.y === 0 && cam.scale === 1) {
      // Small delay to ensure engine is ready
      setTimeout(() => {
        engineRef.current?.fitWidth?.();
        fittedRef.current = true;
      }, 100);
    } else {
      fittedRef.current = true;
    }
  }, [canvasDoc]);

  // Save canvas doc
  const saveCanvasDoc = useCallback(async (updates) => {
    if (!canvasDoc) return;
    dirty.current = true;
    setStatus("saving");
    const updated = { ...canvasDoc, ...updates };
    setCanvasDoc(updated);
    // Debounced save
    clearTimeout(saveCanvasDoc.timer);
    saveCanvasDoc.timer = setTimeout(async () => {
      try {
        await db.entities.CanvasDoc.update(id, updated);
        dirty.current = false;
        setStatus("saved");
      } catch (e) {
        setStatus("idle");
      }
    }, 650);
  }, [canvasDoc, id]);

  // Tool selection
  const selectTool = useCallback((mode) => {
    setTool((prev) => ({ ...prev, mode }));
    if (mode === "addCard") {
      setPendingConnectorFrom(null);
    }
  }, []);

  // Handle card creation
  const handleAddCard = useCallback((worldX, worldY) => {
    if (!canvasDoc) return;
    const size = getDefaultSize(OBJECT_TYPES.CARD);
    const newCard = createObject(OBJECT_TYPES.CARD, worldX - size.width / 2, worldY - size.height / 2, size.width, size.height);
    const updatedObjects = [...canvasDoc.objects, newCard];
    saveCanvasDoc({ objects: updatedObjects });
    setSelectedIds([newCard.id]);
    selectTool("select");
  }, [canvasDoc, saveCanvasDoc, selectTool]);

  // Handle design mode object creation (frames, media, objects)
  const handleAddDesignObject = useCallback((type, worldX, worldY, overrides = {}) => {
    if (!canvasDoc) return;
    const size = getDefaultSize(type, overrides.shapeType || overrides.frameType);
    const newObject = createObject(type, worldX - size.width / 2, worldY - size.height / 2, size.width, size.height, overrides);
    const updatedObjects = [...canvasDoc.objects, newObject];
    saveCanvasDoc({ objects: updatedObjects });
    setSelectedIds([newObject.id]);
    selectTool("select");
  }, [canvasDoc, saveCanvasDoc, selectTool]);

  // Handle connector creation
  const handleConnectorStart = useCallback((objectId) => {
    setPendingConnectorFrom(objectId);
  }, []);

  const handleConnectorEnd = useCallback((targetId) => {
    if (!pendingConnectorFrom || pendingConnectorFrom === targetId || !canvasDoc) {
      setPendingConnectorFrom(null);
      return;
    }
    // Check if connector already exists
    const exists = canvasDoc.objects.some(
      (obj) => obj.type === OBJECT_TYPES.CONNECTOR &&
        ((obj.from === pendingConnectorFrom && obj.to === targetId) || (obj.from === targetId && obj.to === pendingConnectorFrom))
    );
    if (!exists) {
      const newConnector = createObject(OBJECT_TYPES.CONNECTOR, 0, 0, 0, 0, {
        from: pendingConnectorFrom,
        to: targetId,
        style: "straight",
        stroke: "#e5b567",
        strokeWidth: 2,
        endArrow: true,
      });
      saveCanvasDoc({ objects: [...canvasDoc.objects, newConnector] });
    }
    setPendingConnectorFrom(null);
  }, [pendingConnectorFrom, canvasDoc, saveCanvasDoc]);

  // Object selection
  const handleSelectObject = useCallback((id, event) => {
    if (!id) {
      setSelectedIds([]);
      setPendingConnectorFrom(null);
      return;
    }
    const isMulti = event?.ctrlKey || event?.metaKey || event?.shiftKey;
    setSelectedIds((prev) => {
      if (isMulti) {
        return prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      }
      return prev.includes(id) ? prev : [id];
    });
    if (!isMulti) setPendingConnectorFrom(null);
  }, []);

  // Object update
  const handleUpdateObject = useCallback((objectId, changes) => {
    if (!canvasDoc) return;
    const updatedObjects = canvasDoc.objects.map((obj) =>
      obj.id === objectId ? { ...obj, ...changes } : obj
    );
    saveCanvasDoc({ objects: updatedObjects });
  }, [canvasDoc, saveCanvasDoc]);

  // Object delete
  const handleDeleteObject = useCallback((objectId) => {
    if (!canvasDoc) return;
    // Also delete any connectors connected to this object
    const updatedObjects = canvasDoc.objects.filter(
      (obj) => obj.id !== objectId && !(obj.type === OBJECT_TYPES.CONNECTOR && (obj.from === objectId || obj.to === objectId))
    );
    saveCanvasDoc({ objects: updatedObjects });
    setSelectedIds((prev) => prev.filter((id) => id !== objectId));
  }, [canvasDoc, saveCanvasDoc]);

  // Paper change
  const handlePaperChange = useCallback((changes) => {
    setPaper((prev) => ({ ...prev, ...changes }));
    saveCanvasDoc({ paper: { ...paper, ...changes } });
  }, [paper, saveCanvasDoc]);

  // Camera change
  const handleCameraChange = useCallback((newCamera) => {
    setCamera(newCamera);
    saveCanvasDoc({ camera: newCamera });
  }, [saveCanvasDoc]);

  // Stroke commit (from ink engine)
  const handleCommit = useCallback((strokes) => {
    if (!canvasDoc) return;
    saveCanvasDoc({ strokes: [...canvasDoc.strokes, ...strokes] });
  }, [canvasDoc, saveCanvasDoc]);

  // Stroke replace
  const handleReplace = useCallback((strokes) => {
    if (!canvasDoc) return;
    saveCanvasDoc({ strokes });
  }, [canvasDoc, saveCanvasDoc]);

  // Tool groups based on kind
  const currentKind = canvasDoc?.kind || "canvas";
  const toolGroups = useMemo(() => {
    switch (currentKind) {
      case "ink":
        return TOOL_GROUPS_INK;
      case "design":
        return TOOL_GROUPS_DESIGN;
      default:
        return TOOL_GROUPS_CANVAS;
    }
  }, [currentKind]);

  // Current mode display
  const currentMode = currentKind;

  if (loading) {
    return (
      <div className="nb-shell min-h-screen">
        <VaultHeader />
        <div className="mx-auto max-w-[1400px] px-5 py-8">
          <div className="h-[60vh] animate-pulse rounded-xl border border-border/60 bg-card/30" />
        </div>
      </div>
    );
  }

  if (!canvasDoc) {
    return (
      <div className="nb-shell min-h-screen">
        <VaultHeader />
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <p className="font-display text-[26px]">{t("vault.canvas.emptyState")}</p>
          <Link to="/canvas" className="mt-4 inline-block font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
            {t("vault.canvas.backToCanvases")}
          </Link>
        </div>
      </div>
    );
  }

  const strokes = canvasDoc.strokes || [];
  const objects = canvasDoc.objects || [];
  const selectedObjects = objects.filter((o) => selectedIds.includes(o.id));
  const cards = objects.filter((o) => o.type === OBJECT_TYPES.CARD);
  const connectors = objects.filter((o) => o.type === OBJECT_TYPES.CONNECTOR);

  // Build toolbar items
  const toolbarItems = toolGroups.flatMap((group) =>
    group.tools.map((t) => ({
      ...t,
      group: group.name,
      active: tool.mode === t.id,
      onClick: () => selectTool(t.id),
    }))
  );

  return (
    <div className="nb-shell min-h-screen">
      <VaultHeader />
      <main className={cn("mx-auto max-w-[1400px] px-4 pb-10 pt-5 sm:px-6", focus && "pr-12")}>
        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Link
            to="/canvas"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label={t("vault.canvas.backToCanvases")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <input
            value={canvasDoc.name}
            onChange={(event) => saveCanvasDoc({ name: event.target.value })}
            aria-label={t("vault.canvas.canvasName")}
            className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-1 font-display text-[22px] tracking-tight text-foreground outline-none transition hover:border-border/60 focus:border-primary/40"
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {t(`vault.canvas.status.${status}`)}
          </span>

          {/* Mode switcher */}
          <div className="flex items-center gap-1 rounded-lg bg-accent/50 p-1">
            <button
              type="button"
              onClick={() => saveCanvasDoc({ kind: "canvas" })}
              className={cn(
                "px-3 py-1.5 rounded-md text-[11px] font-medium transition",
                currentMode === "canvas"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t("vault.canvas.modeCanvas") || "Canvas"}
            </button>
            <button
              type="button"
              onClick={() => saveCanvasDoc({ kind: "ink" })}
              className={cn(
                "px-3 py-1.5 rounded-md text-[11px] font-medium transition",
                currentMode === "ink"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t("vault.canvas.modeInk") || "Ink"}
            </button>
            <button
              type="button"
              onClick={() => saveCanvasDoc({ kind: "design" })}
              className={cn(
                "px-3 py-1.5 rounded-md text-[11px] font-medium transition",
                currentMode === "design"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t("vault.canvas.modeDesign") || "Design"}
            </button>
          </div>

          <FocusToggle />
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap gap-1.5 p-2 rounded-lg border border-border/60 bg-card/50">
          {toolbarItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              disabled={item.id === "addConnector" && !pendingConnectorFrom && selectedIds.length === 0}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition",
                item.active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              title={item.hint}
              aria-pressed={item.active}
            >
              <item.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
          <Separator className="h-6 mx-1" />
          {/* Paper controls */}
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition">
                  <Square className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{paper.template}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel>{t("ink.paper.template") || "Template"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {["blank", "ruled", "grid", "dots", "stave", "iso"].map((tmpl) => (
                  <DropdownMenuItem
                    key={tmpl}
                    onSelect={() => handlePaperChange({ template: tmpl })}
                    className={paper.template === tmpl ? "bg-accent" : ""}
                  >
                    {tmpl}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition">
                  <Layers className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{paper.size}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel>{t("ink.paper.size") || "Page Size"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {["infinite", "a4", "letter", "3:4", "16:9", "free"].map((sz) => (
                  <DropdownMenuItem
                    key={sz}
                    onSelect={() => handlePaperChange({ size: sz })}
                    className={paper.size === sz ? "bg-accent" : ""}
                  >
                    {sz}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition">
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{paper.tone}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel>{t("ink.paper.tone") || "Tone"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {["dark", "light"].map((tone) => (
                  <DropdownMenuItem
                    key={tone}
                    onSelect={() => handlePaperChange({ tone })}
                    className={paper.tone === tone ? "bg-accent" : ""}
                  >
                    {tone}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Add Frame dropdown (design mode) */}
          {currentKind === "design" && (
            <div className="flex items-center gap-1 ml-2 border-l border-border/60 pl-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition" title={t("vault.canvas.addFrame") || "Add Frame"}>
                    <Layout className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t("vault.canvas.addFrame") || "Add Frame"}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>{t("vault.canvas.addFrame") || "Add Frame"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {FRAME_TYPES.map((ft) => (
                    <DropdownMenuItem
                      key={ft.id}
                      onSelect={() => {
                        // Use the engine to add a frame at the center of the viewport
                        if (engineRef.current) {
                          const viewport = engineRef.current.viewport || { w: 800, h: 600 };
                          const camera = engineRef.current.camera || { x: 0, y: 0, scale: 1 };
                          const centerX = -camera.x / camera.scale + viewport.w / (2 * camera.scale);
                          const centerY = -camera.y / camera.scale + viewport.h / (2 * camera.scale);
                          handleAddDesignObject(OBJECT_TYPES.FRAME, centerX, centerY, { frameType: ft.id });
                        }
                      }}
                    >
                      {ft.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* View actions: Fit to page, Fit to width, Zoom controls */}
          <div className="flex items-center gap-1 ml-2 border-l border-border/60 pl-2">
            <button
              type="button"
              onClick={() => engineRef.current?.fitView?.()}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition"
              title={t("vault.canvas.fitToPage") || "Fit to page"}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("vault.canvas.fitToPage") || "Fit page"}</span>
            </button>
            <button
              type="button"
              onClick={() => engineRef.current?.fitWidth?.()}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition"
              title={t("vault.canvas.fitToWidth") || "Fit to width"}
            >
              <Square className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("vault.canvas.fitToWidth") || "Fit width"}</span>
            </button>
            <Separator className="h-6 mx-1" />
            <button
              type="button"
              onClick={() => engineRef.current?.zoomBy?.(0.88)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition"
              title={t("vault.canvas.zoomOut") || "Zoom out"}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="px-1 font-mono text-[10px] text-muted-foreground">
              {camera ? Math.round(camera.scale * 100) : 100}%
            </span>
            <button
              type="button"
              onClick={() => engineRef.current?.zoomBy?.(1.12)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition"
              title={t("vault.canvas.zoomIn") || "Zoom in"}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => engineRef.current?.setCamera?.({ x: 0, y: 0, scale: 1 })}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition"
              title={t("vault.canvas.resetView") || "Reset view"}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Export/Import */}
          <div className="flex items-center gap-1 ml-2 border-l border-border/60 pl-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition"
                  title={t("vault.canvas.exportTooltip") || "Export as .lemoncanvas"}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t("vault.canvas.export") || "Export"}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t("vault.canvas.export") || "Export"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => exportCanvasDoc(canvasDoc)}
                >
                  <FileTextIcon className="h-3.5 w-3.5 mr-2" />
                  {t("vault.canvas.export") || "Export"} .lemoncanvas
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{t("vault.canvas.exportPdf") || "Export as PDF"}</DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={() => exportCanvasToPdf(canvasDoc, { wholeCanvas: true })}
                >
                  <FileTextIcon className="h-3.5 w-3.5 mr-2" />
                  {t("vault.canvas.exportWholeCanvas") || "Whole canvas"} (PDF)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    const frames = canvasDoc.objects?.filter(o => o.type === "frame") || [];
                    if (frames.length === 1) {
                      exportCanvasToPdf(canvasDoc, { wholeCanvas: false, selectedFrameId: frames[0].id });
                    } else if (frames.length > 1) {
                      // Show frame picker
                      toast.info(t("vault.canvas.selectFrameFirst") || "Select a frame first");
                    } else {
                      exportCanvasToPdf(canvasDoc, { wholeCanvas: true });
                    }
                  }}
                >
                  <FileTextIcon className="h-3.5 w-3.5 mr-2" />
                  {t("vault.canvas.exportSelectedFrame") || "Selected frame"} (PDF)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{t("vault.canvas.exportPng") || "Export as PNG"}</DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={() => exportCanvasToPng(canvasDoc, { wholeCanvas: true })}
                >
                  <ImageIcon className="h-3.5 w-3.5 mr-2" />
                  {t("vault.canvas.exportWholeCanvas") || "Whole canvas"} (PNG)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    const frames = canvasDoc.objects?.filter(o => o.type === "frame") || [];
                    if (frames.length === 1) {
                      exportCanvasToPng(canvasDoc, { wholeCanvas: false, selectedFrameId: frames[0].id });
                    } else if (frames.length > 1) {
                      toast.info(t("vault.canvas.selectFrameFirst") || "Select a frame first");
                    } else {
                      exportCanvasToPng(canvasDoc, { wholeCanvas: true });
                    }
                  }}
                >
                  <ImageIcon className="h-3.5 w-3.5 mr-2" />
                  {t("vault.canvas.exportSelectedFrame") || "Selected frame"} (PNG)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              type="button"
              onClick={() => triggerImport(
                (doc) => {
                  navigate(`/canvas/${doc.id}`);
                  toast.success(t("vault.canvas.importSuccess") || "Canvas imported successfully");
                },
                (error) => toast.error(error.message)
              )}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition"
              title={t("vault.canvas.importTooltip") || "Import .lemoncanvas file"}
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("vault.canvas.import") || "Import"}</span>
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div
          className={cn(
            "relative rounded-2xl border border-border/70 bg-[hsl(var(--paper-outside))] shadow-inner shadow-[hsl(var(--shadow)/0.4)]",
            focus ? "lg:h-[calc(100vh-300px)]" : "lg:h-[calc(100vh-250px)]"
          )}
        >
          <CanvasBoard
            ref={engineRef}
            kind={currentMode}
            strokes={strokes}
            objects={objects}
            paper={paper}
            tool={tool}
            initialCamera={camera}
            onCommit={handleCommit}
            onReplace={handleReplace}
            onCamera={handleCameraChange}
            onSelectObject={handleSelectObject}
            onUpdateObject={handleUpdateObject}
            onDeleteObject={handleDeleteObject}
            selectedObjectIds={selectedIds}
            pendingConnectorFrom={pendingConnectorFrom}
            setPendingConnectorFrom={setPendingConnectorFrom}
            autoFit
          />

          {/* Connector preview line */}
          {pendingConnectorFrom && tool.mode === "addConnector" && (
            <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#e5b567" />
                </marker>
              </defs>
              {(() => {
                const fromObj = objects.find((o) => o.id === pendingConnectorFrom);
                if (!fromObj) return null;
                const fromX = fromObj.x + fromObj.width / 2;
                const fromY = fromObj.y + fromObj.height / 2;
                // We can't easily get mouse position here without more refs, so skip preview for now
                return null;
              })()}
            </svg>
          )}
        </div>

        {/* Stats bar */}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground font-mono">
          <span>{t("vault.canvas.stats", { cards: localDigits(cards.length), connections: localDigits(connectors.length) })}</span>
          <span>{strokes.length} {t("ink.tab.marks", { count: strokes.length }) || "strokes"}</span>
          <span>{objects.length} objects</span>
        </div>

        {/* Edge dock panels */}
        <EdgeDock
          panels={[
            {
              id: "canvas-inspector",
              label: t("vault.canvas.cardInspector"),
              icon: SlidersHorizontal,
              content: (
                <div className="space-y-4 p-2">
                  {selectedObjects.length === 1 ? (
                    <ObjectInspector
                      object={selectedObjects[0]}
                      objects={objects}
                      onChange={handleUpdateObject}
                      onDelete={handleDeleteObject}
                      t={t}
                    />
                  ) : selectedObjects.length > 1 ? (
                    <p className="text-sm text-muted-foreground">{selectedObjects.length} objects selected</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("vault.canvas.selectObject") || "Select an object to edit"}</p>
                  )}
                </div>
              ),
            },
            {
              id: "canvas-guide",
              label: t("vault.canvas.canvasGuide"),
              icon: Info,
              content: (
                <div className="rounded-xl border border-border/60 bg-card/30 p-3.5 text-[12.5px] leading-relaxed text-muted-foreground">
                  <p>{t("vault.canvas.guideText1")}</p>
                  <p className="mt-2">{t("vault.canvas.guideText2")}</p>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70" dir="auto">
                    {t("vault.canvas.stats", { cards: localDigits(cards.length), connections: localDigits(connectors.length) })}
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70" dir="auto">
                    {strokes.length} strokes · {objects.length} objects
                  </p>
                </div>
              ),
            },
          ]}
        />
      </main>
    </div>
  );
}

// Simple inline object inspector
function ObjectInspector({ object, objects, onChange, onDelete, t }) {
  const commonProps = (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Position</label>
        <div className="flex gap-2">
          <input type="number" value={object.x} onChange={(e) => onChange(object.id, { x: Number(e.target.value) })} className="flex-1 px-2 py-1 rounded bg-background border border-border/60 text-sm" placeholder="X" />
          <input type="number" value={object.y} onChange={(e) => onChange(object.id, { y: Number(e.target.value) })} className="flex-1 px-2 py-1 rounded bg-background border border-border/60 text-sm" placeholder="Y" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Size</label>
        <div className="flex gap-2">
          <input type="number" value={object.width} onChange={(e) => onChange(object.id, { width: Number(e.target.value) })} className="flex-1 px-2 py-1 rounded bg-background border border-border/60 text-sm" placeholder="W" />
          <input type="number" value={object.height} onChange={(e) => onChange(object.id, { height: Number(e.target.value) })} className="flex-1 px-2 py-1 rounded bg-background border border-border/60 text-sm" placeholder="H" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Rotation</label>
        <input type="number" step="0.1" value={object.rotation || 0} onChange={(e) => onChange(object.id, { rotation: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onChange(object.id, { locked: !object.locked })} className="flex-1 px-2 py-1 rounded bg-accent text-accent-foreground text-xs hover:bg-accent/80">
          {object.locked ? "🔓 Unlock" : "🔒 Lock"}
        </button>
        <button onClick={() => onDelete(object.id)} className="flex-1 px-2 py-1 rounded bg-destructive/10 text-destructive text-xs hover:bg-destructive/20">
          🗑 Delete
        </button>
      </div>
    </div>
  );

  switch (object.type) {
    case "card":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
            <input value={object.title} onChange={(e) => onChange(object.id, { title: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Body</label>
            <textarea value={object.body} onChange={(e) => onChange(object.id, { body: e.target.value })} rows={3} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm resize-y" />
          </div>
          {commonProps}
        </div>
      );
    case "connector":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">From</label>
            <select value={object.from} onChange={(e) => onChange(object.id, { from: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm">
              {objects.filter(o => o.type !== "connector").map((o) => (
                <option key={o.id} value={o.id}>{o.title || o.type || o.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">To</label>
            <select value={object.to} onChange={(e) => onChange(object.id, { to: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm">
              {objects.filter(o => o.type !== "connector").map((o) => (
                <option key={o.id} value={o.id}>{o.title || o.type || o.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Style</label>
            <select value={object.style} onChange={(e) => onChange(object.id, { style: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm">
              <option value="straight">Straight</option>
              <option value="elbow">Elbow</option>
              <option value="curved">Curved</option>
            </select>
          </div>
          <div className="flex gap-2">
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={object.startArrow} onChange={(e) => onChange(object.id, { startArrow: e.target.checked })} />
              Start Arrow
            </label>
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={object.endArrow} onChange={(e) => onChange(object.id, { endArrow: e.target.checked })} />
              End Arrow
            </label>
          </div>
          {commonProps}
        </div>
      );
    case "frame":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
            <input value={object.name || ""} onChange={(e) => onChange(object.id, { name: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" placeholder="Page 1" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Frame Type</label>
            <select value={object.frameType} onChange={(e) => onChange(object.id, { frameType: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm">
              {FRAME_TYPES.map((ft) => (
                <option key={ft.id} value={ft.id}>{ft.label}</option>
              ))}
            </select>
          </div>
          {commonProps}
        </div>
      );
    case "text-frame":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Markdown</label>
            <textarea value={object.markdown} onChange={(e) => onChange(object.id, { markdown: e.target.value })} rows={4} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm font-mono resize-y" />
          </div>
          {commonProps}
        </div>
      );
    case "image":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Source</label>
            <input value={object.src} onChange={(e) => onChange(object.id, { src: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Alt Text</label>
            <input value={object.alt} onChange={(e) => onChange(object.id, { alt: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" />
          </div>
          {commonProps}
        </div>
      );
    case "pdf-page":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">File ID</label>
            <input value={object.fileId} onChange={(e) => onChange(object.id, { fileId: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Page Number</label>
            <input type="number" value={object.pageNumber} onChange={(e) => onChange(object.id, { pageNumber: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" />
          </div>
          {commonProps}
        </div>
      );
    default:
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Type: {object.type}</p>
          {commonProps}
        </div>
      );
  }
}