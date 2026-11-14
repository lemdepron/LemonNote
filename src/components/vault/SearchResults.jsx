import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SearchX, Trash2, RotateCcw, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { noteTags, relativeTime, snippet } from "@/lib/vault";
import { findAllTaggedLines, getTagDef } from "@/lib/tags";
import Highlight from "@/components/vault/Highlight";
import { restoreNote } from "@/lib/notes";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export default function SearchResults({ query, results, loading, onRestore, filterTags = [] }) {
  const { t, localDigits } = useI18n();
  const navigate = useNavigate();
  const [hideCompleted, setHideCompleted] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  const [creatingSummary, setCreatingSummary] = useState(false);

  const handleNoteClick = (noteId, event) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      window.open(`/note/${noteId}`, "_blank");
      return;
    }
    navigate(`/note/${noteId}`);
  };

  const handleRestore = async (event, noteId, title) => {
    event.stopPropagation();
    event.preventDefault();
    await restoreNote(noteId);
    toast.success(t("vault.trash.toastRestored", { title: title || t("common.untitledNote") }));
    if (onRestore) onRestore(noteId);
  };

  // Extract tagged lines for each result note
  const notesWithTaggedLines = useMemo(() => {
    if (!results?.length) return [];
    return results.map((note) => {
      const taggedLines = findAllTaggedLines([note]);
      // Filter by filterTags if provided
      let filteredLines = taggedLines;
      if (filterTags.length > 0) {
        filteredLines = taggedLines.filter((line) => filterTags.includes(line.tagId));
      }
      // Filter by search query
      if (query) {
        const q = query.toLowerCase();
        filteredLines = filteredLines.filter(
          (l) => l.noteTitle.toLowerCase().includes(q) || l.lineText.toLowerCase().includes(q)
        );
      }
      // Sort by line number
      filteredLines.sort((a, b) => a.lineNumber - b.lineNumber);
      return { ...note, taggedLines: filteredLines };
    });
  }, [results, filterTags, query]);

  // Filter out completed todo lines if hideCompleted is true
  const notesWithFilteredLines = useMemo(() => {
    if (!hideCompleted) return notesWithTaggedLines;
    return notesWithTaggedLines.map((note) => ({
      ...note,
      taggedLines: note.taggedLines.filter((line) => {
        const isTodo = line.tagId === "todo";
        const isCompleted = isTodo && line.lineText.trim().startsWith("[x]");
        return !isCompleted;
      }),
    }));
  }, [notesWithTaggedLines, hideCompleted]);

  const hasAnyTaggedLines = useMemo(() => {
    return notesWithFilteredLines.some((note) => note.taggedLines.length > 0);
  }, [notesWithFilteredLines]);

  const totalTaggedLinesCount = useMemo(() => {
    return notesWithFilteredLines.reduce((sum, note) => sum + note.taggedLines.length, 0);
  }, [notesWithFilteredLines]);

  const toggleExpanded = (noteId) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  };

  const handleCreateSummary = async () => {
    if (totalTaggedLinesCount === 0) return;
    setCreatingSummary(true);
    try {
      const now = new Date().toISOString().split("T")[0];
      const tagFilter = filterTags.length > 0 ? ` #${filterTags.join(" #")}` : "";
      const searchFilter = query ? ` search:"${query}"` : "";
      const hideFilter = hideCompleted ? " (hidden completed)" : "";

      let body = `# Tag Summary${tagFilter}${searchFilter}${hideFilter}\n\n`;
      body += `Generated: ${now}\n`;
      body += `Total lines: ${totalTaggedLinesCount}\n\n`;

      for (const note of notesWithFilteredLines) {
        if (note.taggedLines.length === 0) continue;
        body += `## ${note.title || "Untitled"}\n\n`;
        for (const line of note.taggedLines) {
          const tagMarker = `{tag:${line.tagId}} `;
          body += `- ${tagMarker}[[${line.noteTitle}]] (line ${line.lineNumber}): ${line.lineText}\n`;
        }
        body += "\n";
      }

      // Use db from localDb - need to import it
      const { db } = await import("@/api/localDb");
      const created = await db.entities.Note.create({
        title: `Tag Summary${tagFilter} ${now}`,
        body,
        tags: ["summary", "auto-generated", ...filterTags],
      });

      navigate(`/note/${created.id}`);
      toast.success(t("searchResults.createSummary"));
    } catch (error) {
      console.error("Failed to create summary note:", error);
      toast.error("Failed to create summary note");
    } finally {
      setCreatingSummary(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((row) => (
          <div key={row} className="h-[74px] animate-pulse rounded-xl border border-border/60 bg-card/30" />
        ))}
      </div>
    );
  }

  if (!results?.length) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-card/20 px-6 py-12 text-center">
        <SearchX className="mx-auto h-5 w-5 text-muted-foreground" />
        <p className="mt-3 text-[14px] text-foreground">{t("vault.search.noNoteMentions", { query })}</p>
        <p className="mt-1 text-[13px] text-muted-foreground">{t("vault.search.startWithTitle")}</p>
        <button
          type="button"
          onClick={() => navigate(`/note/new?title=${encodeURIComponent(query)}`)}
          className="mt-4 inline-flex items-center rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-[13px] text-primary transition hover:bg-primary/15"
        >
          {t("vault.search.createNote", { query })}
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header with tagged lines controls */}
      {hasAnyTaggedLines && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-mono text-muted-foreground">
          <span>{totalTaggedLinesCount} {totalTaggedLinesCount !== 1 ? t("findTags.lines") : t("findTags.line")}</span>
          {filterTags.length > 0 && <span>· {t("findTags.filteredBy", { tag: filterTags.join(", #") })}</span>}
          <label className="flex items-center gap-1.5 ml-auto">
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border/70 text-primary focus:ring-primary/40"
            />
            <span>{t("searchResults.hideCompleted")}</span>
          </label>
          {totalTaggedLinesCount > 0 && (
            <button
              type="button"
              onClick={handleCreateSummary}
              disabled={creatingSummary}
              className="ml-2 px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
            >
              {creatingSummary ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                  {t("findTags.creating")}
                </>
              ) : (
                t("searchResults.createSummary")
              )}
            </button>
          )}
        </div>
      )}

      <ul className="divide-y divide-border/60">
        {notesWithFilteredLines.map((note) => {
          const isExpanded = expandedNotes.has(note.id);
          const hasTaggedLines = note.taggedLines.length > 0;

          return (
            <li key={note.id}>
              <button
                type="button"
                onClick={(e) => handleNoteClick(note.id, e)}
                className={cn(
                  "group block w-full rounded-lg px-2 py-3.5 transition hover:bg-card/50 text-start",
                  note.trashed && "bg-destructive/5 border-destructive/20"
                )}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-[14.5px] font-medium tracking-tight text-foreground">
                    <Highlight text={note.title || t("common.untitledNote")} query={query} />
                    {note.trashed && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded bg-destructive/10 px-1.5 py-0.5 font-mono text-[9px] text-destructive" dir="auto">
                        <Trash2 className="h-2.5 w-2.5" /> {t("vault.search.bin")}
                      </span>
                    )}
                  </h3>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground" dir="auto">
                    {localDigits(relativeTime(note.updated_date))}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  <Highlight text={snippet(note.body, query, 190)} query={query} />
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {noteTags(note)
                    .slice(0, 4)
                    .map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-border/70 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                        dir="auto"
                      >
                        #{tag}
                      </span>
                    ))}
                  {note.trashed && (
                    <button
                      type="button"
                      onClick={(e) => handleRestore(e, note.id, note.title)}
                      className="ml-auto flex h-6 items-center gap-1 rounded border border-destructive/50 bg-destructive/10 px-2 font-mono text-[10px] text-destructive transition hover:bg-destructive/20"
                    >
                      <RotateCcw className="h-3 w-3" />
                      {t("vault.trash.restoreButton")}
                    </button>
                  )}
                </div>

                {/* Tagged lines expandable section */}
                {hasTaggedLines && (
                  <div className="mt-3 border-t border-border/50 pt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(note.id);
                      }}
                      className="flex items-center gap-2 w-full px-2 py-2 text-left rounded-md hover:bg-accent transition"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      )}
                      <span className="font-medium text-[12px] text-foreground">
                        {t("searchResults.taggedLines")}
                      </span>
                      <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                        {note.taggedLines.length}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 ml-6 space-y-1 border-l border-border/50 pl-3">
                        {note.taggedLines.map((line, index) => {
                          const isTodo = line.tagId === "todo";
                          const isCompleted = isTodo && line.lineText.trim().startsWith("[x]");
                          const tagDef = getTagDef(line.tagId);

                          return (
                            <div
                              key={`${note.id}-${line.lineNumber}`}
                              className={cn(
                                "flex items-start gap-2 px-2 py-1.5 rounded-md transition",
                                "hover:bg-accent",
                                isCompleted && "opacity-50 line-through"
                              )}
                            >
                              {tagDef.icon && (
                                <tagDef.icon
                                  className={cn("h-3.5 w-3.5 flex-shrink-0 mt-0.5", tagDef.color?.replace("bg-", "text-"))}
                                  aria-hidden="true"
                                />
                              )}
                              <span className="flex-shrink-0 font-mono text-[10px] text-muted-foreground/60 mt-0.5">
                                L{line.lineNumber}
                              </span>
                              <span className="flex-1 truncate text-[11px] text-foreground/80">
                                {line.lineText || "(empty line)"}
                              </span>
                              <span className="flex-shrink-0 font-mono text-[10px] text-muted-foreground/60">
                                #{line.tagId}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {hasAnyTaggedLines && totalTaggedLinesCount === 0 && (
        <div className="mt-4 text-center text-muted-foreground/60">
          <p className="font-mono text-[12px]">{t("searchResults.noTaggedLines")}</p>
        </div>
      )}
    </div>
  );
}