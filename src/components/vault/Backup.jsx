import { useRef, useState } from "react";
import { Download, Loader2, Upload, AlertTriangle, FolderOpen, FileText, X, SkipForward, Copy, RotateCcw, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { exportBackup, importBackup, previewBackup } from "@/lib/backup";
import { previewImport, importFilesWithOptions } from "@/lib/import";
import { success, error, info } from "@/lib/toast";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function BackupDialog({ open, onClose }) {
  const { t } = useI18n();
  const [mode, setMode] = useState("merge");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null); // { data, counts }
  const [importMode, setImportMode] = useState("backup"); // "backup" | "files" | "folder"
  const [importPreview, setImportPreview] = useState(null);
  const [importOptions, setImportOptions] = useState({ preserveFolders: true });
  const [duplicateAction, setDuplicateAction] = useState("skip"); // "skip" | "rename" | "overwrite"
  const [importProgress, setImportProgress] = useState(null); // { current, total, stage }
  const [cancelImport, setCancelImport] = useState(false);
  const fileInput = useRef(null);
  const importFileInput = useRef(null);
  const importFolderInput = useRef(null);

  const dateStamp = () => new Date().toISOString().slice(0, 10);

  const handleExport = async () => {
    setBusy(true);
    setPreview(null);
    try {
      const backup = await exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `lemonnote-backup-${dateStamp()}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      let msg = t("backup.exportSuccess");
      if (backup._fileSizeFormatted) {
        msg += ` ${t("backup.size")}: ${backup._fileSizeFormatted}.`;
        if (backup._fileSize > 50 * 1024 * 1024) {
          msg += ` ${t("backup.largeWarning")}`;
        }
      }
      success(msg);
    } catch (err) {
      error(`${t("backup.exportFailed")}: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file) => {
    setPreview(null);
    setBusy(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const counts = await previewBackup(data, mode);
      setPreview({ data, counts });
    } catch (err) {
      error(`${t("backup.readFailed")}: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handlePick = () => {
    fileInput.current?.click();
  };

  const handleFileInput = (event) => {
    const file = event.target.files?.[0] ?? null;
    if (file) handleFile(file);
    event.target.value = "";
  };

  const applyImport = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      const result = await importBackup(preview.data, mode);
      const total = Object.values(result.tables).reduce((sum, t) => sum + t.imported, 0);
      const skipped = Object.values(result.tables).reduce((sum, t) => sum + t.skipped, 0);
      setPreview(null);
      success(
        `${t("backup.imported", { count: total })}${skipped ? `, ${t("backup.skipped", { count: skipped })}` : ""}.`
      );
    } catch (err) {
      error(`${t("backup.importFailed")}: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  // --- Markdown/Folder Import ---
  const handleImportFilesPick = () => {
    importFileInput.current?.click();
  };

  const handleImportFolderPick = () => {
    importFolderInput.current?.click();
  };

  const handleImportFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    event.target.value = "";

    setBusy(true);
    try {
      const preview = await previewImport(files, {
        preserveFolderStructure: importOptions.preserveFolders
      });
      setImportPreview(preview);
      setImportMode("files");
    } catch (err) {
      error(`${t("backup.previewFailed")}: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleImportFolder = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    event.target.value = "";

    setBusy(true);
    try {
      const preview = await previewImport(files, {
        preserveFolderStructure: importOptions.preserveFolders
      });
      setImportPreview(preview);
      setImportMode("folder");
    } catch (err) {
      error(`${t("backup.previewFailed")}: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const applyFileImport = async () => {
    if (!importPreview) return;
    setBusy(true);
    setCancelImport(false);
    setImportProgress({ current: 0, total: importPreview.totalFiles, stage: "preparing" });

    // Get the files again
    const files = Array.from(importFileInput.current?.files || []);
    if (files.length === 0) {
      info(t("backup.selectFilesAgain"));
      setBusy(false);
      return;
    }

    try {
      const result = await importFilesWithOptions(files, {
        preserveFolderStructure: importOptions.preserveFolders,
        duplicateAction,
        onProgress: (update) => {
          if (update.type === "progress") {
            setImportProgress({ current: update.current, total: update.total, stage: "importing" });
          }
        },
        onCancel: () => cancelImport,
      });

      setImportPreview(null);
      setImportMode("backup");
      setImportProgress(null);

      if (result.cancelled) {
        info(`${t("backup.cancelled")} ${t("backup.imported", { count: result.imported })}, ${t("backup.skipped", { count: result.skipped })}, ${t("backup.renamed", { count: result.renamed })}, ${t("backup.overwritten", { count: result.overwritten })}.`);
        return;
      }

      const total = result.notes.length;
      const errors = result.errors.length;
      let msg = `${t("backup.imported", { count: total })}`;
      if (result.skipped) msg += `, ${t("backup.skipped", { count: result.skipped })}`;
      if (result.renamed) msg += `, ${t("backup.renamed", { count: result.renamed })}`;
      if (result.overwritten) msg += `, ${t("backup.overwritten", { count: result.overwritten })}`;
      if (errors) msg += `, ${errors} ${errors !== 1 ? t("common.errors") : t("common.error")}`;
      success(msg);

      if (errors) {
        result.errors.forEach((e) => console.error(e));
      }
    } catch (err) {
      error(`${t("backup.importFailed")}: ${err.message}`);
    } finally {
      setBusy(false);
      setImportProgress(null);
    }
  };

  const applyFolderImport = async () => {
    if (!importPreview) return;
    setBusy(true);
    setCancelImport(false);
    setImportProgress({ current: 0, total: importPreview.totalFiles, stage: "preparing" });

    // Get the files again
    const files = Array.from(importFolderInput.current?.files || []);
    if (files.length === 0) {
      info(t("backup.selectFolderAgain"));
      setBusy(false);
      return;
    }

    try {
      const result = await importFilesWithOptions(files, {
        preserveFolderStructure: importOptions.preserveFolders,
        duplicateAction,
        onProgress: (update) => {
          if (update.type === "progress") {
            setImportProgress({ current: update.current, total: update.total, stage: "importing" });
          }
        },
        onCancel: () => cancelImport,
      });

      setImportPreview(null);
      setImportMode("backup");
      setImportProgress(null);

      if (result.cancelled) {
        info(`${t("backup.cancelled")} ${t("backup.imported", { count: result.imported })}, ${t("backup.skipped", { count: result.skipped })}, ${t("backup.renamed", { count: result.renamed })}, ${t("backup.overwritten", { count: result.overwritten })}.`);
        return;
      }

      const total = result.notes.length;
      const errors = result.errors.length;
      let msg = `${t("backup.imported", { count: total })}`;
      if (result.skipped) msg += `, ${t("backup.skipped", { count: result.skipped })}`;
      if (result.renamed) msg += `, ${t("backup.renamed", { count: result.renamed })}`;
      if (result.overwritten) msg += `, ${t("backup.overwritten", { count: result.overwritten })}`;
      if (errors) msg += `, ${errors} ${errors !== 1 ? t("common.errors") : t("common.error")}`;
      success(msg);

      if (errors) {
        result.errors.forEach((e) => console.error(e));
      }
    } catch (err) {
      error(`${t("backup.importFailed")}: ${err.message}`);
    } finally {
      setBusy(false);
      setImportProgress(null);
    }
  };

  const countsTable = () => {
    if (!preview) return null;
    const rows = Object.entries(preview.tables).map(([name, table]) => (
      <tr key={name}>
        <td className="px-3 py-2 text-[12px] font-mono text-muted-foreground">{name}</td>
        <td className="px-3 py-2 text-[12px] font-mono text-foreground">{table.incoming}</td>
        <td className="px-3 py-2 text-[12px] font-mono text-foreground">{table.imported}</td>
        <td className="px-3 py-2 text-[12px] font-mono text-muted-foreground">{table.skipped}</td>
      </tr>
    ));
    const totalIn = Object.values(preview.tables).reduce((sum, t) => sum + t.incoming, 0);
    const totalIm = Object.values(preview.tables).reduce((sum, t) => sum + t.imported, 0);
    const totalSk = Object.values(preview.tables).reduce((sum, t) => sum + t.skipped, 0);
    return (
      <div className="mt-4 rounded-xl border border-border/60 bg-card/50 overflow-hidden">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="border-b border-border/50 bg-background/30">
              <th className="px-3 py-2 font-mono text-muted-foreground">{t("backup.table")}</th>
              <th className="px-3 py-2 font-mono text-muted-foreground">{t("backup.inFile")}</th>
              <th className="px-3 py-2 font-mono text-muted-foreground">{t("backup.willImport")}</th>
              <th className="px-3 py-2 font-mono text-muted-foreground">{t("backup.skipped")}</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
          <tfoot>
            <tr className="border-t border-border/50 bg-card/20 font-medium">
              <td className="px-3 py-2">{t("common.total")}</td>
              <td className="px-3 py-2">{totalIn}</td>
              <td className="px-3 py-2">{totalIm}</td>
              <td className="px-3 py-2">{totalSk}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  const replaceWarn = mode === "replace" ? (
    <p className="mt-3 text-[12px] text-destructive">
      {t("backup.replaceWarning")}
    </p>
  ) : null;

  const sizeWarn = preview?.data?._fileSizeFormatted ? (
    <div className="mt-3 flex items-center gap-2 text-[12px] text-amber-600 dark:text-amber-400">
      <AlertTriangle className="h-3.5 w-3.5" />
      <span>{t("backup.attachmentsWarning", { size: preview.data._fileSizeFormatted })}</span>
    </div>
  ) : null;

  // Import preview UI for markdown/files
  const importPreviewUI = () => {
    if (!importPreview) return null;
    const isFolder = importMode === "folder";
    const notesWithErrors = importPreview.notes.filter((n) => n.error).length;
    const notesToImport = importPreview.notes.filter((n) => !n.error).length;
    const folders = importPreview.folders.length;

    // Calculate duplicate counts
    const duplicates = importPreview.notes.filter((n) => n.isDuplicate).length;
    const newNotes = importPreview.notes.filter((n) => !n.error && !n.isDuplicate).length;

    // Show progress bar during import
    if (importProgress && busy) {
      const progressPercent = importProgress.total > 0 ? Math.round((importProgress.current / importProgress.total) * 100) : 0;
      return (
        <div className="mt-5 rounded-xl border border-border/60 bg-card/40 p-5 sm:p-6">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-[13px] font-medium tracking-tight">{t("backup.importing")}</h3>
          </div>
          <div className="grid gap-2 text-[12px] mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("backup.stage")}:</span>
              <span className="font-mono capitalize">{importProgress.stage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("backup.progress")}:</span>
              <span className="font-mono">{importProgress.current} / {importProgress.total}</span>
            </div>
          </div>
          <div className="w-full bg-background/50 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setCancelImport(true)} disabled={busy}>
              <X className="h-3.5 w-3.5 mr-1" />
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-5 rounded-xl border border-border/60 bg-card/40 p-5 sm:p-6">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-[13px] font-medium tracking-tight">
            {isFolder ? t("backup.confirmFolderImport") : t("backup.confirmFileImport")}
          </h3>
        </div>
        <div className="grid gap-2 text-[12px] mb-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("backup.filesFound")}:</span>
            <span className="font-mono">{importPreview.totalFiles}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("backup.notesToImport")}:</span>
            <span className="font-mono">{notesToImport}</span>
          </div>
          {duplicates > 0 && (
            <div className="flex justify-between text-amber-600">
              <span className="text-muted-foreground">{t("backup.duplicatesFound")}:</span>
              <span className="font-mono">{duplicates}</span>
            </div>
          )}
          {notesWithErrors > 0 && (
            <div className="flex justify-between text-destructive">
              <span className="text-muted-foreground">{t("common.errors")}:</span>
              <span className="font-mono">{notesWithErrors}</span>
            </div>
          )}
          {folders > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("backup.folders")}:</span>
              <span className="font-mono">{folders}</span>
            </div>
          )}
        </div>

        {/* Duplicate action selection */}
        <div className="mb-4 p-3 rounded-lg bg-background/50 border border-border/50">
          <label className="block text-[12px] font-medium text-muted-foreground mb-2">
            {t("backup.duplicateAction")}
          </label>
          <div className="flex flex-wrap gap-2">
            <label className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md border transition cursor-pointer",
              duplicateAction === "skip" ? "bg-primary/10 border-primary text-primary" : "bg-background/50 border-border/50 text-foreground hover:bg-accent"
            )}>
              <input
                type="radio"
                name="duplicateAction"
                value="skip"
                checked={duplicateAction === "skip"}
                onChange={(e) => setDuplicateAction(e.target.value)}
                className="h-3.5 w-3.5 text-primary focus:ring-2 focus:ring-primary/20"
              />
              <SkipForward className="h-3.5 w-3.5" />
              <span>{t("backup.skip")}</span>
            </label>
            <label className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md border transition cursor-pointer",
              duplicateAction === "rename" ? "bg-primary/10 border-primary text-primary" : "bg-background/50 border-border/50 text-foreground hover:bg-accent"
            )}>
              <input
                type="radio"
                name="duplicateAction"
                value="rename"
                checked={duplicateAction === "rename"}
                onChange={(e) => setDuplicateAction(e.target.value)}
                className="h-3.5 w-3.5 text-primary focus:ring-2 focus:ring-primary/20"
              />
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t("backup.rename")}</span>
            </label>
            <label className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md border transition cursor-pointer",
              duplicateAction === "overwrite" ? "bg-primary/10 border-primary text-primary" : "bg-background/50 border-border/50 text-foreground hover:bg-accent"
            )}>
              <input
                type="radio"
                name="duplicateAction"
                value="overwrite"
                checked={duplicateAction === "overwrite"}
                onChange={(e) => setDuplicateAction(e.target.value)}
                className="h-3.5 w-3.5 text-primary focus:ring-2 focus:ring-primary/20"
              />
              <Copy className="h-3.5 w-3.5" />
              <span>{t("backup.overwrite")}</span>
            </label>
          </div>
        </div>

        {importPreview.notes.slice(0, 10).map((note, i) => (
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
                {note.isDuplicate && <span className="text-amber-600 text-[10px] bg-amber-100/50 px-1 rounded">{t("backup.duplicate")}</span>}
                {note.folder && <span className="text-muted-foreground">→ {note.folder}</span>}
                {note.tags.length > 0 && <span className="text-primary">#{note.tags.join(" #")}</span>}
                {note.embedCount > 0 && <span className="text-amber-600">🖼 {note.embedCount}</span>}
              </>
            )}
          </div>
        ))}
        {importPreview.notes.length > 10 && (
          <p className="text-[11px] text-muted-foreground mt-2">{t("backup.andMore", { count: importPreview.notes.length - 10 })}</p>
        )}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <label className="flex items-center gap-2 text-[12px] cursor-pointer">
            <input
              type="checkbox"
              checked={importOptions.preserveFolders}
              onChange={(e) => setImportOptions({ ...importOptions, preserveFolders: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-border/80 bg-card/60 text-primary focus:ring-2 focus:ring-primary/20"
            />
            {t("backup.preserveFolders")}
          </label>
          <button
            type="button"
            onClick={() => { setImportPreview(null); setImportMode("backup"); }}
            className="flex h-9 items-center gap-1.5 rounded-md border border-border/60 bg-background px-3 font-mono text-[12px] text-muted-foreground transition hover:bg-accent"
            disabled={busy}
          >
            {t("common.cancel")}
          </button>
          <Button onClick={() => {
            if (isFolder) {
              importFolderInput.current?.click();
            } else {
              importFileInput.current?.click();
            }
          }} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("common.import")}
          </Button>
        </div>
      </div>
    );
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent maxWidth="max-w-[32rem]">
        {/* Header */}
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-primary" />
              <DialogTitle className="font-display text-[18px] leading-tight tracking-tight">{t("backup.title")}</DialogTitle>
            </div>
            <DialogClose className="p-1 rounded hover:bg-accent transition" aria-label={t("common.close")}>
              <X className="h-4 w-4" />
            </DialogClose>
          </div>
          <DialogDescription className="text-[12.5px]">{t("backup.desc")}</DialogDescription>
        </DialogHeader>

        {/* Body - scrollable */}
        <DialogBody className="pt-3 pb-0">
          <div className="space-y-6">
            {/* Whole vault section */}
            <section>
              <p className="nb-label">{t("backup.wholeVault")}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2" style={{ minWidth: 0 }}>
                <Button onClick={handleExport} disabled={busy} className="flex items-center gap-2 justify-center w-full">
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  {t("backup.exportBackup")}
                </Button>
                <Button onClick={handlePick} disabled={busy} className="flex items-center gap-2 justify-center w-full">
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {t("backup.importBackup")}
                </Button>
              </div>
            </section>

            <Separator className="my-4" />

            {/* Import files section */}
            <section>
              <p className="nb-label">{t("backup.importFiles")}</p>
              <h3 className="mt-1 font-display text-[16px] leading-tight tracking-tight">{t("backup.importMarkdown")}</h3>
              <p className="mt-2 text-[12.5px] text-muted-foreground">{t("backup.importMarkdownDesc")}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2" style={{ minWidth: 0 }}>
                <Button onClick={handleImportFilesPick} disabled={busy} className="flex items-center gap-2 justify-center w-full">
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                  {t("backup.importFilesBtn")}
                </Button>
                <Button onClick={handleImportFolderPick} disabled={busy} className="flex items-center gap-2 justify-center w-full">
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FolderOpen className="h-3.5 w-3.5" />}
                  {t("backup.importFolderBtn")}
                </Button>
              </div>

              {/* Import options - only show after file/folder selected */}
              {(importMode === "files" || importMode === "folder") && (
                <>
                  <div className="mt-4 flex items-center gap-2">
                    <label className="flex items-center gap-2 text-[12.5px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={importOptions.preserveFolders}
                        onChange={(e) => setImportOptions({ ...importOptions, preserveFolders: e.target.checked })}
                        className="h-3.5 w-3.5 rounded border-border/80 bg-card/60 text-primary focus:ring-2 focus:ring-primary/20"
                      />
                      {t("backup.preserveFolders")}
                    </label>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
                    <label className="text-[12.5px] text-muted-foreground">{t("backup.onImport")}:</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMode("merge")}
                      className={cn(mode === "merge" && "bg-primary text-primary-foreground")}
                    >
                      {t("backup.keepExisting")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMode("replace")}
                      className={cn(mode === "replace" && "bg-destructive text-destructive-foreground")}
                    >
                      {t("backup.replaceEverything")}
                    </Button>
                  </div>

                  {replaceWarn}
                </>
              )}
            </section>
          </div>

          {/* Backup import preview (when a .json backup file is selected) */}
          {preview && (
            <div className="mt-5 rounded-xl border border-border/60 bg-card/40 p-5 sm:p-6">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-[13px] font-medium tracking-tight">{t("backup.confirmImport")}</h3>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {preview.data.exportedAt ?? t("common.unknownDate")}
                </span>
              </div>
              {sizeWarn}
              {countsTable()}
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="flex h-9 items-center gap-1.5 rounded-md border border-border/60 bg-background px-3 font-mono text-[12px] text-muted-foreground transition hover:bg-accent"
                  disabled={busy}
                >
                  {t("common.cancel")}
                </button>
                <Button onClick={applyImport} disabled={busy} className="flex-1 sm:flex-none">
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("common.import")}
                </Button>
              </div>
            </div>
          )}

          {/* Markdown/Folder import preview */}
          {importPreviewUI()}
        </DialogBody>

        {/* Footer */}
        <DialogFooter className="border-t border-border pt-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-3 py-1.5 rounded-md border border-border/70 text-[11px] font-mono hover:bg-accent transition"
          >
            {t("common.close")}
          </button>
        </DialogFooter>

        {/* Hidden file inputs */}
        <input
          ref={fileInput}
          type="file"
          accept=".json"
          hidden
          onChange={handleFileInput}
        />
        <input
          ref={importFileInput}
          type="file"
          accept=".md,.markdown,.txt"
          multiple
          hidden
          onChange={handleImportFiles}
        />
        <input
          ref={importFolderInput}
          type="file"
          accept=".md,.markdown,.txt"
          multiple
          webkitdirectory
          hidden
          onChange={handleImportFolder}
        />
      </DialogContent>
    </Dialog>
  );
}