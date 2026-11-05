import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw } from "lucide-react";
import PanelShell from "@/components/extensions/PanelShell";
import { listSnapshots, pushSnapshot, SNAPSHOT_INTERVAL } from "@/lib/version-history";
import { relativeTime } from "@/lib/vault";

/** Extension panel: snapshots the open note every five minutes of editing. */
export default function VersionHistoryPanel({ note, onEditBody }) {
  const [snapshots, setSnapshots] = useState(() => listSnapshots(note?.id));
  const [status, setStatus] = useState("");
  const latest = useRef(note);
  latest.current = note;

  useEffect(() => {
    setSnapshots(listSnapshots(note?.id));
    setStatus("");
  }, [note?.id]);

  useEffect(() => {
    if (!note?.id) return undefined;
    const timer = setInterval(() => {
      const next = pushSnapshot(latest.current);
      setSnapshots(next);
      setStatus("auto-snapshot saved");
    }, SNAPSHOT_INTERVAL);
    return () => clearInterval(timer);
  }, [note?.id]);

  const capture = () => {
    if (!note?.id) {
      setStatus("save the note first");
      return;
    }
    setSnapshots(pushSnapshot(latest.current));
    setStatus("snapshot saved");
  };

  const restore = (snapshot) => {
    onEditBody?.(snapshot.body);
    setStatus(`restored ${relativeTime(snapshot.at)}`);
  };

  return (
    <PanelShell
      label="version history"
      action={
        <button
          type="button"
          onClick={capture}
          className="flex items-center gap-1 rounded border border-border/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <Camera className="h-2.5 w-2.5" /> now
        </button>
      }
    >
      {snapshots.length === 0 ? (
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          No snapshots yet. One is taken every 5 minutes while you edit.
        </p>
      ) : (
        <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-0.5">
          {snapshots.map((snapshot) => (
            <li key={snapshot.at} className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-accent/50">
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[10.5px] text-foreground/85">{relativeTime(snapshot.at)}</p>
                <p className="font-mono text-[9.5px] text-muted-foreground">{snapshot.words} words</p>
              </div>
              <button
                type="button"
                onClick={() => restore(snapshot)}
                aria-label={`Restore snapshot from ${relativeTime(snapshot.at)}`}
                className="flex items-center gap-1 rounded border border-border/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground transition hover:border-primary/40 hover:text-primary"
              >
                <RotateCcw className="h-2.5 w-2.5" /> restore
              </button>
            </li>
          ))}
        </ul>
      )}
      {status && (
        <p className="mt-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground/80">{status}</p>
      )}
    </PanelShell>
  );
}