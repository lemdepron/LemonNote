import { useEffect, useMemo, useState } from "react";
import { Layers, Plus, Trash2 } from "lucide-react";
import { db } from "@/api/localDb";
import useVault from "@/hooks/useVault";
import VaultHeader from "@/components/vault/VaultHeader";
import CardReview from "@/components/cards/CardReview";
import CardForm from "@/components/cards/CardForm";
import { dueLabel, isDue, newCard, schedule, STARTER_CARDS } from "@/lib/cards";
import { useI18n } from "@/lib/i18n";

export default function CardsPage() {
  const { t, localDigits } = useI18n();
  const { notes } = useVault();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;
    db.entities.Flashcard.list({ sort: "due_date", limit: 300 })
      .then(async (page) => {
        let items = page?.items ?? [];
        if (!items.length) {
          const me = await db.auth.me().catch(() => null);
          if (!me?.nc_cards_seeded) {
            const created = await db.entities.Flashcard.bulkCreate(STARTER_CARDS);
            await db.auth.updateMe({ nc_cards_seeded: true }).catch(() => null);
            items = Array.isArray(created) ? created : [];
          }
        }
        if (!active) return;
        setCards(items);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const due = useMemo(
    () => cards.filter(isDue).sort((a, b) => String(a.due_date).localeCompare(String(b.due_date))),
    [cards]
  );
  const current = due[0] ?? null;

  useEffect(() => {
    setRevealed(false);
  }, [current?.id]);

  const grade = async (rating) => {
    if (!current || busy) return;
    setBusy(true);
    const patch = schedule(current, rating);
    await db.entities.Flashcard.update(current.id, patch);
    setCards((prev) => prev.map((card) => (card.id === current.id ? { ...card, ...patch } : card)));
    setRevealed(false);
    setBusy(false);
  };

  const create = async (values) => {
    const created = await db.entities.Flashcard.create(newCard(values));
    setCards((prev) => [created, ...prev]);
    setAdding(false);
  };

  const remove = async (id) => {
    await db.entities.Flashcard.delete(id);
    setCards((prev) => prev.filter((card) => card.id !== id));
  };

  const upcoming = cards
    .filter((card) => !isDue(card))
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))[0];

  return (
    <div className="nb-shell min-h-screen">
      <VaultHeader />
      <main className="mx-auto max-w-[880px] px-5 pb-24 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="nb-label">{t("vault.cards.label")}</p>
            <h1 className="mt-3 font-display text-[32px] leading-tight tracking-tight sm:text-[40px]">
              {t("vault.cards.heroTitle")}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setAdding((open) => !open)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> {t("vault.cards.newCard")}
          </button>
        </div>

        <p className="mt-3 font-mono text-[11px] text-muted-foreground" dir="auto">
          {t("vault.cards.stats", { due: localDigits(due.length), total: localDigits(cards.length) })}
        </p>

        {adding && <CardForm notes={notes} onCreate={create} onCancel={() => setAdding(false)} />}

        <div className="mt-6">
          {loading ? (
            <div className="h-56 animate-pulse rounded-2xl border border-border/60 bg-card/30" />
          ) : current ? (
            <CardReview
              card={current}
              revealed={revealed}
              busy={busy}
              onReveal={() => setRevealed(true)}
              onGrade={grade}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-border/80 bg-card/20 px-6 py-14 text-center">
              <Layers className="mx-auto h-5 w-5 text-primary/70" />
              <p className="mt-3 text-[14px]">
                {cards.length ? t("vault.cards.nothingDue") : t("vault.cards.noCards")}
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {upcoming
                  ? t("vault.cards.nextCard", { date: upcoming.due_date })
                  : t("vault.cards.emptyHint")}
              </p>
            </div>
          )}
        </div>

        {cards.length > 0 && (
          <section className="mt-10">
            <h2 className="nb-label">{t("vault.cards.allCards")}</h2>
            <ul className="mt-2 divide-y divide-border/50 rounded-xl border border-border/60 bg-card/25">
              {cards.map((card) => (
                <li key={card.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/90">{card.front}</span>
                  <span className="hidden shrink-0 font-mono text-[10px] text-muted-foreground sm:block">
                    {card.reps ? t("vault.cards.reps", { count: card.reps }) : t("vault.cards.newCard")}
                  </span>
                  <span className="w-[68px] shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                    {dueLabel(card)}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(card.id)}
                    aria-label={t("vault.cards.deleteCard")}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}