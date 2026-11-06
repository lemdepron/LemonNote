import { useState } from "react";
import {
  Brush, Eraser, Hand, History, Lasso, Layers, Maximize, Mic, MicOff, Palette, Pause, PenLine, PenTool, Pipette, Play, Redo2,
  ScanText, Shapes, Sigma, SquareDashedMousePointer, Trash2, Undo2, ZoomIn, ZoomOut, Loader2, Square, X, Check, ChevronLeft, ChevronRight,
  Droplets, BookOpen, Paperclip,
} from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import RibbonButton from "@/components/ribbon/RibbonButton";
import { MenuItem, RibbonContext, RibbonMenu, RibbonSelect } from "@/components/ribbon/RibbonKit";
import { readPref, writePref } from "@/lib/preferences";
import { Chip, Slider } from "@/components/ink/StudioSection";
import BrushStudio from "@/components/ink/BrushStudio";
import AssistStudio from "@/components/ink/AssistStudio";
import ColorStudio from "@/components/ink/ColorStudio";
import SelectionStudio from "@/components/ink/SelectionStudio";
import PaperStudio from "@/components/ink/PaperStudio";
import SmartInkStudio from "@/components/ink/SmartInkStudio";
import AudioStudio from "@/components/ink/AudioStudio";
import { BRUSHES, brushPreviewStyle } from "@/lib/ink/brushes";
import { PAPER_SIZES, PAPER_TEMPLATES, PAPER_TONES } from "@/lib/ink/paper";
import { readHistory } from "@/lib/ink/palette";
import { relativeTime } from "@/lib/vault";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "draw", label: "Draw", icon: PenTool, hint: "Draw with the current pen" },
  { id: "shape", label: "Shapes", icon: Shapes, hint: "Draw lines, boxes and circles" },
  { id: "lasso", label: "Lasso", icon: Lasso, hint: "Select marks by circling them" },
  { id: "erase", label: "Eraser", icon: Eraser, hint: "Erase marks" },
  { id: "pan", label: "Pan", icon: Hand, hint: "Move the page around" },
  { id: "eyedropper", label: "Pick", icon: Pipette, hint: "Pick a colour from the page" },
];

const QUICK_COLORS = ["#111827", "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#f9fafb"];

const dot = (color, alpha = 1) => (
  <span className="h-4 w-4 rounded-full border border-foreground/30" style={{ background: color, opacity: Math.max(0.3, alpha) }} />
);

/* ---------------------------------- Draw ---------------------------------- */

