import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Brush,
  Layers,
  Lasso,
  Mic,
  Palette,
  PanelRightClose,
  PanelRightOpen,
  ScanText,
} from "lucide-react";
import { db } from "@/api/localDb";
import VaultHeader from "@/components/vault/VaultHeader";
import InkBoard from "@/components/ink/InkBoard";
import InkToolbar from "@/components/ink/InkToolbar";
import BrushStudio from "@/components/ink/BrushStudio";
import AssistStudio from "@/components/ink/AssistStudio";
import ColorStudio from "@/components/ink/ColorStudio";
import SelectionStudio from "@/components/ink/SelectionStudio";
import PaperStudio from "@/components/ink/PaperStudio";
import SmartInkStudio from "@/components/ink/SmartInkStudio";
import AudioStudio from "@/components/ink/AudioStudio";
import EdgeDock from "@/components/shell/EdgeDock";
import FocusToggle from "@/components/shell/FocusToggle";
import { useFocusMode } from "@/lib/focusMode";
import { rememberColor } from "@/lib/ink/palette";
import { loadPage, savePage } from "@/lib/ink/store";
import { tokenColor, useTheme } from "@/lib/theme";
import { escapeRegExp } from "@/lib/vault";
import { cn } from "@/lib/utils";

const DEFAULT_TOOL = {
  mode: "draw",
  brush: "fountain",
  alpha: 1,
  width: 3,
  size: 26,
  eraserMode: "stroke",
  nibAngle: -0.55,
  shapeRecognition: false,
  ruler: false,
  rulerAngle: 0,
};

const DEFAULT_PAPER = { template: "grid", size: "a4", tone: "dark" };

/** Pen default for a paper stock, read from theme tokens so ink stays visible. */
const inkForTone = (tone) =>
  (tone === "light" ? tokenColor("--ink") : tokenColor("--ink-light")) || tokenColor("--ink-light");
const EMPTY_RECOGNITION = { busy: null, mode: null, text: "", latex: "", error: "" };

