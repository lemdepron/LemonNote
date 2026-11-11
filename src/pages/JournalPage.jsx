import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays, Plus } from "lucide-react";
import { db } from "@/api/localDb";
import VaultHeader from "@/components/vault/VaultHeader";
import { Button } from "@/components/ui/button";
import { JOURNAL_TEMPLATE, dateKey, formatDay, isJournalTitle, shiftDay } from "@/lib/journal";
import { relativeTime, snippet } from "@/lib/vault";
import { listActiveNotes } from "@/lib/notes";
import { useI18n } from "@/lib/i18n";

export default function JournalPage() {
  const { t } = useI18n();
  const [day, setDay] = useState(dateKey());
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    listActiveNotes({ sort: "-created_date", limit: 300 })
      .then(setNotes)
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, []);

  const entries = useMemo(
    () =>
      notes
        .filter((note) => isJournalTitle(note.title))
        .sort((a, b) => String(b.title).localeCompare(String(a.title))),
    [notes]
  );

  const entry = notes.find((note) => String(note.title || "").trim() === day);

  const openEntry = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const created = await db.entities.Note.create({
        title: day,
        body: JOURNAL_TEMPLATE,
        tags: ["journal"],
      });
      navigate(`/note/${created.id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="nb-shell min-h-screen">
      <VaultHeader />
      <main className="mx-auto max-w-[1180px] px-4 pb-16 pt-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="nb-label">{t("vault.journal.label")}</p>
            <h1 className="mt-1 font-display text-[26px] leading-tight tracking-tight">{t("vault.journal.heroTitle")}</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDay((value) => shiftDay(value, -1))}
              aria-label={t("vault.journal.prevDay")}
              className="grid h-8 w-8 place-items-center rounded-md border border-border/70 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDay(dateKey())}
              className="h-8 rounded-md border border-border/70 px-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              {t("vault.journal.today")}
            </button>
            <button
              type="button"
              onClick={() => setDay((value) => shiftDay(value, 1))}
              aria-label={t("vault.journal.nextDay")}
              className="grid h-8 w-8 place-items-center rounded-md border border-border/70 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <section className="mt-5 rounded-2xl border border-border/70 bg-card/30 p-5">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{formatDay(day)}</p>
          </div>

          {loading ? (
            <div className="mt-3 h-20 animate-pulse rounded-lg bg-card/40" />
          ) : entry ? (
            <>
              <p className="mt-3 line-clamp-3 text-[13.5px] leading-relaxed text-muted-foreground">
                {snippet(entry.body, "", 220) || t("vault.journal.emptyEntry")}
              </p>
              <Button asChild size="sm" className="mt-4 h-8 rounded-lg px-3 text-[12.5px]">
                <Link to={`/note/${entry.id}`}>{t("vault.journal.openEntry")}</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
                {t("vault.journal.noEntry")}
              </p>
              <Button
                size="sm"
                onClick={openEntry}
                disabled={creating}
                className="mt-4 h-8 gap-1.5 rounded-lg px-3 text-[12.5px]"
              >
                <Plus className="h-3.5 w-3.5" />
                {creating ? t("vault.journal.creating") : t("vault.journal.startEntry")}
              </Button>
            </>
          )}
        </section>

        <section className="mt-7">
          <p className="nb-label">{t("vault.journal.recentEntries")}</p>
          {entries.length === 0 ? (
            <p className="mt-2 text-[13px] text-muted-foreground">{t("vault.journal.nothingJournaled")}</p>
          ) : (
            <ul className="mt-2 divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60">
              {entries.slice(0, 12).map((note) => (
                <li key={note.id}>
                  <Link to={`/note/${note.id}`} className="flex items-baseline gap-3 px-3.5 py-2.5 transition hover:bg-accent/50">
                    <span className="shrink-0 font-mono text-[11px] text-foreground">{note.title}</span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted-foreground">
                      {snippet(note.body, "", 90) || t("vault.journal.emptyEntrySnippet")}
                    </span>
                    <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/60">
                      {relativeTime(note.updated_date)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}