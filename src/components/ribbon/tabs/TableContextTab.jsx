import { useRef } from "react";
import {
  ArrowDownAZ, ArrowLeft, ArrowLeftRight, ArrowRight, ArrowUpAZ, ArrowUp, ArrowDown, CopyPlus,
  Sigma, TableProperties, Wand2, Download, Eraser, FileSpreadsheet,
} from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import TablePicker from "@/components/ribbon/TablePicker";
import TableTools from "@/components/ribbon/TableTools";
import { Btn, MenuItem, MenuLabel, RibbonMenu, useRibbon } from "@/components/ribbon/RibbonKit";
import { copyText } from "@/lib/editor-bridge";
import { tableAt } from "@/lib/ribbon-actions";
import { delimitedToMarkdown, selectionToTable, tableExtra, tableToCsv } from "@/lib/table-extras";
import { insertBlock } from "@/lib/format-actions";
import { tableInsert } from "@/lib/ribbon-actions";
import { shortcutLabel } from "@/lib/shortcuts";

/* --------------------------------- Table (Contextual) ---------------------------------- */

export function TableContextTab({ signals, shortcuts }) {
  const { selection, run, value, markdown, offReason, body, onChange } = useRibbon();
  const fileRef = useRef(null);
  const inTable = Boolean(tableAt(value, selection.start));
  const need = "Put the cursor inside a table first.";
  const op = (name) => (s) => tableExtra(s, name);
  const t = (props) => ({ disabled: !inTable, disabledReason: need, ...props });

  const importCsv = async (file) => {
    if (!file) return;
    const text = await file.text();
    const md = delimitedToMarkdown(text);
    if (md) run(insertBlock(selection, md));
  };

  return (
    <>
      <RibbonGroup label="Insert">
        <TablePicker
          id="insert.table"
          onInsert={(rows, columns) => run(tableInsert(selection, rows, columns))}
          disabled={!markdown}
          disabledReason={offReason}
          shortcut={shortcutLabel(shortcuts.table)}
          openSignal={signals.table}
        />
        <Btn
          id="table.fromCsv"
          icon={FileSpreadsheet}
          label="From CSV file"
          hint="Insert a .csv or .tsv file as a table"
          onClick={() => fileRef.current?.click()}
        />
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
          className="hidden"
          onChange={(event) => {
            importCsv(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </RibbonGroup>

      <RibbonGroup label="Table tools">
        <TableTools body={body} onChange={onChange} />
      </RibbonGroup>

      <RibbonGroup label="Arrange">
        <Btn {...t({ id: "table.sortAsc", icon: ArrowDownAZ, label: "Sort A–Z", hint: "Sort the rows by the column under the cursor (numbers by value)", edit: op("sort-asc") })} />
        <Btn {...t({ id: "table.sortDesc", icon: ArrowUpAZ, label: "Sort Z–A", hint: "Sort the rows in reverse", edit: op("sort-desc") })} />
        <Btn {...t({ id: "table.moveRowUp", icon: ArrowUp, label: "Row up", hint: "Move this row up", edit: op("row-up") })} />
        <Btn {...t({ id: "table.moveRowDown", icon: ArrowDown, label: "Row down", hint: "Move this row down", edit: op("row-down") })} />
        <Btn {...t({ id: "table.moveColLeft", icon: ArrowLeft, label: "Col left", hint: "Move this column left", edit: op("column-left") })} />
        <Btn {...t({ id: "table.moveColRight", icon: ArrowRight, label: "Col right", hint: "Move this column right", edit: op("column-right") })} />
        <Btn {...t({ id: "table.duplicateRow", icon: CopyPlus, label: "Duplicate row", hint: "Copy this row below itself", edit: op("duplicate-row") })} />
        <Btn {...t({ id: "table.transpose", icon: ArrowLeftRight, label: "Transpose", hint: "Swap rows and columns", edit: op("transpose") })} />
      </RibbonGroup>

      <RibbonGroup label="Data">
        <Btn {...t({ id: "table.sumRow", icon: Sigma, label: "Sum row", hint: "Add a Total row summing the numeric columns", edit: op("totals-sum") })} />
        <Btn {...t({ id: "table.averageRow", icon: Sigma, label: "Average row", hint: "Add an Average row", edit: op("totals-average") })} />
        <Btn {...t({ id: "table.clearCells", icon: Eraser, label: "Clear cells", hint: "Empty every data cell, keep the header", edit: op("clear-cells") })} />
        <Btn {...t({ id: "table.tidy", icon: Wand2, label: "Tidy up", hint: "Align the | marks so the table is easy to read as text", edit: op("prettify") })} />
      </RibbonGroup>

      <RibbonGroup label="Convert">
        <RibbonMenu id="table.textToTable" icon={TableProperties} label="Text → table" hint="Turn the selected CSV / TSV lines into a table" width={200}>
          {(close) => (
            <>
              <MenuLabel>Separator</MenuLabel>
              {[
                ["", "Detect automatically"],
                [",", "Comma"],
                ["\t", "Tab"],
                [";", "Semicolon"],
                ["|", "Pipe"],
              ].map(([sep, label]) => (
                <MenuItem
                  key={label}
                  onClick={() => {
                    run(selectionToTable(selection, sep || undefined));
                    close();
                  }}
                >
                  {label}
                </MenuItem>
              ))}
            </>
          )}
        </RibbonMenu>
        <Btn {...t({ id: "table.copyCsv", icon: Download, label: "Copy as CSV", hint: "Copy this table as CSV text", onClick: () => copyText(tableToCsv(selection) || "") })} />
      </RibbonGroup>
    </>
  );
}