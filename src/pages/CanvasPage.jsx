import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Moon,
  Sun,
  Info,
  Plus,
  SlidersHorizontal,
  PenTool,
  MousePointer2,
  Hand,
  Link as LinkIcon,
  Minus,
  Maximize2,
  RotateCcw,
  Layers,
  Square,
  Type,
  Image,
  FileText,
  Layout,
  Upload,
  FileText as FileTextIcon,
  Image as ImageIcon,
  MoreHorizontal,
  Highlighter,
  Eraser,
  LassoSelect,
  Shapes,
  Wand2,
  SquareStack,
  Cable,
  StickyNote,
  Sticker,
  ImagePlus,
  Frame,
  Grid3x3,
  BringToFront,
  SendToBack,
  CopyPlus,
  Trash2,
  Undo2,
  Redo2,
  Circle,
  ArrowRight,
  Triangle,
  Hexagon,
  Clipboard,
} from "lucide-react";
import { db } from "@/api/localDb";
import CanvasBoard from "@/components/canvas/CanvasBoard";
import ThemeToggle from "@/components/shell/ThemeToggle";
import { useFocusMode } from "@/lib/focusMode";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { OBJECT_TYPES, FRAME_TYPES, STICKERS, createObject, getDefaultSize } from "@/lib/canvas/objects";
import { exportCanvasDoc, triggerImport, exportCanvasToPdf, exportCanvasToPng } from "@/lib/canvas/export";
import { addAttachment } from "@/lib/attachments";
import { toast } from "@/lib/toast";
import RibbonButton from "@/components/ribbon/RibbonButton";
import { RibbonSelect, RibbonMenu, MenuItem, MenuLabel } from "@/components/ribbon/RibbonKit";
import SpaceRail from "@/components/shell/SpaceRail";
import CommandPalette from "@/components/shell/CommandPalette";
import { NoteTopStack } from "@/lib/ScrollContext";
import { t } from "@/lib/i18n";
import { CANVAS_TOOLS, getToolById } from "@/lib/canvas/tool-defs";

// Local t function that prefixes with vault.canvas
const ct = (key, params) => t(String(key).startsWith("vault.canvas.") ? key : `vault.canvas.${key}`, params);

const PEN_COLORS = [
  { value: "#000000", label: "Black" },
  { value: "#e5b567", label: "Amber" },
  { value: "#f87171", label: "Red" },
  { value: "#4ade80", label: "Green" },
  { value: "#60a5fa", label: "Blue" },
  { value: "#a78bfa", label: "Purple" },
  { value: "#ffffff", label: "White" },
];

const PEN_WIDTHS = [1, 2, 3, 4, 6, 8, 12];

