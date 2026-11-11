import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Columns3, LayoutGrid, Plus, Rows3, Table2 } from "lucide-react";
import { db } from "@/api/localDb";
import VaultHeader from "@/components/vault/VaultHeader";
import TableGrid from "@/components/table/TableGrid";
import BoardView from "@/components/table/BoardView";
import GalleryView from "@/components/table/GalleryView";
import FocusToggle from "@/components/shell/FocusToggle";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { COLUMN_TYPES, makeColumn, uid } from "@/lib/table";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const VIEWS = [
  { id: "table", labelKey: "vault.tables.viewTable", icon: Table2 },
  { id: "board", labelKey: "vault.tables.viewBoard", icon: Columns3 },
  { id: "gallery", labelKey: "vault.tables.viewGallery", icon: LayoutGrid },
];

export default function TablePage() {
  const { t, localDigits } = useI18n();
  const { id } = useParams();
  const [table, setTable] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("idle");
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState("table");
  const [draft, setDraft] = useState({ name: "", type: "text", options: "", targetTableId: "" });
  const dirty = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      db.entities.DataTable.get(id),
      db.entities.DataTable.list({ sort: "-updated_date", limit: 50 }),
    ])
      .then(([record, page]) => {
        if (!active) return;
        setTable({ ...record, columns: record.columns ?? [], rows: record.rows ?? [] });
        setTables(page?.items ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setTable(null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const patch = (changes) => {
    dirty.current = true;
    setStatus("saving");
    setTable((current) => ({ ...current, ...changes }));
  };

  useEffect(() => {
    if (!table || !dirty.current) return;
    const timer = setTimeout(async () => {
      await db.entities.DataTable.update(table.id, {
        name: table.name,
        columns: table.columns,
        rows: table.rows,
      });
      dirty.current = false;
      setStatus("saved");
    }, 650);
    return () => clearTimeout(timer);
  }, [table]);

  const columns = table?.columns ?? [];
  const rows = table?.rows ?? [];

  const setCell = (rowId, columnId, value) =>
    patch({
      rows: rows.map((row) =>
        row.id === rowId ? { ...row, cells: { ...(row.cells || {}), [columnId]: value } } : row
      ),
    });

  const addRow = () => patch({ rows: [...rows, { id: uid("row"), cells: {} }] });
  const deleteRow = (rowId) => patch({ rows: rows.filter((row) => row.id !== rowId) });
  const renameColumn = (columnId, name) =>
    patch({ columns: columns.map((column) => (column.id === columnId ? { ...column, name } : column)) });

  const deleteColumn = (columnId) =>
    patch({
      columns: columns.filter((column) => column.id !== columnId),
      rows: rows.map((row) => {
        const cells = { ...(row.cells || {}) };
        delete cells[columnId];
        return { ...row, cells };
      }),
    });

  const addColumn = () => {
    const name = draft.name.trim() || "Field";
    const target = tables.find((item) => item.id === draft.targetTableId);
    const column = makeColumn(name, draft.type, {
      options: draft.options
        .split(",")
        .map((option) => option.trim())
        .filter(Boolean),
      targetTableId: target?.id ?? "",
      targetTableName: target?.name ?? "",
    });
    patch({ columns: [...columns, column] });
    setDraft({ name: "", type: "text", options: "", targetTableId: "" });
    setAdding(false);
  };

  if (loading) {
    return (
      <div className="nb-shell min-h-screen">
        <VaultHeader />
        <div className="mx-auto max-w-[1180px] px-5 py-8 sm:px-6">
          <div className="h-64 animate-pulse rounded-xl border border-border/60 bg-card/30" />
        </div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="nb-shell min-h-screen">
        <VaultHeader />
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <p className="font-display text-[26px]">{t("vault.tables.emptyState")}</p>
          <Link to="/tables" className="mt-4 inline-block font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
            {t("vault.tables.backToTables")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="nb-shell min-h-screen">
      <VaultHeader />
      <main className="mx-auto max-w-[1180px] px-4 pb-16 pt-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/tables"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label={t("vault.tables.backToTables")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <input
            value={table.name}
            onChange={(event) => patch({ name: event.target.value })}
            aria-label={t("vault.tables.tableName")}
            className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-1 font-display text-[22px] tracking-tight text-foreground outline-none transition hover:border-border/60 focus:border-primary/40"
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {t(`vault.tables.status.${status}`)}
          </span>
          <div className="inline-flex rounded-lg border border-border/80 bg-card/50 p-0.5">
            {VIEWS.map(({ id: viewId, labelKey, icon: Icon }) => (
              <button
                key={viewId}
                type="button"
                onClick={() => setView(viewId)}
                aria-pressed={view === viewId}
                className={cn(
                  "flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 font-mono text-[10.5px] transition",
                  view === viewId ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{t(labelKey)}</span>
              </button>
            ))}
          </div>
          <Button
            onClick={() => setAdding((open) => !open)}
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg border-border/80 px-3 text-[12.5px]"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("vault.tables.addColumn")}
          </Button>
          <FocusToggle />
        </div>

        {adding && (
          <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-border/70 bg-card/40 p-3">
            <label className="flex-1 basis-[160px]">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">name</span>
              <input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder={t("vault.tables.priorityPlaceholder")}
                className="mt-1 h-9 w-full rounded-lg border border-border/80 bg-background/60 px-2.5 text-[13px] text-foreground outline-none focus:border-primary/40"
              />
            </label>
            <label className="basis-[130px]">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">type</span>
              <Select value={draft.type} onValueChange={(type) => setDraft({ ...draft, type })}>
                <SelectTrigger className="mt-1 h-9 w-full rounded-lg border border-border/80 bg-background/60 px-2 text-[13px] text-foreground outline-none focus:border-primary/40">
                  <SelectValue placeholder={t("vault.tables.typePlaceholder")} />
                </SelectTrigger>
                <SelectContent position="popper">
                  {COLUMN_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {t(`vault.tables.columnTypes.${type.id}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            {draft.type === "select" && (
              <label className="flex-1 basis-[180px]">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">options</span>
                <input
                  value={draft.options}
                  onChange={(event) => setDraft({ ...draft, options: event.target.value })}
                  placeholder={t("vault.tables.optionsPlaceholder")}
                  className="mt-1 h-9 w-full rounded-lg border border-border/80 bg-background/60 px-2.5 text-[13px] text-foreground outline-none focus:border-primary/40"
                />
              </label>
            )}
            {draft.type === "relation" && (
              <label className="flex-1 basis-[180px]">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">links to</span>
                <Select value={draft.targetTableId} onValueChange={(targetTableId) => setDraft({ ...draft, targetTableId })}>
                  <SelectTrigger className="mt-1 h-9 w-full rounded-lg border border-border/80 bg-background/60 px-2 text-[13px] text-foreground outline-none focus:border-primary/40">
                    <SelectValue placeholder={t("vault.tables.tablePickerPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="">{t("vault.tables.tablePickerPlaceholder")}</SelectItem>
                    {tables.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            )}
            <Button onClick={addColumn} size="sm" className="h-9 rounded-lg bg-primary px-3 text-[12.5px] text-primary-foreground hover:bg-primary/90">
              {t("vault.tables.addButton")}
            </Button>
          </div>
        )}

        <div className="mt-4">
          {view === "table" ? (
            <TableGrid
              columns={columns}
              rows={rows}
              tables={tables}
              onCell={setCell}
              onRenameColumn={renameColumn}
              onDeleteColumn={deleteColumn}
              onDeleteRow={deleteRow}
              t={t}
            />
          ) : view === "board" ? (
            <BoardView columns={columns} rows={rows} onCell={setCell} t={t} />
          ) : (
            <GalleryView columns={columns} rows={rows} t={t} />
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            onClick={addRow}
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg border-border/80 px-3 text-[12.5px]"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("vault.tables.addRow")}
          </Button>
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <Rows3 className="h-3 w-3" />
            {t("vault.tables.stats", { rows: localDigits(rows.length), fields: localDigits(columns.length) })}
          </span>
        </div>
      </main>
    </div>
  );
}