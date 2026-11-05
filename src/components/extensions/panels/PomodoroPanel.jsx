import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import PanelShell from "@/components/extensions/PanelShell";
import { cn } from "@/lib/utils";

const PHASES = {
  focus: { label: "focus", seconds: 25 * 60 },
  break: { label: "break", seconds: 5 * 60 },
};

const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

function chime() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const context = new AudioCtx();
  const start = context.currentTime;
  [880, 1174].forEach((frequency, index) => {
    const at = start + index * 0.24;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.22, at + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.55);
  });
  setTimeout(() => context.close(), 1600);
}

/** Extension panel: a 25/5 focus timer that chimes when a session ends. */
export default function PomodoroPanel() {
  const [phase, setPhase] = useState("focus");
  const [left, setLeft] = useState(PHASES.focus.seconds);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(0);

  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (left > 0) return;
    setRunning(false);
    chime();
    setFinished((value) => value + 1);
    const next = phase === "focus" ? "break" : "focus";
    setPhase(next);
    setLeft(PHASES[next].seconds);
  }, [left, phase]);

  const switchPhase = (next) => {
    setPhase(next);
    setLeft(PHASES[next].seconds);
    setRunning(false);
  };

  const reset = () => {
    setLeft(PHASES[phase].seconds);
    setRunning(false);
  };

  const total = PHASES[phase].seconds;
  const pct = Math.round(((total - left) / total) * 100);

  return (
    <PanelShell
      label="pomodoro"
      action={
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70">
          {finished} done
        </span>
      }
    >
      <div className="mt-2 flex items-center gap-1">
        {Object.entries(PHASES).map(([id, meta]) => (
          <button
            key={id}
            type="button"
            onClick={() => switchPhase(id)}
            aria-pressed={phase === id}
            className={cn(
              "h-6 rounded border px-2 font-mono text-[9px] uppercase tracking-[0.12em] transition",
              phase === id
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/70 text-muted-foreground hover:text-foreground"
            )}
          >
            {meta.label} {meta.seconds / 60}
          </button>
        ))}
        <Timer className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <p className="mt-2 font-mono text-[26px] leading-none tracking-tight text-foreground">{clock(left)}</p>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2.5 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setRunning((value) => !value)}
          aria-label={running ? "Pause timer" : "Start timer"}
          className="flex h-7 items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2.5 text-[11.5px] text-primary transition hover:bg-primary/15"
        >
          {running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {running ? "Pause" : "Start"}
        </button>
        <button
          type="button"
          onClick={reset}
          aria-label="Reset timer"
          className="flex h-7 items-center gap-1 rounded-md border border-border/70 px-2 text-[11.5px] text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>
    </PanelShell>
  );
}