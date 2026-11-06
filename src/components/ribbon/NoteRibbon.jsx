import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { db } from "@/api/localDb";
import { useNavigate } from "react-router-dom";
import { dateKey } from "@/lib/journal";
import { JOURNAL_TEMPLATE } from "@/lib/journal";
import { formatLabel, isMarkdown } from "@/lib/note-formats";
import { insertText, toggleTask } from "@/lib/ribbon-actions";
import { applyAttr, toggleItalic, toggleWrap, toggleComment, fenceAt } from "@/lib/format-actions";
import { commit, useEditorSnapshot } from "@/lib/editor-bridge";
import { shortcutMatches } from "@/lib/shortcuts";
import { readPref, writePref } from "@/lib/preferences";
import { RibbonContext, RibbonFrame } from "@/components/ribbon/RibbonKit";
import { InkTab } from "@/components/ribbon/tabs/InkTabs";
import { HomeTab, FormatTab, ParagraphTab } from "@/components/ribbon/tabs/TextTabs";
import { InsertTab, CodeTab } from "@/components/ribbon/tabs/InsertTabs";
import { TableTab, JournalTab, TasksTab, ViewTab } from "@/components/ribbon/tabs/DataTabs";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "home", label: "Home" },
  { id: "insert", label: "Insert" },
  { id: "format", label: "Format" },
  { id: "paragraph", label: "Paragraph" },
  { id: "table", label: "Table" },
  { id: "journal", label: "Journal" },
  { id: "tasks", label: "Tasks" },
  { id: "code", label: "Code" },
  { id: "ink", label: "Ink" },
  { id: "view", label: "View" },
];

/** Shortcuts that work anywhere on the page (Alt-based, as before). */
const GLOBAL_SHORTCUTS = {
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

/** Shortcuts that only act while the writing box has focus. */
const EDITOR_SHORTCUTS = [
  [{ mod: true, key: "b" }, (s) => toggleWrap(s, "**")],
  [{ mod: true, key: "i" }, (s) => toggleItalic(s)],
  [{ mod: true, key: "u" }, (s) => toggleWrap(s, "<u>", "</u>")],
  [{ mod: true, key: "e" }, (s) => toggleWrap(s, "`")],
  [{ mod: true, shift: true, key: "x" }, (s) => toggleWrap(s, "~~")],
  [{ mod: true, shift: true, key: "h" }, (s) => applyAttr(s, "mark", "h", "yellow")],
  [{ mod: true, key: "/" }, (s, lang) => toggleComment(s, lang)],
];

/**
 * The tabbed ribbon above the writing area. Every button edits the markdown at the
 * caret through the editor bridge, so the selection, the focus and one-step undo survive.
 * Whole-note typography is saved on the note (`note.style`) via `onTypography`.
 */
/** The tab to open with: the one used last time. */
export function initialRibbonTab() {
  const saved = readPref("ribbonTab", "home");
  return TABS.some((item) => item.id === saved) ? saved : "home";
}

export default function NoteRibbon({
  body, onChange, images, noteId, noteTitle, format = "markdown", onFormat, typography = {}, onTypography, tab, onTab, noteInk,
}) {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [signals, setSignals] = useState({ card: 0, table: 0, code: 0 });

  const snap = useEditorSnapshot();
  const value = snap.value || body || "";
  const start = snap.value ? Math.min(snap.start, value.length) : value.length;
  const end = snap.value ? Math.min(snap.end, value.length) : value.length;
  const selection = useMemo(() => ({ value, start, end }), [value, start, end]);

  const markdown = isMarkdown(format);
  const offReason = `Only Markdown notes offer this — this note is ${formatLabel(format)}.`;
  const run = (result) => commit(result, onChange);

  const chooseTab = (id) => {
    writePref("ribbonTab", id);
    onTab(id);
  };

  const openToday = async () => {
    const day = dateKey();
    const found = await db.entities.Note.filter({ title: day, trashed: { $ne: true } }, { limit: 1 });
    const note = found?.items?.[0] || (await db.entities.Note.create({ title: day, body: JOURNAL_TEMPLATE, tags: ["journal"] }));
    navigate(`/note/${note.id}`);
  };

  const handlers = useRef({});
  handlers.current = {
    daily: openToday,
    date: () => run(insertText(selection, dateKey())),
    TODO: () => run(toggleTask(selection, "TODO")),
    DOING: () => run(toggleTask(selection, "DOING")),
    DONE: () => run(toggleTask(selection, "DONE")),
    image: () => fileRef.current?.click(),
    card: () => {
      chooseTab("tasks");
      setSignals((current) => ({ ...current, card: current.card + 1 }));
    },
    table: () => {
      chooseTab("table");
      setSignals((current) => ({ ...current, table: current.table + 1 }));
    },
    code: () => {
      chooseTab("code");
    },
  };

  const liveRef = useRef({});
  liveRef.current = { markdown, selection, run, value };

  useEffect(() => {
    const onKey = (event) => {
      const live = liveRef.current;
      const hit = Object.entries(GLOBAL_SHORTCUTS).find(([, spec]) => shortcutMatches(event, spec));
      if (hit) {
        event.preventDefault();
        if (live.markdown) handlers.current[hit[0]]?.();
        return;
      }
      if (document.activeElement?.id !== "nb-editor" || !live.markdown) return;
      const match = EDITOR_SHORTCUTS.find(([spec]) => shortcutMatches(event, spec));
      if (!match) return;
      event.preventDefault();
      const node = document.activeElement;
      const sel = { value: node.value, start: node.selectionStart, end: node.selectionEnd };
      const block = fenceAt(sel.value, sel.start);
      live.run(match[1](sel, block ? block.lang : readPref("codeBlockLanguage", "plain")));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const context = {
    selection, value, body, onChange, run, markdown, offReason, noteId, noteTitle,
    typography, setTypography: (next) => onTypography?.(next),
  };

  return (
    <RibbonContext.Provider value={context}>
      <RibbonFrame
        tabs={TABS}
        tab={tab}
        onTab={chooseTab}
        trailing={
          (images?.busy || images?.error) && (
            <div
              className={cn(
                "flex shrink-0 items-center gap-1.5 px-2.5 font-mono text-[9.5px] uppercase tracking-[0.1em]",
                images?.error ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {images?.busy && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              {images?.error || "uploading"}
            </div>
          )
        }
      >
        {tab === "home" && <HomeTab format={format} onFormat={onFormat} />}
        {tab === "insert" && <InsertTab onPickImage={() => fileRef.current?.click()} />}
        {tab === "format" && <FormatTab />}
        {tab === "paragraph" && <ParagraphTab />}
        {tab === "table" && <TableTab signals={signals} shortcuts={GLOBAL_SHORTCUTS} />}
        {tab === "journal" && <JournalTab />}
        {tab === "tasks" && (
          <TasksTab signals={signals} shortcuts={GLOBAL_SHORTCUTS} body={body} noteId={noteId} noteTitle={noteTitle} />
        )}
        {tab === "code" && <CodeTab />}
        {tab === "ink" && <InkTab noteInk={noteInk} />}
        {tab === "view" && <ViewTab />}
      </RibbonFrame>

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
    </RibbonContext.Provider>
  );
}
