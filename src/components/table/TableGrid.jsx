import { Trash2, X } from "lucide-react";
import { findTable, rowLabel } from "@/lib/table";

const TYPE_BADGE = {
  text: "txt",
  number: "num",
  select: "sel",
  date: "date",
  checkbox: "chk",
  relation: "rel",
};

function CellInput({ column, value, tables, onChange }) {
  const base =
    "w-full rounded px-1.5 py-1 text-[12.5px] text-foreground outline-none transition focus:bg-accent/50 focus:ring-1 focus:ring-primary/30 bg-transparent";

  if (column.type === "checkbox") {
    return (
      <div className="flex items-center justify-center py-1">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="h-3.5 w-3.5 cursor-pointer accent-primary"
        />
      </div>
    );
  }

  if (column.type === "select") {
    return (
      <select value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={`${base} cursor-pointer appearance-none`}>
        <option value="">—</option>
        {(column.options || []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (column.type === "relation") {
    const target = findTable(tables, column.targetTableId);
    const rows = target?.rows ?? [];
    return (
      <select value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={`${base} cursor-pointer appearance-none`}>
        <option value="">—</option>
        {rows.map((row) => (
          <option key={row.id} value={row.id}>
            {rowLabel(target, row)}
          </option>
        ))}
      </select>
    );
  }

  if (column.type === "number") {
    return (
      <input
        type="number"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className={base}
        placeholder="0"
      />
    );
  }

  if (column.type === "date") {
    return <input type="date" value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={base} />;
  }

  return (
    <input
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      className={base}
      placeholder="—"
    />
  );
}

export default function TableGrid({ columns, rows, tables, onCell, onRenameColumn, onDeleteColumn, onDeleteRow }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/70 bg-card/30">
      <table className="w-full min-w-[620px] border-collapse">
        <thead>
          <tr>
            <th className="w-9 border-b border-border/70 px-2 py-2 text-left font-mono text-[10px] font-normal text-muted-foreground">
              #
            </th>
            {columns.map((column) => (
              <th key={column.id} className="min-w-[168px] border-b border-border/70 px-1 py-1.5 text-left font-normal">
                <div className="flex items-center gap-1">
                  <input
                    value={column.name}
                    onChange={(event) => onRenameColumn(column.id, event.target.value)}
                    aria-label={`Rename ${column.name}`}
                    className="min-w-0 flex-1 rounded bg-transparent px-1 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground outline-none transition hover:bg-accent/40 focus:bg-accent/60 focus:text-foreground"
                  />
                  <span className="shrink-0 rounded border border-border/70 px-1 font-mono text-[9px] text-muted-foreground/70">
                    {TYPE_BADGE[column.type] || "txt"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteColumn(column.id)}
                    aria-label={`Delete ${column.name} column`}
                    className="grid h-5 w-5 shrink-0 place-items-center rounded text-muted-foreground/40 transition hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </th>
            ))}
            <th className="w-9 border-b border-border/70" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id} className="group">
              <td className="border-b border-border/40 px-2 py-1 font-mono text-[10px] text-muted-foreground">{index + 1}</td>
              {columns.map((column) => (
                <td key={column.id} className="border-b border-border/40 px-1 py-0.5 align-middle">
                  <CellInput
                    column={column}
                    value={row.cells?.[column.id]}
                    tables={tables}
                    onChange={(value) => onCell(row.id, column.id, value)}
                  />
                </td>
              ))}
              <td className="border-b border-border/40 px-1 text-center">
                <button
                  type="button"
                  onClick={() => onDeleteRow(row.id)}
                  aria-label="Delete row"
                  className="grid h-6 w-6 place-items-center rounded text-muted-foreground/40 opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={(columns.length || 1) + 2} className="px-3 py-10 text-center text-[13px] text-muted-foreground">
                No rows yet — add the first one below.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}