/**
 * Table import/export for .xlsx and .csv files.
 * Uses read-excel-file / write-excel-file (actively maintained, small bundle).
 * Dynamic imports keep the main bundle small — libraries load only when used.
 */

const MAX_ROWS = 5000;

/**
 * Read a .csv or .tsv file as text and convert to markdown table.
 * Reuses the existing delimitedToMarkdown from table-extras.
 */
export async function importCsvFile(file) {
  const { delimitedToMarkdown } = await import("@/lib/table-extras");
  const text = await file.text();
  const md = delimitedToMarkdown(text);
  if (!md) throw new Error("Could not parse CSV/TSV — no data found.");
  return md;
}

/**
 * Read an .xlsx file and return markdown table from the first sheet (or chosen sheet).
 * Returns { markdown, sheets } where sheets is array of { name, markdown } for the picker.
 */
export async function importXlsxFile(file, sheetName) {
  const readXlsxFile = (await import("read-excel-file/browser")).default;

  // First, get sheet names if no sheet specified
  if (!sheetName) {
    const sheets = await readXlsxFile(file, { getSheets: true });
    const sheetNames = sheets.map((s) => s.name);
    if (sheetNames.length === 0) throw new Error("Workbook has no sheets.");
    // Return sheet list for picker UI
    return { sheets: sheetNames };
  }

  // Read the chosen sheet
  const rows = await readXlsxFile(file, { sheet: sheetName });
  if (!rows.length) throw new Error(`Sheet "${sheetName}" is empty.`);
  if (rows.length > MAX_ROWS) {
    rows.length = MAX_ROWS;
  }

  // Convert to markdown table
  const { renderTable } = await import("@/lib/table-extras");
  const width = Math.max(...rows.map((r) => r.length));
  const normalized = rows.map((row) => {
    const arr = [...row];
    while (arr.length < width) arr.push("");
    return arr.map((cell) => String(cell ?? "").replace(/\|/g, "\\|"));
  });
  const [head, ...body] = normalized;
  const md = renderTable([
    head,
    Array.from({ length: width }, () => "---"),
    ...(body.length ? body : [Array.from({ length: width }, () => "")]),
  ]);
  return { markdown: md, sheets: null };
}

/**
 * Export a markdown table (from the cursor position) to .xlsx file.
 * Returns a Blob ready for download.
 */
export async function exportTableToXlsx(selection) {
  const { tableToCsv } = await import("@/lib/table-extras");
  const writeXlsxFile = (await import("write-excel-file/browser")).default;

  const csv = tableToCsv(selection);
  if (!csv) throw new Error("No table at cursor position.");

  // Parse CSV back to rows
  const rows = csv.split("\n").map((line) => {
    const cells = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else if (ch === '"') quoted = false;
        else cell += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ",") {
        cells.push(cell);
        cell = "";
      } else cell += ch;
    }
    cells.push(cell);
    return cells;
  });

  const blob = await writeXlsxFile(rows, { sheet: "Table" });
  return blob;
}

/**
 * Export a markdown table (from the cursor position) to .csv file.
 * Returns a Blob ready for download.
 */
export async function exportTableToCsv(selection) {
  const { tableToCsv } = await import("@/lib/table-extras");
  const csv = tableToCsv(selection);
  if (!csv) throw new Error("No table at cursor position.");
  return new Blob([csv], { type: "text/csv;charset=utf-8" });
}

/**
 * Download a blob as a file.
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}