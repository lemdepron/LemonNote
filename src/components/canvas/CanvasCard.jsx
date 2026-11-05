import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CARD_HEIGHT, CARD_WIDTH } from "@/lib/canvas";

export default function CanvasCard({ node, scale, selected, pendingFrom, onSelect, onMove, onConnect, compact = false }) {
  const isSource = pendingFrom === node.id;

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    if (pendingFrom && pendingFrom !== node.id) {
      onConnect(node.id);
      return;
    }
    onSelect(node.id);
    const origin = { x: event.clientX, y: event.clientY, nx: node.x, ny: node.y };
    const move = (event2) =>
      onMove(node.id, origin.nx + (event2.clientX - origin.x) / scale, origin.ny + (event2.clientY - origin.y) / scale);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onClick={(event) => event.stopPropagation()}
      style={{ left: node.x, top: node.y, width: CARD_WIDTH, height: CARD_HEIGHT }}
      className={cn(
        "group absolute cursor-grab touch-none select-none overflow-hidden rounded-xl border p-3 transition-[background-color,border-color,box-shadow] duration-200 active:cursor-grabbing",
        compact ? "bg-card/70 backdrop-blur-none" : "bg-card/95 shadow-xl shadow-[hsl(var(--shadow)/0.3)] backdrop-blur",
        selected ? "border-primary/60" : "border-border/80",
        isSource && "border-primary ring-2 ring-primary/40",
        pendingFrom && !isSource && "hover:border-primary/60"
      )}
    >
      <div className="flex items-start gap-2">
        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
        <p className="line-clamp-2 flex-1 text-[13px] font-medium leading-snug text-foreground">
          {node.title || "Untitled card"}
        </p>
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onConnect(node.id);
          }}
          aria-label="Connect this card"
          title="Connect to another card"
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground/70 transition hover:bg-accent hover:text-primary"
        >
          <Link2 className="h-3 w-3" />
        </button>
      </div>
      <p
        className={cn(
          "mt-2 line-clamp-4 text-[12px] leading-relaxed text-muted-foreground transition-opacity duration-200 ease-out",
          compact && "opacity-0 group-hover:opacity-100"
        )}
      >
        {node.body || "No text yet."}
      </p>
    </div>
  );
}