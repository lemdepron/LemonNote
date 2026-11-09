import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Columns2, Eye, Link2, PenLine, Puzzle, Sparkles, Trash2 } from "lucide-react";
import { db } from "@/api/localDb";
import useVault from "@/hooks/useVault";
import VaultHeader from "@/components/vault/VaultHeader";
import MarkdownEditor from "@/components/vault/MarkdownEditor";
import MarkdownView from "@/components/vault/MarkdownView";
import FormatEditor from "@/components/vault/FormatEditor";
import FormatPreview from "@/components/vault/FormatPreview";
import { isMarkdown } from "@/lib/note-formats";
import { editorProps, normalizeStyle } from "@/lib/text-style";
import { writePref } from "@/lib/preferences";
import AiAssist from "@/components/notes/AiAssist";
import LinkRail from "@/components/vault/LinkRail";
import MacroBar from "@/components/macros/MacroBar";
import ExtensionPanels from "@/components/extensions/ExtensionPanels";
import ExtensionBanners from "@/components/extensions/ExtensionBanners";
import NoteRibbon, { initialRibbonTab } from "@/components/ribbon/NoteRibbon";
import NoteInkSurface from "@/components/ink/NoteInkSurface";
import NoteInkOverlay from "@/components/ink/NoteInkOverlay";
import useInkPage from "@/hooks/useInkPage";
import { deletePage } from "@/lib/ink/store";
import useNoteImages from "@/hooks/useNoteImages";
import EdgeDock from "@/components/shell/EdgeDock";
import FocusToggle from "@/components/shell/FocusToggle";
import { useFocusMode } from "@/lib/focusMode";
import { trashNote, restoreNote } from "@/lib/notes";
import { toast } from "@/lib/toast";
import { emitEvent, runHook } from "@/lib/extensions";
import { buildLinkIndex, extractInlineTags, extractWikiLinks } from "@/lib/vault";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MODES = [
  { id: "write", label: "Write", icon: PenLine },
  { id: "split", label: "Split", icon: Columns2 },
  { id: "read", label: "Read", icon: Eye },
];

