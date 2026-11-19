import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Moon, Sun, Info, Plus, SlidersHorizontal, PenLine, MousePointer, Link as LinkIcon, Minus, Maximize2, RotateCcw, Layers, Square, Type, Image, FileText, Layout, Download, Upload, FileText as FileTextIcon, Image as ImageIcon } from "lucide-react";
import { db } from "@/api/localDb";
import CanvasBoard from "@/components/canvas/CanvasBoard";
import EdgeDock from "@/components/shell/EdgeDock";
import { useFocusMode } from "@/lib/focusMode";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { OBJECT_TYPES, FRAME_TYPES, createObject, getDefaultSize } from "@/lib/canvas/objects";
import { exportCanvasDoc, triggerImport, exportCanvasToPdf, exportCanvasToPng } from "@/lib/canvas/export";
import { toast } from "@/lib/toast";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import RibbonButton from "@/components/ribbon/RibbonButton";
import { RibbonSelect, RibbonMenu, MenuItem, MenuLabel } from "@/components/ribbon/RibbonKit";
import { RibbonTabLine, RibbonPanel, RibbonPanelPopoverProvider } from "@/components/ribbon/RibbonKit";
import SpaceRail from "@/components/shell/SpaceRail";
import CommandPalette from "@/components/shell/CommandPalette";
import ThemeToggle from "@/components/shell/ThemeToggle";
import { readPref, writePref } from "@/lib/preferences";
import { NoteTopStack } from "@/lib/ScrollContext";
import { t } from "@/lib/i18n";

// Local t function that prefixes with vault.canvas
const ct = (key, params) => t(`vault.canvas.${key}`, params);

const CANVAS_TABS = [
  { id: "home", label: "tabs.home", icon: PenLine },
  { id: "draw", label: "tabs.draw", icon: PenLine },
  { id: "insert", label: "tabs.insert", icon: Plus },
  { id: "page", label: "tabs.page", icon: Layout },
  { id: "view", label: "tabs.view", icon: Maximize2 },
  { id: "file", label: "tabs.file", icon: Download },
];