export default function CanvasPage() {
  const { t, localDigits } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const { focus } = useFocusMode();
  // The canvas page has no note-tabs row, so the sticky toolbar must start at the very top of the window.
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.getPropertyValue("--nb-tabs-h");
    root.style.setProperty("--nb-tabs-h", "0px");
    return () => {
      if (previous) root.style.setProperty("--nb-tabs-h", previous);
      else root.style.removeProperty("--nb-tabs-h");
    };
  }, []);
  const [canvasDoc, setCanvasDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [pendingConnectorFrom, setPendingConnectorFrom] = useState(null);
  const [status, setStatus] = useState("idle");
  const [tool, setTool] = useState({ mode: "select", color: "#000000", width: 3 });
  const [paper, setPaper] = useState({ template: "grid", size: "infinite", tone: "auto" });
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [clipboard, setClipboard] = useState([]);
  const [stickerPopover, setStickerPopover] = useState({ open: false, x: 0, y: 0 });
  const dirty = useRef(false);
  const engineRef = useRef(null);

  // Load canvas doc
  useEffect(() => {
    let active = true;
    setLoading(true);
    db.entities.CanvasDoc.get(id)
      .then((record) => {
        if (!active) return;
        setCanvasDoc(record);
        setPaper(record.paper || { template: "grid", size: "infinite", tone: "auto" });
        setCamera(record.camera || { x: 0, y: 0, scale: 1 });
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setCanvasDoc(null);
        setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  // Auto-fit to frame width on first load in design mode
  const fittedRef = useRef(false);
  useEffect(() => {
    if (fittedRef.current) return;
    if (!canvasDoc) return;
    if (!engineRef.current) return;
    
    const frames = canvasDoc.objects?.filter((o) => o.type === OBJECT_TYPES.FRAME) || [];
    if (frames.length === 0) return;
    
    const cam = canvasDoc.camera || { x: 0, y: 0, scale: 1 };
    if (cam.x === 0 && cam.y === 0 && cam.scale === 1) {
      setTimeout(() => {
        engineRef.current?.fitWidth?.();
        fittedRef.current = true;
      }, 100);
    } else {
      fittedRef.current = true;
    }
  }, [canvasDoc]);

  // Ctrl+K palette
  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close popovers on outside click
  useEffect(() => {
    const onClick = (event) => {
      if (fileMenuOpen && !event.target.closest('[data-file-menu]')) {
        setFileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [fileMenuOpen]);

  // Save canvas doc
  // Undo / redo history. Every content change (strokes or objects) goes through saveCanvasDoc,
  // so one snapshot per gesture is kept here. Changes that arrive within 350 ms of each other
  // (a drag, a pen stroke) count as one step.
  const historyRef = useRef({ past: [], future: [], lastSave: 0 });
  const [histCounts, setHistCounts] = useState({ u: 0, r: 0 });

  const saveCanvasDoc = useCallback(async (updates, options = {}) => {
    if (!canvasDoc) return;
    const h = historyRef.current;
    if (options.history !== false && ("strokes" in updates || "objects" in updates)) {
      const now = Date.now();
      if (now - h.lastSave > 350) {
        h.past.push({ strokes: canvasDoc.strokes || [], objects: canvasDoc.objects || [] });
        if (h.past.length > 80) h.past.shift();
        h.future = [];
        setHistCounts({ u: h.past.length, r: 0 });
      }
      h.lastSave = now;
    }
    dirty.current = true;
    setStatus("saving");
    const updated = { ...canvasDoc, ...updates };
    setCanvasDoc(updated);
    clearTimeout(saveCanvasDoc.timer);
    saveCanvasDoc.timer = setTimeout(async () => {
      try {
        await db.entities.CanvasDoc.update(id, updated);
        dirty.current = false;
        setStatus("saved");
      } catch (e) {
        setStatus("idle");
      }
    }, 650);
  }, [canvasDoc, id]);

  const applyHistory = useCallback((direction) => {
    if (!canvasDoc) return;
    const h = historyRef.current;
    const from = direction === "undo" ? h.past : h.future;
    const to = direction === "undo" ? h.future : h.past;
    if (!from.length) return;
    const snapshot = from.pop();
    to.push({ strokes: canvasDoc.strokes || [], objects: canvasDoc.objects || [] });
    h.lastSave = 0;
    setSelectedIds([]);
    setHistCounts({ u: h.past.length, r: h.future.length });
    saveCanvasDoc({ strokes: snapshot.strokes, objects: snapshot.objects }, { history: false });
  }, [canvasDoc, saveCanvasDoc]);
  const undoHistory = useCallback(() => applyHistory("undo"), [applyHistory]);
  const redoHistory = useCallback(() => applyHistory("redo"), [applyHistory]);

  // Tool selection
  const selectTool = useCallback((mode) => {
    setTool((prev) => ({ ...prev, mode }));
    if (mode === "addCard" || mode === "addConnector") {
      setPendingConnectorFrom(null);
    }
  }, []);

  // Handle card creation
  const handleAddCard = useCallback((worldX, worldY) => {
    if (!canvasDoc) return;
    const size = getDefaultSize(OBJECT_TYPES.CARD);
    const newCard = createObject(OBJECT_TYPES.CARD, worldX - size.width / 2, worldY - size.height / 2, size.width, size.height);
    const updatedObjects = [...canvasDoc.objects, newCard];
    saveCanvasDoc({ objects: updatedObjects });
    setSelectedIds([newCard.id]);
    selectTool("select");
  }, [canvasDoc, saveCanvasDoc, selectTool]);

  // Handle design mode object creation (frames, media, objects)
  const handleAddDesignObject = useCallback((type, worldX, worldY, overrides = {}) => {
    if (!canvasDoc) return;
    const size = getDefaultSize(type, overrides.shapeType || overrides.frameType);
    
    // For frames: place to the right of the last frame with 40px gap
    let x = worldX - size.width / 2;
    let y = worldY - size.height / 2;
    
    if (type === OBJECT_TYPES.FRAME) {
      const frames = canvasDoc.objects?.filter((o) => o.type === OBJECT_TYPES.FRAME) || [];
      if (frames.length > 0) {
        // Find the rightmost frame
        const rightmostFrame = frames.reduce((max, frame) => 
          (frame.x + frame.width) > (max.x + max.width) ? frame : max
        );
        x = rightmostFrame.x + rightmostFrame.width + 40; // 40px gap
        y = rightmostFrame.y; // Align vertically with the last frame
      }
    }
    
    const newObject = createObject(type, x, y, size.width, size.height, overrides);
    const updatedObjects = [...canvasDoc.objects, newObject];
    saveCanvasDoc({ objects: updatedObjects });
    setSelectedIds([newObject.id]);
    selectTool("select");
  }, [canvasDoc, saveCanvasDoc, selectTool]);

  // Handle connector creation
  const handleConnectorStart = useCallback((objectId) => {
    setPendingConnectorFrom(objectId);
  }, []);

  const handleConnectorEnd = useCallback((targetId) => {
    if (!pendingConnectorFrom || pendingConnectorFrom === targetId || !canvasDoc) {
      setPendingConnectorFrom(null);
      return;
    }
    const exists = canvasDoc.objects.some(
      (obj) => obj.type === OBJECT_TYPES.CONNECTOR &&
        ((obj.from === pendingConnectorFrom && obj.to === targetId) || (obj.from === targetId && obj.to === pendingConnectorFrom))
    );
    if (!exists) {
      const newConnector = createObject(OBJECT_TYPES.CONNECTOR, 0, 0, 0, 0, {
        from: pendingConnectorFrom,
        to: targetId,
        style: "straight",
        stroke: "#e5b567",
        strokeWidth: 2,
        endArrow: true,
      });
      saveCanvasDoc({ objects: [...canvasDoc.objects, newConnector] });
    }
    setPendingConnectorFrom(null);
  }, [pendingConnectorFrom, canvasDoc, saveCanvasDoc]);

  // Handle connector creation from CanvasBoard (onCreateConnector)
  const handleCreateConnector = useCallback((fromId, toId) => {
    if (!canvasDoc || fromId === toId) return;
    const exists = canvasDoc.objects.some(
      (obj) => obj.type === OBJECT_TYPES.CONNECTOR &&
        ((obj.from === fromId && obj.to === toId) || (obj.from === toId && obj.to === fromId))
    );
    if (!exists) {
      const newConnector = createObject(OBJECT_TYPES.CONNECTOR, 0, 0, 0, 0, {
        from: fromId,
        to: toId,
        style: "straight",
        stroke: "#e5b567",
        strokeWidth: 2,
        endArrow: true,
      });
      saveCanvasDoc({ objects: [...canvasDoc.objects, newConnector] });
    }
  }, [canvasDoc, saveCanvasDoc]);

  // Handle image insertion - open file picker and store file
  const handleAddImage = useCallback(async (worldX, worldY) => {
    if (!canvasDoc) return;
    
    // Create file input and trigger click
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/svg+xml";
    input.style.display = "none";
    
    input.addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      try {
        // Store file using the attachment system
        const attachment = await addAttachment(file);
        
        // Create image object with local: reference
        const size = getDefaultSize(OBJECT_TYPES.IMAGE);
        // Scale to max 400px wide
        const maxWidth = 400;
        let { width, height } = size;
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = height * ratio;
        }
        
        const newImage = createObject(OBJECT_TYPES.IMAGE, worldX - width / 2, worldY - height / 2, width, height, {
          src: attachment.ref,
          alt: file.name,
        });
        
        saveCanvasDoc({ objects: [...canvasDoc.objects, newImage] });
        setSelectedIds([newImage.id]);
        selectTool("select");
      } catch (err) {
        console.error("Failed to add image:", err);
        toast.error(ct("insert.media.imageError") || "Failed to add image");
      }
    });
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }, [canvasDoc, saveCanvasDoc, selectTool]);

  // Handle sticker selection from popover
  const handleStickerSelect = useCallback((stickerId, worldX, worldY) => {
    if (!canvasDoc) return;
    const size = getDefaultSize(OBJECT_TYPES.STICKER);
    const newSticker = createObject(OBJECT_TYPES.STICKER, worldX - size.width / 2, worldY - size.height / 2, size.width, size.height, {
      stickerId,
    });
    saveCanvasDoc({ objects: [...canvasDoc.objects, newSticker] });
    setSelectedIds([newSticker.id]);
    selectTool("select");
    setStickerPopover({ open: false, x: 0, y: 0 });
  }, [canvasDoc, saveCanvasDoc, selectTool]);

  // Object selection
  const handleSelectObject = useCallback((id, event) => {
    // Handle array of IDs (from drag-rectangle selection)
    if (Array.isArray(id)) {
      setSelectedIds(id);
      setPendingConnectorFrom(null);
      return;
    }
    if (!id) {
      setSelectedIds([]);
      setPendingConnectorFrom(null);
      return;
    }
    const isMulti = event?.ctrlKey || event?.metaKey || event?.shiftKey;
    setSelectedIds((prev) => {
      if (isMulti) {
        return prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      }
      return prev.includes(id) ? prev : [id];
    });
    if (!isMulti) setPendingConnectorFrom(null);
  }, []);

  // Object update
  const handleUpdateObject = useCallback((objectId, changes) => {
    if (!canvasDoc) return;
    const updatedObjects = canvasDoc.objects.map((obj) =>
      obj.id === objectId ? { ...obj, ...changes } : obj
    );
    saveCanvasDoc({ objects: updatedObjects });
  }, [canvasDoc, saveCanvasDoc]);

  // Object delete
  const handleDeleteObject = useCallback((objectId) => {
    if (!canvasDoc) return;
    const updatedObjects = canvasDoc.objects.filter(
      (obj) => obj.id !== objectId && !(obj.type === OBJECT_TYPES.CONNECTOR && (obj.from === objectId || obj.to === objectId))
    );
    saveCanvasDoc({ objects: updatedObjects });
    setSelectedIds((prev) => prev.filter((id) => id !== objectId));
  }, [canvasDoc, saveCanvasDoc]);

  // Object duplicate
  const handleDuplicateObject = useCallback((objectId, newObject) => {
    if (!canvasDoc) return;
    const updatedObjects = [...canvasDoc.objects, newObject];
    saveCanvasDoc({ objects: updatedObjects });
    setSelectedIds([newObject.id]);
  }, [canvasDoc, saveCanvasDoc]);

  // Paper change
  const handlePaperChange = useCallback((changes) => {
    setPaper((prev) => ({ ...prev, ...changes }));
    saveCanvasDoc({ paper: { ...paper, ...changes } });
  }, [paper, saveCanvasDoc]);

  // Camera change
  const handleCameraChange = useCallback((newCamera) => {
    setCamera(newCamera);
    saveCanvasDoc({ camera: newCamera });
  }, [saveCanvasDoc]);

  // Stroke commit (from ink engine)
  const handleCommit = useCallback((strokes) => {
    if (!canvasDoc) return;
    saveCanvasDoc({ strokes: [...canvasDoc.strokes, ...strokes] });
  }, [canvasDoc, saveCanvasDoc]);

  // Stroke replace
  const handleReplace = useCallback((strokes) => {
    if (!canvasDoc) return;
    saveCanvasDoc({ strokes });
  }, [canvasDoc, saveCanvasDoc]);

  // Derived values from canvasDoc (must be before handleToolAction and keyboard shortcuts)
  const strokes = canvasDoc?.strokes || [];
  const objects = canvasDoc?.objects || [];
  const selectedObjects = objects.filter((o) => selectedIds.includes(o.id));
  const cards = objects.filter((o) => o.type === OBJECT_TYPES.CARD);
  const connectors = objects.filter((o) => o.type === OBJECT_TYPES.CONNECTOR);

  // Stats for status bar
  const markCount = strokes.length;
  const markLabel = markCount === 1 
    ? ct("status.marks", { count: localDigits(markCount) }) 
    : ct("status.marks_plural", { count: localDigits(markCount) });

  // Action handlers for tools (must be defined before keyboard shortcuts useEffect)
  const handleToolAction = useCallback((btn) => {
    if (!engineRef.current) return;
    const viewport = engineRef.current.viewport || { w: 800, h: 600 };
    const camera = engineRef.current.camera || { x: 0, y: 0, scale: 1 };
    const centerX = -camera.x / camera.scale + viewport.w / (2 * camera.scale);
    const centerY = -camera.y / camera.scale + viewport.h / (2 * camera.scale);

    switch (btn.id) {
      case "addCard":
        handleAddCard(centerX, centerY);
        break;
      case "addTextBox":
        handleAddDesignObject(OBJECT_TYPES.TEXTBOX, centerX, centerY);
        break;
      case "addSticky":
        handleAddDesignObject(OBJECT_TYPES.STICKY, centerX, centerY);
        break;
      case "addSticker":
        // Open sticker popover at center of viewport
        setStickerPopover({ open: true, x: centerX, y: centerY });
        break;
      case "addImage":
        // Open file picker for image
        handleAddImage(centerX, centerY);
        break;
      case "duplicate":
        if (selectedIds.length > 0) {
          const newObjects = selectedIds.map((id) => {
            const obj = objects.find((o) => o.id === id);
            if (!obj) return null;
            const copy = { ...obj, id: `obj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, x: obj.x + 20, y: obj.y + 20 };
            return copy;
          }).filter(Boolean);
          saveCanvasDoc({ objects: [...objects, ...newObjects] });
          setSelectedIds(newObjects.map((o) => o.id));
        }
        break;
      case "copy":
        if (selectedIds.length > 0) {
          const copiedObjects = selectedIds.map((id) => objects.find((o) => o.id === id)).filter(Boolean);
          setClipboard(copiedObjects);
          toast.success(ct("clipboard.copied") || "Copied to clipboard");
        }
        break;
      case "paste":
        if (clipboard.length > 0) {
          const viewport = engineRef.current?.viewport || { w: 800, h: 600 };
          const camera = engineRef.current?.camera || { x: 0, y: 0, scale: 1 };
          const centerX = -camera.x / camera.scale + viewport.w / (2 * camera.scale);
          const centerY = -camera.y / camera.scale + viewport.h / (2 * camera.scale);
          
          const newObjects = clipboard.map((obj, index) => ({
            ...obj,
            id: `obj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
            x: centerX + index * 20,
            y: centerY + index * 20,
            zOrder: Date.now() + index,
          }));
          saveCanvasDoc({ objects: [...objects, ...newObjects] });
          setSelectedIds(newObjects.map((o) => o.id));
        }
        break;
      case "bringForward":
        if (selectedIds.length > 0) {
          // Find the highest zOrder among selected objects
          const selectedObjects = objects.filter((o) => selectedIds.includes(o.id));
          const maxSelectedZ = Math.max(...selectedObjects.map((o) => o.zOrder || 0), 0);
          
          // Find the next zOrder above the highest selected
          const allZOrders = objects.map((o) => o.zOrder || 0).sort((a, b) => a - b);
          const nextZ = allZOrders.find((z) => z > maxSelectedZ) || maxSelectedZ + 1;
          
          const updatedObjects = objects.map((obj) => {
            if (selectedIds.includes(obj.id)) {
              return { ...obj, zOrder: nextZ };
            }
            // Shift objects in between down by 1
            if ((obj.zOrder || 0) > maxSelectedZ && (obj.zOrder || 0) <= nextZ) {
              return { ...obj, zOrder: (obj.zOrder || 0) - 1 };
            }
            return obj;
          });
          saveCanvasDoc({ objects: updatedObjects });
        }
        break;
      case "sendBackward":
        if (selectedIds.length > 0) {
          // Find the lowest zOrder among selected objects
          const selectedObjects = objects.filter((o) => selectedIds.includes(o.id));
          const minSelectedZ = Math.min(...selectedObjects.map((o) => o.zOrder || 0), 0);
          
          // Find the next zOrder below the lowest selected
          const allZOrders = objects.map((o) => o.zOrder || 0).sort((a, b) => b - a);
          const prevZ = allZOrders.find((z) => z < minSelectedZ) || minSelectedZ - 1;
          
          const updatedObjects = objects.map((obj) => {
            if (selectedIds.includes(obj.id)) {
              return { ...obj, zOrder: prevZ };
            }
            // Shift objects in between up by 1
            if ((obj.zOrder || 0) < minSelectedZ && (obj.zOrder || 0) >= prevZ) {
              return { ...obj, zOrder: (obj.zOrder || 0) + 1 };
            }
            return obj;
          });
          saveCanvasDoc({ objects: updatedObjects });
        }
        break;
      case "delete":
        selectedIds.forEach((id) => handleDeleteObject(id));
        break;
      case "undo":
        undoHistory();
        break;
      case "redo":
        redoHistory();
        break;
      default:
        break;
    }
  }, [engineRef, objects, selectedIds, saveCanvasDoc, clipboard, handleAddCard, handleAddDesignObject, handleDeleteObject, handleAddImage, handleStickerSelect, undoHistory, redoHistory]);

  // Tool groups for compact bar row 2 - from tool-defs.js
  const isPenActive = tool.mode === "draw";
  const isEraserActive = tool.mode === "erase";
  const isShapeActive = tool.mode === "shape";
  const isHighlighterActive = tool.mode === "highlighter";
  const showPenControls = isPenActive || isEraserActive || isShapeActive || isHighlighterActive;

  // Build tool groups from CANVAS_TOOLS
  const row2Groups = useMemo(() => {
    const groups = {};
    CANVAS_TOOLS.forEach((toolDef) => {
      if (!groups[toolDef.group]) {
        groups[toolDef.group] = { separator: toolDef.group !== "navigation", buttons: [] };
      }
      // Determine if tool should be disabled
      let disabled = false;
      let disabledReason = "";
      if (toolDef.requiresSelection && selectedIds.length === 0) {
        disabled = true;
        disabledReason = ct("home.clipboard.selectFirst") || "Select an object first";
      }
      // Special case for addConnector - enabled when pendingConnectorFrom OR selectedIds.length > 0
      if (toolDef.id === "addConnector") {
        disabled = !pendingConnectorFrom && selectedIds.length === 0;
        if (disabled) {
          disabledReason = ct("insert.cards.connectDisabled") || "Select a card or start a connection first";
        }
      }
      // Special case for duplicate - needs selection
      if (toolDef.id === "duplicate") {
        disabled = selectedIds.length === 0;
        if (disabled) {
          disabledReason = ct("home.clipboard.selectFirst") || "Select an object first";
        }
      }
      // Special case for delete - needs selection
      if (toolDef.id === "delete") {
        disabled = selectedIds.length === 0;
        if (disabled) {
          disabledReason = ct("home.clipboard.selectFirst") || "Select an object first";
        }
      }
      if (toolDef.id === "undo" || toolDef.id === "redo") {
        disabled = toolDef.id === "undo" ? histCounts.u === 0 : histCounts.r === 0;
        disabledReason = toolDef.id === "undo"
          ? (ct("home.undoDisabled") || "Nothing to undo")
          : (ct("home.redoDisabled") || "Nothing to redo");
      }

      groups[toolDef.group].buttons.push({
        ...toolDef,
        label: ct(toolDef.labelKey),
        hint: ct(toolDef.hintKey),
        disabled,
        disabledReason,
      });
    });
    // Convert to array in group order
    const groupOrder = ["navigation", "drawing", "insert", "arrange", "history"];
    return groupOrder
      .filter((g) => groups[g])
      .map((g) => groups[g]);
  }, [tool.mode, tool.shapeRecognition, pendingConnectorFrom, selectedIds.length]);

  // Keyboard shortcuts for tools
  useEffect(() => {
    const onKeyDown = (event) => {
      // Don't trigger shortcuts when typing in input/textarea
      const target = event.target;
      const isTyping = target.tagName === "INPUT" || 
                       target.tagName === "TEXTAREA" || 
                       target.isContentEditable ||
                       target.closest('[contenteditable="true"]');
      if (isTyping) return;

      const isCtrl = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;
      const key = event.key.toLowerCase();

      // Handle modifier+key shortcuts
      if (isCtrl && !event.altKey) {
        switch (key) {
          case "d": // Ctrl+D - Duplicate
            event.preventDefault();
            handleToolAction(getToolById("duplicate"));
            return;
          case "c": // Ctrl+C - Copy
            event.preventDefault();
            handleToolAction(getToolById("copy"));
            return;
          case "v": // Ctrl+V - Paste
            event.preventDefault();
            handleToolAction(getToolById("paste"));
            return;
          case "]": // Ctrl+] - Bring Forward
            event.preventDefault();
            handleToolAction(getToolById("bringForward"));
            return;
          case "[": // Ctrl+[ - Send Backward
            event.preventDefault();
            handleToolAction(getToolById("sendBackward"));
            return;
          case "z": // Ctrl+Z undo, Ctrl+Shift+Z redo
            if (isTyping) return;
            event.preventDefault();
            if (isShift) redoHistory(); else undoHistory();
            return;
          case "y": // Ctrl+Y redo
            if (isTyping) return;
            event.preventDefault();
            redoHistory();
            return;
        }
      }

      // Arrow keys for nudging selected objects
      if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        if (selectedIds.length > 0) {
          event.preventDefault();
          const step = isShift ? 10 : 1;
          const dx = key === "arrowright" ? step : key === "arrowleft" ? -step : 0;
          const dy = key === "arrowdown" ? step : key === "arrowup" ? -step : 0;
          
          const updatedObjects = objects.map((obj) => {
            if (selectedIds.includes(obj.id)) {
              return { ...obj, x: (obj.x || 0) + dx, y: (obj.y || 0) + dy };
            }
            return obj;
          });
          saveCanvasDoc({ objects: updatedObjects });
        }
        return;
      }

      // Handle Delete key
      if (key === "delete" || key === "backspace") {
        if (selectedIds.length > 0 && !isTyping) {
          event.preventDefault();
          handleToolAction(getToolById("delete"));
        }
        return;
      }

      // Handle simple key shortcuts (no modifiers)
      if (!isCtrl && !event.altKey && !isShift) {
        const toolDef = CANVAS_TOOLS.find((t) => t.shortcut && t.shortcut.toLowerCase() === key && !t.shortcut.includes("+"));
        if (toolDef) {
          event.preventDefault();
          if (toolDef.type === "mode") {
            selectTool(toolDef.id);
          } else if (toolDef.type === "action") {
            if (toolDef.id === "addTextBox") {
              if (engineRef.current) {
                const viewport = engineRef.current.viewport || { w: 800, h: 600 };
                const camera = engineRef.current.camera || { x: 0, y: 0, scale: 1 };
                const centerX = -camera.x / camera.scale + viewport.w / (2 * camera.scale);
                const centerY = -camera.y / camera.scale + viewport.h / (2 * camera.scale);
                handleAddDesignObject(OBJECT_TYPES.TEXTBOX, centerX, centerY);
              }
            }
          } else if (toolDef.type === "toggle") {
            setTool((prev) => ({ ...prev, shapeRecognition: !prev.shapeRecognition }));
          }
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectTool, engineRef, pendingConnectorFrom, selectedIds, objects, saveCanvasDoc, handleToolAction]);

  // Icon component mapping
  const iconMap = {
    MousePointer2,
    Hand,
    PenTool,
    Highlighter,
    Eraser,
    LassoSelect,
    Shapes,
    Wand2,
    SquareStack,
    Cable,
    Type,
    StickyNote,
    Sticker,
    ImagePlus,
    Frame,
    Grid3x3,
    BringToFront,
    SendToBack,
    CopyPlus,
    Trash2,
    Undo2,
    Redo2,
    Square,
    Circle,
    ArrowRight,
    Triangle,
    Hexagon,
    Minus,
    LinkIcon,
    Layout,
    Layers,
    Plus,
    FileText,
    Image,
    Maximize2,
    RotateCcw,
    ArrowLeft,
    MoreHorizontal,
    Sun,
    Moon,
    Info,
    SlidersHorizontal,
    Upload,
    Clipboard,
  };

  // Helper to get icon component
  const getIcon = (iconName) => iconMap[iconName] || Square;

  // Helper to build tooltip with shortcut
  const buildHint = (hint, shortcut) => {
    if (shortcut) {
      return `${hint} (${shortcut})`;
    }
    return hint;
  };

  if (loading) {
    return (
      <div className="nb-shell min-h-screen">
        <SpaceRail />
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        <main className={cn("mx-auto px-4 pb-10 pt-5 sm:px-6", focus && "pr-12")}>
          <div className="h-[60vh] animate-pulse rounded-xl border border-border/60 bg-card/30" />
        </main>
      </div>
    );
  }

  if (!canvasDoc) {
    return (
      <div className="nb-shell min-h-screen">
        <SpaceRail />
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        <main className={cn("mx-auto px-4 pb-10 pt-5 sm:px-6", focus && "pr-12")}>
          <div className="mx-auto max-w-xl px-5 py-24 text-center">
            <p className="font-display text-[26px]">{ct("emptyState.noCanvases")}</p>
            <button
              onClick={() => navigate("/canvas/new")}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-primary-foreground transition hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              {ct("emptyState.newCanvas")}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="nb-shell min-h-screen">
      <SpaceRail />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <main className="m-0 p-0">
        {/* Compact toolbar - two rows inside NoteTopStack for sticky behavior */}
        <NoteTopStack>
          <div data-crumb data-testid="canvas-toolbar-area">
            {/* Row 1: Back, name, status, actions */}
            <div className="flex items-center gap-2 h-9 px-2 border-b border-border/40">
              <Link
                to="/canvas"
                className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition hover:text-foreground shrink-0"
                aria-label={t("vault.canvas.backToCanvases")}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("vault.canvas.backToCanvases")}
              </Link>
              <span className="text-[11px] text-muted-foreground/40 shrink-0">/</span>

              {/* Editable canvas name - width fits content */}
              <input
                value={canvasDoc.name}
                onChange={(event) => saveCanvasDoc({ name: event.target.value })}
                aria-label={t("vault.canvas.canvasName")}
                className="max-w-[28ch] min-w-[8ch] rounded-md border border-transparent bg-transparent px-1 py-0.5 font-display text-[16px] tracking-tight text-foreground outline-none transition hover:border-border/60 focus:border-primary/40"
                style={{ width: `${Math.min(Math.max(canvasDoc.name.length, 8), 28)}ch` }}
              />

              {/* Status */}
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground shrink-0">
                {t(`vault.canvas.status.${status}`)}
              </span>

              <div className="flex-1" />

              {/* Undo/Redo */}
              <RibbonButton
                id="undo"
                icon={Undo2}
                label={ct("ribbon.home.undo")}
                hint={ct("ribbon.home.undoHint")}
                onClick={undoHistory}
                disabled={histCounts.u === 0}
                disabledReason={ct("home.undoDisabled") || "Nothing to undo"}
                keepFocus={false}
                className="h-8 w-8"
              />
              <RibbonButton
                id="redo"
                icon={Redo2}
                label={ct("ribbon.home.redo")}
                hint={ct("ribbon.home.redoHint")}
                onClick={redoHistory}
                disabled={histCounts.r === 0}
                disabledReason={ct("home.redoDisabled") || "Nothing to redo"}
                keepFocus={false}
                className="h-8 w-8"
              />

              {/* Zoom controls */}
              <div className="flex items-center gap-1 border-l border-border/40 pl-2 ml-2">
                <RibbonButton
                  icon={Minus}
                  label={ct("view.zoomOut")}
                  hint={ct("view.zoomOutHint")}
                  onClick={() => engineRef.current?.zoomBy?.(0.88)}
                  keepFocus={false}
                  className="h-8 w-8"
                />
                <span className="self-center font-mono text-[10px] text-muted-foreground px-1 min-w-[3.5ch] text-center">
                  {ct("view.zoomPercent", { percent: Math.round(camera.scale * 100) })}
                </span>
                <RibbonButton
                  icon={Plus}
                  label={ct("view.zoomIn")}
                  hint={ct("view.zoomInHint")}
                  onClick={() => engineRef.current?.zoomBy?.(1.12)}
                  keepFocus={false}
                  className="h-8 w-8"
                />
                <RibbonButton
                  icon={Maximize2}
                  label={ct("view.fitWidth")}
                  hint={ct("view.fitWidthHint")}
                  onClick={() => engineRef.current?.fitWidth?.()}
                  keepFocus={false}
                  className="h-8 w-8"
                />
              </div>

              {/* Theme toggle: the same menu as the note page (Light / Dark / System) */}
              <ThemeToggle />

              {/* File menu */}
              <div className="relative" data-file-menu>
                <RibbonButton
                  icon={MoreHorizontal}
                  label={ct("file.label")}
                  hint={ct("file.label")}
                  onClick={() => setFileMenuOpen(!fileMenuOpen)}
                  keepFocus={false}
                  className="h-8 w-8"
                />
                {fileMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-md border border-border bg-popover p-1 shadow-lg">
                    <MenuItem onClick={() => { exportCanvasDoc(canvasDoc); setFileMenuOpen(false); }}>
                      <FileTextIcon className="h-4 w-4 mr-2" />
                      {ct("file.exportCanvas")}
                    </MenuItem>
                    <hr className="my-1 border-border" />
                    <MenuLabel>{ct("file.exportPdf")}</MenuLabel>
                    <MenuItem onClick={() => { exportCanvasToPdf(canvasDoc, { wholeCanvas: true }); setFileMenuOpen(false); }}>
                      <FileTextIcon className="h-4 w-4 mr-2" />
                      {ct("file.exportWholeCanvas")} (PDF)
                    </MenuItem>
                    <MenuItem onClick={() => {
                      const frames = canvasDoc.objects?.filter(o => o.type === "frame") || [];
                      if (frames.length === 1) {
                        exportCanvasToPdf(canvasDoc, { wholeCanvas: false, selectedFrameId: frames[0].id });
                      } else if (frames.length > 1) {
                        toast.info(t("vault.canvas.selectFrameFirst") || "Select a frame first");
                      } else {
                        exportCanvasToPdf(canvasDoc, { wholeCanvas: true });
                      }
                      setFileMenuOpen(false);
                    }}>
                      <FileTextIcon className="h-4 w-4 mr-2" />
                      {ct("file.exportSelectedFrame")} (PDF)
                    </MenuItem>
                    <hr className="my-1 border-border" />
                    <MenuLabel>{ct("file.exportPng")}</MenuLabel>
                    <MenuItem onClick={() => { exportCanvasToPng(canvasDoc, { wholeCanvas: true }); setFileMenuOpen(false); }}>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      {ct("file.exportWholeCanvas")} (PNG)
                    </MenuItem>
                    <MenuItem onClick={() => {
                      const frames = canvasDoc.objects?.filter(o => o.type === "frame") || [];
                      if (frames.length === 1) {
                        exportCanvasToPng(canvasDoc, { wholeCanvas: false, selectedFrameId: frames[0].id });
                      } else if (frames.length > 1) {
                        toast.info(t("vault.canvas.selectFrameFirst") || "Select a frame first");
                      } else {
                        exportCanvasToPng(canvasDoc, { wholeCanvas: true });
                      }
                      setFileMenuOpen(false);
                    }}>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      {ct("file.exportSelectedFrame")} (PNG)
                    </MenuItem>
                    <hr className="my-1 border-border" />
                    <MenuItem onClick={() => { triggerImport(
                      (doc) => { navigate(`/canvas/${doc.id}`); toast.success(t("vault.canvas.importSuccess") || "Canvas imported successfully"); },
                      (error) => toast.error(error.message)
                    ); setFileMenuOpen(false); }}>
                      <Upload className="h-4 w-4 mr-2" />
                      {ct("file.importCanvas")}
                    </MenuItem>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Icon-only tool groups */}
            <div className="flex items-center gap-1 h-10 px-2 overflow-x-auto pb-1 border-b border-border/40" role="toolbar" aria-label={ct("toolbar.label") || "Canvas tools"}>
              {row2Groups.map((group, groupIdx) => (
                <React.Fragment key={groupIdx}>
                  {group.separator && <div className="w-px h-6 bg-border/40 mx-1" />}
                  <div className="flex items-center gap-0.5">
                    {group.buttons.map((btn) => {
                      const Icon = getIcon(btn.icon);
                      const hintWithShortcut = buildHint(btn.hint, btn.shortcut);
                      const isActive = btn.type === "mode" && tool.mode === btn.id;
                      const isToggleActive = btn.type === "toggle" && tool.shapeRecognition === true;

                      // Menu buttons (addShapeMenu, addFrameMenu, paperMenu)
                      if (btn.type === "menu") {
                        if (btn.id === "addShapeMenu") {
                          return (
                            <RibbonMenu
                              key={btn.id}
                              icon={Icon}
                              label={btn.label}
                              hint={hintWithShortcut}
                              width={200}
                            >
                              {(close) => (
                                <>
                                  <MenuLabel>{ct("insert.objects.shapes")}</MenuLabel>
                                  {btn.menuItems?.map((item) => {
                                    const MenuItemIcon = item.icon ? getIcon(item.icon) : null;
                                    return (
                                      <MenuItem
                                        key={item.id}
                                        onClick={() => {
                                          if (engineRef.current) {
                                            const viewport = engineRef.current.viewport || { w: 800, h: 600 };
                                            const camera = engineRef.current.camera || { x: 0, y: 0, scale: 1 };
                                            const centerX = -camera.x / camera.scale + viewport.w / (2 * camera.scale);
                                            const centerY = -camera.y / camera.scale + viewport.h / (2 * camera.scale);
                                            handleAddDesignObject(OBJECT_TYPES.SHAPE, centerX, centerY, { shapeType: item.shapeType });
                                          }
                                          close();
                                        }}
                                      >
                                        {MenuItemIcon && <MenuItemIcon className="h-4 w-4 mr-2" />}
                                        {ct(item.labelKey)}
                                      </MenuItem>
                                    );
                                  })}
                                </>
                              )}
                            </RibbonMenu>
                          );
                        }
                        if (btn.id === "addFrameMenu") {
                          return (
                            <RibbonMenu
                              key={btn.id}
                              icon={Icon}
                              label={btn.label}
                              hint={hintWithShortcut}
                              width={200}
                            >
                              {(close) => (
                                <>
                                  <MenuLabel>{ct("page.frames.addFrame")}</MenuLabel>
                                  {FRAME_TYPES.map((ft) => (
                                    <MenuItem
                                      key={ft.id}
                                      onClick={() => {
                                        if (engineRef.current) {
                                          const viewport = engineRef.current.viewport || { w: 800, h: 600 };
                                          const camera = engineRef.current.camera || { x: 0, y: 0, scale: 1 };
                                          const centerX = -camera.x / camera.scale + viewport.w / (2 * camera.scale);
                                          const centerY = -camera.y / camera.scale + viewport.h / (2 * camera.scale);
                                          handleAddDesignObject(OBJECT_TYPES.FRAME, centerX, centerY, { frameType: ft.id });
                                        }
                                        close();
                                      }}
                                    >
                                      {t(`vault.canvas.frameTypes.${ft.id}`) || ft.label}
                                    </MenuItem>
                                  ))}
                                </>
                              )}
                            </RibbonMenu>
                          );
                        }
                        if (btn.id === "paperMenu") {
                          return (
                            <RibbonMenu
                              key={btn.id}
                              icon={Icon}
                              label={btn.label}
                              hint={hintWithShortcut}
                              width={200}
                            >
                              {(close) => (
                                <>
                                  <MenuLabel>{ct("page.paper.label")}</MenuLabel>
                                  <hr className="my-1 border-border" />
                                  <MenuLabel>{ct("page.paper.templateHint")}</MenuLabel>
                                  {[
                                    { value: "blank", label: ct("page.paper.blank") },
                                    { value: "ruled", label: ct("page.paper.ruled") },
                                    { value: "grid", label: ct("page.paper.grid") },
                                    { value: "dots", label: ct("page.paper.dots") },
                                    { value: "stave", label: ct("page.paper.stave") },
                                    { value: "iso", label: ct("page.paper.iso") },
                                  ].map((opt) => (
                                    <MenuItem
                                      key={opt.value}
                                      onClick={() => { handlePaperChange({ template: opt.value }); close(); }}
                                    >
                                      {opt.label}
                                    </MenuItem>
                                  ))}
                                  <hr className="my-1 border-border" />
                                  <MenuLabel>{ct("page.paper.sizeHint")}</MenuLabel>
                                  {[
                                    { value: "infinite", label: ct("page.paper.infinite") },
                                    { value: "a4", label: "A4" },
                                    { value: "letter", label: "Letter" },
                                    { value: "3:4", label: "3:4" },
                                    { value: "16:9", label: "16:9" },
                                    { value: "free", label: ct("page.paper.free") },
                                  ].map((opt) => (
                                    <MenuItem
                                      key={opt.value}
                                      onClick={() => { handlePaperChange({ size: opt.value }); close(); }}
                                    >
                                      {opt.label}
                                    </MenuItem>
                                  ))}
                                  <hr className="my-1 border-border" />
                                  <MenuLabel>{ct("page.paper.toneHint")}</MenuLabel>
                                  {[
                                    { value: "auto", label: ct("page.paper.auto") },
                                    { value: "light", label: ct("page.paper.light") },
                                    { value: "dark", label: ct("page.paper.dark") },
                                  ].map((opt) => (
                                    <MenuItem
                                      key={opt.value}
                                      onClick={() => { handlePaperChange({ tone: opt.value }); close(); }}
                                    >
                                      {opt.label}
                                    </MenuItem>
                                  ))}
                                </>
                              )}
                            </RibbonMenu>
                          );
                        }
                      }

                      // Action buttons (addCard, addTextBox, addSticky, addSticker, addImage, duplicate, delete, undo, redo)
                      if (btn.type === "action") {
                        return (
                          <RibbonButton
                            key={btn.id}
                            icon={Icon}
                            label={btn.label}
                            hint={hintWithShortcut}
                            disabled={btn.disabled}
                            disabledReason={btn.disabledReason}
                            onClick={() => handleToolAction(btn)}
                            keepFocus={false}
                            className="h-8 w-8"
                          />
                        );
                      }

                      // Mode buttons (select, pan, draw, highlighter, erase, lasso, shape, addConnector)
                      if (btn.type === "mode") {
                        return (
                          <RibbonButton
                            key={btn.id}
                            icon={Icon}
                            label={btn.label}
                            hint={hintWithShortcut}
                            active={isActive}
                            disabled={btn.disabled}
                            disabledReason={btn.disabledReason}
                            onClick={() => selectTool(btn.id)}
                            keepFocus={false}
                            className="h-8 w-8"
                          />
                        );
                      }

                      // Toggle buttons (shapeRecognition)
                      if (btn.type === "toggle") {
                        return (
                          <RibbonButton
                            key={btn.id}
                            icon={Icon}
                            label={btn.label}
                            hint={hintWithShortcut}
                            active={isToggleActive}
                            onClick={() => setTool((prev) => ({ ...prev, shapeRecognition: !prev.shapeRecognition }))}
                            keepFocus={false}
                            className="h-8 w-8"
                          />
                        );
                      }

                      return null;
                    })}
                  </div>
                </React.Fragment>
              ))}

              {/* Pen controls (color + width) - shown when pen/eraser/shape active */}
              {showPenControls && (
                <React.Fragment>
                  <div className="w-px h-6 bg-border/40 mx-1" />
                  <div className="flex items-center gap-1">
                    {/* Color swatches */}
                    <div className="flex items-center gap-0.5" role="group" aria-label={ct("draw.penLook.color")}>
                      {PEN_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setTool((prev) => ({ ...prev, color: c.value }))}
                          className={`w-6 h-6 rounded border-2 transition ${tool.color === c.value ? "border-primary scale-110" : "border-transparent hover:border-border/40"}`}
                          style={{ backgroundColor: c.value }}
                          aria-label={c.label}
                          title={c.label}
                        />
                      ))}
                    </div>
                    <div className="w-px h-6 bg-border/40 mx-1" />
                    {/* Width control with preview */}
                    <div className="flex items-center gap-1" role="group" aria-label={ct("draw.penLook.width")}>
                      <span className="w-6 h-6 flex items-center justify-center">
                        <span
                          className="rounded-full bg-current"
                          style={{
                            width: `${Math.max(4, tool.width * 2)}px`,
                            height: `${Math.max(4, tool.width * 2)}px`,
                          }}
                        />
                      </span>
                      <RibbonSelect
                        value={String(tool.width || 3)}
                        onChange={(width) => setTool((prev) => ({ ...prev, width: Number(width) }))}
                        options={PEN_WIDTHS.map((w) => ({ value: String(w), label: String(w) }))}
                        className="w-16"
                      />
                    </div>
                  </div>
                </React.Fragment>
              )}
            </div>
          </div>
        </NoteTopStack>

        {/* Canvas area - fills remaining height, full width, no border/radius/shadow */}
        <div
          className={cn(
            "relative min-h-0 flex-1",
            "h-[calc(100vh-78px)]"
          )}
        >
          <CanvasBoard
            ref={engineRef}
            className="h-full w-full"
            kind="design"
            strokes={strokes}
            objects={objects}
            paper={paper}
            tool={tool}
            initialCamera={camera}
            onCommit={handleCommit}
            onReplace={handleReplace}
            onCamera={handleCameraChange}
            onSelectObject={handleSelectObject}
            onUpdateObject={handleUpdateObject}
            onDeleteObject={handleDeleteObject}
            onDuplicateObject={handleDuplicateObject}
            onCreateConnector={handleCreateConnector}
            selectedObjectIds={selectedIds}
            pendingConnectorFrom={pendingConnectorFrom}
            setPendingConnectorFrom={setPendingConnectorFrom}
            autoFit
            transparent
          />

          {/* Sticker popover */}
          {stickerPopover.open && engineRef.current && (() => {
            const viewport = engineRef.current.viewport || { w: 800, h: 600 };
            const camera = engineRef.current.camera || { x: 0, y: 0, scale: 1 };
            // Convert world coordinates to screen
            const screenX = stickerPopover.x * camera.scale + camera.x;
            const screenY = stickerPopover.y * camera.scale + camera.y;
            
            return (
              <div
                className="absolute z-50 pointer-events-auto"
                style={{ left: `${screenX}px`, top: `${screenY}px`, transform: 'translate(-50%, -50%)' }}
              >
                <div className="bg-popover border border-border rounded-lg shadow-lg p-2 grid grid-cols-6 gap-1" role="menu">
                  {STICKERS.map((sticker) => (
                    <button
                      key={sticker.id}
                      type="button"
                      role="menuitem"
                      onClick={() => handleStickerSelect(sticker.id, stickerPopover.x, stickerPopover.y)}
                      onMouseDown={(e) => e.preventDefault()} // Prevent losing focus
                      className="p-1.5 rounded hover:bg-accent transition-colors"
                      aria-label={sticker.label}
                      title={sticker.label}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        {sticker.paths.map((path, i) => <path key={i} d={path} />)}
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Connector preview line */}
          {pendingConnectorFrom && tool.mode === "addConnector" && (
            <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#e5b567" />
                </marker>
              </defs>
              {(() => {
                const fromObj = objects.find((o) => o.id === pendingConnectorFrom);
                if (!fromObj) return null;
                const fromX = fromObj.x + fromObj.width / 2;
                const fromY = fromObj.y + fromObj.height / 2;
                return null;
              })()}
            </svg>
          )}

          {/* Stats overlay in bottom corner - hides while drawing */}
          {tool.mode !== "draw" && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5 text-[9px] text-muted-foreground font-mono bg-background/50 backdrop-blur px-1.5 py-0.5 rounded pointer-events-none transition-opacity duration-200">
              <span>{ct("status.cards", { count: localDigits(cards.length) })}</span>
              <span>{ct("status.marks_short", { count: localDigits(markCount) })}</span>
              <span>{ct("status.objects_short", { count: localDigits(objects.length) })}</span>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

// Simple inline object inspector
function ObjectInspector({ object, objects, onChange, onDelete, t }) {
  const commonProps = (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Position</label>
        <div className="flex gap-2">
          <input type="number" value={object.x} onChange={(e) => onChange(object.id, { x: Number(e.target.value) })} className="flex-1 px-2 py-1 rounded bg-background border border-border/60 text-sm" placeholder="X" />
          <input type="number" value={object.y} onChange={(e) => onChange(object.id, { y: Number(e.target.value) })} className="flex-1 px-2 py-1 rounded bg-background border border-border/60 text-sm" placeholder="Y" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Size</label>
        <div className="flex gap-2">
          <input type="number" value={object.width} onChange={(e) => onChange(object.id, { width: Number(e.target.value) })} className="flex-1 px-2 py-1 rounded bg-background border border-border/60 text-sm" placeholder="W" />
          <input type="number" value={object.height} onChange={(e) => onChange(object.id, { height: Number(e.target.value) })} className="flex-1 px-2 py-1 rounded bg-background border border-border/60 text-sm" placeholder="H" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Rotation</label>
        <input type="number" step="0.1" value={object.rotation || 0} onChange={(e) => onChange(object.id, { rotation: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onChange(object.id, { locked: !object.locked })} className="flex-1 px-2 py-1 rounded bg-accent text-accent-foreground text-xs hover:bg-accent/80">
          {object.locked ? "🔓 Unlock" : "🔒 Lock"}
        </button>
        <button onClick={() => onDelete(object.id)} className="flex-1 px-2 py-1 rounded bg-destructive/10 text-destructive text-xs hover:bg-destructive/20">
          🗑 Delete
        </button>
      </div>
    </div>
  );

  switch (object.type) {
    case "card":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
            <input value={object.title} onChange={(e) => onChange(object.id, { title: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Body</label>
            <textarea value={object.body} onChange={(e) => onChange(object.id, { body: e.target.value })} rows={3} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm resize-y" />
          </div>
          {commonProps}
        </div>
      );
    case "connector":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">From</label>
            <select value={object.from} onChange={(e) => onChange(object.id, { from: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm">
              {objects.filter(o => o.type !== "connector").map((o) => (
                <option key={o.id} value={o.id}>{o.title || o.type || o.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">To</label>
            <select value={object.to} onChange={(e) => onChange(object.id, { to: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm">
              {objects.filter(o => o.type !== "connector").map((o) => (
                <option key={o.id} value={o.id}>{o.title || o.type || o.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Style</label>
            <select value={object.style} onChange={(e) => onChange(object.id, { style: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm">
              <option value="straight">Straight</option>
              <option value="elbow">Elbow</option>
              <option value="curved">Curved</option>
            </select>
          </div>
          <div className="flex gap-2">
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={object.startArrow} onChange={(e) => onChange(object.id, { startArrow: e.target.checked })} />
              Start Arrow
            </label>
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={object.endArrow} onChange={(e) => onChange(object.id, { endArrow: e.target.checked })} />
              End Arrow
            </label>
          </div>
          {commonProps}
        </div>
      );
    case "frame":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
            <input value={object.name || ""} onChange={(e) => onChange(object.id, { name: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" placeholder="Page 1" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Frame Type</label>
            <select value={object.frameType} onChange={(e) => onChange(object.id, { frameType: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm">
              {FRAME_TYPES.map((ft) => (
                <option key={ft.id} value={ft.id}>{t(`vault.canvas.frameTypes.${ft.id}`) || ft.label}</option>
              ))}
            </select>
          </div>
          {commonProps}
        </div>
      );
    case "textbox":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Text</label>
            <textarea value={object.text || ""} onChange={(e) => onChange(object.id, { text: e.target.value })} rows={3} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm resize-y" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Font Size</label>
            <input type="number" value={object.fontSize || 16} onChange={(e) => onChange(object.id, { fontSize: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Color</label>
            <input type="color" value={object.color || "#e9e2d0"} onChange={(e) => onChange(object.id, { color: e.target.value })} className="w-full h-8 px-2 py-1 rounded bg-background border border-border/60" />
          </div>
          {commonProps}
        </div>
      );
    case "sticky":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Text</label>
            <textarea value={object.text || ""} onChange={(e) => onChange(object.id, { text: e.target.value })} rows={3} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm resize-y" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Font Size</label>
            <input type="number" value={object.fontSize || 14} onChange={(e) => onChange(object.id, { fontSize: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Background</label>
            <input type="color" value={object.background || "#fef08a"} onChange={(e) => onChange(object.id, { background: e.target.value })} className="w-full h-8 px-2 py-1 rounded bg-background border border-border/60" />
          </div>
          {commonProps}
        </div>
      );
    case "text-frame":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Markdown</label>
            <textarea value={object.markdown || ""} onChange={(e) => onChange(object.id, { markdown: e.target.value })} rows={4} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm resize-y font-mono text-xs" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Font Size</label>
            <input type="number" value={object.fontSize || 16} onChange={(e) => onChange(object.id, { fontSize: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Color</label>
            <input type="color" value={object.color || "#e9e2d0"} onChange={(e) => onChange(object.id, { color: e.target.value })} className="w-full h-8 px-2 py-1 rounded bg-background border border-border/60" />
          </div>
          {commonProps}
        </div>
      );
    case "shape":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Shape Type</label>
            <select value={object.shapeType || "rect"} onChange={(e) => onChange(object.id, { shapeType: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm">
              <option value="rect">Rectangle</option>
              <option value="rounded-rect">Rounded Rectangle</option>
              <option value="ellipse">Ellipse</option>
              <option value="line">Line</option>
              <option value="arrow">Arrow</option>
              <option value="triangle">Triangle</option>
              <option value="star">Star</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Fill</label>
            <input type="color" value={object.fill || "none"} onChange={(e) => onChange(object.id, { fill: e.target.value })} className="w-full h-8 px-2 py-1 rounded bg-background border border-border/60" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Stroke</label>
            <input type="color" value={object.stroke || "#e9e2d0"} onChange={(e) => onChange(object.id, { stroke: e.target.value })} className="w-full h-8 px-2 py-1 rounded bg-background border border-border/60" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Stroke Width</label>
            <input type="number" value={object.strokeWidth || 2} onChange={(e) => onChange(object.id, { strokeWidth: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" />
          </div>
          {commonProps}
        </div>
      );
    case "sticker":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Sticker</label>
            <select value={object.stickerId || "star-1"} onChange={(e) => onChange(object.id, { stickerId: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm">
              <option value="star-1">Star</option>
              <option value="heart">Heart</option>
              <option value="smile">Smile</option>
              <option value="thumbs-up">Thumbs Up</option>
              <option value="lightning">Lightning</option>
              <option value="cloud">Cloud</option>
              <option value="sun">Sun</option>
              <option value="moon">Moon</option>
              <option value="flower">Flower</option>
              <option value="music">Music</option>
              <option value="camera">Camera</option>
              <option value="bookmark">Bookmark</option>
              <option value="flag">Flag</option>
              <option value="tag">Tag</option>
              <option value="paperclip">Paperclip</option>
              <option value="bell">Bell</option>
              <option value="gift">Gift</option>
              <option value="cake">Cake</option>
              <option value="rocket">Rocket</option>
              <option value="leaf">Leaf</option>
              <option value="fire">Fire</option>
              <option value="diamond">Diamond</option>
              <option value="sparkles">Sparkles</option>
              <option value="check">Check</option>
              <option value="star-outline">Star Outline</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Color</label>
            <input type="color" value={object.color || "#e9e2d0"} onChange={(e) => onChange(object.id, { color: e.target.value })} className="w-full h-8 px-2 py-1 rounded bg-background border border-border/60" />
          </div>
          {commonProps}
        </div>
      );
    case "image":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Source</label>
            <input value={object.src || ""} onChange={(e) => onChange(object.id, { src: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" placeholder="local:..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Alt Text</label>
            <input value={object.alt || ""} onChange={(e) => onChange(object.id, { alt: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" />
          </div>
          {commonProps}
        </div>
      );
    case "pdf-page":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">File ID</label>
            <input value={object.fileId || ""} onChange={(e) => onChange(object.id, { fileId: e.target.value })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" placeholder="local:..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Page Number</label>
            <input type="number" value={object.pageNumber || 1} onChange={(e) => onChange(object.id, { pageNumber: Number(e.target.value) })} className="w-full px-2 py-1 rounded bg-background border border-border/60 text-sm" min="1" />
          </div>
          {commonProps}
        </div>
      );
    default:
      return commonProps;
  }
}