import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { db } from "@/api/localDb";
import VaultHeader from "@/components/vault/VaultHeader";
import CodeEditor from "@/components/code/CodeEditor";
import FindReplace from "@/components/code/FindReplace";
import FocusToggle from "@/components/shell/FocusToggle";
import { LANGUAGES } from "@/lib/code-languages";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select-compact";
import { useI18n } from "@/lib/i18n";

export default function CodePage() {
  const { t, localDigits } = useI18n();
  const { id } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("idle");
  const [findOpen, setFindOpen] = useState(false);
  const dirty = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    db.entities.CodeFile.get(id)
      .then((record) => {
        if (!active) return;
        setFile({ ...record, language: record.language || "rust", body: record.body ?? "" });
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setFile(null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const patch = (changes) => {
    dirty.current = true;
    setStatus("saving");
    setFile((current) => ({ ...current, ...changes }));
  };

  useEffect(() => {
    if (!file || !dirty.current) return;
    const timer = setTimeout(async () => {
      await db.entities.CodeFile.update(file.id, {
        name: file.name,
        language: file.language,
        body: file.body,
      });
      dirty.current = false;
      setStatus("saved");
    }, 650);
    return () => clearTimeout(timer);
  }, [file]);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setFindOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (loading) {
    return (
      <div className="nb-shell min-h-screen">
        <VaultHeader />
        <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6">
          <div className="h-[58vh] animate-pulse rounded-xl border border-border/60 bg-card/30" />
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="nb-shell min-h-screen">
        <VaultHeader />
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <p className="font-display text-[26px]">{t("vault.code.emptyState")}</p>
          <Link to="/code" className="mt-4 inline-block font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
            {t("vault.code.backToCode")}
          </Link>
        </div>
      </div>
    );
  }

  const lineCount = file.body.split("\n").length;

  return (
    <div className="nb-shell min-h-screen">
      <VaultHeader />
      <main className="mx-auto max-w-[1180px] px-4 pb-16 pt-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/code"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label={t("vault.code.backToCode")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <input
            value={file.name}
            onChange={(event) => patch({ name: event.target.value })}
            aria-label={t("vault.code.fileName")}
            className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-1 font-mono text-[16px] tracking-tight text-foreground outline-none transition hover:border-border/60 focus:border-primary/40"
          />
          <Select value={file.language} onValueChange={(lang) => patch({ language: lang })}>
            <SelectTrigger aria-label={t("vault.code.languagePlaceholder")} className="shrink-0">
              <SelectValue placeholder={t("vault.code.languagePlaceholder")} />
            </SelectTrigger>
            <SelectContent position="popper">
              {LANGUAGES.map((language) => (
                <SelectItem key={language.id} value={language.id}>
                  {language.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={() => setFindOpen((open) => !open)}
            aria-pressed={findOpen}
            className="h-8 shrink-0 rounded-lg border border-border/80 bg-card/50 px-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:text-foreground"
          >
            {t("vault.code.findButton")}
          </button>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground" dir="auto">
            {t("vault.code.subtitle", { lines: localDigits(lineCount) })} · {t(`vault.code.status.${status}`)}
          </span>
          <FocusToggle />
        </div>

        <div className="mt-4 space-y-2">
          {findOpen ? (
            <FindReplace body={file.body} onChange={(body) => patch({ body })} onClose={() => setFindOpen(false)} />
          ) : null}
          <CodeEditor value={file.body} onChange={(body) => patch({ body })} language={file.language} />
        </div>
      </main>
    </div>
  );
}