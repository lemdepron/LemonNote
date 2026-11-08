import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, RotateCcw, Settings2 } from "lucide-react";
import VaultHeader from "@/components/vault/VaultHeader";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { readPref, writePref, subscribePrefs } from "@/lib/preferences";
import { applyTheme } from "@/lib/theme";
import { THEME_PRESETS as themePresets, SURFACES } from "@/lib/theme-presets";
import {
  FONTS,
  SIZES,
  LINE_HEIGHTS,
  PARAGRAPH_GAPS,
  WIDTHS,
  EDITOR_FONTS,
} from "@/lib/text-style";
import Backup from "@/components/vault/Backup";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const PRESET_KEY = "theme:preset";
const SETTINGS_KEY = "settings:backup-reminder";

function SectionTitle({ children }) {
  return <h2 className="font-display text-[16px] leading-tight tracking-tight">{children}</h2>;
}

function SectionDescription({ children }) {
  return <p className="mt-1 text-[12.5px] text-muted-foreground">{children}</p>;
}

function FieldLabel({ children, htmlFor }) {
  return <label htmlFor={htmlFor} className="block text-[12px] font-medium text-foreground mb-1">{children}</label>;
}

function Select({ id, value, onChange, options, className }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cn("h-9 w-full rounded-md border border-border/80 bg-card/60 px-3 text-[13px] text-foreground outline-none transition focus:border-primary/40", className)}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function Slider({ id, label, min, max, step, value, onChange, unit = "" }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <span className="font-mono text-[11px] text-muted-foreground">{value}{unit}</span>
      </div>
      <input type="range" id={id} min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none accent-primary" />
    </div>
  );
}

function Toggle({ id, label, checked, onChange, description }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-border/80 bg-card/60 text-primary focus:ring-2 focus:ring-primary/20" />
      <div className="min-w-0">
        <span className="text-[13px] text-foreground">{label}</span>
        {description && <span className="block text-[11px] text-muted-foreground">{description}</span>}
      </div>
    </label>
  );
}

