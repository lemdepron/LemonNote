import { useRef, useState } from "react";
import {
  ArrowDownAZ, ArrowLeft, ArrowRight, ArrowUpAZ, ArrowUp, ArrowDown, CopyPlus,
  Sigma, TableProperties, Wand2, Download, Eraser, FileSpreadsheet, Upload, FileX,
  RotateCw,
} from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import TablePicker from "@/components/ribbon/TablePicker";
import TableTools from "@/components/ribbon/TableTools";
import { Btn, MenuItem, MenuLabel, RibbonMenu, useRibbon } from "@/components/ribbon/RibbonKit";
import { copyText } from "@/lib/editor-bridge";
import { tableAt } from "@/lib/ribbon-actions";
import { selectionToTable, tableExtra, tableToCsv } from "@/lib/table-extras";
import { insertBlock } from "@/lib/format-actions";
import { tableInsert } from "@/lib/ribbon-actions";
import { shortcutLabel } from "@/lib/shortcuts";
import { importCsvFile, importXlsxFile, exportTableToXlsx, exportTableToCsv, downloadBlob } from "@/lib/table-import-export";
import { toast } from "@/lib/toast";

/* --------------------------------- Table (Contextual) ---------------------------------- */

export function TableContextTab({ signals, shortcuts }) {
  const { selection, run, value, markdown, offReason, body, onChange } = useRibbon();
  const fileRef = useRef(null);
  const xlsxRef = useRef(null);
  const inTable = Boolean(tableAt(value, selection.start));
  const need = "Put the cursor inside a table first.";
  const op = (name) => (s) => tableExtra(s, name);
  const t = (props) => ({ disabled: !inTable, disabledReason: need, ...props });

  const [xlsxSheets, setXlsxSheets] = useState(null);
  const [importingXlsx, setImportingXlsx] = useState(false);

  const importCsv = async (file) => {
    if (!file) return;
    try {
      const md = await importCsvFile(file);
      run(insertBlock(selection, md));
    } catch (err) {
      toast.error(`Import failed: ${err.message}`);
    }
  };

  const handleXlsxSelect = async (file) => {
    if (!file) return;
    setImportingXlsx(true);
    try {
      const result = await importXlsxFile(file);
      if (result.sheets) {
        // Multiple sheets - show picker
        setXlsxSheets({ file, sheets: result.sheets });
      } else if (result.markdown) {
        run(insertBlock(selection, result.markdown));
        if (result.sheets && result.sheets.length > 1) {
          toast.info(`Imported from sheet (${MAX_ROWS} row limit).`);
        }
      }
    } catch (err) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setImportingXlsx(false);
      if (xlsxRef.current) xlsxRef.current.value = "";
    }
  };

  const importXlsxSheet = async (sheetName) => {
    if (!xlsxSheets) return;
    setImportingXlsx(true);
    try {
      const result = await importXlsxFile(xlsxSheets.file, sheetName);
      if (result.markdown) {
        run(insertBlock(selection, result.markdown));
        toast.success(`Imported "${sheetName}" (${MAX_ROWS} row limit).`);
      }
    } catch (err) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setImportingXlsx(false);
      setXlsxSheets(null);
    }
  };

  const exportXlsx = async () => {
    if (!inTable) return;
    try {
      const blob = await exportTableToXlsx(selection);
      downloadBlob(blob, "table.xlsx");
      toast.success("Exported as .xlsx");
    } catch (err) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  const exportCsv = async () => {
    if (!inTable) return;
    try {
      const blob = await exportTableToCsv(selection);
      downloadBlob(blob, "table.csv");
      toast.success("Exported as .csv");
    } catch (err) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  return (
    <>
      {/* Sheet picker modal for multi-sheet .xlsx */}
      {xlsxSheets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setXlsxSheets(null)}>
          <div className="bg-card border border-border rounded-xl p-4 w-[320px] max-h-[60vh] overflow-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-medium mb-3">Choose sheet to import</h3>
            <p className="text-[12px] text-muted-foreground mb-3">File has {xlsxSheets.sheets.length} sheet{ xlsxSheets.sheets.length > 1 ? "s" : "" }. Pick one:</p>
            <div className="space-y-1">
              {xlsxSheets.sheets.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => importXlsxSheet(name)}
                  disabled={importingXlsx}
                  className="w-full text-left px-3 py-2 rounded-md text-[13px] hover:bg-accent transition disabled:opacity-50 border border-border/60"
                >
                  {name}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setXlsxSheets(null)}
              className="mt-3 w-full py-2 text-[12px] text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
          label="From CSV/TSV"
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
        <Btn
          id="table.fromXlsx"
          icon={Upload}
          label="From Excel (.xlsx)"
          hint="Insert from an Excel workbook — choose sheet if multiple"
          onClick={() => xlsxRef.current?.click()}
        />
        <input
          ref={xlsxRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(event) => {
            handleXlsxSelect(event.target.files?.[0]);
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
        <Btn {...t({ id: "table.transpose", icon: RotateCw, label: "Transpose", hint: "Swap rows and columns", edit: op("transpose") })} />
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

      {inTable && (
        <RibbonGroup label="Export">
          <Btn
            id="table.exportXlsx"
            icon={FileX}
            label="Excel (.xlsx)"
            hint="Export this table as .xlsx"
            onClick={exportXlsx}
          />
          <Btn
            id="table.exportCsv"
            icon={FileSpreadsheet}
            label="CSV (.csv)"
            hint="Export this table as .csv"
            onClick={exportCsv}
          />
        </RibbonGroup>
      )}
    </>
  );
}

const MAX_ROWS = 5000;