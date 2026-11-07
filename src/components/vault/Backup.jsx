import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle, Download, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportBackup, importBackup, previewBackup } from "@/lib/backup";

export default function Backup() {
  const [mode, setMode] = useState("merge");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null); // { data, counts }
  const [message, setMessage] = useState(null); // { type: "success" | "error", text }
  const fileInput = useRef(null);

  const clear = () => setMessage(null);
  const show = (type, text) => {
    setMessage({ type, text });
    setTimeout(clear, 8000);
  };

  const dateStamp = () => new Date().toISOString().slice(0, 10);

  const handleExport = async () => {
    setBusy(true);
    setMessage(null);
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
      show("success", "Backup downloaded.");
    } catch (error) {
      show("error", `Export failed: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file) => {
    setMessage(null);
    setPreview(null);
    setBusy(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const counts = await previewBackup(data, mode);
      setPreview({ data, counts });
    } catch (error) {
      show("error", `Could not read backup: ${error.message}`);
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
    setMessage(null);
    try {
      const result = await importBackup(preview.data, mode);
      const total = Object.values(result.tables).reduce((sum, t) => sum + t.imported, 0);
      const skipped = Object.values(result.tables).reduce((sum, t) => sum + t.skipped, 0);
      setPreview(null);
      show(
        "success",
        `Imported ${total} record${total === 1 ? "" : "s"}${skipped ? `, skipped ${skipped} already present` : ""}.`
      );
    } catch (error) {
      show("error", `Import failed: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const messageBox = () => {
    if (!message) return null;
    const error = message.type === "error";
    return (
      <div
        role="alert"
        aria-live="polite"
        className={`mt-4 rounded-md border p-3 text-[13px] leading-relaxed ${error ? "border-destructive/40 bg-destructive/50 text-destructive" : "border-primary/40 bg-primary/50 text-primary"}`}
      >
        {error ? (
          <AlertTriangle className="mr-2 h-4 w-4 shrink-0" />
        ) : (
          <CheckCircle className="mr-2 h-4 w-4 shrink-0" />
        )}
        {message.text}
        <button
          type="button"
          onClick={clear}
          className="ml-auto inline-block h-5 w-5 rounded-md opacity-60 hover:opacity-100"
          aria-label="Dismiss message"
        >
          ×
        </button>
      </div>
    );
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
              <th className="px-3 py-2 font-mono text-muted-foreground">Table</th>
              <th className="px-3 py-2 font-mono text-muted-foreground">In file</th>
              <th className="px-3 py-2 font-mono text-muted-foreground">Will import</th>
              <th className="px-3 py-2 font-mono text-muted-foreground">Skipped</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
          <tfoot>
            <tr className="border-t border-border/50 bg-card/20 font-medium">
              <td className="px-3 py-2">Total</td>
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
      Replace mode erases every current record before importing. This cannot be undone.
    </p>
  ) : null;

  return (
    <section className="mt-10 rounded-xl border border-border/60 bg-card/40 p-6 sm:p-8">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="nb-label">Backup</p>
          <h2 className="mt-1 font-display text-[20px] leading-tight tracking-tight">
            Export or import your whole vault
          </h2>
          <p className="mt-2 text-[12.5px] text-muted-foreground">
            One .json file with every note, canvas, table, code file, ink drawing and flashcard.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleExport} disabled={busy} className="flex items-center gap-2">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Export backup
          </Button>
          <Button onClick={handlePick} disabled={busy} className="flex items-center gap-2">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Import backup
          </Button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <label className="text-[12.5px] text-muted-foreground">On import:</label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMode("merge")}
          className={mode === "merge" ? "bg-primary text-primary-foreground" : ""}
        >
          Keep existing (merge)
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMode("replace")}
          className={mode === "replace" ? "bg-destructive text-destructive-foreground" : ""}
        >
          Replace everything
        </Button>
      </div>

      {replaceWarn}

      <input
        ref={fileInput}
        type="file"
        accept=".json"
        hidden
        onChange={handleFileInput}
      />

      {messageBox()}

      {preview ? (
        <div className="mt-5 rounded-xl border border-border/60 bg-card/40 p-5 sm:p-6">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-[13px] font-medium tracking-tight">Confirm import</h3>
            <span className="font-mono text-[11px] text-muted-foreground">
              {preview.data.exportedAt ?? "unknown date"}
            </span>
          </div>
          {countsTable()}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="flex h-9 items-center gap-1.5 rounded-md border border-border/60 bg-background px-3 font-mono text-[12px] text-muted-foreground transition hover:bg-accent"
              disabled={busy}
            >
              Cancel
            </button>
            <Button onClick={applyImport} disabled={busy}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Import"}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
