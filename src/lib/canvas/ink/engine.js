import { paintElement } from "@/lib/canvas/ink/brushes";
import { drawPaper, drawTemplate, toneOf, pageIndexAt, pageOrigin, pageStep } from "@/lib/canvas/ink/paper";
import { renderRegion, samplePixel } from "@/lib/canvas/ink/raster";
import {
  boundsOf,
  distToStroke,
  pointInPolygon,
  splitStroke,
  strokeBounds,
  toPoints,
  unionBounds,
} from "@/lib/canvas/ink/smoothing";
import { recognizeShape } from "@/lib/canvas/ink/shapes";
import { tokenColor } from "@/lib/theme";
import { nextId } from "@/lib/canvas/ink/utils";
import {
  renderShape,
  renderSticker,
  renderTextBox,
  renderSticky,
  renderTextFrame,
  OBJECT_TYPES,
  createObject,
} from "@/lib/canvas/objects";

const MIN_SCALE = 0.18;
const MAX_SCALE = 8;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Canvas controller for the ink suite. Owns the camera, the layered renderer
 * (committed base + live overlay), hit-testing, erase, lasso transforms, audio
 * playback reveal and image export. Nothing is unmounted between renders, so
 * stroke identity and selection survive every interaction.
 */
export default class InkEngine {
  constructor({ base, overlay, callbacks = {}, transparent = false }) {
    this.base = base;
    this.overlay = overlay;
    this.cb = callbacks;
    this.strokes = [];
    this.objects = [];
    this.paper = { template: "grid", size: "a4", tone: "dark" };
    this.camera = { x: 0, y: 0, scale: 1 };
    this.viewport = { w: 800, h: 600, dpr: 1 };
    this.tool = {
      mode: "draw",
      brush: "fountain",
      color: tokenColor("--ink-light") || "#e9e2d0",
      alpha: 1,
      width: 3,
      size: 26,
      eraserMode: "stroke",
      nibAngle: -0.55,
      shapeRecognition: false,
      ruler: false,
      rulerAngle: 0,
      // Shape tool properties
      shapeType: "rect",
      shapeStrokeColor: tokenColor("--foreground") || "#e9e2d0",
      shapeStrokeWidth: 2,
      shapeFillColor: "none",
      shapeFillOpacity: 1,
    };
    this.live = null;
    this.dragging = null;
    this.lasso = null;
    this.selection = null;
    this.playback = null;
    this.panStart = null;
    this.rulerOrigin = null;
    this.insertSpaceDrag = null; // { dragging: boolean, startY: number, lineY: number }
    this.dirtyBase = true;
    this.dirtyOverlay = true;
    this.frame = 0;
    this.transparent = transparent;

    // Eraser drag state for single undo per drag
    this.eraseDrag = null; // { active: boolean, changed: boolean }

    // History for undo/redo
    this.historyPast = [];
    this.historyFuture = [];
  }

  setTransparent(transparent) {
    this.transparent = transparent;
    this.invalidate();
  }

  setObjects(objects) {
    this.objects = Array.isArray(objects) ? objects : [];
    this.checkFrameLocks();
    this.invalidate();
  }

  /* ---------------------------------------------------------------- scene */

  resize(cssWidth, cssHeight, dpr) {
    this.viewport = { w: Math.max(1, cssWidth), h: Math.max(1, cssHeight), dpr };
    [this.base, this.overlay].forEach((canvas) => {
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
    });
    this.invalidate();
  }

  setStrokes(strokes) {
    this.strokes = Array.isArray(strokes) ? strokes : [];
    if (this.selection) {
      const alive = new Set(this.strokes.map((stroke) => stroke.id));
      const ids = [...this.selection.ids].filter((id) => alive.has(id));
      this.selection = ids.length ? { ...this.selection, ids: new Set(ids) } : null;
    }
    this.checkFrameLocks();
    this.invalidate();
  }

  setPaper(paper) {
    this.paper = { ...this.paper, ...paper };
    this.invalidate();
  }

  setTool(patch) {
    this.tool = { ...this.tool, ...patch };
    this.dirtyOverlay = true;
    this.schedule();
  }

  setCamera(camera) {
    if (!camera) return;
    const scale = clamp(Number(camera.scale) || 1, MIN_SCALE, MAX_SCALE);
    this.camera = {
      x: Number(camera.x) || 0,
      y: Number(camera.y) || 0,
      scale,
    };
    this.invalidate();
  }

  setPlayback(ms, session = null) {
    this.playback = ms == null ? null : { ms, session };
    this.invalidate();
  }

  /* --------------------------------------------------------------- camera */

  viewRect() {
    const scale = this.camera.scale;
    return {
      left: -this.camera.x / scale,
      top: -this.camera.y / scale,
      right: (this.viewport.w - this.camera.x) / scale,
      bottom: (this.viewport.h - this.camera.y) / scale,
      scale,
    };
  }

  worldFromScreen(x, y) {
    const scale = this.camera.scale;
    return { x: (x - this.camera.x) / scale, y: (y - this.camera.y) / scale };
  }

  screenFromWorld(x, y) {
    const scale = this.camera.scale;
    return { x: x * scale + this.camera.x, y: y * scale + this.camera.y };
  }

