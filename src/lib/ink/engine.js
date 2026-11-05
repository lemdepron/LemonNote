import { paintElement } from "@/lib/ink/brushes";
import { drawPaper, pageIndexAt, pageOrigin, pageStep } from "@/lib/ink/paper";
import { renderRegion, samplePixel } from "@/lib/ink/raster";
import {
  boundsOf,
  distToStroke,
  pointInPolygon,
  splitStroke,
  strokeBounds,
  toPoints,
  unionBounds,
} from "@/lib/ink/smoothing";
import { recognizeShape } from "@/lib/ink/shapes";
import { tokenColor } from "@/lib/theme";

const MIN_SCALE = 0.18;
const MAX_SCALE = 8;

let counter = 0;
const nextId = (prefix) => `${prefix}-${Date.now().toString(36)}-${(counter += 1).toString(36)}`;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Canvas controller for the ink suite. Owns the camera, the layered renderer
 * (committed base + live overlay), hit-testing, erase, lasso transforms, audio
 * playback reveal and image export. Nothing is unmounted between renders, so
 * stroke identity and selection survive every interaction.
 */
export default class InkEngine {
  constructor({ base, overlay, callbacks = {} }) {
    this.base = base;
    this.overlay = overlay;
    this.cb = callbacks;
    this.strokes = [];
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
    };
    this.live = null;
    this.dragging = null;
    this.lasso = null;
    this.selection = null;
    this.playback = null;
    this.panStart = null;
    this.rulerOrigin = null;
    this.dirtyBase = true;
    this.dirtyOverlay = true;
    this.frame = 0;
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
      this.eraseAt(world);
      return;
    }

    if (this.selection) this.setSelection([]);
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
    }
  }

  pointerUp() {
    if (this.dragging === "lasso") {
      this.finishLasso();
      this.dragging = null;
      return;
    }
    if (this.dragging === "draw" && this.live) this.commitLive();
    this.dragging = null;
  }

  cancel() {
    this.live = null;
    this.lasso = null;
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
    let strokes = [live];
    if (this.tool.shapeRecognition || this.tool.mode === "shape") {
      const recognized = recognizeShape(toPoints(live));
      if (recognized) {
        strokes = recognized.paths.map((path, index) => ({
          ...live,
          id: index === 0 ? live.id : nextId("stroke"),
          shape: recognized.type,
          tilt: 0,
          points: path.map((point) => [point.x, point.y]),
          pressures: path.map((point) => point.p ?? 0.75),
        }));
      }
    }
    this.cb.onCommit?.(strokes);
    this.dirtyOverlay = true;
    this.schedule();
  }

  /* --------------------------------------------------------------- eraser */

  eraseAt(world) {
    const radius = Math.max(3, this.tool.size / 2);
    const current = this.strokes;
    if (!current.length) return;
    let next;
    if (this.tool.eraserMode === "precision") {
      next = [];
      let changed = false;
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
      if (!changed) return;
    } else {
      next = current.filter(
        (stroke) => distToStroke(world, stroke) > radius + (stroke.width || 0) / 2
      );
      if (next.length === current.length) return;
    }
    this.strokes = next;
    this.cb.onReplace?.(next);
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
    this.strokes = next;
    this.cb.onReplace?.(next);
    this.invalidate();
  }

  deleteSelection() {
    if (!this.selection) return;
    const ids = this.selection.ids;
    const next = this.strokes.filter((stroke) => !ids.has(stroke.id));
    this.strokes = next;
    this.cb.onReplace?.(next);
    this.setSelection([]);
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
    drawPaper(ctx, { paper: this.paper, view: this.viewRect() });
    const hidden = this.selection?.ids;
    const light = this.paper.tone === "light";
    this.strokes.forEach((stroke) => {
      if (hidden?.has(stroke.id)) return;
      if (this.hiddenByPlayback(stroke)) return;
      paintElement(ctx, stroke, { light });
    });
  }

  hiddenByPlayback(stroke) {
    const playback = this.playback;
    if (!playback) return false;
    if (stroke.t == null) return false;
    if (playback.session && stroke.session && stroke.session !== playback.session) return false;
    return stroke.t > playback.ms;
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