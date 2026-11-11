import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Info, Plus, SlidersHorizontal } from "lucide-react";
import { db } from "@/api/localDb";
import VaultHeader from "@/components/vault/VaultHeader";
import CanvasStage from "@/components/canvas/CanvasStage";
import CanvasInspector from "@/components/canvas/CanvasInspector";
import EdgeDock from "@/components/shell/EdgeDock";
import FocusToggle from "@/components/shell/FocusToggle";
import { useFocusMode } from "@/lib/focusMode";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { uid } from "@/lib/table";
import { useI18n } from "@/lib/i18n";

export default function CanvasPage() {
  const { t, localDigits } = useI18n();
  const { id } = useParams();
  const [canvas, setCanvas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [pendingFrom, setPendingFrom] = useState(null);
  const [status, setStatus] = useState("idle");
  const dirty = useRef(false);
  const { focus } = useFocusMode();

  useEffect(() => {
    let active = true;
    setLoading(true);
    db.entities.Canvas.get(id)
      .then((record) => {
        if (!active) return;
        setCanvas({ ...record, nodes: record.nodes ?? [], edges: record.edges ?? [] });
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setCanvas(null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const patch = (changes) => {
    dirty.current = true;
    setStatus("saving");
    setCanvas((current) => ({ ...current, ...changes }));
  };

  useEffect(() => {
    if (!canvas || !dirty.current) return;
    const timer = setTimeout(async () => {
      await db.entities.Canvas.update(canvas.id, {
        name: canvas.name,
        nodes: canvas.nodes,
        edges: canvas.edges,
      });
      dirty.current = false;
      setStatus("saved");
    }, 650);
    return () => clearTimeout(timer);
  }, [canvas]);

  const nodes = canvas?.nodes ?? [];
  const edges = canvas?.edges ?? [];
  const selected = nodes.find((node) => node.id === selectedId) ?? null;

  const addNode = (x, y) => {
    const node = { id: uid("node"), x, y, title: "New card", body: "" };
    patch({ nodes: [...nodes, node] });
    setSelectedId(node.id);
  };

  const moveNode = (nodeId, x, y) =>
    patch({ nodes: nodes.map((node) => (node.id === nodeId ? { ...node, x, y } : node)) });

  const connect = (targetId) => {
    if (!pendingFrom) {
      setPendingFrom(targetId);
      return;
    }
    if (pendingFrom === targetId) {
      setPendingFrom(null);
      return;
    }
    const exists = edges.some(
      (edge) =>
        (edge.from === pendingFrom && edge.to === targetId) || (edge.from === targetId && edge.to === pendingFrom)
    );
    if (!exists) patch({ edges: [...edges, { id: uid("edge"), from: pendingFrom, to: targetId }] });
    setPendingFrom(null);
  };

  const updateSelected = (changes) =>
    patch({ nodes: nodes.map((node) => (node.id === selectedId ? { ...node, ...changes } : node)) });

  const deleteSelected = () => {
    patch({
      nodes: nodes.filter((node) => node.id !== selectedId),
      edges: edges.filter((edge) => edge.from !== selectedId && edge.to !== selectedId),
    });
    setSelectedId(null);
    setPendingFrom(null);
  };

  const removeEdge = (edgeId) => patch({ edges: edges.filter((edge) => edge.id !== edgeId) });

  const addCardToGrid = () => {
    const index = nodes.length;
    addNode(120 + (index % 3) * 280, 120 + Math.floor(index / 3) * 210);
  };

  const dockPanels = [
    {
      id: "canvas-inspector",
      label: t("vault.canvas.cardInspector"),
      icon: SlidersHorizontal,
      content: (
        <CanvasInspector
          node={selected}
          nodes={nodes}
          edges={edges}
          linking={Boolean(pendingFrom)}
          onChange={updateSelected}
          onDelete={deleteSelected}
          onStartLink={() => setPendingFrom(selectedId)}
          onCancelLink={() => setPendingFrom(null)}
          onRemoveEdge={removeEdge}
        />
      ),
    },
    {
      id: "canvas-guide",
      label: t("vault.canvas.canvasGuide"),
      icon: Info,
      content: (
        <div className="rounded-xl border border-border/60 bg-card/30 p-3.5 text-[12.5px] leading-relaxed text-muted-foreground">
          <p>{t("vault.canvas.guideText1")}</p>
          <p className="mt-2">
            {t("vault.canvas.guideText2")}
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70" dir="auto">
            {t("vault.canvas.stats", { cards: localDigits(nodes.length), connections: localDigits(edges.length) })}
          </p>
        </div>
      ),
    },
  ];

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

  if (!canvas) {
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

  return (
    <div className="nb-shell min-h-screen">
      <VaultHeader />
      <main className={cn("mx-auto max-w-[1400px] px-4 pb-10 pt-5 sm:px-6", focus && "pr-12")}>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/canvas"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label={t("vault.canvas.backToCanvases")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <input
            value={canvas.name}
            onChange={(event) => patch({ name: event.target.value })}
            aria-label={t("vault.canvas.canvasName")}
            className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-1 font-display text-[22px] tracking-tight text-foreground outline-none transition hover:border-border/60 focus:border-primary/40"
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {t(`vault.canvas.status.${status}`)}
          </span>
          <Button
            onClick={addCardToGrid}
            size="sm"
            className="h-8 gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("vault.canvas.addCard")}
          </Button>
          <FocusToggle />
        </div>

        <div
          className={cn(
            "mt-4 grid gap-3 transition-[gap] duration-300 ease-out",
            focus ? "lg:grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_288px]"
          )}
        >
          <CanvasStage
            nodes={nodes}
            edges={edges}
            selectedId={selectedId}
            pendingFrom={pendingFrom}
            onSelect={setSelectedId}
            onMoveNode={moveNode}
            onConnect={connect}
            onAddNode={addNode}
            focus={focus}
          />
          {!focus && dockPanels.find((panel) => panel.id === "canvas-inspector").content}
        </div>
        <EdgeDock panels={dockPanels} />
      </main>
    </div>
  );
}