import { useEffect, useState } from "react";
import { Table } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import RibbonButton from "@/components/ribbon/RibbonButton";
import { MAX_TABLE_COLUMNS, MAX_TABLE_ROWS } from "@/lib/ribbon-actions";
import { cn } from "@/lib/utils";

const START = { rows: 10, columns: 8 };
const LIMIT = { rows: 20, columns: 24 };

const FIELD =
  "mt-1 h-8 w-full rounded-md border border-border/80 bg-background/60 px-2 text-[12.5px] text-foreground outline-none focus:border-primary/40";

export default function TablePicker({ id, onInsert, disabled, disabledReason, shortcut, openSignal }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [grid, setGrid] = useState(START);
  const [hover, setHover] = useState({ rows: 3, columns: 3 });

  useEffect(() => {
    if (openSignal) setOpen(true);
  }, [openSignal]);

  if (disabled) {
    return (
      <RibbonButton
        id={id}
        icon={Table}
        label="Table"
        hint="Insert a table"
        shortcut={shortcut}
        disabled
        disabledReason={disabledReason}
      />
    );
  }

  const tooManyRows = rows > MAX_TABLE_ROWS;
  const tooManyColumns = columns > MAX_TABLE_COLUMNS;
  const problem = tooManyRows
    ? `Tables hold up to ${MAX_TABLE_ROWS} rows — anything below that works.`
    : tooManyColumns
      ? `Tables hold up to ${MAX_TABLE_COLUMNS} columns — anything below that works.`
      : "";
  const valid = !problem && rows >= 1 && columns >= 1;

  const grow = (rowIndex, columnIndex) => {
    setHover({ rows: rowIndex + 1, columns: columnIndex + 1 });
    setGrid((current) => ({
      rows: rowIndex + 1 >= current.rows ? Math.min(LIMIT.rows, current.rows + 4) : current.rows,
      columns: columnIndex + 1 >= current.columns ? Math.min(LIMIT.columns, current.columns + 4) : current.columns,
    }));
  };

  const insert = (rowCount, columnCount) => {
    onInsert(rowCount, columnCount);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <RibbonButton
          id={id}
          icon={Table}
          label="Table"
          hint="Insert a table — hover the grid or type a size"
          shortcut={shortcut}
          keepFocus={false}
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[268px] p-3">
        <p className="nb-label">table size</p>

        <div className="mt-2 grid grid-cols-[repeat(8,1fr)] gap-[3px]" onMouseLeave={() => setHover({ rows: 3, columns: 3 })}>
          {Array.from({ length: grid.rows }).map((_, rowIndex) =>
            Array.from({ length: grid.columns }).map((__, columnIndex) => (
              <button
                key={`${rowIndex}-${columnIndex}`}
                type="button"
                aria-label={`${rowIndex + 1} rows, ${columnIndex + 1} columns`}
                onMouseEnter={() => grow(rowIndex, columnIndex)}
                onClick={() => insert(rowIndex + 1, columnIndex + 1)}
                className={cn(
                  "h-[11px] w-full rounded-[2px] border transition",
                  rowIndex < hover.rows && columnIndex < hover.columns
                    ? "border-primary/60 bg-primary/45"
                    : "border-border/70 bg-card/60"
                )}
              />
            ))
          )}
        </div>
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
          {hover.rows} × {hover.columns} · first row is the header
        </p>

        <div className="mt-2 flex items-end gap-2">
          <label className="flex-1">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">rows</span>
            <input
              type="number"
              min={1}
              max={MAX_TABLE_ROWS}
              value={rows}
              onChange={(event) => setRows(Number(event.target.value))}
              className={cn(FIELD, tooManyRows && "border-destructive/60")}
            />
          </label>
          <label className="flex-1">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">columns</span>
            <input
              type="number"
              min={1}
              max={MAX_TABLE_COLUMNS}
              value={columns}
              onChange={(event) => setColumns(Number(event.target.value))}
              className={cn(FIELD, tooManyColumns && "border-destructive/60")}
            />
          </label>
        </div>

        {problem && <p className="mt-1.5 text-[11px] leading-snug text-destructive">{problem}</p>}

        <button
          type="button"
          disabled={!valid}
          onClick={() => insert(rows, columns)}
          className="mt-2.5 h-7 w-full rounded-md bg-primary px-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
        >
          Insert {rows || 0} × {columns || 0}
        </button>
      </PopoverContent>
    </Popover>
  );
}