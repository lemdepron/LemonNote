import { Loader2, Mic, Pause, Play, Square, Trash2, Wand2 } from "lucide-react";
import { Section, Slider } from "@/components/ink/StudioSection";
import { cn } from "@/lib/utils";

const clock = (seconds) => {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

export default function AudioStudio({
  recording,
  audio,
  playing,
  time,
  onRecord,
  onStop,
  onPlay,
  onReplayInk,
  onScrub,
  onClear,
  syncing,
}) {
  const duration = audio?.duration || 0;

  return (
    <div className="space-y-4">
      <Section label="Audio to ink" hint="Every stroke is stamped with its recording time, so playback redraws the page as it was written.">
        <button
          type="button"
          onClick={recording ? onStop : onRecord}
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 font-mono text-[10px] transition",
            recording
              ? "border-destructive/50 bg-destructive/15 text-destructive"
              : "border-border/60 text-foreground/90 hover:border-primary/50 hover:text-primary"
          )}
        >
          {recording ? <Square className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
          {recording ? "stop recording" : "record while I write"}
        </button>
        {recording ? (
          <p className="font-mono text-[9px] text-destructive/80">recording — new strokes are being stamped</p>
        ) : null}
      </Section>

      <Section label={audio?.file_uri ? `Recording · ${clock(duration)}` : "No recording yet"}>
        {audio?.file_uri ? (
          <>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onPlay}
                aria-label={playing ? "Pause replay" : "Play replay"}
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-md border transition",
                  playing ? "border-primary/50 bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground"
                )}
              >
                {syncing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : playing ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
              </button>
              <span className="font-mono text-[9.5px] text-muted-foreground">
                {clock(time)} / {clock(duration)}
              </span>
              <button
                type="button"
                onClick={onClear}
                aria-label="Remove recording"
                className="ml-auto grid h-7 w-7 place-items-center rounded-md border border-border/60 text-muted-foreground transition hover:border-destructive/50 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <Slider
              label="timeline"
              value={Math.round(time)}
              min={0}
              max={Math.max(1, Math.round(duration))}
              onChange={onScrub}
              display={clock(time)}
            />
            <button
              type="button"
              onClick={onReplayInk}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-border/60 px-2 py-1.5 font-mono text-[10px] text-muted-foreground transition hover:border-primary/40 hover:text-primary"
            >
              <Wand2 className="h-3 w-3" /> replay ink only
            </button>
          </>
        ) : (
          <p className="rounded-lg border border-dashed border-border/70 px-2 py-3 font-mono text-[9.5px] text-muted-foreground">
            record a session to sync sound with strokes
          </p>
        )}
      </Section>
    </div>
  );
}