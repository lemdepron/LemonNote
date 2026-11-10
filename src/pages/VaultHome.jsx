import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Archive, ArrowUpRight, CalendarDays, Code2, Layers, LayoutGrid, ListChecks, Search, Share2, Star, Table2, X } from "lucide-react";
import { db } from "@/api/localDb";
import useVault from "@/hooks/useVault";
import VaultHeader from "@/components/vault/VaultHeader";
import NoteCard from "@/components/vault/NoteCard";
import SearchResults from "@/components/vault/SearchResults";
import TagRail from "@/components/vault/TagRail";
import VaultSidebar from "@/components/vault/VaultSidebar";
import Backup from "@/components/vault/Backup";
import { collectTags, escapeRegExp, noteLinks, noteTags, relativeTime } from "@/lib/vault";
import FindTagsPanel from "@/components/tags/FindTagsPanel";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const SURFACES = [
  { to: "/journal", label: "Daily journal", hint: "one page per day", icon: CalendarDays },
  { to: "/calendar", label: "Calendar", hint: "tasks & journal by date", icon: CalendarDays },
  { to: "/tasks", label: "Task inbox", hint: "todo, doing, done", icon: ListChecks },
  { to: "/cards", label: "Flashcards", hint: "spaced repetition", icon: Layers },
  { to: "/graph", label: "Graph view", hint: "the vault as a network", icon: Share2 },
  { to: "/canvas", label: "Infinite canvas", hint: "pan, zoom, wire cards", icon: LayoutGrid },
  { to: "/tables", label: "Relational tables", hint: "typed fields and relations", icon: Table2 },
  { to: "/code", label: "Code workspace", hint: "find & replace, autosave", icon: Code2 },
];

export default function VaultHome() {
  const { t } = useI18n();
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
  const [findTagsOpen, setFindTagsOpen] = useState(false);
  const searchRef = useRef(null);

  // Filter chips state (synced with URL and VaultSidebar)
  const [chipFavourites, setChipFavourites] = useState(showFavourites);
  const [chipTags, setChipTags] = useState([]); // array of tag strings
  const [chipRecentFilter, setChipRecentFilter] = useState(recentFilter);
  const [chipIncludeDeleted, setChipIncludeDeleted] = useState(includeDeleted);
  const [backupPopoverOpen, setBackupPopoverOpen] = useState(false);

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

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      const pattern = escapeRegExp(term);
      const page = await db.entities.Note.filter(
        chipIncludeDeleted
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
            },
        { sort: "-updated_date", limit: 40 }
      );
      setResults(page?.items ?? []);
      setSearching(false);
    }, 220);
    return () => clearTimeout(timer);
  }, [query, chipIncludeDeleted]);

  const tags = useMemo(() => collectTags(notes), [notes]);
  const linkCount = useMemo(() => notes.reduce((total, note) => total + noteLinks(note).length, 0), [notes]);
  const visibleNotes = useMemo(
    () => (activeTag ? filteredNotes.filter((note) => noteTags(note).includes(activeTag)) : filteredNotes),
    [filteredNotes, activeTag]
  );
  const isSearching = query.trim().length >= 2;

  const handleCreateFolder = async (folderPath) => {
    await reload();
  };

  const handleRefresh = async () => {
    await reload();
  };

  return (
    <div className="nb-shell min-h-screen">
      <VaultHeader />
      <main className="mx-auto max-w-[1180px] px-5 pb-24 sm:px-6 lg:px-8">
        <section className="nb-rise pt-8 md:pt-12">
          <p className="nb-label">Vault · plain markdown</p>
          <h1 className="mt-3 font-display text-[34px] leading-[1.06] tracking-tight sm:text-[44px] md:text-[54px]">
            Everything you know,
            <span className="block italic text-primary/90">in plain text.</span>
          </h1>

          <div className="relative mt-8 max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("vault.searchPlaceholder")}
              aria-label={t("header.searchVault")}
              className="h-14 w-full rounded-xl border border-border bg-card/50 pl-12 pr-20 text-[15px] text-foreground outline-none transition focus:border-primary/40 focus:bg-card focus:ring-4 focus:ring-primary/5"
            />
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
              {/* Backup button - opens as popover */}
              <Popover open={backupPopoverOpen} onOpenChange={setBackupPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label={t("vault.backupTooltip")}
                    className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[520px] max-h-[75vh] p-0">
                  <Backup />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <p className="mt-4 font-mono text-[11px] text-muted-foreground">
            {notes.length} notes · {tags.length} tags · {linkCount} links
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

            {/* Tags chip - opens FindTagsPanel */}
            <button
              type="button"
              onClick={() => setFindTagsOpen(true)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-mono transition",
                chipTags.length > 0
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-card border border-border/70 text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              aria-pressed={chipTags.length > 0}
            >
              <span className="h-3.5 w-3.5 flex-shrink-0" />
              {t("vault.tags")}
              {chipTags.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-mono">
                  {chipTags.length}
                </span>
              )}
            </button>

            {/* Selected tags as removable chips */}
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
              const Icon = surface.icon;
              return (
                <Link
                  key={surface.to}
                  to={surface.to}
                  className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/30 px-3.5 py-3 transition hover:border-primary/30 hover:bg-card/60"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border/70 bg-background/60 text-muted-foreground transition group-hover:border-primary/40 group-hover:text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium text-foreground">{surface.label}</span>
                    <span className="block truncate font-mono text-[10px] text-muted-foreground">{surface.hint}</span>
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
                  <h2 className="text-[13px] font-medium tracking-tight">Search results</h2>
                  {results && (
                    <span className="font-mono text-[10px] text-muted-foreground">{results.length} matches</span>
                  )}
                </div>
                <div className="mt-3">
                  <SearchResults query={query.trim()} results={results} loading={searching || loading} onRestore={reload} />
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
                      clear
                    </button>
                  </div>
                )}

                {/* Favourites section */}
                {showFavourites && visibleNotes.length > 0 && (
                  <section className="mb-6">
                    <div className="flex items-baseline justify-between mb-3">
                      <h2 className="text-[13px] font-medium tracking-tight flex items-center gap-2">
                        <span className="text-yellow-400">★</span> Favourites
                      </h2>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {visibleNotes.filter((n) => n.favourite).length} notes
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
                    <h2 className="text-[13px] font-medium tracking-tight">
                      {activeTag
                        ? `Tagged #${activeTag}`
                        : activeFolder !== undefined
                        ? activeFolder
                          ? `Folder: ${activeFolder}`
                          : "Unfiled"
                        : "Recent notes"}
                    </h2>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {visibleNotes.length} notes
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
                      <p className="text-[14px] text-foreground">Nothing here yet.</p>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        Every vault starts with a single note.
                      </p>
                      <Link
                        to="/note/new"
                        className="mt-5 inline-flex items-center rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-[13px] text-primary transition hover:bg-primary/15"
                      >
                        Write the first one
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
                    <h2 className="text-[13px] font-medium tracking-tight">All notes</h2>
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