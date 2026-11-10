import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "@/api/localDb";
import { rememberColor } from "@/lib/ink/palette";
import { loadPage, savePage } from "@/lib/ink/store";
import { tokenColor, useTheme } from "@/lib/theme";
import { escapeRegExp } from "@/lib/vault";
import { toast } from "@/lib/toast";
import { createObject, getDefaultSize, OBJECT_TYPES, SHAPE_TYPES, STICKERS } from "@/lib/ink/objects";

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

/**
 * Everything one ink page needs: loading and saving through the ink store, the pen
 * settings, undo/redo, recognition, handwriting search and audio replay.
 * `id` is the InkPage record to open (null = nothing attached yet). `active` turns
 * the keyboard shortcuts on only while the Ink tab is showing.
 */
export default function useInkPage(id, { active = true, onOpenPage } = {}) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("idle");
  const [tool, setTool] = useState(() => ({ ...DEFAULT_TOOL, color: inkForTone("dark") }));
  const [selection, setSelection] = useState({ ids: [], bounds: null });
  const [zoom, setZoom] = useState(1);
  const [pageIndex, setPageIndex] = useState(0);
  const [recognition, setRecognition] = useState(EMPTY_RECOGNITION);
  const [handwriting, setHandwriting] = useState({ query: "", matches: [], searching: false });
  const [recording, setRecording] = useState(false);
  const [replay, setReplay] = useState({ playing: false, time: 0, syncing: false });
  const [objects, setObjects] = useState([]);
  const [objectSelection, setObjectSelection] = useState(null); // { id, type: 'move'|'resize'|'rotate', handle }
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [editingObjectId, setEditingObjectId] = useState(null);

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
    let alive = true;
    pastRef.current = [];
    futureRef.current = [];
    dirtyRef.current = false;
    setSelection({ ids: [], bounds: null });
    setObjectSelection(null);
    setEditingObjectId(null);
    setRecognition(EMPTY_RECOGNITION);
    setHandwriting({ query: "", matches: [], searching: false });
    if (!id) {
      registryRef.current = new Map();
      latestRef.current = null;
      setPage(null);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    loadPage(id)
      .then(({ page: record, strokes, objects: loadedObjects, registry }) => {
        if (!alive) return;
        registryRef.current = registry;
        const paper = {
          ...DEFAULT_PAPER,
          tone: themeRef.current === "light" ? "light" : "dark",
          ...(record.paper || {}),
        };
        const next = { ...record, strokes, objects: loadedObjects || [], paper };
        setTool((current) => ({ ...current, color: inkForTone(paper.tone) }));
        latestRef.current = next;
        setPage(next);
        setObjects(loadedObjects || []);
        setStatus("idle");
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        registryRef.current = new Map();
        latestRef.current = null;
        setPage(null);
        setObjects([]);
        setLoading(false);
      });
    return () => {
      alive = false;
      // Switching notes: write the page we are leaving before it is replaced.
      const snapshot = latestRef.current;
      if (snapshot && dirtyRef.current) savePage(snapshot, registryRef.current).catch(() => {});
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

  const applyObjects = useCallback(
    (next, { history = true } = {}) => {
      const current = latestRef.current;
      if (!current) return;
      const now = Date.now();
      if (history) {
        pastRef.current = [...pastRef.current.slice(-59), current.objects];
        futureRef.current = [];
        lastHistoryRef.current = now;
      }
      const updated = { ...current, objects: next };
      latestRef.current = updated;
      setPage(updated);
      setObjects(next);
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

  const handleInsertSpaceLimited = useCallback(() => {
    toast.info("Space removed only where ink would not overlap. Some strokes limit further removal.", 4000);
  }, []);

  const onSelectObject = useCallback((id) => {
    setSelectedObjectId(id);
  }, []);

  // Object management
  const addObject = useCallback((type, x, y, overrides = {}) => {
    const current = latestRef.current;
    if (!current) return;
    const { width, height } = getDefaultSize(type, overrides.shapeType);
    const newObject = createObject(type, x, y, width, height, overrides);
    const nextObjects = [...(current.objects || []), newObject];
    applyObjects(nextObjects, { history: true });
    setObjectSelection({ id: newObject.id, type: "move" });
    return newObject;
  }, [applyObjects]);

  const updateObject = useCallback((id, changes, options = {}) => {
    const current = latestRef.current;
    if (!current) return;
    const nextObjects = (current.objects || []).map((obj) =>
      obj.id === id ? { ...obj, ...changes } : obj
    );
    // Allow history: true to be passed for explicit user actions (like Layout tab)
    // Default to false for coalescing rapid updates (dragging handles)
    applyObjects(nextObjects, { history: options.history === true });
  }, [applyObjects]);

  const deleteObject = useCallback((id) => {
    const current = latestRef.current;
    if (!current) return;
    const nextObjects = (current.objects || []).filter((obj) => obj.id !== id);
    applyObjects(nextObjects, { history: true });
    if (objectSelection?.id === id) setObjectSelection(null);
    if (editingObjectId === id) setEditingObjectId(null);
  }, [applyObjects, objectSelection, editingObjectId]);

  const deleteSelectedObjects = useCallback(() => {
    const current = latestRef.current;
    if (!current || !objectSelection) return;
    const nextObjects = (current.objects || []).filter((obj) => obj.id !== objectSelection.id);
    applyObjects(nextObjects, { history: true });
    setObjectSelection(null);
    setEditingObjectId(null);
  }, [applyObjects, objectSelection]);

  const bringToFront = useCallback((id) => {
    const current = latestRef.current;
    if (!current) return;
    const objects = current.objects || [];
    const obj = objects.find((o) => o.id === id);
    if (!obj) return;
    const maxZ = Math.max(...objects.map((o) => o.zOrder || 0), 0);
    updateObject(id, { zOrder: maxZ + 1 }, { history: true });
  }, [updateObject]);

  const sendToBack = useCallback((id) => {
    const current = latestRef.current;
    if (!current) return;
    const objects = current.objects || [];
    const obj = objects.find((o) => o.id === id);
    if (!obj) return;
    const minZ = Math.min(...objects.map((o) => o.zOrder || 0), 0);
    updateObject(id, { zOrder: minZ - 1 }, { history: true });
  }, [updateObject]);

  const startEditingObject = useCallback((id) => {
    setEditingObjectId(id);
  }, []);

  const stopEditingObject = useCallback(() => {
    setEditingObjectId(null);
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
    // Also restore objects if they were saved
    const prevObjects = pastRef.current[pastRef.current.length - 1]?.objects || current.objects;
    const updated = { ...current, strokes: previous, objects: prevObjects };
    latestRef.current = updated;
    setPage(updated);
    setObjects(prevObjects);
    markDirty();
  }, [markDirty]);

  const redo = useCallback(() => {
    const current = latestRef.current;
    if (!current || !futureRef.current.length) return;
    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);
    pastRef.current = [...pastRef.current, current.strokes];
    // Also restore objects if they were saved
    const nextObjects = futureRef.current[futureRef.current.length - 1]?.objects || current.objects;
    const updated = { ...current, strokes: next, objects: nextObjects };
    latestRef.current = updated;
    setPage(updated);
    setObjects(nextObjects);
    markDirty();
  }, [markDirty]);

  useEffect(() => {
    if (!active) return undefined;
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
      if ((event.key === "Delete" || event.key === "Backspace") && objectSelection && !editingObjectId) {
        event.preventDefault();
        deleteSelectedObjects();
      }
      if (event.key === "Escape" && editingObjectId) {
        stopEditingObject();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, undo, redo, selection.ids.length, objectSelection, editingObjectId, deleteSelectedObjects, stopEditingObject]);

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

  const strokes = page?.strokes || [];

  const ink = page
    ? {
        tool,
        onTool: updateTool,
        page,
        pageIndex,
        zoom,
        selection,
        objectSelection,
        setObjectSelection,
        selectedObjectId,
        editingObjectId,
        objects,
        engine: () => engineRef.current,
        canUndo: pastRef.current.length > 0,
        canRedo: futureRef.current.length > 0,
        onUndo: undo,
        onRedo: redo,
        onZoom: (factor) => engineRef.current?.zoomBy(factor),
        onFit: () => engineRef.current?.fit(),
        onClear: clearPage,
        onPickColor: handlePickColor,
        onPaper: updatePaper,
        onPage: goPage,
        recognition,
        onRecognize: recognize,
        onInsertText: insertText,
        handwriting,
        onSearch: searchHandwriting,
        recording,
        replay,
        onRecord: startRecording,
        onStop: stopRecording,
        onPlay: togglePlay,
        onReplayInk: replayInk,
        onScrub: scrub,
        onClearAudio: clearAudio,
        onOpenPage,
        // Object management
        addObject,
        updateObject,
        deleteObject,
        deleteSelectedObjects,
        bringToFront,
        sendToBack,
        startEditingObject,
        stopEditingObject,
        onSelectObject,
        SHAPE_TYPES,
        STICKERS,
        OBJECT_TYPES,
      }
    : null;

  const board = {
    strokes,
    objects,
    paper: page?.paper,
    tool,
    initialCamera: page?.camera,
    onCommit: handleCommit,
    onReplace: handleReplace,
    onSelection: handleSelection,
    onCamera: handleCamera,
    onPickColor: handlePickColor,
    onEngine: handleEngine,
    onInsertSpaceLimited: handleInsertSpaceLimited,
  };

  return { loading, page, status, ink, board, markCount: strokes.length, pageIndex, patch, objects };
}