function ResetButton({ onClick, label = "Reset to defaults", disabled }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={disabled} className="h-8 text-[11px]">
      <RotateCcw className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

function ToastIcon({ type }) {
  if (type === "success") return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (type === "error") return <AlertCircle className="h-4 w-4 text-destructive" />;
  return <Info className="h-4 w-4 text-primary" />;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("appearance");

  // Appearance
  const [themeMode, setThemeMode] = useState(() => readPref("theme", "system"));
  const [themePreset, setThemePreset] = useState(() => readPref(PRESET_KEY, "parchment"));
  const [surface, setSurface] = useState(() => readPref("theme:surface", "waves"));
  const [density, setDensity] = useState(() => readPref("settings:density", "comfortable"));

  // Writing defaults
  const [defaultStyle, setDefaultStyle] = useState(() => readPref("settings:defaultStyle", {}));

  // Editor
  const [autosaveDelay, setAutosaveDelay] = useState(() => readPref("settings:autosaveDelay", 2));
  const [spellCheck, setSpellCheck] = useState(() => readPref("settings:spellCheck", true));
  const [defaultDir, setDefaultDir] = useState(() => readPref("settings:defaultDir", "ltr"));

  // Fonts (local bundled)
  const [fontsBundled, setFontsBundled] = useState(false);

  // Shortcuts
  const [shortcuts] = useState(() => getAllShortcuts());

  // Backup
  const [backupReminder, setBackupReminder] = useState(() => readPref(SETTINGS_KEY, "14"));
  const [lastBackup, setLastBackup] = useState(() => readPref("settings:lastBackup", null));

  // Subscribe to pref changes
  useEffect(() => {
    const unsub = subscribePrefs(() => {
      setThemeMode(readPref("theme", "system"));
      setThemePreset(readPref(PRESET_KEY, "parchment"));
      setSurface(readPref("theme:surface", "waves"));
      setDensity(readPref("settings:density", "comfortable"));
      setDefaultStyle(readPref("settings:defaultStyle", {}));
      setAutosaveDelay(readPref("settings:autosaveDelay", 2));
      setSpellCheck(readPref("settings:spellCheck", true));
      setDefaultDir(readPref("settings:defaultDir", "ltr"));
      setBackupReminder(readPref(SETTINGS_KEY, "14"));
      setLastBackup(readPref("settings:lastBackup", null));
    });
    return unsub;
  }, []);

  // Apply theme changes immediately
  useEffect(() => {
    writePref("theme", themeMode);
    applyTheme();
  }, [themeMode]);

  useEffect(() => {
    writePref(PRESET_KEY, themePreset);
    const preset = themePresets.find((p) => p.id === themePreset);
    if (preset) {
      document.documentElement.dataset.surface = preset.surface;
    }
  }, [themePreset]);

  useEffect(() => {
    writePref("theme:surface", surface);
    document.documentElement.dataset.surface = surface;
  }, [surface]);

  const handleDensityChange = (value) => {
    writePref("settings:density", value);
    setDensity(value);
    document.documentElement.style.setProperty("--density", value);
  };

  const handleDefaultStyleChange = (key, value) => {
    const next = { ...defaultStyle, [key]: value };
    setDefaultStyle(next);
    writePref("settings:defaultStyle", next);
  };

  const resetDefaultStyle = () => {
    setDefaultStyle({});
    writePref("settings:defaultStyle", {});
    toast.success("Writing defaults reset.");
  };

  const handleAutosaveChange = (value) => {
    writePref("settings:autosaveDelay", value);
    setAutosaveDelay(value);
  };

  const handleSpellCheckChange = (value) => {
    writePref("settings:spellCheck", value);
    setSpellCheck(value);
  };

  const handleDirChange = (value) => {
    writePref("settings:defaultDir", value);
    setDefaultDir(value);
  };

  const handleBackupReminderChange = (value) => {
    writePref(SETTINGS_KEY, value);
    setBackupReminder(value);
    checkBackupReminder();
  };

  const checkBackupReminder = () => {
    if (backupReminder === "never" || !lastBackup) return;
    const days = Number(backupReminder);
    const elapsed = (Date.now() - new Date(lastBackup).getTime()) / (1000 * 60 * 60 * 24);
    if (elapsed >= days) {
      toast({
        text: `It's been ${Math.round(elapsed)} days since your last backup. Consider exporting one.`,
        type: "info",
        actionLabel: "Backup now",
        onAction: () => {
          setActiveSection("backup");
          // The Backup component will be visible
        },
        duration: 0,
      });
    }
  };

  // Check on mount
  useEffect(() => {
    checkBackupReminder();
  }, []);

  const sections = [
    { id: "appearance", label: "Appearance", icon: Settings2 },
    { id: "writing", label: "Writing defaults", icon: Settings2 },
    { id: "editor", label: "Editor", icon: Settings2 },
    { id: "fonts", label: "Fonts", icon: Settings2 },
    { id: "shortcuts", label: "Shortcuts", icon: Settings2 },
    { id: "backup", label: "Backup", icon: Settings2 },
  ];

  return (
    <div className="nb-shell min-h-screen">
      <VaultHeader />
      <main className="mx-auto max-w-[1180px] px-4 pb-16 pt-5 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Back to vault"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-display text-[26px] leading-tight tracking-tight">Settings</h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Configure how LemonNote looks and behaves.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <nav className="lg:sticky lg:top-20 lg:self-start space-y-1" aria-label="Settings sections">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition",
                  activeSection === section.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <section.icon className="h-4 w-4 shrink-0" />
                {section.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="space-y-6">
            {/* 1. Appearance */}
            {activeSection === "appearance" && (
              <section className="space-y-6" aria-labelledby="appearance-heading">
                <div>
                  <SectionTitle id="appearance-heading">Appearance</SectionTitle>
                  <SectionDescription>Choose a theme preset, light/dark mode, background texture, and interface density.</SectionDescription>
                </div>

                <div className="space-y-4">
                  <div>
                    <FieldLabel htmlFor="theme-mode">Theme mode</FieldLabel>
                    <Select
                      id="theme-mode"
                      value={themeMode}
                      onChange={setThemeMode}
                      options={[
                        { value: "light", label: "Light" },
                        { value: "dark", label: "Dark" },
                        { value: "system", label: "System" },
                      ]}
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="theme-preset">Theme preset</FieldLabel>
                    <Select
                      id="theme-preset"
                      value={themePreset}
                      onChange={setThemePreset}
                      options={themePresets.map((p) => ({ value: p.id, label: `${p.name} (${p.mode})` }))}
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="surface">Background texture</FieldLabel>
                    <Select
                      id="surface"
                      value={surface}
                      onChange={setSurface}
                      options={SURFACES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="density">Interface density</FieldLabel>
                    <Select
                      id="density"
                      value={density}
                      onChange={handleDensityChange}
                      options={[
                        { value: "compact", label: "Compact" },
                        { value: "comfortable", label: "Comfortable" },
                        { value: "spacious", label: "Spacious" },
                      ]}
                    />
                  </div>
                </div>

                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[13px]">Preview</p>
                    <p className="text-[12px] text-muted-foreground">Current theme applied to this page.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("h-3 w-3 rounded-full border", themeMode === "dark" ? "bg-background" : "bg-card")} />
                    <span className="font-mono text-[11px] text-muted-foreground capitalize">{themeMode}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{themePreset}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{surface}</span>
                  </div>
                </div>
              </section>
            )}

            {/* 2. Writing defaults */}
            {activeSection === "writing" && (
              <section className="space-y-6" aria-labelledby="writing-heading">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <SectionTitle id="writing-heading">Writing defaults</SectionTitle>
                    <SectionDescription>Default font, size, line spacing, and width for new notes. Per-note settings still override these.</SectionDescription>
                  </div>
                  <ResetButton onClick={resetDefaultStyle} disabled={Object.keys(defaultStyle).length === 0} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="default-font">Default font</FieldLabel>
                    <Select
                      id="default-font"
                      value={defaultStyle.font || "app"}
                      onChange={(e) => handleDefaultStyleChange("font", e.target.value || undefined)}
                      options={FONTS.map((f) => ({ value: f.id, label: f.label }))}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="default-size">Default size (px)</FieldLabel>
                    <Select
                      id="default-size"
                      value={defaultStyle.size || 14}
                      onChange={(e) => handleDefaultStyleChange("size", Number(e.target.value) || undefined)}
                      options={SIZES.filter((s) => s >= 10 && s <= 24).map((s) => ({ value: s, label: `${s}px` }))}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="default-line-height">Line height</FieldLabel>
                    <Select
                      id="default-line-height"
                      value={defaultStyle.lineHeight || 1.78}
                      onChange={(e) => handleDefaultStyleChange("lineHeight", Number(e.target.value) || undefined)}
                      options={LINE_HEIGHTS.map((lh) => ({ value: lh, label: String(lh) }))}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="default-gap">Paragraph gap (em)</FieldLabel>
                    <Select
                      id="default-gap"
                      value={defaultStyle.gap ?? 0.95}
                      onChange={(e) => handleDefaultStyleChange("gap", Number(e.target.value) || undefined)}
                      options={PARAGRAPH_GAPS.map((g) => ({ value: g, label: String(g) }))}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="default-width">Content width</FieldLabel>
                    <Select
                      id="default-width"
                      value={defaultStyle.width || "normal"}
                      onChange={(e) => handleDefaultStyleChange("width", e.target.value || undefined)}
                      options={WIDTHS.map((w) => ({ value: w.id, label: w.label }))}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="default-align">Text alignment</FieldLabel>
                    <Select
                      id="default-align"
                      value={defaultStyle.align || "left"}
                      onChange={(e) => handleDefaultStyleChange("align", e.target.value || undefined)}
                      options={[
                        { value: "left", label: "Left" },
                        { value: "center", label: "Center" },
                        { value: "right", label: "Right" },
                        { value: "justify", label: "Justify" },
                      ]}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="default-dir">Writing direction</FieldLabel>
                    <Select
                      id="default-dir"
                      value={defaultStyle.dir || "ltr"}
                      onChange={(e) => handleDefaultStyleChange("dir", e.target.value || undefined)}
                      options={[
                        { value: "ltr", label: "Left-to-right" },
                        { value: "rtl", label: "Right-to-left" },
                      ]}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel htmlFor="default-editor-font">Editor font</FieldLabel>
                    <Select
                      id="default-editor-font"
                      value={defaultStyle.editorFont || "mono"}
                      onChange={(e) => handleDefaultStyleChange("editorFont", e.target.value || undefined)}
                      options={EDITOR_FONTS.map((f) => ({ value: f.id, label: f.label }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel htmlFor="default-editor-size">Editor font size (px)</FieldLabel>
                    <Select
                      id="default-editor-size"
                      value={defaultStyle.editorSize || 13}
                      onChange={(e) => handleDefaultStyleChange("editorSize", Number(e.target.value) || undefined)}
                      options={SIZES.filter((s) => s >= 10 && s <= 20).map((s) => ({ value: s, label: `${s}px` }))}
                    />
                  </div>
                </div>

                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[13px]">Current defaults</p>
                    <p className="text-[12px] text-muted-foreground">
                      {Object.keys(defaultStyle).length > 0
                        ? Object.entries(defaultStyle)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" · ")
                        : "Using app defaults (no overrides)"}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 3. Editor */}
            {activeSection === "editor" && (
              <section className="space-y-6" aria-labelledby="editor-heading">
                <div>
                  <SectionTitle id="editor-heading">Editor</SectionTitle>
                  <SectionDescription>Autosave timing, spell checking, and default writing direction.</SectionDescription>
                </div>

                <div className="space-y-4">
                  <Slider
                    id="autosave-delay"
                    label="Autosave delay"
                    min={1}
                    max={10}
                    step={1}
                    value={autosaveDelay}
                    onChange={handleAutosaveChange}
                    unit="s"
                  />

                  <div>
                    <FieldLabel htmlFor="spell-check">Spell check</FieldLabel>
                    <Toggle
                      id="spell-check"
                      label="Enable browser spell check in editor"
                      checked={spellCheck}
                      onChange={handleSpellCheckChange}
                      description="Red squiggly lines under misspelled words."
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="default-dir-editor">Default writing direction</FieldLabel>
                    <Select
                      id="default-dir-editor"
                      value={defaultDir}
                      onChange={handleDirChange}
                      options={[
                        { value: "ltr", label: "Left-to-right" },
                        { value: "rtl", label: "Right-to-left" },
                      ]}
                    />
                  </div>
                </div>

                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[13px]">Current values</p>
                    <p className="text-[12px] text-muted-foreground">
                      Autosave: {autosaveDelay}s · Spell check: {spellCheck ? "on" : "off"} · Direction: {defaultDir}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 4. Fonts */}
            {activeSection === "fonts" && (
              <section className="space-y-6" aria-labelledby="fonts-heading">
                <div>
                  <SectionTitle id="fonts-heading">Fonts</SectionTitle>
                  <SectionDescription>
                    LemonNote uses three font families. Download them locally so the app works completely offline.
                    Current status: <strong>{fontsBundled ? "Bundled locally ✓" : "Loading from Google Fonts"}</strong>.
                  </SectionDescription>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/40 p-5 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <FontCard name="Inter" weights="300, 400, 500, 600" styles="Variable" usedFor="UI, body text, notes" />
                    <FontCard name="Instrument Serif" weights="400, 400 italic" styles="Regular, Italic" usedFor="Headings, serif notes" />
                    <FontCard name="JetBrains Mono" weights="400, 500" styles="Variable" usedFor="Code blocks, mono text" />
                  </div>

                  {!fontsBundled && (
                    <div className="pt-2 border-t border-border/60">
                      <p className="text-[12px] text-muted-foreground mb-3">
                        To bundle fonts locally, download the woff2 files for the weights above from Google Fonts and place them in
                        <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px]">public/fonts/</code>.
                        Then the app will use local @font-face rules instead of the Google Fonts CDN.
                      </p>
                      <Button variant="outline" size="sm" onClick={copyFontUrls} className="gap-2">
                        <Copy className="h-3.5 w-3.5" />
                        Copy download URLs to clipboard
                      </Button>
                    </div>
                  )}

                  {fontsBundled && (
                    <div className="pt-2 border-t border-border/60 text-green-600 dark:text-green-400 text-[12px]">
                      Fonts are bundled locally. The app works offline.
                    </div>
                  )}
                </div>

                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[13px]">Font files needed</p>
                    <p className="text-[12px] text-muted-foreground">
                      Inter (300-600 variable), Instrument Serif (400, 400i), JetBrains Mono (400-500 variable) — all woff2
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 5. Shortcuts */}
            {activeSection === "shortcuts" && (
              <section className="space-y-6" aria-labelledby="shortcuts-heading">
                <div>
                  <SectionTitle id="shortcuts-heading">Shortcuts</SectionTitle>
                  <SectionDescription>All keyboard shortcuts in the app. Customization is not available yet.</SectionDescription>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/40 overflow-hidden">
                  <table className="w-full text-left text-[12px]">
                    <thead>
                      <tr className="border-b border-border/50 bg-background/30">
                        <th className="px-3 py-2 font-mono text-muted-foreground">Action</th>
                        <th className="px-3 py-2 font-mono text-muted-foreground">Shortcut</th>
                        <th className="px-3 py-2 font-mono text-muted-foreground">Context</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shortcuts.map((s, i) => (
                        <tr key={i} className={cn("border-b border-border/30", i % 2 === 0 && "bg-card/20")}>
                          <td className="px-3 py-1.5 text-foreground">{s.action}</td>
                          <td className="px-3 py-1.5">
                            <kbd className="px-1.5 py-0.5 rounded border border-border/70 bg-muted/60 font-mono text-[10px] text-muted-foreground">{s.keys}</kbd>
                          </td>
                          <td className="px-3 py-1.5 text-muted-foreground">{s.context}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[13px]">Total</p>
                    <p className="text-[12px] text-muted-foreground">{shortcuts.length} shortcuts listed</p>
                  </div>
                </div>
              </section>
            )}

            {/* 6. Backup */}
            {activeSection === "backup" && (
              <section className="space-y-6" aria-labelledby="backup-heading">
                <div>
                  <SectionTitle id="backup-heading">Backup</SectionTitle>
                  <SectionDescription>Export or import your entire vault. Set a reminder to back up regularly.</SectionDescription>
                </div>

                <div className="space-y-4">
                  <div>
                    <FieldLabel htmlFor="backup-reminder">Backup reminder</FieldLabel>
                    <Select
                      id="backup-reminder"
                      value={backupReminder}
                      onChange={handleBackupReminderChange}
                      options={[
                        { value: "never", label: "Never" },
                        { value: "7", label: "Every 7 days" },
                        { value: "14", label: "Every 14 days" },
                        { value: "30", label: "Every 30 days" },
                      ]}
                    />
                  </div>

                  {lastBackup && (
                    <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                      <span>Last backup: </span>
                      <time dateTime={lastBackup} className="font-mono">
                        {new Date(lastBackup).toLocaleDateString()}
                      </time>
                      <Button variant="ghost" size="sm" onClick={() => setLastBackup(new Date().toISOString())} className="h-7 px-2 text-[11px]">
                        Update now
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />
                <Backup onBackupComplete={() => {
                  setLastBackup(new Date().toISOString());
                  writePref("settings:lastBackup", new Date().toISOString());
                  toast.success("Backup completed.");
                }} />
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper components
function FontCard({ name, weights, styles, usedFor }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/50 p-3">
      <p className="font-medium text-[13px]">{name}</p>
      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">Weights: {weights}</p>
      <p className="font-mono text-[10px] text-muted-foreground">Styles: {styles}</p>
      <p className="mt-1 text-[11px] text-muted-foreground/80">Used for: {usedFor}</p>
    </div>
  );
}

function copyFontUrls() {
  const urls = [
    "Inter: https://fonts.google.com/specimen/Inter (download variable woff2 300-600)",
    "Instrument Serif: https://fonts.google.com/specimen/Instrument+Serif (download 400, 400i woff2)",
    "JetBrains Mono: https://fonts.google.com/specimen/JetBrains+Mono (download variable woff2 400-500)",
  ];
  navigator.clipboard.writeText(urls.join("\n\n"));
  toast.success("Font download URLs copied to clipboard.");
}

// Shortcut collection from shortcuts.js and NoteRibbon.jsx
function getAllShortcuts() {
  const MAC = typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent || "");
  const MOD = MAC ? "⌘" : "Ctrl";
  const SHIFT = MAC ? "⇧" : "Shift";
  const ALT = MAC ? "⌥" : "Alt";

  const formatKey = (spec) => {
    const parts = [];
    if (spec.mod) parts.push(MOD);
    if (spec.shift) parts.push(SHIFT);
    if (spec.alt) parts.push(ALT);
    const key = spec.key.length === 1 ? spec.key.toUpperCase() : spec.key;
    parts.push(key);
    return parts.join(MAC ? "" : "+");
  };

  const shortcuts = [];

  // Global shortcuts from NoteRibbon
  const GLOBAL = {
    "Open today's journal": { mod: true, alt: true, key: "d" },
    "Insert date": { mod: true, alt: true, key: "t" },
    "Set task to TODO": { mod: true, alt: true, key: "1" },
    "Set task to DOING": { mod: true, alt: true, key: "2" },
    "Set task to DONE": { mod: true, alt: true, key: "3" },
    "Create flashcard": { mod: true, alt: true, key: "k" },
    "Create table": { mod: true, alt: true, key: "m" },
    "Create code file": { mod: true, alt: true, key: "c" },
    "Insert image": { mod: true, alt: true, key: "i" },
  };

  Object.entries(GLOBAL).forEach(([action, spec]) => {
    shortcuts.push({ action, keys: formatKey(spec), context: "Global" });
  });

  // Editor shortcuts from NoteRibbon
  const EDITOR = [
    ["Bold", { mod: true, key: "b" }],
    ["Italic", { mod: true, key: "i" }],
    ["Underline", { mod: true, key: "u" }],
    ["Inline code", { mod: true, key: "e" }],
    ["Strikethrough", { mod: true, shift: true, key: "x" }],
    ["Highlight", { mod: true, shift: true, key: "h" }],
    ["Toggle comment", { mod: true, key: "/" }],
  ];

  EDITOR.forEach(([action, spec]) => {
    shortcuts.push({ action, keys: formatKey(spec), context: "Editor (Markdown)" });
  });

  // App-wide shortcuts
  shortcuts.push(
    { action: "Open command palette", keys: `${MOD}K`, context: "Global" },
    { action: "Quick search (on home)", keys: "/", context: "Vault home" },
    { action: "New note", keys: `${MOD}N`, context: "Global" },
    { action: "Toggle focus mode", keys: `${MOD}${MAC ? "" : "+"}${SHIFT}F`, context: "Note, Graph" },
    { action: "Pin/unpin rail", keys: "—", context: "Rail button" },
    { action: "Collapse/expand rail", keys: "—", context: "Rail button" },
  );

  return shortcuts;
}

// Need to import CheckCircle, AlertCircle, Info for toast icons
import { CheckCircle, AlertCircle, Info } from "lucide-react";