import {
  Grid,
  Type,
  Heading,
  Palette,
  LayoutTemplate,
  Square,
  Droplet,
  Hash,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Trash2,
  Globe,
  PaintBucket,
  Stamp,
} from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import { RibbonSelect, Stepper, Btn, RibbonMenu, MenuItem, MenuLabel, Swatches, TextGrid, useRibbon } from "@/components/ribbon/RibbonKit";
import { useI18n } from "@/lib/i18n";
import {
  PAGE_STYLES,
  DEFAULT_GRID_SIZE,
  DEFAULT_LINE_HEIGHT,
  STYLE_SETS,
  PARAGRAPH_PRESETS,
  PAGE_BORDERS,
  WATERMARK_ANGLES,
  DEFAULT_WATERMARK_OPACITY,
  FONTS,
  FONT_GROUPS,
  COLORS,
} from "@/lib/text-style";

import { AI_LANGUAGES } from "@/lib/ai";

import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const fontGroups = FONT_GROUPS.map((label) => ({
  label,
  options: FONTS.filter((font) => font.group === label).map((font) => ({ value: font.id, label: font.label })),
}));

const colorSwatches = COLORS.map((c) => ({ id: c.id, label: c.label, value: c.value }));

const pageColorPresets = [
  { id: "white", label: "White", value: "#ffffff" },
  { id: "cream", label: "Cream", value: "#fdf8f0" },
  { id: "light-gray", label: "Light Gray", value: "#f3f4f6" },
  { id: "sepia", label: "Sepia", value: "#f4ecd8" },
  { id: "dark", label: "Dark", value: "#1e1e1e" },
  { id: "midnight", label: "Midnight", value: "#0f172a" },
];

const watermarkPresets = ["DRAFT", "CONFIDENTIAL", "INTERNAL", "PRIVATE", "COPY", "SAMPLE", "VOID", "PREVIEW"];

const DEFAULT_STYLE_KEY = "notecraft:defaultNoteStyle";

