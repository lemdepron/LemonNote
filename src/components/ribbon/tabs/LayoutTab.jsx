import { ArrowLeftRight, Space } from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import { RibbonSelect, Stepper, Btn, useRibbon } from "@/components/ribbon/RibbonKit";
import { LINE_HEIGHTS, PARAGRAPH_GAPS, EDITOR_FONTS } from "@/lib/text-style";

export function LayoutTab() {
  const { typography: t, setTypography } = useRibbon();
  const patch = (next) => setTypography({ ...t, ...next });
  const drop = (key) => {
    const next = { ...t };
    delete next[key];
    setTypography(next);
  };

  return (
    <>
      <RibbonGroup label="Paragraph">
        <RibbonSelect
          title="Line spacing of the whole note"
          placeholder="Line spacing"
          options={LINE_HEIGHTS.map((n) => ({ value: String(n), label: `Lines ${n}` }))}
          value={t.lineHeight ? String(t.lineHeight) : ""}
          onChange={(value) => (value ? patch({ lineHeight: Number(value) }) : drop("lineHeight"))}
        />
        <RibbonSelect
          title="Space between paragraphs"
          placeholder="Para. gap"
          options={PARAGRAPH_GAPS.map((n) => ({ value: String(n), label: `Gap ${n}em` }))}
          value={t.gap !== undefined ? String(t.gap) : ""}
          onChange={(value) => (value ? patch({ gap: Number(value) }) : drop("gap"))}
        />
        <RibbonSelect
          title="Text alignment of the whole note"
          placeholder="Align"
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Centre" },
            { value: "right", label: "Right" },
            { value: "justify", label: "Justify" },
          ]}
          value={t.align || ""}
          onChange={(value) => (value ? patch({ align: value }) : drop("align"))}
        />
        <RibbonSelect
          title="Direction of the whole note"
          placeholder="Direction"
          options={[
            { value: "ltr", label: "LTR" },
            { value: "rtl", label: "RTL (Arabic)" },
          ]}
          value={t.dir || ""}
          onChange={(value) => (value ? patch({ dir: value }) : drop("dir"))}
        />
        <Btn
          id="layout.firstLineIndent"
          icon={ArrowLeftRight}
          label="First-line indent"
          hint="Indent the first line of every paragraph in the reader"
          active={Boolean(t.indent)}
          disabled={false}
          onClick={() => (t.indent ? drop("indent") : patch({ indent: true }))}
        />
        <Btn
          id="layout.dropCap"
          icon={Space}
          label="Drop cap"
          hint="Large first letter on the first paragraph in the reader"
          active={Boolean(t.dropCap)}
          disabled={false}
          onClick={() => (t.dropCap ? drop("dropCap") : patch({ dropCap: true }))}
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
      </RibbonGroup>

      <RibbonGroup label="Page layout">
        <p className="self-center px-3 font-mono text-[10.5px] text-muted-foreground">More coming</p>
      </RibbonGroup>

      <RibbonGroup label="Columns">
        <p className="self-center px-3 font-mono text-[10.5px] text-muted-foreground">More coming</p>
      </RibbonGroup>
    </>
  );
}