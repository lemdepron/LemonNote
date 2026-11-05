import { useEffect, useMemo, useRef, useState } from "react";
import { buildGraph, tick } from "@/lib/graph";

const WIDTH = 1000;
const HEIGHT = 620;

export default function GraphView({ notes, onOpen }) {
  const graph = useMemo(() => buildGraph(notes), [notes]);
  const nodesRef = useRef(graph.nodes);
  const dragRef = useRef(null);
  const movedRef = useRef(false);
  const svgRef = useRef(null);
  const [, setFrame] = useState(0);

  useEffect(() => {
    nodesRef.current = graph.nodes;
    let raf = 0;
    let step = 0;
    const run = () => {
      for (let i = 0; i < 3; i += 1) tick(nodesRef.current, graph.edges, graph.byId, WIDTH, HEIGHT);
      step += 1;
      setFrame((value) => value + 1);
      if (step < 240) raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [graph]);

  useEffect(() => {
    const pointOf = (event) => {
      const rect = svgRef.current.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
      };
    };

    const move = (event) => {
      if (!dragRef.current) return;
      const node = nodesRef.current.find((item) => item.id === dragRef.current);
      if (!node) return;
      const point = pointOf(event);
      movedRef.current = true;
      node.x = point.x;
      node.y = point.y;
      node.vx = 0;
      node.vy = 0;
      setFrame((value) => value + 1);
    };

    const up = () => {
      dragRef.current = null;
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/30">
      <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[62vh] min-h-[380px] w-full touch-none">
        {graph.edges.map((edge) => {
          const a = graph.byId.get(edge.a);
          const b = graph.byId.get(edge.b);
          if (!a || !b) return null;
          return <line key={edge.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="hsl(var(--border))" strokeWidth="1" />;
        })}
        {graph.nodes.map((node) => {
          const radius = 6 + Math.min(9, node.degree * 2);
          const label = node.title.length > 20 ? `${node.title.slice(0, 20)}…` : node.title;
          return (
            <g
              key={node.id}
              transform={`translate(${node.x} ${node.y})`}
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={() => {
                dragRef.current = node.id;
                movedRef.current = false;
              }}
              onClick={() => {
                if (movedRef.current) return;
                onOpen(node.note);
              }}
            >
              <circle r={radius + 10} fill="transparent" />
              <circle
                r={radius}
                fill={node.degree ? "hsl(var(--node-ring) / 0.22)" : "hsl(var(--node))"}
                stroke="hsl(var(--node-ring) / 0.7)"
                strokeWidth="1"
              />
              <text y={radius + 14} textAnchor="middle" className="fill-muted-foreground font-mono" style={{ fontSize: 11 }}>
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}