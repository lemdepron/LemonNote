import { forwardRef, useEffect, useRef, useCallback, useMemo, useImperativeHandle, useState } from "react";
import InkEngine from "@/lib/canvas/engine";
import FloatingObjects from "@/components/ink/FloatingObjects";
import { useThemeRevision, tokenColor } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const CURSORS = {
  draw: "cursor-crosshair",
  shape: "cursor-crosshair",
  lasso: "cursor-crosshair",
  erase: "cursor-cell",
  pan: "cursor-grab active:cursor-grabbing",
  eyedropper: "cursor-copy",
  insertSpace: "cursor-ns-resize",
  select: "cursor-default",
  addCard: "cursor-crosshair",
  addConnector: "cursor-crosshair",
  addFrame: "cursor-crosshair",
  addTextFrame: "cursor-crosshair",
  addImage: "cursor-crosshair",
  addPdfPage: "cursor-crosshair",
  addShape: "cursor-crosshair",
  addSticker: "cursor-crosshair",
  addTextBox: "cursor-crosshair",
  addSticky: "cursor-crosshair",
};

// Tool modes that should receive pointer events on the overlay
// Single unified list for all kinds (ink, canvas, design)
const ALL_TOOL_MODES = [
  "select", "pan", "draw", "erase", "lasso", "shape", "eyedropper", "insertSpace",
  "addCard", "addConnector", "addFrame", "addTextFrame", "addImage", "addPdfPage",
  "addShape", "addSticker", "addTextBox", "addSticky"
];

// Hint text for connector mode - use translation
const getConnectorHint = () => t("vault.canvas.insert.cards.connectActiveHint") || "Click the first card, then the second";

/**
 * Unified canvas board supporting both ink and card/canvas modes.
 * 
 * @param {string} kind - "ink" | "canvas" | "design" - determines default tool palette (stored but not used for tool gating)
 * @param {string} defaultTool - override default tool for this kind
 */