export function InkDrawTab({ ink }) {
  const { tool, onTool } = ink;
  return (
    <>
      <RibbonGroup label="Mode">
        {MODES.map((mode) => (
          <RibbonButton key={mode.id} icon={mode.icon} label={mode.label} hint={mode.hint} active={tool.mode === mode.id} onClick={() => onTool({ mode: mode.id })} />
        ))}
      </RibbonGroup>

      <RibbonGroup label="Pens">
        {BRUSHES.map((brush) => {
          const preview = brushPreviewStyle(brush.id, tool.color);
          const active = tool.brush === brush.id && tool.mode !== "erase";
          return (
            <button
              key={brush.id}
              type="button"
              onClick={() => onTool({ brush: brush.id, mode: "draw" })}
              title={`${brush.label} — ${brush.hint}`}
              aria-pressed={active}
              className={cn(
                "flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2 text-[11.5px] transition",
                active ? "border-primary/40 bg-primary/15 text-primary" : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <span className="block w-4 rounded-full" style={{ height: preview.height / 2 + 2, background: preview.color }} />
              {brush.label.split(" ")[0]}
            </button>
          );
        })}
      </RibbonGroup>

      <RibbonGroup label="Stroke">
        <div className="flex w-44 items-center px-1">
          <Slider label="width" value={tool.width} min={0.5} max={24} step={0.5} onChange={(width) => onTool({ width })} display={`${tool.width}px`} className="w-full" />
        </div>
        <div className="flex w-36 items-center px-1">
          <Slider label="opacity" value={Math.round(tool.alpha * 100)} min={5} max={100} onChange={(value) => onTool({ alpha: value / 100 })} display={`${Math.round(tool.alpha * 100)}%`} className="w-full" />
        </div>
        <RibbonMenu icon={Brush} label="Brush engine" hint="Pen behaviour, eraser engine, shape and ruler assists" width={300}>
          {() => (
            <div className="space-y-4 p-1">
              <BrushStudio tool={tool} onTool={onTool} />
              <div className="h-px bg-border/60" />
              <AssistStudio tool={tool} onTool={onTool} />
            </div>
          )}
        </RibbonMenu>
      </RibbonGroup>

      <RibbonGroup label="Eraser">
        <Chip active={tool.eraserMode === "stroke"} onClick={() => onTool({ eraserMode: "stroke", mode: "erase" })}>Stroke</Chip>
        <Chip active={tool.eraserMode === "precision"} onClick={() => onTool({ eraserMode: "precision", mode: "erase" })}>Point</Chip>
        <div className="flex w-32 items-center px-1">
          <Slider label="radius" value={tool.size} min={6} max={90} onChange={(size) => onTool({ size })} display={`${tool.size}px`} className="w-full" />
        </div>
      </RibbonGroup>

      <RibbonGroup label="History">
        <RibbonButton icon={Undo2} label="Undo" hint="Undo the last mark" shortcut="Ctrl+Z" disabled={!ink.canUndo} onClick={ink.onUndo} />
        <RibbonButton icon={Redo2} label="Redo" hint="Redo" shortcut="Ctrl+Shift+Z" disabled={!ink.canRedo} onClick={ink.onRedo} />
      </RibbonGroup>

      <RibbonGroup label="View">
        <RibbonButton icon={ZoomOut} hint="Zoom out" onClick={() => ink.onZoom(0.85)} />
        <span className="grid w-11 shrink-0 place-items-center self-center font-mono text-[10.5px] text-muted-foreground">{Math.round((ink.zoom || 1) * 100)}%</span>
        <RibbonButton icon={ZoomIn} hint="Zoom in" onClick={() => ink.onZoom(1.18)} />
        <RibbonButton icon={Maximize} label="Fit" hint="Fit the page to the ink" onClick={ink.onFit} />
        <RibbonButton icon={Trash2} label="Clear page" hint="Remove every mark on this page" onClick={ink.onClear} />
      </RibbonGroup>
    </>
  );
}

/* ---------------------------------- Color ---------------------------------- */

export function InkColorTab({ ink }) {
  const { tool, onTool } = ink;
  const recent = readHistory().slice(0, 12);
  return (
    <>
      <RibbonGroup label="Current">
        <RibbonButton icon={() => dot(tool.color, tool.alpha)} label={tool.color} hint="The current ink colour" onClick={() => {}} />
        <RibbonButton icon={Pipette} label="Pick" hint="Pick a colour from the page" active={tool.mode === "eyedropper"} onClick={() => onTool({ mode: tool.mode === "eyedropper" ? "draw" : "eyedropper" })} />
      </RibbonGroup>

      <RibbonGroup label="Quick inks">
        <div className="flex flex-wrap items-center gap-1.5 px-1" style={{ maxWidth: 260 }}>
          {QUICK_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              title={color}
              aria-label={`Use ${color}`}
              onClick={() => ink.onPickColor(color)}
              className={cn("h-5 w-5 rounded-full border transition hover:scale-110", tool.color === color ? "border-foreground ring-1 ring-foreground/40" : "border-foreground/30")}
              style={{ background: color }}
            />
          ))}
        </div>
      </RibbonGroup>

      <RibbonGroup label="Recent">
        <div className="flex flex-wrap items-center gap-1.5 px-1" style={{ maxWidth: 260 }}>
          {recent.length === 0 && <span className="font-mono text-[10px] text-muted-foreground">colours you use appear here</span>}
          {recent.map((color) => (
            <button key={color} type="button" title={color} aria-label={`Use ${color}`} onClick={() => ink.onPickColor(color)} className="h-5 w-5 rounded-full border border-foreground/30 transition hover:scale-110" style={{ background: color }} />
          ))}
        </div>
      </RibbonGroup>

      <RibbonGroup label="Studio">
        <RibbonMenu icon={Palette} label="Colour studio" hint="Mixer, palettes, opacity and custom colours" width={300}>
          {() => (
            <ColorStudio
              color={tool.color}
              alpha={tool.alpha}
              eyedropper={tool.mode === "eyedropper"}
              onEyedropper={() => onTool({ mode: tool.mode === "eyedropper" ? "draw" : "eyedropper" })}
              onChange={({ color, alpha }) => onTool({ color, alpha })}
            />
          )}
        </RibbonMenu>
        <div className="flex w-36 items-center px-1">
          <Slider label="opacity" value={Math.round(tool.alpha * 100)} min={5} max={100} onChange={(value) => onTool({ alpha: value / 100 })} display={`${Math.round(tool.alpha * 100)}%`} className="w-full" />
        </div>
      </RibbonGroup>
    </>
  );
}

