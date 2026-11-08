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
} from "lucide-react";
import { db } from "@/api/localDb";
import { toast } from "@/lib/toast";
import { backlinksFor, plainText } from "@/lib/vault";
import { exportMarkdown, exportHtml, exportPdf } from "@/lib/note-export";
import { cn } from "@/lib/utils";

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

export function FilePanel({ note, onClose, isNew }) {
  const [activeSection, setActiveSection] = useState("info");
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [newTemplateBody, setNewTemplateBody] = useState("");
  const [newTemplateName, setNewTemplateName] = useState("");

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
      // For new notes, just fill the editor
      onClose();
      // The parent NotePage will handle this via a callback
      if (window.__applyTemplate) window.__applyTemplate(template);
    } else {
      // For existing notes, we'd need to confirm replacement
      if (confirm(`Replace current note with "${template.name}"? This cannot be undone.`)) {
        onClose();
        if (window.__applyTemplate) window.__applyTemplate(template);
      }
    }
  };

  const deleteTemplate = async (template) => {
    if (template.isBuiltin) {
      toast.error("Built-in templates cannot be deleted.");
      return;
    }
    if (!confirm(`Delete template "${template.name}"?`)) return;
    try {
      await db.entities.Template.delete(template.id);
      toast.success(`Deleted "${template.name}".`);
      loadTemplates();
    } catch (err) {
      toast.error(`Failed to delete: ${err.message}`);
    }
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
      toast.success(`Exported as ${format.toUpperCase()}.`);
    } catch (err) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  const openSettings = () => {
    onClose();
    window.location.href = "/settings";
  };

  // Compute info data
  const createdDate = note?.created_date ? new Date(note.created_date).toLocaleString() : "—";
  const modifiedDate = note?.updated_date ? new Date(note.updated_date).toLocaleString() : "—";
  const sizeKB = note?.body ? ((new Blob([note.body]).size) / 1024).toFixed(1) : "0";
  const wordCount = note?.body ? plainText(note.body).split(/\s+/).filter(Boolean).length : 0;
  const charCount = note?.body ? note.body.length : 0;
  const backlinksCount = note?.title && note?.body ? backlinksFor(note, []).length : 0; // We can't get all notes here easily
  const tagsList = note?.tags?.length ? note.tags.join(", ") : "—";
  const noteId = note?.id || "—";

  const sections = [
    { id: "info", label: "Info", icon: Info },
    { id: "new", label: "New", icon: FilePlus },
    { id: "templates", label: "Templates", icon: FileText },
    { id: "print-export", label: "Print / Export", icon: Printer },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Render as a portal to body for proper overlay
  const panelContent = (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="File menu">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className="relative flex flex-col w-full max-w-sm bg-card border-r border-border/70 shadow-xl animate-in slide-in-from-left-2 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-medium text-[14px]">File</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-accent transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1" role="navigation" aria-label="File sections">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition",
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

        {/* Footer hint */}
        <div className="border-t border-border/60 px-3 py-2">
          <p className="font-mono text-[10px] text-muted-foreground/70">
            Share — coming in P20
          </p>
        </div>
      </div>

      {/* Section content panels */}
      <div className="fixed inset-y-0 left-[22rem] z-40 w-[calc(100%-22rem)] bg-background border-l border-border/70 animate-in fade-in duration-200">
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
          />
        )}
        {activeSection === "settings" && (
          <SettingsSection onSettings={openSettings} />
        )}
      </div>
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
    { label: "Created", value: createdDate, icon: Clock },
    { label: "Modified", value: modifiedDate, icon: Clock },
    { label: "Size", value: `${sizeKB} KB`, icon: Scale },
    { label: "Words", value: wordCount.toLocaleString(), icon: Hash },
    { label: "Characters", value: charCount.toLocaleString(), icon: Hash },
    { label: "Backlinks", value: backlinksCount.toString(), icon: Link2 },
    { label: "Tags", value: tagsList, icon: Tag },
    { label: "Note ID", value: noteId, icon: FileText },
  ];
  return (
    <div className="h-full p-4 space-y-1 overflow-y-auto">
      <h3 className="nb-label">Info</h3>
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
              {row.label === "Note ID" && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(noteId);
                    toast.success("Note ID copied.");
                  }}
                  className="p-1 rounded hover:bg-accent transition opacity-60 hover:opacity-100"
                  aria-label="Copy note ID"
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
  const userTemplates = templates.filter((t) => !t.isBuiltin);
  const builtinTemplates = templates.filter((t) => t.isBuiltin);
  return (
    <div className="h-full p-4 space-y-4 overflow-y-auto">
      <h3 className="nb-label">New note</h3>
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onCreate({ name: "Blank note", body: "", tags: [] })}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-accent/60"
          )}
        >
          <Plus className="h-4 w-4 shrink-0 text-primary" />
          <span>Blank note</span>
        </button>
      </div>
      {builtinTemplates.length > 0 && (
        <div className="space-y-2">
          <p className="nb-label">From template (built-in)</p>
          <div className="space-y-1">
            {builtinTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onCreate(template)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition hover:bg-accent/60"
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
          <p className="nb-label">From template (yours)</p>
          <div className="space-y-1">
            {userTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onCreate(template)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition hover:bg-accent/60"
                )}
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                {template.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {loading && <p className="text-center text-[12px] text-muted-foreground">Loading templates…</p>}
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
  onSaveRename,
  onCancelRename,
  loading,
}) {
  const userTemplates = templates.filter((t) => !t.isBuiltin);
  return (
    <div className="h-full p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="nb-label">Templates</h3>
        <button
          type="button"
          onClick={onSaveAsTemplate}
          disabled={saving}
          className="flex h-8 items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 font-mono text-[10.5px] text-primary transition hover:bg-primary/15"
        >
          <Save className="h-3.5 w-3.5" />
          Save current as template
        </button>
      </div>

      {loading ? (
        <p className="text-center text-[12px] text-muted-foreground">Loading…</p>
      ) : userTemplates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 px-6 py-10 text-center">
          <p className="text-[14px] text-foreground">No custom templates yet.</p>
          <p className="mt-1 text-[12px] text-muted-foreground">Save the current note as a template to get started.</p>
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
                  <button type="button" onClick={() => onSaveRename(template)} className="p-1.5 text-primary hover:bg-primary/10 rounded" aria-label="Save"><Save className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={onCancelRename} className="p-1.5 text-muted-foreground hover:bg-accent rounded" aria-label="Cancel"><X className="h-3.5 w-3.5" /></button>
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
                  <button type="button" onClick={() => onRename(template)} className="p-1.5 rounded hover:bg-accent transition opacity-60 hover:opacity-100" aria-label="Rename"><Edit2 className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => onDelete(template)} className="p-1.5 rounded hover:bg-accent transition opacity-60 hover:opacity-100 text-destructive" aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PrintExportSection({ onPrint, onExport, onSettings }) {
  return (
    <div className="h-full p-4 space-y-4 overflow-y-auto">
      <h3 className="nb-label">Print / Export</h3>
      <div className="space-y-2">
        <button
          type="button"
          onClick={onPrint}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-accent/60"
          )}
        >
          <Printer className="h-4 w-4 shrink-0" />
          <span>Print (clean style)</span>
        </button>
        <button
          type="button"
          onClick={() => onExport("markdown")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-accent/60"
          )}
        >
          <Download className="h-4 w-4 shrink-0" />
          <span>Export as Markdown (.md)</span>
        </button>
        <button
          type="button"
          onClick={() => onExport("html")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-accent/60"
          )}
        >
          <Download className="h-4 w-4 shrink-0" />
          <span>Export as HTML (.html)</span>
        </button>
        <button
          type="button"
          onClick={() => onExport("pdf")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-accent/60"
          )}
        >
          <Download className="h-4 w-4 shrink-0" />
          <span>Export as PDF (.pdf)</span>
        </button>
      </div>
      <div className="pt-2 border-t border-border/60">
        <p className="nb-label">App</p>
        <button
          type="button"
          onClick={onSettings}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-accent/60"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>Open Settings</span>
        </button>
      </div>
      <div className="pt-2 border-t border-border/60 text-center">
        <p className="text-[12px] text-muted-foreground">
          Share — coming in P20
        </p>
      </div>
    </div>
  );
}

function SettingsSection({ onSettings }) {
  return (
    <div className="h-full p-4 space-y-4 overflow-y-auto">
      <h3 className="nb-label">Settings</h3>
      <div className="space-y-2">
        <button
          type="button"
          onClick={onSettings}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-accent/60"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>Open Settings page</span>
        </button>
      </div>
      <div className="pt-2 border-t border-border/60 text-center">
        <p className="text-[12px] text-muted-foreground">
          Share — coming in P20
        </p>
      </div>
    </div>
  );
}