import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table2 } from "lucide-react";
import { db } from "@/api/localDb";
import SpaceListPage from "@/components/shell/SpaceListPage";
import { makeTable } from "@/lib/table";
import { relativeTime } from "@/lib/vault";
import { confirm } from "@/components/ui/use-dialog";

export default function TablesHome() {
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
      eyebrow="Relational tables"
      title="Structure what repeats."
      description="Typed columns, rows you can edit inline, and relation fields that point at rows in another table — the database half of the workspace."
      createLabel="New table"
      icon={Table2}
      loading={loading}
      onCreate={create}
      onDelete={remove}
      items={items.map((table) => ({
        id: table.id,
        name: table.name || "Untitled table",
        href: `/tables/${table.id}`,
        meta: `${table.rows?.length ?? 0} rows · ${table.columns?.length ?? 0} fields · ${relativeTime(table.updated_date)}`,
      }))}
      emptyTitle="No tables yet."
      emptyHint="A new table starts with Name, Status and Done fields plus three example rows."
    />
  );
}