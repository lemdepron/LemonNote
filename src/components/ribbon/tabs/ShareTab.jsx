import { 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Printer, 
  Mail, 
  Link2, 
  Archive, 
  Copy, 
  Clipboard,
  Shield,
  FileX
} from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import { Btn, useRibbon } from "@/components/ribbon/RibbonKit";
import { copyText } from "@/lib/editor-bridge";
import { 
  exportMarkdown, 
  exportHtml, 
  exportPdf, 
  exportPlainText, 
  copyAsRichText, 
  printNote, 
  createEmailLink,
  exportAllNotesAsZip 
} from "@/lib/note-export";
import { exportBackup } from "@/lib/backup";
import { tableAt } from "@/lib/ribbon-actions";
import { exportTableToXlsx, exportTableToCsv, downloadBlob } from "@/lib/table-import-export";
import { toast } from "@/lib/toast";

export function ShareTab() {
  const { body, noteId, noteTitle, typography, selection, value } = useRibbon();

  const note = { 
    title: noteTitle, 
    body, 
    style: typography,
    tags: [] // tags not available in ribbon context, could be added if needed
  };

  const inTable = Boolean(tableAt(value, selection.start));

  const handleExport = async (fn, label) => {
    try {
      fn(note);
      toast.success(`Exported as ${label}.`);
    } catch (err) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  const handleCopy = async (fn, label) => {
    try {
      const result = await fn(note);
      if (result === false) {
        toast.info(`Copied as ${label} (rich text not supported, fell back to plain text).`);
      } else {
        toast.success(`Copied as ${label}.`);
      }
    } catch (err) {
      toast.error(`Copy failed: ${err.message}`);
    }
  };

  const handlePrint = () => {
    try {
      printNote(note);
      toast.success("Print dialog opened.");
    } catch (err) {
      toast.error(`Print failed: ${err.message}`);
    }
  };

  const handleEmail = () => {
    try {
      const mailto = createEmailLink(note);
      window.location.href = mailto;
      toast.success("Email client opened.");
    } catch (err) {
      toast.error(`Email failed: ${err.message}`);
    }
  };

  const handleExportAllNotes = async () => {
    try {
      const result = await exportAllNotesAsZip();
      if (result.success) {
        toast.success(`Exported ${result.count} note${result.count !== 1 ? "s" : ""} as zip.`);
      } else {
        toast.info(result.message);
      }
    } catch (err) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  const handleBackupExport = async () => {
    try {
      const backup = await exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      anchor.href = url;
      anchor.download = `lemonnote-backup-${date}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      
      let msg = "Backup exported.";
      if (backup._fileSizeFormatted) {
        msg += ` Size: ${backup._fileSizeFormatted}.`;
        if (backup._fileSize > 50 * 1024 * 1024) {
          msg += " Large backup — consider using a dedicated backup tool.";
        }
      }
      toast.success(msg);
    } catch (err) {
      toast.error(`Backup export failed: ${err.message}`);
    }
  };

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
    <>
      <RibbonGroup label="Copy note">
        <Btn 
          id="share.copyMarkdown" 
          icon={FileText} 
          label="As Markdown" 
          hint="Copy the whole note as Markdown" 
          onClick={() => copyText(body)} 
        />
        <Btn 
          id="share.copyPlainText" 
          icon={Clipboard} 
          label="As plain text" 
          hint="Copy the note without markdown symbols" 
          onClick={() => copyText(
            body
              .replace(/<\/?[a-z][^>]*>/gi, "")
              .replace(/^#{1,6}\s+/gm, "")
              .replace(/(\*\*|__|~~|`)/g, "")
              .replace(/\[\[([^\]]+)\]\]/g, "$1")
              .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
          )} 
        />
        <Btn 
          id="share.copyRichText" 
          icon={Copy} 
          label="As rich text" 
          hint="Copy formatted note for Word, email, etc." 
          onClick={() => handleCopy(copyAsRichText, "rich text")} 
        />
      </RibbonGroup>

      <RibbonGroup label="Export this note">
        <Btn 
          id="share.exportMarkdown" 
          icon={FileText} 
          label="Markdown (.md)" 
          hint="Export as Markdown file" 
          onClick={() => handleExport(exportMarkdown, "Markdown")} 
        />
        <Btn 
          id="share.exportHtml" 
          icon={FileCode} 
          label="HTML (.html)" 
          hint="Export as standalone HTML file" 
          onClick={() => handleExport(exportHtml, "HTML")} 
        />
        <Btn 
          id="share.exportPdf" 
          icon={FileSpreadsheet} 
          label="PDF (.pdf)" 
          hint="Export as PDF using note's page settings" 
          onClick={() => handleExport(exportPdf, "PDF")} 
        />
        <Btn 
          id="share.exportPlainText" 
          icon={Clipboard} 
          label="Plain text (.txt)" 
          hint="Export as plain text file" 
          onClick={() => handleExport(exportPlainText, "plain text")} 
        />
        {inTable && (
          <>
            <Btn 
              id="share.exportTableXlsx" 
              icon={FileX} 
              label="Table as Excel (.xlsx)" 
              hint="Export the table at cursor as Excel file" 
              onClick={() => handleExportTable("xlsx")} 
            />
            <Btn 
              id="share.exportTableCsv" 
              icon={FileSpreadsheet} 
              label="Table as CSV (.csv)" 
              hint="Export the table at cursor as CSV file" 
              onClick={() => handleExportTable("csv")} 
            />
          </>
        )}
      </RibbonGroup>

      <RibbonGroup label="Share & print">
        <Btn 
          id="share.print" 
          icon={Printer} 
          label="Print" 
          hint="Open print dialog for this note" 
          onClick={handlePrint} 
        />
        <Btn 
          id="share.email" 
          icon={Mail} 
          label="Email this note" 
          hint="Open email client with note as body (size warning if large)" 
          onClick={handleEmail} 
        />
        <Btn 
          id="share.link" 
          icon={Link2} 
          label="Share by link" 
          hint="Sharing by link comes with Sync (not available yet)" 
          onClick={() => toast.info("Sharing by link comes with Sync.")} 
          disabled 
        />
      </RibbonGroup>

      <RibbonGroup label="Vault">
        <Btn 
          id="share.exportAllNotes" 
          icon={Archive} 
          label="All notes as zip" 
          hint="Export every note as a zip of .md files" 
          onClick={handleExportAllNotes} 
        />
        <Btn 
          id="share.exportBackup" 
          icon={Shield} 
          label="Full backup (.json)" 
          hint="Export complete vault backup (notes, canvas, ink, attachments, etc.)" 
          onClick={handleBackupExport} 
        />
      </RibbonGroup>
    </>
  );
}