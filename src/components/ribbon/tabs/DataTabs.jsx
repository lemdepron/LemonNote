import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownAZ, ArrowLeft, ArrowLeftRight, ArrowRight, ArrowUpAZ, BookOpenCheck, CalendarCheck, CalendarClock, CalendarDays, CalendarPlus,
  CalendarRange, CheckCheck, CircleDashed, Clock, Download, Eraser, FileSpreadsheet, ListChecks, ListOrdered, ListRestart,
  Loader2, Sigma, SpellCheck, Table2, TableProperties, Wand2, ArrowUp, ArrowDown, CopyPlus,
  Circle, CircleCheck, Timer, Link as LinkIcon, ClipboardList, Type,
} from "lucide-react";
import { db } from "@/api/localDb";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import TablePicker from "@/components/ribbon/TablePicker";
import TableTools from "@/components/ribbon/TableTools";
import CardComposer from "@/components/ribbon/CardComposer";
import { Btn, MenuItem, MenuLabel, RibbonMenu, RibbonSelect, Stepper, useRibbon } from "@/components/ribbon/RibbonKit";
import { copyText } from "@/lib/editor-bridge";
import { JOURNAL_TEMPLATE, dateKey, shiftDay } from "@/lib/journal";
import {
  DATE_FORMATS, JOURNAL_TEMPLATES, monthKey, monthlyTemplate, neighbourTitle, weekKey, weeklyTemplate,
} from "@/lib/journal-tools";
import { dueDate, insertBlock, taskTool, toggleLinePrefix } from "@/lib/format-actions";
import { insertText, tableAt, tableInsert, toggleTask, taskStatusAt } from "@/lib/ribbon-actions";
import { delimitedToMarkdown, selectionToTable, tableExtra, tableToCsv } from "@/lib/table-extras";
import { countWords } from "@/lib/note-stats";
import { shortcutLabel } from "@/lib/shortcuts";
import { EDITOR_FONTS, WIDTHS } from "@/lib/text-style";

/* --------------------------------- Table ---------------------------------- */

export function TableTab({ signals, shortcuts }) {
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
          onInsert={(rows, columns) => run(tableInsert(selection, rows, columns))}
          disabled={!markdown}
          disabledReason={offReason}
          shortcut={shortcutLabel(shortcuts.table)}
          openSignal={signals.table}
        />
        <Btn
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
        <Btn {...t({ icon: ArrowDownAZ, label: "Sort A–Z", hint: "Sort the rows by the column under the cursor (numbers by value)", edit: op("sort-asc") })} />
        <Btn {...t({ icon: ArrowUpAZ, label: "Sort Z–A", hint: "Sort the rows in reverse", edit: op("sort-desc") })} />
        <Btn {...t({ icon: ArrowUp, label: "Row up", hint: "Move this row up", edit: op("row-up") })} />
        <Btn {...t({ icon: ArrowDown, label: "Row down", hint: "Move this row down", edit: op("row-down") })} />
        <Btn {...t({ icon: ArrowLeft, label: "Col left", hint: "Move this column left", edit: op("column-left") })} />
        <Btn {...t({ icon: ArrowRight, label: "Col right", hint: "Move this column right", edit: op("column-right") })} />
        <Btn {...t({ icon: CopyPlus, label: "Duplicate row", hint: "Copy this row below itself", edit: op("duplicate-row") })} />
        <Btn {...t({ icon: ArrowLeftRight, label: "Transpose", hint: "Swap rows and columns", edit: op("transpose") })} />
      </RibbonGroup>

      <RibbonGroup label="Data">
        <Btn {...t({ icon: Sigma, label: "Sum row", hint: "Add a Total row summing the numeric columns", edit: op("totals-sum") })} />
        <Btn {...t({ icon: Sigma, label: "Average row", hint: "Add an Average row", edit: op("totals-average") })} />
        <Btn {...t({ icon: Eraser, label: "Clear cells", hint: "Empty every data cell, keep the header", edit: op("clear-cells") })} />
        <Btn {...t({ icon: Wand2, label: "Tidy up", hint: "Align the | marks so the table is easy to read as text", edit: op("prettify") })} />
      </RibbonGroup>

      <RibbonGroup label="Convert">
        <RibbonMenu icon={TableProperties} label="Text → table" hint="Turn the selected CSV / TSV lines into a table" width={200}>
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
        <Btn {...t({ icon: Download, label: "Copy as CSV", hint: "Copy this table as CSV text", onClick: () => copyText(tableToCsv(selection) || "") })} />
      </RibbonGroup>
    </>
  );
}

/* --------------------------------- Journal -------------------------------- */