const CanvasBoard = forwardRef(function CanvasBoard(props, ref) {
  const {
    kind = "ink",
    strokes,
    objects = [],
    paper,
    tool,
    initialCamera,
    onCommit,
    onReplace,
    onSelection,
    onCamera,
    onPickColor,
    onEngine,
    onInsertSpaceLimited,
    onSelectObject,
    onUpdateObject,
    onDeleteObject,
    onDuplicateObject,
    onBringToFront,
    onSendToBack,
    editingObjectId,
    setEditingObjectId,
    selectedObjectIds = [],
    className,
    height,
    autoFit = false,
    transparent = false,
    pendingConnectorFrom = null,
    setPendingConnectorFrom,
    onCreateConnector,
    onTool,
  } = props;
  const wrapRef = useRef(null);
  const baseRef = useRef(null);
  const overlayRef = useRef(null);
  const engineRef = useRef(null);
  const fittedRef = useRef(false);
  const themeRevision = useThemeRevision();
  const insertSpaceDrag = useRef(null);
  const pendingConnectorRef = useRef(null);
  // Text box creation drag state for drag-to-size
  const textBoxDrag = useRef(null); // { active: boolean, startX, startY, objectId, startWorldX, startWorldY }
  // Connector hint state
  const [connectorHint, setConnectorHint] = useState("");

  // Determine default tool based on kind
  const defaultToolForKind = useMemo(() => {
    if (kind === "canvas" || kind === "design") return "select";
    return "draw";
  }, [kind]);

  // Merge incoming tool with defaults
  const effectiveTool = useMemo(() => {
    const base = { mode: defaultToolForKind, brush: "fountain", color: tokenColor("--ink-light") || "#e9e2d0", alpha: 1, width: 3, size: 26 };
    return { ...base, ...tool };
  }, [tool, defaultToolForKind]);

  // Live ref for callbacks
  const live = useRef({});
  live.current = {
    strokes,
    objects,
    paper,
    tool: effectiveTool,
    initialCamera,
    onCommit,
    onReplace,
    onSelection,
    onCamera,
    onPickColor,
    onEngine,
    onInsertSpaceLimited,
    onSelectObject,
    onUpdateObject,
    onDeleteObject,
    onDuplicateObject,
    onBringToFront,
    onSendToBack,
    editingObjectId,
    setEditingObjectId,
    autoFit,
    kind,
    pendingConnectorFrom,
    setPendingConnectorFrom,
    onCreateConnector,
    onTool,
    connectorHint,
    setConnectorHint,
  };

  // Initialize engine
  useEffect(() => {
    const engine = new InkEngine({
      base: baseRef.current,
      overlay: overlayRef.current,
      callbacks: {
        onCommit: (next) => live.current.onCommit?.(next),
        onReplace: (next) => live.current.onReplace?.(next),
        onSelection: (ids, bounds) => live.current.onSelection?.(ids, bounds),
        onCamera: (camera) => live.current.onCamera?.(camera),
        onPickColor: (hex, alpha) => live.current.onPickColor?.(hex, alpha),
        onInsertSpaceLimited: () => live.current.onInsertSpaceLimited?.(),
      },
      transparent,
    });
    engineRef.current = engine;
    engine.setStrokes(live.current.strokes || []);
    engine.setPaper(live.current.paper || {});
    engine.setTool(live.current.tool || {});
    if (live.current.initialCamera) engine.setCamera(live.current.initialCamera);
    live.current.onEngine?.(engine);

    const frame = requestAnimationFrame(() => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (rect) engine.resize(rect.width, rect.height, Math.min(window.devicePixelRatio || 1, 2));
    });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(engine.frame);
      engineRef.current = null;
      live.current.onEngine?.(null);
    };
  }, [transparent]);

  // Sync props to engine
  useEffect(() => { engineRef.current?.setStrokes(strokes); }, [strokes]);
  useEffect(() => { engineRef.current?.setPaper(paper); }, [paper]);
  useEffect(() => { engineRef.current?.setTool(effectiveTool); }, [effectiveTool]);
  useEffect(() => { engineRef.current?.setObjects?.(objects); }, [objects]);

  // Resize observer
  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return undefined;
    const apply = () => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      engineRef.current?.resize(rect.width, rect.height, Math.min(window.devicePixelRatio || 1, 2));
      if (live.current.autoFit && !fittedRef.current) {
        fittedRef.current = true;
        engineRef.current?.fitView?.();
      }
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Wheel/keyboard handlers (for non-transparent)
  useEffect(() => {
    if (transparent) return undefined;
    const canvas = overlayRef.current;
    if (!canvas) return undefined;
    const onWheel = (event) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      if (event.ctrlKey || event.metaKey) {
        engineRef.current?.zoomAt(event.clientX - rect.left, event.clientY - rect.top, event.deltaY < 0 ? 1.12 : 0.9);
      } else {
        engineRef.current?.panBy(-event.deltaX, -event.deltaY);
      }
    };
    const onKey = (event) => {
      if (event.key === "Escape") {
        engineRef.current?.cancel();
        // Cancel connector if active
        if (live.current.pendingConnectorFrom) {
          live.current.setPendingConnectorFrom?.(null);
          live.current.setConnectorHint?.("");
          live.current.onTool?.({ mode: "select" });
        }
      }
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [transparent]);

  // Theme change repaint
  useEffect(() => { engineRef.current?.invalidate(); }, [themeRevision]);

  // Coordinate conversion
  const pointFrom = useCallback((event) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0, pressure: 0.5, tilt: 0, button: 0, pointerType: "mouse", altKey: false };
    const pointer = event.pointerType;
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      pressure: pointer === "pen" ? event.pressure || 0.5 : pointer === "touch" ? 0.58 : 0.55,
      tilt: Math.min(1, Math.hypot(event.tiltX || 0, event.tiltY || 0) / 90),
      button: event.button,
      pointerType: pointer,
      altKey: event.altKey,
    };
  }, []);

  // Handle pointer down
  const onPointerDown = useCallback(async (event) => {
    if (event.button === 2) event.preventDefault();
    overlayRef.current?.setPointerCapture?.(event.pointerId);
    const engine = engineRef.current;
    if (!engine) return;

    const mode = live.current.tool?.mode;

    // Handle insertSpace mode (shared)
    if (mode === "insertSpace") {
      const input = pointFrom(event);
      const world = engine.worldFromScreen(input.x, input.y);
      const dragState = { dragging: true, startY: world.y, lineY: world.y };
      insertSpaceDrag.current = dragState;
      engine.insertSpaceDrag = dragState;
      engine.dirtyOverlay = true;
      engine.schedule();
      return;
    }

    // Object creation tools - work in all kinds
    const creationTools = [
      "addCard", "addFrame", "addTextFrame", "addImage", "addPdfPage",
      "addShape", "addSticker", "addTextBox", "addSticky"
    ];
    if (creationTools.includes(mode)) {
      const input = pointFrom(event);
      const world = engine.worldFromScreen(input.x, input.y);
      const { createObject, getDefaultSize, OBJECT_TYPES: LocalOBJECT_TYPES } = await import("@/lib/canvas/objects");
      
      let type, shapeType, frameType;
      switch (mode) {
        case "addCard":
          type = LocalOBJECT_TYPES.CARD;
          break;
        case "addFrame":
          type = LocalOBJECT_TYPES.FRAME;
          frameType = "a4";
          break;
        case "addTextFrame":
          type = LocalOBJECT_TYPES.TEXT_FRAME;
          break;
        case "addImage":
          type = LocalOBJECT_TYPES.IMAGE;
          break;
        case "addPdfPage":
          type = LocalOBJECT_TYPES.PDF_PAGE;
          break;
        case "addShape":
          type = LocalOBJECT_TYPES.SHAPE;
          shapeType = "rect";
          break;
        case "addSticker":
          type = LocalOBJECT_TYPES.STICKER;
          break;
        case "addTextBox":
          type = LocalOBJECT_TYPES.TEXTBOX;
          break;
        case "addSticky":
          type = LocalOBJECT_TYPES.STICKY;
          break;
      }
      
      const size = getDefaultSize(type, shapeType || frameType);
      const overrides = {};
      if (frameType) overrides.frameType = frameType;
      if (shapeType) overrides.shapeType = shapeType;
      
      // For text box and sticky note: position at click (top-left), not centered
      // For text box: support drag-to-size
      let x, y;
      if (mode === "addTextBox" || mode === "addSticky") {
        x = world.x;
        y = world.y;
        
        // For text box, start drag-to-size
        if (mode === "addTextBox") {
          textBoxDrag.current = {
            active: true,
            startX: input.x,
            startY: input.y,
            startWorldX: world.x,
            startWorldY: world.y,
            objectId: null, // Will be set after creation
          };
        }
      } else {
        // Other objects: centered at click
        x = world.x - size.width / 2;
        y = world.y - size.height / 2;
      }
      
      const newObject = createObject(type, x, y, size.width, size.height, overrides);
      
      // If text box drag started, store the object ID
      if (mode === "addTextBox" && textBoxDrag.current) {
        textBoxDrag.current.objectId = newObject.id;
      }
      
      live.current.onUpdateObject?.(newObject.id, newObject);
      
      // For text box and sticky: immediately start editing
      if (mode === "addTextBox" || mode === "addSticky") {
        live.current.setEditingObjectId?.(newObject.id);
      }
      
      // Update tool through page state (onTool callback), not directly on engine
      live.current.onTool?.({ mode: "select" });
      return;
    }

    // Handle addConnector
    if (mode === "addConnector") {
      const input = pointFrom(event);
      const world = engine.worldFromScreen(input.x, input.y);
      // Find object at click position (excluding connectors)
      const hitObject = live.current.objects?.find(obj => {
        if (obj.type === "connector") return false;
        // Simple hit test
        return world.x >= obj.x && world.x <= obj.x + obj.width &&
               world.y >= obj.y && world.y <= obj.y + obj.height;
      });
      
      const pendingFrom = live.current.pendingConnectorFrom;
      
      if (pendingFrom && hitObject && hitObject.id !== pendingFrom) {
        // Second click - create connector between pendingFrom and hitObject
        live.current.onCreateConnector?.(pendingFrom, hitObject.id);
        live.current.setPendingConnectorFrom?.(null);
        live.current.setConnectorHint?.("");
        live.current.onTool?.({ mode: "select" });
      } else if (hitObject) {
        // First click - start connector from this object
        live.current.setPendingConnectorFrom?.(hitObject.id);
        live.current.setConnectorHint?.(getConnectorHint());
      } else {
        // Clicked empty space - cancel pending
        live.current.setPendingConnectorFrom?.(null);
        live.current.setConnectorHint?.("");
      }
      return;
    }

    // Default: let ink engine handle it (draw, erase, lasso, shape, pan, etc.)
    engine.pointerDown(pointFrom(event));
  }, [pointFrom]);

  // Handle pointer move
  const onPointerMove = useCallback((event) => {
    const engine = engineRef.current;
    if (!engine) return;
    
    const mode = live.current.tool?.mode;

    // Handle insertSpace drag
    if (mode === "insertSpace" && insertSpaceDrag.current?.dragging) {
      const input = pointFrom(event);
      const world = engine.worldFromScreen(input.x, input.y);
      insertSpaceDrag.current.lineY = world.y;
      engine.insertSpaceDrag = insertSpaceDrag.current;
      engine.dirtyOverlay = true;
      engine.schedule();
      return;
    }

    // Handle connector preview (all kinds)
    if (mode === "addConnector" && live.current.pendingConnectorFrom) {
      // Could show preview line here
      engine.dirtyOverlay = true;
      engine.schedule();
      return;
    }

    // Handle text box drag-to-size
    if (mode === "addTextBox" && textBoxDrag.current?.active && textBoxDrag.current.objectId) {
      const input = pointFrom(event);
      const world = engine.worldFromScreen(input.x, input.y);
      
      // Calculate new width/height from drag
      const newWidth = Math.max(50, world.x - textBoxDrag.current.startWorldX);
      const newHeight = Math.max(30, world.y - textBoxDrag.current.startWorldY);
      
      // Update the object size
      live.current.onUpdateObject?.(textBoxDrag.current.objectId, {
        width: newWidth,
        height: newHeight,
      });
      
      engine.dirtyOverlay = true;
      engine.schedule();
      return;
    }

    engine.pointerMove(pointFrom(event));
  }, [pointFrom]);

  // End insertSpace
  const endInsertSpace = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || !insertSpaceDrag.current?.dragging) return;
    const drag = insertSpaceDrag.current;
    insertSpaceDrag.current = null;
    engine.insertSpaceDrag = null;
    const distance = drag.lineY - drag.startY;
    if (Math.abs(distance) < 1) return;
    const result = engine.insertSpace(drag.startY, distance);
    engine.dirtyOverlay = true;
    engine.schedule();
    if (result.limited) {
      live.current.onInsertSpaceLimited?.();
    }
  }, []);

  // End stroke/pointer up
  const endStroke = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const mode = live.current.tool?.mode;
    
    // Handle text box drag-to-size end
    if (mode === "addTextBox" && textBoxDrag.current?.active) {
      textBoxDrag.current.active = false;
      // If the text box is too small (user just clicked without dragging), it will be handled by auto-delete in FloatingObjects
      textBoxDrag.current = null;
      return;
    }
    
    // Skip ink engine pointerUp for object creation tools and connector - they handle their own logic
    const creationTools = [
      "addCard", "addFrame", "addTextFrame", "addImage", "addPdfPage",
      "addShape", "addSticker", "addTextBox", "addSticky", "addConnector"
    ];
    if (mode === "insertSpace") {
      endInsertSpace();
      return;
    }
    if (creationTools.includes(mode)) {
      return;
    }
    engine.pointerUp();
  }, [endInsertSpace]);

  // Expose engine methods via forwardRef
  useImperativeHandle(ref, () => ({
    fitView: () => engineRef.current?.fitView?.(),
    fitWidth: () => engineRef.current?.fitWidth?.(),
    zoomBy: (factor) => engineRef.current?.zoomBy?.(factor),
    setCamera: (camera) => engineRef.current?.setCamera?.(camera),
    cancel: () => engineRef.current?.cancel?.(),
  }), []);

  // Determine pointer events for overlay - all tools active for all kinds
  const isToolActive = ALL_TOOL_MODES.includes(effectiveTool?.mode);
  const overlayPointerEvents = isToolActive ? "auto" : "none";

  // Select object helper
  const selectObject = useCallback((id) => {
    live.current.onSelectObject?.(id);
  }, []);

  // Wrapper styles
  const wrapperClass = transparent
    ? cn("relative overflow-hidden", className)
    : cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-[hsl(var(--paper-outside))] shadow-inner shadow-[hsl(var(--shadow)/0.4)]",
        className
      );

  return (
    <div
      ref={wrapRef}
      style={height ? { height } : undefined}
      className={wrapperClass}
    >
      <canvas ref={baseRef} className="absolute inset-0 h-full w-full" />
      <FloatingObjects
        objects={live.current.objects || []}
        tool={effectiveTool}
        camera={engineRef.current?.camera || { x: 0, y: 0, scale: 1 }}
        viewport={engineRef.current?.viewport || { w: 800, h: 600, dpr: 1 }}
        dpr={engineRef.current?.viewport?.dpr || 1}
        onSelectObject={selectObject}
        onUpdateObject={live.current.onUpdateObject}
        onDeleteObject={live.current.onDeleteObject}
        onDuplicateObject={live.current.onDuplicateObject}
        onBringToFront={live.current.onBringToFront}
        onSendToBack={live.current.onSendToBack}
        editingObjectId={live.current.editingObjectId}
        setEditingObjectId={live.current.setEditingObjectId}
        selectedObjectIds={selectedObjectIds}
        scale={engineRef.current?.camera?.scale || 1}
      />
      <canvas
        ref={overlayRef}
        className={cn("absolute inset-0 h-full w-full touch-none", CURSORS[effectiveTool?.mode] || CURSORS.draw)}
        style={{ pointerEvents: overlayPointerEvents }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onContextMenu={(event) => event.preventDefault()}
      />
      {live.current.connectorHint && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-lg bg-background/95 border border-border/60 text-sm text-foreground shadow-lg backdrop-blur animate-fade-in">
          {live.current.connectorHint}
        </div>
      )}
    </div>
  );
});

CanvasBoard.displayName = "CanvasBoard";

export default CanvasBoard;