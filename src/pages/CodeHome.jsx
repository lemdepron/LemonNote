import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Code2 } from "lucide-react";
import { db } from "@/api/localDb";
import SpaceListPage from "@/components/shell/SpaceListPage";
import { languageLabel, templateFor } from "@/lib/code-languages";
import { relativeTime } from "@/lib/vault";
import { uid } from "@/lib/table";
import { confirm } from "@/components/ui/use-dialog";
import { useI18n } from "@/lib/i18n";

const STARTER_FILE = {
  name: "untitled.rs",
  language: "rust",
  body: templateFor("rust"),
};

export default function CodeHome() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () =>
    db.entities.CodeFile.list({ sort: "-updated_date", limit: 60 })
      .then((page) => setItems(page?.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    const file = await db.entities.CodeFile.create({ ...STARTER_FILE, name: `scratch-${uid("f").slice(2, 6)}.rs` });
    navigate(`/code/${file.id}`);
  };

  const remove = async (id) => {
    const ok = await confirm("Delete this file?", { danger: true });
    if (!ok) return;
    await db.entities.CodeFile.delete(id);
    load();
  };

  return (
    <SpaceListPage
      eyebrow={t("vault.code.label")}
      title={t("vault.code.heroTitle")}
      description={t("vault.code.hint")}
      createLabel={t("vault.code.newFile")}
      icon={Code2}
      loading={loading}
      onCreate={create}
      onDelete={remove}
      items={items.map((file) => ({
        id: file.id,
        name: file.name || t("vault.code.emptyState"),
        href: `/code/${file.id}`,
        meta: `${languageLabel(file.language)} · ${(file.body || "").split("\n").length} lines · ${relativeTime(file.updated_date)}`,
      }))}
      emptyTitle={t("vault.code.emptyState")}
      emptyHint={t("vault.code.subtitle")}
    />
  );
}