export function JournalTab() {
  const navigate = useNavigate();
  const { selection, run, noteTitle } = useRibbon();
  const [busy, setBusy] = useState("");
  const now = () => new Date();

  const goTo = async (title, template, tag = "journal") => {
    if (busy) return;
    setBusy(title);
    try {
      const found = await db.entities.Note.filter({ title, trashed: { $ne: true } }, { limit: 1 });
      const note = found?.items?.[0] || (await db.entities.Note.create({ title, body: template, tags: [tag] }));
      navigate(`/note/${note.id}`);
    } finally {
      setBusy("");
    }
  };

  const today = dateKey();
  const prev = neighbourTitle(noteTitle, -1);
  const next = neighbourTitle(noteTitle, 1);

  return (
    <>
      <RibbonGroup label="Open a day">
        <Btn icon={busy === today ? Loader2 : CalendarPlus} spinning={busy === today} label="Today" hint="Open or create today's daily note" shortcut="Ctrl+Alt+D" onClick={() => goTo(today, JOURNAL_TEMPLATE)} />
        <Btn icon={CalendarClock} label="Yesterday" hint="Open yesterday's note" onClick={() => goTo(shiftDay(today, -1), JOURNAL_TEMPLATE)} />
        <Btn icon={CalendarCheck} label="Tomorrow" hint="Open or create tomorrow's note" onClick={() => goTo(shiftDay(today, 1), JOURNAL_TEMPLATE)} />
        <Btn
          icon={ArrowLeft}
          label="Previous"
          hint="The day, week or month before this note"
          disabled={!prev}
          disabledReason="This note's title is not a date, week (2026-W45) or month (2026-11)"
          onClick={() => goTo(prev, prev.includes("W") ? weeklyTemplate(prev) : prev.length === 7 ? monthlyTemplate(prev) : JOURNAL_TEMPLATE)}
        />
        <Btn
          icon={ArrowRight}
          label="Next"
          hint="The day, week or month after this note"
          disabled={!next}
          disabledReason="This note's title is not a date, week (2026-W45) or month (2026-11)"
          onClick={() => goTo(next, next.includes("W") ? weeklyTemplate(next) : next.length === 7 ? monthlyTemplate(next) : JOURNAL_TEMPLATE)}
        />
      </RibbonGroup>

      <RibbonGroup label="Periods">
        <Btn icon={CalendarRange} label="This week" hint="Open or create this week's note, e.g. 2026-W45" onClick={() => goTo(weekKey(now()), weeklyTemplate(weekKey(now())))} />
        <Btn icon={CalendarDays} label="This month" hint="Open or create this month's note, e.g. 2026-11" onClick={() => goTo(monthKey(now()), monthlyTemplate(monthKey(now())))} />
      </RibbonGroup>

      <RibbonGroup label="Insert date">
        <Btn icon={CalendarDays} label="Today's date" hint="Insert 2026-11-06 style date" shortcut="Ctrl+Alt+T" edit={(s) => insertText(s, dateKey())} />
        <Btn icon={Clock} label="Time" hint="Insert the current time" edit={(s) => insertText(s, DATE_FORMATS.find((f) => f.id === "time24").make(now()))} />
        <Btn
          icon={ListOrdered}
          label="Log entry"
          hint="Start a new time-stamped log line"
          edit={(s) => insertText(s, `- ${DATE_FORMATS.find((f) => f.id === "time24").make(now())} `)}
        />
        <RibbonMenu icon={CalendarDays} label="Formats" hint="Every date and time format" width={280}>
          {(close) =>
            DATE_FORMATS.map((item) => (
              <MenuItem key={item.id} onClick={() => { run(insertText(selection, item.make(now()))); close(); }}>
                <span>{item.label}</span>
                <span className="font-mono text-[10.5px] text-muted-foreground">{item.make(now())}</span>
              </MenuItem>
            ))
          }
        </RibbonMenu>
        <RibbonMenu icon={LinkIcon} label="Link day" hint="Insert a [[link]] to a day note" width={200}>
          {(close) =>
            [["Today", 0], ["Yesterday", -1], ["Tomorrow", 1], ["In a week", 7], ["A week ago", -7]].map(([label, n]) => (
              <MenuItem key={label} onClick={() => { run(insertText(selection, `[[${shiftDay(today, n)}]]`)); close(); }}>
                <span>{label}</span>
                <span className="font-mono text-[10.5px] text-muted-foreground">{shiftDay(today, n)}</span>
              </MenuItem>
            ))
          }
        </RibbonMenu>
      </RibbonGroup>

      <RibbonGroup label="Templates">
        <Btn icon={BookOpenCheck} label="Daily sections" hint="Insert Notes / Tasks / Log sections at the cursor" edit={(s) => insertBlock(s, JOURNAL_TEMPLATE)} />
        <RibbonMenu icon={ClipboardList} label="Templates" hint="Ready-made journal blocks" width={240}>
          {(close) =>
            JOURNAL_TEMPLATES.map((item) => (
              <MenuItem key={item.id} onClick={() => { run(insertBlock(selection, item.text.replace(/\n$/, ""))); close(); }}>
                {item.label}
              </MenuItem>
            ))
          }
        </RibbonMenu>
      </RibbonGroup>
    </>
  );
}

