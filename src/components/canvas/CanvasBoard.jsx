import { forwardRef, useEffect, useRef, useCallback, useMemo, useImperativeHandle } from "react";
import InkEngine from "@/lib/canvas/engine";
import FloatingObjects from "@/components/ink/FloatingObjects";
import { useThemeRevision } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { OBJECT_TYPES } from "@/lib/canvas/objects";

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
const INK_TOOL_MODES = ["draw", "erase", "lasso", "shape", "eyedropper", "pan", "insertSpace", "select"];
const CANVAS_TOOL_MODES = ["select", "addCard", "addConnector", "pan", "insertSpace"];
const DESIGN_TOOL_MODES = ["select", "addCard", "addConnector", "addFrame", "addTextFrame", "addImage", "addPdfPage", "addShape", "addSticker", "addTextBox", "addSticky", "pan", "insertSpace", "draw", "erase", "lasso", "shape"];

/**
 * Unified canvas board supporting both ink and card/canvas modes.
 * 
 * @param {string} kind - "ink" | "canvas" - determines default tool palette
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
} = props;
  const wrapRef = useRef(null);
  const baseRef = useRef(null);
  const overlayRef = useRef(null);
  const engineRef = useRef(null);
  const fittedRef = useRef(false);
  const themeRevision = useThemeRevision();
  const insertSpaceDrag = useRef(null);
  const pendingConnectorRef = useRef(null);

  // Determine default tool based on kind
  const defaultToolForKind = useMemo(() => {
    if (kind === "canvas" || kind === "design") return "select";
    return "draw";
  }, [kind]);

  // Merge incoming tool with defaults
  const effectiveTool = useMemo(() => {
    const base = { mode: defaultToolForKind, brush: "fountain", color: "#e9e2d0", alpha: 1, width: 3, size: 26 };
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
    onBringToFront,
    onSendToBack,
    editingObjectId,
    setEditingObjectId,
    autoFit,
    kind,
    pendingConnectorFrom,
    setPendingConnectorFrom,
    onCreateConnector,
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
      if (event.key === "Escape") engineRef.current?.cancel();
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
    const currentKind = live.current.kind;

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

    // Handle canvas/design-specific modes
    if (currentKind === "canvas" || currentKind === "design") {
      const input = pointFrom(event);
      const world = engine.worldFromScreen(input.x, input.y);

      // Handle addCard (works in both canvas and design)
      if (mode === "addCard") {
        const { createObject, getDefaultSize } = await import("@/lib/canvas/objects");
        const size = getDefaultSize(OBJECT_TYPES.CARD);
        const newCard = createObject(OBJECT_TYPES.CARD, world.x - size.width / 2, world.y - size.height / 2, size.width, size.height);
        live.current.onUpdateObject?.(newCard.id, newCard);
        engine.setTool({ ...engine.tool, mode: "select" });
        live.current.onEngine?.(engine);
        return;
      }

      // Handle design mode object creation tools
      if (currentKind === "design") {
        const designTools = ["addFrame", "addTextFrame", "addImage", "addPdfPage", "addShape", "addSticker", "addTextBox", "addSticky"];
        if (designTools.includes(mode)) {
          const { createObject, getDefaultSize, OBJECT_TYPES: LocalOBJECT_TYPES } = await import("@/lib/canvas/objects");
          
          let type, shapeType, frameType;
          switch (mode) {
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
          
          const newObject = createObject(type, world.x - size.width / 2, world.y - size.height / 2, size.width, size.height, overrides);
          live.current.onUpdateObject?.(newObject.id, newObject);
          engine.setTool({ ...engine.tool, mode: "select" });
          live.current.onEngine?.(engine);
          return;
        }
      }

      if (mode === "addConnector") {
        // Start connector from clicked object or point
        const hitObject = live.current.objects?.find(obj => {
          // Simple hit test
          return world.x >= obj.x && world.x <= obj.x + obj.width &&
                 world.y >= obj.y && world.y <= obj.y + obj.height;
        });
        
        if (hitObject) {
          live.current.setPendingConnectorFrom?.(hitObject.id);
        } else {
          // Clicked empty space - cancel pending
          live.current.setPendingConnectorFrom?.(null);
        }
        return;
      }
    }

    // Default: let ink engine handle it
    engine.pointerDown(pointFrom(event));
  }, [pointFrom]);

  // Handle pointer move
  const onPointerMove = useCallback((event) => {
    const engine = engineRef.current;
    if (!engine) return;
    
    const mode = live.current.tool?.mode;
    const currentKind = live.current.kind;

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

    // Handle connector preview in canvas mode
    if (currentKind === "canvas" && mode === "addConnector" && live.current.pendingConnectorFrom) {
      // Could show preview line here
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
    if (live.current.tool?.mode === "insertSpace") {
      endInsertSpace();
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

  // Determine pointer events for overlay
  const isToolActive = live.current.kind === "canvas" 
    ? CANVAS_TOOL_MODES.includes(effectiveTool?.mode)
    : live.current.kind === "design"
    ? DESIGN_TOOL_MODES.includes(effectiveTool?.mode)
    : INK_TOOL_MODES.includes(effectiveTool?.mode);
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
    </div>
  );
});

CanvasBoard.displayName = "CanvasBoard";

export default CanvasBoard;