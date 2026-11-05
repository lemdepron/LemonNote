import { useEffect, useState } from "react";
import PanelShell from "@/components/extensions/PanelShell";
import { readPref, subscribePrefs } from "@/lib/preferences";
import { spaceById } from "@/lib/spaces";

/** Extension panel: the tab visit counts Space pulse keeps, on screen rather than in the log. */
export default function SpacePulsePanel() {
  const [, setTick] = useState(0);

  useEffect(() => subscribePrefs(() => setTick((value) => value + 1)), []);

  const visits = readPref("plugin:space-pulse:visits", {}) || {};
  const last = readPref("plugin:space-pulse:last", null);
  const rows = Object.entries(visits).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((sum, [, count]) => sum + count, 0);
  const label = (id) => spaceById(id)?.label || (id === "none" ? "no tab" : id);
  const peak = rows.length ? rows[0][1] : 0;

  return (
    <PanelShell
      label="space pulse"
      action={
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70">{total} visits</span>
      }
    >
      <p className="mt-2 text-[12px] text-muted-foreground">
        Last tab: <span className="text-foreground">{last ? label(last) : "—"}</span>
      </p>
      {rows.length === 0 ? (
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">Move between tabs to start counting.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {rows.slice(0, 5).map(([id, count]) => (
            <li key={id} className="flex items-center gap-2">
              <span className="w-16 shrink-0 truncate font-mono text-[10px] text-foreground/80">{label(id)}</span>
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary/70"
                  style={{ width: `${peak ? Math.round((count / peak) * 100) : 0}%` }}
                />
              </span>
              <span className="w-5 shrink-0 text-right font-mono text-[10px] text-muted-foreground">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}