/* ---------------------------------- Tasks --------------------------------- */

const STATUS = [
  ["TODO", Circle, "Mark the line TODO, or clear it if it already is", "Ctrl+Alt+1"],
  ["DOING", Timer, "Mark the line DOING, or clear it if it already is", "Ctrl+Alt+2"],
  ["DONE", CircleCheck, "Mark the line DONE, or clear it if it already is", "Ctrl+Alt+3"],
];

const CYCLE = { TODO: "DOING", DOING: "DONE", DONE: "TODO" };

const TASK_TEMPLATES = [
  ["Shopping list", "## Shopping\n\n- [ ] \n- [ ] \n- [ ] "],
  ["Project plan", "## Project\n\n### Goal\n\n- \n\n### Tasks\n\n- TODO \n- TODO \n- TODO \n\n### Risks\n\n- "],
  ["Weekly goals", "## This week\n\n- TODO \n- TODO \n- TODO \n\n## Waiting for\n\n- "],
  ["Packing list", "## Packing\n\n- [ ] Documents\n- [ ] Charger\n- [ ] Clothes\n- [ ] Medicines"],
  ["Daily top 3", "## Top 3\n\n- TODO \n- TODO \n- TODO "],
];

export function TasksTab({ signals, shortcuts, body, noteId, noteTitle }) {
  const { selection, run, value, markdown, offReason } = useRibbon();
  const status = taskStatusAt(value, selection.start);
  const [due, setDue] = useState("");
  const tasks = (tool) => (s) => taskTool(s, tool);
  const dayOffset = (n) => shiftDay(dateKey(), n);

  return (
    <>
      <RibbonGroup label="Status">
        {STATUS.map(([id, icon, hint, key]) => (
          <Btn key={id} icon={icon} label={id} hint={hint} shortcut={key} active={status === id} edit={(s) => toggleTask(s, id)} />
        ))}
        <Btn icon={ListRestart} label="Next status" hint="Cycle TODO → DOING → DONE → TODO" edit={(s) => toggleTask(s, CYCLE[taskStatusAt(s.value, s.start)] || "TODO")} />
        <Btn icon={CircleDashed} label="Clear" hint="Remove the status words from the selected lines (or the whole note)" edit={tasks("clear")} />
      </RibbonGroup>

      <RibbonGroup label="Checklist">
        <Btn icon={ListChecks} label="Checkbox" hint="Turn the selected lines into - [ ] checkboxes, or back into plain text" edit={(s) => toggleLinePrefix(s, "check")} />
        <Btn icon={ListOrdered} label="Numbered" hint="Number the selected lines" edit={(s) => toggleLinePrefix(s, "number")} />
      </RibbonGroup>

      <RibbonGroup label="Organise">
        <Btn icon={ArrowDownAZ} label="Sort by status" hint="Doing first, then to-do, then done (selection or whole note)" edit={tasks("sort-status")} />
        <Btn icon={ArrowDown} label="Done last" hint="Move finished tasks to the bottom of their block" edit={tasks("done-last")} />
        <Btn icon={CheckCheck} label="All done" hint="Mark every task DONE (selection or whole note)" edit={tasks("all-done")} />
        <Btn icon={ListRestart} label="Reset all" hint="Mark every task TODO (selection or whole note)" edit={tasks("reset")} />
      </RibbonGroup>

      <RibbonGroup label="Due date">
        <RibbonMenu icon={CalendarClock} label="Due date" hint="Add due:YYYY-MM-DD to the task line (plain text; searchable)" width={230}>
          {(close) => (
            <>
              {[["Today", 0], ["Tomorrow", 1], ["In 3 days", 3], ["Next week", 7]].map(([label, n]) => (
                <MenuItem key={label} onClick={() => { run(dueDate(selection, dayOffset(n))); close(); }}>
                  <span>{label}</span>
                  <span className="font-mono text-[10.5px] text-muted-foreground">{dayOffset(n)}</span>
                </MenuItem>
              ))}
              <div className="flex gap-1 p-1">
                <input
                  type="date"
                  value={due}
                  onChange={(event) => setDue(event.target.value)}
                  className="h-8 flex-1 rounded-md border border-border/80 bg-background/60 px-2 text-[12px] text-foreground outline-none"
                />
                <button
                  type="button"
                  disabled={!due}
                  onClick={() => { run(dueDate(selection, due)); close(); }}
                  className="h-8 rounded-md bg-primary/90 px-2 text-[12px] text-primary-foreground disabled:opacity-40"
                >
                  Set
                </button>
              </div>
              <MenuItem onClick={() => { run(dueDate(selection, null)); close(); }}>Remove due date</MenuItem>
            </>
          )}
        </RibbonMenu>
      </RibbonGroup>

      <RibbonGroup label="Lists">
        <RibbonMenu icon={ClipboardList} label="Templates" hint="Ready-made task lists" width={220}>
          {(close) =>
            TASK_TEMPLATES.map(([label, text]) => (
              <MenuItem key={label} onClick={() => { run(insertBlock(selection, text)); close(); }}>
                {label}
              </MenuItem>
            ))
          }
        </RibbonMenu>
      </RibbonGroup>

      <RibbonGroup label="Cards">
        <CardComposer
          body={body}
          noteId={noteId}
          noteTitle={noteTitle}
          disabled={!markdown}
          disabledReason={offReason}
          shortcut={shortcutLabel(shortcuts.card)}
          openSignal={signals.card}
        />
      </RibbonGroup>
    </>
  );
}

