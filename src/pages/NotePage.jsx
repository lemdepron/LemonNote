import { useEffect, useMemo, useRef, useState } from "react";
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
import AiAssist from "@/components/notes/AiAssist";
import LinkRail from "@/components/vault/LinkRail";
import MacroBar from "@/components/macros/MacroBar";
import ExtensionPanels from "@/components/extensions/ExtensionPanels";
import ExtensionBanners from "@/components/extensions/ExtensionBanners";
import NoteRibbon from "@/components/ribbon/NoteRibbon";
import useNoteImages from "@/hooks/useNoteImages";
import EdgeDock from "@/components/shell/EdgeDock";
import FocusToggle from "@/components/shell/FocusToggle";
import { useFocusMode } from "@/lib/focusMode";
import { trashNote } from "@/lib/notes";
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
  const [meta, setMeta] = useState({});
  const [tagDraft, setTagDraft] = useState("");
  const [mode, setMode] = useState("split");
  const [aiOpen, setAiOpen] = useState(false);
  const [status, setStatus] = useState("idle");
  const [revision, setRevision] = useState(0);
  const [missing, setMissing] = useState(false);
  const [loadingNote, setLoadingNote] = useState(!isNew);
  const createdIdRef = useRef(isNew ? null : id);
  const loadedIdRef = useRef(null);
  const savePending = useRef(false);
  const latestRef = useRef({ title, body, tags, format });
  latestRef.current = { title, body, tags, format };

  useEffect(() => {
    if (isNew) {
      createdIdRef.current = null;
      loadedIdRef.current = null;
      setTitle(initialTitle);
      setBody("");
      setTags([]);
      setFormat("markdown");
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
      const payload = runHook("note:before-save", { title: title.trim() || "Untitled note", body, tags, format });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision]);

  // Flush an edit that is still waiting on the debounce if the editor goes away.
  useEffect(
    () => () => {
      if (!savePending.current) return;
      const latest = latestRef.current;
      const payload = runHook("note:before-save", {
        title: String(latest.title || "").trim() || "Untitled note",
        body: latest.body || "",
        tags: latest.tags || [],
        format: latest.format || "markdown",
      });
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
    if (createdIdRef.current) await trashNote(createdIdRef.current);
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
                  format={format}
                  onFormat={(next) => {
                    setFormat(next);
                    touch();
                  }}
                />

                <div className="mt-8 border-t border-border/60 pt-8">
                  <div className={cn("gap-10", mode === "split" ? "grid lg:grid-cols-2" : "block")}>
                    {mode !== "read" && (
                      <div className="min-w-0">
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
                            <MarkdownView
                              body={body}
                              linkIndex={linkIndex}
                              onOpenNote={(noteId) => navigate(`/note/${noteId}`)}
                              onCreateNote={(newTitle) => insertLink(newTitle, true)}
                            />
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
    </div>
  );
}