export default function NotePage() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { notes, reload } = useVault();
  const { focus } = useFocusMode();
  const initialTitle = new URLSearchParams(window.location.search).get("title") || "";

  const [title, setTitle] = useState(isNew ? initialTitle : "");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState([]);
  const [format, setFormat] = useState("markdown");
  const [ribbonTab, setRibbonTab] = useState(initialRibbonTab);
  const [inkId, setInkId] = useState(null);
  const [startingInk, setStartingInk] = useState(false);
  const [typography, setTypography] = useState({});
  const [meta, setMeta] = useState({});
  const [tagDraft, setTagDraft] = useState("");
  const [mode, setMode] = useState("split");
  const [aiOpen, setAiOpen] = useState(false);
  const [status, setStatus] = useState("idle");
  const [revision, setRevision] = useState(0);
  const [missing, setMissing] = useState(false);
  const [loadingNote, setLoadingNote] = useState(!isNew);
  const [inkOverlayMode, setInkOverlayMode] = useState(false); // "Ink over text" mode
  const [readContentRect, setReadContentRect] = useState(null); // { width, height, scrollTop }
  const createdIdRef = useRef(isNew ? null : id);
  const loadedIdRef = useRef(null);
  const savePending = useRef(false);
  const latestRef = useRef({ title, body, tags, format, typography, inkId });
  latestRef.current = { title, body, tags, format, typography, inkId };

  useEffect(() => {
    if (isNew) {
      createdIdRef.current = null;
      loadedIdRef.current = null;
      setTitle(initialTitle);
      setBody("");
      setTags([]);
      setFormat("markdown");
      setTypography({});
      setInkId(null);
      setMeta({});
      setStatus("idle");
      setMissing(false);
      setLoadingNote(false);
      setRevision(0);
      setMode("split");
      return;
    }
    if (createdIdRef.current === id && loadedIdRef.current === id) {
      setLoadingNote(false);
      return;
    }
    let active = true;
    setLoadingNote(true);
    setMissing(false);
    db.entities.Note.get(id)
      .then((note) => {
        if (!active) return;
        loadedIdRef.current = id;
        createdIdRef.current = id;
        setTitle(note.title || "");
        setBody(note.body || "");
        setTags(Array.isArray(note.tags) ? note.tags : []);
        setFormat(note.format || "markdown");
        setTypography(normalizeStyle(note.style));
        setInkId(note.ink_page_id || null);
        setMeta({ created_date: note.created_date, updated_date: note.updated_date });
        setStatus("idle");
        setRevision(0);
        emitEvent("note:opened", { id: note.id });
        setLoadingNote(false);
      })
      .catch(() => {
        if (!active) return;
        setMissing(true);
        setLoadingNote(false);
      });
    return () => {
      active = false;
    };
  }, [id, isNew, initialTitle]);

  useEffect(() => {
    if (!revision) return;
    setStatus("saving");
    savePending.current = true;
    const timer = setTimeout(async () => {
      const payload = {
        ...runHook("note:before-save", { title: title.trim() || "Untitled note", body, tags, format }),
        style: normalizeStyle(typography),
        ink_page_id: inkId || null,
      };
      let noteId = createdIdRef.current;
      if (noteId) {
        await db.entities.Note.update(noteId, payload);
      } else {
        const created = await db.entities.Note.create(payload);
        noteId = created.id;
        createdIdRef.current = noteId;
        loadedIdRef.current = noteId;
        navigate(`/note/${noteId}`, { replace: true });
      }
      savePending.current = false;
      setMeta((prev) => ({ ...prev, updated_date: new Date().toISOString() }));
      setStatus("saved");
      emitEvent("note:saved", { id: noteId });
      reload();
    }, 800);
    return () => clearTimeout(timer);
     
  }, [revision]);

  // Flush an edit that is still waiting on the debounce if the editor goes away.
  useEffect(
    () => () => {
      if (!savePending.current) return;
      const latest = latestRef.current;
      const payload = {
        ...runHook("note:before-save", {
          title: String(latest.title || "").trim() || "Untitled note",
          body: latest.body || "",
          tags: latest.tags || [],
          format: latest.format || "markdown",
        }),
        style: normalizeStyle(latest.typography),
        ink_page_id: latest.inkId || null,
      };
      const noteId = createdIdRef.current;
      if (noteId) db.entities.Note.update(noteId, payload).catch(() => {});
      else db.entities.Note.create(payload).catch(() => {});
    },
    []
  );

  const linkIndex = useMemo(() => buildLinkIndex(notes), [notes]);
  const titles = useMemo(() => notes.map((note) => note.title).filter(Boolean), [notes]);
  const outgoing = useMemo(() => extractWikiLinks(body), [body]);
  const inlineTags = useMemo(() => extractInlineTags(body), [body]);
  const backlinks = useMemo(() => {
    const key = title.trim().toLowerCase();
    if (!key) return [];
    return notes.filter(
      (other) =>
        other.id !== createdIdRef.current &&
        extractWikiLinks(other.body || "").some((link) => link.toLowerCase() === key)
    );
  }, [notes, title]);

  const touch = () => setRevision((value) => value + 1);
  const changeBody = (next) => {
    setBody(next);
    touch();
  };
  const images = useNoteImages({ body, onChange: changeBody });

  // Handwriting: a note may own one ink page, linked by note.ink_page_id.
  const inkActive = ribbonTab === "ink";
  const openInkOwner = async (pageId) => {
    const result = await db.entities.Note.list({ limit: 2000 });
    const owner = (result?.items ?? []).find((item) => item.ink_page_id === pageId && !item.trashed);
    if (owner) navigate(`/note/${owner.id}`);
  };
  const inkPage = useInkPage(inkId, { active: inkActive, onOpenPage: openInkOwner });

  const startInk = async () => {
    if (startingInk) return;
    setStartingInk(true);
    try {
      const page = await db.entities.InkPage.create({ name: title.trim() || "Untitled note", strokes: [] });
      setInkId(page.id);
      touch();
    } finally {
      setStartingInk(false);
    }
  };

  const removeInk = async () => {
    if (!inkId) return;
    if (!window.confirm("Delete all handwriting in this note? This cannot be undone.")) return;
    await deletePage(inkId).catch(() => {});
    setInkId(null);
    touch();
  };

  const attachInk = async (pageId) => {
    if (inkId && inkId !== pageId) {
      if (!window.confirm("Replace this note's handwriting with the selected page? The current handwriting is deleted.")) return;
      await deletePage(inkId).catch(() => {});
    }
    setInkId(pageId);
    touch();
  };

  // Pages drawn before Ink moved into notes, and not yet claimed by any note.
  const listAttachable = async () => {
    const [pages, owners] = await Promise.all([
      db.entities.InkPage.list({ sort: "-updated_date", limit: 50 }),
      db.entities.Note.list({ limit: 2000 }),
    ]);
    const used = new Set((owners?.items ?? []).map((item) => item.ink_page_id).filter(Boolean));
    return (pages?.items ?? []).filter((item) => !used.has(item.id));
  };

  // The ink page carries the note's title so handwriting search shows readable names.
  const inkName = inkPage.page?.name;
  const patchInk = inkPage.patch;
  useEffect(() => {
    const name = title.trim();
    if (name && inkName !== undefined && inkName !== name) patchInk({ name });
  }, [title, inkName, patchInk]);

  // Handle ink overlay mode change
  const toggleInkOverlayMode = useCallback(() => {
    setInkOverlayMode((prev) => !prev);
  }, []);

  const noteInk = {
    loading: Boolean(inkId) && inkPage.loading,
    hasPage: Boolean(inkId && inkPage.page),
    starting: startingInk,
    page: inkPage.page,
    ink: inkPage.ink,
    board: inkPage.board,
    markCount: inkPage.markCount,
    pageIndex: inkPage.pageIndex,
    status: inkPage.status,
    onStart: startInk,
    onRemove: removeInk,
    onAttach: attachInk,
    listAttachable,
    overlayMode: inkOverlayMode,
    onToggleOverlayMode: toggleInkOverlayMode,
  };
  const markdown = isMarkdown(format);

  const insertLink = async (rawTitle, goToNote) => {
    const clean = rawTitle.trim();
    if (!clean) return;
    const existing = linkIndex.get(clean.toLowerCase());
    if (existing) {
      if (goToNote) navigate(`/note/${existing.id}`);
      return;
    }
    const created = await db.entities.Note.create({ title: clean, body: "", tags: [] });
    await reload();
    if (goToNote) navigate(`/note/${created.id}`);
  };

  const addTag = (event) => {
    event.preventDefault();
    const clean = tagDraft.trim().replace(/^#/, "").toLowerCase();
    if (!clean) return;
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
      touch();
    }
    setTagDraft("");
  };

  const removeNote = async () => {
    const id = createdIdRef.current;
    if (!id) return;
    const note = await db.entities.Note.get(id).catch(() => null);
    if (!note) return;
    await trashNote(id);
    toast({
      text: `Moved "${note.title || "Untitled note"}" to the Bin.`,
      type: "info",
      actionLabel: "Undo",
      onAction: async () => {
        await restoreNote(id);
        toast.success("Note restored.");
      },
      duration: 8000,
    });
    navigate("/");
  };

  const statusLabel = status === "saving" ? "saving…" : status === "saved" ? "saved" : isNew ? "draft" : "saved";

  // What an extension panel may read: the live note, its id once saved, and the host's writers.
  const extensionHost = {
    id: createdIdRef.current,
    title,
    body,
    tags,
    created_date: meta.created_date,
    updated_date: meta.updated_date,
  };

  const dockPanels = [
    {
      id: "note-links",
      label: "Links",
      icon: Link2,
      content: (
        <LinkRail
          outgoing={outgoing}
          backlinks={backlinks}
          linkIndex={linkIndex}
          onOpenNote={(noteId) => navigate(`/note/${noteId}`)}
          onCreateNote={(newTitle) => insertLink(newTitle, true)}
        />
      ),
    },
    {
      id: "note-ai",
      label: "AI assist",
      icon: Sparkles,
      content: (closeAi) => (
        <AiAssist
          title={title}
          body={body}
          onAppend={(text) => {
            setBody(`${body.trimEnd()}\n\n${text}\n`);
            touch();
          }}
          onReplace={(text) => {
            setBody(text);
            touch();
          }}
          onClose={closeAi}
        />
      ),
    },
    {
      id: "note-extensions",
      label: "Extensions",
      icon: Puzzle,
      content: (
        <ExtensionPanels note={extensionHost} onEditBody={changeBody} onVaultChange={reload} />
      ),
    },
  ];

  // Ref for the read view content container to track scroll and dimensions
  const readContentRef = useRef(null);

  // Track scroll position and dimensions for ink overlay
  const handleReadScroll = useCallback((event) => {
    const target = event.target;
    if (target && readContentRef.current) {
      setReadContentRect({
        width: target.clientWidth,
        height: target.scrollHeight,
        scrollTop: target.scrollTop,
      });
    }
  }, []);

  // Update content rect on resize
  useEffect(() => {
    const element = readContentRef.current;
    if (!element) return;
    const updateRect = () => {
      setReadContentRect({
        width: element.clientWidth,
        height: element.scrollHeight,
        scrollTop: element.scrollTop,
      });
    };
    updateRect();
    const observer = new ResizeObserver(updateRect);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (missing) {
    return (
      <div className="nb-shell min-h-screen">
        <VaultHeader />
        <main className="mx-auto max-w-xl px-6 py-24 text-center">
          <h1 className="font-display text-3xl">This note isn't in your vault.</h1>
          <p className="mt-3 text-[14px] text-muted-foreground">It may have been deleted or renamed.</p>
          <Link to="/" className="mt-6 inline-block rounded-lg border border-border px-4 py-2 text-[13px] transition hover:bg-accent">
            Back to the vault
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="nb-shell min-h-screen">
      <VaultHeader />
      <main
        className={cn(
          "mx-auto max-w-[1180px] px-5 pb-24 pt-6 sm:px-6 lg:px-8",
          focus && "pr-12 sm:pr-14"
        )}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/"
            className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> vault
          </Link>
          <span className="text-[11px] text-muted-foreground/40">/</span>
          <span className="max-w-[22ch] truncate font-mono text-[11px] text-muted-foreground sm:max-w-[42ch]">
            {title.trim() || "untitled"}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 font-mono text-[10px] text-muted-foreground sm:flex">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  status === "saving" ? "bg-primary animate-pulse" : "bg-[hsl(var(--link))]"
                )}
              />
              {statusLabel}
            </span>

            {!focus && (
              <button
                type="button"
                onClick={() => setAiOpen((open) => !open)}
                aria-pressed={aiOpen}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[10.5px] transition",
                  aiOpen
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/80 text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="h-3 w-3" />
                <span className="hidden sm:inline">AI</span>
              </button>
            )}

            <div className="inline-flex rounded-lg border border-border/80 bg-card/50 p-0.5">
              {MODES.map(({ id: modeId, label, icon: Icon }) => (
                <button
                  key={modeId}
                  type="button"
                  onClick={() => setMode(modeId)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 font-mono text-[10.5px] transition",
                    mode === modeId
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  aria-label="Delete note"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-border/80 text-muted-foreground transition hover:border-destructive/50 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Move this note to the trash?</AlertDialogTitle>
                  <AlertDialogDescription>
                    “{title.trim() || "Untitled note"}” leaves the vault and waits in the trash for 60 days, where you can
                    restore it. Links pointing at it will show as unresolved until then.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep note</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={removeNote}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <FocusToggle />
          </div>
        </div>

        <div
          className={cn(
            "mt-8 grid gap-12 transition-[gap] duration-300 ease-out",
            focus ? "lg:grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_252px]"
          )}
        >
          <article className="min-w-0">
            {loadingNote ? (
              <div className="space-y-4">
                <div className="h-9 w-2/3 animate-pulse rounded-md bg-card/60" />
                <div className="h-4 w-full animate-pulse rounded bg-card/40" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-card/40" />
              </div>
            ) : (
              <>
                <input
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    touch();
                  }}
                  placeholder="Untitled note"
                  aria-label="Note title"
                  className="w-full bg-transparent font-heading text-[28px] font-medium leading-tight tracking-tight text-foreground outline-none placeholder:text-muted-foreground/30 sm:text-[34px]"
                />

                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="group flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-[11px] text-primary"
                    >
                      #{tag}
                      <button
                        type="button"
                        aria-label={`Remove ${tag}`}
                        onClick={() => {
                          setTags(tags.filter((item) => item !== tag));
                          touch();
                        }}
                        className="text-primary/50 transition hover:text-primary"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {inlineTags
                    .filter((tag) => !tags.includes(tag))
                    .map((tag) => (
                      <span
                        key={tag}
                        title="Detected inline hashtag"
                        className="rounded-md border border-dashed border-border px-2 py-1 font-mono text-[11px] text-muted-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                  <form onSubmit={addTag}>
                    <input
                      value={tagDraft}
                      onChange={(event) => setTagDraft(event.target.value)}
                      placeholder="+ tag"
                      aria-label="Add tag"
                      className="w-20 bg-transparent px-1 py-1 font-mono text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:w-28"
                    />
                  </form>
                </div>

                <ExtensionBanners note={extensionHost} onEditBody={changeBody} />

                <div className="mt-6">
                  {aiOpen && !focus && (
                    <AiAssist
                      title={title}
                      body={body}
                      onAppend={(text) => {
                        setBody(`${body.trimEnd()}\n\n${text}\n`);
                        touch();
                      }}
                      onReplace={(text) => {
                        setBody(text);
                        touch();
                      }}
                      onClose={() => setAiOpen(false)}
                    />
                  )}
                </div>

                <NoteRibbon
                  body={body}
                  onChange={changeBody}
                  images={images}
                  noteId={createdIdRef.current}
                  noteTitle={title}
                  tags={tags}
                  format={format}
                  onFormat={(next) => {
                    setFormat(next);
                    touch();
                  }}
                  typography={typography}
                  onTypography={(next) => {
                    const normalized = normalizeStyle(next);
                    // Warn if changing layout on a note with ink
                    if (noteInk.hasPage && noteInk.markCount > 0) {
                      const current = typography || {};
                      const layoutChanged =
                        (normalized.font && normalized.font !== current.font) ||
                        (normalized.size && normalized.size !== current.size) ||
                        (normalized.lineHeight && normalized.lineHeight !== current.lineHeight) ||
                        (normalized.width && normalized.width !== current.width) ||
                        (normalized.pageWidth && normalized.pageWidth !== current.pageWidth) ||
                        (normalized.pageLineHeight && normalized.pageLineHeight !== current.pageLineHeight);
                      if (layoutChanged) {
                        if (!window.confirm("Changing layout will misalign handwriting. Use 'Insert space' instead. Continue anyway?")) {
                          return;
                        }
                      }
                    }
                    setTypography(normalized);
                    touch();
                  }}
                  tab={ribbonTab}
                  onTab={setRibbonTab}
                  noteInk={noteInk}
                />

                {inkActive ? (
                  <div className="mt-8 border-t border-border/60 pt-8">
                    <NoteInkSurface noteInk={noteInk} />
                  </div>
                ) : (
                <div className="mt-8 border-t border-border/60 pt-8">
                  {noteInk.hasPage && noteInk.markCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        writePref("ribbonTab", "ink");
                        setRibbonTab("ink");
                      }}
                      className="mb-6 flex items-center gap-2 rounded-lg border border-border/70 bg-card/40 px-3 py-1.5 font-mono text-[10.5px] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                    >
                      <PenLine className="h-3 w-3 text-primary" />
                      Handwriting · {noteInk.markCount} marks · open the Ink tab
                    </button>
                  )}
                  <div className={cn("gap-10", mode === "split" ? "grid lg:grid-cols-2" : "block")}>
                    {mode !== "read" && (
                      <div className="min-w-0">
                        {noteInk.hasPage && noteInk.markCount > 0 && !inkActive && (
                          <div className="mb-6 flex items-center gap-2 rounded-lg border border-border/50 bg-card/30 px-3 py-1.5 font-mono text-[10.5px] text-muted-foreground/70">
                            <PenLine className="h-3 w-3 text-muted-foreground/50" />
                            Ink is shown in Read view · {noteInk.markCount} marks
                          </div>
                        )}
                        {markdown ? (
                          <>
                            <MarkdownEditor
                              value={body}
                              onChange={(next) => {
                                setBody(next);
                                touch();
                              }}
                              titles={titles}
                              onCreateNote={(newTitle) => insertLink(newTitle, false)}
                              onImageFiles={images.insert}
                              hasInk={noteInk.hasPage && noteInk.markCount > 0}
                              {...editorProps(typography, noteInk.hasPage && noteInk.markCount > 0)}
                            />
                            <MacroBar
                              body={body}
                              onChange={(next) => {
                                setBody(next);
                                touch();
                              }}
                            />
                          </>
                        ) : (
                          <FormatEditor value={body} onChange={changeBody} format={format} />
                        )}
                      </div>
                    )}
                    {mode !== "write" && (
                      <div className={cn("min-w-0", mode === "split" && "lg:border-l lg:border-border/60 lg:pl-10")}>
                        {body.trim() ? (
                          markdown ? (
                            <div ref={readContentRef} onScroll={handleReadScroll} className="relative">
                              <MarkdownView
                                body={body}
                                linkIndex={linkIndex}
                                typography={typography}
                                hasInk={noteInk.hasPage && noteInk.markCount > 0}
                                onOpenNote={(noteId) => navigate(`/note/${noteId}`)}
                                onCreateNote={(newTitle) => insertLink(newTitle, true)}
                              />
                              {noteInk.hasPage && noteInk.markCount > 0 && inkOverlayMode && readContentRect && (
                                <NoteInkOverlay
                                  noteInk={noteInk}
                                  contentRef={readContentRef.current}
                                  scrollTop={readContentRect.scrollTop}
                                  contentWidth={readContentRect.width}
                                  contentHeight={readContentRect.height}
                                  scale={1}
                                />
                              )}
                            </div>
                          ) : (
                            <FormatPreview value={body} format={format} />
                          )
                        ) : (
                          <p className="text-[14px] text-muted-foreground">
                            Nothing written yet. Press <span className="font-mono text-[12px]">Write</span> and start.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                )}
              </>
            )}
          </article>

          {!focus && (
            <aside className="space-y-4">
              {dockPanels
                .filter((panel) => panel.id !== "note-ai")
                .map((panel) => (
                  <div key={panel.id}>{panel.content}</div>
                ))}
            </aside>
          )}
        </div>
        <EdgeDock panels={dockPanels} />
      </main>
      <div id="file-panel-root" />
    </div>
  );
}