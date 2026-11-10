import { useEffect, useRef, useCallback } from "react";
import InkEngine from "@/lib/ink/engine";
import FloatingObjects from "@/components/ink/FloatingObjects";
import { useThemeRevision } from "@/lib/theme";
import { cn } from "@/lib/utils";

const CURSORS = {
  draw: "cursor-crosshair",
  shape: "cursor-crosshair",
  lasso: "cursor-crosshair",
  erase: "cursor-cell",
  pan: "cursor-grab active:cursor-grabbing",
  eyedropper: "cursor-copy",
  insertSpace: "cursor-ns-resize",
  select: "cursor-default",
};

/**
 * Mounts the ink engine on two stacked canvases: the committed base layer and a
 * live overlay for the in-progress stroke, lasso and selection handles.
 */
// Tool modes that should receive pointer events on the overlay
const INK_TOOL_MODES = ["draw", "erase", "lasso", "shape", "eyedropper", "pan", "insertSpace", "select"];

export default function InkBoard({
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
  // Object callbacks
  onSelectObject,
  onUpdateObject,
  onDeleteObject,
  onBringToFront,
  onSendToBack,
  editingObjectId,
  setEditingObjectId,
  className,
  height,
  autoFit = false,
  transparent = false,
}) {
  const wrapRef = useRef(null);
  const baseRef = useRef(null);
  const overlayRef = useRef(null);
  const engineRef = useRef(null);
  const fittedRef = useRef(false);
  const themeRevision = useThemeRevision();
  const insertSpaceDrag = useRef(null); // { dragging: boolean, startY: number, lineY: number }
  const live = useRef({});
  live.current = {
    strokes,
    objects,
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
    autoFit,
  };

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

  useEffect(() => {
    engineRef.current?.setStrokes(strokes);
  }, [strokes]);

  useEffect(() => {
    engineRef.current?.setPaper(paper);
  }, [paper]);

  useEffect(() => {
    engineRef.current?.setTool(tool);
  }, [tool]);

  // Sync objects to engine for rendering in base layer (optional, for print/export)
  useEffect(() => {
    engineRef.current?.setObjects?.(objects);
  }, [objects]);

  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return undefined;
    const apply = () => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      engineRef.current?.resize(rect.width, rect.height, Math.min(window.devicePixelRatio || 1, 2));
      // The first real measurement is when a page can be fitted to the space it actually has.
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
    canvas.addEventListener("wheel", onWheel, { passive: false });
    const onKey = (event) => {
      if (event.key === "Escape") engineRef.current?.cancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [transparent]);

  const pointFrom = (event) => {
    const rect = overlayRef.current.getBoundingClientRect();
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
  };

  const onPointerDown = (event) => {
    if (event.button === 2) event.preventDefault();
    overlayRef.current?.setPointerCapture?.(event.pointerId);
    const engine = engineRef.current;
    if (!engine) return;
    const mode = engine.tool.mode;
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
    engine.pointerDown(pointFrom(event));
  };

  const onPointerMove = (event) => {
    const engine = engineRef.current;
    if (!engine) return;
    const mode = engine.tool.mode;
    if (mode === "insertSpace" && insertSpaceDrag.current?.dragging) {
      const input = pointFrom(event);
      const world = engine.worldFromScreen(input.x, input.y);
      insertSpaceDrag.current.lineY = world.y;
      engine.insertSpaceDrag = insertSpaceDrag.current;
      engine.dirtyOverlay = true;
      engine.schedule();
      return;
    }
    engine.pointerMove(pointFrom(event));
  };

  const endInsertSpace = () => {
    const engine = engineRef.current;
    if (!engine || !insertSpaceDrag.current?.dragging) return;
    const drag = insertSpaceDrag.current;
    insertSpaceDrag.current = null;
    engine.insertSpaceDrag = null;
    const distance = drag.lineY - drag.startY;
    if (Math.abs(distance) < 1) return; // Ignore tiny movements
    const result = engine.insertSpace(drag.startY, distance);
    engine.dirtyOverlay = true;
    engine.schedule();
    // Notify parent about the result (for toast)
    if (result.limited) {
      live.current.onInsertSpaceLimited?.();
    }
  };

  // Canvas paint is not CSS, so a theme switch has to repaint from the new tokens.
  useEffect(() => {
    engineRef.current?.invalidate();
  }, [themeRevision]);

  const endStroke = () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.tool.mode === "insertSpace") {
      endInsertSpace();
      return;
    }
    engine.pointerUp();
  };

  // Determine pointer events for overlay canvas
  const isInkToolActive = INK_TOOL_MODES.includes(tool?.mode);
  const overlayPointerEvents = isInkToolActive ? "auto" : "none";

  // Select object helper for FloatingObjects
  const selectObject = useCallback((id) => {
    onSelectObject?.(id);
  }, [onSelectObject]);

  const isObjectSelected = useCallback((id) => {
    return onSelectObject ? onSelectObject(id) : false;
  }, [onSelectObject]);

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
        tool={tool}
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
        scale={engineRef.current?.camera?.scale || 1}
      />
      <canvas
        ref={overlayRef}
        className={cn("absolute inset-0 h-full w-full touch-none", CURSORS[tool?.mode] || CURSORS.draw)}
        style={{ pointerEvents: overlayPointerEvents }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onContextMenu={(event) => event.preventDefault()}
      />
    </div>
  );
}