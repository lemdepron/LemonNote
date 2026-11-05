import { useEffect, useRef } from "react";
import InkEngine from "@/lib/ink/engine";
import { useThemeRevision } from "@/lib/theme";
import { cn } from "@/lib/utils";

const CURSORS = {
  draw: "cursor-crosshair",
  shape: "cursor-crosshair",
  lasso: "cursor-crosshair",
  erase: "cursor-cell",
  pan: "cursor-grab active:cursor-grabbing",
  eyedropper: "cursor-copy",
};

/**
 * Mounts the ink engine on two stacked canvases: the committed base layer and a
 * live overlay for the in-progress stroke, lasso and selection handles.
 */
export default function InkBoard({
  strokes,
  paper,
  tool,
  initialCamera,
  onCommit,
  onReplace,
  onSelection,
  onCamera,
  onPickColor,
  onEngine,
  className,
  height,
  autoFit = false,
}) {
  const wrapRef = useRef(null);
  const baseRef = useRef(null);
  const overlayRef = useRef(null);
  const engineRef = useRef(null);
  const fittedRef = useRef(false);
  const themeRevision = useThemeRevision();
  const live = useRef({});
  live.current = { strokes, paper, tool, initialCamera, onCommit, onReplace, onSelection, onCamera, onPickColor, onEngine, autoFit };

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
      },
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
  }, []);

  useEffect(() => {
    engineRef.current?.setStrokes(strokes);
  }, [strokes]);

  useEffect(() => {
    engineRef.current?.setPaper(paper);
  }, [paper]);

  useEffect(() => {
    engineRef.current?.setTool(tool);
  }, [tool]);

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
  }, []);

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
    engineRef.current?.pointerDown(pointFrom(event));
  };

  const onPointerMove = (event) => {
    engineRef.current?.pointerMove(pointFrom(event));
  };

  // Canvas paint is not CSS, so a theme switch has to repaint from the new tokens.
  useEffect(() => {
    engineRef.current?.invalidate();
  }, [themeRevision]);

  const endStroke = () => engineRef.current?.pointerUp();

  return (
    <div
      ref={wrapRef}
      style={height ? { height } : undefined}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-[hsl(var(--paper-outside))] shadow-inner shadow-[hsl(var(--shadow)/0.4)]",
        className
      )}
    >
      <canvas ref={baseRef} className="absolute inset-0 h-full w-full" />
      <canvas
        ref={overlayRef}
        className={cn("absolute inset-0 h-full w-full touch-none", CURSORS[tool?.mode] || CURSORS.draw)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onContextMenu={(event) => event.preventDefault()}
      />
    </div>
  );
}