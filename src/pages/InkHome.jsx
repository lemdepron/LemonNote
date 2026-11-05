import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PenLine } from "lucide-react";
import { db } from "@/api/localDb";
import SpaceListPage from "@/components/shell/SpaceListPage";
import { deletePage } from "@/lib/ink/store";
import { relativeTime } from "@/lib/vault";

export default function InkHome() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () =>
    db.entities.InkPage.list({ sort: "-updated_date", limit: 60 })
      .then((page) => setItems(page?.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    const page = await db.entities.InkPage.create({ name: `Page ${items.length + 1}`, strokes: [] });
    navigate(`/ink/${page.id}`);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this page?")) return;
    await deletePage(id);
    load();
  };

  return (
    <SpaceListPage
      eyebrow="Ink notebook"
      title="Think with a pen."
      description="Freehand pages for sketches, diagrams and margin notes — pen, highlighter and eraser, saved as you go."
      createLabel="New page"
      icon={PenLine}
      loading={loading}
      onCreate={create}
      onDelete={remove}
      items={items.map((page) => ({
        id: page.id,
        name: page.name || "Untitled page",
        href: `/ink/${page.id}`,
        meta: `${page.markCount ?? (page.strokes || []).length} marks · ${relativeTime(page.updated_date)}`,
      }))}
      emptyTitle="No ink pages yet."
      emptyHint="Each page is one sheet — draw, highlight, erase, and everything autosaves."
    />
  );
}