function initialCanvasTab() {
  const saved = readPref("canvasRibbonTab", "home");
  return CANVAS_TABS.some((item) => item.id === saved) ? saved : "home";
}

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
  const [tool, setTool] = useState({ mode: "select" });
  const [paper, setPaper] = useState({ template: "grid", size: "infinite", tone: "dark" });
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => initialCanvasTab());
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

  // Tab change handler
  const chooseTab = (tabId) => {
    writePref("canvasRibbonTab", tabId);
    setActiveTab(tabId);
  };

  // Leading: Undo/Redo (disabled for now - engine doesn't support it)
  const leading = (
    <>
      <RibbonButton
        id="undo"
        icon={RotateCcw}
        label={t("ribbon.home.undo")}
        hint={t("ribbon.home.undoHint")}
        disabled
        disabledReason={ct("home.undoDisabled") || "Undo not available yet"}
        keepFocus={false}
      />
      <RibbonButton
        id="redo"
        icon={RotateCcw}
        label={t("ribbon.home.redo")}
        hint={t("ribbon.home.redoHint")}
        disabled
        disabledReason={ct("home.redoDisabled") || "Redo not available yet"}
        keepFocus={false}
        className="transform rotate-180"
      />
    </>
  );

  // Trailing: ThemeToggle + FocusToggle
  const trailing = (
    <>
      <ThemeToggle />
      {/* FocusToggle removed from CanvasPage per C19 */}
    </>
  );

  if (loading) {
    return (
      <div className="nb-shell min-h-screen">
        <SpaceRail />
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        <main className={cn("mx-auto max-w-[1400px] px-4 pb-10 pt-5 sm:px-6", focus && "pr-12")}>
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
        <main className={cn("mx-auto max-w-[1400px] px-4 pb-10 pt-5 sm:px-6", focus && "pr-12")}>
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

  // Stats for status bar
  const markCount = strokes.length;
  const markLabel = markCount === 1 
    ? ct("status.marks", { count: localDigits(markCount) }) 
    : ct("status.marks_plural", { count: localDigits(markCount) });

  return (
    <div className="nb-shell min-h-screen">
      <SpaceRail />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <main className={cn("mx-auto max-w-[1400px] px-4 pb-10 pt-5 sm:px-6", focus && "pr-12")}>
        {/* Top row: back, name, status, moon - INSIDE NoteTopStack for sticky behavior */}
        <NoteTopStack>
          <div data-crumb data-testid="canvas-breadcrumb-area">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Link
                to="/canvas"
                className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition hover:text-foreground"
                aria-label={t("vault.canvas.backToCanvases")}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("vault.canvas.backToCanvases")}
              </Link>
              <span className="text-[11px] text-muted-foreground/40">/</span>

              {/* Editable canvas name */}
              <input
                value={canvasDoc.name}
                onChange={(event) => saveCanvasDoc({ name: event.target.value })}
                aria-label={t("vault.canvas.canvasName")}
                className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-1 font-display text-[22px] tracking-tight text-foreground outline-none transition hover:border-border/60 focus:border-primary/40"
              />

              {/* Status */}
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {t(`canvas.status.${status}`)}
              </span>

              <div className="ml-auto flex items-center gap-1.5">
                {/* ThemeToggle - one click light/dark */}
                <button
                  type="button"
                  onClick={() => {
                    // Toggle theme via the same mechanism as ThemeToggle
                    const root = document.documentElement;
                    const isDark = root.classList.contains("dark");
                    root.classList.toggle("dark", !isDark);
                    root.classList.toggle("light", isDark);
                    localStorage.setItem("themeMode", isDark ? "light" : "dark");
                  }}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  aria-label={t("settings.appearance.switchToLight") || "Switch theme"}
                  title={t("settings.appearance.switchToLight") || "Switch theme"}
                >
                  {document.documentElement.classList.contains("dark") ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                {/* FocusToggle removed per C19 */}
              </div>
            </div>
          </div>

          {/* Ribbon tab line + panel - SAME as note page */}
          <RibbonPanelPopoverProvider>
            <RibbonTabLine
              tabs={CANVAS_TABS.map((item) => ({ ...item, label: t(item.label) }))}
              tab={activeTab}
              onTab={chooseTab}
              leading={leading}
              trailing={trailing}
              isFirstTabActive={activeTab === "home"}
            />
            <RibbonPanel isFirstTabActive={activeTab === "home"}>
              {/* HOME TAB */}
              {activeTab === "home" && (
                <>
                  {/* Select group */}
                  <RibbonGroup label={ct("home.select.label")} icon={MousePointer} priority={70}>
                    <RibbonButton
                      id="select"
                      icon={MousePointer}
                      label={ct("home.select.select")}
                      hint={ct("home.select.selectHint")}
                      active={tool.mode === "select"}
                      onClick={() => selectTool("select")}
                      keepFocus={false}
                    />
                    <RibbonButton
                      id="pan"
                      icon={Maximize2}
                      label={ct("home.select.pan")}
                      hint={ct("home.select.panHint")}
                      active={tool.mode === "pan"}
                      onClick={() => selectTool("pan")}
                      keepFocus={false}
                    />
                  </RibbonGroup>

                  {/* Clipboard group - only Delete exists */}
                  <RibbonGroup label={ct("home.clipboard.label")} icon={Square} priority={65}>
                    <RibbonButton
                      id="delete"
                      icon={Minus}
                      label={ct("home.clipboard.delete")}
                      hint={ct("home.clipboard.deleteHint")}
                      disabled={selectedIds.length === 0}
                      onClick={() => {
                        selectedIds.forEach((id) => handleDeleteObject(id));
                      }}
                      keepFocus={false}
                    />
                  </RibbonGroup>

                  {/* Arrange group - not implemented */}
                  <RibbonGroup label={ct("home.arrange.label")} icon={Layers} priority={60}>
                    <RibbonButton
                      id="bringForward"
                      icon={ArrowLeft}
                      label={ct("home.arrange.bringForward")}
                      hint={ct("home.arrange.bringForwardHint")}
                      disabled
                      disabledReason={ct("home.arrange.notImplemented") || "Not implemented yet"}
                      keepFocus={false}
                    />
                    <RibbonButton
                      id="sendBackward"
                      icon={ArrowLeft}
                      label={ct("home.arrange.sendBackward")}
                      hint={ct("home.arrange.sendBackwardHint")}
                      disabled
                      disabledReason={ct("home.arrange.notImplemented") || "Not implemented yet"}
                      keepFocus={false}
                      className="transform rotate-180"
                    />
                  </RibbonGroup>
                </>
              )}

              {/* DRAW TAB */}
              {activeTab === "draw" && (
                <>
                  {/* Tools group */}
                  <RibbonGroup label={ct("draw.tools.label")} icon={PenLine} priority={70}>
                    <RibbonButton
                      id="draw"
                      icon={PenLine}
                      label={ct("draw.tools.pen")}
                      hint={ct("draw.tools.penHint")}
                      active={tool.mode === "draw"}
                      onClick={() => selectTool("draw")}
                      keepFocus={false}
                    />
                    <RibbonButton
                      id="erase"
                      icon={Minus}
                      label={ct("draw.tools.eraser")}
                      hint={ct("draw.tools.eraserHint")}
                      active={tool.mode === "erase"}
                      onClick={() => selectTool("erase")}
                      keepFocus={false}
                    />
                    <RibbonButton
                      id="lasso"
                      icon={Square}
                      label={ct("draw.tools.lasso")}
                      hint={ct("draw.tools.lassoHint")}
                      active={tool.mode === "lasso"}
                      onClick={() => selectTool("lasso")}
                      keepFocus={false}
                    />
                    <RibbonButton
                      id="shape"
                      icon={Type}
                      label={ct("draw.tools.shape")}
                      hint={ct("draw.tools.shapeHint")}
                      active={tool.mode === "shape"}
                      onClick={() => selectTool("shape")}
                      keepFocus={false}
                    />
                    <RibbonButton
                      id="shapeRecognition"
                      icon={Type}
                      label={ct("draw.tools.shapeRecognition")}
                      hint={ct("draw.tools.shapeRecognitionHint")}
                      active={tool.shapeRecognition === true}
                      onClick={() => setTool((prev) => ({ ...prev, shapeRecognition: !prev.shapeRecognition }))}
                      keepFocus={false}
                    />
                  </RibbonGroup>

                  {/* Pen look group */}
                  <RibbonGroup label={ct("draw.penLook.label")} icon={PenLine} priority={65}>
                    <RibbonSelect
                      title={ct("draw.penLook.colorHint")}
                      value={tool.color || "#e9e2d0"}
                      onChange={(color) => setTool((prev) => ({ ...prev, color }))}
                      options={[
                        { value: "#e9e2d0", label: "Default" },
                        { value: "#000000", label: "Black" },
                        { value: "#ffffff", label: "White" },
                        { value: "#e5b567", label: "Amber" },
                        { value: "#f87171", label: "Red" },
                        { value: "#4ade80", label: "Green" },
                        { value: "#60a5fa", label: "Blue" },
                        { value: "#a78bfa", label: "Purple" },
                      ]}
                    />
                    <RibbonSelect
                      title={ct("draw.penLook.widthHint")}
                      value={String(tool.width || 3)}
                      onChange={(width) => setTool((prev) => ({ ...prev, width: Number(width) }))}
                      options={[
                        { value: "1", label: "1" },
                        { value: "2", label: "2" },
                        { value: "3", label: "3" },
                        { value: "4", label: "4" },
                        { value: "6", label: "6" },
                        { value: "8", label: "8" },
                        { value: "12", label: "12" },
                      ]}
                    />
                  </RibbonGroup>
                </>
              )}

              {/* INSERT TAB */}
              {activeTab === "insert" && (
                <>
                  {/* Cards group */}
                  <RibbonGroup label={ct("insert.cards.label")} icon={Square} priority={70}>
                    <RibbonButton
                      id="addCard"
                      icon={Plus}
                      label={ct("insert.cards.addCard")}
                      hint={ct("insert.cards.addCardHint")}
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
                    />
                    <RibbonButton
                      id="addConnector"
                      icon={LinkIcon}
                      label={ct("insert.cards.connect")}
                      hint={ct("insert.cards.connectHint")}
                      active={tool.mode === "addConnector"}
                      disabled={!pendingConnectorFrom && selectedIds.length === 0}
                      onClick={() => selectTool("addConnector")}
                      keepFocus={false}
                    />
                  </RibbonGroup>

                  {/* Text & Notes group */}
                  <RibbonGroup label={ct("insert.textNotes.label")} icon={FileText} priority={65}>
                    <RibbonButton
                      id="addTextBox"
                      icon={Type}
                      label={ct("insert.textNotes.textBox")}
                      hint={ct("insert.textNotes.textBoxHint")}
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
                    />
                    <RibbonButton
                      id="addSticky"
                      icon={FileText}
                      label={ct("insert.textNotes.stickyNote")}
                      hint={ct("insert.textNotes.stickyNoteHint")}
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
                    />
                  </RibbonGroup>

                  {/* Objects group */}
                  <RibbonGroup label={ct("insert.objects.label")} icon={Layers} priority={60}>
                    <RibbonMenu
                      icon={Square}
                      label={ct("insert.objects.shapes")}
                      hint={ct("insert.objects.shapesHint")}
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
                  </RibbonGroup>

                  {/* Media group */}
                  <RibbonGroup label={ct("insert.media.label")} icon={Image} priority={55}>
                    <RibbonButton
                      id="addSticker"
                      icon={Image}
                      label={ct("insert.media.sticker")}
                      hint={ct("insert.media.stickerHint")}
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
                    />
                    <RibbonButton
                      id="addImage"
                      icon={Image}
                      label={ct("insert.media.image")}
                      hint={ct("insert.media.imageHint")}
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
                    />
                  </RibbonGroup>
                </>
              )}

              {/* PAGE TAB */}
              {activeTab === "page" && (
                <>
                  {/* Frames group */}
                  <RibbonGroup label={ct("page.frames.label")} icon={Layout} priority={70}>
                    <RibbonMenu
                      icon={Layout}
                      label={ct("page.frames.addFrame")}
                      hint={ct("page.frames.addFrameHint")}
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
                  </RibbonGroup>

                  {/* Paper group */}
                  <RibbonGroup label={ct("page.paper.label")} icon={Layers} priority={65}>
                    <RibbonSelect
                      title={ct("page.paper.templateHint")}
                      value={paper.template || "grid"}
                      onChange={(template) => handlePaperChange({ template })}
                      options={[
                        { value: "blank", label: ct("page.paper.blank") },
                        { value: "ruled", label: ct("page.paper.ruled") },
                        { value: "grid", label: ct("page.paper.grid") },
                        { value: "dots", label: ct("page.paper.dots") },
                        { value: "stave", label: ct("page.paper.stave") },
                        { value: "iso", label: ct("page.paper.iso") },
                      ]}
                    />
                    <RibbonSelect
                      title={ct("page.paper.sizeHint")}
                      value={paper.size || "infinite"}
                      onChange={(size) => handlePaperChange({ size })}
                      options={[
                        { value: "infinite", label: ct("page.paper.infinite") },
                        { value: "a4", label: "A4" },
                        { value: "letter", label: "Letter" },
                        { value: "3:4", label: "3:4" },
                        { value: "16:9", label: "16:9" },
                        { value: "free", label: ct("page.paper.free") },
                      ]}
                    />
                    <RibbonSelect
                      title={ct("page.paper.toneHint")}
                      value={paper.tone || "dark"}
                      onChange={(tone) => handlePaperChange({ tone })}
                      options={[
                        { value: "dark", label: ct("page.paper.dark") },
                        { value: "light", label: ct("page.paper.light") },
                      ]}
                    />
                  </RibbonGroup>
                </>
              )}

              {/* VIEW TAB */}
              {activeTab === "view" && (
                <>
                  <RibbonGroup label={ct("view.label")} icon={Maximize2} priority={70}>
                    <RibbonButton
                      icon={Maximize2}
                      label={ct("view.fitPage")}
                      hint={ct("view.fitPageHint")}
                      onClick={() => engineRef.current?.fitView?.()}
                      keepFocus={false}
                    />
                    <RibbonButton
                      icon={Square}
                      label={ct("view.fitWidth")}
                      hint={ct("view.fitWidthHint")}
                      onClick={() => engineRef.current?.fitWidth?.()}
                      keepFocus={false}
                    />
                    <RibbonButton
                      icon={Minus}
                      label={ct("view.zoomOut")}
                      hint={ct("view.zoomOutHint")}
                      onClick={() => engineRef.current?.zoomBy?.(0.88)}
                      keepFocus={false}
                    />
                    <span className="self-center font-mono text-[10px] text-muted-foreground px-1">
                      {ct("view.zoomPercent", { percent: Math.round(camera.scale * 100) })}
                    </span>
                    <RibbonButton
                      icon={Plus}
                      label={ct("view.zoomIn")}
                      hint={ct("view.zoomInHint")}
                      onClick={() => engineRef.current?.zoomBy?.(1.12)}
                      keepFocus={false}
                    />
                    <RibbonButton
                      icon={RotateCcw}
                      label={ct("view.reset")}
                      hint={ct("view.resetHint")}
                      onClick={() => engineRef.current?.setCamera?.({ x: 0, y: 0, scale: 1 })}
                      keepFocus={false}
                    />
                  </RibbonGroup>
                </>
              )}

              {/* FILE TAB */}
              {activeTab === "file" && (
                <>
                  <RibbonGroup label={ct("file.label")} icon={Download} priority={70}>
                    <RibbonMenu
                      icon={Download}
                      label={ct("file.exportCanvas")}
                      hint={ct("file.exportCanvasHint")}
                      width={240}
                    >
                      {(close) => (
                        <>
                          <MenuLabel>{ct("file.exportCanvas")}</MenuLabel>
                          <MenuItem onClick={() => { exportCanvasDoc(canvasDoc); close(); }}>
                            <FileTextIcon className="h-4 w-4 mr-2" />
                            {ct("file.exportCanvas")}
                          </MenuItem>
                          <hr className="my-1 border-border" />
                          <MenuLabel>{ct("file.exportPdf")}</MenuLabel>
                          <MenuItem onClick={() => { exportCanvasToPdf(canvasDoc, { wholeCanvas: true }); close(); }}>
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
                            close();
                          }}>
                            <FileTextIcon className="h-4 w-4 mr-2" />
                            {ct("file.exportSelectedFrame")} (PDF)
                          </MenuItem>
                          <hr className="my-1 border-border" />
                          <MenuLabel>{ct("file.exportPng")}</MenuLabel>
                          <MenuItem onClick={() => { exportCanvasToPng(canvasDoc, { wholeCanvas: true }); close(); }}>
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
                            close();
                          }}>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            {ct("file.exportSelectedFrame")} (PNG)
                          </MenuItem>
                        </>
                      )}
                    </RibbonMenu>
                    <RibbonButton
                      icon={Upload}
                      label={ct("file.importCanvas")}
                      hint={ct("file.importCanvasHint")}
                      onClick={() => triggerImport(
                        (doc) => {
                          navigate(`/canvas/${doc.id}`);
                          toast.success(t("vault.canvas.importSuccess") || "Canvas imported successfully");
                        },
                        (error) => toast.error(error.message)
                      )}
                      keepFocus={false}
                    />
                  </RibbonGroup>
                </>
              )}
            </RibbonPanel>
          </RibbonPanelPopoverProvider>
        </NoteTopStack>

        {/* Canvas area - fills remaining height */}
        <div
          className={cn(
            "relative rounded-2xl border border-border/70 bg-[hsl(var(--paper-outside))] shadow-inner shadow-[hsl(var(--shadow)/0.4)]",
            "min-h-0 flex-1",
            focus ? "h-[calc(100vh-300px)]" : "h-[calc(100vh-250px)]"
          )}
        >
          <CanvasBoard
            ref={engineRef}
            className="h-full w-full"
            kind="canvas"
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
        </div>

        {/* Stats bar */}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground font-mono">
          <span>{t("vault.canvas.stats", { cards: localDigits(cards.length), connections: localDigits(connectors.length) })}</span>
          <span>{markLabel}</span>
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