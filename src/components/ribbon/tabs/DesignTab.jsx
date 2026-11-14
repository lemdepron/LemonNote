import {
  Grid,
  Type,
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
    const next = { ...typo };
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
      titleFont: typo.titleFont,
      titleSize: typo.titleSize,
      titleAlign: typo.titleAlign,
      language: typo.language,
    };
    if (setDefaultStyle(normalized)) {
      toast.success(t("ribbon.design.saveAsDefaultToast"));
    } else {
      toast.error(t("ribbon.design.saveFailedToast"));
    }
  };

  // Load default style into current note
  const loadDefaultStyle = () => {
    const def = getDefaultStyle();
    if (def) {
      setTypography(def);
      toast.success(t("ribbon.design.loadDefaultToast"));
    } else {
      toast.info(t("ribbon.design.noDefaultToast"));
    }
  };

  // Reset current note's design to app defaults
  const resetDesign = () => {
    setTypography({});
    toast.success(t("ribbon.design.resetDesignToast"));
  };

  // Count visible items for each group to determine "more" button
  // Page Style: pageStyle (tall) + conditional pageGridSize + conditional pageLineHeight = up to 3
  // Style Sets: 1 tall grid (always visible)
  // Themes: themePreset (tall) + themeAccent + themeHeadingFont + themeBodyFont = 4
  // Paragraph Spacing: paragraphPreset (tall) + gap + lineHeight = 3
  // Page Appearance (merged): pageColor (tall) + pageBorder + pageBorderColor(cond) + hideTitle + watermarkText (tall) + watermarkColor(cond) + watermarkOpacity(cond) + watermarkAngle(cond) + titleFont (tall) + titleSize + titleAlign = up to 11
  // Language + Defaults: language (tall) + saveAsDefault + loadDefault + resetDesign = 4

  return (
    <>
      {/* 1. Page Style */}
      <RibbonGroup label={t("ribbon.design.pageStyle")} icon={Grid} priority={70} more={
        <>
          {(typo.pageStyle === "grid" || typo.pageStyle === "lines") && (
            <>
              {typo.pageStyle === "grid" && (
                <Stepper
                  title={t("ribbon.design.gridSpacing")}
                  value={typo.pageGridSize || DEFAULT_GRID_SIZE}
                  min={8}
                  max={100}
                  step={2}
                  onChange={(pageGridSize) => patch({ pageGridSize })}
                  format={(n) => `${n}px`}
                  style={{ gridRow: "span 2" }}
                />
              )}
              {typo.pageStyle === "lines" && (
                <Stepper
                  title={t("ribbon.design.lineSpacing")}
                  value={typo.pageLineHeight || DEFAULT_LINE_HEIGHT}
                  min={16}
                  max={60}
                  step={2}
                  onChange={(pageLineHeight) => patch({ pageLineHeight })}
                  format={(n) => `${n}px`}
                  style={{ gridRow: "span 2" }}
                />
              )}
            </>
          )}
        </>
      }>
        <RibbonSelect
          title={t("ribbon.design.pageStyleTitle")}
          placeholder={t("ribbon.design.pageStylePlaceholder")}
          options={PAGE_STYLES.map((item) => ({ value: item.id, label: item.label }))}
          value={typo.pageStyle || "default"}
          onChange={(value) => (value && value !== "default" ? patch({ pageStyle: value }) : drop("pageStyle"))}
          style={{ gridRow: "span 2" }}
        />
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
                typo.styleSet === set.id && "ring-2 ring-primary border-primary/50"
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
      <RibbonGroup label={t("ribbon.design.themes")} icon={Palette} priority={50} more={
        <>
          <RibbonMenu
            id="design.themeAccent"
            icon={Droplet}
            label={t("ribbon.design.accentColor")}
            hint={t("ribbon.design.accentColorHint")}
            width={300}
            children={(close) => (
              <div className="p-2">
                <div className="flex gap-2 mb-2">
                  <input
                    type="color"
                    value={typo.themeAccent || "#3b82f6"}
                    onChange={(e) => { patch({ themeAccent: e.target.value }); close(); }}
                    className="h-8 w-8 rounded border border-border/70 cursor-pointer"
                    title={t("ribbon.design.customColor")}
                  />
                  <input
                    type="text"
                    placeholder="#rrggbb"
                    value={typo.themeAccent || ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9a-fA-F]{6}$/.test(v)) patch({ themeAccent: v });
                    }}
                    onBlur={() => close()}
                    className="flex-1 h-8 rounded border border-border/70 bg-card/60 px-2 font-mono text-[11px]"
                    title={t("ribbon.design.hexColorPlaceholder")}
                  />
                </div>
                <MenuLabel>{t("ribbon.design.presets")}</MenuLabel>
                <Swatches
                  items={colorSwatches}
                  onPick={(id) => { const c = COLORS.find((x) => x.id === id); if (c) { patch({ themeAccent: c.value }); close(); } }}
                  current={typo.themeAccent ? COLORS.find((c) => c.value === typo.themeAccent)?.id : null}
                  columns={7}
                />
              </div>
            )}
          />
          <RibbonSelect
            title={t("ribbon.design.headingFont")}
            placeholder={t("ribbon.design.headingFontPlaceholder")}
            groups={fontGroups}
            value={typo.themeHeadingFont || ""}
            onChange={(value) => (value ? patch({ themeHeadingFont: value }) : drop("themeHeadingFont"))}
            style={{ gridRow: "span 2" }}
          />
          <RibbonSelect
            title={t("ribbon.design.bodyFont")}
            placeholder={t("ribbon.design.bodyFontPlaceholder")}
            groups={fontGroups}
            value={typo.themeBodyFont || ""}
            onChange={(value) => (value ? patch({ themeBodyFont: value }) : drop("themeBodyFont"))}
            style={{ gridRow: "span 2" }}
          />
        </>
      }>
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
      </RibbonGroup>

      {/* 4. Paragraph Spacing */}
      <RibbonGroup label={t("ribbon.design.paragraphSpacing")} icon={Type} priority={40} more={
        <>
          <Stepper
            title={t("ribbon.design.spaceBetweenParagraphs")}
            value={typo.gap !== undefined ? typo.gap : 0.95}
            min={0}
            max={4}
            step={0.1}
            onChange={(gap) => { patch({ gap, paragraphPreset: undefined }); }}
            format={(n) => `${n}em`}
            style={{ gridRow: "span 2" }}
          />
          <Stepper
            title={t("ribbon.design.lineHeight")}
            value={typo.lineHeight || 1.78}
            min={1}
            max={3.5}
            step={0.1}
            onChange={(lineHeight) => { patch({ lineHeight, paragraphPreset: undefined }); }}
            format={(n) => `${n}`}
            style={{ gridRow: "span 2" }}
          />
        </>
      }>
        <RibbonSelect
          title={t("ribbon.design.paragraphSpacingPreset")}
          placeholder={t("ribbon.design.paragraphSpacingPlaceholder")}
          options={PARAGRAPH_PRESETS.map((item) => ({ value: item.id, label: item.label }))}
          value={typo.paragraphPreset || ""}
          onChange={(value) => (value ? applyParagraphPreset(value) : drop("paragraphPreset"))}
          style={{ gridRow: "span 2" }}
        />
      </RibbonGroup>

      {/* 5. Page Appearance (merged with Page Title Style) */}
      <RibbonGroup label={t("ribbon.design.pageAppearance")} icon={Square} priority={30} more={
        <>
          {/* Page Border Color - conditional */}
          {typo.pageBorder && typo.pageBorder !== "none" && (
            <RibbonMenu
              id="design.pageBorderColor"
              icon={Hash}
              label={t("ribbon.design.pageBorderColor")}
              hint={t("ribbon.design.pageBorderColorHint")}
              width={280}
              children={(close) => (
                <div className="p-2">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="color"
                      value={typo.pageBorderColor || "#9ca3af"}
                      onChange={(e) => { patch({ pageBorderColor: e.target.value }); close(); }}
                      className="h-8 w-8 rounded border border-border/70 cursor-pointer"
                      title={t("ribbon.design.customColor")}
                    />
                    <input
                      type="text"
                      placeholder="#rrggbb"
                      value={typo.pageBorderColor || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[0-9a-fA-F]{6}$/.test(v)) patch({ pageBorderColor: v });
                      }}
                      onBlur={() => close()}
                      className="flex-1 h-8 rounded border border-border/70 bg-card/60 px-2 font-mono text-[11px]"
                      title={t("ribbon.design.hexColorPlaceholder")}
                    />
                  </div>
                  <MenuLabel>{t("ribbon.design.presets")}</MenuLabel>
                  <Swatches
                    items={colorSwatches}
                    onPick={(id) => { const c = COLORS.find((x) => x.id === id); if (c) { patch({ pageBorderColor: c.value }); close(); } }}
                    current={typo.pageBorderColor ? COLORS.find((c) => c.value === typo.pageBorderColor)?.id : null}
                    columns={7}
                  />
                </div>
              )}
            />
          )}

          {/* Hide Title */}
          <Btn
            id="design.hideTitle"
            icon={typo.hideTitle ? EyeOff : Eye}
            label={t("ribbon.design.hidePageTitle")}
            hint={t("ribbon.design.hidePageTitleHint")}
            active={typo.hideTitle === true}
            onClick={() => patch({ hideTitle: !typo.hideTitle })}
          />

          {/* Watermark Color - conditional */}
          {typo.watermarkText && (
            <>
              <RibbonMenu
                id="design.watermarkColor"
                icon={Droplet}
                label={t("ribbon.design.watermarkColor")}
                hint={t("ribbon.design.watermarkColorHint")}
                width={280}
                children={(close) => (
                  <div className="p-2">
                    <div className="flex gap-2 mb-2">
                      <input
                        type="color"
                        value={typo.watermarkColor || "#9ca3af"}
                        onChange={(e) => { patch({ watermarkColor: e.target.value }); close(); }}
                        className="h-8 w-8 rounded border border-border/70 cursor-pointer"
                        title={t("ribbon.design.customColor")}
                      />
                      <input
                        type="text"
                        placeholder="#rrggbb"
                        value={typo.watermarkColor || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (/^#[0-9a-fA-F]{6}$/.test(v)) patch({ watermarkColor: v });
                        }}
                        onBlur={() => close()}
                        className="flex-1 h-8 rounded border border-border/70 bg-card/60 px-2 font-mono text-[11px]"
                        title={t("ribbon.design.hexColorPlaceholder")}
                      />
                    </div>
                    <MenuLabel>{t("ribbon.design.presets")}</MenuLabel>
                    <Swatches
                      items={colorSwatches}
                      onPick={(id) => { const c = COLORS.find((x) => x.id === id); if (c) { patch({ watermarkColor: c.value }); close(); } }}
                      current={typo.watermarkColor ? COLORS.find((c) => c.value === typo.watermarkColor)?.id : null}
                      columns={7}
                    />
                  </div>
                )}
              />
              <Stepper
                title={t("ribbon.design.watermarkOpacity")}
                value={typo.watermarkOpacity !== undefined ? typo.watermarkOpacity : DEFAULT_WATERMARK_OPACITY}
                min={0}
                max={1}
                step={0.05}
                onChange={(watermarkOpacity) => patch({ watermarkOpacity })}
                format={(n) => `${Math.round(n * 100)}%`}
                style={{ gridRow: "span 2" }}
              />
              <RibbonSelect
                title={t("ribbon.design.watermarkAngle")}
                placeholder={t("ribbon.design.watermarkAnglePlaceholder")}
                options={WATERMARK_ANGLES.map((item) => ({ value: item.id, label: item.label }))}
                value={typo.watermarkAngle || "diagonal"}
                onChange={(value) => patch({ watermarkAngle: value })}
                style={{ gridRow: "span 2" }}
              />
            </>
          )}

          {/* Page Title Style controls */}
          <RibbonSelect
            title={t("ribbon.design.titleFont")}
            placeholder={t("ribbon.design.titleFontPlaceholder")}
            groups={fontGroups}
            value={typo.titleFont || ""}
            onChange={(value) => (value ? patch({ titleFont: value }) : drop("titleFont"))}
            style={{ gridRow: "span 2" }}
          />
          <Stepper
            title={t("ribbon.design.titleSize")}
            value={typo.titleSize || 28}
            min={14}
            max={72}
            step={2}
            onChange={(titleSize) => patch({ titleSize })}
            format={(n) => `${n}px`}
            style={{ gridRow: "span 2" }}
          />
          <RibbonSelect
            title={t("ribbon.design.titleAlignment")}
            placeholder={t("ribbon.design.titleAlignmentPlaceholder")}
            options={[
              { value: "left", label: t("dir.ltr") },
              { value: "center", label: t("dir.center") || "Center" },
              { value: "right", label: t("dir.rtl") },
            ]}
            value={typo.titleAlign || "left"}
            onChange={(value) => (value && value !== "left" ? patch({ titleAlign: value }) : drop("titleAlign"))}
            style={{ gridRow: "span 2" }}
          />
        </>
      }>
        {/* Page Color */}
        <RibbonMenu
          id="design.pageColor"
          icon={PaintBucket}
          label={t("ribbon.design.pageColor")}
          hint={t("ribbon.design.pageColorHint")}
          width={280}
          children={(close) => (
            <div className="p-2">
              <div className="flex gap-2 mb-2">
                <input
                  type="color"
                  value={typo.pageColor || "#ffffff"}
                  onChange={(e) => { patch({ pageColor: e.target.value }); close(); }}
                  className="h-8 w-8 rounded border border-border/70 cursor-pointer"
                  title={t("ribbon.design.customColor")}
                />
                <input
                  type="text"
                  placeholder="#rrggbb"
                  value={typo.pageColor || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) patch({ pageColor: v });
                  }}
                  onBlur={() => close()}
                  className="flex-1 h-8 rounded border border-border/70 bg-card/60 px-2 font-mono text-[11px]"
                  title={t("ribbon.design.hexColorPlaceholder")}
                />
              </div>
              <MenuLabel>{t("ribbon.design.presets")}</MenuLabel>
              <Swatches
                items={pageColorPresets}
                onPick={(id) => { const c = pageColorPresets.find((x) => x.id === id); if (c) { patch({ pageColor: c.value }); close(); } }}
                current={typo.pageColor ? pageColorPresets.find((c) => c.value === typo.pageColor)?.id : null}
                columns={6}
              />
            </div>
          )}
          style={{ gridRow: "span 2" }}
        />

        {/* Page Border */}
        <RibbonSelect
          title={t("ribbon.design.pageBorderStyle")}
          placeholder={t("ribbon.design.pageBorderPlaceholder")}
          options={PAGE_BORDERS.map((item) => ({ value: item.id, label: item.label }))}
          value={typo.pageBorder || "none"}
          onChange={(value) => (value && value !== "none" ? patch({ pageBorder: value }) : drop("pageBorder"))}
          style={{ gridRow: "span 2" }}
        />

        {/* Watermark Text */}
        <RibbonMenu
          id="design.watermarkText"
          icon={Stamp}
          label={t("ribbon.design.watermarkText")}
          hint={t("ribbon.design.watermarkTextHint")}
          width={280}
          children={(close) => (
            <div className="p-2">
              <input
                type="text"
                placeholder={t("ribbon.design.watermarkTextPlaceholder")}
                value={typo.watermarkText || ""}
                onChange={(e) => patch({ watermarkText: e.target.value.slice(0, 30) })}
                onBlur={() => close()}
                className="w-full h-8 rounded border border-border/70 bg-card/60 px-2 font-mono text-[11px] mb-2"
                title={t("ribbon.design.watermarkMaxChars")}
              />
              <MenuLabel>{t("ribbon.design.watermarkPresets")}</MenuLabel>
              <TextGrid
                items={watermarkPresets}
                onPick={(text) => { patch({ watermarkText: text }); close(); }}
                columns={4}
              />
              <MenuItem onClick={() => { drop("watermarkText"); close(); }}>{t("ribbon.design.clearWatermark")}</MenuItem>
            </div>
          )}
          style={{ gridRow: "span 2" }}
        />
      </RibbonGroup>

      {/* 6. Language + Defaults (merged) */}
      <RibbonGroup label={t("ribbon.design.language")} icon={Globe} priority={10} more={
        <>
          <Btn
            id="design.saveAsDefault"
            icon={Save}
            label={t("ribbon.design.saveAsDefault")}
            hint={t("ribbon.design.saveAsDefaultHint")}
            onClick={saveAsDefault}
          />
          <Btn
            id="design.loadDefault"
            icon={RotateCcw}
            label={t("ribbon.design.loadDefault")}
            hint={t("ribbon.design.loadDefaultHint")}
            onClick={loadDefaultStyle}
          />
          <Btn
            id="design.resetDesign"
            icon={Trash2}
            label={t("ribbon.design.resetDesign")}
            hint={t("ribbon.design.resetDesignHint")}
            onClick={resetDesign}
          />
        </>
      }>
        <RibbonSelect
          title={t("ribbon.design.noteLanguage")}
          placeholder={t("ribbon.design.languagePlaceholder")}
          options={AI_LANGUAGES.map((lang) => ({ value: lang.id, label: `${lang.native} (${lang.label})` }))}
          value={typo.language || ""}
          onChange={(value) => (value ? patch({ language: value }) : drop("language"))}
          style={{ gridRow: "span 2" }}
        />
        {getDefaultStyle() && (
          <p className="self-center px-3 font-mono text-[10px] text-muted-foreground/70" style={{ gridRow: "span 2" }}>
            {t("ribbon.design.defaultStyleSaved")}
          </p>
        )}
      </RibbonGroup>
    </>
  );
}