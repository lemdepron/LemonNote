import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { db } from "@/api/localDb";
import SpaceListPage from "@/components/shell/SpaceListPage";
import { makeCanvas } from "@/lib/canvas";
import { relativeTime } from "@/lib/vault";
import { confirm } from "@/components/ui/use-dialog";
import { useI18n } from "@/lib/i18n";

export default function CanvasHome() {
  const { t } = useI18n();
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
    const ok = await confirm("Delete this canvas and all its cards?", { danger: true });
    if (!ok) return;
    await db.entities.Canvas.delete(id);
    load();
  };

  return (
    <SpaceListPage
      eyebrow={t("vault.canvas.label")}
      title={t("vault.canvas.heroTitle")}
      description={t("vault.canvas.hint")}
      createLabel={t("vault.canvas.addCard")}
      icon={LayoutGrid}
      loading={loading}
      onCreate={create}
      onDelete={remove}
      items={items.map((canvas) => ({
        id: canvas.id,
        name: canvas.name || t("vault.canvas.emptyState"),
        href: `/canvas/${canvas.id}`,
        meta: `${canvas.nodes?.length ?? 0} ${t("vault.canvas.stats").split(" · ")[0].replace("{cards}", "")} · ${canvas.edges?.length ?? 0} ${t("vault.canvas.stats").split(" · ")[1].replace("{connections}", "")} · ${relativeTime(canvas.updated_date)}`,
      }))}
      emptyTitle={t("vault.canvas.emptyState")}
      emptyHint={t("vault.canvas.guideText1")}
    />
  );
}