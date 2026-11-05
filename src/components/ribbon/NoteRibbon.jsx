import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, CalendarPlus, Circle, CircleCheck, ImagePlus, Loader2, Timer } from "lucide-react";
import { db } from "@/api/localDb";
import { JOURNAL_TEMPLATE, dateKey } from "@/lib/journal";
import { FORMAT_GROUPS, formatLabel, isMarkdown } from "@/lib/note-formats";
import { codeBlockAt, insertText, taskStatusAt, tableInsert, toggleTask } from "@/lib/ribbon-actions";
import { commit, useEditorSnapshot } from "@/lib/editor-bridge";
import { shortcutLabel, shortcutMatches } from "@/lib/shortcuts";
import CardComposer from "@/components/ribbon/CardComposer";
import TablePicker from "@/components/ribbon/TablePicker";
import TableTools from "@/components/ribbon/TableTools";
import CodeBlockPicker from "@/components/ribbon/CodeBlockPicker";
import RibbonButton from "@/components/ribbon/RibbonButton";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import { cn } from "@/lib/utils";

const TASKS = [
  { status: "TODO", icon: Circle, hint: "Mark the line as TODO, or clear it if it already is" },
  { status: "DOING", icon: Timer, hint: "Mark the line as DOING, or clear it if it already is" },
  { status: "DONE", icon: CircleCheck, hint: "Mark the line as DONE, or clear it if it already is" },
];

const SHORTCUTS = {
  daily: { mod: true, alt: true, key: "d" },
  date: { mod: true, alt: true, key: "t" },
  TODO: { mod: true, alt: true, key: "1" },
  DOING: { mod: true, alt: true, key: "2" },
  DONE: { mod: true, alt: true, key: "3" },
  card: { mod: true, alt: true, key: "k" },
  table: { mod: true, alt: true, key: "m" },
  code: { mod: true, alt: true, key: "c" },
  image: { mod: true, alt: true, key: "i" },
};

const SELECT_CLASS =
  "h-8 max-w-[136px] shrink-0 rounded-md border border-border/70 bg-card/60 px-1.5 font-mono text-[10.5px] text-foreground outline-none focus:border-primary/40";

/**
 * The ribbon above the writing area. Every button edits the markdown at the caret
 * through the editor bridge, so the selection, the focus and one-step undo survive.
 */