/* ---------------------------------- View ---------------------------------- */

export function ViewTab() {
  const { value, selection, typography: t, setTypography, body } = useRibbon();
  const patch = (next) => setTypography({ ...t, ...next });
  const drop = (key) => {
    const next = { ...t };
    delete next[key];
    setTypography(next);
  };
  const selected = value.slice(selection.start, selection.end);
  const words = countWords(body);
  const lines = body ? body.split("\n").length : 0;
  const readMinutes = Math.max(1, Math.round(words / 220));
  const stat = (label, text) => (
    <div className="flex min-w-[3.6rem] flex-col items-center px-1.5 font-mono">
      <span className="text-[12px] text-foreground">{text}</span>
      <span className="text-[8.5px] uppercase tracking-[0.12em] text-muted-foreground/70">{label}</span>
    </div>
  );

  return (
    <>
      <RibbonGroup label="Reading page">
        <RibbonSelect
          title="Width of the reading column"
          width={104}
          placeholder="Width"
          options={WIDTHS.map((item) => ({ value: item.id, label: item.label }))}
          value={t.width || ""}
          onChange={(value) => (value ? patch({ width: value }) : drop("width"))}
        />
      </RibbonGroup>

      <RibbonGroup label="Editor">
        <RibbonSelect
          title="Font of the writing box"
          width={132}
          placeholder="Editor font"
          options={EDITOR_FONTS.map((item) => ({ value: item.id, label: item.label }))}
          value={t.editorFont || ""}
          onChange={(value) => (value ? patch({ editorFont: value }) : drop("editorFont"))}
        />
        <Stepper title="Editor text size (px)" value={t.editorSize || 14} min={10} max={32} onChange={(editorSize) => patch({ editorSize })} format={(n) => `${n}px`} />
        <Btn
          icon={SpellCheck}
          label="Spell check"
          hint="Underline misspelled words in the writing box"
          active={t.spell !== false}
          disabled={false}
          onClick={() => (t.spell === false ? drop("spell") : patch({ spell: false }))}
        />
      </RibbonGroup>

      <RibbonGroup label="Statistics">
        <div className="flex items-center divide-x divide-border/50">
          {stat("words", words)}
          {stat("chars", body.length)}
          {stat("lines", lines)}
          {stat("read", `${readMinutes} min`)}
          {stat("selected", selected ? countWords(selected) : 0)}
        </div>
      </RibbonGroup>

      <RibbonGroup label="Copy note">
        <Btn icon={Table2} label="As Markdown" hint="Copy the whole note text" onClick={() => copyText(body)} />
        <Btn
          icon={Type}
          label="As plain text"
          hint="Copy the note without markdown symbols"
          onClick={() =>
            copyText(
              body
                .replace(/<\/?[a-z][^>]*>/gi, "")
                .replace(/^#{1,6}\s+/gm, "")
                .replace(/(\*\*|__|~~|`)/g, "")
                .replace(/\[\[([^\]]+)\]\]/g, "$1")
                .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
            )
          }
        />
      </RibbonGroup>
    </>
  );
}

