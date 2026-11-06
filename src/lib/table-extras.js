/**
 * Table operations beyond the basics in ribbon-actions.js. They work on the
 * markdown table under the caret and return the same edit shape.
 */
import { tableAt } from "@/lib/ribbon-actions";

function make(value, start, end, text, caret) {
  return { next: `${value.slice(0, start)}${text}${value.slice(end)}`, start, end, text, caret };
}

const isNumeric = (cell) => cell !== "" && Number.isFinite(Number(String(cell).replace(/,/g, "").replace(/[$€£%\s]/g, "")));
const toNumber = (cell) => Number(String(cell).replace(/,/g, "").replace(/[$€£%\s]/g, ""));

/** Renders rows as an aligned markdown table (the separator row keeps its alignment marks). */
export function renderTable(rows, { pretty = false } = {}) {
  const widths = rows[0].map((_, c) => Math.max(3, ...rows.map((row, r) => (pretty || r !== 1 ? String(row[c] ?? "").length : 3))));
  return rows
    .map((row, r) => {
      const cells = row.map((cell, c) => {
        const text = String(cell ?? "");
        if (r === 1) {
          const left = text.startsWith(":");
          const right = text.endsWith(":");
          const w = pretty ? widths[c] : 3;
          const dashes = "-".repeat(Math.max(1, w - (left ? 1 : 0) - (right ? 1 : 0)));
          return `${left ? ":" : ""}${dashes}${right ? ":" : ""}`;
        }
        return pretty ? text.padEnd(widths[c], " ") : text || "  ";
      });
      return `| ${cells.join(" | ")} |`;
    })
    .join("\n");
}

function replaceBlock(selection, block, rows, caretRow, caretColumn, pretty) {
  const text = renderTable(rows, { pretty });
  const lines = text.split("\n");
  const row = Math.min(Math.max(caretRow, 0), lines.length - 1);
  let offset = 0;
  for (let i = 0; i < row; i += 1) offset += lines[i].length + 1;
  let seen = 0;
  let at = lines[row].length;
  for (let i = 0; i < lines[row].length; i += 1) {
    if (lines[row][i] === "|") {
      seen += 1;
      if (seen === caretColumn + 1) {
        at = i + 1;
        while (lines[row][at] === " ") at += 1;
        break;
      }
    }
  }
  return make(selection.value, block.start, block.end, text, block.start + offset + at);
}

export const TABLE_EXTRA_OPS = [
  "sort-asc",
  "sort-desc",
  "row-up",
  "row-down",
  "column-left",
  "column-right",
  "duplicate-row",
  "clear-cells",
  "prettify",
  "totals-sum",
  "totals-average",
  "transpose",
];

