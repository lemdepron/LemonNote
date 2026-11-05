import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookmarkPlus, Trash2, Wand2 } from "lucide-react";
import VaultHeader from "@/components/vault/VaultHeader";
import QueryResults from "@/components/query/QueryResults";
import useVault from "@/hooks/useVault";
import { QUERY_EXAMPLES, parseQuery, runQuery } from "@/lib/query";
import { readPref, writePref } from "@/lib/preferences";
import { cn } from "@/lib/utils";

const SAVED_KEY = "queries";
const DEFAULT_QUERY = "tag:basics -tag:roadmap sort:-updated limit:40";

export default function QueriesPage() {
  const { notes, loading } = useVault();
  const [saved, setSaved] = useState(() => readPref(SAVED_KEY, []));
  const [draft, setDraft] = useState(DEFAULT_QUERY);

  const parsed = useMemo(() => parseQuery(draft), [draft]);
  const result = useMemo(() => runQuery(notes, parsed), [notes, parsed]);

  const persist = (next) => {
    setSaved(next);
    writePref(SAVED_KEY, next);
  };

  const saveQuery = () => {
    const query = draft.trim();
    if (!query) return;
    persist([
      { id: `q_${Date.now().toString(36)}`, query, saved_date: new Date().toISOString() },
      ...saved.filter((entry) => entry.query !== query),
    ].slice(0, 24));
  };

  return (
    <div className="nb-shell min-h-screen">
      <VaultHeader />
      <main className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Back to vault"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <p className="nb-label">dynamic queries</p>
            <h1 className="mt-1 font-display text-[26px] leading-tight tracking-tight">Ask the vault a question.</h1>
          </div>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0">
            <div className="rounded-xl border border-border/70 bg-card/40 p-3">
              <div className="flex items-center gap-2">
                <Wand2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder='tag:basics words>80 sort:-created limit:40'
                  aria-label="Query"
                  spellCheck={false}
                  className="h-8 min-w-0 flex-1 bg-transparent font-mono text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground/50"
                />
                <button
                  type="button"
                  onClick={saveQuery}
                  className="flex h-7 shrink-0 items-center gap-1 rounded-md border border-border/70 px-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                >
                  <BookmarkPlus className="h-3 w-3" /> save
                </button>
              </div>

              {parsed.errors.length > 0 && (
                <p className="mt-2 border-t border-border/50 pt-2 font-mono text-[10.5px] text-destructive">
                  {parsed.errors.join(" · ")}
                </p>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {QUERY_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setDraft(example)}
                  className="rounded-md border border-border/60 bg-card/30 px-2 py-1 font-mono text-[10px] text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                >
                  {example}
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-baseline justify-between">
              <h2 className="text-[13px] font-medium tracking-tight">Results</h2>
              <span className="font-mono text-[10px] text-muted-foreground">
                {loading ? "indexing…" : `${result.total} of ${notes.length} notes`}
              </span>
            </div>

            <div className="mt-3">
              <QueryResults result={result} loading={loading} query={draft} />
            </div>
          </div>

          <aside className="order-first lg:order-none">
            <div className="rounded-xl border border-border/60 bg-card/25 p-3">
              <p className="nb-label">saved queries</p>
              {saved.length === 0 ? (
                <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                  Save a query to pin it here — it re-runs live every time you open it.
                </p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {saved.map((entry) => (
                    <li key={entry.id} className={cn("group flex items-start gap-1 rounded-md px-1 py-1 transition", entry.query === draft ? "bg-primary/10" : "hover:bg-accent/50")}>
                      <button
                        type="button"
                        onClick={() => setDraft(entry.query)}
                        className={cn(
                          "min-w-0 flex-1 truncate text-left font-mono text-[11px] transition",
                          entry.query === draft ? "text-primary" : "text-foreground/80"
                        )}
                        title={entry.query}
                      >
                        {entry.query}
                      </button>
                      <button
                        type="button"
                        onClick={() => persist(saved.filter((item) => item.id !== entry.id))}
                        aria-label="Delete saved query"
                        className="shrink-0 text-muted-foreground/50 opacity-0 transition hover:text-destructive group-hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-3 rounded-xl border border-border/60 bg-card/25 p-3">
              <p className="nb-label">syntax</p>
              <ul className="mt-2 space-y-1 font-mono text-[10.5px] leading-relaxed text-muted-foreground">
                <li>tag:name · -tag:name</li>
                <li>title:rust · body~/regex/i</li>
                <li>words&gt;200 · links&gt;1</li>
                <li>updated&lt;7d · created&gt;30d</li>
                <li>sort:-updated · group:tag</li>
                <li>a OR b · limit:40</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}