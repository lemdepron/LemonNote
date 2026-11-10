import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { isAIEnabled, callAI, buildPrompt, getAIErrorMessage, AI_LANGUAGES } from "@/lib/ai";
import { toast } from "@/lib/toast";

const ACTIONS = [
  { id: "summarize", label: "ai.summarize" },
  { id: "fixGrammar", label: "ai.fixGrammar" },
  { id: "continue", label: "ai.continue" },
  { id: "translate", label: "ai.translate" },
];

export default function AiAssist({ title, body, onAppend, onReplace, onClose }) {
  const { t: tr, localDigits } = useI18n();
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("en");

  // Get note language from HTML lang attribute or default to English
  const noteLanguage = document.documentElement.lang || "en";

  const run = async (action) => {
    if (!isAIEnabled()) {
      setError(tr("ai.error.notEnabled"));
      toast.error(tr("ai.error.notEnabled"));
      return;
    }

    setBusy(action);
    setError("");
    setResult("");

    try {
      const prompt = buildPrompt(action, body, targetLanguage, noteLanguage);
      const text = await callAI(prompt);
      if (text) setResult(text);
      else setError(tr("ai.error.emptyResponse"));
    } catch (err) {
      const message = getAIErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy("");
    }
  };

  const handleApply = (mode) => {
    if (!result) return;
    if (mode === "replace") {
      onReplace(result);
    } else {
      onAppend(result);
    }
    setResult("");
  };

  const showTranslateOptions = ACTIONS.some((a) => a.id === "translate") && busy === "translate";

  return (
    <div className="mb-4 rounded-xl border border-border/70 bg-card/40 p-3.5">
      <div className="flex items-center justify-between">
        <span className="nb-label">{tr("ai.panel.title")}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label={tr("ai.panel.close")}
          className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => run(action.id)}
            disabled={Boolean(busy) || (action.id === "translate" && !isAIEnabled())}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition disabled:opacity-50",
              busy === action.id
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/70 text-muted-foreground hover:text-foreground"
            )}
          >
            {busy === action.id && <Loader2 className="h-3 w-3 animate-spin" />}
            {tr(action.label)}
          </button>
        ))}
      </div>

      {busy === "translate" && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">{tr("ai.translate.targetLanguage")}</span>
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="h-7 rounded border border-border/70 bg-card/60 px-2 font-mono text-[11px] outline-none focus:border-primary/40"
          >
            {AI_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.native} ({lang.label})
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="mt-3 text-[12.5px] text-destructive">{error}</p>}

      {result && (
        <>
          <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 font-mono text-[11.5px] leading-relaxed text-foreground/85">
            {result}
          </pre>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleApply("append")}
              className="h-8 rounded-md border border-primary/40 bg-primary/10 px-2.5 text-[12px] text-primary transition hover:bg-primary/15"
            >
              {tr("ai.panel.append")}
            </button>
            <button
              type="button"
              onClick={() => handleApply("replace")}
              className="h-8 rounded-md border border-border/80 px-2.5 text-[12px] text-muted-foreground transition hover:text-foreground"
            >
              {tr("ai.panel.replace")}
            </button>
            <button
              type="button"
              onClick={() => setResult("")}
              className="h-8 rounded-md px-2.5 text-[12px] text-muted-foreground transition hover:text-foreground"
            >
              {tr("ai.panel.discard")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}