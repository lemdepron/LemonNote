import { useEffect, useRef, useState } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import CanvasCard from "@/components/canvas/CanvasCard";
import { CARD_HEIGHT, CARD_WIDTH } from "@/lib/canvas";

const PLANE_WIDTH = 9000;
const PLANE_HEIGHT = 6500;

export default function CanvasStage({
  nodes,
  edges,
  selectedId,
  pendingFrom,
  onSelect,
  onMoveNode,
  onConnect,
  onAddNode,
  focus = false,
}) {
  const [view, setView] = useState({ x: 140, y: 90, scale: 1 });
  const viewportRef = useRef(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onWheel = (event) => {
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      setView((current) => {
        const scale = Math.min(2, Math.max(0.35, current.scale * (event.deltaY < 0 ? 1.08 : 0.92)));
        const ratio = scale / current.scale;
        return { scale, x: px - (px - current.x) * ratio, y: py - (py - current.y) * ratio };
      });
    };
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, []);

  const onPane = (target) => target?.dataset?.pane === "1";

  const startPan = (event) => {
    if (event.button !== 0 || !onPane(event.target)) return;
    onSelect(null);
    const origin = { x: event.clientX, y: event.clientY, vx: view.x, vy: view.y };
    const move = (event2) =>
      setView((current) => ({
        ...current,
        x: origin.vx + (event2.clientX - origin.x),
        y: origin.vy + (event2.clientY - origin.y),
      }));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const handleDoubleClick = (event) => {
    if (!onPane(event.target)) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left - view.x) / view.scale - CARD_WIDTH / 2;
    const y = (event.clientY - rect.top - view.y) / view.scale - 24;
    onAddNode(Math.round(x), Math.round(y));
  };

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const paths = edges
    .map((edge) => {
      const from = nodeMap.get(edge.from);
      const to = nodeMap.get(edge.to);
      if (!from || !to) return null;
      const x1 = from.x + CARD_WIDTH;
      const y1 = from.y + CARD_HEIGHT / 2;
      const x2 = to.x;
      const y2 = to.y + CARD_HEIGHT / 2;
      const curve = Math.max(50, Math.abs(x2 - x1) / 2);
      return { id: edge.id, d: `M ${x1} ${y1} C ${x1 + curve} ${y1}, ${x2 - curve} ${y2}, ${x2} ${y2}` };
    })
    .filter(Boolean);

  const zoomBy = (factor) =>
    setView((current) => ({ ...current, scale: Math.min(2, Math.max(0.35, current.scale * factor)) }));

  return (
    <div
      ref={viewportRef}
      className={`relative min-h-[420px] overflow-hidden rounded-xl border border-border/70 bg-[hsl(var(--canvas))] transition-[height] duration-300 ease-out ${
        focus ? "h-[68vh] sm:h-[74vh]" : "h-[60vh] sm:h-[64vh]"
      }`}
    >
      <div
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`, transformOrigin: "0 0" }}
        className="absolute left-0 top-0"
      >
        <div
          data-pane="1"
          onPointerDown={startPan}
          onDoubleClick={handleDoubleClick}
          style={{
            width: PLANE_WIDTH,
            height: PLANE_HEIGHT,
            backgroundImage: "radial-gradient(hsl(var(--canvas-dot)) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          className="relative"
        >
          <svg data-pane="1" width={PLANE_WIDTH} height={PLANE_HEIGHT} className="absolute left-0 top-0">
            <defs>
              <marker id="nb-canvas-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0,0 L8,4 L0,8 z" fill="hsl(var(--edge))" fillOpacity="0.7" />
              </marker>
            </defs>
            {paths.map((path) => (
              <path
                key={path.id}
                d={path.d}
                fill="none"
                stroke="hsl(var(--edge))"
                strokeOpacity={focus ? 0.24 : 0.45}
                strokeWidth="1.6"
                markerEnd="url(#nb-canvas-arrow)"
              />
            ))}
          </svg>

          {nodes.map((node) => (
            <CanvasCard
              key={node.id}
              node={node}
              scale={view.scale}
              selected={node.id === selectedId}
              pendingFrom={pendingFrom}
              onSelect={onSelect}
              onMove={onMoveNode}
              onConnect={onConnect}
              compact={focus}
            />
          ))}
        </div>
      </div>

      <div
        className={`pointer-events-none absolute bottom-3 left-3 rounded-md bg-background/70 px-2 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur transition-opacity duration-200 ease-out ${
          focus ? "opacity-0" : "opacity-100"
        }`}
      >
        drag to pan · scroll to zoom · double-click to add a card
      </div>

      <div
        className={`absolute bottom-3 right-3 flex items-center gap-1 rounded-lg border border-border/70 bg-background/80 p-1 backdrop-blur transition-opacity duration-200 ease-out ${
          focus ? "opacity-50 hover:opacity-100" : "opacity-100"
        }`}
      >
        <button
          type="button"
          onClick={() => zoomBy(0.88)}
          aria-label="Zoom out"
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-10 text-center font-mono text-[10px] text-muted-foreground">
          {Math.round(view.scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomBy(1.12)}
          aria-label="Zoom in"
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setView({ x: 140, y: 90, scale: 1 })}
          aria-label="Reset view"
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}