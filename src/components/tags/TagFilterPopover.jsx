import { useState, useMemo, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { BUILTIN_TAGS, getTagDef } from "@/lib/tags";
import { collectTags } from "@/lib/vault";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

/**
 * Tag filter popover - multi-select list of all inline tags in the vault.
 * Opens from the Tags chip in the vault filter row.
 */
export default function TagFilterPopover({
  notes = [],
  selectedTags = [],
  onTagsChange,
  open,
  onOpenChange,
}) {
  const { t, localDigits } = useI18n();
  const [filter, setFilter] = useState("");
  const popoverRef = useRef(null);

  // Collect all tags from notes
  const allTags = useMemo(() => collectTags(notes), [notes]);

  // Separate built-in and custom tags
  const builtinTagCounts = {};
  for (const tag of allTags) {
    if (BUILTIN_TAGS.some((bt) => bt.id === tag.tag)) {
      builtinTagCounts[tag.tag] = tag.count;
    }
  }
  const builtinTags = BUILTIN_TAGS.filter((bt) => builtinTagCounts[bt.id]).map((bt) => ({
    tag: bt.id,
    count: builtinTagCounts[bt.id],
    builtin: true,
  }));
  const customTags = allTags
    .filter((tag) => !BUILTIN_TAGS.some((bt) => bt.id === tag.tag))
    .map((tag) => ({ ...tag, builtin: false }));

  // Combined list for filtering
  const allTagsList = [...builtinTags, ...customTags];

  // Filter tags by search query
  const filteredTags = useMemo(() => {
    if (!filter) return allTagsList;
    const q = filter.toLowerCase();
    return allTagsList.filter((t) => t.tag.toLowerCase().includes(q));
  }, [allTagsList, filter]);

  const isSelected = (tag) => selectedTags.includes(tag);

  const handleToggle = (tag) => {
    const next = isSelected(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    onTagsChange(next);
  };

  const handleClearAll = () => {
    onTagsChange([]);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  // Focus filter input when popover opens
  useEffect(() => {
    if (open) {
      const input = popoverRef.current?.querySelector('input[type="search"]');
      input?.focus();
    }
  }, [open]);

  if (allTagsList.length === 0) {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-mono transition"
          >
            <span className="h-3.5 w-3.5 flex-shrink-0" />
            {t("vault.tags")}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-72 p-0"
          align="end"
          sideOffset={4}
          onKeyDown={handleKeyDown}
        >
          <div className="p-4 text-center text-muted-foreground">
            <p className="font-mono text-[12px]">{t("tagFilter.noTags")}</p>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-mono transition",
            selectedTags.length > 0
              ? "bg-primary/15 text-primary border border-primary/30"
              : "bg-card border border-border/70 text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
          aria-pressed={selectedTags.length > 0}
          aria-haspopup="dialog"
          aria-label={t("tagFilter.title")}
        >
          <span className="h-3.5 w-3.5 flex-shrink-0" />
          {t("vault.tags")}
          {selectedTags.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-mono">
              {selectedTags.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        ref={popoverRef}
        className="w-72 p-0 max-h-[50vh]"
        align="end"
        sideOffset={4}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-3">
          <h3 className="font-mono text-[11px] font-medium">{t("tagFilter.title")}</h3>
          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition"
            >
              {t("common.clear")}
            </button>
          )}
        </div>

        {/* Search filter (show when > 8 tags) */}
        {allTagsList.length > 8 && (
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
              <input
                type="search"
                value={filter}
                onChange={handleFilterChange}
                placeholder={t("tagFilter.searchPlaceholder")}
                className="w-full pl-8 pr-3 py-1.5 h-8 rounded-md border border-border/70 bg-card/60 text-[12px] outline-none focus:border-primary/40"
                aria-label={t("tagFilter.searchPlaceholder")}
              />
            </div>
          </div>
        )}

        {/* Tag list */}
        <div className="max-h-[40vh] overflow-y-auto custom-scrollbar">
          {filteredTags.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <p className="font-mono text-[11px]">{t("common.noResults")}</p>
            </div>
          ) : (
            <>
              {/* Built-in tags section */}
              {builtinTags.length > 0 && (
                <div className="p-2">
                  <p className="px-2 py-1 font-mono text-[10px] text-muted-foreground/60 uppercase">
                    {t("tagFilter.builtin")}
                  </p>
                  {builtinTags.map((tagItem) => {
                    const tagDef = getTagDef(tagItem.tag);
                    const Icon = tagDef.icon;
                    return (
                      <label
                        key={tagItem.tag}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition",
                          isSelected(tagItem.tag)
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-accent"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected(tagItem.tag)}
                          onChange={() => handleToggle(tagItem.tag)}
                          className="h-3.5 w-3.5 rounded border-border/70 text-primary focus:ring-primary/40 shrink-0"
                        />
                        <span className="flex items-center gap-1.5 flex-1 min-w-0">
                          {Icon && <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", tagDef.color?.replace("bg-", "text-"))} aria-hidden="true" />}
                          #{tagItem.tag}
                          <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">
                            {localDigits(tagItem.count)}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Custom tags section */}
              {customTags.length > 0 && (
                <div className="p-2 border-t border-border">
                  <p className="px-2 py-1 font-mono text-[10px] text-muted-foreground/60 uppercase">
                    {t("tagFilter.custom")}
                  </p>
                  {customTags.map((tagItem) => (
                    <label
                      key={tagItem.tag}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition",
                        isSelected(tagItem.tag)
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-accent"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected(tagItem.tag)}
                        onChange={() => handleToggle(tagItem.tag)}
                        className="h-3.5 w-3.5 rounded border-border/70 text-primary focus:ring-primary/40 shrink-0"
                      />
                      <span className="flex items-center gap-1.5 flex-1 min-w-0">
                        #{tagItem.tag}
                        <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">
                          {localDigits(tagItem.count)}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with selected count and Done button */}
        {selectedTags.length > 0 && (
          <div className="border-t border-border p-3 flex items-center justify-between">
            <span className="font-mono text-[11px] text-muted-foreground">
              {t("tagFilter.selected", { count: selectedTags.length })}
            </span>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[11px] font-mono hover:bg-primary/90 transition"
            >
              {t("tagFilter.done")}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}