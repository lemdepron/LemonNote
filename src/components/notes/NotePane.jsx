import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Columns2, Eye, Link2, PenLine, Puzzle, Sparkles, Target } from "lucide-react";
import { db } from "@/api/localDb";
import useVault from "@/hooks/useVault";
import VaultHeader from "@/components/vault/VaultHeader";
import MarkdownEditor from "@/components/vault/MarkdownEditor";
import MarkdownView from "@/components/vault/MarkdownView";
import FormatEditor from "@/components/vault/FormatEditor";
import FormatPreview from "@/components/vault/FormatPreview";
import { isMarkdown } from "@/lib/note-formats";
import { editorProps, normalizeStyle, readerProps } from "@/lib/text-style";
import { readPref, writePref } from "@/lib/preferences";
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
import { isNoteLocked } from "@/lib/encryption";
import { buildLinkIndex, extractInlineTags, extractWikiLinks, extractHeadings, escapeRegExp, plainText } from "@/lib/vault";
import { countWords } from "@/lib/note-stats";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import FindTagsPanel from "@/components/tags/FindTagsPanel";
import { confirm } from "@/components/ui/use-dialog";
import { usePaneFocus } from "@/context/PaneFocusContext";
import SplitDivider from "@/components/notes/SplitDivider";

const MODES = [
  { id: "write", label: "Write", icon: PenLine },
  { id: "split", label: "Split", icon: Columns2 },
  { id: "read", label: "Read", icon: Eye },
];

/**
 * Single note pane component. Can be in read-only mode (when same note is open in another pane).
 * Manages its own note state, editor registration, and autosave.
 */