  afterCameraChange() {
    this.cb.onCamera?.(this.camera);
    this.invalidate();
  }

  zoomAt(x, y, factor) {
    const anchor = this.worldFromScreen(x, y);
    const scale = clamp(this.camera.scale * factor, MIN_SCALE, MAX_SCALE);
    this.camera = {
      scale,
      x: x - anchor.x * scale,
      y: y - anchor.y * scale,
    };
    this.afterCameraChange();
  }

  zoomBy(factor) {
    this.zoomAt(this.viewport.w / 2, this.viewport.h / 2, factor);
  }

  panBy(dx, dy) {
    this.camera = { ...this.camera, x: this.camera.x + dx, y: this.camera.y + dy };
    this.afterCameraChange();
  }

  fit() {
    const box = unionBounds(this.strokes);
    if (!box || !box.w || !box.h) {
      this.camera = { x: 0, y: 0, scale: 1 };
      this.afterCameraChange();
      return;
    }
    const padding = 64;
    const scale = clamp(
      Math.min(
        (this.viewport.w - padding) / Math.max(1, box.w),
        (this.viewport.h - padding) / Math.max(1, box.h)
      ),
      MIN_SCALE,
      MAX_SCALE
    );
    this.camera = {
      scale,
      x: this.viewport.w / 2 - (box.x + box.w / 2) * scale,
      y: this.viewport.h / 2 - (box.y + box.h / 2) * scale,
    };
    this.afterCameraChange();
  }

  /** Fits the sheet being drawn on — or the ink on an infinite canvas — inside the viewport. */
  fitView() {
    if (pageStep(this.paper)) this.focusPage(this.currentPage());
    else this.fit();
  }

  /* ------------------------------------------------------------ history */

  /** Push a history snapshot for undo/redo */
  pushHistory() {
    this.historyPast.push({
      strokes: JSON.parse(JSON.stringify(this.strokes)),
      objects: JSON.parse(JSON.stringify(this.objects)),
    });
    // Limit history size
    if (this.historyPast.length > 60) this.historyPast.shift();
    this.historyFuture = [];
  }

  /** Undo the last action */
  undo() {
    if (!this.historyPast.length) return false;
    const current = { strokes: this.strokes, objects: this.objects };
    this.historyFuture.push(current);
    const previous = this.historyPast.pop();
    this.strokes = previous.strokes;
    this.objects = previous.objects;
    this.cb.onReplace?.(this.strokes);
    this.cb.onUpdateObject?.("__history__", this.objects); // Trigger object refresh
    this.invalidate();
    return true;
  }

  /** Redo the last undone action */
  redo() {
    if (!this.historyFuture.length) return false;
    const current = { strokes: this.strokes, objects: this.objects };
    this.historyPast.push(current);
    const next = this.historyFuture.pop();
    this.strokes = next.strokes;
    this.objects = next.objects;
    this.cb.onReplace?.(this.strokes);
    this.cb.onUpdateObject?.("__history__", this.objects);
    this.invalidate();
    return true;
  }

  get canUndo() {
    return this.historyPast.length > 0;
  }

  get canRedo() {
    return this.historyFuture.length > 0;
  }

  /** Fits the first frame (or page) to the viewport width. */
  fitWidth() {
    // First try to find a frame object
    const frame = this.objects.find((obj) => obj.type === "frame");
    if (frame) {
      const scale = clamp(
        (this.viewport.w - 48) / Math.max(1, frame.width),
        MIN_SCALE,
        MAX_SCALE
      );
      this.camera = {
        scale,
        x: this.viewport.w / 2 - (frame.x + frame.width / 2) * scale,
        y: this.viewport.h / 2 - (frame.y + frame.height / 2) * scale,
      };
      this.afterCameraChange();
      return;
    }
    // Fall back to page-based fitting
    if (pageStep(this.paper)) {
      this.focusPage(this.currentPage());
    } else {
      this.fit();
    }
  }

  focusPage(index) {
    const step = pageStep(this.paper);
    if (!step) {
      this.camera = { x: 0, y: 0, scale: 1 };
      this.afterCameraChange();
      return;
    }
    const origin = pageOrigin(index, this.paper);
    const scale = clamp(
      Math.min((this.viewport.w - 48) / step.size.w, (this.viewport.h - 48) / step.size.h),
      MIN_SCALE,
      MAX_SCALE
    );
    this.camera = {
      scale,
      x: this.viewport.w / 2 - (origin.x + step.size.w / 2) * scale,
      y: this.viewport.h / 2 - (origin.y + step.size.h / 2) * scale,
    };
    this.afterCameraChange();
    return index;
  }

  centerWorld() {
    return this.worldFromScreen(this.viewport.w / 2, this.viewport.h / 2);
  }

  currentPage() {
    return pageIndexAt(this.centerWorld(), this.paper);
  }

  /* -------------------------------------------------------------- pointer */

