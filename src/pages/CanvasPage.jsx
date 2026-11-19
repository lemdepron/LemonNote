import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Moon, Sun, Info, Plus, SlidersHorizontal, PenLine, MousePointer, Link as LinkIcon, Minus, Maximize2, RotateCcw, Layers, Square, Type, Image, FileText, Layout, Upload, FileText as FileTextIcon, Image as ImageIcon, MoreHorizontal } from "lucide-react";
import { db } from "@/api/localDb";
import CanvasBoard from "@/components/canvas/CanvasBoard";
import EdgeDock from "@/components/shell/EdgeDock";
import { useFocusMode } from "@/lib/focusMode";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { OBJECT_TYPES, FRAME_TYPES, createObject, getDefaultSize } from "@/lib/canvas/objects";
import { exportCanvasDoc, triggerImport, exportCanvasToPdf, exportCanvasToPng } from "@/lib/canvas/export";
import { toast } from "@/lib/toast";
import RibbonButton from "@/components/ribbon/RibbonButton";
import { RibbonSelect, RibbonMenu, MenuItem, MenuLabel } from "@/components/ribbon/RibbonKit";
import SpaceRail from "@/components/shell/SpaceRail";
import CommandPalette from "@/components/shell/CommandPalette";
import { NoteTopStack } from "@/lib/ScrollContext";
import { t } from "@/lib/i18n";

// Local t function that prefixes with vault.canvas
const ct = (key, params) => t(`vault.canvas.${key}`, params);

const PEN_COLORS = [
  { value: "#000000", label: "Black" },
  { value: "#e5b567", label: "Amber" },
  { value: "#f87171", label: "Red" },
  { value: "#4ade80", label: "Green" },
  { value: "#60a5fa", label: "Blue" },
  { value: "#a78bfa", label: "Purple" },
  { value: "#ffffff", label: "White" },
];

const PEN_WIDTHS = [1, 2, 3, 4, 6, 8, 12];