export default function InkPage() {
  const { id } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("idle");
  const [tool, setTool] = useState(() => ({ ...DEFAULT_TOOL, color: inkForTone("dark") }));
  const [selection, setSelection] = useState({ ids: [], bounds: null });
  // Studio panel: open on desktop, collapsed on phones so the canvas keeps its width.
  const [panelOpen, setPanelOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 768
  );
  const [zoom, setZoom] = useState(1);
  const [pageIndex, setPageIndex] = useState(0);
  const [recognition, setRecognition] = useState(EMPTY_RECOGNITION);
  const [handwriting, setHandwriting] = useState({ query: "", matches: [], searching: false });
  const [recording, setRecording] = useState(false);
  const [replay, setReplay] = useState({ playing: false, time: 0, syncing: false });

  const engineRef = useRef(null);
  const registryRef = useRef(new Map());
  const latestRef = useRef(null);
  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const dirtyRef = useRef(false);
  const lastHistoryRef = useRef(0);
  const sessionRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recStartRef = useRef(0);
  const audioRef = useRef(null);
  const cameraTimer = useRef(null);
  const replayFrame = useRef(0);
  const zoomRef = useRef(1);
  const { focus } = useFocusMode();
  const { resolved: themeMode } = useTheme();
  const themeRef = useRef(themeMode);
  themeRef.current = themeMode;

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setStatus("saving");
  }, []);

  const retryTimer = useRef(null);
  const persistRef = useRef(null);

  // A large page is written in several passes, so a failed pass simply retries.
  const persist = useCallback(async () => {
    const snapshot = latestRef.current;
    if (!snapshot || !dirtyRef.current) return;
    if (retryTimer.current) clearTimeout(retryTimer.current);
    try {
      await savePage(snapshot, registryRef.current);
      dirtyRef.current = false;
      setStatus("saved");
    } catch {
      setStatus("saving");
      retryTimer.current = setTimeout(() => persistRef.current?.(), 4000);
    }
  }, []);

  persistRef.current = persist;

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadPage(id)
      .then(({ page: record, strokes, registry }) => {
        if (!active) return;
        registryRef.current = registry;
        const paper = {
          ...DEFAULT_PAPER,
          tone: themeRef.current === "light" ? "light" : "dark",
          ...(record.paper || {}),
        };
        const next = { ...record, strokes, paper };
        setTool((current) => ({ ...current, color: inkForTone(paper.tone) }));
        latestRef.current = next;
        pastRef.current = [];
        futureRef.current = [];
        dirtyRef.current = false;
        setPage(next);
        setStatus("idle");
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        registryRef.current = new Map();
        latestRef.current = null;
        setPage(null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const applyStrokes = useCallback(
    (next, { history = true, coalesce = false } = {}) => {
      const current = latestRef.current;
      if (!current) return;
      const now = Date.now();
      const push = history && !(coalesce && now - lastHistoryRef.current < 800);
      if (push) {
        pastRef.current = [...pastRef.current.slice(-59), current.strokes];
        futureRef.current = [];
        lastHistoryRef.current = now;
      }
      const updated = { ...current, strokes: next };
      latestRef.current = updated;
      setPage(updated);
      markDirty();
    },
    [markDirty]
  );

  const patch = useCallback(
    (changes) => {
      const current = latestRef.current;
      if (!current) return;
      const updated = { ...current, ...changes };
      latestRef.current = updated;
      setPage(updated);
      markDirty();
    },
    [markDirty]
  );

  useEffect(() => {
    if (!page || !dirtyRef.current) return;
    const timer = setTimeout(() => persistRef.current?.(), 700);
    return () => clearTimeout(timer);
  }, [page]);

  useEffect(
    () => () => {
      const snapshot = latestRef.current;
      if (snapshot && dirtyRef.current) {
        savePage(snapshot, registryRef.current).catch(() => {});
      }
      if (cameraTimer.current) clearTimeout(cameraTimer.current);
      if (retryTimer.current) clearTimeout(retryTimer.current);
      cancelAnimationFrame(replayFrame.current);
      recorderRef.current?.stop?.();
      streamRef.current?.getTracks?.().forEach((track) => track.stop());
      audioRef.current?.pause?.();
    },
    []
  );

  const handleCommit = useCallback(
    (strokes) => {
      const current = latestRef.current;
      if (!current) return;
      const stamp = sessionRef.current
        ? { t: Date.now() - recStartRef.current, session: sessionRef.current }
        : {};
      applyStrokes([...current.strokes, ...strokes.map((stroke) => ({ ...stroke, ...stamp }))]);
      rememberColor(tool.color);
    },
    [applyStrokes, tool.color]
  );

  const handleReplace = useCallback((next) => applyStrokes(next, { coalesce: true }), [applyStrokes]);
  const handleSelection = useCallback((ids, bounds) => setSelection({ ids, bounds }), []);

  const handleCamera = useCallback((camera) => {
    if (Math.abs(camera.scale - zoomRef.current) > 0.004) {
      zoomRef.current = camera.scale;
      setZoom(camera.scale);
    }
    if (cameraTimer.current) clearTimeout(cameraTimer.current);
    cameraTimer.current = setTimeout(() => {
      const current = latestRef.current;
      if (!current) return;
      const updated = { ...current, camera };
      latestRef.current = updated;
      setPage(updated);
      dirtyRef.current = true;
      setPageIndex(engineRef.current?.currentPage() ?? 0);
    }, 800);
  }, []);

  const handleEngine = useCallback((engine) => {
    engineRef.current = engine;
    if (engine) {
      setZoom(engine.camera.scale);
      setPageIndex(engine.currentPage());
    }
  }, []);

  const handlePickColor = useCallback((hex) => {
    rememberColor(hex);
    setTool((current) => ({ ...current, color: hex, mode: "draw" }));
  }, []);

  const updateTool = useCallback((changes) => {
    setTool((current) => ({ ...current, ...changes }));
  }, []);

  const undo = useCallback(() => {
    const current = latestRef.current;
    if (!current || !pastRef.current.length) return;
    const previous = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [...futureRef.current, current.strokes];
    const updated = { ...current, strokes: previous };
    latestRef.current = updated;
    setPage(updated);
    markDirty();
  }, [markDirty]);

  const redo = useCallback(() => {
    const current = latestRef.current;
    if (!current || !futureRef.current.length) return;
    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);
    pastRef.current = [...pastRef.current, current.strokes];
    const updated = { ...current, strokes: next };
    latestRef.current = updated;
    setPage(updated);
    markDirty();
  }, [markDirty]);

  useEffect(() => {
    const onKey = (event) => {
      const target = event.target;
      const typing =
        target instanceof HTMLElement && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable);
      if (typing) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selection.ids.length) {
        event.preventDefault();
        engineRef.current?.deleteSelection();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, selection.ids.length]);

  const clearPage = () => {
    if (!latestRef.current?.strokes.length) return;
    if (!window.confirm("Clear every stroke on this page?")) return;
    engineRef.current?.setPlayback(null);
    applyStrokes([]);
  };

  const updatePaper = useCallback(
    (changes) => {
      const current = latestRef.current;
      if (!current) return;
      const next = { ...current.paper, ...changes };
      if (changes.tone) {
        // The stock changed, so a pen that still held the old stock's default flips with it.
        const stale = inkForTone(changes.tone === "light" ? "dark" : "light");
        setTool((tool) => (tool.color === stale ? { ...tool, color: inkForTone(changes.tone) } : tool));
      }
      patch({ paper: next });
    },
    [patch]
  );

  const goPage = (delta) => {
    const engine = engineRef.current;
    if (!engine) return;
    const target = Math.max(0, engine.currentPage() + delta);
    engine.focusPage(target);
    setPageIndex(target);
  };

  const recognize = useCallback(
    async (mode) => {
      const engine = engineRef.current;
      if (!engine) return;
      setRecognition({ busy: mode, mode, text: "", latex: "", error: "" });
      try {
        const dataUrl = engine.exportImage();
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `ink-${Date.now()}.png`, { type: "image/png" });
        const { file_uri } = await db.integrations.Core.UploadPrivateFile({ file });
        const { signed_url } = await db.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 600 });
        const response = await db.functions.invoke("recognizeInk", { file_url: signed_url, mode });
        const data = response?.data || {};
        if (data.error) throw new Error(data.error);
        setRecognition({ busy: null, mode, text: data.text || "", latex: data.latex || "", error: "" });
        if (data.text && mode !== "math") patch({ ocrText: data.text });
      } catch (error) {
        setRecognition({ busy: null, mode, text: "", latex: "", error: error.message || "Recognition failed" });
      }
    },
    [patch]
  );

  const insertText = useCallback(
    (text) => {
      const engine = engineRef.current;
      const current = latestRef.current;
      if (!engine || !current || !text) return;
      const center = engine.centerWorld();
      applyStrokes([
        ...current.strokes,
        {
          id: `text-${Date.now().toString(36)}`,
          kind: "text",
          color: tool.color,
          alpha: 1,
          text,
          x: Number((center.x - 170).toFixed(1)),
          y: Number((center.y - 14).toFixed(1)),
          fontSize: 20,
        },
      ]);
    },
    [applyStrokes, tool.color]
  );

  const searchHandwriting = useCallback(async (value) => {
    const query = String(value || "").trim();
    setHandwriting({ query, matches: [], searching: Boolean(query) });
    if (!query) return;
    const result = await db.entities.InkPage.filter(
      { ocrText: { $regex: escapeRegExp(query), $options: "i" } },
      { sort: "-updated_date", limit: 8 }
    );
    setHandwriting({ query, matches: result?.items ?? [], searching: false });
  }, []);

  const startRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    streamRef.current = stream;
    chunksRef.current = [];
    const startedAt = new Date().toISOString();
    sessionRef.current = startedAt;
    recStartRef.current = Date.now();
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunksRef.current.push(event.data);
    };
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      const duration = (Date.now() - recStartRef.current) / 1000;
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      const file = new File([blob], `ink-${Date.now()}.webm`, { type: blob.type || "audio/webm" });
      audioRef.current = null;
      const { file_uri } = await db.integrations.Core.UploadPrivateFile({ file });
      sessionRef.current = null;
      patch({ audio: { file_uri, duration, startedAt } });
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
  }, [patch]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }, []);

  const togglePlay = useCallback(async () => {
    const audio = latestRef.current?.audio;
    if (!audio?.file_uri) return;
    if (!audioRef.current) {
      setReplay((current) => ({ ...current, syncing: true }));
      const { signed_url } = await db.integrations.Core.CreateFileSignedUrl({ file_uri: audio.file_uri });
      const element = new Audio(signed_url);
      element.onended = () => {
        setReplay({ playing: false, time: 0, syncing: false });
        engineRef.current?.setPlayback(null);
      };
      element.ontimeupdate = () => {
        setReplay({ playing: !element.paused, time: element.currentTime, syncing: false });
        engineRef.current?.setPlayback(element.currentTime * 1000, audio.startedAt);
      };
      audioRef.current = element;
    }
    const element = audioRef.current;
    if (element.paused) {
      await element.play();
      setReplay((current) => ({ ...current, playing: true, syncing: false }));
    } else {
      element.pause();
      setReplay((current) => ({ ...current, playing: false }));
      engineRef.current?.setPlayback(null);
    }
  }, []);

  const scrub = useCallback((value) => {
    const audio = latestRef.current?.audio;
    if (audioRef.current) audioRef.current.currentTime = value;
    setReplay((current) => ({ ...current, time: value }));
    engineRef.current?.setPlayback(value * 1000, audio?.startedAt || null);
  }, []);

  const replayInk = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const audio = latestRef.current?.audio;
    const duration = Math.max(1.5, audio?.duration || 6);
    audioRef.current?.pause();
    cancelAnimationFrame(replayFrame.current);
    const started = performance.now();
    const step = () => {
      const elapsed = (performance.now() - started) / 1000;
      const ratio = Math.min(1, elapsed / duration);
      const ms = ratio * duration * 1000;
      setReplay({ playing: true, time: ms / 1000, syncing: false });
      engine.setPlayback(ms, audio?.startedAt || null);
      if (ratio < 1) replayFrame.current = requestAnimationFrame(step);
      else {
        setReplay({ playing: false, time: 0, syncing: false });
        engine.setPlayback(null);
      }
    };
    step();
  }, []);

  const clearAudio = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    engineRef.current?.setPlayback(null);
    setReplay({ playing: false, time: 0, syncing: false });
    patch({ audio: null });
  }, [patch]);

  if (loading) {
    return (
      <div className="nb-shell min-h-screen">
        <VaultHeader />
        <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6">
          <div className="h-[58vh] animate-pulse rounded-xl border border-border/60 bg-card/30" />
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="nb-shell min-h-screen">
        <VaultHeader />
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <p className="font-display text-[26px]">This page is gone.</p>
          <Link to="/ink" className="mt-4 inline-block font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
            back to ink
          </Link>
        </div>
      </div>
    );
  }

  const strokes = page.strokes || [];

  const toolbar = (
    <InkToolbar
      tool={tool}
      onTool={updateTool}
      zoom={zoom}
      onZoom={(factor) => engineRef.current?.zoomBy(factor)}
      onFit={() => engineRef.current?.fit()}
      onUndo={undo}
      onRedo={redo}
      canUndo={pastRef.current.length > 0}
      canRedo={futureRef.current.length > 0}
      onClear={clearPage}
    />
  );

  const dockPanels = [
    {
      id: "ink-brush",
      label: "Brush engine",
      icon: Brush,
      content: (
        <div className="space-y-4">
          <BrushStudio tool={tool} onTool={updateTool} />
          <div className="h-px bg-border/60" />
          <AssistStudio tool={tool} onTool={updateTool} />
        </div>
      ),
    },
    {
      id: "ink-color",
      label: "Colour studio",
      icon: Palette,
      content: (
        <ColorStudio
          color={tool.color}
          alpha={tool.alpha}
          eyedropper={tool.mode === "eyedropper"}
          onEyedropper={() => updateTool({ mode: tool.mode === "eyedropper" ? "draw" : "eyedropper" })}
          onChange={({ color, alpha }) => updateTool({ color, alpha })}
        />
      ),
    },
    {
      id: "ink-select",
      label: "Selection",
      icon: Lasso,
      content: (
        <SelectionStudio
          selection={selection}
          color={tool.color}
          alpha={tool.alpha}
          onTransform={(transform) => engineRef.current?.setSelectionTransform(transform)}
          onCommit={() => engineRef.current?.commitSelection()}
          onRecolor={() => engineRef.current?.recolorSelection(tool.color, tool.alpha)}
          onDelete={() => engineRef.current?.deleteSelection()}
          onClear={() => engineRef.current?.setSelection([])}
        />
      ),
    },
    {
      id: "ink-paper",
      label: "Paper & pages",
      icon: Layers,
      content: (
        <PaperStudio paper={page.paper} onPaper={updatePaper} pageIndex={pageIndex} onPage={goPage} onClear={clearPage} />
      ),
    },
    {
      id: "ink-smart",
      label: "Smart ink",
      icon: ScanText,
      content: (
        <SmartInkStudio
          recognition={recognition}
          onRecognize={recognize}
          onInsert={insertText}
          search={handwriting.query}
          onSearch={searchHandwriting}
          matches={handwriting.matches}
          searching={handwriting.searching}
          onOpenPage={(pageId) => (window.location.href = `/ink/${pageId}`)}
        />
      ),
    },
    {
      id: "ink-audio",
      label: "Audio sync",
      icon: Mic,
      content: (
        <AudioStudio
          recording={recording}
          audio={page.audio}
          playing={replay.playing}
          time={replay.time}
          syncing={replay.syncing}
          onRecord={startRecording}
          onStop={stopRecording}
          onPlay={togglePlay}
          onReplayInk={replayInk}
          onScrub={scrub}
          onClear={clearAudio}
        />
      ),
    },
  ];

  return (
    <div className="nb-shell flex h-screen flex-col overflow-hidden">
      <VaultHeader />
      <main className="flex min-h-0 flex-1 flex-col px-4 pb-2 pt-4 sm:px-6">
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <Link
            to="/ink"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Back to ink pages"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <input
            value={page.name || ""}
            onChange={(event) => patch({ name: event.target.value })}
            aria-label="Page name"
            className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-1 font-display text-[18px] tracking-tight text-foreground outline-none transition hover:border-border/60 focus:border-primary/40"
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {strokes.length} marks · {page.paper?.size === "infinite" ? "infinite" : `page ${pageIndex + 1}`} ·{" "}
            {status === "saving" ? "saving…" : status === "saved" ? "saved" : "autosave on"}
          </span>
          {!focus && (
            <button
              type="button"
              onClick={() => setPanelOpen((open) => !open)}
              aria-expanded={panelOpen}
              aria-controls="ink-studio"
              aria-label={panelOpen ? "Hide the studio panel" : "Show the studio panel"}
              title={panelOpen ? "Hide the studio panel" : "Show the studio panel"}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border/70 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              {panelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </button>
          )}
          <FocusToggle />
        </div>

        <div className="mt-3 shrink-0">{toolbar}</div>

        <div className={cn("relative mt-3 flex min-h-0 flex-1 gap-3", focus && "pr-12 sm:pr-14")}>
          <InkBoard
            strokes={strokes}
            paper={page.paper}
            tool={tool}
            initialCamera={page.camera}
            onCommit={handleCommit}
            onReplace={handleReplace}
            onSelection={handleSelection}
            onCamera={handleCamera}
            onPickColor={handlePickColor}
            onEngine={handleEngine}
            autoFit
            className="min-h-0 flex-1"
          />
          {!focus && panelOpen && (
            <aside
              id="ink-studio"
              className={cn(
                "absolute inset-y-0 right-0 z-20 w-[272px] max-w-[85vw] space-y-4 overflow-y-auto rounded-xl border border-border/70 bg-card/30 p-3 shadow-2xl shadow-[hsl(var(--shadow)/0.45)] backdrop-blur-md",
                "md:static md:z-auto md:w-[272px] md:max-w-none md:shrink-0 md:shadow-none md:backdrop-blur-none"
              )}
            >
              <BrushStudio tool={tool} onTool={updateTool} />
              <div className="h-px bg-border/60" />
              <ColorStudio
                color={tool.color}
                alpha={tool.alpha}
                eyedropper={tool.mode === "eyedropper"}
                onEyedropper={() => updateTool({ mode: tool.mode === "eyedropper" ? "draw" : "eyedropper" })}
                onChange={({ color, alpha }) => updateTool({ color, alpha })}
              />
              <div className="h-px bg-border/60" />
              <AssistStudio tool={tool} onTool={updateTool} />
            </aside>
          )}
        </div>

        <EdgeDock panels={dockPanels} />
      </main>
    </div>
  );
}