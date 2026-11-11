import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import VaultHeader from "@/components/vault/VaultHeader";
import {
  daysRemaining,
  deleteNoteForever,
  listTrashedNotes,
  purgeExpiredNotes,
  restoreNote,
  TRASH_RETENTION_DAYS,
} from "@/lib/notes";
import { relativeTime, snippet } from "@/lib/vault";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/lib/toast";
import { useI18n } from "@/lib/i18n";

export default function TrashPage() {
  const { t, localDigits } = useI18n();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const items = await listTrashedNotes();
    setNotes(items);
    setLoading(false);
  };

  useEffect(() => {
    purgeExpiredNotes()
      .catch(() => {})
      .finally(() => {
        load().catch(() => setLoading(false));
      });
  }, []);

  const restore = async (id, title) => {
    await restoreNote(id);
    setNotes((current) => current.filter((note) => note.id !== id));
    toast.success(t("vault.trash.toastRestored", { title: title || t("common.untitledNote") }));
  };

  const destroy = async (id) => {
    await deleteNoteForever(id);
    setNotes((current) => current.filter((note) => note.id !== id));
  };

  return (
    <div className="nb-shell min-h-screen">
      <VaultHeader />
      <main className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label={t("vault.graph.backToVault")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <p className="nb-label">{t("vault.trash.label")}</p>
            <h1 className="mt-1 font-display text-[26px] leading-tight tracking-tight">{t("vault.trash.heroTitle")}</h1>
          </div>
          <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground" dir="auto">
            {loading ? t("vault.trash.loading") : t("vault.trash.itemCount", { count: localDigits(notes.length) })}
          </span>
        </div>

        <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
          {t("vault.trash.description", { days: TRASH_RETENTION_DAYS })}
        </p>

        <div className="mt-7">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((row) => (
                <div key={row} className="h-16 animate-pulse rounded-xl bg-card/30" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 px-6 py-14 text-center">
              <p className="text-[14px] text-foreground">{t("vault.trash.emptyState")}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">{t("vault.trash.emptyDescription")}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {notes.map((note) => {
                const left = daysRemaining(note.trashed_date);
                const expiringSoon = left <= 7;
                return (
                  <li
                    key={note.id}
                    className="flex flex-wrap items-start gap-3 rounded-xl border border-border/60 bg-card/25 px-3.5 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] text-foreground">{note.title || t("common.untitledNote")}</p>
                      <p className="mt-0.5 line-clamp-1 text-[12px] text-muted-foreground">
                        {snippet(note.body, "", 120) || t("vault.trash.noteSnippet")}
                      </p>
                      <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
                        {t("vault.trash.deletedAgo", { time: relativeTime(note.trashed_date), daysLeft: left === 0 ? t("vault.trash.expiresToday") : t("vault.trash.daysLeft", { count: left }) })}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => restore(note.id, note.title)}
                        className="flex h-8 items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 font-mono text-[10.5px] text-primary transition hover:bg-primary/15"
                      >
                        <RotateCcw className="h-3 w-3" /> {t("vault.trash.restoreButton")}
                      </button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            type="button"
                            aria-label={t("vault.trash.ariaDeleteForever", { title: note.title || t("common.untitledNote") })}
                            className="grid h-8 w-8 place-items-center rounded-md border border-border/70 text-muted-foreground transition hover:border-destructive/50 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("vault.trash.deleteForeverDialog.title")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("vault.trash.deleteForeverDialog.description", { title: note.title || t("common.untitledNote") })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("vault.trash.deleteForeverDialog.keepButton")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => destroy(note.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {t("vault.trash.deleteForeverDialog.deleteButton")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}