/* --------------------------------- Select ---------------------------------- */

export function InkSelectTab({ ink }) {
  const { tool, selection, engine } = ink;
  const count = selection.ids.length;
  const none = { disabled: count === 0, disabledReason: "Select marks with the lasso first" };
  return (
    <>
      <RibbonGroup label="Lasso">
        <RibbonButton icon={Lasso} label="Lasso" hint="Select marks by circling them" active={tool.mode === "lasso"} onClick={() => ink.onTool({ mode: "lasso" })} />
        <span className="grid min-w-[5rem] shrink-0 place-items-center self-center px-1 font-mono text-[10.5px] text-muted-foreground">{count ? `${count} selected` : "nothing selected"}</span>
      </RibbonGroup>

      <RibbonGroup label="Actions">
        <RibbonButton icon={Check} label="Apply" hint="Commit the move, scale or rotation" {...none} onClick={() => engine()?.commitSelection()} />
        <RibbonButton icon={Droplets} label="Recolor" hint="Paint the selection with the current ink" {...none} onClick={() => engine()?.recolorSelection(tool.color, tool.alpha)} />
        <RibbonButton icon={Trash2} label="Delete" hint="Delete the selected marks" shortcut="Del" {...none} onClick={() => engine()?.deleteSelection()} />
        <RibbonButton icon={X} label="Deselect" hint="Clear the selection" {...none} onClick={() => engine()?.setSelection([])} />
      </RibbonGroup>

      <RibbonGroup label="Transform">
        <RibbonMenu icon={SquareDashedMousePointer} label="Selection studio" hint="Move, scale and rotate the selection precisely" width={300} disabled={count === 0} disabledReason="Select marks with the lasso first">
          {() => (
            <SelectionStudio
              selection={selection}
              color={tool.color}
              alpha={tool.alpha}
              onTransform={(transform) => engine()?.setSelectionTransform(transform)}
              onCommit={() => engine()?.commitSelection()}
              onRecolor={() => engine()?.recolorSelection(tool.color, tool.alpha)}
              onDelete={() => engine()?.deleteSelection()}
              onClear={() => engine()?.setSelection([])}
            />
          )}
        </RibbonMenu>
      </RibbonGroup>
    </>
  );
}

/* ---------------------------------- Paper ---------------------------------- */

export function InkPaperTab({ ink }) {
  const { page, pageIndex } = ink;
  const paper = page.paper || {};
  return (
    <>
      <RibbonGroup label="Template">
        <RibbonSelect title="Paper template" width={120} value={paper.template || "grid"} onChange={(template) => ink.onPaper({ template })} options={PAPER_TEMPLATES.map((item) => ({ value: item.id, label: item.label }))} />
        <RibbonSelect title="Paper tone" width={96} value={paper.tone || "dark"} onChange={(tone) => ink.onPaper({ tone })} options={PAPER_TONES.map((item) => ({ value: item.id, label: item.label }))} />
      </RibbonGroup>

      <RibbonGroup label="Page size">
        <RibbonSelect title="Page size" width={120} value={paper.size || "a4"} onChange={(size) => ink.onPaper({ size })} options={PAPER_SIZES.map((item) => ({ value: item.id, label: item.label }))} />
      </RibbonGroup>

      <RibbonGroup label="Pages">
        <RibbonButton icon={ChevronLeft} hint="Previous page" disabled={pageIndex <= 0} onClick={() => ink.onPage(-1)} />
        <span className="grid w-16 shrink-0 place-items-center self-center font-mono text-[10.5px] text-muted-foreground">page {pageIndex + 1}</span>
        <RibbonButton icon={ChevronRight} hint="Next page" onClick={() => ink.onPage(1)} />
      </RibbonGroup>

      <RibbonGroup label="Studio">
        <RibbonMenu icon={Layers} label="Paper studio" hint="All paper options in one place" width={300}>
          {() => <PaperStudio paper={paper} onPaper={ink.onPaper} pageIndex={pageIndex} onPage={ink.onPage} onClear={ink.onClear} />}
        </RibbonMenu>
        <RibbonButton icon={Trash2} label="Clear page" hint="Remove every mark on this page" onClick={ink.onClear} />
      </RibbonGroup>
    </>
  );
}