  pointerDown(input) {
    const world = this.worldFromScreen(input.x, input.y);
    const mode = this.tool.mode;

    if (input.button === 1 || input.button === 2 || mode === "pan" || input.altKey) {
      this.dragging = "pan";
      this.panStart = { x: input.x, y: input.y, camera: { ...this.camera } };
      return;
    }

    if (mode === "eyedropper") {
      const picked = this.sample(input.x, input.y);
      if (picked) this.cb.onPickColor?.(picked.hex, picked.alpha);
      return;
    }

    if (mode === "lasso") {
      this.dragging = "lasso";
      this.lasso = [world];
      this.dirtyOverlay = true;
      this.schedule();
      return;
    }

    if (mode === "erase") {
      if (this.selection) this.setSelection([]);
      this.dragging = "erase";
      // Start erase drag - push history immediately for proper undo
      this.pushHistory();
      this.eraseDrag = { active: true, changed: false };
      this.eraseAt(world);
      return;
    }

    // Only draw and shape modes start a stroke/shape
    if (mode !== "draw" && mode !== "shape") {
      // All other modes (select, addCard, addConnector, insertSpace, etc.) do nothing here
      // They are handled by the parent component (CanvasBoard) or do nothing on pointer down
      return;
    }

    if (this.selection) this.setSelection([]);

    if (mode === "shape" && this.tool.shapeType) {
      // Direct shape drawing mode - create a live shape object
      this.dragging = "shape";
      this.liveShape = {
        startPoint: world,
        endPoint: world,
        shapeType: this.tool.shapeType,
        strokeColor: this.tool.shapeStrokeColor,
        strokeWidth: this.tool.shapeStrokeWidth,
        fillColor: this.tool.shapeFillColor,
        fillOpacity: this.tool.shapeFillOpacity,
      };
      this.dirtyOverlay = true;
      this.schedule();
    } else {
      // Freehand drawing mode
      this.dragging = "draw";
      this.rulerOrigin = this.tool.ruler ? world : null;
      this.live = {
        id: nextId("stroke"),
        kind: "stroke",
        tool: mode === "shape" ? "shape" : "pen",
        brush: this.tool.brush,
        color: this.tool.color,
        alpha: this.tool.alpha,
        width: this.tool.width,
        nibAngle: this.tool.nibAngle,
        tilt: input.tilt ?? 0,
        points: [[world.x, world.y]],
        pressures: [input.pressure ?? 0.55],
      };
      this.dirtyOverlay = true;
      this.schedule();
    }
  }

  pointerMove(input) {
    const world = this.worldFromScreen(input.x, input.y);
    if (this.dragging === "pan" && this.panStart) {
      this.camera = {
        ...this.panStart.camera,
        x: this.panStart.camera.x + (input.x - this.panStart.x),
        y: this.panStart.camera.y + (input.y - this.panStart.y),
      };
      this.afterCameraChange();
      return;
    }
    if (this.dragging === "erase") {
      this.eraseAt(world);
      return;
    }
    if (this.dragging === "lasso" && this.lasso) {
      const last = this.lasso[this.lasso.length - 1];
      if (Math.hypot(world.x - last.x, world.y - last.y) > 2.5 / this.camera.scale) {
        this.lasso.push(world);
        this.dirtyOverlay = true;
        this.schedule();
      }
      return;
    }
    if (this.dragging === "draw" && this.live) {
      const target = this.rulerOrigin ? this.projectOnRuler(world) : world;
      const points = this.live.points;
      const last = points[points.length - 1];
      if (Math.hypot(target.x - last[0], target.y - last[1]) < 1 / this.camera.scale) return;
      points.push([target.x, target.y]);
      this.live.pressures.push(input.pressure ?? 0.55);
      if (input.tilt != null && input.tilt > 0) this.live.tilt = input.tilt;
      this.dirtyOverlay = true;
      this.schedule();
      return;
    }
    if (this.dragging === "shape" && this.liveShape) {
      // Apply shift key constraints for perfect shapes
      let endPoint = world;
      if (input.shiftKey) {
        endPoint = this.applyShapeConstraints(this.liveShape.startPoint, world, this.liveShape.shapeType);
      }
      this.liveShape.endPoint = endPoint;
      this.dirtyOverlay = true;
      this.schedule();
    }
  }

