import { useEffect, useState } from "react";
import { SquareCode } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import RibbonButton from "@/components/ribbon/RibbonButton";
import { LANGUAGES } from "@/lib/code-languages";
import { readPref, writePref } from "@/lib/preferences";
import { cn } from "@/lib/utils";

const PREF_KEY = "codeBlockLanguage";

/** Picks the language of the fenced block and remembers it for next time. */
export default function CodeBlockPicker({ onInsert, disabled, disabledReason, shortcut, openSignal }) {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState(() => readPref(PREF_KEY, "plain"));

  useEffect(() => {
    if (openSignal) setOpen(true);
  }, [openSignal]);

  if (disabled) {
    return (
      <RibbonButton
        icon={SquareCode}
        label="Code block"
        hint="Insert a fenced code block"
        shortcut={shortcut}
        disabled
        disabledReason={disabledReason}
      />
    );
  }

  const choose = (id) => {
    setLanguage(id);
    writePref(PREF_KEY, id);
    onInsert(id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <RibbonButton
          icon={SquareCode}
          label="Code block"
          hint="Insert a fenced code block — it remembers the language you pick"
          shortcut={shortcut}
          keepFocus={false}
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[232px] p-3">
        <p className="nb-label">code language</p>
        <div className="mt-2 grid grid-cols-2 gap-1">
          {LANGUAGES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => choose(item.id)}
              className={cn(
                "h-7 truncate rounded-md border px-2 text-left text-[11.5px] transition",
                language === item.id
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border/70 text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-2 font-mono text-[10px] text-muted-foreground">picking one inserts it and is remembered</p>
      </PopoverContent>
    </Popover>
  );
}