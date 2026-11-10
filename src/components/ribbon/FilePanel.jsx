import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  Plus,
  Save,
  Printer,
  Download,
  Settings,
  Trash2,
  Edit2,
  Clock,
  Scale,
  Hash,
  Tag,
  Link2,
  Info,
  X,
  FilePlus,
  Copy,
  Lock,
  Unlock,
  Key,
  ChevronLeft,
} from "lucide-react";
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
import { db } from "@/api/localDb";
import { toast } from "@/lib/toast";
import { backlinksFor, plainText, isNoteLocked } from "@/lib/vault";
import { exportMarkdown, exportHtml, exportPdf } from "@/lib/note-export";
import { encrypt, decrypt } from "@/lib/encryption";
import { tableAt } from "@/lib/ribbon-actions";
import { exportTableToXlsx, exportTableToCsv, downloadBlob } from "@/lib/table-import-export";
import { cn } from "@/lib/utils";
import { t, useI18n, formatNumber } from "@/lib/i18n";

const BUILTIN_TEMPLATES = [
  {
    id: "builtin-meeting",
    name: "Meeting notes",
    isBuiltin: true,
    body: `# Meeting: {{date}}

**Attendees:**
- 

**Agenda:**
1. 
2. 
3. 

**Notes:**

**Action items:**
- [ ] 

**Next meeting:** {{nextDate}}
`,
  },
  {
    id: "builtin-daily",
    name: "Daily plan",
    isBuiltin: true,
    body: `# {{date}}

## Top 3 priorities
1. 
2. 
3. 

## Schedule
- 

## Notes

## Reflection
- What went well?
- What to improve?
`,
  },
  {
    id: "builtin-project",
    name: "Project",
    isBuiltin: true,
    body: `# Project: {{title}}

## Goal

## Stakeholders

## Timeline
- **Start:** {{date}}
- **End:** 

## Tasks
- [ ] 

## Resources

## Notes
`,
  },
];