  /** Apply shift key constraints for shape drawing */
  applyShapeConstraints(start, end, shapeType) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist < 1) return end;
    
    if (shapeType === "rect" || shapeType === "rounded-rect") {
      // Constrain to square
      const size = Math.max(Math.abs(dx), Math.abs(dy));
      return {
        x: start.x + (dx >= 0 ? size : -size),
        y: start.y + (dy >= 0 ? size : -size),
      };
    }
    
    if (shapeType === "ellipse") {
      // Constrain to circle
      const size = Math.max(Math.abs(dx), Math.abs(dy));
      return {
        x: start.x + (dx >= 0 ? size : -size),
        y: start.y + (dy >= 0 ? size : -size),
      };
    }
    
    if (shapeType === "line" || shapeType === "arrow") {
      // Constrain to 45 degree increments
      const angle = Math.atan2(dy, dx);
      const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      return {
        x: start.x + Math.cos(snappedAngle) * dist,
        y: start.y + Math.sin(snappedAngle) * dist,
      };
    }
    
    // For triangle, star, polygon - maintain aspect ratio from center
    return end;
  }

  pointerUp() {
    if (this.dragging === "lasso") {
      this.finishLasso();
      this.dragging = null;
      return;
    }
    if (this.dragging === "draw" && this.live) this.commitLive();
    if (this.dragging === "shape" && this.liveShape) this.commitLiveShape();
    // Erase history is pushed at drag start (pointerDown)
    this.eraseDrag = null;
    this.liveShape = null;
    this.dragging = null;
  }

  /** Commit a live shape as a shape object */
  commitLiveShape() {
    const shape = this.liveShape;
    this.liveShape = null;
    if (!shape) return;

    const { startPoint, endPoint, shapeType, strokeColor, strokeWidth, fillColor, fillOpacity } = shape;
    
    // Calculate bounds from start and end points
    const minX = Math.min(startPoint.x, endPoint.x);
    const minY = Math.min(startPoint.y, endPoint.y);
    const maxX = Math.max(startPoint.x, endPoint.x);
    const maxY = Math.max(startPoint.y, endPoint.y);
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Skip tiny shapes
    if (width < 4 && height < 4) return;

    // For line and arrow, use center as position and full width/height
    let x, y, w, h;
    if (shapeType === "line" || shapeType === "arrow") {
      // Line/arrow: center at midpoint, width is length, height is stroke width
      const cx = (startPoint.x + endPoint.x) / 2;
      const cy = (startPoint.y + endPoint.y) / 2;
      const length = Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y);
      const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
      x = cx - length / 2;
      y = cy - strokeWidth / 2;
      w = length;
      h = strokeWidth;
      // We'll handle rotation in the object
    } else {
      x = minX;
      y = minY;
      w = Math.max(4, width);
      h = Math.max(4, height);
    }

    // Create shape object
    const shapeObj = createObject("shape", x, y, w, h, {
      shapeType,
      stroke: strokeColor,
      strokeWidth,
      fill: fillColor,
      opacity: fillOpacity,
      rotation: shapeType === "line" || shapeType === "arrow" ? Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x) : 0,
    });

    // Push history and add object
    this.pushHistory();
    this.objects.push(shapeObj);
    this.cb.onUpdateObject?.(shapeObj.id, shapeObj);
    this.invalidate();
  }

  cancel() {
    this.live = null;
    this.lasso = null;
    this.liveShape = null;
    this.rulerOrigin = null;
    this.dragging = null;
    this.dirtyOverlay = true;
    this.schedule();
  }

  projectOnRuler(point) {
    const angle = (this.tool.rulerAngle * Math.PI) / 180;
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const dx = point.x - this.rulerOrigin.x;
    const dy = point.y - this.rulerOrigin.y;
    const t = dx * ux + dy * uy;
    return { x: this.rulerOrigin.x + ux * t, y: this.rulerOrigin.y + uy * t };
  }

  commitLive() {
    const live = this.live;
    this.live = null;
    this.rulerOrigin = null;
    if (!live) return;

    // Discard tiny dots (click without movement) in draw mode
    // unless the brush is dot-capable (not implemented yet, so allow all for now)
    if (this.tool.mode === "draw" && live.points.length <= 1) {
      // Single point stroke - check if it's a tiny dot
      // For now, we allow single-point strokes (dots) for all brushes
      // TODO: Add dot-capable brush property and check it here
    }

    // Push history before committing the stroke
    this.pushHistory();
    let strokes = [live];
    if (this.tool.shapeRecognition || this.tool.mode === "shape") {
      const recognized = recognizeShape(toPoints(live));
      if (recognized) {
        // Create a single SHAPE object instead of multiple strokes
        const points = toPoints(live);
        const box = boundsOf(points);
        if (box) {
          const shapeObj = createObject("shape", box.x, box.y, box.w, box.h, {
            shapeType: recognized.type === "circle" ? "ellipse" : recognized.type,
            stroke: this.tool.shapeStrokeColor || live.color,
            strokeWidth: this.tool.shapeStrokeWidth || live.width,
            fill: this.tool.shapeFillColor || "none",
            opacity: this.tool.shapeFillOpacity ?? 1,
          });
          // Add the shape object
          this.objects.push(shapeObj);
          this.cb.onUpdateObject?.(shapeObj.id, shapeObj);
          // Don't add strokes for recognized shapes - they become objects
          strokes = [];
        }
      }
    }
    if (strokes.length > 0) {
      this.cb.onCommit?.(strokes);
    }
    this.checkFrameLocks();
    this.dirtyOverlay = true;
    this.schedule();
  }

  /** Check if any text frame should be locked due to overlapping ink strokes */
  checkFrameLocks() {
    const textFrames = this.objects.filter((obj) => obj.type === OBJECT_TYPES.TEXT_FRAME && !obj.locked);
    if (!textFrames.length) return;
    
    let changed = false;
    const updatedObjects = this.objects.map((obj) => {
      if (obj.type !== OBJECT_TYPES.TEXT_FRAME || obj.locked) return obj;
      
      // Check if any stroke point overlaps this text frame
      const frameLeft = obj.x;
      const frameRight = obj.x + obj.width;
      const frameTop = obj.y;
      const frameBottom = obj.y + obj.height;
      
      // Account for rotation
      const cx = obj.x + obj.width / 2;
      const cy = obj.y + obj.height / 2;
      const cos = Math.cos(-obj.rotation || 0);
      const sin = Math.sin(-obj.rotation || 0);
      
      const hasOverlap = this.strokes.some((stroke) => {
        if (stroke.kind === "text") {
          const box = strokeBounds(stroke);
          if (!box) return false;
          // Check text stroke bounds against frame
          const corners = [
            { x: box.x, y: box.y },
            { x: box.x + box.w, y: box.y },
            { x: box.x + box.w, y: box.y + box.h },
            { x: box.x, y: box.y + box.h },
          ];
          return corners.some((corner) => {
            const dx = corner.x - cx;
            const dy = corner.y - cy;
            const rx = cx + dx * cos - dy * sin;
            const ry = cy + dx * sin + dy * cos;
            return rx >= frameLeft && rx <= frameRight && ry >= frameTop && ry <= frameBottom;
          });
        }
        return toPoints(stroke).some((point) => {
          const dx = point.x - cx;
          const dy = point.y - cy;
          const rx = cx + dx * cos - dy * sin;
          const ry = cy + dx * sin + dy * cos;
          return rx >= frameLeft && rx <= frameRight && ry >= frameTop && ry <= frameBottom;
        });
      });
      
      if (hasOverlap) {
        changed = true;
        return { ...obj, locked: true };
      }
      return obj;
    });
    
    if (changed) {
      // Notify about each newly locked object
      updatedObjects.forEach((newObj, idx) => {
        const oldObj = this.objects[idx];
        if (newObj.locked && !oldObj.locked) {
          this.cb.onUpdateObject?.(newObj.id, newObj);
        }
      });
      this.objects = updatedObjects;
      // Trigger re-render
      this.dirtyBase = true;
      this.schedule();
    }
  }

  /* --------------------------------------------------------------- eraser */

  eraseAt(world) {
    const radius = Math.max(3, this.tool.size / 2);
    const current = this.strokes;
    if (!current.length) return;
    let next;
    let changed = false;
    if (this.tool.eraserMode === "precision") {
      next = [];
      current.forEach((stroke) => {
        if (stroke.kind === "text") {
          const box = strokeBounds(stroke);
          const inside =
            box &&
            world.x >= box.x - radius &&
            world.x <= box.x + box.w + radius &&
            world.y >= box.y - radius &&
            world.y <= box.y + box.h + radius;
          if (inside) changed = true;
          else next.push(stroke);
          return;
        }
        const pieces = splitStroke(stroke, world, radius);
        if (pieces.length !== 1 || pieces[0] !== stroke) changed = true;
        next.push(...pieces);
      });
    } else {
      next = current.filter(
        (stroke) => distToStroke(world, stroke) > radius + (stroke.width || 0) / 2
      );
      if (next.length !== current.length) changed = true;
    }
    if (!changed) return;

    // Track that something changed during this drag (for single undo per drag)
    if (this.eraseDrag?.active) {
      this.eraseDrag.changed = true;
    } else {
      // Not in a drag (e.g., single click) - push history immediately
      this.pushHistory();
    }
    this.strokes = next;
    this.cb.onReplace?.(next);
    this.checkFrameLocks();
    this.invalidate();
  }

  /** Clear all ink strokes (keeps objects/cards/shapes) */
  clearAllStrokes() {
    if (!this.strokes.length) return;
    this.pushHistory();
    this.strokes = [];
    this.cb.onReplace?.([]);
    this.invalidate();
  }

  /* ------------------------------------------------------------ selection */

  finishLasso() {
    const polygon = this.lasso;
    this.lasso = null;
    if (!polygon || polygon.length < 3) {
      this.setSelection([]);
      return;
    }
    const ids = this.strokes
      .filter((stroke) => {
        if (stroke.kind === "text") {
          const box = strokeBounds(stroke);
          if (!box) return false;
          return [
            { x: box.x, y: box.y },
            { x: box.x + box.w, y: box.y },
            { x: box.x, y: box.y + box.h },
            { x: box.x + box.w, y: box.y + box.h },
            { x: box.x + box.w / 2, y: box.y + box.h / 2 },
          ].some((corner) => pointInPolygon(corner, polygon));
        }
        return toPoints(stroke).some((point) => pointInPolygon(point, polygon));
      })
      .map((stroke) => stroke.id);
    this.setSelection(ids);
  }

  setSelection(ids) {
    const unique = [...new Set(ids)].filter(Boolean);
    this.selection = unique.length
      ? { ids: new Set(unique), transform: { dx: 0, dy: 0, scale: 1, rotate: 0 } }
      : null;
    this.cb.onSelection?.(unique, this.selectionBounds());
    this.invalidate();
  }

  selectionBounds() {
    if (!this.selection) return null;
    return unionBounds(this.selectedStrokes());
  }

  selectedStrokes() {
    if (!this.selection) return [];
    return this.strokes.filter((stroke) => this.selection.ids.has(stroke.id));
  }

  setSelectionTransform(patch) {
    if (!this.selection) return;
    this.selection = {
      ...this.selection,
      transform: { ...this.selection.transform, ...patch },
    };
    this.dirtyOverlay = true;
    this.schedule();
  }

  commitSelection() {
    if (!this.selection) return;
    const { dx, dy, scale, rotate } = this.selection.transform;
    const box = this.selectionBounds();
    if (!box) return;
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const cos = Math.cos(rotate);
    const sin = Math.sin(rotate);
    const map = (x, y) => {
      const lx = (x - cx) * scale;
      const ly = (y - cy) * scale;
      return [cx + lx * cos - ly * sin + dx, cy + lx * sin + ly * cos + dy];
    };
    const ids = this.selection.ids;
    const next = this.strokes.map((stroke) => {
      if (!ids.has(stroke.id)) return stroke;
      if (stroke.kind === "text") {
        const [x, y] = map(stroke.x || 0, stroke.y || 0);
        return {
          ...stroke,
          x: Number(x.toFixed(2)),
          y: Number(y.toFixed(2)),
          fontSize: Number(((stroke.fontSize || 22) * scale).toFixed(2)),
        };
      }
      const original = toPoints(stroke);
      const points = original.map((point) => {
        const [x, y] = map(point.x, point.y);
        return [Number(x.toFixed(2)), Number(y.toFixed(2))];
      });
      return {
        ...stroke,
        points,
        pressures: original.map((point) => Number(point.p.toFixed(3))),
        width: Number(((stroke.width || 3) * scale).toFixed(2)),
      };
    });
    // Push history before committing selection transform
    this.pushHistory();
    this.strokes = next;
    this.cb.onReplace?.(next);
    this.selection = { ids, transform: { dx: 0, dy: 0, scale: 1, rotate: 0 } };
    this.cb.onSelection?.(next.map((stroke) => stroke.id).filter((id) => ids.has(id)), this.selectionBounds());
    this.invalidate();
  }

  recolorSelection(color, alpha) {
    if (!this.selection) return;
    const ids = this.selection.ids;
    const next = this.strokes.map((stroke) =>
      ids.has(stroke.id) ? { ...stroke, color, alpha: alpha ?? stroke.alpha } : stroke
    );
    // Push history before recoloring
    this.pushHistory();
    this.strokes = next;
    this.cb.onReplace?.(next);
    this.invalidate();
  }

  deleteSelection() {
    if (!this.selection) return;
    const ids = this.selection.ids;
    const next = this.strokes.filter((stroke) => !ids.has(stroke.id));
    // Push history before deleting
    this.pushHistory();
    this.strokes = next;
    this.cb.onReplace?.(next);
    this.setSelection([]);
  }

  /**
   * Insert or remove vertical space at a given Y coordinate.
   * Positive distance = insert space (move strokes below line down)
   * Negative distance = remove space (move strokes below line up), limited by overlaps.
   * Returns { moved: number, limited: boolean } where limited=true if upward move was clamped.
   */
  insertSpace(lineY, distance) {
    if (distance === 0) return { moved: 0, limited: false };

    // Push history before the modification
    this.pushHistory();

    const strokes = this.strokes;
    let limited = false;
    let actualDistance = distance;

    if (distance < 0) {
      // Moving up: check for overlaps. Find the highest point of any stroke below the line.
      // We can only move up until the lowest stroke below the line would hit the line.
      let minGap = Infinity;
      strokes.forEach((stroke) => {
        if (stroke.kind === "text") {
          const box = strokeBounds(stroke);
          if (box && box.y > lineY) {
            const gap = box.y - lineY;
            if (gap < minGap) minGap = gap;
          }
        } else {
          const points = toPoints(stroke);
          points.forEach((point) => {
            if (point.y > lineY) {
              const gap = point.y - lineY;
              if (gap < minGap) minGap = gap;
            }
          });
        }
      });
      // The maximum upward movement is the minimum gap
      if (minGap !== Infinity && -distance > minGap) {
        actualDistance = -minGap;
        limited = true;
      }
    }

    // Apply the movement to all strokes below the line
    const next = strokes.map((stroke) => {
      if (stroke.kind === "text") {
        const box = strokeBounds(stroke);
        if (box && box.y > lineY) {
          return { ...stroke, y: Number((stroke.y + actualDistance).toFixed(2)) };
        }
        return stroke;
      }
      // For regular strokes, check if any point is below the line
      const points = toPoints(stroke);
      const hasPointBelow = points.some((point) => point.y > lineY);
      if (!hasPointBelow) return stroke;

      // Move all points that are below the line
      const newPoints = points.map((point) => {
        if (point.y > lineY) {
          return [Number((point.x).toFixed(2)), Number((point.y + actualDistance).toFixed(2))];
        }
        return [Number(point.x.toFixed(2)), Number(point.y.toFixed(2))];
      });
      return { ...stroke, points: newPoints };
    });

    this.strokes = next;
    this.cb.onReplace?.(next);
    this.invalidate();
    return { moved: Math.abs(actualDistance), limited };
  }

  /* ---------------------------------------------------------------- export */

  regionForExport() {
    if (this.selection) {
      const box = this.selectionBounds();
      if (box) {
        const pad = 24;
        return { x: box.x - pad, y: box.y - pad, w: box.w + pad * 2, h: box.h + pad * 2 };
      }
    }
    const step = pageStep(this.paper);
    if (step) {
      const origin = pageOrigin(pageIndexAt(this.centerWorld(), this.paper), this.paper);
      return { x: origin.x, y: origin.y, w: step.size.w, h: step.size.h };
    }
    const view = this.viewRect();
    return { x: view.left, y: view.top, w: view.right - view.left, h: view.bottom - view.top };
  }

  exportImage() {
    const region = this.regionForExport();
    const scale = Math.min(2.4, 1800 / Math.max(region.w, region.h));
    const canvas = renderRegion({
      strokes: this.strokes,
      paper: this.paper,
      region,
      scale: Math.max(0.4, scale),
      light: true,
    });
    return canvas.toDataURL("image/png");
  }

  sample(x, y) {
    return samplePixel(this.base, x, y, this.viewport.dpr);
  }

  /* -------------------------------------------------------------- painting */

  invalidate() {
    this.dirtyBase = true;
    this.dirtyOverlay = true;
    this.schedule();
  }

  schedule() {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.paint();
    });
  }

  applyCamera(ctx) {
    const { dpr } = this.viewport;
    const { x, y, scale } = this.camera;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * x, dpr * y);
  }

  paint() {
    if (!this.base || !this.overlay) return;
    if (this.dirtyBase) {
      this.paintBase();
      this.dirtyBase = false;
      this.dirtyOverlay = true;
    }
    if (this.dirtyOverlay) {
      this.paintOverlay();
      this.dirtyOverlay = false;
    }
  }

  paintBase() {
    const ctx = this.base.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.base.width, this.base.height);
    this.applyCamera(ctx);

    const view = this.viewRect();
    const hidden = this.selection?.ids;
    const light = this.paper.tone === "light";

    // Draw the outside background (infinite canvas background)
    if (!this.transparent) {
      const tone = toneOf(this.paper);
      ctx.fillStyle = tone.outside;
      ctx.fillRect(view.left, view.top, view.right - view.left, view.bottom - view.top);
    }

    // Draw strokes
    this.strokes.forEach((stroke) => {
      if (hidden?.has(stroke.id)) return;
      if (this.hiddenByPlayback(stroke)) return;
      paintElement(ctx, stroke, { light });
    });

    // Render frame objects with their own paper
    const scale = this.camera.scale;
    this.objects.forEach((object) => {
      if (object.type === OBJECT_TYPES.FRAME && object.visible !== false) {
        this.drawFramePaper(ctx, object, view, scale, light);
      }
    });

    // Render other objects on top
    this.objects.forEach((object) => {
      if (object.type === OBJECT_TYPES.FRAME) return; // Already rendered
      switch (object.type) {
        case OBJECT_TYPES.SHAPE:
          renderShape(ctx, object, scale);
          break;
        case OBJECT_TYPES.STICKER:
          renderSticker(ctx, object, scale);
          break;
        case OBJECT_TYPES.TEXTBOX:
          renderTextBox(ctx, object, scale, false);
          break;
        case OBJECT_TYPES.STICKY:
          renderSticky(ctx, object, scale, false);
          break;
        case OBJECT_TYPES.TEXT_FRAME:
          renderTextFrame(ctx, object, scale, false);
          break;
      }
    });
  }

  /** Draw paper template inside a frame's bounds */
  drawFramePaper(ctx, frame, view, scale, light) {
    const { x, y, width, height, paper: framePaper = {} } = frame;
    const template = framePaper.template || "grid";
    // Use frame's paper settings directly; toneOf handles "auto" tone
    const toneColors = toneOf(framePaper);

    // Frame bounds in world coordinates
    const frameRect = {
      x: x,
      y: y,
      w: width,
      h: height,
    };

    // Skip if frame is outside view
    if (
      frameRect.x + frameRect.w < view.left ||
      frameRect.x > view.right ||
      frameRect.y + frameRect.h < view.top ||
      frameRect.y > view.bottom
    ) {
      return;
    }

    // Draw frame background (page color)
    ctx.fillStyle = toneColors.page;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(frameRect.x, frameRect.y, frameRect.w, frameRect.h, 10);
    else ctx.rect(frameRect.x, frameRect.y, frameRect.w, frameRect.h);
    ctx.fill();

    // Draw frame border
    ctx.strokeStyle = toneColors.border;
    ctx.lineWidth = 1 / Math.max(0.2, scale);
    ctx.stroke();

    // Draw paper template inside frame
    drawTemplate(ctx, frameRect, template, toneColors, scale);
  }

  hiddenByPlayback(stroke) {
    const playback = this.playback;
    if (!playback) return false;
    if (stroke.t == null) return false;
    if (playback.session && stroke.session && stroke.session !== playback.session) return false;
    return stroke.t > playback.ms;
  }

  /** Render a live shape being drawn */
  renderLiveShape(ctx, shape, scale, light) {
    const { startPoint, endPoint, shapeType, strokeColor, strokeWidth, fillColor, fillOpacity } = shape;
    
    const minX = Math.min(startPoint.x, endPoint.x);
    const minY = Math.min(startPoint.y, endPoint.y);
    const maxX = Math.max(startPoint.x, endPoint.x);
    const maxY = Math.max(startPoint.y, endPoint.y);
    const width = maxX - minX;
    const height = maxY - minY;
    
    if (width < 1 && height < 1) return;

    let x, y, w, h, rotation = 0;
    if (shapeType === "line" || shapeType === "arrow") {
      const cx = (startPoint.x + endPoint.x) / 2;
      const cy = (startPoint.y + endPoint.y) / 2;
      const length = Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y);
      const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
      x = cx - length / 2;
      y = cy - strokeWidth / 2;
      w = length;
      h = strokeWidth;
      rotation = angle;
    } else {
      x = minX;
      y = minY;
      w = Math.max(4, width);
      h = Math.max(4, height);
    }

    // Create a temporary shape object for rendering
    const tempShape = {
      x, y, width: w, height: h,
      shapeType,
      stroke: strokeColor,
      strokeWidth,
      fill: fillColor,
      opacity: fillOpacity,
      rotation,
    };

    renderShape(ctx, tempShape, scale);
  }

  paintOverlay() {
    const ctx = this.overlay.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
    this.applyCamera(ctx);
    const light = this.paper.tone === "light";
    const scale = this.camera.scale;

    const selected = this.selectedStrokes();
    const box = selected.length ? this.selectionBounds() : null;
    if (selected.length && this.selection && box) {
      const t = this.selection.transform;
      const cx = box.x + box.w / 2;
      const cy = box.y + box.h / 2;
      ctx.save();
      ctx.translate(cx + t.dx, cy + t.dy);
      ctx.rotate(t.rotate);
      ctx.scale(t.scale, t.scale);
      ctx.translate(-cx, -cy);
      selected.forEach((stroke) => paintElement(ctx, stroke, { light }));
      ctx.restore();
      this.paintSelectionBox(ctx, this.transformedBox(box, t), scale);
    }

    if (this.live) paintElement(ctx, this.live, { light });

    // Render live shape being drawn
    if (this.liveShape) {
      this.renderLiveShape(ctx, this.liveShape, scale, light);
    }

    if (this.lasso && this.lasso.length > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.lasso[0].x, this.lasso[0].y);
      this.lasso.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.closePath();
      ctx.fillStyle = tokenColor("--link", 0.12) || "rgba(127,200,192,0.12)";
      ctx.fill();
      ctx.strokeStyle = tokenColor("--link", 0.75) || "rgba(127,200,192,0.75)";
      ctx.lineWidth = 1.2 / scale;
      ctx.setLineDash([6 / scale, 5 / scale]);
      ctx.stroke();
      ctx.restore();
    }

    if (this.tool.ruler && this.rulerOrigin) {
      const angle = (this.tool.rulerAngle * Math.PI) / 180;
      const view = this.viewRect();
      const span = Math.hypot(view.right - view.left, view.bottom - view.top);
      ctx.save();
      ctx.strokeStyle = tokenColor("--primary", 0.55) || "rgba(229,181,103,0.55)";
      ctx.lineWidth = 1.4 / scale;
      ctx.setLineDash([9 / scale, 6 / scale]);
      ctx.beginPath();
      ctx.moveTo(this.rulerOrigin.x - Math.cos(angle) * span, this.rulerOrigin.y - Math.sin(angle) * span);
      ctx.lineTo(this.rulerOrigin.x + Math.cos(angle) * span, this.rulerOrigin.y + Math.sin(angle) * span);
      ctx.stroke();
      ctx.restore();
    }

    // Insert space guide line
    if (this.insertSpaceDrag && this.insertSpaceDrag.dragging) {
      const view = this.viewRect();
      const lineY = this.insertSpaceDrag.lineY;
      const startX = view.left - 10000;
      const endX = view.right + 10000;
      ctx.save();
      ctx.strokeStyle = tokenColor("--primary", 0.85) || "rgba(229,181,103,0.85)";
      ctx.lineWidth = 1.5 / scale;
      ctx.setLineDash([8 / scale, 6 / scale]);
      ctx.beginPath();
      ctx.moveTo(startX, lineY);
      ctx.lineTo(endX, lineY);
      ctx.stroke();
      ctx.restore();
    }
  }

  transformedBox(box, t) {
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const cos = Math.cos(t.rotate);
    const sin = Math.sin(t.rotate);
    const points = [
      [box.x, box.y],
      [box.x + box.w, box.y],
      [box.x + box.w, box.y + box.h],
      [box.x, box.y + box.h],
    ].map(([x, y]) => {
      const lx = (x - cx) * t.scale;
      const ly = (y - cy) * t.scale;
      return {
        x: cx + lx * cos - ly * sin + t.dx,
        y: cy + lx * sin + ly * cos + t.dy,
      };
    });
    return boundsOf(points);
  }

  paintSelectionBox(ctx, box, scale) {
    if (!box) return;
    ctx.save();
    ctx.strokeStyle = tokenColor("--link", 0.9) || "rgba(127,200,192,0.9)";
    ctx.fillStyle = tokenColor("--link", 0.9) || "rgba(127,200,192,0.9)";
    ctx.lineWidth = 1.2 / scale;
    ctx.setLineDash([7 / scale, 5 / scale]);
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.setLineDash([]);
    const size = 6 / scale;
    [
      [box.x, box.y],
      [box.x + box.w, box.y],
      [box.x + box.w, box.y + box.h],
      [box.x, box.y + box.h],
    ].forEach(([x, y]) => {
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    });
    ctx.restore();
  }
}
