import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Archive, ArrowUpRight, CalendarDays, Code2, Layers, LayoutGrid, ListChecks, Search, Share2, Star, Table2, X, Hash } from "lucide-react";
import { db } from "@/api/localDb";
import useVault from "@/hooks/useVault";
import VaultHeader from "@/components/vault/VaultHeader";
import NoteCard from "@/components/vault/NoteCard";
import SearchResults from "@/components/vault/SearchResults";
import TagRail from "@/components/vault/TagRail";
import VaultSidebar from "@/components/vault/VaultSidebar";
import BackupDialog from "@/components/vault/Backup";
import { collectTags, escapeRegExp, noteLinks, noteTags, relativeTime } from "@/lib/vault";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const SURFACES = [
  { to: "/journal", labelKey: "vault.shortcuts.journal.label", hintKey: "vault.shortcuts.journal.hint", icon: CalendarDays },
  { to: "/calendar", labelKey: "vault.shortcuts.calendar.label", hintKey: "vault.shortcuts.calendar.hint", icon: CalendarDays },
  { to: "/tasks", labelKey: "vault.shortcuts.tasks.label", hintKey: "vault.shortcuts.tasks.hint", icon: ListChecks },
  { to: "/cards", labelKey: "vault.shortcuts.cards.label", hintKey: "vault.shortcuts.cards.hint", icon: Layers },
  { to: "/graph", labelKey: "vault.shortcuts.graph.label", hintKey: "vault.shortcuts.graph.hint", icon: Share2 },
  { to: "/canvas", labelKey: "vault.shortcuts.canvas.label", hintKey: "vault.shortcuts.canvas.hint", icon: LayoutGrid },
  { to: "/tables", labelKey: "vault.shortcuts.tables.label", hintKey: "vault.shortcuts.tables.hint", icon: Table2 },
  { to: "/code", labelKey: "vault.shortcuts.code.label", hintKey: "vault.shortcuts.code.hint", icon: Code2 },
];

