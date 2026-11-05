import { useState } from "react";
import { ArrowRightLeft, Search } from "lucide-react";
import { db } from "@/api/localDb";
import PanelShell from "@/components/extensions/PanelShell";
import { escapeRegExp } from "@/lib/vault";

const flatten = (value = "") => String(value).replace(/\s+/g, " ").trim();

function hitIn(text, term) {
  const source = flatten(text);
  const index = source.toLowerCase().indexOf(term.toLowerCase());
  if (index < 0) return null;
  const start = Math.max(0, index - 34);
  const end = Math.min(source.length, index + term.length + 44);
  return {
    before: `${start > 0 ? "…" : ""}${source.slice(start, index)}`,
    hit: source.slice(index, index + term.length),
    after: `${source.slice(index + term.length, end)}${end < source.length ? "…" : ""}`,
  };
}

const countIn = (text, term) => {
  if (!term) return 0;
  const matches = String(text || "").match(new RegExp(escapeRegExp(term), "gi"));
  return matches ? matches.length : 0;
};

/** Extension panel: search every note, preview the hits, then replace across the vault. */
export default function VaultReplacePanel({ note, onEditBody, onVaultChange }) {
  const [find, setFind] = useState("");
  const [replacement, setReplacement] = useState("");
  const [matches, setMatches] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const term = find.trim();
  const hits = (matches || []).reduce(
    (total, item) => total + countIn(item.title, term) + countIn(item.body, term),
    0
  );

  const search = async (event) => {
    event?.preventDefault();
    if (!term) return;
    setBusy(true);
    setStatus("");
    const pattern = escapeRegExp(term);
    const page = await db.entities.Note.filter(
      {
        trashed: { $ne: true },
        $or: [
          { title: { $regex: pattern, $options: "i" } },
          { body: { $regex: pattern, $options: "i" } },
        ],
      },
      { sort: "-updated_date", limit: 40 }
    );
    const items = page?.items ?? [];
    setMatches(items);
    setStatus(items.length ? "" : "no notes contain that text");
    setBusy(false);
  };

  const replaceAll = async () => {
    if (!term || !matches?.length) return;
    setBusy(true);
    const pattern = new RegExp(escapeRegExp(term), "gi");
    let changed = 0;
    let replaced = 0;
    for (const item of matches) {
      const title = (item.title || "").replace(pattern, replacement);
      const body = (item.body || "").replace(pattern, replacement);
      if (title === (item.title || "") && body === (item.body || "")) continue;
      replaced += countIn(item.title, term) + countIn(item.body, term);
      changed += 1;
      if (item.id === note?.id) onEditBody?.(body);
      else await db.entities.Note.update(item.id, { title, body });
    }
    setMatches(
      matches.map((item) => ({
        ...item,
        title: (item.title || "").replace(pattern, replacement),
        body: (item.body || "").replace(pattern, replacement),
      }))
    );
    setStatus(`${replaced} replaced in ${changed} notes`);
    onVaultChange?.();
    setBusy(false);
  };

  return (
    <PanelShell label="vault find & replace">
      <form onSubmit={search} className="mt-2 space-y-1.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <input
            value={find}
            onChange={(event) => setFind(event.target.value)}
            placeholder="find in all notes"
            aria-label="Find text across the vault"
            className="h-8 w-full rounded-md border border-border/70 bg-background/60 pl-7 pr-2 text-[12px] text-foreground outline-none focus:border-primary/40"
          />
        </div>
        <input
          value={replacement}
          onChange={(event) => setReplacement(event.target.value)}
          placeholder="replace with"
          aria-label="Replacement text"
          className="h-8 w-full rounded-md border border-border/70 bg-background/60 px-2 text-[12px] text-foreground outline-none focus:border-primary/40"
        />
        <button
          type="submit"
          disabled={busy || !term}
          className="h-7 w-full rounded-md border border-border/70 text-[11.5px] text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-50"
        >
          {busy ? "searching…" : "Search vault"}
        </button>
      </form>

      {matches && matches.length > 0 && (
        <>
          <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
            {hits} hits in {matches.length} notes
          </p>
          <ul className="mt-1.5 max-h-40 space-y-1 overflow-y-auto pr-0.5">
            {matches.map((item) => {
              const hit = hitIn(item.body, term) || hitIn(item.title, term);
              return (
                <li key={item.id} className="rounded-md border border-border/50 px-1.5 py-1">
                  <p className="truncate font-mono text-[10.5px] text-foreground/85">{item.title || "Untitled"}</p>
                  {hit && (
                    <p className="truncate font-mono text-[9.5px] text-muted-foreground">
                      {hit.before}
                      <span className="rounded bg-primary/20 px-0.5 text-primary">{hit.hit}</span>
                      {hit.after}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={replaceAll}
            disabled={busy}
            className="mt-2 flex h-7 w-full items-center justify-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 text-[11.5px] text-primary transition hover:bg-primary/15 disabled:opacity-50"
          >
            <ArrowRightLeft className="h-3 w-3" />
            {busy ? "replacing…" : "Replace all"}
          </button>
        </>
      )}

      {status && (
        <p className="mt-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground/80">{status}</p>
      )}
    </PanelShell>
  );
}