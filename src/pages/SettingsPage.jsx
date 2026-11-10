import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, RotateCcw, Settings2, Database, Loader2, AlertTriangle, Upload, FileText, FolderOpen, RefreshCw, Info, Package, CheckCircle2, CheckCircle, AlertCircle, Languages, FolderKanban, HardDrive, X, Brain, Wifi, WifiOff, Shield } from "lucide-react";
import VaultHeader from "@/components/vault/VaultHeader";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select as SelectComponent,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { cn, isTauri } from "@/lib/utils";
import { useI18n, getLang, setLang, getDigits, setDigits, LANGS, t } from "@/lib/i18n";
import { convertBase64ImagesToAttachments } from "@/lib/attachments";
import { db } from "@/api/localDb";
import { useUpdater } from "@/hooks/useUpdater";
import { useMirror } from "@/hooks/useMirror";

const PRESET_KEY = "theme:preset";
const SETTINGS_KEY = "settings:backup-reminder";
const UPDATE_CHECK_KEY = "settings:autoUpdateCheck";

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
    <SelectComponent value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className={cn("h-9 w-full", className)}>
        <SelectValue placeholder="" />
      </SelectTrigger>
      <SelectContent position="popper">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectComponent>
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

function ResetButton({ onClick, label, disabled }) {
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

function AiWarningModal({ open, onOpenChange }) {
  const { t: tr } = useI18n();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            {tr("settings.ai.warningTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 text-[13px]">
            <p>{tr("settings.ai.warningText1")}</p>
            <p>{tr("settings.ai.warningText2")}</p>
            <p className="font-medium">{tr("settings.ai.warningText3")}</p>
            <div className="p-3 rounded bg-amber-50 dark:bg-amber-900/30 border border-amber-200/50 dark:border-amber-800/50 text-[12px] text-amber-800 dark:text-amber-200">
              {tr("settings.ai.warningText4")}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>{tr("settings.ai.warningCancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={() => onOpenChange(false)}>{tr("settings.ai.warningOk")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function SettingsPage() {
  const { t: tr, localDigits } = useI18n();
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

  // Window behavior (Tauri only)
  const [alwaysOnTop, setAlwaysOnTop] = useState(() => readPref("settings:alwaysOnTop", false));

  // Fonts (local bundled)
  const [fontsBundled, setFontsBundled] = useState(false);

  // Check if font files exist locally
  const checkFontsBundled = async () => {
    const fontFiles = [
      "/fonts/Inter-VariableFont_wght.woff2",
      "/fonts/InstrumentSerif-Regular.woff2",
      "/fonts/InstrumentSerif-Italic.woff2",
      "/fonts/JetBrainsMono-VariableFont_wght.woff2",
    ];
    try {
      const results = await Promise.all(
        fontFiles.map((url) => fetch(url, { method: "HEAD", cache: "no-cache" }).then((r) => r.ok).catch(() => false))
      );
      setFontsBundled(results.every((ok) => ok));
    } catch {
      setFontsBundled(false);
    }
  };

  // Check on mount
  useEffect(() => {
    checkFontsBundled();
  }, []);

  // Shortcuts
  const [shortcuts] = useState(() => getAllShortcuts());

  // Backup
  const [backupReminder, setBackupReminder] = useState(() => readPref(SETTINGS_KEY, "14"));
  const [lastBackup, setLastBackup] = useState(() => readPref("settings:lastBackup", null));

  // Migration
  const [migrationBusy, setMigrationBusy] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [migrationResult, setMigrationResult] = useState(null);
  const [migrationDone, setMigrationDone] = useState(null);

  // Import
  const [importBusy, setImportBusy] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importPreserveFolders, setImportPreserveFolders] = useState(true);
  const [importFileResult, setImportFileResult] = useState("");
  const [importFolderResult, setImportFolderResult] = useState("");
  const importFileInputRef = useRef(null);
  const importFolderInputRef = useRef(null);
  const pendingImportFiles = useRef(null);

  // AI
  const [aiEnabled, setAiEnabled] = useState(() => readPref("ai:enabled", false));
  const [aiEndpoint, setAiEndpoint] = useState(() => readPref("ai:endpoint", "https://api.openai.com/v1"));
  const [aiModel, setAiModel] = useState(() => readPref("ai:model", "gpt-4o-mini"));
  const [aiApiKey, setAiApiKey] = useState(() => readPref("ai:apiKey", ""));
  const [aiTestBusy, setAiTestBusy] = useState(false);
  const [aiTestResult, setAiTestResult] = useState(null);
  const [showAiWarning, setShowAiWarning] = useState(false);

  // Updates
  const [autoUpdateCheck, setAutoUpdateCheck] = useState(() => readPref(UPDATE_CHECK_KEY, true));
  const { update, checking, downloading, downloadProgress, checkForUpdate, handleInstall } = useUpdater();
  const [currentVersion, setCurrentVersion] = useState("0.0.4"); // Synced with package.json and tauri.conf.json

  // Mirror
  const {
    mirrorFolder,
    mirrorEnabled,
    autoMirror,
    isMirroring,
    mirrorProgress,
    lastMirrorTime,
    mirrorError,
    isTauri: isMirrorTauri,
    canMirror,
    progressPercent,
    setMirrorFolder,
    setMirrorEnabled,
    setAutoMirror,
    handlePickFolder,
    handleMirrorNow,
    clearMirrorFolder,
  } = useMirror();

  const handleAutoUpdateCheckChange = (value) => {
    writePref(UPDATE_CHECK_KEY, value);
    setAutoUpdateCheck(value);
  };

  const handleScanForBase64 = async () => {
    setMigrationBusy(true);
    setScanResult("Scanning...");
    setMigrationResult(null);
    setMigrationDone(null);
    try {
      const notes = await db.entities.Note.list({ limit: 10000 });
      let totalImages = 0;
      let totalNotes = 0;
      for (const note of notes.items) {
        if (note.body) {
          const matches = note.body.match(/!\[[^\]]*\]\(data:image\/[^;]+;base64,[^)]+\)/g);
          if (matches && matches.length > 0) {
            totalNotes++;
            totalImages += matches.length;
          }
        }
      }
      setScanResult(`Found ${totalImages} image${totalImages !== 1 ? "s" : ""} in ${totalNotes} note${totalNotes !== 1 ? "s" : ""}.`);
      if (totalImages > 0) {
        setMigrationResult({ totalImages, totalNotes });
      } else {
        toast.success("No embedded images found.");
      }
    } catch (err) {
      setScanResult(`Error: ${err.message}`);
      toast.error(`Scan failed: ${err.message}`);
    } finally {
      setMigrationBusy(false);
    }
  };

  const handleRunMigration = async () => {
    setMigrationBusy(true);
    setMigrationDone(null);
    try {
      const notes = await db.entities.Note.list({ limit: 10000 });
      let totalConverted = 0;
      let notesUpdated = 0;
      
      for (const note of notes.items) {
        if (!note.body) continue;
        
        const { markdown, converted } = await convertBase64ImagesToAttachments(note.body);
        if (converted > 0) {
          await db.entities.Note.update(note.id, { body: markdown });
          totalConverted += converted;
          notesUpdated++;
        }
      }
      
      setMigrationDone({ converted: totalConverted, notesUpdated });
      setMigrationResult(null);
      setScanResult("");
      toast.success(`Converted ${totalConverted} image${totalConverted !== 1 ? "s" : ""} in ${notesUpdated} note${notesUpdated !== 1 ? "s" : ""}.`);
    } catch (err) {
      toast.error(`Migration failed: ${err.message}`);
    } finally {
      setMigrationBusy(false);
    }
  };

  // Import handlers
  const handleImportFilesPick = () => {
    importFileInputRef.current?.click();
  };

  const handleImportFolderPick = () => {
    importFolderInputRef.current?.click();
  };

  const handleImportFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    event.target.value = "";
    
    setImportBusy(true);
    setImportFileResult("Previewing...");
    try {
      const { previewImport } = await import("@/lib/import");
      const preview = await previewImport(files, { 
        preserveFolderStructure: importPreserveFolders 
      });
      setImportPreview(preview);
      pendingImportFiles.current = files;
      setImportFileResult(`${files.length} file${files.length !== 1 ? "s" : ""} ready to import`);
    } catch (err) {
      setImportFileResult(`Error: ${err.message}`);
      toast.error(`Preview failed: ${err.message}`);
    } finally {
      setImportBusy(false);
    }
  };

  const handleImportFolder = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    event.target.value = "";
    
    setImportBusy(true);
    setImportFolderResult("Previewing...");
    try {
      const { previewImport } = await import("@/lib/import");
      const preview = await previewImport(files, { 
        preserveFolderStructure: importPreserveFolders 
      });
      setImportPreview(preview);
      pendingImportFiles.current = files;
      setImportFolderResult(`${files.length} file${files.length !== 1 ? "s" : ""} ready to import`);
    } catch (err) {
      setImportFolderResult(`Error: ${err.message}`);
      toast.error(`Preview failed: ${err.message}`);
    } finally {
      setImportBusy(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview || !pendingImportFiles.current) return;
    
    const files = pendingImportFiles.current;
    setImportBusy(true);
    try {
      const { importFiles } = await import("@/lib/import");
      const result = await importFiles(files, { 
        preserveFolderStructure: importPreserveFolders,
        onProgress: (update) => {
          // Could show progress here
        }
      });
      setImportPreview(null);
      pendingImportFiles.current = null;
      setImportFileResult("");
      setImportFolderResult("");
      const total = result.notes.length;
      const errors = result.errors.length;
      toast.success(
        `Imported ${total} note${total === 1 ? "" : "s"}${errors ? `, ${errors} error${errors !== 1 ? "s" : ""}` : ""}.`
      );
      if (errors) {
        result.errors.forEach((e) => console.error(e));
      }
    } catch (err) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setImportBusy(false);
    }
  };

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

  const handleAlwaysOnTopChange = (value) => {
    writePref("settings:alwaysOnTop", value);
    setAlwaysOnTop(value);
    if (isTauri()) {
      import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
        getCurrentWindow().setAlwaysOnTop(value).catch(console.error);
      });
    }
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

  // AI handlers
  const handleAiEnabledChange = (value) => {
    writePref("ai:enabled", value);
    setAiEnabled(value);
  };

  const handleAiEndpointChange = (value) => {
    writePref("ai:endpoint", value);
    setAiEndpoint(value);
  };

  const handleAiModelChange = (value) => {
    writePref("ai:model", value);
    setAiModel(value);
  };

  const handleAiApiKeyChange = (value) => {
    writePref("ai:apiKey", value);
    setAiApiKey(value);
  };

  const handleTestAiConnection = async () => {
    setAiTestBusy(true);
    setAiTestResult(null);
    try {
      const { testAIConnection } = await import("@/lib/ai");
      const result = await testAIConnection();
      setAiTestResult(result);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      const message = `Test failed: ${err.message}`;
      setAiTestResult({ success: false, message });
      toast.error(message);
    } finally {
      setAiTestBusy(false);
    }
  };

  const handleShowAiWarning = () => {
    setShowAiWarning(true);
  };

  const sections = [
    { id: "appearance", label: tr("settings.sections.appearance"), icon: Settings2 },
    { id: "writing", label: tr("settings.sections.writing"), icon: Settings2 },
    { id: "language", label: tr("settings.sections.language"), icon: Languages },
    { id: "editor", label: tr("settings.sections.editor"), icon: Settings2 },
    { id: "fonts", label: tr("settings.sections.fonts"), icon: Settings2 },
    { id: "shortcuts", label: tr("settings.sections.shortcuts"), icon: Settings2 },
    { id: "backup", label: tr("settings.sections.backup"), icon: Settings2 },
    { id: "import", label: tr("settings.sections.import"), icon: Upload },
    { id: "storage", label: tr("settings.sections.storage"), icon: Database },
    { id: "mirror", label: tr("settings.sections.mirror"), icon: FolderKanban },
    { id: "updates", label: tr("settings.sections.updates"), icon: RefreshCw },
    { id: "window", label: tr("settings.sections.window"), icon: Settings2 },
    { id: "ai", label: tr("settings.sections.ai"), icon: Brain },
  ];

  return (
    <div className="nb-shell min-h-screen">
      <VaultHeader />
      <main className="mx-auto max-w-[1180px] px-4 pb-16 pt-5 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label={tr("settings.back")}
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-display text-[26px] leading-tight tracking-tight">{tr("settings.title")}</h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {tr("settings.subtitle")}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <nav className="lg:sticky lg:top-20 lg:self-start space-y-1" aria-label={tr("settings.sectionsAria")}>
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-[13px] transition",
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
                  <SectionTitle id="appearance-heading">{tr("settings.appearance.title")}</SectionTitle>
                  <SectionDescription>{tr("settings.appearance.desc")}</SectionDescription>
                </div>

                <div className="space-y-4">
                  <div>
                    <FieldLabel htmlFor="theme-mode">{tr("settings.appearance.themeMode")}</FieldLabel>
                    <Select
                      id="theme-mode"
                      value={themeMode}
                      onChange={setThemeMode}
                      options={[
                        { value: "light", label: tr("settings.appearance.light") },
                        { value: "dark", label: tr("settings.appearance.dark") },
                        { value: "system", label: tr("settings.appearance.system") },
                      ]}
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="theme-preset">{tr("settings.appearance.themePreset")}</FieldLabel>
                    <Select
                      id="theme-preset"
                      value={themePreset}
                      onChange={setThemePreset}
                      options={themePresets.map((p) => ({ value: p.id, label: `${p.name} (${p.mode})` }))}
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="surface">{tr("settings.appearance.surface")}</FieldLabel>
                    <Select
                      id="surface"
                      value={surface}
                      onChange={setSurface}
                      options={SURFACES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="density">{tr("settings.appearance.density")}</FieldLabel>
                    <Select
                      id="density"
                      value={density}
                      onChange={handleDensityChange}
                      options={[
                        { value: "compact", label: tr("settings.appearance.compact") },
                        { value: "comfortable", label: tr("settings.appearance.comfortable") },
                        { value: "spacious", label: tr("settings.appearance.spacious") },
                      ]}
                    />
                  </div>
                </div>

                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[13px]">{tr("settings.appearance.preview")}</p>
                    <p className="text-[12px] text-muted-foreground">{tr("settings.appearance.previewDesc")}</p>
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
                    <SectionTitle id="writing-heading">{tr("settings.writing.title")}</SectionTitle>
                    <SectionDescription>{tr("settings.writing.desc")}</SectionDescription>
                  </div>
                  <ResetButton onClick={resetDefaultStyle} label={tr("settings.writing.reset")} disabled={Object.keys(defaultStyle).length === 0} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="default-font">{tr("settings.writing.font")}</FieldLabel>
                    <Select
                      id="default-font"
                      value={defaultStyle.font || "app"}
                      onChange={(e) => handleDefaultStyleChange("font", e.target.value || undefined)}
                      options={FONTS.map((f) => ({ value: f.id, label: f.label }))}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="default-size">{tr("settings.writing.size")}</FieldLabel>
                    <Select
                      id="default-size"
                      value={defaultStyle.size || 14}
                      onChange={(e) => handleDefaultStyleChange("size", Number(e.target.value) || undefined)}
                      options={SIZES.filter((s) => s >= 10 && s <= 24).map((s) => ({ value: s, label: `${s}px` }))}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="default-line-height">{tr("settings.writing.lineHeight")}</FieldLabel>
                    <Select
                      id="default-line-height"
                      value={defaultStyle.lineHeight || 1.78}
                      onChange={(e) => handleDefaultStyleChange("lineHeight", Number(e.target.value) || undefined)}
                      options={LINE_HEIGHTS.map((lh) => ({ value: lh, label: String(lh) }))}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="default-gap">{tr("settings.writing.gap")}</FieldLabel>
                    <Select
                      id="default-gap"
                      value={defaultStyle.gap ?? 0.95}
                      onChange={(e) => handleDefaultStyleChange("gap", Number(e.target.value) || undefined)}
                      options={PARAGRAPH_GAPS.map((g) => ({ value: g, label: String(g) }))}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="default-width">{tr("settings.writing.width")}</FieldLabel>
                    <Select
                      id="default-width"
                      value={defaultStyle.width || "normal"}
                      onChange={(e) => handleDefaultStyleChange("width", e.target.value || undefined)}
                      options={WIDTHS.map((w) => ({ value: w.id, label: w.label }))}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="default-align">{tr("settings.writing.align")}</FieldLabel>
                    <Select
                      id="default-align"
                      value={defaultStyle.align || "left"}
                      onChange={(e) => handleDefaultStyleChange("align", e.target.value || undefined)}
                      options={[
                        { value: "left", label: tr("settings.writing.left") },
                        { value: "center", label: tr("settings.writing.center") },
                        { value: "right", label: tr("settings.writing.right") },
                        { value: "justify", label: tr("settings.writing.justify") },
                      ]}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="default-dir">{tr("settings.writing.dir")}</FieldLabel>
                    <Select
                      id="default-dir"
                      value={defaultStyle.dir || "ltr"}
                      onChange={(e) => handleDefaultStyleChange("dir", e.target.value || undefined)}
                      options={[
                        { value: "ltr", label: tr("dir.ltr") },
                        { value: "rtl", label: tr("dir.rtl") },
                        { value: "auto", label: tr("dir.auto") },
                      ]}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="default-hide-title">{tr("settings.writing.hideTitle")}</FieldLabel>
                    <Toggle
                      id="default-hide-title"
                      label={tr("settings.writing.hideTitleLabel")}
                      checked={defaultStyle.hideTitle === true}
                      onChange={(value) => handleDefaultStyleChange("hideTitle", value || undefined)}
                      description={tr("settings.writing.hideTitleDesc")}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel htmlFor="default-editor-font">{tr("settings.writing.editorFont")}</FieldLabel>
                    <Select
                      id="default-editor-font"
                      value={defaultStyle.editorFont || "mono"}
                      onChange={(e) => handleDefaultStyleChange("editorFont", e.target.value || undefined)}
                      options={EDITOR_FONTS.map((f) => ({ value: f.id, label: f.label }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel htmlFor="default-editor-size">{tr("settings.writing.editorSize")}</FieldLabel>
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
                    <p className="font-medium text-[13px]">{tr("settings.writing.currentDefaults")}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {Object.keys(defaultStyle).length > 0
                        ? Object.entries(defaultStyle)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" · ")
                        : tr("settings.writing.usingDefaults")}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 2b. Language & digits */}
            {activeSection === "language" && (
              <section className="space-y-6" aria-labelledby="language-heading">
                <div>
                  <SectionTitle id="language-heading">{tr("settings.language.title")}</SectionTitle>
                  <SectionDescription>{tr("settings.language.desc")}</SectionDescription>
                </div>

                <div className="space-y-4">
                  <div>
                    <FieldLabel htmlFor="lang-select">{tr("settings.language.language")}</FieldLabel>
                    <Select
                      id="lang-select"
                      value={getLang()}
                      onChange={setLang}
                      options={LANGS.map((l) => ({ value: l.id, label: l.label }))}
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="digits-select">{tr("settings.language.digits")}</FieldLabel>
                    <Select
                      id="digits-select"
                      value={getDigits()}
                      onChange={setDigits}
                      options={[
                        { value: "latin", label: tr("digits.latin") },
                        { value: "arabicind", label: tr("digits.arabicind") },
                      ]}
                    />
                  </div>

                  <p className="text-[12px] text-muted-foreground">{tr("settings.language.dirAuto")}</p>
                </div>

                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[13px]">{tr("settings.language.current")}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {tr("lang." + getLang())} · {tr("digits." + (getDigits() === "arabicind" ? "arabicind" : "latin"))}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 3. Editor */}
            {activeSection === "editor" && (
              <section className="space-y-6" aria-labelledby="editor-heading">
                <div>
                  <SectionTitle id="editor-heading">{tr("settings.editor.title")}</SectionTitle>
                  <SectionDescription>{tr("settings.editor.desc")}</SectionDescription>
                </div>

                <div className="space-y-4">
                  <Slider
                    id="autosave-delay"
                    label={tr("settings.editor.autosave")}
                    min={1}
                    max={10}
                    step={1}
                    value={autosaveDelay}
                    onChange={handleAutosaveChange}
                    unit="s"
                  />

                  <div>
                    <FieldLabel htmlFor="spell-check">{tr("settings.editor.spellCheck")}</FieldLabel>
                    <Toggle
                      id="spell-check"
                      label={tr("settings.editor.spellCheckLabel")}
                      checked={spellCheck}
                      onChange={handleSpellCheckChange}
                      description={tr("settings.editor.spellCheckDesc")}
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="default-dir-editor">{tr("settings.editor.dir")}</FieldLabel>
                    <Select
                      id="default-dir-editor"
                      value={defaultDir}
                      onChange={handleDirChange}
                      options={[
                        { value: "ltr", label: tr("dir.ltr") },
                        { value: "rtl", label: tr("dir.rtl") },
                        { value: "auto", label: tr("dir.auto") },
                      ]}
                    />
                  </div>
                </div>

                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[13px]">{tr("settings.editor.current")}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {tr("settings.editor.autosaveLabel")}: {localDigits(autosaveDelay)}s · {tr("settings.editor.spellLabel")}: {spellCheck ? tr("settings.editor.on") : tr("settings.editor.off")} · {tr("settings.editor.directionLabel")}: {defaultDir}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 4. Fonts */}
            {activeSection === "fonts" && (
              <section className="space-y-6" aria-labelledby="fonts-heading">
                <div>
                  <SectionTitle id="fonts-heading">{tr("settings.fonts.title")}</SectionTitle>
                  <SectionDescription>
                    {tr("settings.fonts.desc")}
                    {" "}
                    <strong>{fontsBundled ? tr("settings.fonts.bundled") : tr("settings.fonts.google")}</strong>.
                  </SectionDescription>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/40 p-5 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <FontCard name="Inter" weights="300, 400, 500, 600" styles="Variable" usedFor={tr("settings.fonts.inter")} />
                    <FontCard name="Instrument Serif" weights="400, 400 italic" styles="Regular, Italic" usedFor={tr("settings.fonts.serif")} />
                    <FontCard name="JetBrains Mono" weights="400, 500" styles="Variable" usedFor={tr("settings.fonts.mono")} />
                  </div>

                  {!fontsBundled && (
                    <div className="pt-2 border-t border-border/60">
                      <p className="text-[12px] text-muted-foreground mb-3">
                        {tr("settings.fonts.howTo")}
                        <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px]">public/fonts/</code>.
                        {" "}{tr("settings.fonts.thenLocal")}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={copyFontUrls} className="gap-2">
                          <Copy className="h-3.5 w-3.5" />
                          {tr("settings.fonts.copyUrls")}
                        </Button>
                        <Button variant="outline" size="sm" onClick={checkFontsBundled} className="gap-2">
                          <RotateCcw className="h-3.5 w-3.5" />
                          {tr("settings.fonts.recheck")}
                        </Button>
                      </div>
                    </div>
                  )}

                  {fontsBundled && (
                    <div className="pt-2 border-t border-border/60 text-green-600 dark:text-green-400 text-[12px]">
                      {tr("settings.fonts.bundledNote")}
                    </div>
                  )}
                </div>

                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[13px]">{tr("settings.fonts.neededTitle")}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {tr("settings.fonts.needed")}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 5. Shortcuts */}
            {activeSection === "shortcuts" && (
              <section className="space-y-6" aria-labelledby="shortcuts-heading">
                <div>
                  <SectionTitle id="shortcuts-heading">{tr("settings.shortcuts.title")}</SectionTitle>
                  <SectionDescription>{tr("settings.shortcuts.desc")}</SectionDescription>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/40 overflow-hidden">
                  <table className="w-full text-start text-[12px]">
                    <thead>
                      <tr className="border-b border-border/50 bg-background/30">
                        <th className="px-3 py-2 font-mono text-muted-foreground">{tr("settings.shortcuts.action")}</th>
                        <th className="px-3 py-2 font-mono text-muted-foreground">{tr("settings.shortcuts.shortcut")}</th>
                        <th className="px-3 py-2 font-mono text-muted-foreground">{tr("settings.shortcuts.context")}</th>
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
                    <p className="font-medium text-[13px]">{tr("settings.shortcuts.total")}</p>
                    <p className="text-[12px] text-muted-foreground">{localDigits(shortcuts.length)} {tr("settings.shortcuts.listed")}</p>
                  </div>
                </div>
              </section>
            )}

            {/* 6. Backup */}
            {activeSection === "backup" && (
              <section className="space-y-6" aria-labelledby="backup-heading">
                <div>
                  <SectionTitle id="backup-heading">{tr("settings.backup.title")}</SectionTitle>
                  <SectionDescription>{tr("settings.backup.desc")}</SectionDescription>
                </div>

                <div className="space-y-4">
                  <div>
                    <FieldLabel htmlFor="backup-reminder">{tr("settings.backup.reminder")}</FieldLabel>
                    <Select
                      id="backup-reminder"
                      value={backupReminder}
                      onChange={handleBackupReminderChange}
                      options={[
                        { value: "never", label: tr("settings.backup.never") },
                        { value: "7", label: tr("settings.backup.every7") },
                        { value: "14", label: tr("settings.backup.every14") },
                        { value: "30", label: tr("settings.backup.every30") },
                      ]}
                    />
                  </div>

                  {lastBackup && (
                    <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                      <span>{tr("settings.backup.lastBackup")}</span>
                      <time dateTime={lastBackup} className="font-mono">
                        {localDigits(new Date(lastBackup).toLocaleDateString())}
                      </time>
                      <Button variant="ghost" size="sm" onClick={() => setLastBackup(new Date().toISOString())} className="h-7 px-2 text-[11px]">
                        {tr("settings.backup.updateNow")}
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

            {/* 7. Import */}
            {activeSection === "import" && (
              <section className="space-y-6" aria-labelledby="import-heading">
                <div>
                  <SectionTitle id="import-heading">{tr("settings.import.title")}</SectionTitle>
                  <SectionDescription>{tr("settings.import.desc")}</SectionDescription>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/40 p-5 space-y-4">
                  <div>
                    <p className="font-medium text-[13px]">{tr("settings.import.filesTitle")}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {tr("settings.import.filesDesc")}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleImportFilesPick}
                      disabled={importBusy}
                      className="gap-2"
                    >
                      {importBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                      {tr("settings.import.selectFiles")}
                    </Button>
                    <span className="font-mono text-[11px] text-muted-foreground">{importFileResult}</span>
                  </div>

                  <Separator className="my-4" />

                  <div>
                    <p className="font-medium text-[13px]">{tr("settings.import.folderTitle")}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {tr("settings.import.folderDesc")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-[12.5px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={importPreserveFolders}
                        onChange={(e) => setImportPreserveFolders(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-border/80 bg-card/60 text-primary focus:ring-2 focus:ring-primary/20"
                      />
                      {tr("settings.import.preserve")}
                    </label>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleImportFolderPick}
                      disabled={importBusy}
                      className="gap-2"
                    >
                      {importBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FolderOpen className="h-3.5 w-3.5" />}
                      {tr("settings.import.selectFolder")}
                    </Button>
                    <span className="font-mono text-[11px] text-muted-foreground">{importFolderResult}</span>
                  </div>

                  {importPreview && (
                    <div className="pt-3 border-t border-border/60 space-y-3">
                      <div className="flex items-center gap-2 text-[12px]">
                        <span>{tr("settings.import.files")}</span>
                        <span className="font-mono">{localDigits(importPreview.totalFiles)}</span>
                        <span className="text-muted-foreground">{tr("settings.import.notesToImport")}</span>
                        <span className="font-mono">{localDigits(importPreview.notes.filter(n => !n.error).length)}</span>
                        {importPreview.folders.length > 0 && (
                          <>
                            <span className="text-muted-foreground">{tr("settings.import.folders")}</span>
                            <span className="font-mono">{localDigits(importPreview.folders.length)}</span>
                          </>
                        )}
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {importPreview.notes.slice(0, 20).map((note, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px] px-2 py-1 rounded bg-background/50">
                            {note.error ? (
                              <>
                                <span className="text-destructive">✗</span>
                                <span className="truncate text-destructive">{note.title}: {note.error}</span>
                              </>
                            ) : (
                              <>
                                <span className="text-muted-foreground">📄</span>
                                <span className="truncate">{note.title}</span>
                                {note.folder && <span className="text-muted-foreground">→ {note.folder}</span>}
                                {note.tags.length > 0 && <span className="text-primary">#{note.tags.join(" #")}</span>}
                                {note.embedCount > 0 && <span className="text-amber-600">🖼 {note.embedCount}</span>}
                              </>
                            )}
                          </div>
                        ))}
                        {importPreview.notes.length > 20 && (
                          <p className="text-[11px] text-muted-foreground mt-1">{tr("settings.import.more")} {localDigits(importPreview.notes.length - 20)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setImportPreview(null)}
                          className="gap-2"
                        >
                          {tr("settings.import.cancel")}
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleConfirmImport}
                          disabled={importBusy}
                          className="gap-2"
                        >
                          {importBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : tr("settings.import.import")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 8. Storage */}
            {activeSection === "storage" && (
              <section className="space-y-6" aria-labelledby="storage-heading">
                <div>
                  <SectionTitle id="storage-heading">{tr("settings.storage.title")}</SectionTitle>
                  <SectionDescription>{tr("settings.storage.desc")}</SectionDescription>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/40 p-5 space-y-4">
                  <div>
                    <p className="font-medium text-[13px]">{tr("settings.storage.moveTitle")}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {tr("settings.storage.moveDesc")}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleScanForBase64}
                      disabled={migrationBusy}
                      className="gap-2"
                    >
                      {migrationBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
                      {tr("settings.storage.scan")}
                    </Button>
                    <span className="font-mono text-[11px] text-muted-foreground">{scanResult}</span>
                  </div>

                  {migrationResult && (
                    <div className="pt-3 border-t border-border/60 space-y-3">
                      <div className="flex items-center gap-2 text-[12px] text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>{localDigits(migrationResult.totalNotes)} {tr("settings.storage.found")} {localDigits(migrationResult.totalImages)} {tr("settings.storage.embeddedImages")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMigrationResult(null)}
                          className="gap-2"
                        >
                          {tr("settings.storage.cancel")}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleRunMigration}
                          disabled={migrationBusy}
                          className="gap-2"
                        >
                          {migrationBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : tr("settings.storage.convert")}
                        </Button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {tr("settings.storage.warn")}
                      </p>
                    </div>
                  )}

                  {migrationDone && (
                    <div className="pt-3 border-t border-border/60 text-green-600 dark:text-green-400 text-[12px]">
                      {localDigits(migrationDone.converted)} / {localDigits(migrationDone.notesUpdated)}
                    </div>
                  )}
                </div>

                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[13px]">{tr("settings.storage.info")}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {tr("settings.storage.infoDesc")}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 8b. Mirror */}
            {activeSection === "mirror" && (
              <section className="space-y-6" aria-labelledby="mirror-heading">
                <div>
                  <SectionTitle id="mirror-heading">{tr("settings.mirror.title")}</SectionTitle>
                  <SectionDescription>{tr("settings.mirror.desc")}</SectionDescription>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/40 p-5 space-y-4">
                  {!isMirrorTauri && (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-[12px] p-3 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>{tr("settings.mirror.onlyTauri")}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <FieldLabel htmlFor="mirror-enabled">{tr("settings.mirror.enabled")}</FieldLabel>
                    <Toggle
                      id="mirror-enabled"
                      label={tr("settings.mirror.enabledDesc")}
                      checked={mirrorEnabled}
                      onChange={setMirrorEnabled}
                    />
                  </div>

                  <div className="space-y-3">
                    <FieldLabel htmlFor="auto-mirror">{tr("settings.mirror.autoMirror")}</FieldLabel>
                    <Toggle
                      id="auto-mirror"
                      label={tr("settings.mirror.autoMirrorDesc")}
                      checked={autoMirror}
                      onChange={setAutoMirror}
                      disabled={!mirrorEnabled}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="mirror-folder">{tr("settings.mirror.folder")}</FieldLabel>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {mirrorFolder ? tr("settings.mirror.folderSet") + mirrorFolder : tr("settings.mirror.neverMirrored")}
                      </span>
                    </div>
                    <p className="text-[12px] text-muted-foreground">{tr("settings.mirror.folderDesc")}</p>
                    <div className="pt-2 border-t border-border/60 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePickFolder}
                        disabled={!mirrorEnabled || !isMirrorTauri}
                        className="gap-2"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        {tr("settings.mirror.selectFolder")}
                      </Button>
                      {mirrorFolder && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearMirrorFolder}
                          disabled={!mirrorEnabled}
                          className="gap-2 text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-3.5 w-3.5" />
                          {tr("settings.mirror.clearFolder")}
                        </Button>
                      )}
                    </div>
                    {mirrorFolder && (
                      <p className="text-[11px] text-muted-foreground font-mono truncate">{mirrorFolder}</p>
                    )}
                  </div>

                  <Separator className="my-2" />

                  <div className="flex items-center gap-3">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleMirrorNow}
                      disabled={isMirroring || !canMirror}
                      className="gap-2"
                    >
                      {isMirroring ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {tr("settings.mirror.mirroring")}
                        </>
                      ) : (
                        <>
                          <HardDrive className="h-3.5 w-3.5" />
                          {tr("settings.mirror.mirrorNow")}
                        </>
                      )}
                    </Button>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {isMirroring && mirrorProgress ? (
                        <>
                          {mirrorProgress.current}/{mirrorProgress.total} {tr("settings.mirror.notesMirrored")}
                          {mirrorProgress.phase === "notes" && mirrorProgress.currentNote && (
                            <span className="text-muted-foreground ml-2">— {mirrorProgress.currentNote}</span>
                          )}
                        </>
                      ) : lastMirrorTime ? (
                        lastMirrorTime
                      ) : (
                        tr("settings.mirror.neverMirrored")
                      )}
                    </span>
                  </div>

                  {isMirroring && mirrorProgress && mirrorProgress.total > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>{tr("settings.mirror.progress")}</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {mirrorError && (
                    <div className="pt-2 border-t border-border/60 text-destructive text-[12px]">
                      {mirrorError}
                    </div>
                  )}
                </div>

                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[13px]">{tr("settings.mirror.title")}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {mirrorEnabled ? tr("settings.mirror.enabledMsg") : tr("settings.mirror.disabled")} ·
                      {autoMirror ? tr("settings.mirror.autoMirrorOn") : tr("settings.mirror.autoMirrorOff")}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 9. Updates */}
            {activeSection === "updates" && (
              <section className="space-y-6" aria-labelledby="updates-heading">
                <div>
                  <SectionTitle id="updates-heading">{tr("settings.updates.title")}</SectionTitle>
                  <SectionDescription>
                    {tr("settings.updates.desc")}
                  </SectionDescription>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/40 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[13px]">{tr("settings.updates.current")}</p>
                      <p className="text-[12px] text-muted-foreground">{localDigits(`LemonNote v${currentVersion}`)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <span className="font-mono text-[11px] text-muted-foreground">v{localDigits(currentVersion)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <FieldLabel htmlFor="auto-update-check">{tr("settings.updates.autoCheck")}</FieldLabel>
                    <Toggle
                      id="auto-update-check"
                      label={tr("settings.updates.autoCheckLabel")}
                      checked={autoUpdateCheck}
                      onChange={handleAutoUpdateCheckChange}
                      description={tr("settings.updates.autoCheckDesc")}
                    />
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center gap-3">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => checkForUpdate(false)}
                      disabled={checking || downloading || !isTauri()}
                      className="gap-2"
                    >
                      {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      {checking ? tr("settings.updates.checking") : tr("settings.updates.checkNow")}
                    </Button>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {!isTauri() ? tr("settings.updates.onlyTauri") : checking ? tr("settings.updates.checking") : tr("settings.updates.manual")}
                    </span>
                  </div>

                  {update && (
                    <div className="pt-3 border-t border-border/60 space-y-3 rounded-lg bg-primary/5 p-3 border-primary/20">
                      <div className="flex items-center gap-2 text-[12px] text-primary">
                        <Info className="h-3.5 w-3.5" />
                        <span>Update <strong>v{update.version}</strong> is available!</span>
                      </div>
                      {update.notes && (
                        <div className="text-[11px] text-muted-foreground bg-background/50 p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap">
                          {update.notes}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleInstall(update)}
                          disabled={downloading}
                          className="gap-2"
                        >
                          {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          {downloading ? `Downloading... ${Math.round(downloadProgress)}%` : "Download and install"}
                        </Button>
                      </div>
                      {downloading && (
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${downloadProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {!update && !checking && !downloading && isTauri() && (
                    <div className="pt-3 border-t border-border/60 text-green-600 dark:text-green-400 text-[12px] flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{tr("settings.updates.latest")}</span>
                    </div>
                  )}
                </div>

                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[13px]">{tr("settings.updates.about")}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {tr("settings.updates.aboutDesc")}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 10. Window */}
            {activeSection === "window" && (
              <section className="space-y-6" aria-labelledby="window-heading">
                <div>
                  <SectionTitle id="window-heading">{tr("settings.window.title")}</SectionTitle>
                  <SectionDescription>{tr("settings.window.desc")}</SectionDescription>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/40 p-5 space-y-4">
                  {!isTauri() && (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-[12px] p-3 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>{tr("settings.window.onlyTauri")}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <FieldLabel htmlFor="always-on-top">{tr("settings.window.alwaysOnTop")}</FieldLabel>
                    <Toggle
                      id="always-on-top"
                      label={tr("settings.window.alwaysOnTopLabel")}
                      checked={alwaysOnTop}
                      onChange={handleAlwaysOnTopChange}
                      disabled={!isTauri()}
                      description={tr("settings.window.alwaysOnTopDesc")}
                    />
                  </div>
                </div>

                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[13px]">{tr("settings.window.current")}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {tr("settings.window.alwaysOnTopLabel")}: {alwaysOnTop ? tr("settings.window.on") : tr("settings.window.off")}
                      {!isTauri() && <span className="ml-2 text-amber-600 dark:text-amber-400">({tr("settings.window.onlyTauri")})</span>}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 11. AI */}
            {activeSection === "ai" && (
              <section className="space-y-6" aria-labelledby="ai-heading">
                <div>
                  <SectionTitle id="ai-heading">{tr("settings.ai.title")}</SectionTitle>
                  <SectionDescription>{tr("settings.ai.desc")}</SectionDescription>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/40 p-5 space-y-4">
                  <div className="space-y-3">
                    <FieldLabel htmlFor="ai-enabled">{tr("settings.ai.enabled")}</FieldLabel>
                    <Toggle
                      id="ai-enabled"
                      label={tr("settings.ai.enabledLabel")}
                      checked={aiEnabled}
                      onChange={handleAiEnabledChange}
                      description={tr("settings.ai.enabledDesc")}
                    />
                  </div>

                  {aiEnabled && (
                    <>
                      <Separator className="my-2" />

                      <div className="space-y-3">
                        <FieldLabel htmlFor="ai-endpoint">{tr("settings.ai.endpoint")}</FieldLabel>
                        <input
                          id="ai-endpoint"
                          type="url"
                          value={aiEndpoint}
                          onChange={(e) => handleAiEndpointChange(e.target.value)}
                          placeholder="https://api.openai.com/v1"
                          className="w-full h-9 rounded-md border border-border/80 bg-card/60 px-3 text-[13px] text-foreground outline-none transition focus:border-primary/40"
                          aria-describedby="ai-endpoint-hint"
                        />
                        <p id="ai-endpoint-hint" className="text-[11px] text-muted-foreground">{tr("settings.ai.endpointDesc")}</p>
                      </div>

                      <div className="space-y-3">
                        <FieldLabel htmlFor="ai-model">{tr("settings.ai.model")}</FieldLabel>
                        <input
                          id="ai-model"
                          type="text"
                          value={aiModel}
                          onChange={(e) => handleAiModelChange(e.target.value)}
                          placeholder="gpt-4o-mini"
                          className="w-full h-9 rounded-md border border-border/80 bg-card/60 px-3 text-[13px] text-foreground outline-none transition focus:border-primary/40"
                          aria-describedby="ai-model-hint"
                        />
                        <p id="ai-model-hint" className="text-[11px] text-muted-foreground">{tr("settings.ai.modelDesc")}</p>
                      </div>

                      <div className="space-y-3">
                        <FieldLabel htmlFor="ai-apiKey">{tr("settings.ai.apiKey")}</FieldLabel>
                        <div className="relative">
                          <input
                            id="ai-apiKey"
                            type="password"
                            value={aiApiKey}
                            onChange={(e) => handleAiApiKeyChange(e.target.value)}
                            placeholder="sk-..."
                            className="w-full h-9 rounded-md border border-border/80 bg-card/60 px-3 text-[13px] text-foreground outline-none transition focus:border-primary/40 pr-10"
                            aria-describedby="ai-apiKey-hint"
                          />
                          <button
                            type="button"
                            onClick={handleShowAiWarning}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label={tr("settings.ai.warningAria")}
                          >
                            <Shield className="h-4 w-4" />
                          </button>
                        </div>
                        <p id="ai-apiKey-hint" className="text-[11px] text-muted-foreground">{tr("settings.ai.apiKeyDesc")}</p>
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center gap-3">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleTestAiConnection}
                          disabled={aiTestBusy || !aiEndpoint || !aiModel || !aiApiKey}
                          className="gap-2"
                        >
                          {aiTestBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wifi className="h-3.5 w-3.5" />}
                          {aiTestBusy ? tr("settings.ai.testing") : tr("settings.ai.testConnection")}
                        </Button>
                        {aiTestResult && (
                          <span className={`font-mono text-[11px] ${aiTestResult.success ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                            {aiTestResult.success ? <Wifi className="h-3.5 w-3.5 inline" /> : <WifiOff className="h-3.5 w-3.5 inline" />}
                            {aiTestResult.message}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[13px]">{tr("settings.ai.current")}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {aiEnabled ? tr("settings.ai.enabledStatus") : tr("settings.ai.disabledStatus")}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Hidden file inputs for import */}
        <input
          ref={importFileInputRef}
          type="file"
          accept=".md,.markdown,.txt"
          multiple
          hidden
          onChange={handleImportFiles}
        />
        <input
          ref={importFolderInputRef}
          type="file"
          accept=".md,.markdown,.txt"
          multiple
          webkitdirectory
          hidden
          onChange={handleImportFolder}
        />

        {/* AI Warning Modal */}
        <AiWarningModal open={showAiWarning} onOpenChange={setShowAiWarning} />
        <input
          ref={importFolderInputRef}
          type="file"
          accept=".md,.markdown,.txt"
          multiple
          webkitdirectory
          hidden
          onChange={handleImportFolder}
        />
      </main>
    </div>
  );
}

// Helper components
function FontCard({ name, weights, styles, usedFor }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/50 p-3">
      <p className="font-medium text-[13px]">{name}</p>
      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{t("settings.fonts.weights")}: {weights}</p>
      <p className="font-mono text-[10px] text-muted-foreground">{t("settings.fonts.styles")}: {styles}</p>
      <p className="mt-1 text-[11px] text-muted-foreground/80">{t("settings.fonts.usedFor")}: {usedFor}</p>
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
  toast.success(t("settings.fonts.copied"));
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