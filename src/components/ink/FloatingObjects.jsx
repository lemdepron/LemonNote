import { useEffect, useRef, useState, useCallback } from "react";
import {
  renderShape,
  renderSticker,
  renderTextBox,
  renderSticky,
  hitTestObject,
  getHandleAt,
  transformObject,
  OBJECT_TYPES,
} from "@/lib/ink/objects";
import { cn } from "@/lib/utils";

const HANDLE_SIZE = 10;
const ROTATE_HANDLE_OFFSET = 30;

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
  onBringToFront,
  onSendToBack,
  editingObjectId,
  setEditingObjectId,
  scale = 1,
}) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const dragStateRef = useRef(null); // { type, objectId, startX, startY, startBounds, startRotation, handleId }
  const hoverHandleRef = useRef(null);
  const [cursor, setCursor] = useState("default");
  const [editState, setEditState] = useState({ text: "", caretPos: 0 });

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
    overlay.style.direction = "ltr";
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
      const isSelected = onSelectObject && onSelectObject(object.id);
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
      }

      // Draw selection handles
      if (isSelected && !isEditing) {
        drawHandles(ctx, object, scale);
      }
    });
  }, [objects, camera, dpr, scale, editingObjectId, onSelectObject]);

  // Draw selection handles for an object
  const drawHandles = (ctx, object, scale) => {
    const { x, y, width, height, rotation } = object;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    ctx.save();
    ctx.strokeStyle = "#e5b567"; // primary color
    ctx.fillStyle = "#fff";
    ctx.lineWidth = 1.5 / scale;
    ctx.setLineDash([]);

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

    // Rotation handle
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

    ctx.restore();
  };

  // Get object at screen position
  const getObjectAt = useCallback((screenX, screenY) => {
    const world = screenToWorld(screenX, screenY);
    // Check in reverse z-order (top first)
    const sortedObjects = [...objects].sort((a, b) => (b.zOrder || 0) - (a.zOrder || 0));
    for (const object of sortedObjects) {
      if (hitTestObject(object, world.x, world.y)) {
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

    // Check for handle hit first
    const selectedObject = onSelectObject ? objects.find((o) => onSelectObject(o.id)) : null;
    if (selectedObject && !editingObjectId) {
      const world = screenToWorld(screenX, screenY);
      const handle = getHandleAt(selectedObject, world.x, world.y, HANDLE_SIZE / camera.scale);
      if (handle) {
        dragStateRef.current = {
          type: handle.type === "corner" ? "resize" : "rotate",
          objectId: selectedObject.id,
          handleId: handle.id,
          startX: world.x,
          startY: world.y,
          startBounds: { x: selectedObject.x, y: selectedObject.y, width: selectedObject.width, height: selectedObject.height },
          startRotation: selectedObject.rotation || 0,
        };
        canvas.setPointerCapture(event.pointerId);
        return;
      }
    }

    // Check for object hit
    const object = getObjectAt(screenX, screenY);
    if (object) {
      onSelectObject?.(object.id);
      const world = screenToWorld(screenX, screenY);
      dragStateRef.current = {
        type: "move",
        objectId: object.id,
        startX: world.x,
        startY: world.y,
        startBounds: { x: object.x, y: object.y, width: object.width, height: object.height },
        startRotation: object.rotation || 0,
      };
      canvas.setPointerCapture(event.pointerId);
    } else {
      onSelectObject?.(null);
    }
  }, [objects, screenToWorld, getObjectAt, onSelectObject, editingObjectId, camera.scale]);

  // Handle pointer move
  const onPointerMove = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);

    // Update hover handle cursor
    const selectedObject = onSelectObject ? objects.find((o) => onSelectObject(o.id)) : null;
    if (selectedObject && !editingObjectId && !dragStateRef.current) {
      const handle = getHandleAt(selectedObject, world.x, world.y, HANDLE_SIZE / camera.scale);
      if (handle) {
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
  }, [objects, screenToWorld, getObjectAt, onSelectObject, onUpdateObject, editingObjectId, camera.scale]);

  // Handle pointer up
  const onPointerUp = useCallback((event) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture?.(event.pointerId);
    }
    dragStateRef.current = null;
  }, []);

  // Handle double-click for text editing
  const onDoubleClick = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const object = getObjectAt(screenX, screenY);
    if (object && (object.type === OBJECT_TYPES.TEXTBOX || object.type === OBJECT_TYPES.STICKY)) {
      setEditingObjectId(object.id);
      setEditState({ text: object.text || "", caretPos: (object.text || "").length });
      // Focus the overlay after state update
      setTimeout(() => overlayRef.current?.focus(), 0);
    }
  }, [getObjectAt, setEditingObjectId]);

  // Handle overlay text changes
  const onOverlayChange = useCallback((event) => {
    const text = event.target.value;
    setEditState((prev) => ({ ...prev, text, caretPos: event.target.selectionStart }));
    onUpdateObject?.(editingObjectId, { text });
  }, [editingObjectId, onUpdateObject]);

  // Handle overlay blur (save and exit edit)
  const onOverlayBlur = useCallback(() => {
    setEditingObjectId(null);
    setEditState({ text: "", caretPos: 0 });
  }, [setEditingObjectId]);

  // Handle overlay key down
  const onOverlayKeyDown = useCallback((event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      setEditingObjectId(null);
    } else if (event.key === "Escape") {
      // Revert to original text
      const object = objects.find((o) => o.id === editingObjectId);
      if (object) {
        onUpdateObject?.(editingObjectId, { text: object.text || "" });
      }
      setEditingObjectId(null);
    }
  }, [editingObjectId, objects, onUpdateObject, setEditingObjectId]);

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
    </div>
  );
}