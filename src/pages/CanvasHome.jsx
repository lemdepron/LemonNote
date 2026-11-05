import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { db } from "@/api/localDb";
import SpaceListPage from "@/components/shell/SpaceListPage";
import { makeCanvas } from "@/lib/canvas";
import { relativeTime } from "@/lib/vault";

export default function CanvasHome() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () =>
    db.entities.Canvas.list({ sort: "-updated_date", limit: 60 })
      .then((page) => setItems(page?.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    const canvas = await db.entities.Canvas.create(makeCanvas("Untitled canvas"));
    navigate(`/canvas/${canvas.id}`);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this canvas and all its cards?")) return;
    await db.entities.Canvas.delete(id);
    load();
  };

  return (
    <SpaceListPage
      eyebrow="Infinite canvas"
      title="Think in space."
      description="A pan-and-zoom plane for ideas you cannot outline yet. Drop cards anywhere, wire them together, then promote the cluster into a note."
      createLabel="New canvas"
      icon={LayoutGrid}
      loading={loading}
      onCreate={create}
      onDelete={remove}
      items={items.map((canvas) => ({
        id: canvas.id,
        name: canvas.name || "Untitled canvas",
        href: `/canvas/${canvas.id}`,
        meta: `${canvas.nodes?.length ?? 0} cards · ${canvas.edges?.length ?? 0} connections · ${relativeTime(canvas.updated_date)}`,
      }))}
      emptyTitle="No canvases yet."
      emptyHint="Every new canvas opens with three starter cards so you can see how connections work."
    />
  );
}