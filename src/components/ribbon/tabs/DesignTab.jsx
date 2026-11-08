import { Trash2 } from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import { Btn, RibbonSelect, Stepper, useRibbon } from "@/components/ribbon/RibbonKit";
import { FONTS, FONT_GROUPS, LETTER_SPACING } from "@/lib/text-style";

const fontGroups = FONT_GROUPS.map((label) => ({
  label,
  options: FONTS.filter((font) => font.group === label).map((font) => ({ value: font.id, label: font.label })),
}));

export function DesignTab() {
  const { typography: t, setTypography } = useRibbon();
  const patch = (next) => setTypography({ ...t, ...next });
  const drop = (key) => {
    const next = { ...t };
    delete next[key];
    setTypography(next);
  };

  return (
    <>
      <RibbonGroup label="Typography">
        <RibbonSelect
          title="Font of the whole note"
          placeholder="Note font: default"
          groups={fontGroups}
          value={t.font || ""}
          onChange={(value) => (value ? patch({ font: value }) : drop("font"))}
        />
        <Stepper title="Note text size (px)" value={t.size || 16} min={10} max={40} onChange={(size) => patch({ size })} format={(n) => `${n}px`} />
        <RibbonSelect
          title="Letter spacing of the whole note"
          placeholder="Tracking"
          options={LETTER_SPACING.map((item) => ({ value: item.id, label: item.label }))}
          value={t.spacing || ""}
          onChange={(value) => (value ? patch({ spacing: value }) : drop("spacing"))}
        />
        <RibbonSelect
          title="Heading font of the whole note"
          placeholder="Heading font"
          groups={fontGroups}
          value={t.headingFont || ""}
          onChange={(value) => (value ? patch({ headingFont: value }) : drop("headingFont"))}
        />
        <Btn
          id="design.resetTypography"
          icon={Trash2}
          hint="Reset the typography of this note to the app default"
          disabled={false}
          onClick={() => setTypography({})}
        />
      </RibbonGroup>

      <RibbonGroup label="Page">
        <p className="self-center px-3 font-mono text-[10.5px] text-muted-foreground">More coming</p>
      </RibbonGroup>

      <RibbonGroup label="Styles">
        <p className="self-center px-3 font-mono text-[10.5px] text-muted-foreground">More coming</p>
      </RibbonGroup>
    </>
  );
}