import { useEffect, useRef, useState, useCallback } from "react";
import {
  renderShape,
  renderSticker,
  renderTextBox,
  renderSticky,
  renderTextFrame,
  renderFrame,
  renderCard,
  renderConnector,
  renderImage,
  renderPdfPage,
  hitTestObject,
  getHandleAt,
  transformObject,
  transformGroup,
  getGroupedObjects,
  getGroupBounds,
  OBJECT_TYPES,
} from "@/lib/canvas/objects";
import { cn } from "@/lib/utils";
import { 
  Unlock, 
  Bold, 
  Italic, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Palette,
  Square,
  Trash2,
  CopyPlus
} from "lucide-react";
import { t } from "@/lib/i18n";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

const HANDLE_SIZE = 10;
const ROTATE_HANDLE_OFFSET = 30;

// Font options for text toolbar (4 app fonts)
const TOOLBAR_FONTS = [
  { id: "app", label: "App Sans", stack: "var(--font-body)" },
  { id: "display", label: "App Serif", stack: "var(--font-display)" },
  { id: "mono", label: "App Mono", stack: "var(--font-mono)" },
  { id: "georgia", label: "Georgia", stack: "Georgia, serif" },
];

// Font sizes for toolbar
const TOOLBAR_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72, 96];

// Sticky note pastel background colors (6 colors)
const STICKY_COLORS = [
  { id: "yellow", label: "Yellow", value: "#fef08a" },
  { id: "pink", label: "Pink", value: "#fce7f3" },
  { id: "blue", label: "Blue", value: "#dbeafe" },
  { id: "green", label: "Green", value: "#dcfce7" },
  { id: "purple", label: "Purple", value: "#f3e8ff" },
  { id: "orange", label: "Orange", value: "#ffedd5" },
];

/**
 * Renders floating objects (shapes, stickers, text boxes, sticky notes) on a canvas.
 * Handles selection, move, resize, rotate, and inline text editing.
 */