function getDefaultStyle() {
  try {
    const raw = window.localStorage.getItem(DEFAULT_STYLE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setDefaultStyle(style) {
  try {
    window.localStorage.setItem(DEFAULT_STYLE_KEY, JSON.stringify(style));
    return true;
  } catch {
    return false;
  }
}

export function DesignTab() {
  const { t } = useI18n();
  const { typography: typo, setTypography } = useRibbon();
  const patch = (next) => setTypography({ ...typo, ...next });
  const drop = (key) => {
    const next = { ...typo };
    delete next[key];
    setTypography(next);
  };

  // Apply a style set
  const applyStyleSet = (setId) => {
    const set = STYLE_SETS.find((s) => s.id === setId);
    if (!set) return;
    const next = { ...t };
    Object.keys(set).forEach((key) => {
      if (key !== "id" && key !== "label" && key !== "description") {
        next[key] = set[key];
      }
    });
    setTypography(next);
  };

  // Apply paragraph preset
  const applyParagraphPreset = (presetId) => {
    const preset = PARAGRAPH_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    patch({ gap: preset.gap, lineHeight: preset.lineHeight, paragraphPreset: presetId });
  };

  // Save current note's style as default for new notes
  const saveAsDefault = () => {
    const normalized = {
      font: typo.font,
      headingFont: typo.headingFont,
      size: typo.size,
      lineHeight: typo.lineHeight,
      gap: typo.gap,
      spacing: typo.spacing,
      width: typo.width,
      align: typo.align,
      dir: typo.dir,
      indent: typo.indent,
      dropCap: typo.dropCap,
      editorFont: typo.editorFont,
      editorSize: typo.editorSize,
      pageStyle: typo.pageStyle,
      pageGridSize: typo.pageGridSize,
      pageLineHeight: typo.pageLineHeight,
      styleSet: typo.styleSet,
      themePreset: typo.themePreset,
      themeAccent: typo.themeAccent,
      themeHeadingFont: typo.themeHeadingFont,
      themeBodyFont: typo.themeBodyFont,
      paragraphPreset: typo.paragraphPreset,
      pageColor: typo.pageColor,
      pageBorder: typo.pageBorder,
      pageBorderColor: typo.pageBorderColor,
      watermarkText: typo.watermarkText,
      watermarkColor: typo.watermarkColor,
      watermarkOpacity: typo.watermarkOpacity,
      watermarkAngle: typo.watermarkAngle,
    };
    if (setDefaultStyle(normalized)) {
      toast.success("Saved as default for new notes");
    } else {
      toast.error("Failed to save default");
    }
  };

  // Load default style into current note
  const loadDefaultStyle = () => {
    const def = getDefaultStyle();
    if (def) {
      setTypography(def);
      toast.success("Applied default style");
    } else {
      toast.info("No default style saved");
    }
  };

  // Reset current note's design to app defaults
  const resetDesign = () => {
    setTypography({});
    toast.success("Reset to app defaults");
  };

  return (
    <>
      {/* 1. Page Style */}
      <RibbonGroup label={t("ribbon.design.pageStyle")} icon={Grid} priority={70}>
        <RibbonSelect
          title={t("ribbon.design.pageStyleTitle")}
          placeholder={t("ribbon.design.pageStylePlaceholder")}
          options={PAGE_STYLES.map((item) => ({ value: item.id, label: item.label }))}
          value={t.pageStyle || "default"}
          onChange={(value) => (value && value !== "default" ? patch({ pageStyle: value }) : drop("pageStyle"))}
        />
        {(t.pageStyle === "grid" || t.pageStyle === "lines") && (
          <>
            {t.pageStyle === "grid" && (
              <Stepper
                title={t("ribbon.design.gridSpacing")}
                value={t.pageGridSize || DEFAULT_GRID_SIZE}
                min={8}
                max={100}
                step={2}
                onChange={(pageGridSize) => patch({ pageGridSize })}
                format={(n) => `${n}px`}
              />
            )}
            {t.pageStyle === "lines" && (
              <Stepper
                title={t("ribbon.design.lineSpacing")}
                value={t.pageLineHeight || DEFAULT_LINE_HEIGHT}
                min={16}
                max={60}
                step={2}
                onChange={(pageLineHeight) => patch({ pageLineHeight })}
                format={(n) => `${n}px`}
              />
            )}
          </>
        )}
      </RibbonGroup>

      {/* 2. Style Sets */}
      <RibbonGroup label={t("ribbon.design.styleSets")} icon={LayoutTemplate} priority={60}>
        <MenuLabel>{t("ribbon.design.documentFormatting")}</MenuLabel>
        <TextGrid
          items={STYLE_SETS.map((s) => s.id)}
          onPick={applyStyleSet}
          columns={6}
        />
        <div className="px-1 pt-1 grid gap-1" style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
          {STYLE_SETS.map((set) => (
            <button
              key={set.id}
              type="button"
              title={`${set.label}: ${set.description}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyStyleSet(set.id)}
              className={cn(
                "h-16 rounded-md border border-border/70 bg-card/60 p-2 text-left transition hover:scale-[1.02] hover:border-primary/40",
                t.styleSet === set.id && "ring-2 ring-primary border-primary/50"
              )}
            >
              <div className="font-medium text-[11px] truncate">{set.label}</div>
              <div className="font-mono text-[9px] text-muted-foreground/70 truncate">{set.font}</div>
              <div className="font-mono text-[9px] text-muted-foreground/70 truncate">H: {set.headingFont}</div>
              <div className="font-mono text-[9px] text-muted-foreground/70">Size: {set.size}px · Line: {set.lineHeight}</div>
            </button>
          ))}
        </div>
      </RibbonGroup>

      {/* 3. Themes */}
      <RibbonGroup label={t("ribbon.design.themes")} icon={Palette} priority={50}>
        <MenuLabel>{t("ribbon.design.themePresetPerNote")}</MenuLabel>
        <RibbonMenu
          id="design.themePreset"
          icon={Palette}
          label={t("ribbon.design.themePreset")}
          hint={t("ribbon.design.themePresetHint")}
          width={280}
          children={(close) => (
            <div className="max-h-[50vh] overflow-y-auto">
              <MenuItem onClick={() => { drop("themePreset"); close(); }}>{t("ribbon.design.clearUseAppTheme")}</MenuItem>
              <MenuLabel>{t("ribbon.design.lightThemes")}</MenuLabel>
              {STYLE_SETS.slice(0, 3).map((s) => (
                <MenuItem key={s.id} onClick={() => { patch({ themePreset: s.id }); close(); }}>
                  {s.label}
                </MenuItem>
              ))}
              <MenuLabel>{t("ribbon.design.darkThemes")}</MenuLabel>
              {STYLE_SETS.slice(3).map((s) => (
                <MenuItem key={s.id} onClick={() => { patch({ themePreset: s.id }); close(); }}>
                  {s.label}
                </MenuItem>
              ))}
            </div>
          )}
        />
        
        <MenuLabel>Theme Colors</MenuLabel>
        <RibbonMenu
          id="design.themeAccent"
          icon={Droplet}
          label="Accent color"
          hint="Pick an accent color for this note (hex input supported)"
          width={300}
          children={(close) => (
            <div className="p-2">
              <div className="flex gap-2 mb-2">
                <input
                  type="color"
                  value={t.themeAccent || "#3b82f6"}
                  onChange={(e) => { patch({ themeAccent: e.target.value }); close(); }}
                  className="h-8 w-8 rounded border border-border/70 cursor-pointer"
                  title="Custom color"
                />
                <input
                  type="text"
                  placeholder="#rrggbb"
                  value={t.themeAccent || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) patch({ themeAccent: v });
                  }}
                  onBlur={() => close()}
                  className="flex-1 h-8 rounded border border-border/70 bg-card/60 px-2 font-mono text-[11px]"
                  title="Hex color (e.g. #3b82f6)"
                />
              </div>
              <MenuLabel>Presets</MenuLabel>
              <Swatches
                items={colorSwatches}
                onPick={(id) => { const c = COLORS.find((x) => x.id === id); if (c) { patch({ themeAccent: c.value }); close(); } }}
                current={t.themeAccent ? COLORS.find((c) => c.value === t.themeAccent)?.id : null}
                columns={7}
              />
            </div>
          )}
        />

        <MenuLabel>Theme Fonts</MenuLabel>
        <RibbonSelect
          title="Heading font for this note"
          placeholder="Heading font"
          groups={fontGroups}
          value={t.themeHeadingFont || ""}
          onChange={(value) => (value ? patch({ themeHeadingFont: value }) : drop("themeHeadingFont"))}
        />
        <RibbonSelect
          title="Body font for this note"
          placeholder="Body font"
          groups={fontGroups}
          value={t.themeBodyFont || ""}
          onChange={(value) => (value ? patch({ themeBodyFont: value }) : drop("themeBodyFont"))}
        />
      </RibbonGroup>

      {/* 4. Paragraph Spacing */}
      <RibbonGroup label="Paragraph spacing" icon={Type} priority={40}>
        <RibbonSelect
          title="Paragraph spacing preset"
          placeholder="Spacing preset"
          options={PARAGRAPH_PRESETS.map((item) => ({ value: item.id, label: item.label }))}
          value={t.paragraphPreset || ""}
          onChange={(value) => (value ? applyParagraphPreset(value) : drop("paragraphPreset"))}
        />
        <MenuLabel>Custom</MenuLabel>
        <Stepper
          title="Space between paragraphs (em)"
          value={t.gap !== undefined ? t.gap : 0.95}
          min={0}
          max={4}
          step={0.1}
          onChange={(gap) => { patch({ gap, paragraphPreset: undefined }); }}
          format={(n) => `${n}em`}
        />
        <Stepper
          title="Line height"
          value={t.lineHeight || 1.78}
          min={1}
          max={3.5}
          step={0.1}
          onChange={(lineHeight) => { patch({ lineHeight, paragraphPreset: undefined }); }}
          format={(n) => `${n}`}
        />
      </RibbonGroup>

      {/* 5. Page Appearance */}
      <RibbonGroup label="Page appearance" icon={Square} priority={30}>
        <MenuLabel>Page Color</MenuLabel>
        <RibbonMenu
          id="design.pageColor"
          icon={PaintBucket}
          label="Page color"
          hint="Background color for the page"
          width={280}
          children={(close) => (
            <div className="p-2">
              <div className="flex gap-2 mb-2">
                <input
                  type="color"
                  value={t.pageColor || "#ffffff"}
                  onChange={(e) => { patch({ pageColor: e.target.value }); close(); }}
                  className="h-8 w-8 rounded border border-border/70 cursor-pointer"
                  title="Custom color"
                />
                <input
                  type="text"
                  placeholder="#rrggbb"
                  value={t.pageColor || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) patch({ pageColor: v });
                  }}
                  onBlur={() => close()}
                  className="flex-1 h-8 rounded border border-border/70 bg-card/60 px-2 font-mono text-[11px]"
                  title="Hex color"
                />
              </div>
              <MenuLabel>Presets</MenuLabel>
              <Swatches
                items={pageColorPresets}
                onPick={(id) => { const c = pageColorPresets.find((x) => x.id === id); if (c) { patch({ pageColor: c.value }); close(); } }}
                current={t.pageColor ? pageColorPresets.find((c) => c.value === t.pageColor)?.id : null}
                columns={6}
              />
            </div>
          )}
        />

        <MenuLabel>Page Borders</MenuLabel>
        <RibbonSelect
          title="Page border style"
          placeholder="Border"
          options={PAGE_BORDERS.map((item) => ({ value: item.id, label: item.label }))}
          value={t.pageBorder || "none"}
          onChange={(value) => (value && value !== "none" ? patch({ pageBorder: value }) : drop("pageBorder"))}
        />
        {t.pageBorder && t.pageBorder !== "none" && (
          <RibbonMenu
            id="design.pageBorderColor"
            icon={Hash}
            label="Border color"
            hint="Color of the page border"
            width={280}
            children={(close) => (
              <div className="p-2">
                <div className="flex gap-2 mb-2">
                  <input
                    type="color"
                    value={t.pageBorderColor || "#9ca3af"}
                    onChange={(e) => { patch({ pageBorderColor: e.target.value }); close(); }}
                    className="h-8 w-8 rounded border border-border/70 cursor-pointer"
                    title="Custom color"
                  />
                  <input
                    type="text"
                    placeholder="#rrggbb"
                    value={t.pageBorderColor || ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9a-fA-F]{6}$/.test(v)) patch({ pageBorderColor: v });
                    }}
                    onBlur={() => close()}
                    className="flex-1 h-8 rounded border border-border/70 bg-card/60 px-2 font-mono text-[11px]"
                    title="Hex color"
                  />
                </div>
                <MenuLabel>Presets</MenuLabel>
                <Swatches
                  items={colorSwatches}
                  onPick={(id) => { const c = COLORS.find((x) => x.id === id); if (c) { patch({ pageBorderColor: c.value }); close(); } }}
                  current={t.pageBorderColor ? COLORS.find((c) => c.value === t.pageBorderColor)?.id : null}
                  columns={7}
                />
              </div>
            )}
          />
        )}

        <MenuLabel>Title visibility</MenuLabel>
        <Btn
          id="design.hideTitle"
          icon={t.hideTitle ? EyeOff : Eye}
          label="Hide page title"
          hint="Hide the large title above the note body in reader view"
          active={t.hideTitle === true}
          onClick={() => patch({ hideTitle: !t.hideTitle })}
        />

        <MenuLabel>Watermark</MenuLabel>
        <RibbonMenu
          id="design.watermarkText"
          icon={Stamp}
          label="Watermark text"
          hint="Text to show as watermark (e.g. DRAFT, CONFIDENTIAL)"
          width={280}
          children={(close) => (
            <div className="p-2">
              <input
                type="text"
                placeholder="Watermark text"
                value={t.watermarkText || ""}
                onChange={(e) => patch({ watermarkText: e.target.value.slice(0, 30) })}
                onBlur={() => close()}
                className="w-full h-8 rounded border border-border/70 bg-card/60 px-2 font-mono text-[11px] mb-2"
                title="Max 30 characters"
              />
              <MenuLabel>Presets</MenuLabel>
              <TextGrid
                items={watermarkPresets}
                onPick={(text) => { patch({ watermarkText: text }); close(); }}
                columns={4}
              />
              <MenuItem onClick={() => { drop("watermarkText"); close(); }}>Clear watermark</MenuItem>
            </div>
          )}
        />
        {t.watermarkText && (
          <>
            <RibbonMenu
              id="design.watermarkColor"
              icon={Droplet}
              label="Watermark color"
              hint="Color of the watermark text"
              width={280}
              children={(close) => (
                <div className="p-2">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="color"
                      value={t.watermarkColor || "#9ca3af"}
                      onChange={(e) => { patch({ watermarkColor: e.target.value }); close(); }}
                      className="h-8 w-8 rounded border border-border/70 cursor-pointer"
                      title="Custom color"
                    />
                    <input
                      type="text"
                      placeholder="#rrggbb"
                      value={t.watermarkColor || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[0-9a-fA-F]{6}$/.test(v)) patch({ watermarkColor: v });
                      }}
                      onBlur={() => close()}
                      className="flex-1 h-8 rounded border border-border/70 bg-card/60 px-2 font-mono text-[11px]"
                      title="Hex color"
                    />
                  </div>
                  <MenuLabel>Presets</MenuLabel>
                  <Swatches
                    items={colorSwatches}
                    onPick={(id) => { const c = COLORS.find((x) => x.id === id); if (c) { patch({ watermarkColor: c.value }); close(); } }}
                    current={t.watermarkColor ? COLORS.find((c) => c.value === t.watermarkColor)?.id : null}
                    columns={7}
                  />
                </div>
              )}
            />
            <Stepper
              title="Watermark opacity"
              value={t.watermarkOpacity !== undefined ? t.watermarkOpacity : DEFAULT_WATERMARK_OPACITY}
              min={0}
              max={1}
              step={0.05}
              onChange={(watermarkOpacity) => patch({ watermarkOpacity })}
              format={(n) => `${Math.round(n * 100)}%`}
            />
            <RibbonSelect
              title="Watermark angle"
              placeholder="Angle"
              options={WATERMARK_ANGLES.map((item) => ({ value: item.id, label: item.label }))}
              value={t.watermarkAngle || "diagonal"}
              onChange={(value) => patch({ watermarkAngle: value })}
            />
          </>
        )}
      </RibbonGroup>

      {/* 6. Page Title Style */}
      <RibbonGroup label="Page title style" icon={Heading} priority={20}>
        <MenuLabel>Font</MenuLabel>
        <RibbonSelect
          title="Font for the page title"
          placeholder="Title font"
          groups={fontGroups}
          value={t.titleFont || ""}
          onChange={(value) => (value ? patch({ titleFont: value }) : drop("titleFont"))}
        />
        <MenuLabel>Size</MenuLabel>
        <Stepper
          title="Title font size (px)"
          value={t.titleSize || 28}
          min={14}
          max={72}
          step={2}
          onChange={(titleSize) => patch({ titleSize })}
          format={(n) => `${n}px`}
        />
        <MenuLabel>Alignment</MenuLabel>
        <RibbonSelect
          title="Title alignment"
          placeholder="Alignment"
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
          value={t.titleAlign || "left"}
          onChange={(value) => (value && value !== "left" ? patch({ titleAlign: value }) : drop("titleAlign"))}
        />
      </RibbonGroup>

      {/* Note Language */}
      <RibbonGroup label="Language" icon={Globe} priority={15}>
        <RibbonSelect
          title="Note language (for spell check and hyphenation)"
          placeholder="Language"
          options={AI_LANGUAGES.map((lang) => ({ value: lang.id, label: `${lang.native} (${lang.label})` }))}
          value={t.language || ""}
          onChange={(value) => (value ? patch({ language: value }) : drop("language"))}
        />
      </RibbonGroup>

      {/* 7. Defaults */}
      <RibbonGroup label="Defaults" icon={Save} priority={10}>
        <Btn
          id="design.saveAsDefault"
          icon={Save}
          label="Set as default for new notes"
          hint="Save current note's design as the default for new notes"
          onClick={saveAsDefault}
        />
        <Btn
          id="design.loadDefault"
          icon={RotateCcw}
          label="Apply default to this note"
          hint="Load the saved default style into this note"
          onClick={loadDefaultStyle}
        />
        <Btn
          id="design.resetDesign"
          icon={Trash2}
          label="Reset to app defaults"
          hint="Clear all design settings on this note"
          onClick={resetDesign}
        />
        {getDefaultStyle() && (
          <p className="self-center px-3 font-mono text-[10px] text-muted-foreground/70">
            Default style saved
          </p>
        )}
      </RibbonGroup>
    </>
  );
}