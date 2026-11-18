import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, PenLine, Layout } from "lucide-react";
import { db } from "@/api/localDb";
import SpaceListPage from "@/components/shell/SpaceListPage";
import { makeCanvas } from "@/lib/canvas";
import { relativeTime } from "@/lib/vault";
import { confirm } from "@/components/ui/use-dialog";
import { useI18n } from "@/lib/i18n";
import { OBJECT_TYPES, createObject, getDefaultSize } from "@/lib/canvas/objects";

export default function CanvasHome() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () =>
    db.entities.CanvasDoc.list({ sort: "-updated_date", limit: 60 })
      .then((page) => setItems(page?.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const create = async (kind = "canvas") => {
    let initialObjects = [];
    let initialPaper = { template: "grid", size: "infinite", tone: "dark" };
    let initialCamera = { x: 0, y: 0, scale: 1 };

    if (kind === "canvas") {
      // Canvas mode - cards and connectors
      initialObjects = makeCanvas("Untitled canvas").nodes.map((node) => ({
        id: node.id,
        type: "card",
        x: node.x,
        y: node.y,
        width: 240,
        height: 154,
        rotation: 0,
        zOrder: Date.now() + Math.random(),
        title: node.title,
        body: node.body,
        visible: true,
        locked: false,
        groupId: null,
      }));
      initialPaper = { template: "grid", size: "free", width: 9000, height: 6500, tone: "dark" };
    } else if (kind === "design") {
      // Design mode - start with an A4 portrait frame
      const frameSize = getDefaultSize(OBJECT_TYPES.FRAME, "a4");
      const centerX = 0; // Will be centered by fitWidth
      const centerY = 0;
      const initialFrame = createObject(OBJECT_TYPES.FRAME, centerX - frameSize.width / 2, centerY - frameSize.height / 2, frameSize.width, frameSize.height, {
        frameType: "a4",
        name: "Page 1",
      });
      initialObjects = [initialFrame];
      initialPaper = { template: "grid", size: "infinite", tone: "dark" };
      // Camera will be fitted to frame width on load
    } else {
      // Ink mode - empty
      initialObjects = [];
      initialPaper = { template: "grid", size: "infinite", tone: "dark" };
    }

    const canvasDoc = await db.entities.CanvasDoc.create({
      kind,
      name: kind === "canvas" ? "Untitled canvas" : kind === "design" ? "Untitled design" : "Untitled ink page",
      paper: initialPaper,
      objects: initialObjects,
      strokes: [],
      camera: initialCamera,
    });
    navigate(`/canvas/${canvasDoc.id}`);
  };

  const remove = async (id) => {
    const ok = await confirm(t("vault.canvas.confirmDelete") || "Delete this canvas and all its contents?", { danger: true });
    if (!ok) return;
    await db.entities.CanvasDoc.delete(id);
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
      onCreate={() => create("canvas")}
      onDelete={remove}
      items={items.map((doc) => ({
        id: doc.id,
        name: doc.name || t("vault.canvas.emptyState"),
        href: `/canvas/${doc.id}`,
        meta: `${doc.objects?.filter(o => o.type === "card").length ?? 0} cards · ${doc.objects?.filter(o => o.type === "connector").length ?? 0} connections · ${doc.strokes?.length ?? 0} strokes · ${relativeTime(doc.updated_date)}`,
        badge: doc.kind === "ink" ? (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-mono">
            <PenLine className="h-2.5 w-2.5" /> {t("vault.canvas.kindInk") || "Ink"}
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[9px] font-mono">
            <LayoutGrid className="h-2.5 w-2.5" /> {t("vault.canvas.kindCanvas") || "Canvas"}
          </span>
        ),
      }))}
      emptyTitle={t("vault.canvas.emptyState")}
      emptyHint={t("vault.canvas.guideText1")}
      extraActions={[
        {
          label: t("vault.canvas.newDesign") || "New Design",
          icon: Layout,
          onClick: () => create("design"),
        },
        {
          label: t("vault.canvas.newInkPage") || "New Ink Page",
          icon: PenLine,
          onClick: () => create("ink"),
        },
      ]}
    />
  );
}