/* -------------------------------- Smart ink -------------------------------- */

export function InkSmartTab({ ink }) {
  const { recognition } = ink;
  const busy = Boolean(recognition.busy);
  return (
    <>
      <RibbonGroup label="Recognise">
        <RibbonButton icon={recognition.busy === "text" ? Loader2 : ScanText} spinning={recognition.busy === "text"} label="Handwriting" hint="Turn the lasso selection, or the page in view, into text" disabled={busy} onClick={() => ink.onRecognize("text")} />
        <RibbonButton icon={recognition.busy === "math" ? Loader2 : Sigma} spinning={recognition.busy === "math"} label="Equation" hint="Turn handwritten maths into LaTeX" disabled={busy} onClick={() => ink.onRecognize("math")} />
      </RibbonGroup>

      <RibbonGroup label="Results and search">
        <RibbonMenu icon={BookOpen} label="Results & search" hint="Recognised text, insert it on the page, search all handwriting" width={300}>
          {() => (
            <SmartInkStudio
              recognition={recognition}
              onRecognize={ink.onRecognize}
              onInsert={ink.onInsertText}
              search={ink.handwriting.query}
              onSearch={ink.onSearch}
              matches={ink.handwriting.matches}
              searching={ink.handwriting.searching}
              onOpenPage={(pageId) => ink.onOpenPage?.(pageId)}
            />
          )}
        </RibbonMenu>
        {recognition.error && <span className="max-w-[16rem] self-center truncate px-1 font-mono text-[10px] text-destructive" title={recognition.error}>{recognition.error}</span>}
      </RibbonGroup>
    </>
  );
}

/* ---------------------------------- Audio ---------------------------------- */

const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export function InkAudioTab({ ink }) {
  const { page, recording, replay } = ink;
  const audio = page.audio;
  return (
    <>
      <RibbonGroup label="Record">
        <RibbonButton icon={recording ? Square : Mic} label={recording ? "Stop" : "Record"} hint="Record audio while you write; every stroke is time-stamped" active={recording} onClick={recording ? ink.onStop : ink.onRecord} />
        {recording && <span className="grid shrink-0 place-items-center self-center px-1 font-mono text-[10.5px] text-destructive">recording…</span>}
      </RibbonGroup>

      <RibbonGroup label="Playback">
        <RibbonButton icon={replay.syncing ? Loader2 : replay.playing ? Pause : Play} spinning={replay.syncing} label={replay.playing ? "Pause" : "Play"} hint="Play the recording and redraw the page as it was written" disabled={!audio?.file_uri} disabledReason="Record some audio first" onClick={ink.onPlay} />
        <RibbonButton icon={History} label="Replay ink" hint="Replay the strokes without sound" onClick={ink.onReplayInk} />
        <span className="grid w-24 shrink-0 place-items-center self-center font-mono text-[10.5px] text-muted-foreground">
          {audio ? `${clock(replay.time || 0)} / ${clock(audio.duration || 0)}` : "no recording"}
        </span>
      </RibbonGroup>

      <RibbonGroup label="Manage">
        <RibbonMenu icon={Mic} label="Audio studio" hint="Scrub through the recording" width={300}>
          {() => (
            <AudioStudio
              recording={recording}
              audio={audio}
              playing={replay.playing}
              time={replay.time}
              syncing={replay.syncing}
              onRecord={ink.onRecord}
              onStop={ink.onStop}
              onPlay={ink.onPlay}
              onReplayInk={ink.onReplayInk}
              onScrub={ink.onScrub}
              onClear={ink.onClearAudio}
            />
          )}
        </RibbonMenu>
        <RibbonButton icon={MicOff} label="Remove audio" hint="Delete the recording from this page" disabled={!audio} disabledReason="This page has no recording" onClick={ink.onClearAudio} />
      </RibbonGroup>
    </>
  );
}