export function FilePanel({ note, onClose, isNew, selection, noteBody, onApplyTemplate }) {
  const { formatDateTime, formatNumber } = useI18n();
  const [activeSection, setActiveSection] = useState("info");
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [newTemplateBody, setNewTemplateBody] = useState("");
  const [newTemplateName, setNewTemplateName] = useState("");

  // Alert dialog states
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertDialogTitle, setAlertDialogTitle] = useState("");
  const [alertDialogDesc, setAlertDialogDesc] = useState("");
  const [alertDialogAction, setAlertDialogAction] = useState(null);
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const [promptDialogTitle, setPromptDialogTitle] = useState("");
  const [promptDialogValue, setPromptDialogValue] = useState("");
  const [promptDialogConfirm, setPromptDialogConfirm] = useState(null);

  // Handle Escape key to close panel
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const result = await db.entities.Template.list({ sort: "-updated_date" });
      const userTemplates = result.items || [];
      // Combine built-in and user templates
      setTemplates([...BUILTIN_TEMPLATES, ...userTemplates]);
    } catch (err) {
      console.error("Failed to load templates:", err);
      setTemplates([...BUILTIN_TEMPLATES]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const saveAsTemplate = async () => {
    if (!note?.body?.trim()) {
      toast.error("Cannot save empty note as template.");
      return;
    }
    setSavingTemplate(true);
    try {
      const name = note.title?.trim() || "Untitled template";
      await db.entities.Template.create({
        name,
        body: note.body,
        tags: note.tags || [],
      });
      toast.success(`Saved "${name}" as template.`);
      setSavingTemplate(false);
      loadTemplates();
    } catch (err) {
      toast.error(`Failed to save template: ${err.message}`);
      setSavingTemplate(false);
    }
  };

  const createFromTemplate = async (template) => {
    if (isNew) {
      onClose();
      onApplyTemplate?.(template);
    } else {
      // For existing notes, confirm replacement
      setAlertDialogTitle(t("fileMenu.templates.confirmReplaceTitle"));
      setAlertDialogDesc(t("fileMenu.templates.confirmReplaceDesc", { name: template.name }));
      setAlertDialogAction(() => {
        onClose();
        onApplyTemplate?.(template);
      });
      setAlertDialogOpen(true);
    }
  };

  const deleteTemplate = async (template) => {
    if (template.isBuiltin) {
      toast.error(t("fileMenu.templates.builtinCannotDelete"));
      return;
    }
    setAlertDialogTitle(t("fileMenu.templates.confirmDeleteTitle"));
    setAlertDialogDesc(t("fileMenu.templates.confirmDeleteDesc", { name: template.name }));
    setAlertDialogAction(async () => {
      try {
        await db.entities.Template.delete(template.id);
        toast.success(t("fileMenu.templates.deleted", { name: template.name }));
        loadTemplates();
      } catch (err) {
        toast.error(t("fileMenu.templates.deleteFailed", { error: err.message }));
      }
    });
    setAlertDialogOpen(true);
  };

  const startRename = (template) => {
    if (template.isBuiltin) return;
    setRenamingId(template.id);
    setRenameValue(template.name);
  };

  const saveRename = async (template) => {
    if (!renameValue.trim()) return;
    try {
      await db.entities.Template.update(template.id, { name: renameValue.trim() });
      toast.success("Template renamed.");
      setRenamingId(null);
      loadTemplates();
    } catch (err) {
      toast.error(`Failed to rename: ${err.message}`);
    }
  };

  const cancelRename = () => {
    setRenamingId(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = (format) => {
    try {
      if (format === "markdown") exportMarkdown(note);
      else if (format === "html") exportHtml(note);
      else if (format === "pdf") exportPdf(note);
      toast.success(t("fileMenu.printExport.exported", { format: format.toUpperCase() }));
    } catch (err) {
      toast.error(t("fileMenu.printExport.exportFailed", { error: err.message }));
    }
  };

  const openSettings = () => {
    onClose();
    window.location.href = "/settings";
  };

  // Encryption dialog states
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [lockPassword, setLockPassword] = useState("");
  const [lockConfirmPassword, setLockConfirmPassword] = useState("");
  const [lockStep, setLockStep] = useState(1); // 1 = enter password, 2 = confirm, 3 = warning

  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");

  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [changeCurrentPassword, setChangeCurrentPassword] = useState("");
  const [changeNewPassword, setChangeNewPassword] = useState("");
  const [changeConfirmPassword, setChangeConfirmPassword] = useState("");
  const [changeStep, setChangeStep] = useState(1); // 1 = current, 2 = new, 3 = confirm

  // Encryption handlers using inline forms
  const handleLockNote = () => {
    if (isNew) {
      toast.error(t("fileMenu.encryption.cannotLockNew"));
      return;
    }
    if (isNoteLocked(note)) {
      toast.error(t("fileMenu.encryption.alreadyLocked"));
      return;
    }
    if (!note?.body?.trim()) {
      toast.error(t("fileMenu.encryption.emptyNote"));
      return;
    }
    setLockPassword("");
    setLockConfirmPassword("");
    setLockStep(1);
    setLockDialogOpen(true);
  };

  const handleLockConfirm = async () => {
    if (lockStep === 1) {
      if (!lockPassword) {
        toast.error(t("fileMenu.encryption.enterPassword"));
        return;
      }
      setLockStep(2);
    } else if (lockStep === 2) {
      if (lockPassword !== lockConfirmPassword) {
        toast.error(t("fileMenu.encryption.passwordsDontMatch"));
        return;
      }
      setLockStep(3);
    } else if (lockStep === 3) {
      // Warning confirmed, do the encryption
      try {
        const encryptedBody = await encrypt(note.body, lockPassword);
        await db.entities.Note.update(note.id, {
          is_encrypted: true,
          encrypted_body: encryptedBody,
          encryption_version: 1,
          title_encrypted: false,
          body: "",
        });
        toast.success(t("fileMenu.encryption.locked"));
        setLockDialogOpen(false);
        onClose();
        window.location.reload();
      } catch (err) {
        toast.error(`${t("fileMenu.encryption.lockFailed")}: ${err.message}`);
      }
    }
  };

  const handleUnlockNote = () => {
    if (!isNoteLocked(note)) {
      toast.error(t("fileMenu.encryption.notLocked"));
      return;
    }
    setUnlockPassword("");
    setUnlockDialogOpen(true);
  };

  const handleUnlockConfirm = async () => {
    if (!unlockPassword) return;
    try {
      const decryptedBody = await decrypt(note.encrypted_body, unlockPassword);
      await db.entities.Note.update(note.id, {
        is_encrypted: false,
        encrypted_body: null,
        encryption_version: 1,
        title_encrypted: false,
        body: decryptedBody,
      });
      toast.success(t("fileMenu.encryption.unlocked"));
      setUnlockDialogOpen(false);
      onClose();
      window.location.reload();
    } catch (err) {
      toast.error(t("fileMenu.encryption.wrongPassword"));
    }
  };

  const handleChangePassword = () => {
    if (!isNoteLocked(note)) {
      toast.error(t("fileMenu.encryption.notLocked"));
      return;
    }
    setChangeCurrentPassword("");
    setChangeNewPassword("");
    setChangeConfirmPassword("");
    setChangeStep(1);
    setChangePasswordDialogOpen(true);
  };

  const handleChangePasswordConfirm = async () => {
    if (changeStep === 1) {
      if (!changeCurrentPassword) return;
      try {
        await decrypt(note.encrypted_body, changeCurrentPassword);
        setChangeStep(2);
      } catch {
        toast.error(t("fileMenu.encryption.wrongPassword"));
      }
    } else if (changeStep === 2) {
      if (!changeNewPassword) return;
      setChangeStep(3);
    } else if (changeStep === 3) {
      if (changeNewPassword !== changeConfirmPassword) {
        toast.error(t("fileMenu.encryption.passwordsDontMatch"));
        return;
      }
      try {
        const decryptedBody = await decrypt(note.encrypted_body, changeCurrentPassword);
        const newEncryptedBody = await encrypt(decryptedBody, changeNewPassword);
        await db.entities.Note.update(note.id, {
          encrypted_body: newEncryptedBody,
        });
        toast.success(t("fileMenu.encryption.passwordChanged"));
        setChangePasswordDialogOpen(false);
        onClose();
      } catch (err) {
        toast.error(`${t("fileMenu.encryption.changeFailed")}: ${err.message}`);
      }
    }
  };
  // Compute info data
  const createdDate = note?.created_date ? formatDateTime(note.created_date) : "—";
  const modifiedDate = note?.updated_date ? formatDateTime(note.updated_date) : "—";
  const sizeKB = note?.body ? ((new Blob([note.body]).size) / 1024).toFixed(1) : "0";
  const wordCount = note?.body ? plainText(note.body).split(/\s+/).filter(Boolean).length : 0;
  const charCount = note?.body ? note.body.length : 0;
  const backlinksCount = note?.title && note?.body ? backlinksFor(note, []).length : 0; // We can't get all notes here easily
  const tagsList = note?.tags?.length ? note.tags.join(", ") : "—";
  const noteId = note?.id || "—";

  const sections = [
    { id: "info", label: t("fileMenu.sections.info"), icon: Info },
    { id: "new", label: t("fileMenu.sections.new"), icon: FilePlus },
    { id: "templates", label: t("fileMenu.sections.templates"), icon: FileText },
    { id: "print-export", label: t("fileMenu.sections.printExport"), icon: Printer },
    { id: "encryption", label: t("fileMenu.sections.encryption"), icon: Lock },
    { id: "settings", label: t("fileMenu.sections.settings"), icon: Settings },
  ];

  // General alert dialog for confirmations (template replace, delete template)
  const alertDialogContent = (
    <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{alertDialogTitle}</AlertDialogTitle>
          <AlertDialogDescription>{alertDialogDesc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setAlertDialogOpen(false)}>{t("fileMenu.templates.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={() => { alertDialogAction?.(); setAlertDialogOpen(false); }}>{t("fileMenu.templates.confirm")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Render as a portal to body for proper overlay
  const panelContent = (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label={t("fileMenu.title")}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className="relative flex flex-col w-full max-w-[15rem] bg-card border-e border-border/70 shadow-xl animate-in slide-in-from-left-2 duration-300">
        {/* Header with Back button */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 font-medium text-[13px] text-muted-foreground hover:text-foreground transition"
            aria-label={t("fileMenu.back")}
          >
            <ChevronLeft className="h-4 w-4" />
            {t("fileMenu.back")}
          </button>
          <span className="font-medium text-[14px]">{t("fileMenu.title")}</span>
          <div className="w-8" /> {/* spacer for centering */}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1" role="navigation" aria-label={t("fileMenu.navAria")}>
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-[13px] transition",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {section.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Section content panels */}
      <div className="fixed inset-y-0 start-[15rem] z-40 w-[calc(100%-15rem)] bg-background border-s border-border/70 animate-in fade-in duration-200">
        {activeSection === "info" && (
          <InfoSection
            createdDate={createdDate}
            modifiedDate={modifiedDate}
            sizeKB={sizeKB}
            wordCount={wordCount}
            charCount={charCount}
            backlinksCount={backlinksCount}
            tagsList={tagsList}
            noteId={noteId}
          />
        )}
        {activeSection === "new" && (
          <NewSection
            templates={templates}
            onCreate={createFromTemplate}
            loading={loadingTemplates}
          />
        )}
        {activeSection === "templates" && (
          <TemplatesSection
            templates={templates}
            onSaveAsTemplate={saveAsTemplate}
            onCreate={createFromTemplate}
            onDelete={deleteTemplate}
            onRename={startRename}
            saving={savingTemplate}
            renamingId={renamingId}
            renameValue={renameValue}
            setRenameValue={setRenameValue}
            onSaveRename={saveRename}
            onCancelRename={cancelRename}
            loading={loadingTemplates}
          />
        )}
        {activeSection === "print-export" && (
          <PrintExportSection
            onPrint={handlePrint}
            onExport={handleExport}
            onSettings={openSettings}
            note={note}
          />
        )}
        {activeSection === "encryption" && (
          <EncryptionSection
            note={note}
            onClose={onClose}
            isNew={isNew}
            onLock={handleLockNote}
            onUnlock={handleUnlockNote}
            onChangePassword={handleChangePassword}
            lockDialogOpen={lockDialogOpen}
            setLockDialogOpen={setLockDialogOpen}
            lockPassword={lockPassword}
            setLockPassword={setLockPassword}
            lockConfirmPassword={lockConfirmPassword}
            setLockConfirmPassword={setLockConfirmPassword}
            lockStep={lockStep}
            setLockStep={setLockStep}
            handleLockConfirm={handleLockConfirm}
            unlockDialogOpen={unlockDialogOpen}
            setUnlockDialogOpen={setUnlockDialogOpen}
            unlockPassword={unlockPassword}
            setUnlockPassword={setUnlockPassword}
            handleUnlockConfirm={handleUnlockConfirm}
            changePasswordDialogOpen={changePasswordDialogOpen}
            setChangePasswordDialogOpen={setChangePasswordDialogOpen}
            changeCurrentPassword={changeCurrentPassword}
            setChangeCurrentPassword={setChangeCurrentPassword}
            changeNewPassword={changeNewPassword}
            setChangeNewPassword={setChangeNewPassword}
            changeConfirmPassword={changeConfirmPassword}
            setChangeConfirmPassword={setChangeConfirmPassword}
            changeStep={changeStep}
            setChangeStep={setChangeStep}
            handleChangePasswordConfirm={handleChangePasswordConfirm}
          />
        )}
        {activeSection === "settings" && (
          <SettingsSection onSettings={openSettings} />
        )}
      </div>
      {alertDialogContent}
    </div>
  );

  // Render to body for proper overlay
  const root = document.getElementById("file-panel-root");
  if (root) {
    return createPortal(panelContent, root);
  }
  return panelContent;
}

function InfoSection({ createdDate, modifiedDate, sizeKB, wordCount, charCount, backlinksCount, tagsList, noteId }) {
  const rows = [
    { id: "created", label: t("fileMenu.info.created"), value: createdDate, icon: Clock },
    { id: "modified", label: t("fileMenu.info.modified"), value: modifiedDate, icon: Clock },
    { id: "size", label: t("fileMenu.info.size"), value: `${sizeKB} KB`, icon: Scale },
    { id: "words", label: t("fileMenu.info.words"), value: formatNumber(wordCount), icon: Hash },
    { id: "chars", label: t("fileMenu.info.characters"), value: formatNumber(charCount), icon: Hash },
    { id: "backlinks", label: t("fileMenu.info.backlinks"), value: formatNumber(backlinksCount), icon: Link2 },
    { id: "tags", label: t("fileMenu.info.tags"), value: tagsList, icon: Tag },
    { id: "noteId", label: t("fileMenu.info.noteId"), value: noteId, icon: FileText },
  ];
  return (
    <div className="h-full p-4 space-y-1 overflow-y-auto">
      <h3 className="nb-label">{t("fileMenu.info.heading")}</h3>
      <div className="space-y-2">
        {rows.map((row, i) => {
          const Icon = row.icon;
          return (
            <div key={i} className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent/50 transition">
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">{row.label}</p>
                <p className="text-[13px] truncate font-mono">{row.value}</p>
              </div>
              {row.id === "noteId" && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(noteId);
                    toast.success(t("fileMenu.info.copied"));
                  }}
                  className="p-1 rounded hover:bg-accent transition opacity-60 hover:opacity-100"
                  aria-label={t("fileMenu.info.copyId")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NewSection({ templates, onCreate, loading }) {
  const userTemplates = templates.filter((t2) => !t2.isBuiltin);
  const builtinTemplates = templates.filter((t2) => t2.isBuiltin);
  return (
    <div className="h-full p-4 space-y-4 overflow-y-auto">
      <h3 className="nb-label">{t("fileMenu.new.heading")}</h3>
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onCreate({ name: "Blank note", body: "", tags: [] })}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition hover:bg-accent/60"
          )}
        >
          <Plus className="h-4 w-4 shrink-0 text-primary" />
          <span>{t("fileMenu.new.blank")}</span>
        </button>
      </div>
      {builtinTemplates.length > 0 && (
        <div className="space-y-2">
          <p className="nb-label">{t("fileMenu.new.builtin")}</p>
          <div className="space-y-1">
            {builtinTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onCreate(template)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-[13px] transition hover:bg-accent/60"
                )}
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                {template.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {userTemplates.length > 0 && (
        <div className="space-y-2">
          <p className="nb-label">{t("fileMenu.new.yours")}</p>
          <div className="space-y-1">
            {userTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onCreate(template)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-[13px] transition hover:bg-accent/60"
                )}
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                {template.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {loading && <p className="text-center text-[12px] text-muted-foreground">{t("fileMenu.new.loading")}</p>}
    </div>
  );
}

function TemplatesSection({
  templates,
  onSaveAsTemplate,
  onCreate,
  onDelete,
  onRename,
  saving,
  renamingId,
  renameValue,
  setRenameValue,
  onSaveRename,
  onCancelRename,
  loading,
}) {
  const userTemplates = templates.filter((t2) => !t2.isBuiltin);
  return (
    <div className="h-full p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="nb-label">{t("fileMenu.templates.heading")}</h3>
        <button
          type="button"
          onClick={onSaveAsTemplate}
          disabled={saving}
          className="flex h-8 items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 font-mono text-[10.5px] text-primary transition hover:bg-primary/15"
        >
          <Save className="h-3.5 w-3.5" />
          {t("fileMenu.templates.saveCurrent")}
        </button>
      </div>

      {loading ? (
        <p className="text-center text-[12px] text-muted-foreground">{t("fileMenu.templates.loading")}</p>
      ) : userTemplates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 px-6 py-10 text-center">
          <p className="text-[14px] text-foreground">{t("fileMenu.templates.emptyTitle")}</p>
          <p className="mt-1 text-[12px] text-muted-foreground">{t("fileMenu.templates.emptyHint")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {userTemplates.map((template) => (
            <div key={template.id} className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/50 p-2">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              {renamingId === template.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onSaveRename(template)}
                    onBlur={() => onCancelRename()}
                    autoFocus
                    className="flex-1 h-7 rounded-md border border-border/80 bg-card/60 px-2 text-[13px] outline-none focus:border-primary/40"
                  />
                  <button type="button" onClick={() => onSaveRename(template)} className="p-1.5 text-primary hover:bg-primary/10 rounded" aria-label={t("fileMenu.templates.save")}><Save className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={onCancelRename} className="p-1.5 text-muted-foreground hover:bg-accent rounded" aria-label={t("fileMenu.templates.cancel")}><X className="h-3.5 w-3.5" /></button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onCreate(template)}
                    className="flex-1 text-left text-[13px] truncate py-1"
                  >
                    {template.name}
                  </button>
                  <button type="button" onClick={() => onRename(template)} className="p-1.5 rounded hover:bg-accent transition opacity-60 hover:opacity-100" aria-label={t("fileMenu.templates.rename")}><Edit2 className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => onDelete(template)} className="p-1.5 rounded hover:bg-accent transition opacity-60 hover:opacity-100 text-destructive" aria-label={t("fileMenu.templates.delete")}><Trash2 className="h-3.5 w-3.5" /></button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PrintExportSection({ onPrint, onExport, onSettings, selection, noteBody }) {
  const inTable = selection && tableAt(noteBody, selection.start);

  const handleExportTable = async (format) => {
    try {
      if (format === "xlsx") {
        const blob = await exportTableToXlsx(selection);
        downloadBlob(blob, "table.xlsx");
        toast.success("Exported table as .xlsx");
      } else if (format === "csv") {
        const blob = await exportTableToCsv(selection);
        downloadBlob(blob, "table.csv");
        toast.success("Exported table as .csv");
      }
    } catch (err) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  return (
    <div className="h-full p-4 space-y-4 overflow-y-auto">
      <h3 className="nb-label">{t("fileMenu.printExport.heading")}</h3>
      <div className="space-y-2">
        <button
          type="button"
          onClick={onPrint}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition hover:bg-accent/60"
          )}
        >
          <Printer className="h-4 w-4 shrink-0" />
          <span>{t("fileMenu.printExport.print")}</span>
        </button>
        <button
          type="button"
          onClick={() => onExport("markdown")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition hover:bg-accent/60"
          )}
        >
          <Download className="h-4 w-4 shrink-0" />
          <span>{t("fileMenu.printExport.md")}</span>
        </button>
        <button
          type="button"
          onClick={() => onExport("html")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition hover:bg-accent/60"
          )}
        >
          <Download className="h-4 w-4 shrink-0" />
          <span>{t("fileMenu.printExport.html")}</span>
        </button>
        <button
          type="button"
          onClick={() => onExport("pdf")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition hover:bg-accent/60"
          )}
        >
          <Download className="h-4 w-4 shrink-0" />
          <span>{t("fileMenu.printExport.pdf")}</span>
        </button>
      </div>
      {inTable && (
        <div className="space-y-2 pt-2 border-t border-border/60">
          <p className="nb-label">{t("fileMenu.printExport.table")}</p>
          <button
            type="button"
            onClick={() => handleExportTable("xlsx")}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition hover:bg-accent/60"
            )}
          >
            <Download className="h-4 w-4 shrink-0" />
            <span>{t("fileMenu.printExport.tableXlsx")}</span>
          </button>
          <button
            type="button"
            onClick={() => handleExportTable("csv")}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition hover:bg-accent/60"
            )}
          >
            <Download className="h-4 w-4 shrink-0" />
            <span>{t("fileMenu.printExport.tableCsv")}</span>
          </button>
        </div>
      )}
      <div className="pt-2 border-t border-border/60">
        <p className="nb-label">{t("fileMenu.printExport.app")}</p>
        <button
          type="button"
          onClick={onSettings}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition hover:bg-accent/60"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>{t("fileMenu.printExport.openSettings")}</span>
        </button>
      </div>
    </div>
  );
}

function EncryptionSection({
    note,
    onClose,
    isNew,
    onLock,
    onUnlock,
    onChangePassword,
    lockDialogOpen,
    setLockDialogOpen,
    lockPassword,
    setLockPassword,
    lockConfirmPassword,
    setLockConfirmPassword,
    lockStep,
    setLockStep,
    handleLockConfirm,
    unlockDialogOpen,
    setUnlockDialogOpen,
    unlockPassword,
    setUnlockPassword,
    handleUnlockConfirm,
    changePasswordDialogOpen,
    setChangePasswordDialogOpen,
    changeCurrentPassword,
    setChangeCurrentPassword,
    changeNewPassword,
    setChangeNewPassword,
    changeConfirmPassword,
    setChangeConfirmPassword,
    changeStep,
    setChangeStep,
    handleChangePasswordConfirm,
  }) {
    const locked = isNoteLocked(note);
    
    return (
      <div className="h-full p-4 space-y-4 overflow-y-auto">
        <h3 className="nb-label">{t("fileMenu.encryption.heading")}</h3>
        
        {locked ? (
          <div className="space-y-2">
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
              <div className="flex items-center gap-2 text-primary">
                <Lock className="h-4 w-4 shrink-0" />
                <span className="font-medium">{t("fileMenu.encryption.lockedStatus")}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("fileMenu.encryption.lockedDesc")}
              </p>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-border/60">
              <p className="nb-label">{t("fileMenu.encryption.actions")}</p>
              <button
                type="button"
                onClick={onUnlock}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition hover:bg-accent/60"
                )}
              >
                <Unlock className="h-4 w-4 shrink-0" />
                <span>{t("fileMenu.encryption.unlock")}</span>
              </button>
              <button
                type="button"
                onClick={onChangePassword}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition hover:bg-accent/60"
                )}
              >
                <Key className="h-4 w-4 shrink-0" />
                <span>{t("fileMenu.encryption.changePassword")}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {!isNew && note?.body?.trim() ? (
              <>
                <div className="rounded-lg border border-border/60 bg-card/50 p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Unlock className="h-4 w-4 shrink-0 opacity-50" />
                    <span>{t("fileMenu.encryption.unlockedStatus")}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("fileMenu.encryption.unlockedDesc")}
                  </p>
                </div>
                
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <p className="nb-label">{t("fileMenu.encryption.actions")}</p>
                  <button
                    type="button"
                    onClick={onLock}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition hover:bg-accent/60"
                    )}
                  >
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>{t("fileMenu.encryption.lock")}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 px-6 py-10 text-center">
                <p className="text-[14px] text-foreground">{t("fileMenu.encryption.cannotLockTitle")}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">{isNew ? t("fileMenu.encryption.cannotLockNewDesc") : t("fileMenu.encryption.cannotLockEmptyDesc")}</p>
              </div>
            )}
          </div>
        )}

        {/* Lock Dialog */}
        {lockDialogOpen && (
          <AlertDialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                {lockStep === 1 && <AlertDialogTitle>{t("fileMenu.encryption.enterPassword")}</AlertDialogTitle>}
                {lockStep === 2 && <AlertDialogTitle>{t("fileMenu.encryption.confirmPassword")}</AlertDialogTitle>}
                {lockStep === 3 && <AlertDialogTitle>{t("fileMenu.encryption.warningTitle")}</AlertDialogTitle>}
                {lockStep <= 2 && (
                  <AlertDialogDescription>
                    {lockStep === 1 ? t("fileMenu.encryption.enterPasswordDesc") : t("fileMenu.encryption.confirmPasswordDesc")}
                  </AlertDialogDescription>
                )}
                {lockStep === 3 && (
                  <AlertDialogDescription>{t("fileMenu.encryption.warning")}</AlertDialogDescription>
                )}
              </AlertDialogHeader>
              {lockStep <= 2 && (
                <div className="space-y-4">
                  <input
                    type="password"
                    value={lockStep === 1 ? lockPassword : lockConfirmPassword}
                    onChange={(e) => lockStep === 1 ? setLockPassword(e.target.value) : setLockConfirmPassword(e.target.value)}
                    placeholder={lockStep === 1 ? t("fileMenu.encryption.passwordPlaceholder") : t("fileMenu.encryption.confirmPasswordPlaceholder")}
                    className="w-full h-10 px-3 rounded-md border border-border/70 bg-card/60 text-foreground outline-none focus:border-primary/40"
                    autoFocus
                  />
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setLockStep(1); setLockDialogOpen(false); }}>{t("fileMenu.encryption.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleLockConfirm}>
                  {lockStep === 1 ? t("fileMenu.encryption.next") : lockStep === 2 ? t("fileMenu.encryption.next") : t("fileMenu.encryption.lock")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Unlock Dialog */}
        {unlockDialogOpen && (
          <AlertDialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("fileMenu.encryption.enterCurrentPassword")}</AlertDialogTitle>
                <AlertDialogDescription>{t("fileMenu.encryption.enterCurrentPasswordDesc")}</AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4">
                <input
                  type="password"
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  placeholder={t("fileMenu.encryption.passwordPlaceholder")}
                  className="w-full h-10 px-3 rounded-md border border-border/70 bg-card/60 text-foreground outline-none focus:border-primary/40"
                  autoFocus
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setUnlockPassword(""); setUnlockDialogOpen(false); }}>{t("fileMenu.encryption.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleUnlockConfirm}>{t("fileMenu.encryption.unlock")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Change Password Dialog */}
        {changePasswordDialogOpen && (
          <AlertDialog open={changePasswordDialogOpen} onOpenChange={setChangePasswordDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                {changeStep === 1 && <AlertDialogTitle>{t("fileMenu.encryption.enterCurrentPassword")}</AlertDialogTitle>}
                {changeStep === 2 && <AlertDialogTitle>{t("fileMenu.encryption.enterNewPassword")}</AlertDialogTitle>}
                {changeStep === 3 && <AlertDialogTitle>{t("fileMenu.encryption.confirmNewPassword")}</AlertDialogTitle>}
                {changeStep <= 3 && (
                  <AlertDialogDescription>
                    {changeStep === 1 ? t("fileMenu.encryption.enterCurrentPasswordDesc") : changeStep === 2 ? t("fileMenu.encryption.enterNewPasswordDesc") : t("fileMenu.encryption.confirmNewPasswordDesc")}
                  </AlertDialogDescription>
                )}
              </AlertDialogHeader>
              <div className="space-y-4">
                {changeStep === 1 && (
                  <input
                    type="password"
                    value={changeCurrentPassword}
                    onChange={(e) => setChangeCurrentPassword(e.target.value)}
                    placeholder={t("fileMenu.encryption.passwordPlaceholder")}
                    className="w-full h-10 px-3 rounded-md border border-border/70 bg-card/60 text-foreground outline-none focus:border-primary/40"
                    autoFocus
                  />
                )}
                {changeStep === 2 && (
                  <input
                    type="password"
                    value={changeNewPassword}
                    onChange={(e) => setChangeNewPassword(e.target.value)}
                    placeholder={t("fileMenu.encryption.newPasswordPlaceholder")}
                    className="w-full h-10 px-3 rounded-md border border-border/70 bg-card/60 text-foreground outline-none focus:border-primary/40"
                    autoFocus
                  />
                )}
                {changeStep === 3 && (
                  <input
                    type="password"
                    value={changeConfirmPassword}
                    onChange={(e) => setChangeConfirmPassword(e.target.value)}
                    placeholder={t("fileMenu.encryption.confirmPasswordPlaceholder")}
                    className="w-full h-10 px-3 rounded-md border border-border/70 bg-card/60 text-foreground outline-none focus:border-primary/40"
                    autoFocus
                  />
                )}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setChangeStep(1); setChangePasswordDialogOpen(false); }}>{t("fileMenu.encryption.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleChangePasswordConfirm}>
                  {changeStep === 1 ? t("fileMenu.encryption.next") : changeStep === 2 ? t("fileMenu.encryption.next") : t("fileMenu.encryption.changePassword")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    );
  }

function SettingsSection({ onSettings }) {
  return (
    <div className="h-full p-4 space-y-4 overflow-y-auto">
      <h3 className="nb-label">{t("fileMenu.settings.heading")}</h3>
      <div className="space-y-2">
        <button
          type="button"
          onClick={onSettings}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition hover:bg-accent/60"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>{t("fileMenu.settings.openPage")}</span>
        </button>
      </div>
    </div>
  );
}