export default function VaultHome() {
  const { t, localDigits } = useI18n();
  const {
    notes,
    trashedNotes,
    filteredNotes,
    folders,
    loading,
    activeFolder,
    setActiveFolder,
    recentFilter,
    setRecentFilter,
    showFavourites,
    setShowFavourites,
    includeDeleted,
    setIncludeDeleted,
    reload,
    RECENT_FILTERS,
  } = useVault();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const query = params.get("q") || "";
  const activeTag = params.get("tag") || "";
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [tagSuggestionsOpen, setTagSuggestionsOpen] = useState(false);
  const [tagSuggestionQuery, setTagSuggestionQuery] = useState("");
  const searchRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Filter chips state (synced with URL and VaultSidebar)
  const [chipFavourites, setChipFavourites] = useState(showFavourites);
  const [chipTags, setChipTags] = useState([]); // array of tag strings
  const [chipRecentFilter, setChipRecentFilter] = useState(recentFilter);
  const [chipIncludeDeleted, setChipIncludeDeleted] = useState(includeDeleted);

  // Sync chip state with VaultSidebar state
  useEffect(() => {
    setChipFavourites(showFavourites);
  }, [showFavourites]);

  useEffect(() => {
    setChipRecentFilter(recentFilter);
  }, [recentFilter]);

  useEffect(() => {
    setChipIncludeDeleted(includeDeleted);
  }, [includeDeleted]);

  const patchParams = (changes) => {
    const next = Object.fromEntries(params.entries());
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next[key] = value;
      else delete next[key];
    });
    setParams(next, { replace: true });
  };

  const setQuery = (value) => patchParams({ q: value });
  const toggleTag = (tag) => patchParams({ tag: params.get("tag") === tag ? "" : tag });

  // Filter chips handlers
  const handleFavouritesToggle = () => {
    const next = !chipFavourites;
    setChipFavourites(next);
    setShowFavourites(next);
  };

  const handleRecentFilterChange = (filterId) => {
    setChipRecentFilter(filterId);
    setRecentFilter(filterId);
  };

  const handleIncludeDeletedToggle = () => {
    const next = !chipIncludeDeleted;
    setChipIncludeDeleted(next);
    setIncludeDeleted(next);
  };

  const handleTagChipAdd = (tag) => {
    if (!chipTags.includes(tag)) {
      setChipTags([...chipTags, tag]);
    }
  };

  const handleTagChipRemove = (tag) => {
    setChipTags(chipTags.filter((t) => t !== tag));
  };

  const clearAllFilters = () => {
    setChipFavourites(false);
    setShowFavourites(false);
    setChipTags([]);
    setChipRecentFilter("all");
    setRecentFilter("all");
    setChipIncludeDeleted(false);
    setIncludeDeleted(false);
  };

  const hasActiveFilters = chipFavourites || chipTags.length > 0 || chipRecentFilter !== "all" || chipIncludeDeleted;

  useEffect(() => {
    const onKey = (event) => {
      const target = event.target;
      const typing =
        target instanceof HTMLElement && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable);
      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close tag suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setTagSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Extract tag filters from query (e.g., "#work #personal" -> ["work", "personal"])
  const extractTagFilters = (text) => {
    const matches = text.match(/#([A-Za-z0-9_][A-Za-z0-9_/-]*)/g);
    if (!matches) return [];
    return matches.map((m) => m.slice(1).toLowerCase());
  };

  // Remove tag filters from query for text search
  const removeTagFilters = (text) => {
    return text.replace(/#([A-Za-z0-9_][A-Za-z0-9_/-]*)/g, "").trim();
  };

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      const tagFilters = extractTagFilters(term);
      const textQuery = removeTagFilters(term);
      const pattern = textQuery ? escapeRegExp(textQuery) : ".*";

      let filterQuery = chipIncludeDeleted
        ? {
            $or: [
              { title: { $regex: pattern, $options: "i" } },
              { body: { $regex: pattern, $options: "i" } },
            ],
          }
        : {
            trashed: { $ne: true },
            $or: [
              { title: { $regex: pattern, $options: "i" } },
              { body: { $regex: pattern, $options: "i" } },
            ],
          };

      // Add tag filters if any
      if (tagFilters.length > 0) {
        filterQuery = {
          $and: [
            filterQuery,
            ...tagFilters.map((tag) => ({
              $or: [
                { tags: { $in: [tag] } },
                { body: { $regex: `#${tag}(\\b|/)`, $options: "i" } },
              ],
            })),
          ],
        };
      }

      const page = await db.entities.Note.filter(filterQuery, { sort: "-updated_date", limit: 40 });
      setResults(page?.items ?? []);
      setSearching(false);
    }, 220);
    return () => clearTimeout(timer);
  }, [query, chipIncludeDeleted]);

  const tags = useMemo(() => collectTags(notes), [notes]);
  const linkCount = useMemo(() => notes.reduce((total, note) => total + noteLinks(note).length, 0), [notes]);
  const visibleNotes = useMemo(() => {
    let result = filteredNotes;
    // Filter by activeTag from URL (single tag from TagRail click)
    if (activeTag) {
      result = result.filter((note) => noteTags(note).includes(activeTag));
    }
    // Filter by chipTags (multi-select from tag filter popover) - AND logic
    if (chipTags.length > 0) {
      result = result.filter((note) => {
        const noteTagList = noteTags(note);
        return chipTags.every((tag) => noteTagList.includes(tag));
      });
    }
    return result;
  }, [filteredNotes, activeTag, chipTags]);
  const isSearching = query.trim().length >= 2;

  const handleCreateFolder = async (folderPath) => {
    await reload();
  };

  const handleRefresh = async () => {
    await reload();
  };

  // Tag suggestions for inline #tag search
  const allTags = useMemo(() => collectTags(notes).map((t) => t.tag), [notes]);
  const filteredTagSuggestions = useMemo(() => {
    if (!tagSuggestionQuery) return allTags;
    return allTags.filter((tag) => tag.toLowerCase().includes(tagSuggestionQuery.toLowerCase()));
  }, [allTags, tagSuggestionQuery]);

  const handleSearchKeyDown = (e) => {
    if (e.key === "ArrowDown" && tagSuggestionsOpen && filteredTagSuggestions.length > 0) {
      e.preventDefault();
      // Focus first suggestion (handled by popover)
    }
    if (e.key === "Escape") {
      setTagSuggestionsOpen(false);
    }
  };

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Detect # trigger for tag suggestions
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const match = textBeforeCursor.match(/#([A-Za-z0-9_/-]*)$/);
    if (match) {
      setTagSuggestionQuery(match[1]);
      setTagSuggestionsOpen(true);
    } else {
      setTagSuggestionsOpen(false);
    }
  };

  const insertTagSuggestion = (tag) => {
    const cursorPos = searchRef.current?.selectionStart ?? query.length;
    const textBeforeCursor = query.slice(0, cursorPos);
    const match = textBeforeCursor.match(/#([A-Za-z0-9_/-]*)$/);
    if (match) {
      const newQuery = query.slice(0, cursorPos - match[0].length) + `#${tag} ` + query.slice(cursorPos);
      setQuery(newQuery);
      // Move cursor after inserted tag
      setTimeout(() => {
        if (searchRef.current) {
          searchRef.current.selectionStart = searchRef.current.selectionEnd = cursorPos - match[0].length + tag.length + 2;
        }
      }, 0);
    }
    setTagSuggestionsOpen(false);
  };

  return (
    <div className="nb-shell min-h-screen">
      <VaultHeader />
      <main className="mx-auto max-w-[1180px] px-5 pb-24 sm:px-6 lg:px-8">
        <section className="nb-rise pt-8 md:pt-12">
          <p className="nb-label">{t("vault.heroBadge")}</p>
          <h1 className="mt-3 font-display text-[34px] leading-[1.06] tracking-tight sm:text-[44px] md:text-[54px]">
            {t("vault.heroTitle")}
            <span className="block italic text-primary/90">{t("vault.heroSubtitle")}</span>
          </h1>

          <div className="relative mt-8 max-w-2xl" ref={searchContainerRef}>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              value={query}
              onChange={handleSearchInput}
              onKeyDown={handleSearchKeyDown}
              placeholder={t("vault.searchPlaceholder")}
              aria-label={t("header.searchVault")}
              className="h-14 w-full rounded-xl border border-border bg-card/50 pl-12 pr-20 text-[15px] text-foreground outline-none transition focus:border-primary/40 focus:bg-card focus:ring-4 focus:ring-primary/5"
            />
            {tagSuggestionsOpen && filteredTagSuggestions.length > 0 && (
              <div
                className="absolute top-full left-0 right-0 mt-1 max-h-60 w-full max-w-[360px] rounded-md border bg-popover shadow-md overflow-hidden z-50 custom-scrollbar"
                role="listbox"
              >
                {filteredTagSuggestions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertTagSuggestion(tag)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-accent transition"
                    role="option"
                  >
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono">#{tag}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={t("common.clearSearch")}
                  className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd className="rounded border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  /
                </kbd>
              )}
              {/* Backup button - opens as dialog */}
              <button
                type="button"
                onClick={() => setBackupOpen(true)}
                aria-label={t("vault.backupTooltip")}
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <Archive className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <p className="mt-4 font-mono text-[11px] text-muted-foreground" dir="auto">
            {t("vault.stats.notes", { count: localDigits(notes.length), plural: notes.length !== 1 ? "s" : "" })} · {t("vault.stats.tags", { count: localDigits(tags.length), plural: tags.length !== 1 ? "s" : "" })} · {t("vault.stats.links", { count: localDigits(linkCount), plural: linkCount !== 1 ? "s" : "" })}
          </p>

          {/* Filter chips row */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {/* Favourites chip */}
            <button
              type="button"
              onClick={handleFavouritesToggle}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-mono transition",
                chipFavourites
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-card border border-border/70 text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              aria-pressed={chipFavourites}
            >
              <Star className={cn("h-3.5 w-3.5 flex-shrink-0", chipFavourites ? "fill-current" : "")} />
              {t("vault.favourites")}
            </button>

            {/* Selected tags as removable chips (from inline #tag search) */}
            {chipTags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-1 text-[11px] font-mono">
                #{tag}
                <button
                  type="button"
                  onClick={() => handleTagChipRemove(tag)}
                  className="p-0.5 rounded-full hover:bg-primary/20 transition"
                  aria-label={t("common.removeTag", { tag })}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {/* Recent filter chips */}
            {RECENT_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => handleRecentFilterChange(filter.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-mono transition",
                  chipRecentFilter === filter.id
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-card border border-border/70 text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                aria-pressed={chipRecentFilter === filter.id}
              >
                {t(`vault.recent.${filter.id}`)}
              </button>
            ))}

            {/* Include deleted chip */}
            <button
              type="button"
              onClick={handleIncludeDeletedToggle}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-mono transition",
                chipIncludeDeleted
                  ? "bg-destructive/15 text-destructive border border-destructive/30"
                  : "bg-card border border-border/70 text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              aria-pressed={chipIncludeDeleted}
            >
              {t("vault.includeDeleted")}
            </button>

            {/* Clear filters action */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-mono text-muted-foreground bg-card border border-border/70 transition hover:text-foreground hover:bg-accent"
              >
                <X className="h-3.5 w-3.5" />
                {t("vault.clearFilters")}
              </button>
            )}
          </div>

          {/* Shortcut cards - single slim row */}
          <div className="mt-7 flex flex-wrap gap-2">
            {SURFACES.map((surface) => {
              return (
                <Link
                  key={surface.to}
                  to={surface.to}
                  className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/30 px-3.5 py-3 transition hover:border-primary/30 hover:bg-card/60"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border/70 bg-background/60 text-muted-foreground transition group-hover:border-primary/40 group-hover:text-primary">
                    <surface.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium text-foreground">{t(surface.labelKey)}</span>
                    <span className="block truncate font-mono text-[10px] text-muted-foreground">{t(surface.hintKey)}</span>
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition group-hover:text-primary" />
                </Link>
              );
            })}
          </div>
        </section>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_248px_280px]">
          <div className="min-w-0 lg:col-span-2">
            {isSearching ? (
              <section>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-[13px] font-medium tracking-tight">{t("vault.searchResults")}</h2>
                  {results && (
                    <span className="font-mono text-[10px] text-muted-foreground">{results.length} {t("vault.matches")}</span>
                  )}
                </div>
                <div className="mt-3">
                  <SearchResults
                    query={query.trim()}
                    results={results}
                    loading={searching || loading}
                    onRestore={reload}
                    filterTags={chipTags}
                  />
                </div>
              </section>
            ) : (
              <>
                {activeTag && (
                  <div className="mb-6 flex items-center gap-2">
                    <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1 font-mono text-[11px] text-primary">
                      #{activeTag}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleTag(activeTag)}
                      className="font-mono text-[11px] text-muted-foreground transition hover:text-foreground"
                    >
                      {t("common.clear")}
                    </button>
                  </div>
                )}

                {/* Favourites section */}
                {showFavourites && visibleNotes.length > 0 && (
                  <section className="mb-6">
                    <div className="flex items-baseline justify-between mb-3">
                      <h2 className="text-[13px] font-medium tracking-tight flex items-center gap-2">
                        <span className="text-yellow-400">★</span> {t("vault.favourites")}
                      </h2>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {visibleNotes.filter((n) => n.favourite).length} {t("vault.notes")}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {visibleNotes.filter((n) => n.favourite).slice(0, 6).map((note) => (
                        <NoteCard key={note.id} note={note} />
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
                    <h2 className="text-[13px] font-medium tracking-tight" dir="auto">
                      {activeTag
                        ? t("vault.tagged", { tag: activeTag })
                        : activeFolder !== undefined
                        ? activeFolder
                          ? `${t("vault.folder")}: ${activeFolder}`
                          : t("vault.unfiled")
                        : t("vault.recentNotes")}
                    </h2>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {visibleNotes.length} {t("vault.notes")}
                    </span>
                  </div>

                  {loading ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[0, 1, 2, 3].map((row) => (
                        <div key={row} className="h-[132px] animate-pulse rounded-xl border border-border/60 bg-card/30" />
                      ))}
                    </div>
                  ) : visibleNotes.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-border/80 bg-card/20 px-6 py-14 text-center">
                      <p className="text-[14px] text-foreground">{t("vault.nothingHere")}</p>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        {t("vault.startsWithOneNote")}
                      </p>
                      <Link
                        to="/note/new"
                        className="mt-5 inline-flex items-center rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-[13px] text-primary transition hover:bg-primary/15"
                      >
                        {t("vault.writeFirstNote")}
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {visibleNotes.slice(0, 6).map((note) => (
                        <NoteCard key={note.id} note={note} />
                      ))}
                    </div>
                  )}
                </section>

                {visibleNotes.length > 6 && (
                  <section className="mt-12">
                    <h2 className="text-[13px] font-medium tracking-tight">{t("vault.allNotes")}</h2>
                    <ul className="mt-2 divide-y divide-border/50">
                      {visibleNotes.map((note) => (
                        <li key={note.id}>
                          <button
                            type="button"
                            onClick={(e) => {
                              if (e.ctrlKey || e.metaKey) {
                                e.preventDefault();
                                window.open(`/note/${note.id}`, "_blank");
                                return;
                              }
                              navigate(`/note/${note.id}`);
                            }}
                            className="flex items-center gap-3 rounded-md px-2 py-2.5 transition hover:bg-card/50 w-full text-left"
                          >
                            <span className="truncate text-[13.5px] text-foreground/90">{note.title}</span>
                            {note.favourite && <span className="text-yellow-400">★</span>}
                            <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
                              {relativeTime(note.updated_date)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}
          </div>

          <VaultSidebar
            folders={folders}
            activeFolder={activeFolder}
            onSelectFolder={setActiveFolder}
            recentFilter={recentFilter}
            onSetRecentFilter={setRecentFilter}
            showFavourites={showFavourites}
            onToggleFavourites={setShowFavourites}
            includeDeleted={includeDeleted}
            onToggleIncludeDeleted={setIncludeDeleted}
            onCreateFolder={handleCreateFolder}
            onRefresh={handleRefresh}
            noteCount={notes.length}
            trashedCount={trashedNotes.length}
          />

          <TagRail
            tags={tags}
            activeTag={activeTag}
            onSelect={toggleTag}
            noteCount={notes.length}
            linkCount={linkCount}
          />
        </div>
      </main>
      <BackupDialog open={backupOpen} onClose={() => setBackupOpen(false)} />
    </div>
  );
}