export default function NoteRibbon({ body, onChange, images, noteId, noteTitle, format = "markdown", onFormat }) {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [opening, setOpening] = useState(false);
  const [signals, setSignals] = useState({ card: 0, table: 0, code: 0 });

  const snap = useEditorSnapshot();
  const value = snap.value || body || "";
  const start = snap.value ? Math.min(snap.start, value.length) : value.length;
  const end = snap.value ? Math.min(snap.end, value.length) : value.length;
  const selection = { value, start, end };

  const markdown = isMarkdown(format);
  const offReason = `Only Markdown notes offer this — this note is ${formatLabel(format)}.`;
  const activeStatus = taskStatusAt(value, start);
  const run = (result) => commit(result, onChange);

  // Today's daily note, created with the journal scaffold the first time.
  const openToday = async () => {
    if (opening) return;
    setOpening(true);
    try {
      const day = dateKey();
      const found = await db.entities.Note.filter({ title: day, trashed: { $ne: true } }, { limit: 1 });
      const existing = found?.items?.[0];
      const note =
        existing ||
        (await db.entities.Note.create({ title: day, body: JOURNAL_TEMPLATE, tags: ["journal"] }));
      navigate(`/note/${note.id}`);
    } finally {
      setOpening(false);
    }
  };

  const addDate = () => run(insertText(selection, dateKey()));
  const markTask = (status) => run(toggleTask(selection, status));
  const addCode = (language) => run(codeBlockAt(selection, language));
  const addTable = (rows, columns) => run(tableInsert(selection, rows, columns));

  const handlers = useRef({});
  handlers.current = {
    daily: openToday,
    date: addDate,
    TODO: () => markTask("TODO"),
    DOING: () => markTask("DOING"),
    DONE: () => markTask("DONE"),
    image: () => fileRef.current?.click(),
    card: () => setSignals((current) => ({ ...current, card: current.card + 1 })),
    table: () => setSignals((current) => ({ ...current, table: current.table + 1 })),
    code: () => setSignals((current) => ({ ...current, code: current.code + 1 })),
  };

  const markdownRef = useRef(markdown);
  markdownRef.current = markdown;

  useEffect(() => {
    const onKey = (event) => {
      const hit = Object.entries(SHORTCUTS).find(([, spec]) => shortcutMatches(event, spec));
      if (!hit) return;
      event.preventDefault();
      if (!markdownRef.current) return;
      handlers.current[hit[0]]?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="mt-6 overflow-x-auto">
      <div className="flex w-max min-w-full flex-nowrap items-stretch divide-x divide-border/60 rounded-xl border border-border/70 bg-card/40">
        <RibbonGroup label="Format">
          <select
            value={format}
            onChange={(event) => onFormat?.(event.target.value)}
            aria-label="Note format"
            title="The type of the whole note — the only language list in the ribbon"
            className={SELECT_CLASS}
          >
            {FORMAT_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.ids.map((id) => (
                  <option key={id} value={id}>
                    {formatLabel(id)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </RibbonGroup>

        <RibbonGroup label="Journal">
          <RibbonButton
            icon={opening ? Loader2 : CalendarPlus}
            spinning={opening}
            label="Daily template"
            hint="Open or create today's daily note"
            shortcut={shortcutLabel(SHORTCUTS.daily)}
            disabled={!markdown}
            disabledReason={offReason}
            onClick={openToday}
          />
          <RibbonButton
            icon={CalendarDays}
            label="Today's date"
            hint="Insert today's date at the cursor"
            shortcut={shortcutLabel(SHORTCUTS.date)}
            disabled={!markdown}
            disabledReason={offReason}
            onClick={addDate}
          />
        </RibbonGroup>

        <RibbonGroup label="Tasks">
          {TASKS.map(({ status, icon, hint }) => (
            <RibbonButton
              key={status}
              icon={icon}
              label={status}
              hint={hint}
              shortcut={shortcutLabel(SHORTCUTS[status])}
              active={activeStatus === status}
              disabled={!markdown}
              disabledReason={offReason}
              onClick={() => markTask(status)}
            />
          ))}
        </RibbonGroup>

        <RibbonGroup label="Cards">
          <CardComposer
            body={body}
            noteId={noteId}
            noteTitle={noteTitle}
            disabled={!markdown}
            disabledReason={offReason}
            shortcut={shortcutLabel(SHORTCUTS.card)}
            openSignal={signals.card}
          />
        </RibbonGroup>

        <RibbonGroup label="Table">
          <TablePicker
            onInsert={addTable}
            disabled={!markdown}
            disabledReason={offReason}
            shortcut={shortcutLabel(SHORTCUTS.table)}
            openSignal={signals.table}
          />
        </RibbonGroup>

        <RibbonGroup label="Table tools">
          <TableTools body={body} onChange={onChange} />
        </RibbonGroup>

        <RibbonGroup label="Code">
          <CodeBlockPicker
            onInsert={addCode}
            disabled={!markdown}
            disabledReason={offReason}
            shortcut={shortcutLabel(SHORTCUTS.code)}
            openSignal={signals.code}
          />
        </RibbonGroup>

        <RibbonGroup label="Image">
          <RibbonButton
            icon={ImagePlus}
            label="Image"
            hint="Insert an image — png, jpg, webp or gif, up to 5 MB"
            shortcut={shortcutLabel(SHORTCUTS.image)}
            disabled={!markdown}
            disabledReason={offReason}
            onClick={() => fileRef.current?.click()}
          />
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(event) => {
              images?.insert(event.target.files);
              event.target.value = "";
            }}
          />
        </RibbonGroup>

        {(images?.busy || images?.error) && (
          <div
            className={cn(
              "flex shrink-0 items-center gap-1.5 px-2.5 font-mono text-[9.5px] uppercase tracking-[0.1em]",
              images?.error ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {images?.busy && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
            {images?.error || "uploading"}
          </div>
        )}
      </div>
    </div>
  );
}