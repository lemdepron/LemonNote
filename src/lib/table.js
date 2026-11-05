export const COLUMN_TYPES = [
  { id: "text", label: "Text" },
  { id: "number", label: "Number" },
  { id: "select", label: "Select" },
  { id: "date", label: "Date" },
  { id: "checkbox", label: "Checkbox" },
  { id: "relation", label: "Relation" },
];

export const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

export function makeColumn(name, type, extra = {}) {
  return {
    id: uid("col"),
    name,
    type,
    options: type === "select" ? extra.options ?? ["todo", "doing", "done"] : [],
    targetTableId: type === "relation" ? extra.targetTableId ?? "" : "",
    targetTableName: type === "relation" ? extra.targetTableName ?? "" : "",
  };
}

export function makeTable(name = "Untitled table") {
  const title = makeColumn("Name", "text");
  const status = makeColumn("Status", "select");
  const done = makeColumn("Done", "checkbox");

  const rows = [
    { id: uid("row"), cells: { [title.id]: "Draft the vault index", [status.id]: "doing", [done.id]: false } },
    { id: uid("row"), cells: { [title.id]: "Wire backlinks panel", [status.id]: "done", [done.id]: true } },
    { id: uid("row"), cells: { [title.id]: "Prototype canvas cards", [status.id]: "todo", [done.id]: false } },
  ];

  return { name, columns: [title, status, done], rows };
}

export function labelColumn(table) {
  return table?.columns?.find((column) => column.type === "text" || column.type === "number") || table?.columns?.[0];
}

export function rowLabel(table, row) {
  const column = labelColumn(table);
  const value = column ? row?.cells?.[column.id] : "";
  return value === undefined || value === null || value === "" ? "Untitled row" : String(value);
}

export function findTable(tables, id) {
  return tables?.find((table) => table.id === id);
}