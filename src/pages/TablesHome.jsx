import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table2 } from "lucide-react";
import { db } from "@/api/localDb";
import SpaceListPage from "@/components/shell/SpaceListPage";
import { makeTable } from "@/lib/table";
import { relativeTime } from "@/lib/vault";
import { confirm } from "@/components/ui/use-dialog";
import { useI18n } from "@/lib/i18n";

export default function TablesHome() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () =>
    db.entities.DataTable.list({ sort: "-updated_date", limit: 60 })
      .then((page) => setItems(page?.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    const table = await db.entities.DataTable.create(makeTable("Untitled table"));
    navigate(`/tables/${table.id}`);
  };

  const remove = async (id) => {
    const ok = await confirm("Delete this table and its rows?", { danger: true });
    if (!ok) return;
    await db.entities.DataTable.delete(id);
    load();
  };

  return (
    <SpaceListPage
      eyebrow={t("vault.tables.label")}
      title={t("vault.tables.heroTitle")}
      description={t("vault.tables.hint")}
      createLabel={t("vault.tables.addButton")}
      icon={Table2}
      loading={loading}
      onCreate={create}
      onDelete={remove}
      items={items.map((table) => ({
        id: table.id,
        name: table.name || t("vault.tables.emptyState"),
        href: `/tables/${table.id}`,
        meta: `${table.rows?.length ?? 0} rows · ${table.columns?.length ?? 0} fields · ${relativeTime(table.updated_date)}`,
      }))}
      emptyTitle={t("vault.tables.emptyState")}
      emptyHint={t("vault.tables.tableGrid.noRows")}
    />
  );
}