import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  Code2,
  Layers,
  LayoutGrid,
  ListChecks,
  Plus,
  Search,
  Settings,
  Share2,
  Table2,
} from "lucide-react";
import { db } from "@/api/localDb";
import { cn } from "@/lib/utils";

const ACTIONS = [
  { id: "act-note", label: "New note", hint: "action", to: "/note/new", icon: Plus, keywords: "create capture write" },
  { id: "act-journal", label: "Today's journal", hint: "action", to: "/journal", icon: CalendarDays, keywords: "daily log" },
  { id: "act-graph", label: "Graph view", hint: "action", to: "/graph", icon: Share2, keywords: "links network" },
  { id: "act-tasks", label: "Task inbox", hint: "action", to: "/tasks", icon: ListChecks, keywords: "todo doing" },
  { id: "act-cards", label: "Flashcards", hint: "action", to: "/cards", icon: Layers, keywords: "review spaced repetition" },
  { id: "act-canvas", label: "Infinite canvas", hint: "action", to: "/canvas", icon: LayoutGrid, keywords: "whiteboard map" },
  { id: "act-tables", label: "Relational tables", hint: "action", to: "/tables", icon: Table2, keywords: "database board gallery" },
  { id: "act-code", label: "Code workspace", hint: "action", to: "/code", icon: Code2, keywords: "editor files" },
  { id: "act-settings", label: "Settings", hint: "action", to: "/settings", icon: Settings, keywords: "preferences configure appearance" },
];

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [sources, setSources] = useState({ notes: [], canvases: [], tables: [], code: [] });
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setCursor(0);
    Promise.all([
      db.entities.Note.filter({ trashed: { $ne: true } }, { sort: "-updated_date", limit: 200 }),
      db.entities.Canvas.list({ sort: "-updated_date", limit: 50 }),
      db.entities.DataTable.list({ sort: "-updated_date", limit: 50 }),
      db.entities.CodeFile.list({ sort: "-updated_date", limit: 50 }),
    ])
      .then(([notes, canvases, tables, code]) => {
        setSources({
          notes: notes?.items ?? [],
          canvases: canvases?.items ?? [],
          tables: tables?.items ?? [],
          code: code?.items ?? [],
        });
      })
      .catch(() => {});
    const timer = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, [open]);

  const term = query.trim().toLowerCase();
  const hit = (text) => !term || String(text || "").toLowerCase().includes(term);

  const notes = sources.notes.filter((note) => hit(`${note.title} ${note.body}`)).slice(0, 8);
  const groups = [
    {
      label: "Actions",
      entries: ACTIONS.filter((action) => hit(`${action.label} ${action.keywords}`)).map((action) => ({
        ...action,
        run: () => navigate(action.to),
      })),
    },
    {
      label: "Notes",
      entries: [
        ...notes.map((note) => ({
          id: `note-${note.id}`,
          label: note.title || "Untitled note",
          hint: "note",
          icon: BookOpen,
          run: () => navigate(`/note/${note.id}`),
        })),
        ...(term && !notes.some((note) => String(note.title || "").toLowerCase() === term)
          ? [
              {
                id: "create-note",
                label: `Create note “${query.trim()}”`,
                hint: "new",
                icon: Plus,
                run: async () => {
                  const created = await db.entities.Note.create({ title: query.trim(), body: "", tags: [] });
                  navigate(`/note/${created.id}`);
                },
              },
            ]
          : []),
      ],
    },
    {
      label: "Canvases",
      entries: sources.canvases
        .filter((item) => hit(item.name))
        .slice(0, 5)
        .map((item) => ({ id: `canvas-${item.id}`, label: item.name, hint: "canvas", icon: LayoutGrid, run: () => navigate(`/canvas/${item.id}`) })),
    },
    {
      label: "Tables",
      entries: sources.tables
        .filter((item) => hit(item.name))
        .slice(0, 5)
        .map((item) => ({ id: `table-${item.id}`, label: item.name, hint: "table", icon: Table2, run: () => navigate(`/tables/${item.id}`) })),
    },
    {
      label: "Code",
      entries: sources.code
        .filter((item) => hit(item.name))
        .slice(0, 5)
        .map((item) => ({ id: `code-${item.id}`, label: item.name, hint: "file", icon: Code2, run: () => navigate(`/code/${item.id}`) })),
    },
  ].filter((group) => group.entries.length);

  const rows = groups.flatMap((group) => group.entries);

  useEffect(() => {
    if (cursor > rows.length - 1) setCursor(0);
    const active = document.getElementById(`palette-row-${cursor}`);
    active?.scrollIntoView({ block: "nearest" });
  }, [cursor, rows.length]);

  if (!open) return null;

  const runRow = async (row) => {
    if (!row) return;
    onClose();
    await row.run();
  };

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((value) => Math.min(rows.length - 1, value + 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((value) => Math.max(0, value - 1));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      runRow(rows[cursor]);
    }
  };

  let offset = 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-background/70 px-4 pt-[10vh] backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="nb-rise w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl shadow-[hsl(var(--shadow)/0.5)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border/70 px-3.5 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCursor(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Jump to a note, canvas, table, file, page…"
            aria-label="Command palette"
            className="h-8 min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="shrink-0 rounded border border-border/70 bg-muted/50 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
            esc
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto px-1.5 py-1.5">
          {rows.length === 0 ? (
            <p className="px-3 py-8 text-center text-[12.5px] text-muted-foreground">Nothing matches that.</p>
          ) : (
            groups.map((group) => {
              const start = offset;
              offset += group.entries.length;
              return (
                <div key={group.label} className="mb-1">
                  <p className="nb-label px-2.5 pb-1 pt-2">{group.label}</p>
                  {group.entries.map((entry, index) => {
                    const rowIndex = start + index;
                    const Icon = entry.icon;
                    return (
                      <button
                        key={entry.id}
                        id={`palette-row-${rowIndex}`}
                        type="button"
                        onMouseEnter={() => setCursor(rowIndex)}
                        onClick={() => runRow(entry)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition",
                          rowIndex === cursor ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-accent/60"
                        )}
                      >
                        <Icon className={cn("h-3.5 w-3.5 shrink-0", rowIndex === cursor ? "text-primary" : "")} />
                        <span className="min-w-0 flex-1 truncate text-[13px]">{entry.label}</span>
                        <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
                          {entry.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}