/* ------------------- Ink tab inside the NOTE ribbon (pages) ---------------- */

/** Lets a note jump to ink: create a page, reopen a recent one, or browse them all. */
/* ----------------------------- The Ink tab itself ----------------------------- */

const SUBTABS = [
  ["draw", "Draw", InkDrawTab],
  ["color", "Color", InkColorTab],
  ["select", "Select", InkSelectTab],
  ["paper", "Paper", InkPaperTab],
  ["smart", "Smart ink", InkSmartTab],
  ["audio", "Audio", InkAudioTab],
];

// Ink controls never depend on a markdown editor, so the shared kit sees an always-enabled context.
const INK_CONTEXT = { markdown: true, offReason: "", selection: { value: "", start: 0, end: 0 }, run() {}, typography: {}, setTypography() {} };

/**
 * The Ink tab of the note ribbon. `noteInk` is the note's own handwriting page
 * (see useInkPage in NotePage): until it exists the tab offers to start one.
 */
export function InkTab({ noteInk }) {
  const [sub, setSub] = useState(() => {
    const saved = readPref("inkRibbonTab", "draw");
    return SUBTABS.some(([id]) => id === saved) ? saved : "draw";
  });
  const [legacy, setLegacy] = useState([]);
  const choose = (id) => {
    setSub(id);
    writePref("inkRibbonTab", id);
  };
  const loadLegacy = () =>
    noteInk
      .listAttachable()
      .then(setLegacy)
      .catch(() => setLegacy([]));
  const Section = SUBTABS.find(([id]) => id === sub)?.[2] || InkDrawTab;

  const attach = (
    <RibbonMenu icon={Paperclip} label="Attach old page" hint="Bring in a handwriting page from before Ink moved inside notes" width={300} disabled={false} onOpenChange={loadLegacy}>
      {(close) =>
        legacy.length === 0 ? (
          <p className="px-2 py-3 font-mono text-[11px] text-muted-foreground">No unattached ink pages.</p>
        ) : (
          legacy.map((page) => (
            <MenuItem
              key={page.id}
              onClick={() => {
                noteInk.onAttach(page.id);
                close();
              }}
            >
              <span className="truncate">{page.name || "Untitled page"}</span>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{relativeTime(page.updated_date)}</span>
            </MenuItem>
          ))
        )
      }
    </RibbonMenu>
  );

  return (
    <RibbonContext.Provider value={INK_CONTEXT}>
      {!noteInk.hasPage ? (
        <>
          <RibbonGroup label="Handwriting">
            <RibbonButton
              icon={noteInk.starting ? Loader2 : PenLine}
              spinning={noteInk.starting}
              label="Start inking"
              hint="Add a handwriting page to this note"
              onClick={noteInk.onStart}
              keepFocus={false}
            />
            {attach}
          </RibbonGroup>
          <RibbonGroup label="About">
            <p className="max-w-[24rem] self-center px-3 font-mono text-[10.5px] leading-snug text-muted-foreground">
              Every note can carry its own handwriting page. Pens, colours, selection, paper, smart ink and audio appear here once you start.
            </p>
          </RibbonGroup>
        </>
      ) : (
        <>
          <RibbonGroup label="Ink">
            <div className="grid grid-cols-3 gap-1">
              {SUBTABS.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(id)}
                  aria-pressed={sub === id}
                  className={cn(
                    "h-7 rounded-md border px-2 font-mono text-[10px] uppercase tracking-[0.08em] transition",
                    sub === id ? "border-primary/50 bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </RibbonGroup>
          {noteInk.ink && <Section ink={noteInk.ink} />}
          <RibbonGroup label="Handwriting page">
            <div className="flex flex-col justify-center px-1 font-mono text-[10px] leading-snug text-muted-foreground">
              <span>{noteInk.markCount} marks</span>
              <span>{noteInk.status === "saving" ? "saving…" : noteInk.status === "saved" ? "saved" : "autosave on"}</span>
            </div>
            {attach}
            <RibbonButton icon={Trash2} label="Remove ink" hint="Delete all handwriting in this note" onClick={noteInk.onRemove} keepFocus={false} />
          </RibbonGroup>
        </>
      )}
    </RibbonContext.Provider>
  );
}
