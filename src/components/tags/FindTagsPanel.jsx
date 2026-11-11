import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { X, Search, Calendar, Tag, Clock, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { BUILTIN_TAGS, getTagDef, findAllTaggedLines, filterTaggedLines } from "@/lib/tags";
import { db } from "@/api/localDb";
import { useNavigate } from "react-router-dom";
import TagButton from "@/components/ribbon/tabs/TagButton";
import { useI18n } from "@/lib/i18n";

/**
 * Find Tags dialog - shows all tagged lines across the vault.
 * Opened from Home tab "Find Tags" button or from TagRail in vault home.
 */
export default function FindTagsDialog({
  notes,
  onOpenNote,
  open,
  onClose,
  initialTag = null,
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [activeTag, setActiveTag] = useState(initialTag);
  const [dateRange, setDateRange] = useState(""); // "", "today", "week", "month"
  const [searchQuery, setSearchQuery] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get all tagged lines from all notes
  const allTaggedLines = useMemo(() => {
    if (!notes || !notes.length) return [];
    return findAllTaggedLines(notes);
  }, [notes]);

  // Filter tagged lines
  const filteredLines = useMemo(() => {
    return filterTaggedLines(allTaggedLines, {
      tagId: activeTag,
      dateRange,
      query: searchQuery,
    });
  }, [allTaggedLines, activeTag, dateRange, searchQuery]);

  // Group by tag for display
  const groupedLines = useMemo(() => {
    const groups = {};
    for (const line of filteredLines) {
      if (!groups[line.tagId]) {
        const tagDef = getTagDef(line.tagId);
        groups[line.tagId] = {
          tagId: line.tagId,
          label: tagDef.label,
          icon: tagDef.icon,
          color: tagDef.color,
          bgColor: tagDef.bgColor,
          lines: [],
        };
      }
      groups[line.tagId].lines.push(line);
    }
    // Sort groups by tag order
    return Object.values(groups).sort((a, b) => {
      const orderA = getTagDef(a.tagId).order || 99;
      const orderB = getTagDef(b.tagId).order || 99;
      return orderA - orderB;
    });
  }, [filteredLines]);

  // Handle clicking a tagged line - open the note at that line
  const handleLineClick = (line, event) => {
    // Ctrl+click (or Cmd+click on Mac) opens in new tab
    if (event?.ctrlKey || event?.metaKey) {
      event.preventDefault();
      window.open(`/note/${line.noteId}`, "_blank");
      return;
    }
    onClose?.();
    onOpenNote?.(line.noteId, line.lineNumber);
  };

  // Create a summary note from filtered lines
  const handleCreateSummary = async () => {
    if (filteredLines.length === 0) return;

    setLoading(true);
    try {
      const now = new Date().toISOString().split("T")[0];
      const tagFilter = activeTag ? ` #${activeTag}` : "";
      const dateFilter = dateRange ? ` (${dateRange})` : "";
      const searchFilter = searchQuery ? ` search:"${searchQuery}"` : "";

      let body = `# Tag Summary${tagFilter}${dateFilter}${searchFilter}\n\n`;
      body += `Generated: ${now}\n`;
      body += `Total lines: ${filteredLines.length}\n\n`;

      for (const group of groupedLines) {
        body += `## ${group.label}\n\n`;
        for (const line of group.lines) {
          const tagMarker = `{tag:${line.tagId}} `;
          body += `- ${tagMarker}[[${line.noteTitle}]] (line ${line.lineNumber}): ${line.lineText}\n`;
        }
        body += "\n";
      }

      const created = await db.entities.Note.create({
        title: `Tag Summary${tagFilter} ${now}`,
        body,
        tags: ["summary", "auto-generated", ...(activeTag ? [activeTag] : [])],
      });

      navigate(`/note/${created.id}`);
      onClose?.();
    } catch (error) {
      console.error("Failed to create summary note:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalCount = filteredLines.length;
  const tagOptions = useMemo(() => {
    const counts = {};
    for (const line of allTaggedLines) {
      counts[line.tagId] = (counts[line.tagId] || 0) + 1;
    }
    return [...BUILTIN_TAGS]
      .filter((t) => counts[t.id])
      .map((t) => ({ ...t, count: counts[t.id] }))
      .sort((a, b) => b.count - a.count);
  }, [allTaggedLines]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent maxWidth="max-w-[36rem]">
        {/* Header */}
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <DialogTitle className="font-mono text-[12px] font-medium">{t("findTags.title")}</DialogTitle>
              {totalCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono bg-primary/15 text-primary rounded">
                  {totalCount}
                </span>
              )}
            </div>
            <DialogClose className="p-1 rounded hover:bg-accent transition" aria-label={t("common.close")}>
              <X className="h-4 w-4" />
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Filters - scrollable body */}
        <DialogBody className="pb-0">
          <div className="space-y-4 pt-3">
            {/* Tag filter */}
            <div>
              <label className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground mb-1.5">
                <Tag className="h-3 w-3" />
                {t("findTags.filterByTag")}
              </label>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTag(null)}
                  className={cn(
                    "px-2 py-1 rounded-md text-[11px] font-mono transition",
                    !activeTag
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-card border border-border/70 hover:bg-accent"
                  )}
                >
                  {t("findTags.allTags")}
                </button>
                {tagOptions.map((tagDef) => (
                  <TagButton
                    key={tagDef.id}
                    tagDef={tagDef}
                    active={activeTag === tagDef.id}
                    onClick={() => setActiveTag(tagDef.id)}
                    showLabel={true}
                    showShortcut={false}
                  />
                ))}
              </div>
            </div>

            {/* Date range filter */}
            <div>
              <label className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground mb-1.5">
                <Calendar className="h-3 w-3" />
                {t("findTags.dateRange")}
              </label>
              <div className="flex flex-wrap gap-1">
                {["", "today", "week", "month"].map((range) => (
                  <button
                    key={range || "all"}
                    type="button"
                    onClick={() => setDateRange(range)}
                    className={cn(
                      "px-2 py-1 rounded-md text-[11px] font-mono transition",
                      dateRange === range
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "bg-card border border-border/70 hover:bg-accent"
                    )}
                  >
                    {range === "" ? t("findTags.allTime") : range === "today" ? t("findTags.today") : range === "week" ? t("findTags.week") : t("findTags.month")}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("findTags.searchPlaceholder")}
                className="w-full pl-8 pr-3 py-1.5 h-8 rounded-md border border-border/70 bg-card/60 text-[12px] outline-none focus:border-primary/40"
                aria-label={t("findTags.searchAria")}
              />
            </div>

            {/* Hide completed toggle */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hideCompleted}
                onChange={(e) => setHideCompleted(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border/70 text-primary focus:ring-primary/40"
              />
              <span className="font-mono text-[11px] text-foreground/80">{t("findTags.hideCompleted")}</span>
            </label>
          </div>
        </DialogBody>

        {/* Results - scrollable body */}
        <DialogBody className="pt-0">
          <div className="custom-scrollbar">
            {groupedLines.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground/60">
                <Tag className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-mono text-[12px] text-center">
                  {allTaggedLines.length === 0
                    ? t("findTags.emptyVault")
                    : t("findTags.noMatches")}
                </p>
              </div>
            ) : (
              <>
                {groupedLines.map((group) => (
                  <div key={group.tagId} className="mb-4">
                    <div className="flex items-center gap-2 mb-2 px-1">
                      {group.icon && (
                        <group.icon
                          className={cn("h-3.5 w-3.5 flex-shrink-0", group.color?.replace("text-", ""))}
                          aria-hidden="true"
                        />
                      )}
                      <span className="font-medium text-[12px]">{group.label}</span>
                      <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">
                        {group.lines.length}
                      </span>
                    </div>
                    <div className="space-y-1 ml-5">
                      {group.lines.map((line, index) => {
                        const isTodo = line.tagId === "todo";
                        const isCompleted = isTodo && line.lineText.trim().startsWith("[x]");
                        const shouldHide = hideCompleted && isCompleted;
                        if (shouldHide) return null;

                        return (
                          <button
                            key={`${line.noteId}-${line.lineNumber}`}
                            type="button"
                            onClick={(e) => handleLineClick(line, e)}
                            className={cn(
                              "w-full flex items-start gap-2 px-2 py-1.5 text-left rounded-md transition",
                              "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                              isCompleted && "opacity-50 line-through"
                            )}
                            title={`Open "${line.noteTitle}" at line ${line.lineNumber}`}
                          >
                            <span className="flex-shrink-0 font-mono text-[10px] text-muted-foreground/60 mt-0.5">
                              {line.noteTitle}
                            </span>
                            <span className="flex-1 truncate text-[11px] text-foreground/80">
                              {line.lineText || "(empty line)"}
                            </span>
                            <Clock className="flex-shrink-0 h-3 w-3 text-muted-foreground/40 mt-0.5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </DialogBody>

        {/* Footer actions */}
        <DialogFooter className="border-t border-border pt-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground w-full sm:w-auto">
              <span>{totalCount} {totalCount !== 1 ? t("findTags.lines") : t("findTags.line")}</span>
              {activeTag && <span>· {t("findTags.filteredBy", { tag: getTagDef(activeTag).label })}</span>}
              {dateRange && <span>· {dateRange === "today" ? t("findTags.today") : dateRange === "week" ? t("findTags.week") : t("findTags.month")}</span>}
              {searchQuery && <span>· {t("findTags.searchLabel")}: "{searchQuery}"</span>}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-md border border-border/70 text-[11px] font-mono hover:bg-accent transition"
              >
                {t("common.close")}
              </button>
              {totalCount > 0 && (
                <button
                  type="button"
                  onClick={handleCreateSummary}
                  disabled={loading}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[11px] font-mono hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      {t("findTags.creating")}
                    </>
                  ) : (
                    t("findTags.createSummary")
                  )}
                </button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}