export default function FloatingObjects({
  objects = [],
  tool,
  camera,
  viewport,
  dpr,
  onSelectObject,
  onUpdateObject,
  onDeleteObject,
  onDuplicateObject,
  onBringToFront,
  onSendToBack,
  editingObjectId,
  setEditingObjectId,
  selectedObjectIds = [],
  scale = 1,
}) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const dragStateRef = useRef(null); // { type, objectId, startX, startY, startBounds, startRotation, handleId }
  const hoverHandleRef = useRef(null);
  const [cursor, setCursor] = useState("default");
  const [editState, setEditState] = useState({ text: "", caretPos: 0 });
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [lockedTextFrameId, setLockedTextFrameId] = useState(null);
  // Frame name editing state
  const [editingFrameNameId, setEditingFrameNameId] = useState(null);
  const [frameNameEditText, setFrameNameEditText] = useState("");
  // Text formatting toolbar state
  const [showTextToolbar, setShowTextToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  // Selection rectangle for drag-to-select multiple objects
  const [selectionRect, setSelectionRect] = useState(null); // { startX, startY, endX, endY }

  // Resize canvas when viewport changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = Math.max(1, Math.round(viewport.w * dpr));
    canvas.height = Math.max(1, Math.round(viewport.h * dpr));
    draw();
  }, [viewport.w, viewport.h, dpr]);

  // Redraw when objects, camera, or editing state changes
  useEffect(() => {
    draw();
    positionOverlay();
  }, [objects, camera, editingObjectId, scale]);

  // Transform screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX, screenY) => {
    return {
      x: (screenX - camera.x) / camera.scale,
      y: (screenY - camera.y) / camera.scale,
    };
  }, [camera]);

  // Transform world coordinates to screen coordinates
  const worldToScreen = useCallback((worldX, worldY) => {
    return {
      x: worldX * camera.scale + camera.x,
      y: worldY * camera.scale + camera.y,
    };
  }, [camera]);

  // Position the overlay textarea for editing
  const positionOverlay = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay || !editingObjectId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const object = objects.find((o) => o.id === editingObjectId);
    if (!object) return;

    const rect = canvas.getBoundingClientRect();
    const { x, y, width, height, rotation } = object;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    // Calculate the text area bounds in world coordinates
    let textX, textY, textW, textH;
    const padding = object.type === OBJECT_TYPES.STICKY ? 12 : (object.padding || 8);
    const stripeHeight = object.type === OBJECT_TYPES.STICKY ? 24 : 0;
    const startY = y + stripeHeight + padding;

    // For rotated objects, we need to position the overlay in screen space
    // We'll use the top-left corner of the text area
    const tlWorldX = x + padding;
    const tlWorldY = startY;
    const trWorldX = x + width - padding;
    const trWorldY = startY;
    const blWorldX = x + padding;
    const blWorldY = y + height - padding;

    // Transform corners to screen
    const transformCorner = (wx, wy) => {
      const dx = wx - cx;
      const dy = wy - cy;
      const rx = cx + dx * cos - dy * sin;
      const ry = cy + dx * sin + dy * cos;
      return worldToScreen(rx, ry);
    };

    const tl = transformCorner(tlWorldX, tlWorldY);
    const tr = transformCorner(trWorldX, trWorldY);
    const bl = transformCorner(blWorldX, blWorldY);

    // Calculate width and height from transformed corners
    const w = Math.hypot(tr.x - tl.x, tr.y - tl.y);
    const h = Math.hypot(bl.x - tl.x, bl.y - tl.y);

    overlay.style.left = `${tl.x}px`;
    overlay.style.top = `${tl.y}px`;
    overlay.style.width = `${w}px`;
    overlay.style.height = `${h}px`;
    overlay.style.transform = `rotate(${rotation}rad)`;
    overlay.style.transformOrigin = "top left";
    overlay.style.fontSize = `${(object.fontSize || (object.type === OBJECT_TYPES.STICKY ? 14 : 16)) * camera.scale}px`;
    overlay.style.fontFamily = object.fontFamily || "inherit";
    overlay.style.color = object.color || (object.type === OBJECT_TYPES.STICKY ? "#111827" : "#e9e2d0");
    overlay.style.background = "transparent";
    overlay.style.border = "none";
    overlay.style.outline = "none";
    overlay.style.resize = "none";
    overlay.style.lineHeight = "1.4";
    overlay.style.padding = "0";
    overlay.style.whiteSpace = "pre-wrap";
    overlay.style.wordWrap = "break-word";
    overlay.style.textAlign = object.align || "left";
    // Use dir="auto" for RTL support (Arabic, Hebrew, etc.)
    overlay.dir = "auto";
  }, [objects, editingObjectId, camera, worldToScreen]);

  // Draw all objects
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply camera transform
    ctx.setTransform(dpr * camera.scale, 0, 0, dpr * camera.scale, dpr * camera.x, dpr * camera.y);

    // Sort by zOrder
    const sortedObjects = [...objects].sort((a, b) => (a.zOrder || 0) - (b.zOrder || 0));

    sortedObjects.forEach((object) => {
      const isSelected = selectedObjectIds.includes(object.id);
      const isEditing = object.id === editingObjectId;

      switch (object.type) {
        case OBJECT_TYPES.SHAPE:
          renderShape(ctx, object, scale);
          break;
        case OBJECT_TYPES.STICKER:
          renderSticker(ctx, object, scale);
          break;
        case OBJECT_TYPES.TEXTBOX:
          renderTextBox(ctx, object, scale, isEditing);
          break;
        case OBJECT_TYPES.STICKY:
          renderSticky(ctx, object, scale, isEditing);
          break;
        case OBJECT_TYPES.TEXT_FRAME:
          renderTextFrame(ctx, object, scale, isEditing);
          break;
        case OBJECT_TYPES.FRAME:
          renderFrame(ctx, object, scale);
          break;
        case OBJECT_TYPES.CARD:
          renderCard(ctx, object, scale);
          break;
        case OBJECT_TYPES.CONNECTOR:
          renderConnector(ctx, object, scale, objects);
          break;
        case OBJECT_TYPES.IMAGE:
          renderImage(ctx, object, scale);
          break;
        case OBJECT_TYPES.PDF_PAGE:
          renderPdfPage(ctx, object, scale);
          break;
      }

      // Draw selection handles
      if (isSelected && !isEditing) {
        drawHandles(ctx, object, scale);
      }
    });

    // Draw selection rectangle (in screen coordinates, so reset transform)
    if (selectionRect) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const minX = Math.min(selectionRect.startX, selectionRect.endX);
      const maxX = Math.max(selectionRect.startX, selectionRect.endX);
      const minY = Math.min(selectionRect.startY, selectionRect.endY);
      const maxY = Math.max(selectionRect.startY, selectionRect.endY);
      
      ctx.strokeStyle = "#e5b567";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      
      ctx.fillStyle = "rgba(229, 181, 103, 0.1)";
      ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
      ctx.setLineDash([]);
    }
  }, [objects, camera, dpr, scale, editingObjectId, selectedObjectIds, selectionRect]);

  // Draw selection handles for an object
  const drawHandles = (ctx, object, scale) => {
    // Connectors have no size - skip handles
    if (object.type === OBJECT_TYPES.CONNECTOR) return;

    const { x, y, width, height, rotation, frameType, locked } = object;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    ctx.save();
    ctx.strokeStyle = "#e5b567"; // primary color
    ctx.fillStyle = "#fff";
    ctx.lineWidth = 1.5 / scale;
    ctx.setLineDash([]);

    // Only show corner handles for non-frame objects or Free frames
    const isFreeFrame = object.type === OBJECT_TYPES.FRAME && frameType === "free";
    const showCornerHandles = object.type !== OBJECT_TYPES.FRAME || isFreeFrame;

    if (showCornerHandles) {
      // Corner handles
      const corners = [
        { x, y, id: "tl" },
        { x: x + width, y, id: "tr" },
        { x: x + width, y: y + height, id: "br" },
        { x, y: y + height, id: "bl" },
      ];

      corners.forEach((corner) => {
        const dx = corner.x - cx;
        const dy = corner.y - cy;
        const rx = cx + dx * cos - dy * sin;
        const ry = cy + dx * sin + dy * cos;
        const hs = HANDLE_SIZE / scale;
        ctx.fillRect(rx - hs / 2, ry - hs / 2, hs, hs);
        ctx.strokeRect(rx - hs / 2, ry - hs / 2, hs, hs);
      });
    }

    // Rotation handle (always shown for selected objects)
    const rotX = cx;
    const rotY = y - ROTATE_HANDLE_OFFSET;
    const dx = rotX - cx;
    const dy = rotY - cy;
    const rotRx = cx + dx * cos - dy * sin;
    const rotRy = cy + dx * sin + dy * cos;
    const hs = HANDLE_SIZE / scale;
    ctx.beginPath();
    ctx.arc(rotRx, rotRy, hs / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Lock icon for locked text frames
    if (object.type === OBJECT_TYPES.TEXT_FRAME && locked) {
      const lockSize = 14 / scale;
      const lockX = rotRx; // Near rotation handle
      const lockY = rotRy - 20 / scale;
      
      ctx.save();
      ctx.strokeStyle = "#e5b567";
      ctx.fillStyle = "#e5b567";
      ctx.lineWidth = 2 / scale;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      // Lock body
      ctx.beginPath();
      ctx.roundRect(lockX - lockSize / 2, lockY, lockSize, lockSize * 0.8, 2 / scale);
      ctx.stroke();
      
      // Lock shackle
      ctx.beginPath();
      ctx.moveTo(lockX - lockSize * 0.25, lockY);
      ctx.lineTo(lockX - lockSize * 0.25, lockY - lockSize * 0.5);
      ctx.lineTo(lockX + lockSize * 0.25, lockY - lockSize * 0.5);
      ctx.lineTo(lockX + lockSize * 0.25, lockY);
      ctx.stroke();
      
      // Keyhole
      ctx.beginPath();
      ctx.arc(lockX, lockY + lockSize * 0.35, lockSize * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.rect(lockX - lockSize * 0.08, lockY + lockSize * 0.35, lockSize * 0.16, lockSize * 0.2);
      ctx.fill();
      
      ctx.restore();
    }

    ctx.restore();
  };

  // Get object at screen position
  const getObjectAt = useCallback((screenX, screenY) => {
    const world = screenToWorld(screenX, screenY);
    // Check in reverse z-order (top first)
    const sortedObjects = [...objects].sort((a, b) => (b.zOrder || 0) - (a.zOrder || 0));
    for (const object of sortedObjects) {
      if (hitTestObject(object, world.x, world.y, objects)) {
        return object;
      }
    }
    return null;
  }, [objects, screenToWorld]);

  // Handle pointer down
  const onPointerDown = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    // If editing, don't handle canvas clicks (let overlay handle it)
    if (editingObjectId) return;

    // Check for handle hit first (skip for connectors)
    const selectedObject = selectedObjectIds.length > 0 ? objects.find((o) => selectedObjectIds.includes(o.id)) : null;
    if (selectedObject && !editingObjectId && selectedObject.type !== OBJECT_TYPES.CONNECTOR) {
      const world = screenToWorld(screenX, screenY);
      const handle = getHandleAt(selectedObject, world.x, world.y, HANDLE_SIZE / camera.scale);
      // Ignore corner handles for non-Free frames
      const isFreeFrame = selectedObject.type === OBJECT_TYPES.FRAME && selectedObject.frameType === "free";
      const showCornerHandles = selectedObject.type !== OBJECT_TYPES.FRAME || isFreeFrame;
      if (handle && (handle.type !== "corner" || showCornerHandles)) {
        dragStateRef.current = {
          type: handle.type === "corner" ? "resize" : "rotate",
          objectId: selectedObject.id,
          handleId: handle.id,
          startX: world.x,
          startY: world.y,
          startBounds: { x: selectedObject.x, y: selectedObject.y, width: selectedObject.width, height: selectedObject.height },
          startRotation: selectedObject.rotation || 0,
          groupId: selectedObject.groupId, // Track group for grouped operations
        };
        canvas.setPointerCapture(event.pointerId);
        return;
      }
    }

    // Check for object hit
    const object = getObjectAt(screenX, screenY);
    if (object) {
      // Pass event for multi-selection support (Ctrl/Cmd/Shift click)
      onSelectObject?.(object.id, event);
      const world = screenToWorld(screenX, screenY);
      dragStateRef.current = {
        type: "move",
        objectId: object.id,
        startX: world.x,
        startY: world.y,
        startBounds: { x: object.x, y: object.y, width: object.width, height: object.height },
        startRotation: object.rotation || 0,
        groupId: object.groupId,
      };
      canvas.setPointerCapture(event.pointerId);
    } else {
      // Clicked on empty space - start selection rectangle if in select mode
      const isSelectMode = tool?.mode === "select";
      if (isSelectMode) {
        setSelectionRect({ startX: screenX, startY: screenY, endX: screenX, endY: screenY });
      }
      // Clear selection if not multi-select (Ctrl/Shift not held)
      const isMulti = event.ctrlKey || event.metaKey || event.shiftKey;
      if (!isMulti) {
        onSelectObject?.(null, event);
      }
    }
  }, [objects, screenToWorld, getObjectAt, onSelectObject, editingObjectId, camera.scale, selectedObjectIds, tool]);

  // Handle pointer move
  const onPointerMove = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);

    // Update hover handle cursor
    const selectedObject = selectedObjectIds.length > 0 ? objects.find((o) => selectedObjectIds.includes(o.id)) : null;
    
    // Update selection rectangle
    if (selectionRect && !dragStateRef.current) {
      setSelectionRect((prev) => prev ? { ...prev, endX: screenX, endY: screenY } : null);
    }
    
    if (selectedObject && !editingObjectId && !dragStateRef.current && selectedObject.type !== OBJECT_TYPES.CONNECTOR) {
      const isFreeFrame = selectedObject.type === OBJECT_TYPES.FRAME && selectedObject.frameType === "free";
      const showCornerHandles = selectedObject.type !== OBJECT_TYPES.FRAME || isFreeFrame;
      const handle = getHandleAt(selectedObject, world.x, world.y, HANDLE_SIZE / camera.scale);
      // Ignore corner handles for non-Free frames
      if (handle && (handle.type !== "corner" || showCornerHandles)) {
        hoverHandleRef.current = handle;
        if (handle.type === "rotate") {
          setCursor("grab");
        } else {
          // Corner resize cursors
          const cursors = { tl: "nwse-resize", tr: "nesw-resize", br: "nwse-resize", bl: "nesw-resize" };
          setCursor(cursors[handle.id] || "crosshair");
        }
      } else {
        hoverHandleRef.current = null;
        // Check if over object
        const obj = getObjectAt(screenX, screenY);
        setCursor(obj ? "move" : "default");
      }
    }

    // Handle dragging
    if (dragStateRef.current) {
      const drag = dragStateRef.current;
      const currentObject = objects.find((o) => o.id === drag.objectId);
      if (!currentObject) return;

      // If object is in a group, apply transform to entire group
      if (drag.groupId) {
        let updatedObjects;
        if (drag.type === "move") {
          const dx = world.x - drag.startX;
          const dy = world.y - drag.startY;
          updatedObjects = transformGroup(objects, drag.groupId, { type: "move", dx, dy });
        } else if (drag.type === "resize") {
          // For resize, we need to calculate scale from the handle drag
          // This is simplified - in practice, we'd need more complex logic
          updatedObjects = transformGroup(objects, drag.groupId, { type: "move", dx: world.x - drag.startX, dy: world.y - drag.startY });
        } else if (drag.type === "rotate") {
          // For rotate, calculate angle from center
          const bounds = getGroupBounds(objects, drag.groupId);
          if (bounds) {
            const startAngle = Math.atan2(drag.startY - bounds.centerY, drag.startX - bounds.centerX);
            const currentAngle = Math.atan2(world.y - bounds.centerY, world.x - bounds.centerX);
            const angle = currentAngle - startAngle;
            updatedObjects = transformGroup(objects, drag.groupId, { type: "rotate", angle });
          }
        }

        if (updatedObjects) {
          // Apply updates to all objects in group
          updatedObjects.forEach((obj) => {
            if (drag.groupId && getGroupedObjects(objects, drag.groupId).some((g) => g.id === obj.id)) {
              onUpdateObject?.(obj.id, obj);
            }
          });
        }
      } else {
        // Single object transform (existing logic)
        let updated;
        if (drag.type === "move") {
          updated = transformObject(currentObject, {
            type: "move",
            startX: drag.startX,
            startY: drag.startY,
            currentX: world.x,
            currentY: world.y,
            startBounds: drag.startBounds,
            startRotation: drag.startRotation,
          });
        } else if (drag.type === "resize") {
          updated = transformObject(currentObject, {
            type: "resize",
            id: drag.handleId,
            startX: drag.startX,
            startY: drag.startY,
            currentX: world.x,
            currentY: world.y,
            startBounds: drag.startBounds,
            startRotation: drag.startRotation,
          });
        } else if (drag.type === "rotate") {
          updated = transformObject(currentObject, {
            type: "rotate",
            startX: drag.startX,
            startY: drag.startY,
            currentX: world.x,
            currentY: world.y,
            startBounds: drag.startBounds,
            startRotation: drag.startRotation,
          });
        }

        if (updated) {
          onUpdateObject?.(drag.objectId, updated);
        }
      }
    }
  }, [objects, screenToWorld, getObjectAt, onSelectObject, onUpdateObject, editingObjectId, camera.scale, selectedObjectIds]);

  // Handle pointer up
  const onPointerUp = useCallback((event) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture?.(event.pointerId);
    }
    
    // Finalize selection rectangle
    if (selectionRect) {
      const rect = selectionRect;
      const minX = Math.min(rect.startX, rect.endX);
      const maxX = Math.max(rect.startX, rect.endX);
      const minY = Math.min(rect.startY, rect.endY);
      const maxY = Math.max(rect.startY, rect.endY);
      
      // Only select if rectangle has some size (not just a click)
      if (Math.abs(maxX - minX) > 5 || Math.abs(maxY - minY) > 5) {
        // Find all objects within the selection rectangle
        const selectedInRect = objects.filter((obj) => {
          if (obj.type === OBJECT_TYPES.CONNECTOR) return false;
          // Convert object bounds to screen coordinates
          const objScreen = worldToScreen(obj.x, obj.y);
          const objScreenBR = worldToScreen(obj.x + obj.width, obj.y + obj.height);
          const objMinX = Math.min(objScreen.x, objScreenBR.x);
          const objMaxX = Math.max(objScreen.x, objScreenBR.x);
          const objMinY = Math.min(objScreen.y, objScreenBR.y);
          const objMaxY = Math.max(objScreen.y, objScreenBR.y);
          
          // Check if object bounds intersect with selection rect
          return objMaxX >= minX && objMinX <= maxX && objMaxY >= minY && objMinY <= maxY;
        });
        
        if (selectedInRect.length > 0) {
          const ids = selectedInRect.map((o) => o.id);
          onSelectObject?.(ids, event); // Pass array for multi-select
        }
      }
      setSelectionRect(null);
    }
    
    dragStateRef.current = null;
  }, [selectionRect, objects, onSelectObject, worldToScreen]);

  // Handle double-click for text editing and frame name editing
  const onDoubleClick = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const object = getObjectAt(screenX, screenY);
    
    // Frame name editing on double-click
    if (object && object.type === OBJECT_TYPES.FRAME) {
      // Check if click is near the top of the frame (where name is displayed)
      const world = screenToWorld(screenX, screenY);
      const nameAreaHeight = 30 / camera.scale; // Approximate name area height
      if (world.y <= object.y + nameAreaHeight) {
        setEditingFrameNameId(object.id);
        setFrameNameEditText(object.name || "Page");
        return;
      }
    }
    
    // Text editing for text objects
    if (object && (object.type === OBJECT_TYPES.TEXTBOX || object.type === OBJECT_TYPES.STICKY || object.type === OBJECT_TYPES.TEXT_FRAME)) {
      // Prevent editing if locked
      if (object.locked) return;
      setEditingObjectId(object.id);
      const content = object.type === OBJECT_TYPES.TEXT_FRAME ? (object.markdown || "") : (object.text || "");
      setEditState({ text: content, caretPos: content.length });
      // Focus the overlay after state update
      setTimeout(() => overlayRef.current?.focus(), 0);
    }
  }, [getObjectAt, setEditingObjectId, camera.scale, screenToWorld]);

  // Show/hide text formatting toolbar when text box or sticky is selected or editing
  useEffect(() => {
    const isTextObject = selectedObjectIds.length === 1 && objects.some(
      (o) => o.id === selectedObjectIds[0] && (o.type === OBJECT_TYPES.TEXTBOX || o.type === OBJECT_TYPES.STICKY)
    );
    const isEditingText = editingObjectId && objects.some(
      (o) => o.id === editingObjectId && (o.type === OBJECT_TYPES.TEXTBOX || o.type === OBJECT_TYPES.STICKY)
    );
    
    if (isTextObject || isEditingText) {
      // Calculate toolbar position (above the object)
      const objectId = editingObjectId || selectedObjectIds[0];
      const object = objects.find((o) => o.id === objectId);
      if (object && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const { x, y, width, height, rotation } = object;
        const cx = x + width / 2;
        const cy = y;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        
        // Position above the object
        const toolbarOffsetY = -50; // 50px above
        const worldX = cx;
        const worldY = cy + toolbarOffsetY;
        
        const dx = worldX - (x + width / 2);
        const dy = worldY - (y + height / 2);
        const rx = cx + dx * cos - dy * sin;
        const ry = cy + dx * sin + dy * cos;
        
        const screenX = rx * camera.scale + camera.x;
        const screenY = ry * camera.scale + camera.y;
        
        setToolbarPosition({ x: screenX - rect.left, y: screenY - rect.top });
        setShowTextToolbar(true);
      }
    } else {
      setShowTextToolbar(false);
    }
  }, [selectedObjectIds, editingObjectId, objects, camera]);

  // Handle overlay text changes
  const onOverlayChange = useCallback((event) => {
    const text = event.target.value;
    setEditState((prev) => ({ ...prev, text, caretPos: event.target.selectionStart }));
    const object = objects.find((o) => o.id === editingObjectId);
    const prop = object?.type === OBJECT_TYPES.TEXT_FRAME ? 'markdown' : 'text';
    onUpdateObject?.(editingObjectId, { [prop]: text });
  }, [editingObjectId, onUpdateObject, objects]);

  // Handle overlay blur (save and exit edit)
  const onOverlayBlur = useCallback(() => {
    // Auto-delete empty text boxes and sticky notes
    if (editingObjectId) {
      const object = objects.find((o) => o.id === editingObjectId);
      if (object && (object.type === OBJECT_TYPES.TEXTBOX || object.type === OBJECT_TYPES.STICKY)) {
        const content = object.type === OBJECT_TYPES.TEXT_FRAME ? (object.markdown || "") : (object.text || "");
        if (!content || content.trim() === "") {
          // Delete empty object
          onDeleteObject?.(editingObjectId);
          setEditingObjectId(null);
          setEditState({ text: "", caretPos: 0 });
          return;
        }
      }
    }
    setEditingObjectId(null);
    setEditState({ text: "", caretPos: 0 });
  }, [editingObjectId, objects, onDeleteObject, setEditingObjectId]);

  // Handle overlay key down
  const onOverlayKeyDown = useCallback((event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      setEditingObjectId(null);
    } else if (event.key === "Escape") {
      // Revert to original text
      const object = objects.find((o) => o.id === editingObjectId);
      if (object) {
        const prop = object.type === OBJECT_TYPES.TEXT_FRAME ? 'markdown' : 'text';
        onUpdateObject?.(editingObjectId, { [prop]: object[prop] || "" });
      }
      setEditingObjectId(null);
    }
  }, [editingObjectId, objects, onUpdateObject, setEditingObjectId]);

  // Handle frame name edit save (blur or Enter)
  const saveFrameNameEdit = useCallback(() => {
    if (editingFrameNameId) {
      onUpdateObject?.(editingFrameNameId, { name: frameNameEditText || "Page" });
      setEditingFrameNameId(null);
      setFrameNameEditText("");
    }
  }, [editingFrameNameId, frameNameEditText, onUpdateObject]);

  // Handle frame name edit key down
  const onFrameNameKeyDown = useCallback((event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveFrameNameEdit();
    } else if (event.key === "Escape") {
      setEditingFrameNameId(null);
      setFrameNameEditText("");
    }
  }, [saveFrameNameEdit]);

  // Handle keyboard events for canvas (Delete key, etc.)
  const onCanvasKeyDown = useCallback((event) => {
    // Don't handle keys while editing
    if (editingObjectId) return;
    
    // Delete/Backspace to remove selected object
    if ((event.key === "Delete" || event.key === "Backspace") && selectedObjectIds.length > 0) {
      event.preventDefault();
      selectedObjectIds.forEach((id) => {
        onDeleteObject?.(id);
      });
      onSelectObject?.(null); // Clear selection
    }
    
    // Escape to clear selection
    if (event.key === "Escape" && selectedObjectIds.length > 0) {
      onSelectObject?.(null);
    }
  }, [editingObjectId, selectedObjectIds, onDeleteObject, onSelectObject]);

  // Attach keyboard listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("keydown", onCanvasKeyDown);
    return () => canvas.removeEventListener("keydown", onCanvasKeyDown);
  }, [onCanvasKeyDown]);

  // Get the currently selected/editing text object
  const getTextObject = useCallback(() => {
    const objectId = editingObjectId || (selectedObjectIds.length === 1 ? selectedObjectIds[0] : null);
    if (!objectId) return null;
    return objects.find((o) => o.id === objectId && (o.type === OBJECT_TYPES.TEXTBOX || o.type === OBJECT_TYPES.STICKY));
  }, [editingObjectId, selectedObjectIds, objects]);

  // Toolbar handlers
  const onFontChange = useCallback((fontId) => {
    const obj = getTextObject();
    if (obj) onUpdateObject?.(obj.id, { fontFamily: fontId });
  }, [getTextObject, onUpdateObject]);

  const onFontSizeChange = useCallback((size) => {
    const obj = getTextObject();
    if (obj) onUpdateObject?.(obj.id, { fontSize: size });
  }, [getTextObject, onUpdateObject]);

  const onBoldToggle = useCallback(() => {
    const obj = getTextObject();
    if (obj) {
      // For text boxes and sticky notes, we don't have inline bold - would need rich text
      // For now, we'll skip this or use a workaround
      // Could add a 'bold' property to the object
    }
  }, [getTextObject, onUpdateObject]);

  const onItalicToggle = useCallback(() => {
    const obj = getTextObject();
    if (obj) {
      // Similar to bold - would need rich text support
    }
  }, [getTextObject, onUpdateObject]);

  const onAlignChange = useCallback((align) => {
    const obj = getTextObject();
    if (obj) onUpdateObject?.(obj.id, { align });
  }, [getTextObject, onUpdateObject]);

  const onTextColorChange = useCallback((color) => {
    const obj = getTextObject();
    if (obj) onUpdateObject?.(obj.id, { color });
  }, [getTextObject, onUpdateObject]);

  const onStickyColorChange = useCallback((color) => {
    const obj = getTextObject();
    if (obj && obj.type === OBJECT_TYPES.STICKY) {
      onUpdateObject?.(obj.id, { background: color });
    }
  }, [getTextObject, onUpdateObject]);

  // Handle context menu for z-order
  const onContextMenu = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const object = getObjectAt(screenX, screenY);
    if (object) {
      event.preventDefault();
      // Could show a context menu here for bring to front / send to back
      // For now, we'll handle via keyboard shortcuts or ribbon buttons
    }
  }, [getObjectAt]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className={cn("absolute inset-0 touch-none", cursor !== "default" && cursor)}
        style={{
          pointerEvents: tool?.mode === "select" ? "auto" : "none",
          cursor,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        tabIndex={0} // For keyboard events
      />
      {editingObjectId && (
        <textarea
          ref={overlayRef}
          value={editState.text}
          onChange={onOverlayChange}
          onBlur={onOverlayBlur}
          onKeyDown={onOverlayKeyDown}
          className="absolute pointer-events-auto"
          style={{
            zIndex: 100,
            outline: "none",
            border: "none",
            background: "transparent",
            resize: "none",
          }}
          spellCheck={false}
          autoFocus
        />
      )}
      
      {/* Frame name editing overlay */}
      {editingFrameNameId && (() => {
        const frame = objects.find((o) => o.id === editingFrameNameId);
        if (!frame || !canvasRef.current) return null;
        const rect = canvasRef.current.getBoundingClientRect();
        const { x, y, width, height, rotation } = frame;
        const cx = x + width / 2;
        const cy = y + height / 2;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        
        // Position at frame name area (top center of frame)
        const nameY = y - 10 / camera.scale; // Slightly above frame
        const dx = cx - (x + width / 2);
        const dy = nameY - cy;
        const rx = cx + dx * cos - dy * sin;
        const ry = cy + dx * sin + dy * cos;
        
        const screenX = rx * camera.scale + camera.x;
        const screenY = ry * camera.scale + camera.y;
        
        return (
          <input
            key={`frame-name-${editingFrameNameId}`}
            type="text"
            value={frameNameEditText}
            onChange={(e) => setFrameNameEditText(e.target.value)}
            onBlur={saveFrameNameEdit}
            onKeyDown={onFrameNameKeyDown}
            className="absolute pointer-events-auto z-50"
            style={{
              left: `${screenX - rect.left}px`,
              top: `${screenY - rect.top}px`,
              transform: 'translate(-50%, -100%)',
              zIndex: 100,
              outline: "none",
              border: "1px solid hsl(var(--primary))",
              borderRadius: "4px",
              padding: "2px 8px",
              fontSize: `${12 * camera.scale}px`,
              fontFamily: "inherit",
              background: "hsl(var(--popover))",
              color: "hsl(var(--popover-foreground))",
              minWidth: "80px",
              textAlign: "center",
            }}
            autoFocus
          />
        );
      })()}
      
      {/* Text formatting toolbar */}
      {showTextToolbar && (() => {
        const obj = getTextObject();
        if (!obj) return null;
        const isSticky = obj.type === OBJECT_TYPES.STICKY;
        
        return (
          <div
            key={`text-toolbar-${obj.id}`}
            className="absolute pointer-events-auto z-50 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-popover border border-border shadow-lg backdrop-blur"
            style={{
              left: `${toolbarPosition.x}px`,
              top: `${toolbarPosition.y}px`,
              transform: 'translateX(-50%)',
            }}
          >
            {/* Font family */}
            <select
              value={obj.fontFamily || "app"}
              onChange={(e) => onFontChange(e.target.value)}
              className="px-2 py-1 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label={t("vault.canvas.textTools.fontFamily") || "Font"}
            >
              {TOOLBAR_FONTS.map((font) => (
                <option key={font.id} value={font.id}>{font.label}</option>
              ))}
            </select>
            
            {/* Font size */}
            <select
              value={obj.fontSize || (isSticky ? 14 : 16)}
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
              className="px-2 py-1 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring w-20"
              aria-label={t("vault.canvas.textTools.fontSize") || "Size"}
            >
              {TOOLBAR_SIZES.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            
            <div className="w-px h-6 bg-border mx-1" />
            
            {/* Bold */}
            <button
              type="button"
              onClick={onBoldToggle}
              className="p-1.5 rounded hover:bg-accent transition-colors"
              aria-label={t("vault.canvas.textTools.bold") || "Bold"}
              title={t("vault.canvas.textTools.bold") || "Bold"}
            >
              <Bold className="h-3.5 w-3.5" />
            </button>
            
            {/* Italic */}
            <button
              type="button"
              onClick={onItalicToggle}
              className="p-1.5 rounded hover:bg-accent transition-colors"
              aria-label={t("vault.canvas.textTools.italic") || "Italic"}
              title={t("vault.canvas.textTools.italic") || "Italic"}
            >
              <Italic className="h-3.5 w-3.5" />
            </button>
            
            <div className="w-px h-6 bg-border mx-1" />
            
            {/* Alignment */}
            <button
              type="button"
              onClick={() => onAlignChange("left")}
              className={`p-1.5 rounded transition-colors ${(obj.align || "left") === "left" ? "bg-accent" : "hover:bg-accent"}`}
              aria-label={t("vault.canvas.textTools.alignLeft") || "Align Left"}
              title={t("vault.canvas.textTools.alignLeft") || "Align Left"}
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onAlignChange("center")}
              className={`p-1.5 rounded transition-colors ${(obj.align || "left") === "center" ? "bg-accent" : "hover:bg-accent"}`}
              aria-label={t("vault.canvas.textTools.alignCenter") || "Align Center"}
              title={t("vault.canvas.textTools.alignCenter") || "Align Center"}
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onAlignChange("right")}
              className={`p-1.5 rounded transition-colors ${(obj.align || "left") === "right" ? "bg-accent" : "hover:bg-accent"}`}
              aria-label={t("vault.canvas.textTools.alignRight") || "Align Right"}
              title={t("vault.canvas.textTools.alignRight") || "Align Right"}
            >
              <AlignRight className="h-3.5 w-3.5" />
            </button>
            
            <div className="w-px h-6 bg-border mx-1" />
            
            {/* Text color */}
            <div className="relative">
              <button
                type="button"
                className="p-1.5 rounded hover:bg-accent transition-colors relative"
                aria-label={t("vault.canvas.textTools.textColor") || "Text Color"}
                title={t("vault.canvas.textTools.textColor") || "Text Color"}
              >
                <Palette className="h-3.5 w-3.5" />
                <span
                  className="absolute bottom-0 left-1/2 w-2 h-0.5 -translate-x-1/2 rounded"
                  style={{ backgroundColor: obj.color || (isSticky ? "#111827" : "#e9e2d0") }}
                />
              </button>
              {/* Color picker dropdown - simplified as color input for now */}
              <input
                type="color"
                value={obj.color || (isSticky ? "#111827" : "#e9e2d0")}
                onChange={(e) => onTextColorChange(e.target.value)}
                className="absolute opacity-0 w-full h-full cursor-pointer"
                aria-hidden="true"
              />
            </div>
            
            {/* Sticky note background color */}
            {isSticky && (
              <div className="relative">
                <button
                  type="button"
                  className="p-1.5 rounded hover:bg-accent transition-colors relative"
                  aria-label={t("vault.canvas.textTools.stickyColor") || "Sticky Color"}
                  title={t("vault.canvas.textTools.stickyColor") || "Sticky Color"}
                >
                  <Square className="h-3.5 w-3.5" />
                  <span
                    className="absolute bottom-0 left-1/2 w-2 h-0.5 -translate-x-1/2 rounded"
                    style={{ backgroundColor: obj.background || "#fef08a" }}
                  />
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 flex gap-1 p-2 bg-popover border border-border rounded-lg shadow-lg">
                  {STICKY_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => onStickyColorChange(color.value)}
                      className="w-6 h-6 rounded border-2 transition-colors"
                      style={{
                        backgroundColor: color.value,
                        borderColor: (obj.background || "#fef08a") === color.value ? "#e5b567" : "transparent",
                      }}
                      aria-label={color.label}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
      
      {/* Unlock button for locked text frames */}
      {selectedObjectIds.length === 1 && (() => {
        const selectedObj = objects.find(o => o.id === selectedObjectIds[0]);
        if (selectedObj?.type === OBJECT_TYPES.TEXT_FRAME && selectedObj.locked) {
          const canvas = canvasRef.current;
          if (!canvas) return null;
          const rect = canvas.getBoundingClientRect();
          const { x, y, width, height, rotation } = selectedObj;
          const cx = x + width / 2;
          const cy = y + height / 2;
          const cos = Math.cos(rotation);
          const sin = Math.sin(rotation);
          
          // Position near the lock icon (above rotation handle)
          const rotX = cx;
          const rotY = y - ROTATE_HANDLE_OFFSET;
          const dx = rotX - cx;
          const dy = rotY - cy;
          const rotRx = cx + dx * cos - dy * sin;
          const rotRy = cy + dx * sin + dy * cos;
          
          const screenX = rotRx * camera.scale + camera.x;
          const screenY = (rotRy - 35) * camera.scale + camera.y; // Above lock icon
          
          return (
            <div
              key={selectedObj.id}
              className="absolute pointer-events-auto z-50"
              style={{
                left: `${screenX}px`,
                top: `${screenY}px`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <AlertDialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-background/90 border border-border/50 text-foreground shadow-lg backdrop-blur hover:bg-accent transition-colors"
                    aria-label={t("vault.canvas.textFrame.unlock")}
                    title={t("vault.canvas.textFrame.locked")}
                  >
                    <Unlock className="h-3.5 w-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("vault.canvas.textFrame.unlock")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("vault.canvas.textFrame.unlockWarning")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel") || "Cancel"}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        onUpdateObject?.(selectedObj.id, { locked: false });
                        setUnlockDialogOpen(false);
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t("vault.canvas.textFrame.unlock")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        }
        return null;
      })}

      {/* Frame action buttons (delete/duplicate) for selected frames */}
      {selectedObjectIds.length === 1 && (() => {
        const selectedObj = objects.find(o => o.id === selectedObjectIds[0]);
        if (selectedObj?.type === OBJECT_TYPES.FRAME) {
          const canvas = canvasRef.current;
          if (!canvas) return null;
          const rect = canvas.getBoundingClientRect();
          const { x, y, width, height, rotation } = selectedObj;
          const cx = x + width / 2;
          const cy = y + height / 2;
          const cos = Math.cos(rotation);
          const sin = Math.sin(rotation);
          
          // Position near the rotation handle (top of frame)
          const rotX = cx;
          const rotY = y - ROTATE_HANDLE_OFFSET;
          const dx = rotX - cx;
          const dy = rotY - cy;
          const rotRx = cx + dx * cos - dy * sin;
          const rotRy = cy + dx * sin + dy * cos;
          
          const screenX = rotRx * camera.scale + camera.x;
          const screenY = (rotRy - 35) * camera.scale + camera.y; // Above rotation handle
          
          return (
            <div
              key={`frame-actions-${selectedObj.id}`}
              className="absolute pointer-events-auto z-50 flex gap-1"
              style={{
                left: `${screenX}px`,
                top: `${screenY}px`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              {/* Duplicate button */}
              <button
                type="button"
                onClick={() => {
                  if (onDuplicateObject) {
                    // Create a duplicate frame offset by 40px to the right
                    const newFrame = {
                      ...selectedObj,
                      id: `obj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
                      x: selectedObj.x + selectedObj.width + 40,
                      y: selectedObj.y,
                      zOrder: Date.now(),
                    };
                    onDuplicateObject(selectedObj.id, newFrame);
                  }
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-background/90 border border-border/50 text-foreground shadow-lg backdrop-blur hover:bg-accent transition-colors"
                aria-label={t("vault.canvas.frame.duplicate") || "Duplicate frame"}
                title={t("vault.canvas.frame.duplicate") || "Duplicate frame"}
              >
                <CopyPlus className="h-3.5 w-3.5" />
              </button>
              {/* Delete button */}
              <button
                type="button"
                onClick={() => onDeleteObject?.(selectedObj.id)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-background/90 border border-border/50 text-foreground shadow-lg backdrop-blur hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label={t("vault.canvas.frame.delete") || "Delete frame"}
                title={t("vault.canvas.frame.delete") || "Delete frame"}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}