export function tableExtra(selection, op) {
  const block = tableAt(selection.value, selection.start);
  if (!block) return null;
  const rows = block.rows.map((row) => [...row]);
  const data = rows.slice(2);
  const col = block.column;
  let caretRow = block.rowIndex;
  let caretColumn = col;
  let pretty = false;

  switch (op) {
    case "sort-asc":
    case "sort-desc": {
      const dir = op === "sort-asc" ? 1 : -1;
      const numeric = data.length > 0 && data.every((row) => !row[col] || isNumeric(row[col]));
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
      data.sort((a, b) =>
        numeric ? dir * ((toNumber(a[col] || "0") || 0) - (toNumber(b[col] || "0") || 0)) : dir * collator.compare(a[col] || "", b[col] || "")
      );
      rows.splice(2, rows.length - 2, ...data);
      caretRow = 2;
      break;
    }
    case "row-up": {
      if (block.rowIndex <= 2) return null;
      [rows[block.rowIndex - 1], rows[block.rowIndex]] = [rows[block.rowIndex], rows[block.rowIndex - 1]];
      caretRow = block.rowIndex - 1;
      break;
    }
    case "row-down": {
      if (block.rowIndex < 2 || block.rowIndex >= rows.length - 1) return null;
      [rows[block.rowIndex + 1], rows[block.rowIndex]] = [rows[block.rowIndex], rows[block.rowIndex + 1]];
      caretRow = block.rowIndex + 1;
      break;
    }
    case "column-left":
    case "column-right": {
      const to = op === "column-left" ? col - 1 : col + 1;
      if (to < 0 || to >= block.width) return null;
      rows.forEach((row) => {
        [row[col], row[to]] = [row[to], row[col]];
      });
      caretColumn = to;
      break;
    }
    case "duplicate-row": {
      if (block.rowIndex < 2) return null;
      rows.splice(block.rowIndex + 1, 0, [...rows[block.rowIndex]]);
      caretRow = block.rowIndex + 1;
      break;
    }
    case "clear-cells": {
      for (let r = 2; r < rows.length; r += 1) rows[r] = rows[r].map(() => "");
      caretRow = 2;
      caretColumn = 0;
      break;
    }
    case "prettify":
      pretty = true;
      break;
    case "totals-sum":
    case "totals-average": {
      const label = op === "totals-sum" ? "**Total**" : "**Average**";
      const totals = Array.from({ length: block.width }, (_, c) => {
        if (c === 0) return label;
        const nums = data.map((row) => row[c]).filter((cell) => cell && isNumeric(cell)).map(toNumber);
        if (!nums.length) return "";
        const sum = nums.reduce((a, b) => a + b, 0);
        const value = op === "totals-sum" ? sum : sum / nums.length;
        return String(Math.round(value * 1e6) / 1e6);
      });
      rows.push(totals);
      caretRow = rows.length - 1;
      caretColumn = 0;
      break;
    }
    case "transpose": {
      const body = [rows[0], ...data];
      const transposed = body[0].map((_, c) => body.map((row) => row[c] ?? ""));
      const header = transposed[0];
      const sep = header.map(() => "---");
      rows.length = 0;
      rows.push(header, sep, ...transposed.slice(1));
      caretRow = 0;
      caretColumn = 0;
      break;
    }
    default:
      return null;
  }
  return replaceBlock(selection, block, rows, caretRow, caretColumn, pretty);
}

/** The table under the caret as CSV text (cells containing commas or quotes are quoted). */
export function tableToCsv(selection) {
  const block = tableAt(selection.value, selection.start);
  if (!block) return null;
  const esc = (cell) => (/[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell);
  return block.rows
    .filter((_, index) => index !== 1)
    .map((row) => row.map(esc).join(","))
    .join("\n");
}

function splitDelimited(line, delimiter) {
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
    else if (ch === delimiter) {
      cells.push(cell.trim());
      cell = "";
    } else cell += ch;
  }
  cells.push(cell.trim());
  return cells;
}

/** Turns CSV / TSV / semicolon-separated text into a markdown table. */
export function delimitedToMarkdown(text, delimiter) {
  const lines = String(text || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((line) => line.trim());
  if (lines.length < 1) return null;
  const guess =
    delimiter ||
    ["\t", ";", ",", "|"].map((d) => [d, lines[0].split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = lines.map((line) => splitDelimited(line, guess).map((cell) => cell.replace(/\|/g, "\\|")));
  const width = Math.max(...rows.map((row) => row.length));
  if (width < 2) return null;
  rows.forEach((row) => {
    while (row.length < width) row.push("");
  });
  const [head, ...body] = rows;
  return renderTable([head, Array.from({ length: width }, () => "---"), ...(body.length ? body : [Array.from({ length: width }, () => "")])]);
}

/** Replaces the selected lines (CSV / TSV text) with a markdown table. */
export function selectionToTable(selection, delimiter) {
  const { value, start, end } = selection;
  if (start === end) return null;
  const table = delimitedToMarkdown(value.slice(start, end), delimiter);
  if (!table) return null;
  return make(value, start, end, table, start + table.length);
}
