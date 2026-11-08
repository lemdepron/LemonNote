import { SpellCheck } from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import { RibbonSelect, Stepper, Btn, useRibbon } from "@/components/ribbon/RibbonKit";
import { countWords } from "@/lib/note-stats";
import { EDITOR_FONTS, WIDTHS } from "@/lib/text-style";

export function ViewTab() {
  const { value, selection, typography: t, setTypography, body } = useRibbon();
  const patch = (next) => setTypography({ ...t, ...next });
  const drop = (key) => {
    const next = { ...t };
    delete next[key];
    setTypography(next);
  };
  const selected = value.slice(selection.start, selection.end);
  const words = countWords(body);
  const lines = body ? body.split("\n").length : 0;
  const readMinutes = Math.max(1, Math.round(words / 220));
  const stat = (label, text) => (
    <div className="flex min-w-[3.6rem] flex-col items-center px-1.5 font-mono">
      <span className="text-[12px] text-foreground">{text}</span>
      <span className="text-[8.5px] uppercase tracking-[0.12em] text-muted-foreground/70">{label}</span>
    </div>
  );

  return (
    <>
      <RibbonGroup label="Reading page">
        <RibbonSelect
          title="Width of the reading column"
          placeholder="Width"
          options={WIDTHS.map((item) => ({ value: item.id, label: item.label }))}
          value={t.width || ""}
          onChange={(value) => (value ? patch({ width: value }) : drop("width"))}
        />
      </RibbonGroup>

      <RibbonGroup label="Editor">
        <RibbonSelect
          title="Font of the writing box"
          placeholder="Editor font"
          options={EDITOR_FONTS.map((item) => ({ value: item.id, label: item.label }))}
          value={t.editorFont || ""}
          onChange={(value) => (value ? patch({ editorFont: value }) : drop("editorFont"))}
        />
        <Stepper title="Editor text size (px)" value={t.editorSize || 14} min={10} max={32} onChange={(editorSize) => patch({ editorSize })} format={(n) => `${n}px`} />
        <Btn
          id="view.spellCheck"
          icon={SpellCheck}
          label="Spell check"
          hint="Underline misspelled words in the writing box"
          active={t.spell !== false}
          disabled={false}
          onClick={() => (t.spell === false ? drop("spell") : patch({ spell: false }))}
        />
      </RibbonGroup>

      <RibbonGroup label="Statistics">
        <div className="flex items-center divide-x divide-border/50" style={{ minWidth: 'max-content' }}>
          {stat("words", words)}
          {stat("chars", body.length)}
          {stat("lines", lines)}
          {stat("read", `${readMinutes} min`)}
          {stat("selected", selected ? countWords(selected) : 0)}
        </div>
      </RibbonGroup>
    </>
  );
}