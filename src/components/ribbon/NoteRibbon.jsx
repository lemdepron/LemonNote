import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { db } from "@/api/localDb";
import { useNavigate } from "react-router-dom";
import { dateKey } from "@/lib/journal";
import { JOURNAL_TEMPLATE } from "@/lib/journal";
import { formatLabel, isMarkdown } from "@/lib/note-formats";
import { insertText, toggleTask } from "@/lib/ribbon-actions";
import { applyAttr, toggleItalic, toggleWrap, toggleComment, fenceAt, stepFontSize } from "@/lib/format-actions";
import { commit, useEditorSnapshot } from "@/lib/editor-bridge";
import { shortcutMatches } from "@/lib/shortcuts";
import { readPref, writePref } from "@/lib/preferences";
import { RibbonContext, RibbonFrame } from "@/components/ribbon/RibbonKit";
import { TabErrorBoundary } from "@/components/ribbon/TabErrorBoundary";
import QuickAccess from "@/components/ribbon/QuickAccess";
import { InkTab } from "@/components/ribbon/tabs/InkTabs";
import { HomeTab } from "@/components/ribbon/tabs/HomeTab";
import { InsertTab } from "@/components/ribbon/tabs/InsertTab";
import { DesignTab } from "@/components/ribbon/tabs/DesignTab";
import { LayoutTab } from "@/components/ribbon/tabs/LayoutTab";
import { ViewTab } from "@/components/ribbon/tabs/ViewTab";
import { ShareTab } from "@/components/ribbon/tabs/ShareTab";
import { TableContextTab } from "@/components/ribbon/tabs/TableContextTab";
import { CodeContextTab } from "@/components/ribbon/tabs/CodeContextTab";
import { cn } from "@/lib/utils";
import { tableAt } from "@/lib/ribbon-actions";

const MAIN_TABS = [
  { id: "home", label: "Home" },
  { id: "ink", label: "Ink" },
  { id: "insert", label: "Insert" },
  { id: "design", label: "Design" },
  { id: "layout", label: "Layout" },
  { id: "view", label: "View" },
  { id: "share", label: "Share" },
];

const CONTEXTUAL_TABS = [
  { id: "table", label: "Table" },
  { id: "code", label: "Code" },
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
  [{ mod: true, shift: true, key: "." }, (s) => stepFontSize(s, 1)],
  [{ mod: true, shift: true, key: "," }, (s) => stepFontSize(s, -1)],
];

/**
 * The tabbed ribbon above the writing area. Every button edits the markdown at the
 * caret through the editor bridge, so the selection, the focus and one-step undo survive.
 * Whole-note typography is saved on the note (`note.style`) via `onTypography`.
 */
/** The tab to open with: the one used last time. */
export function initialRibbonTab() {
  const saved = readPref("ribbonTab", "home");
  return MAIN_TABS.some((item) => item.id === saved) ? saved : "home";
}

export default function NoteRibbon({
  body, onChange, images, noteId, noteTitle, format = "markdown", onFormat, typography = {}, onTypography, tab, onTab, noteInk,
}) {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [signals, setSignals] = useState({ card: 0, table: 0, code: 0 });
  const [lastMainTab, setLastMainTab] = useState(() => initialRibbonTab());

  const snap = useEditorSnapshot();
  const value = snap.value || body || "";
  const start = snap.value ? Math.min(snap.start, value.length) : value.length;
  const end = snap.value ? Math.min(snap.end, value.length) : value.length;
  const selection = useMemo(() => ({ value, start, end }), [value, start, end]);

  const markdown = isMarkdown(format);
  const offReason = `Only Markdown notes offer this — this note is ${formatLabel(format)}.`;
  const run = (result) => commit(result, onChange);

  // Detect contextual tabs based on cursor position
  const inTable = markdown && tableAt(value, selection.start);
  const block = fenceAt(value, selection.start);
  const inCodeBlock = markdown && Boolean(block);

  // Determine which tabs to show
  const visibleTabs = useMemo(() => {
    const tabs = [...MAIN_TABS];
    if (inTable) tabs.push(CONTEXTUAL_TABS[0]);
    if (inCodeBlock) tabs.push(CONTEXTUAL_TABS[1]);
    return tabs;
  }, [inTable, inCodeBlock]);

  // Determine active tab - if current tab is no longer visible, fall back to last main tab
  const activeTab = useMemo(() => {
    if (visibleTabs.some((t) => t.id === tab)) return tab;
    return lastMainTab;
  }, [tab, visibleTabs, lastMainTab]);

  const chooseTab = (id) => {
    if (MAIN_TABS.some((t) => t.id === id)) {
      writePref("ribbonTab", id);
      setLastMainTab(id);
    }
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
      chooseTab("insert");
      setSignals((current) => ({ ...current, card: current.card + 1 }));
    },
    table: () => {
      if (inTable) {
        chooseTab("table");
        setSignals((current) => ({ ...current, table: current.table + 1 }));
      }
    },
    code: () => {
      if (inCodeBlock) {
        chooseTab("code");
      }
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
    pickImage: () => fileRef.current?.click(),
  };

  return (
    <RibbonContext.Provider value={context}>
      <RibbonFrame
        tabs={visibleTabs}
        tab={activeTab}
        onTab={chooseTab}
        leading={<QuickAccess />}
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
        {activeTab === "home" && (
          <TabErrorBoundary><HomeTab format={format} onFormat={onFormat} body={body} noteId={noteId} noteTitle={noteTitle} /></TabErrorBoundary>
        )}
        {activeTab === "insert" && (
          <TabErrorBoundary><InsertTab onPickImage={() => fileRef.current?.click()} signals={signals} shortcuts={GLOBAL_SHORTCUTS} body={body} noteId={noteId} noteTitle={noteTitle} /></TabErrorBoundary>
        )}
        {activeTab === "design" && <TabErrorBoundary><DesignTab /></TabErrorBoundary>}
        {activeTab === "layout" && <TabErrorBoundary><LayoutTab /></TabErrorBoundary>}
        {activeTab === "view" && <TabErrorBoundary><ViewTab /></TabErrorBoundary>}
        {activeTab === "share" && <TabErrorBoundary><ShareTab /></TabErrorBoundary>}
        {activeTab === "ink" && <TabErrorBoundary><InkTab noteInk={noteInk} /></TabErrorBoundary>}
        {activeTab === "table" && <TabErrorBoundary><TableContextTab signals={signals} shortcuts={GLOBAL_SHORTCUTS} /></TabErrorBoundary>}
        {activeTab === "code" && <TabErrorBoundary><CodeContextTab /></TabErrorBoundary>}
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