export default function NotePane({
  noteId,
  paneId,
  isReadOnly = false,
  onFocus,
  onClose,
  onSplit,
  isInSplit = false,
}) {
  const isNew = noteId === "new";
  const navigate = useNavigate();
  const { notes, reload } = useVault();
  const { focus } = useFocusMode();
  const initialTitle = new URLSearchParams(window.location.search).get("title") || "";
  const { registerPane, unregisterPane, focusPane } = usePaneFocus();

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
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [aiOpen, setAiOpen] = useState(false);
  const [status, setStatus] = useState("idle");
  const [revision, setRevision] = useState(0);
  const [missing, setMissing] = useState(false);
  const [loadingNote, setLoadingNote] = useState(!isNew);
  const [inkOverlayMode, setInkOverlayMode] = useState(false);
  const [readContentRect, setReadContentRect] = useState(null);
  const [findTagsOpen, setFindTagsOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const titleInputRef = useRef(null);

  // Word goal state (from extension storage)
  const [wordGoal, setWordGoal] = useState(0);
  const [editingWordGoal, setEditingWordGoal] = useState(false);
  const [wordGoalDraft, setWordGoalDraft] = useState("");

  // View mode state (persisted in note.style)
  const [viewMode, setViewMode] = useState(() => typography.viewMode || "read");
  const [showNavPane, setShowNavPane] = useState(() => typography.showNavPane === true);
  const [zoom, setZoom] = useState(() => {
    const z = typography.zoom;
    if (typeof z === "number") return z;
    if (z === "page-width" || z === "one-page" || z === "two-pages") return z;
    return 100;
  });
  const [showRuler, setShowRuler] = useState(() => typography.showRuler === true);
  const [showGridlines, setShowGridlines] = useState(() => typography.showGridlines === true);
  const [scrollMode, setScrollMode] = useState(() => typography.scrollMode || "vertical");
  const [navPaneTab, setNavPaneTab] = useState("headings");
  const [findQuery, setFindQuery] = useState("");
  const [findMatches, setFindMatches] = useState([]);
  const [findIndex, setFindIndex] = useState(-1);

  const { t } = useI18n();

  const createdIdRef = useRef(isNew ? null : noteId);
  const loadedIdRef = useRef(null);
  const savePending = useRef(false);
  const latestRef = useRef({ title, body, tags, format, typography, inkId });
  latestRef.current = { title, body, tags, format, typography, inkId };

  // Editor registration
  const editorRef = useRef(null);
  const editorId = `nb-editor-${paneId}`;

  // Register this pane with the focus context
  useEffect(() => {
    registerPane(paneId, {
      editorRef,
      noteId: createdIdRef.current,
      isReadOnly,
    });
    return () => unregisterPane(paneId);
  }, [paneId, registerPane, unregisterPane, isReadOnly]);

  // Focus handling
  const handleFocus = useCallback(() => {
    focusPane(paneId);
    onFocus?.(paneId);
  }, [paneId, focusPane, onFocus]);

  // Load note data
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
    if (createdIdRef.current === noteId && loadedIdRef.current === noteId) {
      setLoadingNote(false);
      return;
    }
    let active = true;
    setLoadingNote(true);
    setMissing(false);
    db.entities.Note.get(noteId)
      .then((note) => {
        if (!active) return;

        // Check if note is encrypted
        if (isNoteLocked(note)) {
          loadedIdRef.current = noteId;
          createdIdRef.current = noteId;
          setTitle(note.title || "");
          setTags(Array.isArray(note.tags) ? note.tags : []);
          setFormat(note.format || "markdown");
          setTypography(normalizeStyle(note.style));
          setInkId(note.ink_page_id || null);
          setMeta({ created_date: note.created_date, updated_date: note.updated_date });
          setIsLocked(true);
          setBody(""); // Don't set encrypted body
          setStatus("idle");
          setRevision(0);
          emitEvent("note:opened", { id: note.id });
          setLoadingNote(false);
          return;
        }

        loadedIdRef.current = noteId;
        createdIdRef.current = noteId;
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
  }, [noteId, isNew, initialTitle]);

  // Load word goal from extension storage
  useEffect(() => {
    if (!isNew && createdIdRef.current) {
      const key = `plugin:word-goal:${createdIdRef.current}`;
      try {
        const saved = readPref(key, 0);
        setWordGoal(Number(saved) || 0);
      } catch {
        setWordGoal(0);
      }
    } else {
      setWordGoal(0);
    }
  }, [createdIdRef.current, isNew]);

  // Save word goal to extension storage
  useEffect(() => {
    if (!isNew && createdIdRef.current && wordGoal !== undefined) {
      const key = `plugin:word-goal:${createdIdRef.current}`;
      writePref(key, wordGoal);
    }
  }, [wordGoal, createdIdRef.current, isNew]);

  // Autosave debounce
  useEffect(() => {
    if (!revision || isReadOnly) return;
    setStatus("saving");
    savePending.current = true;
    const timer = setTimeout(async () => {
      const payload = {
        ...runHook("note:before-save", { title: title.trim() || "Untitled note", body, tags, format }),
        style: normalizeStyle(typography),
        ink_page_id: inkId || null,
      };
      let noteIdToSave = createdIdRef.current;
      if (noteIdToSave) {
        await db.entities.Note.update(noteIdToSave, payload);
      } else {
        const created = await db.entities.Note.create(payload);
        noteIdToSave = created.id;
        createdIdRef.current = noteIdToSave;
        loadedIdRef.current = noteIdToSave;
        navigate(`/note/${noteIdToSave}`, { replace: true });
      }
      savePending.current = false;
      setMeta((prev) => ({ ...prev, updated_date: new Date().toISOString() }));
      setStatus("saved");
      emitEvent("note:saved", { id: noteIdToSave });
      reload();
    }, 800);
    return () => clearTimeout(timer);
  }, [revision, isReadOnly, title, body, tags, format, typography, inkId, navigate, reload]);

  // Flush pending save on unmount
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
      const noteIdToSave = createdIdRef.current;
      if (noteIdToSave) db.entities.Note.update(noteIdToSave, payload).catch(() => {});
      else db.entities.Note.create(payload).catch(() => {});
    },
    []
  );

  const touch = () => setRevision((value) => value + 1);
  const changeBody = (next) => {
    setBody(next);
    touch();
  };
  const images = useNoteImages({ body, onChange: changeBody });

  // Title editing handlers
  const startEditTitle = () => {
    setTitleDraft(title);
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const saveTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed !== title) {
      setTitle(trimmed || "");
      touch();
    }
    setIsEditingTitle(false);
  };

  const cancelEditTitle = () => {
    setTitleDraft(title);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveTitle();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelEditTitle();
    }
  };

  const handleTitleBlur = () => {
    // Small delay to allow click on save/cancel if needed
    setTimeout(saveTitle, 100);
  };

  // Word goal handlers
  const openWordGoal = () => {
    setWordGoalDraft(wordGoal ? String(wordGoal) : "");
    setEditingWordGoal(true);
  };

  const saveWordGoal = (event) => {
    event.preventDefault();
    const value = Math.max(0, Math.min(100000, Math.round(Number(wordGoalDraft)) || 0));
    setWordGoal(value);
    setEditingWordGoal(false);
  };

  const cancelWordGoal = () => {
    setWordGoalDraft(wordGoal ? String(wordGoal) : "");
    setEditingWordGoal(false);
  };

  // Handwriting
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
    const ok = await confirm("Delete all handwriting in this note? This cannot be undone.", { danger: true });
    if (!ok) return;
    await deletePage(inkId).catch(() => {});
    setInkId(null);
    touch();
  };

  const attachInk = async (pageId) => {
    if (inkId && inkId !== pageId) {
      const ok = await confirm("Replace this note's handwriting with the selected page? The current handwriting is deleted.", { danger: true });
      if (!ok) return;
      await deletePage(inkId).catch(() => {});
    }
    setInkId(pageId);
    touch();
  };

  const listAttachable = async () => {
    const [pages, owners] = await Promise.all([
      db.entities.InkPage.list({ sort: "-updated_date", limit: 50 }),
      db.entities.Note.list({ limit: 2000 }),
    ]);
    const used = new Set((owners?.items ?? []).map((item) => item.ink_page_id).filter(Boolean));
    return (pages?.items ?? []).filter((item) => !used.has(item.id));
  };

  const inkName = inkPage.page?.name;
  const patchInk = inkPage.patch;
  useEffect(() => {
    const name = title.trim();
    if (name && inkName !== undefined && inkName !== name) patchInk({ name });
  }, [title, inkName, patchInk]);

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

  // Sync view mode state to typography
  useEffect(() => { setTypography((prev) => ({ ...prev, viewMode })); }, [viewMode]);
  useEffect(() => { setTypography((prev) => ({ ...prev, showNavPane })); }, [showNavPane]);
  useEffect(() => { setTypography((prev) => ({ ...prev, zoom })); }, [zoom]);
  useEffect(() => { setTypography((prev) => ({ ...prev, showRuler })); }, [showRuler]);
  useEffect(() => { setTypography((prev) => ({ ...prev, showGridlines })); }, [showGridlines]);
  useEffect(() => { setTypography((prev) => ({ ...prev, scrollMode })); }, [scrollMode]);

  // Link index and backlinks
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

  // Word count for status bar
  const wordCount = useMemo(() => countWords(body), [body]);

  // Find functionality
  const findMatchesRef = useRef([]);
  const findIndexRef = useRef(-1);

  const performFind = useCallback((query) => {
    if (!query) {
      setFindMatches([]);
      setFindIndex(-1);
      findMatchesRef.current = [];
      findIndexRef.current = -1;
      return;
    }
    const regex = new RegExp(escapeRegExp(query), "gi");
    const matches = [];
    const lines = body.split("\n");
    lines.forEach((line, lineIndex) => {
      let match;
      while ((match = regex.exec(line)) !== null) {
        matches.push({
          line: lineIndex,
          start: match.index,
          end: match.index + match[0].length,
          text: line,
        });
      }
    });
    findMatchesRef.current = matches;
    setFindMatches(matches);
    setFindIndex(matches.length > 0 ? 0 : -1);
    findIndexRef.current = matches.length > 0 ? 0 : -1;
  }, [body]);

  useEffect(() => { performFind(findQuery); }, [findQuery, performFind]);

  const goToMatch = (index) => {
    if (index >= 0 && index < findMatchesRef.current.length) {
      setFindIndex(index);
      findIndexRef.current = index;
      const match = findMatchesRef.current[index];
      const readContent = readContentRef.current;
      if (readContent) {
        const walker = document.createTreeWalker(readContent, NodeFilter.SHOW_TEXT);
        let currentLine = 0;
        let node;
        while ((node = walker.nextNode())) {
          if (currentLine === match.line) {
            const range = document.createRange();
            range.setStart(node, match.start);
            range.collapse(true);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            node.parentElement?.scrollIntoView({ behavior: "smooth", block: "center" });
            break;
          }
          currentLine += (node.textContent?.match(/\n/g) || []).length + 1;
        }
      }
    }
  };

  const findNext = () => {
    const next = (findIndexRef.current + 1) % findMatchesRef.current.length;
    goToMatch(next);
  };

  const findPrev = () => {
    const prev = (findIndexRef.current - 1 + findMatchesRef.current.length) % findMatchesRef.current.length;
    goToMatch(prev);
  };

  // Extract headings for navigation pane
  const headings = useMemo(() => extractHeadings(body), [body]);

  // Navigation Pane Component
  function NavigationPane({ isOpen, onClose, activeTab, onTabChange }) {
    if (!isOpen) return null;

    const handleHeadingClick = (heading) => {
      const readContent = readContentRef.current;
      if (readContent) {
        const element = readContent.querySelector(`[id="${heading.id}"]`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };

    const renderHeadingTree = (headings, level = 1) => {
      if (headings.length === 0) return null;
      const result = [];
      let i = 0;
      while (i < headings.length) {
        const h = headings[i];
        if (h.level < level) break;
        if (h.level === level) {
          const children = [];
          let j = i + 1;
          while (j < headings.length && headings[j].level > level) {
            if (headings[j].level === level + 1) {
              children.push(headings[j]);
            }
            j++;
          }
          result.push(
            <div key={h.id} className="pl-2" style={{ paddingLeft: `${(level - 1) * 12}px` }}>
              <button
                type="button"
                onClick={() => handleHeadingClick(h)}
                className="w-full flex items-center gap-1 px-2 py-1 text-left text-[12px] text-foreground/80 hover:bg-accent rounded transition"
                title={`Go to ${h.text}`}
              >
                <span className="font-mono text-[10px] text-muted-foreground">{"#".repeat(h.level)}</span>
                <span className="truncate">{h.text}</span>
              </button>
              {children.length > 0 && (
                <div className="mt-0.5">{renderHeadingTree(children, level + 1)}</div>
              )}
            </div>
          );
          i = j;
        } else {
          i++;
        }
      }
      return <>{result}</>;
    };

    return (
      <div
        className="fixed inset-y-0 right-0 z-40 w-72 bg-card border-l border-border shadow-xl flex flex-col"
        style={{ height: "100vh", top: 0 }}
        role="complementary"
        aria-label="Navigation pane"
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="font-mono text-[11px] font-medium">Navigation</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-accent transition"
            aria-label="Close navigation pane"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex border-b border-border px-2 py-1">
          <button
            type="button"
            onClick={() => onTabChange("headings")}
            className={cn(
              "flex-1 px-2 py-1 text-[11px] font-mono rounded transition",
              activeTab === "headings" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Headings
          </button>
          <button
            type="button"
            onClick={() => onTabChange("find")}
            className={cn(
              "flex-1 px-2 py-1 text-[11px] font-mono rounded transition",
              activeTab === "find" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Find
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {activeTab === "headings" ? (
            <div>
              {headings.length === 0 ? (
                <p className="text-[12px] text-muted-foreground/60 p-4">No headings in this note</p>
              ) : (
                renderHeadingTree(headings)
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-1">
                <input
                  type="text"
                  value={findQuery}
                  onChange={(e) => setFindQuery(e.target.value)}
                  placeholder="Find in note..."
                  data-find-input
                  className="flex-1 h-8 px-2 text-[12px] rounded border border-border/70 bg-card/60 outline-none focus:border-primary/40"
                  aria-label="Find in note"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={findPrev}
                  disabled={findMatches.length === 0}
                  className="h-8 px-2 rounded border border-border/70 bg-card/60 text-[11px] disabled:opacity-40"
                  aria-label="Previous match"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={findNext}
                  disabled={findMatches.length === 0}
                  className="h-8 px-2 rounded border border-border/70 bg-card/60 text-[11px] disabled:opacity-40"
                  aria-label="Next match"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              {findMatches.length > 0 && (
                <div className="font-mono text-[10px] text-muted-foreground">
                  {findIndex + 1} of {findMatches.length}
                </div>
              )}
              {findMatches.length > 0 && (
                <div className="max-h-[60vh] overflow-y-auto space-y-1">
                  {findMatches.map((match, index) => (
                    <button
                      key={`${match.line}-${match.start}`}
                      type="button"
                      onClick={() => goToMatch(index)}
                      className={cn(
                        "w-full px-2 py-1.5 text-left text-[11px] rounded transition",
                        index === findIndex ? "bg-primary/15 text-primary" : "text-foreground/80 hover:bg-accent"
                      )}
                    >
                      <div className="font-mono text-[10px] text-muted-foreground mb-0.5">
                        Line {match.line + 1}
                      </div>
                      <div className="truncate">{match.text.trim()}</div>
                    </button>
                  ))}
                </div>
              )}
              {findQuery && findMatches.length === 0 && (
                <p className="text-[12px] text-muted-foreground/60 p-4">No matches found</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Print Layout View Component
  function PrintLayoutView({ body, typography, noteInk, onOpenNote, onCreateNote, linkIndex, zoom, showRuler, showGridlines, scrollMode }) {
    const { style, className } = readerProps(typography, noteInk.hasPage && noteInk.markCount > 0);
    const pageWidth = typography.pageWidth || 736;
    const pageHeight = Math.round(pageWidth * 1.414);
    const margin = 72;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

    let zoomFactor = 1;
    if (typeof zoom === "number") zoomFactor = zoom / 100;
    else if (zoom === "page-width") zoomFactor = contentWidth / 736;
    else if (zoom === "one-page") zoomFactor = 1;
    else if (zoom === "two-pages") zoomFactor = 0.5;

    const scaledPageWidth = pageWidth * zoomFactor;
    const scaledPageHeight = pageHeight * zoomFactor;
    const scaledMargin = margin * zoomFactor;
    const scaledContentWidth = contentWidth * zoomFactor;

    return (
      <div
        className="flex flex-col items-center gap-8 p-8"
        style={{
          overflow: scrollMode === "horizontal" ? "auto" : "visible",
          flexDirection: scrollMode === "horizontal" ? "row" : "column",
          alignItems: scrollMode === "horizontal" ? "flex-start" : "center",
          padding: "2rem",
        }}
      >
        {showRuler && (
          <div
            className="relative"
            style={{
              width: scaledPageWidth,
              height: "24px",
              pointerEvents: "none",
            }}
          >
            <div className="absolute top-0 left-0 right-0 bottom-0 border-b border-border/50" />
            <div
              className="absolute top-0 h-full"
              style={{
                left: scaledMargin,
                right: scaledMargin,
                borderLeft: "1px dashed var(--primary)",
                borderRight: "1px dashed var(--primary)",
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 font-mono text-[9px] text-muted-foreground/50 flex justify-between px-1">
              <span>0</span>
              <span>{Math.round(pageWidth / 25.4 * 96)}px</span>
              <span>{Math.round(pageWidth / 25.4 * 96)}px</span>
            </div>
          </div>
        )}

        <div
          className="relative"
          style={{
            width: scaledPageWidth,
            minHeight: scaledPageHeight,
            background: "white",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className="absolute top-2 right-2 font-mono text-[10px] text-muted-foreground/50">
            Page 1
          </div>

          {showGridlines && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
                backgroundSize: `${24 * zoomFactor}px ${24 * zoomFactor}px`,
                opacity: 0.3,
              }}
            />
          )}

          <div
            className="flex-1 overflow-hidden"
            style={{
              padding: `${scaledMargin}px`,
              width: scaledContentWidth,
            }}
          >
            <MarkdownView
              body={body}
              linkIndex={linkIndex}
              typography={typography}
              hasInk={noteInk.hasPage && noteInk.markCount > 0}
              onOpenNote={onOpenNote}
              onCreateNote={onCreateNote}
            />
          </div>
        </div>
      </div>
    );
  }

  // Outline View Component
  function OutlineView({ body, typography, onHeadingClick }) {
    const headings = useMemo(() => extractHeadings(body), [body]);

    const renderOutline = (headings, level = 1) => {
      if (headings.length === 0) return null;
      const result = [];
      let i = 0;
      while (i < headings.length) {
        const h = headings[i];
        if (h.level < level) break;
        if (h.level === level) {
          const children = [];
          let j = i + 1;
          while (j < headings.length && headings[j].level > level) {
            if (headings[j].level === level + 1) {
              children.push(headings[j]);
            }
            j++;
          }
          result.push(
            <div key={h.id} style={{ paddingLeft: `${(level - 1) * 24}px` }}>
              <button
                type="button"
                onClick={() => onHeadingClick(h)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-[14px] hover:bg-accent rounded transition"
              >
                <span className="font-mono text-[11px] text-muted-foreground">{"#".repeat(h.level)}</span>
                <span className="font-medium">{h.text}</span>
              </button>
              {children.length > 0 && (
                <div className="mt-1">{renderOutline(children, level + 1)}</div>
              )}
            </div>
          );
          i = j;
        } else {
          i++;
        }
      }
      return <>{result}</>;
    };

    return (
      <div className="p-6 max-w-3xl mx-auto">
        {headings.length === 0 ? (
          <p className="text-[14px] text-muted-foreground text-center py-12">No headings in this note</p>
        ) : (
          renderOutline(headings)
        )}
      </div>
    );
  }

  // Immersive Reader View Component
  function ImmersiveReaderView({ body, typography, onClose }) {
    const [lineFocus, setLineFocus] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [utterance, setUtterance] = useState(null);
    const linesRef = useRef([]);

    useEffect(() => {
      const text = plainText(body);
      const lines = text.split("\n").filter((l) => l.trim());
      linesRef.current = lines;
    }, [body]);

    const speak = useCallback(() => {
      if (!("speechSynthesis" in window)) return;
      const text = plainText(body);
      if (!text.trim()) return;

      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = navigator.language || "en-US";
      u.rate = 1;
      u.onend = () => setIsPlaying(false);
      u.onerror = () => setIsPlaying(false);
      setUtterance(u);
      setIsPlaying(true);
      window.speechSynthesis.speak(u);
    }, [body]);

    const pause = useCallback(() => {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    }, []);

    const stop = useCallback(() => {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }, []);

    const nextLine = () => {
      setLineFocus((prev) => Math.min(prev + 1, linesRef.current.length - 1));
    };

    const prevLine = () => {
      setLineFocus((prev) => Math.max(prev - 1, 0));
    };

    const { style } = readerProps(typography, false);
    const immersiveStyle = {
      ...style,
      fontSize: "22px",
      lineHeight: "1.8",
      maxWidth: "800px",
      margin: "0 auto",
      padding: "4rem 2rem",
    };

    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ height: "100vh" }}>
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-accent transition"
              aria-label="Exit Immersive Reader"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="font-heading text-lg">Immersive Reader</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevLine}
              disabled={lineFocus === 0}
              className="p-2 rounded-lg border border-border/50 hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous line"
            >
              <ChevronLeft className="h-5 w-5 rotate-90" />
            </button>
            <button
              type="button"
              onClick={isPlaying ? pause : speak}
              className="p-2 rounded-lg border border-border/50 hover:bg-accent"
              aria-label={isPlaying ? "Pause reading" : "Read aloud"}
            >
              {isPlaying ? <Volume2 className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={stop}
              disabled={!isPlaying}
              className="p-2 rounded-lg border border-border/50 hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Stop reading"
            >
              <span className="font-mono text-[12px]">■</span>
            </button>
            <button
              type="button"
              onClick={nextLine}
              disabled={lineFocus >= linesRef.current.length - 1}
              className="p-2 rounded-lg border border-border/50 hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next line"
            >
              <ChevronRight className="h-5 w-5 rotate-90" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-muted-foreground">
              Line {lineFocus + 1} of {linesRef.current.length}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ background: "var(--background)" }}>
          <div className="prose" style={immersiveStyle}>
            {plainText(body).split("\n").map((line, index) => (
              <p
                key={index}
                className="my-2"
                style={{
                  backgroundColor: index === lineFocus ? "var(--primary) / 0.1" : "transparent",
                  borderLeft: index === lineFocus ? "3px solid var(--primary)" : "none",
                  paddingLeft: index === lineFocus ? "12px" : "0",
                  transition: "all 0.2s ease",
                }}
              >
                {line || <br />}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

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

  const readContentRef = useRef(null);

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
          <button onClick={onClose} className="mt-6 inline-block rounded-lg border border-border px-4 py-2 text-[13px] transition hover:bg-accent">
            Close tab
          </button>
        </main>
      </div>
    );
  }

  // Read-only mode: show only MarkdownView, no ribbon, no editor
  if (isReadOnly) {
    return (
      <div className="nb-shell min-h-screen">
        <VaultHeader />
        <main
          className={cn(
            "pb-24 pt-6",
            !isInSplit && "mx-auto max-w-[1180px] px-5 sm:px-6 lg:px-8",
            isInSplit && "px-2",
            focus && "pr-12 sm:pr-14"
          )}
        >
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-[11px] text-primary">
              Read-only (editing in another pane)
            </span>
            <button onClick={onClose} className="ml-auto p-1 rounded hover:bg-accent transition" aria-label="Close tab">
              ×
            </button>
          </div>
          <div className="mt-8">
            <MarkdownView
              body={body}
              linkIndex={linkIndex}
              typography={typography}
              hasInk={noteInk.hasPage && noteInk.markCount > 0}
              onOpenNote={(noteId) => navigate(`/note/${noteId}`)}
              onCreateNote={(newTitle) => insertLink(newTitle, true)}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="nb-shell min-h-screen">
      {!loadingNote && !isLocked ? (
        <VaultHeader>
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
            onTypography={async (next) => {
              const normalized = normalizeStyle(next);
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
                  const ok = await confirm("Changing layout will misalign handwriting. Use 'Insert space' instead. Continue anyway?", { danger: true });
                  if (!ok) return;
                }
              }
              setTypography(normalized);
              touch();
            }}
            tab={ribbonTab}
            onTab={setRibbonTab}
            noteInk={noteInk}
            onFindTags={() => setFindTagsOpen(true)}
          />
        </VaultHeader>
      ) : (
        <VaultHeader />
      )}
      <main
        className={cn(
          "pb-24 pt-4",
          !isInSplit && "mx-auto px-5 sm:px-6 lg:px-8",
          isInSplit && "px-2",
          focus && "pr-12 sm:pr-14"
        )}
      >
        {/* Slim top row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition hover:text-foreground"
            title="Back to vault"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> vault
          </Link>
          <span className="text-[11px] text-muted-foreground/40">/</span>

          {/* Editable title */}
          <div className="flex-1 min-w-0 max-w-[40ch]">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={handleTitleBlur}
                placeholder={t("common.untitledNote")}
                aria-label="Note title"
                className="w-full bg-transparent font-heading text-[18px] font-medium leading-tight tracking-tight text-foreground outline-none placeholder:text-muted-foreground/30 px-1 py-0.5 rounded"
                autoFocus
              />
            ) : (
              <span
                onClick={startEditTitle}
                className="block truncate font-heading text-[18px] font-medium leading-tight tracking-tight text-foreground cursor-pointer hover:underline px-1 py-0.5 rounded transition"
                title={t("common.clickToRename")}
              >
                {title.trim() || t("common.untitledNote")}
              </span>
            )}
          </div>

          {/* Saved indicator */}
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                status === "saving" ? "bg-primary animate-pulse" : "bg-[hsl(var(--link))]"
              )}
            />
            {statusLabel}
          </span>

          {/* Tag chips with + tag */}
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
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
            <form onSubmit={addTag} className="flex items-center">
              <input
                value={tagDraft}
                onChange={(event) => setTagDraft(event.target.value)}
                placeholder={t("common.addTag")}
                aria-label="Add tag"
                className="w-16 bg-transparent px-1 py-1 font-mono text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:w-24 rounded border border-transparent focus:border-primary/30"
              />
            </form>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {/* Write / Split / Read switch */}
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
                  title={label}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Focus button */}
            <FocusToggle />
          </div>
        </div>

        {/* Main content area - centered with reading width, side panel only when open */}
        <div className={cn(
          "mt-6 transition-[max-width] duration-300 ease-out",
          showNavPane ? "max-w-[calc(100%-252px)]" : "max-w-[820px]",
          "mx-auto"
        )}>
          <article className="min-w-0 relative w-full">
            <NavigationPane
              isOpen={showNavPane && viewMode !== "immersive"}
              onClose={() => setShowNavPane(false)}
              activeTab={navPaneTab}
              onTabChange={setNavPaneTab}
            />

            {loadingNote ? (
              <div className="space-y-4">
                <div className="h-9 w-2/3 animate-pulse rounded-md bg-card/60" />
                <div className="h-4 w-full animate-pulse rounded bg-card/40" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-card/40" />
              </div>
            ) : (
              <>
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
                  {mode === "split" ? (
                    // Split mode: editor and preview side by side, scrolling with the page
                    <div className="flex gap-10">
                      {/* Editor pane */}
                      <div className="min-w-0 flex-1" style={{ minWidth: 0 }}>
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
                              showLineNumbers={typography.showLineNumbers}
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
                      {/* Divider */}
                      <SplitDivider ratio={splitRatio} onRatioChange={setSplitRatio} />
                      {/* Preview pane */}
                      <div className="min-w-0 flex-1 relative" style={{ minWidth: 0 }}>
                        {viewMode === "immersive" ? (
                          <ImmersiveReaderView
                            body={body}
                            typography={typography}
                            onClose={() => setViewMode("read")}
                          />
                        ) : viewMode === "print" ? (
                          <PrintLayoutView
                            body={body}
                            typography={typography}
                            noteInk={noteInk}
                            onOpenNote={(noteId) => navigate(`/note/${noteId}`)}
                            onCreateNote={(newTitle) => insertLink(newTitle, true)}
                            linkIndex={linkIndex}
                            zoom={zoom}
                            showRuler={showRuler}
                            showGridlines={showGridlines}
                            scrollMode={scrollMode}
                          />
                        ) : viewMode === "outline" ? (
                          <OutlineView
                            body={body}
                            typography={typography}
                            onHeadingClick={(heading) => {
                              const readContent = readContentRef.current;
                              if (readContent) {
                                const element = readContent.querySelector(`[id="${heading.id}"]`);
                                if (element) {
                                  element.scrollIntoView({ behavior: "smooth", block: "start" });
                                }
                              }
                            }}
                          />
                        ) : viewMode === "draft" ? (
                          <div className="p-4">
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
                              showLineNumbers={typography.showLineNumbers}
                              {...editorProps(typography, noteInk.hasPage && noteInk.markCount > 0)}
                            />
                          </div>
                        ) : (
                          <div ref={readContentRef} className="relative">
                            {markdown ? (
                              <MarkdownView
                                body={body}
                                linkIndex={linkIndex}
                                typography={typography}
                                hasInk={noteInk.hasPage && noteInk.markCount > 0}
                                onOpenNote={(noteId) => navigate(`/note/${noteId}`)}
                                onCreateNote={(newTitle) => insertLink(newTitle, true)}
                              />
                            ) : (
                              <FormatPreview value={body} format={format} />
                            )}
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
                        )}
                        {!body.trim() && viewMode !== "draft" && viewMode !== "immersive" && (
                          <p className="text-[14px] text-muted-foreground">
                            Nothing written yet. Press <span className="font-mono text-[12px]">Write</span> and start.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Write / Read mode (non-split)
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
                                showLineNumbers={typography.showLineNumbers}
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
                        <div className={cn("min-w-0 relative", mode === "split" && "lg:border-l lg:border-border/60 lg:pl-10")}>
                          {viewMode === "immersive" ? (
                            <ImmersiveReaderView
                              body={body}
                              typography={typography}
                              onClose={() => setViewMode("read")}
                            />
                          ) : viewMode === "print" ? (
                            <PrintLayoutView
                              body={body}
                              typography={typography}
                              noteInk={noteInk}
                              onOpenNote={(noteId) => navigate(`/note/${noteId}`)}
                              onCreateNote={(newTitle) => insertLink(newTitle, true)}
                              linkIndex={linkIndex}
                              zoom={zoom}
                              showRuler={showRuler}
                              showGridlines={showGridlines}
                              scrollMode={scrollMode}
                            />
                          ) : viewMode === "outline" ? (
                            <OutlineView
                              body={body}
                              typography={typography}
                              onHeadingClick={(heading) => {
                                const readContent = readContentRef.current;
                                if (readContent) {
                                  const element = readContent.querySelector(`[id="${heading.id}"]`);
                                  if (element) {
                                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                                  }
                                }
                              }}
                            />
                          ) : viewMode === "draft" ? (
                            <div className="p-4">
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
                                showLineNumbers={typography.showLineNumbers}
                                {...editorProps(typography, noteInk.hasPage && noteInk.markCount > 0)}
                              />
                            </div>
                          ) : (
                            <div ref={readContentRef} onScroll={handleReadScroll} className="relative">
                              {markdown ? (
                                <MarkdownView
                                  body={body}
                                  linkIndex={linkIndex}
                                  typography={typography}
                                  hasInk={noteInk.hasPage && noteInk.markCount > 0}
                                  onOpenNote={(noteId) => navigate(`/note/${noteId}`)}
                                  onCreateNote={(newTitle) => insertLink(newTitle, true)}
                                />
                              ) : (
                                <FormatPreview value={body} format={format} />
                              )}
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
                          )}
                          {!body.trim() && viewMode !== "draft" && viewMode !== "immersive" && (
                            <p className="text-[14px] text-muted-foreground">
                              Nothing written yet. Press <span className="font-mono text-[12px]">Write</span> and start.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                )}
              </>
            )}
          </article>

          {/* Bottom status bar */}
          <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-1.5">
            <div className="mx-auto max-w-[820px] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <div className="flex items-center gap-4">
                {/* Word count */}
                <span className="text-muted-foreground">
                  {wordCount} word{wordCount !== 1 ? "s" : ""}
                </span>
                {/* Word goal */}
                {editingWordGoal ? (
                  <form onSubmit={saveWordGoal} className="flex items-center gap-1.5">
                    <Target className="h-3 w-3 text-muted-foreground" />
                    <input
                      type="number"
                      min="0"
                      max="100000"
                      step="50"
                      value={wordGoalDraft}
                      onChange={(e) => setWordGoalDraft(e.target.value)}
                      onBlur={cancelWordGoal}
                      onKeyDown={(e) => e.key === "Enter" && saveWordGoal(e)}
                      placeholder="500"
                      className="w-16 rounded border border-border/70 bg-card/60 px-1.5 py-0.5 font-mono text-[11px] text-foreground outline-none focus:border-primary/40"
                      autoFocus
                    />
                    <span className="text-muted-foreground">{t("common.wordGoal")}s</span>
                    <button type="submit" className="px-2 py-0.5 text-[10px] rounded border border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 transition">{t("common.setGoal")}</button>
                    <button type="button" onClick={cancelWordGoal} className="px-2 py-0.5 text-[10px] rounded border border-border/70 text-muted-foreground hover:bg-accent hover:text-foreground transition">{t("common.editGoal")}</button>
                  </form>
                ) : wordGoal > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <Target className="h-3 w-3 text-muted-foreground" />
                    <span className="text-foreground">{wordCount} / {wordGoal}</span>
                    <span className="text-muted-foreground">({Math.min(100, Math.round((wordCount / wordGoal) * 100))}%)</span>
                    <button type="button" onClick={openWordGoal} className="px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground hover:bg-accent rounded transition">{t("common.editGoal")}</button>
                  </span>
                ) : (
                  <button type="button" onClick={openWordGoal} className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-border/70 text-muted-foreground hover:text-foreground hover:bg-accent transition">
                    <Target className="h-3 w-3" />
                    <span className="text-[9.5px] uppercase tracking-[0.12em]">{t("common.setGoal")}</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{statusLabel === "saving…" ? t("common.savingStatus") : statusLabel === "saved" ? t("common.savedStatus") : t("common.draftStatus")}</span>
              </div>
            </div>
          </div>

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
      {findTagsOpen && (
        <FindTagsPanel
          notes={notes}
          onOpenNote={(noteId, lineNumber) => {
            navigate(`/note/${noteId}`);
          }}
          onClose={() => setFindTagsOpen(false)}
        />
      )}
    </div>
  );
}