export default function CanvasPage() {
  const { t, localDigits } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const { focus } = useFocusMode();
  const [canvasDoc, setCanvasDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [pendingConnectorFrom, setPendingConnectorFrom] = useState(null);
  const [status, setStatus] = useState("idle");
  const [tool, setTool] = useState({ mode: "select", color: "#000000", width: 3 });
  const [paper, setPaper] = useState({ template: "grid", size: "infinite", tone: "dark" });
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const dirty = useRef(false);
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
    if (!engineRef.current) return;
    
    const frames = canvasDoc.objects?.filter((o) => o.type === OBJECT_TYPES.FRAME) || [];
    if (frames.length === 0) return;
    
    const cam = canvasDoc.camera || { x: 0, y: 0, scale: 1 };
    if (cam.x === 0 && cam.y === 0 && cam.scale === 1) {
      setTimeout(() => {
        engineRef.current?.fitWidth?.();
        fittedRef.current = true;
      }, 100);
    } else {
      fittedRef.current = true;
    }
  }, [canvasDoc]);

  // Ctrl+K palette
  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close popovers on outside click
  useEffect(() => {
    const onClick = (event) => {
      if (fileMenuOpen && !event.target.closest('[data-file-menu]')) {
        setFileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [fileMenuOpen]);

  // Save canvas doc
  const saveCanvasDoc = useCallback(async (updates) => {
    if (!canvasDoc) return;
    dirty.current = true;
    setStatus("saving");
    const updated = { ...canvasDoc, ...updates };
    setCanvasDoc(updated);
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
    if (mode === "addCard" || mode === "addConnector") {
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

  const strokes = canvasDoc?.strokes || [];
  const objects = canvasDoc?.objects || [];
  const selectedObjects = objects.filter((o) => selectedIds.includes(o.id));
  const cards = objects.filter((o) => o.type === OBJECT_TYPES.CARD);
  const connectors = objects.filter((o) => o.type === OBJECT_TYPES.CONNECTOR);

  // Stats for status bar
  const markCount = strokes.length;
  const markLabel = markCount === 1 
    ? ct("status.marks", { count: localDigits(markCount) }) 
    : ct("status.marks_plural", { count: localDigits(markCount) });

  // Tool groups for compact bar row 2
  const isPenActive = tool.mode === "draw";
  const isEraserActive = tool.mode === "erase";
  const isShapeActive = tool.mode === "shape";
  const showPenControls = isPenActive || isEraserActive || isShapeActive;

  // Row 2 button groups
  const row2Groups = useMemo(() => [
    // Navigation group
    {
      separator: false,
      buttons: [
        { id: "select", icon: MousePointer, mode: "select", label: ct("home.select.select"), hint: ct("home.select.selectHint") },
        { id: "pan", icon: Maximize2, mode: "pan", label: ct("home.select.pan"), hint: ct("home.select.panHint") },
      ]
    },
    // Drawing tools group
    {
      separator: true,
      buttons: [
        { id: "draw", icon: PenLine, mode: "draw", label: ct("draw.tools.pen"), hint: ct("draw.tools.penHint") },
        { id: "erase", icon: Minus, mode: "erase", label: ct("draw.tools.eraser"), hint: ct("draw.tools.eraserHint") },
        { id: "lasso", icon: Square, mode: "lasso", label: ct("draw.tools.lasso"), hint: ct("draw.tools.lassoHint") },
        { id: "shape", icon: Type, mode: "shape", label: ct("draw.tools.shape"), hint: ct("draw.tools.shapeHint") },
        { id: "shapeRecognition", icon: Type, mode: "shapeRecognition", toggle: true, label: ct("draw.tools.shapeRecognition"), hint: ct("draw.tools.shapeRecognitionHint") },
      ]
    },
    // Insert objects group
    {
      separator: true,
      buttons: [
        { id: "addCard", icon: Plus, action: "addCard", label: ct("insert.cards.addCard"), hint: ct("insert.cards.addCardHint") },
        { id: "addConnector", icon: LinkIcon, mode: "addConnector", label: ct("insert.cards.connect"), hint: ct("insert.cards.connectHint"), disabled: !pendingConnectorFrom && selectedIds.length === 0 },
        { id: "addTextBox", icon: Type, action: "addTextBox", label: ct("insert.textNotes.textBox"), hint: ct("insert.textNotes.textBoxHint") },
        { id: "addSticky", icon: FileText, action: "addSticky", label: ct("insert.textNotes.stickyNote"), hint: ct("insert.textNotes.stickyNoteHint") },
        { id: "addShapeMenu", icon: Square, action: "addShapeMenu", label: ct("insert.objects.shapes"), hint: ct("insert.objects.shapesHint") },
        { id: "addSticker", icon: Image, action: "addSticker", label: ct("insert.media.sticker"), hint: ct("insert.media.stickerHint") },
        { id: "addImage", icon: Image, action: "addImage", label: ct("insert.media.image"), hint: ct("insert.media.imageHint") },
      ]
    },
    // Page/Frame group
    {
      separator: true,
      buttons: [
        { id: "addFrameMenu", icon: Layout, action: "addFrameMenu", label: ct("page.frames.addFrame"), hint: ct("page.frames.addFrameHint") },
        { id: "paperMenu", icon: Layers, action: "paperMenu", label: ct("page.paper.label"), hint: ct("page.paper.label") },
      ]
    },
    // Arrange group
    {
      separator: true,
      buttons: [
        { id: "bringForward", icon: ArrowLeft, action: "bringForward", label: ct("home.arrange.bringForward"), hint: ct("home.arrange.bringForwardHint"), disabled: true, disabledReason: ct("home.arrange.notImplemented") },
        { id: "sendBackward", icon: ArrowLeft, action: "sendBackward", label: ct("home.arrange.sendBackward"), hint: ct("home.arrange.sendBackwardHint"), disabled: true, disabledReason: ct("home.arrange.notImplemented"), className: "transform rotate-180" },
        { id: "delete", icon: Minus, action: "delete", label: ct("home.clipboard.delete"), hint: ct("home.clipboard.deleteHint"), disabled: selectedIds.length === 0 },
      ]
    },
  ], [tool.mode, tool.shapeRecognition, pendingConnectorFrom, selectedIds.length]);

  if (loading) {
    return (
      <div className="nb-shell min-h-screen">
        <SpaceRail />
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        <main className={cn("mx-auto px-4 pb-10 pt-5 sm:px-6", focus && "pr-12")}>
          <div className="h-[60vh] animate-pulse rounded-xl border border-border/60 bg-card/30" />
        </main>
      </div>
    );
  }

  if (!canvasDoc) {
    return (
      <div className="nb-shell min-h-screen">
        <SpaceRail />
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        <main className={cn("mx-auto px-4 pb-10 pt-5 sm:px-6", focus && "pr-12")}>
          <div className="mx-auto max-w-xl px-5 py-24 text-center">
            <p className="font-display text-[26px]">{ct("emptyState.noCanvases")}</p>
            <button
              onClick={() => navigate("/canvas/new")}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-primary-foreground transition hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              {ct("emptyState.newCanvas")}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="nb-shell min-h-screen">
      <SpaceRail />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <main className={cn("mx-auto px-4 pb-10 pt-5 sm:px-6", focus && "pr-12")}>
        {/* Compact toolbar - two rows inside NoteTopStack for sticky behavior */}
        <NoteTopStack>
          <div data-crumb data-testid="canvas-toolbar-area">
            {/* Row 1: Back, name, status, actions */}
            <div className="flex items-center gap-2 h-9 px-2 border-b border-border/40">
              <Link
                to="/canvas"
                className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition hover:text-foreground shrink-0"
                aria-label={t("vault.canvas.backToCanvases")}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("vault.canvas.backToCanvases")}
              </Link>
              <span className="text-[11px] text-muted-foreground/40 shrink-0">/</span>

              {/* Editable canvas name - width fits content */}
              <input
                value={canvasDoc.name}
                onChange={(event) => saveCanvasDoc({ name: event.target.value })}
                aria-label={t("vault.canvas.canvasName")}
                className="max-w-[28ch] min-w-[8ch] rounded-md border border-transparent bg-transparent px-1 py-0.5 font-display text-[16px] tracking-tight text-foreground outline-none transition hover:border-border/60 focus:border-primary/40"
                style={{ width: `${Math.min(Math.max(canvasDoc.name.length, 8), 28)}ch` }}
              />

              {/* Status */}
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground shrink-0">
                {t(`vault.canvas.status.${status}`)}
              </span>

              <div className="flex-1" />

              {/* Undo/Redo */}
              <RibbonButton
                id="undo"
                icon={RotateCcw}
                label={t("ribbon.home.undo")}
                hint={t("ribbon.home.undoHint")}
                disabled
                disabledReason={ct("home.undoDisabled") || "Undo not available yet"}
                keepFocus={false}
                className="h-8 w-8"
              />
              <RibbonButton
                id="redo"
                icon={RotateCcw}
                label={t("ribbon.home.redo")}
                hint={t("ribbon.home.redoHint")}
                disabled
                disabledReason={ct("home.redoDisabled") || "Redo not available yet"}
                keepFocus={false}
                className="h-8 w-8 transform rotate-180"
              />

              {/* Zoom controls */}
              <div className="flex items-center gap-1 border-l border-border/40 pl-2 ml-2">
                <RibbonButton
                  icon={Minus}
                  label={ct("view.zoomOut")}
                  hint={ct("view.zoomOutHint")}
                  onClick={() => engineRef.current?.zoomBy?.(0.88)}
                  keepFocus={false}
                  className="h-8 w-8"
                />
                <span className="self-center font-mono text-[10px] text-muted-foreground px-1 min-w-[3.5ch] text-center">
                  {ct("view.zoomPercent", { percent: Math.round(camera.scale * 100) })}
                </span>
                <RibbonButton
                  icon={Plus}
                  label={ct("view.zoomIn")}
                  hint={ct("view.zoomInHint")}
                  onClick={() => engineRef.current?.zoomBy?.(1.12)}
                  keepFocus={false}
                  className="h-8 w-8"
                />
                <RibbonButton
                  icon={Maximize2}
                  label={ct("view.fitWidth")}
                  hint={ct("view.fitWidthHint")}
                  onClick={() => engineRef.current?.fitWidth?.()}
                  keepFocus={false}
                  className="h-8 w-8"
                />
              </div>

              {/* Theme toggle */}
              <button
                type="button"
                onClick={() => {
                  const root = document.documentElement;
                  const isDark = root.classList.contains("dark");
                  root.classList.toggle("dark", !isDark);
                  root.classList.toggle("light", isDark);
                  localStorage.setItem("themeMode", isDark ? "light" : "dark");
                }}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground ml-2"
                aria-label={t("settings.appearance.switchToLight") || "Switch theme"}
                title={t("settings.appearance.switchToLight") || "Switch theme"}
              >
                {document.documentElement.classList.contains("dark") ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* File menu */}
              <div className="relative" data-file-menu>
                <RibbonButton
                  icon={MoreHorizontal}
                  label={ct("file.label")}
                  hint={ct("file.label")}
                  onClick={() => setFileMenuOpen(!fileMenuOpen)}
                  keepFocus={false}
                  className="h-8 w-8"
                />
                {fileMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-md border border-border bg-popover p-1 shadow-lg">
                    <MenuItem onClick={() => { exportCanvasDoc(canvasDoc); setFileMenuOpen(false); }}>
                      <FileTextIcon className="h-4 w-4 mr-2" />
                      {ct("file.exportCanvas")}
                    </MenuItem>
                    <hr className="my-1 border-border" />
                    <MenuLabel>{ct("file.exportPdf")}</MenuLabel>
                    <MenuItem onClick={() => { exportCanvasToPdf(canvasDoc, { wholeCanvas: true }); setFileMenuOpen(false); }}>
                      <FileTextIcon className="h-4 w-4 mr-2" />
                      {ct("file.exportWholeCanvas")} (PDF)
                    </MenuItem>
                    <MenuItem onClick={() => {
                      const frames = canvasDoc.objects?.filter(o => o.type === "frame") || [];
                      if (frames.length === 1) {
                        exportCanvasToPdf(canvasDoc, { wholeCanvas: false, selectedFrameId: frames[0].id });
                      } else if (frames.length > 1) {
                        toast.info(t("vault.canvas.selectFrameFirst") || "Select a frame first");
                      } else {
                        exportCanvasToPdf(canvasDoc, { wholeCanvas: true });
                      }
                      setFileMenuOpen(false);
                    }}>
                      <FileTextIcon className="h-4 w-4 mr-2" />
                      {ct("file.exportSelectedFrame")} (PDF)
                    </MenuItem>
                    <hr className="my-1 border-border" />
                    <MenuLabel>{ct("file.exportPng")}</MenuLabel>
                    <MenuItem onClick={() => { exportCanvasToPng(canvasDoc, { wholeCanvas: true }); setFileMenuOpen(false); }}>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      {ct("file.exportWholeCanvas")} (PNG)
                    </MenuItem>
                    <MenuItem onClick={() => {
                      const frames = canvasDoc.objects?.filter(o => o.type === "frame") || [];
                      if (frames.length === 1) {
                        exportCanvasToPng(canvasDoc, { wholeCanvas: false, selectedFrameId: frames[0].id });
                      } else if (frames.length > 1) {
                        toast.info(t("vault.canvas.selectFrameFirst") || "Select a frame first");
                      } else {
                        exportCanvasToPng(canvasDoc, { wholeCanvas: true });
                      }
                      setFileMenuOpen(false);
                    }}>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      {ct("file.exportSelectedFrame")} (PNG)
                    </MenuItem>
                    <hr className="my-1 border-border" />
                    <MenuItem onClick={() => { triggerImport(
                      (doc) => { navigate(`/canvas/${doc.id}`); toast.success(t("vault.canvas.importSuccess") || "Canvas imported successfully"); },
                      (error) => toast.error(error.message)
                    ); setFileMenuOpen(false); }}>
                      <Upload className="h-4 w-4 mr-2" />
                      {ct("file.importCanvas")}
                    </MenuItem>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Icon-only tool groups */}
            <div className="flex items-center gap-1 h-10 px-2 overflow-x-auto pb-1 border-b border-border/40" role="toolbar" aria-label={ct("toolbar.label") || "Canvas tools"}>
              {row2Groups.map((group, groupIdx) => (
                <React.Fragment key={groupIdx}>
                  {group.separator && <div className="w-px h-6 bg-border/40 mx-1" />}
                  <div className="flex items-center gap-0.5">
                    {group.buttons.map((btn) => (
                      <React.Fragment key={btn.id}>
                        {btn.action === "addShapeMenu" && (
                          <RibbonMenu
                            icon={Square}
                            label={btn.label}
                            hint={btn.hint}
                            width={200}
                          >
                            {(close) => (
                              <>
                                <MenuLabel>{ct("insert.objects.shapes")}</MenuLabel>
                                <MenuItem onClick={() => { handleAddDesignObject(OBJECT_TYPES.SHAPE, 0, 0, { shapeType: "rect" }); close(); }}>
                                  <Square className="h-4 w-4 mr-2" />
                                  {ct("insert.objects.rectangle")}
                                </MenuItem>
                                <MenuItem onClick={() => { handleAddDesignObject(OBJECT_TYPES.SHAPE, 0, 0, { shapeType: "ellipse" }); close(); }}>
                                  <Type className="h-4 w-4 mr-2" />
                                  {ct("insert.objects.ellipse")}
                                </MenuItem>
                                <MenuItem onClick={() => { handleAddDesignObject(OBJECT_TYPES.SHAPE, 0, 0, { shapeType: "line" }); close(); }}>
                                  <Minus className="h-4 w-4 mr-2" />
                                  {ct("insert.objects.line")}
                                </MenuItem>
                                <MenuItem onClick={() => { handleAddDesignObject(OBJECT_TYPES.SHAPE, 0, 0, { shapeType: "arrow" }); close(); }}>
                                  <LinkIcon className="h-4 w-4 mr-2" />
                                  {ct("insert.objects.arrow")}
                                </MenuItem>
                                <MenuItem onClick={() => { handleAddDesignObject(OBJECT_TYPES.SHAPE, 0, 0, { shapeType: "triangle" }); close(); }}>
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  {ct("insert.objects.triangle")}
                                </MenuItem>
                                <MenuItem onClick={() => { handleAddDesignObject(OBJECT_TYPES.SHAPE, 0, 0, { shapeType: "polygon" }); close(); }}>
                                  <Layers className="h-4 w-4 mr-2" />
                                  {ct("insert.objects.polygon")}
                                </MenuItem>
                              </>
                            )}
                          </RibbonMenu>
                        )}
                        {btn.action === "addFrameMenu" && (
                          <RibbonMenu
                            icon={Layout}
                            label={btn.label}
                            hint={btn.hint}
                            width={200}
                          >
                            {(close) => (
                              <>
                                <MenuLabel>{ct("page.frames.addFrame")}</MenuLabel>
                                {FRAME_TYPES.map((ft) => (
                                  <MenuItem
                                    key={ft.id}
                                    onClick={() => {
                                      if (engineRef.current) {
                                        const viewport = engineRef.current.viewport || { w: 800, h: 600 };
                                        const camera = engineRef.current.camera || { x: 0, y: 0, scale: 1 };
                                        const centerX = -camera.x / camera.scale + viewport.w / (2 * camera.scale);
                                        const centerY = -camera.y / camera.scale + viewport.h / (2 * camera.scale);
                                        handleAddDesignObject(OBJECT_TYPES.FRAME, centerX, centerY, { frameType: ft.id });
                                      }
                                      close();
                                    }}
                                  >
                                    {t(`vault.canvas.frameTypes.${ft.id}`) || ft.label}
                                  </MenuItem>
                                ))}
                              </>
                            )}
                          </RibbonMenu>
                        )}
                        {btn.action === "paperMenu" && (
                          <RibbonMenu
                            icon={Layers}
                            label={btn.label}
                            hint={btn.hint}
                            width={200}
                          >
                            {(close) => (
                              <>
                                <MenuLabel>{ct("page.paper.label")}</MenuLabel>
                                <hr className="my-1 border-border" />
                                <MenuLabel>{ct("page.paper.templateHint")}</MenuLabel>
                                {[
                                  { value: "blank", label: ct("page.paper.blank") },
                                  { value: "ruled", label: ct("page.paper.ruled") },
                                  { value: "grid", label: ct("page.paper.grid") },
                                  { value: "dots", label: ct("page.paper.dots") },
                                  { value: "stave", label: ct("page.paper.stave") },
                                  { value: "iso", label: ct("page.paper.iso") },
                                ].map((opt) => (
                                  <MenuItem
                                    key={opt.value}
                                    onClick={() => { handlePaperChange({ template: opt.value }); close(); }}
                                  >
                                    {opt.label}
                                  </MenuItem>
                                ))}
                                <hr className="my-1 border-border" />
                                <MenuLabel>{ct("page.paper.sizeHint")}</MenuLabel>
                                {[
                                  { value: "infinite", label: ct("page.paper.infinite") },
                                  { value: "a4", label: "A4" },
                                  { value: "letter", label: "Letter" },
                                  { value: "3:4", label: "3:4" },
                                  { value: "16:9", label: "16:9" },
                                  { value: "free", label: ct("page.paper.free") },
                                ].map((opt) => (
                                  <MenuItem
                                    key={opt.value}
                                    onClick={() => { handlePaperChange({ size: opt.value }); close(); }}
                                  >
                                    {opt.label}
                                  </MenuItem>
                                ))}
                                <hr className="my-1 border-border" />
                                <MenuLabel>{ct("page.paper.toneHint")}</MenuLabel>
                                {[
                                  { value: "dark", label: ct("page.paper.dark") },
                                  { value: "light", label: ct("page.paper.light") },
                                ].map((opt) => (
                                  <MenuItem
                                    key={opt.value}
                                    onClick={() => { handlePaperChange({ tone: opt.value }); close(); }}
                                  >
                                    {opt.label}
                                  </MenuItem>
                                ))}
                              </>
                            )}
                          </RibbonMenu>
                        )}
                        {btn.action === "addCard" && (
                          <RibbonButton
                            icon={btn.icon}
                            label={btn.label}
                            hint={btn.hint}
                            onClick={() => {
                              if (engineRef.current) {
                                const viewport = engineRef.current.viewport || { w: 800, h: 600 };
                                const camera = engineRef.current.camera || { x: 0, y: 0, scale: 1 };
                                const centerX = -camera.x / camera.scale + viewport.w / (2 * camera.scale);
                                const centerY = -camera.y / camera.scale + viewport.h / (2 * camera.scale);
                                handleAddCard(centerX, centerY);
                              }
                            }}
                            keepFocus={false}
                            className="h-8 w-8"
                          />
                        )}
                        {btn.action === "addTextBox" && (
                          <RibbonButton
                            icon={btn.icon}
                            label={btn.label}
                            hint={btn.hint}
                            onClick={() => {
                              if (engineRef.current) {
                                const viewport = engineRef.current.viewport || { w: 800, h: 600 };
                                const camera = engineRef.current.camera || { x: 0, y: 0, scale: 1 };
                                const centerX = -camera.x / camera.scale + viewport.w / (2 * camera.scale);
                                const centerY = -camera.y / camera.scale + viewport.h / (2 * camera.scale);
                                handleAddDesignObject(OBJECT_TYPES.TEXTBOX, centerX, centerY);
                              }
                            }}
                            keepFocus={false}
                            className="h-8 w-8"
                          />
                        )}
                        {btn.action === "addSticky" && (
                          <RibbonButton
                            icon={btn.icon}
                            label={btn.label}
                            hint={btn.hint}
                            onClick={() => {
                              if (engineRef.current) {
                                const viewport = engineRef.current.viewport || { w: 800, h: 600 };
                                const camera = engineRef.current.camera || { x: 0, y: 0, scale: 1 };
                                const centerX = -camera.x / camera.scale + viewport.w / (2 * camera.scale);
                                const centerY = -camera.y / camera.scale + viewport.h / (2 * camera.scale);
                                handleAddDesignObject(OBJECT_TYPES.STICKY, centerX, centerY);
                              }
                            }}
                            keepFocus={false}
                            className="h-8 w-8"
                          />
                        )}
                        {btn.action === "addSticker" && (
                          <RibbonButton
                            icon={btn.icon}
                            label={btn.label}
                            hint={btn.hint}
                            onClick={() => {
                              if (engineRef.current) {
                                const viewport = engineRef.current.viewport || { w: 800, h: 600 };
                                const camera = engineRef.current.camera || { x: 0, y: 0, scale: 1 };
                                const centerX = -camera.x / camera.scale + viewport.w / (2 * camera.scale);
                                const centerY = -camera.y / camera.scale + viewport.h / (2 * camera.scale);
                                handleAddDesignObject(OBJECT_TYPES.STICKER, centerX, centerY);
                              }
                            }}
                            keepFocus={false}
                            className="h-8 w-8"
                          />
                        )}
                        {btn.action === "addImage" && (
                          <RibbonButton
                            icon={btn.icon}
                            label={btn.label}
                            hint={btn.hint}
                            onClick={() => {
                              if (engineRef.current) {
                                const viewport = engineRef.current.viewport || { w: 800, h: 600 };
                                const camera = engineRef.current.camera || { x: 0, y: 0, scale: 1 };
                                const centerX = -camera.x / camera.scale + viewport.w / (2 * camera.scale);
                                const centerY = -camera.y / camera.scale + viewport.h / (2 * camera.scale);
                                handleAddDesignObject(OBJECT_TYPES.IMAGE, centerX, centerY);
                              }
                            }}
                            keepFocus={false}
                            className="h-8 w-8"
                          />
                        )}
                        {btn.action === "bringForward" && (
                          <RibbonButton
                            icon={btn.icon}
                            label={btn.label}
                            hint={btn.hint}
                            disabled={btn.disabled}
                            disabledReason={btn.disabledReason}
                            keepFocus={false}
                            className={`h-8 w-8 ${btn.className || ""}`}
                          />
                        )}
                        {btn.action === "sendBackward" && (
                          <RibbonButton
                            icon={btn.icon}
                            label={btn.label}
                            hint={btn.hint}
                            disabled={btn.disabled}
                            disabledReason={btn.disabledReason}
                            keepFocus={false}
                            className={`h-8 w-8 ${btn.className || ""}`}
                          />
                        )}
                        {btn.action === "delete" && (
                          <RibbonButton
                            icon={btn.icon}
                            label={btn.label}
                            hint={btn.hint}
                            disabled={btn.disabled}
                            onClick={() => { selectedIds.forEach((id) => handleDeleteObject(id)); }}
                            keepFocus={false}
                            className="h-8 w-8"
                          />
                        )}
                        {btn.mode && !btn.action && !btn.toggle && (
                          <RibbonButton
                            icon={btn.icon}
                            label={btn.label}
                            hint={btn.hint}
                            active={tool.mode === btn.mode}
                            disabled={btn.disabled}
                            onClick={() => selectTool(btn.mode)}
                            keepFocus={false}
                            className="h-8 w-8"
                          />
                        )}
                        {btn.mode === "addConnector" && (
                          <RibbonButton
                            icon={btn.icon}
                            label={btn.label}
                            hint={btn.hint}
                            active={tool.mode === "addConnector"}
                            disabled={btn.disabled}
                            onClick={() => selectTool("addConnector")}
                            keepFocus={false}
                            className="h-8 w-8"
                          />
                        )}
                        {btn.toggle && (
                          <RibbonButton
                            icon={btn.icon}
                            label={btn.label}
                            hint={btn.hint}
                            active={tool.shapeRecognition === true}
                            onClick={() => setTool((prev) => ({ ...prev, shapeRecognition: !prev.shapeRecognition }))}
                            keepFocus={false}
                            className="h-8 w-8"
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </React.Fragment>
              ))}

              {/* Pen controls (color + width) - shown when pen/eraser/shape active */}
              {showPenControls && (
                <React.Fragment>
                  <div className="w-px h-6 bg-border/40 mx-1" />
                  <div className="flex items-center gap-1">
                    {/* Color swatches */}
                    <div className="flex items-center gap-0.5" role="group" aria-label={ct("draw.penLook.color")}>
                      {PEN_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setTool((prev) => ({ ...prev, color: c.value }))}
                          className={`w-6 h-6 rounded border-2 transition ${tool.color === c.value ? "border-primary scale-110" : "border-transparent hover:border-border/40"}`}
                          style={{ backgroundColor: c.value }}
                          aria-label={c.label}
                          title={c.label}
                        />
                      ))}
                    </div>
                    <div className="w-px h-6 bg-border/40 mx-1" />
                    {/* Width control with preview */}
                    <div className="flex items-center gap-1" role="group" aria-label={ct("draw.penLook.width")}>
                      <span className="w-6 h-6 flex items-center justify-center">
                        <span
                          className="rounded-full bg-current"
                          style={{
                            width: `${Math.max(4, tool.width * 2)}px`,
                            height: `${Math.max(4, tool.width * 2)}px`,
                          }}
                        />
                      </span>
                      <RibbonSelect
                        value={String(tool.width || 3)}
                        onChange={(width) => setTool((prev) => ({ ...prev, width: Number(width) }))}
                        options={PEN_WIDTHS.map((w) => ({ value: String(w), label: String(w) }))}
                        className="w-16"
                      />
                    </div>
                  </div>
                </React.Fragment>
              )}
            </div>
          </div>
        </NoteTopStack>

        {/* Canvas area - fills remaining height, full width */}
        <div
          className={cn(
            "relative rounded-2xl border border-border/70 bg-[hsl(var(--paper-outside))] shadow-inner shadow-[hsl(var(--shadow)/0.4)]",
            "min-h-0 flex-1",
            focus ? "h-[calc(100vh-130px)]" : "h-[calc(100vh-80px)]"
          )}
        >
          <CanvasBoard
            ref={engineRef}
            className="h-full w-full"
            kind="design"
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
                return null;
              })()}
            </svg>
          )}

          {/* Stats overlay in bottom corner */}
          <div className="absolute bottom-2 right-2 flex items-center gap-2 text-[10px] text-muted-foreground font-mono bg-background/80 backdrop-blur px-2 py-1 rounded border border-border/40 pointer-events-none">
            <span>{t("vault.canvas.stats", { cards: localDigits(cards.length), connections: localDigits(connectors.length) })}</span>
            <span>{markLabel}</span>
            <span>{objects.length} objects</span>
          </div>
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
                    {strokes.length} {t("ink.tab.marks", { count: strokes.length }) || "strokes"} · {objects.length} objects
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
                <option key={ft.id} value={ft.id}>{t(`vault.canvas.frameTypes.${ft.id}`) || ft.label}</option>
              ))}
            </select>
          </div>
          {commonProps}
        </div>
      );
    case "textbox":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Text</label>
            <textarea value={object.text || ""} onChange={(e) => onChange(object.id, { text: e.target.value })} rows={3} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm resize-y" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Font Size</label>
            <input type="number" value={object.fontSize || 16} onChange={(e) => onChange(object.id, { fontSize: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Color</label>
            <input type="color" value={object.color || "#e9e2d0"} onChange={(e) => onChange(object.id, { color: e.target.value })} className="w-full h-8 px-2 py-1 rounded bg-background border border-border/60" />
          </div>
          {commonProps}
        </div>
      );
    case "sticky":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Text</label>
            <textarea value={object.text || ""} onChange={(e) => onChange(object.id, { text: e.target.value })} rows={3} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm resize-y" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Font Size</label>
            <input type="number" value={object.fontSize || 14} onChange={(e) => onChange(object.id, { fontSize: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Background</label>
            <input type="color" value={object.background || "#fef08a"} onChange={(e) => onChange(object.id, { background: e.target.value })} className="w-full h-8 px-2 py-1 rounded bg-background border border-border/60" />
          </div>
          {commonProps}
        </div>
      );
    case "text-frame":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Markdown</label>
            <textarea value={object.markdown || ""} onChange={(e) => onChange(object.id, { markdown: e.target.value })} rows={4} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm resize-y font-mono text-xs" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Font Size</label>
            <input type="number" value={object.fontSize || 16} onChange={(e) => onChange(object.id, { fontSize: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Color</label>
            <input type="color" value={object.color || "#e9e2d0"} onChange={(e) => onChange(object.id, { color: e.target.value })} className="w-full h-8 px-2 py-1 rounded bg-background border border-border/60" />
          </div>
          {commonProps}
        </div>
      );
    case "shape":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Shape Type</label>
            <select value={object.shapeType || "rect"} onChange={(e) => onChange(object.id, { shapeType: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm">
              <option value="rect">Rectangle</option>
              <option value="rounded-rect">Rounded Rectangle</option>
              <option value="ellipse">Ellipse</option>
              <option value="line">Line</option>
              <option value="arrow">Arrow</option>
              <option value="triangle">Triangle</option>
              <option value="star">Star</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Fill</label>
            <input type="color" value={object.fill || "none"} onChange={(e) => onChange(object.id, { fill: e.target.value })} className="w-full h-8 px-2 py-1 rounded bg-background border border-border/60" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Stroke</label>
            <input type="color" value={object.stroke || "#e9e2d0"} onChange={(e) => onChange(object.id, { stroke: e.target.value })} className="w-full h-8 px-2 py-1 rounded bg-background border border-border/60" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Stroke Width</label>
            <input type="number" value={object.strokeWidth || 2} onChange={(e) => onChange(object.id, { strokeWidth: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" />
          </div>
          {commonProps}
        </div>
      );
    case "sticker":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Sticker</label>
            <select value={object.stickerId || "star-1"} onChange={(e) => onChange(object.id, { stickerId: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm">
              <option value="star-1">Star</option>
              <option value="heart">Heart</option>
              <option value="smile">Smile</option>
              <option value="thumbs-up">Thumbs Up</option>
              <option value="lightning">Lightning</option>
              <option value="cloud">Cloud</option>
              <option value="sun">Sun</option>
              <option value="moon">Moon</option>
              <option value="flower">Flower</option>
              <option value="music">Music</option>
              <option value="camera">Camera</option>
              <option value="bookmark">Bookmark</option>
              <option value="flag">Flag</option>
              <option value="tag">Tag</option>
              <option value="paperclip">Paperclip</option>
              <option value="bell">Bell</option>
              <option value="gift">Gift</option>
              <option value="cake">Cake</option>
              <option value="rocket">Rocket</option>
              <option value="leaf">Leaf</option>
              <option value="fire">Fire</option>
              <option value="diamond">Diamond</option>
              <option value="sparkles">Sparkles</option>
              <option value="check">Check</option>
              <option value="star-outline">Star Outline</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Color</label>
            <input type="color" value={object.color || "#e9e2d0"} onChange={(e) => onChange(object.id, { color: e.target.value })} className="w-full h-8 px-2 py-1 rounded bg-background border border-border/60" />
          </div>
          {commonProps}
        </div>
      );
    case "image":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Source</label>
            <input value={object.src || ""} onChange={(e) => onChange(object.id, { src: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" placeholder="local:..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Alt Text</label>
            <input value={object.alt || ""} onChange={(e) => onChange(object.id, { alt: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" />
          </div>
          {commonProps}
        </div>
      );
    case "pdf-page":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">File ID</label>
            <input value={object.fileId || ""} onChange={(e) => onChange(object.id, { fileId: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" placeholder="local:..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Page Number</label>
            <input type="number" value={object.pageNumber || 1} onChange={(e) => onChange(object.id, { pageNumber: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" min="1" />
          </div>
          {commonProps}
        </div>
      );
    default:
      return commonProps;
  }
}