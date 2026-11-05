import { useEffect, useState } from "react";
import { pluginLog, subscribePluginLog } from "@/lib/extensions";
import { cn } from "@/lib/utils";

const clock = (at) =>
  new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

export default function ExtensionEvents({ limit = 8 }) {
  const [entries, setEntries] = useState(() => pluginLog());

  useEffect(() => subscribePluginLog(() => setEntries(pluginLog())), []);

  const rows = entries.slice(0, limit);

  return (
    <div>
      {rows.length === 0 ? (
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          Nothing yet. Move between tabs or save a note and the stream appears here.
        </p>
      ) : (
        <ul className="mt-2 space-y-1">
          {rows.map((entry) => (
            <li key={entry.id} className="font-mono text-[10.5px] leading-relaxed">
              <div className="flex items-baseline gap-2">
                <span className="w-[54px] shrink-0 text-muted-foreground/60">{clock(entry.at)}</span>
                <span
                  className={cn(
                    "w-[62px] shrink-0 uppercase tracking-[0.1em]",
                    entry.ok ? "text-muted-foreground" : "text-destructive"
                  )}
                >
                  {entry.type}
                </span>
                <span className="min-w-0 flex-1 truncate text-foreground/85">
                  {entry.name}
                  {entry.detail ? ` · ${entry.detail}` : ""}
                  {entry.error ? ` · ${entry.error}` : ""}
                </span>
                <span className="shrink-0 text-muted-foreground/60">
                  {entry.pluginId || (entry.handled != null ? `${entry.handled} sub` : "")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}