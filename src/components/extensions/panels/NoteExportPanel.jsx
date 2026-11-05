import { useState } from "react";
import { FileCode2, FileDown, FileText } from "lucide-react";
import PanelShell from "@/components/extensions/PanelShell";
import { exportHtml, exportMarkdown, exportPdf } from "@/lib/note-export";
import { countWords } from "@/lib/note-stats";

const FORMATS = [
  { id: "markdown", label: "Markdown", icon: FileText, run: exportMarkdown },
  { id: "html", label: "HTML", icon: FileCode2, run: exportHtml },
  { id: "pdf", label: "PDF", icon: FileDown, run: exportPdf },
];

/** Extension panel: download the open note as Markdown, HTML or PDF. */
export default function NoteExportPanel({ note }) {
  const [status, setStatus] = useState("");
  const words = countWords(note?.body || "");

  const download = (format) => {
    format.run(note || {});
    setStatus(`${format.label} downloaded`);
  };

  return (
    <PanelShell
      label="export"
      action={<span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70">{words} words</span>}
    >
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {FORMATS.map((format) => {
          const Icon = format.icon;
          return (
            <button
              key={format.id}
              type="button"
              onClick={() => download(format)}
              className="flex flex-col items-center gap-1 rounded-md border border-border/70 py-2 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            >
              <Icon className="h-3.5 w-3.5" />
              {format.label}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground/70">
        {status || "current note"}
      </p>
    </PanelShell>
  );
}