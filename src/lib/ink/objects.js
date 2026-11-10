/**
 * Floating object types and utilities for the ink overlay.
 * Objects live on the ink page and can be shapes, stickers, text boxes, or sticky notes.
 * Coordinates are in "page coordinates": pixels from top-left of the content area.
 */

export const OBJECT_TYPES = {
  SHAPE: "shape",
  STICKER: "sticker",
  TEXTBOX: "textbox",
  STICKY: "sticky",
};

export const SHAPE_TYPES = [
  { id: "rect", label: "Rectangle", hint: "Rectangle" },
  { id: "rounded-rect", label: "Rounded rect", hint: "Rounded rectangle" },
  { id: "ellipse", label: "Ellipse", hint: "Ellipse / circle" },
  { id: "line", label: "Line", hint: "Straight line" },
  { id: "arrow", label: "Arrow", hint: "Arrow" },
  { id: "triangle", label: "Triangle", hint: "Triangle" },
  { id: "star", label: "Star", hint: "5-point star" },
];

/** Built-in sticker set (24 simple SVG stickers drawn as paths) */
export const STICKERS = [
  { id: "star-1", label: "Star", paths: ["M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"] },
  { id: "heart", label: "Heart", paths: ["M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"] },
  { id: "smile", label: "Smile", paths: ["M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-4-6c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm8 0c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2z"] },
  { id: "thumbs-up", label: "Thumbs up", paths: ["M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"] },
  { id: "lightning", label: "Lightning", paths: ["M13 2L3 14h9l-1 8 10-12h-9l1-8z"] },
  { id: "cloud", label: "Cloud", paths: ["M19.36 10a4.5 4.5 0 0 0-4.5-4.5h-3A5.5 5.5 0 0 0 4 15.5 5.5 5.5 0 0 0 9.5 21h10a4.5 4.5 0 0 0 4.5-4.5c0-1.74-.86-3.29-2.14-4.26z"] },
  { id: "sun", label: "Sun", paths: ["M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"] },
  { id: "moon", label: "Moon", paths: ["M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"] },
  { id: "flower", label: "Flower", paths: ["M12 2a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm0 18a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1zM4.93 4.93a1 1 0 0 1 1.41 0l1.59 1.59a1 1 0 0 1 0 1.41l-1.59 1.59a1 1 0 0 1-1.41 0l-1.59-1.59a1 1 0 0 1 0-1.41l1.59-1.59zM17.66 17.66a1 1 0 0 1 1.41 0l1.59 1.59a1 1 0 0 1 0 1.41l-1.59 1.59a1 1 0 0 1-1.41 0l-1.59-1.59a1 1 0 0 1 0-1.41l1.59-1.59zM2 12a1 1 0 0 1 1-1h2a1 1 0 0 1 0 2H3a1 1 0 0 1-1-1zm18 0a1 1 0 0 1 1-1h2a1 1 0 0 1 0 2h-2a1 1 0 0 1-1-1zM4.93 19.07a1 1 0 0 1 1.41 0l1.59-1.59a1 1 0 0 1 0-1.41l-1.59-1.59a1 1 0 0 1-1.41 0l-1.59 1.59a1 1 0 0 1 0 1.41l1.59 1.59zM17.66 6.34a1 1 0 0 1 1.41 0l1.59-1.59a1 1 0 0 1 0-1.41l-1.59-1.59a1 1 0 0 1-1.41 0l-1.59 1.59a1 1 0 0 1 0 1.41l1.59 1.59zM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"] },
  { id: "music", label: "Music", paths: ["M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"] },
  { id: "camera", label: "Camera", paths: ["M20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l4-4 4 4h8v10z"] },
  { id: "bookmark", label: "Bookmark", paths: ["M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"] },
  { id: "flag", label: "Flag", paths: ["M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-7.6z"] },
  { id: "tag", label: "Tag", paths: ["M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7a3 3 0 1 1 6 0 3 3 0 0 1-6 0z"] },
  { id: "paperclip", label: "Paperclip", paths: ["M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-7 14H6v-2h6v2zm4-4H6v-2h10v2zm0-4H6V7h10v2z"] },
  { id: "bell", label: "Bell", paths: ["M12 2a7 7 0 0 1 7 7c0 4.15-2.14 7.64-5.42 9.12-.5.21-1.14.13-1.48-.19-.33-.33-.49-.83-.49-1.31 0-.94.58-1.78 1.44-2.12C13.38 22.2 15.9 21 18 21c1.1 0 2-.9 2-2V7c0-2.76-2.24-5-5-5h-1c-.55 0-1 .45-1 1s.45 1 1 1h1c1.66 0 3 1.34 3 3 0 1.58-.99 2.94-2.4 3.44.08.33.08.68 0 1.01-.14.58-.63.98-1.13.89C13.43 17.29 12 15.79 12 14c0-3.31 2.69-6 6-6v-4c0-.55-.45-1-1-1s-1 .45-1 1v4c0 2.21-1.79 4-4 4S6 14.21 6 12c0-.46.04-.91.1-1.35-.78-.07-1.44-.77-1.44-1.58 0-.5.4-1 1-1h9c.6 0 1.1.45.99 1-.09.45-.49.8-.93.94C8.65 11.67 8 12.34 8 13c0 2.76 2.24 5 5 5h1c.55 0 1-.45 1-1s-.45-1-1-1h-1c-1.66 0-3-1.34-3-3 0-1.31.78-2.46 1.9-3.02.33-.17.58-.55.66-1.01.02-.12.03-.23.03-.35 0-3.87-3.13-7-7-7z"] },
  { id: "gift", label: "Gift", paths: ["M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v10c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"] },
  { id: "cake", label: "Cake", paths: ["M19.5 11c.5 0 .5-.5.5-1H20v-4c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v4h.5c0 .5 0 1 .5 1H5a2 2 0 0 0-2 2v3.5c0 1.38 1.12 2.5 2.5 2.5h11c1.38 0 2.5-1.12 2.5-2.5V13a2 2 0 0 0-2-2h-1.5zM16 11h-4v4h4v-4zm-8 0H8v4h4v-4zm4 6H8v-4h4v4z"] },
  { id: "rocket", label: "Rocket", paths: ["M4.5 16.5c-1.34 2.01-1.06 4.52.64 6.22 1.13 1.13 2.5.97 3.77-.33L15 13.41V4h4v3h-4v4.59l4.59 4.59c1.3 1.3.97 3.37-.33 4.7-1.7 1.7-4.22 2.04-6.22.64L4.5 16.5zM13 5c0-1.1-.9-2-2-2S9 3.9 9 5s.9 2 2 2 2-.9 2-2z"] },
  { id: "leaf", label: "Leaf", paths: ["M17 11l-5 5L2 16l5-5-5-5L6 2l9 9-4 4zm-7 1l5-5 4 4-5 5-4-4z"] },
  { id: "fire", label: "Fire", paths: ["M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01C3.84 7.66 1.15 12.27 2.3 17.62c.24 1.13 1.23 1.98 2.36 1.98h14.69c1.44 0 2.23-1.29 2.07-2.67C21.37 13.7 20.45 9.48 18.92 6.01zM14 19.5c-1.93 0-3.5-1.57-3.5-3.5S12.07 12.5 14 12.5s3.5 1.57 3.5 3.5S15.93 19.5 14 19.5z"] },
  { id: "diamond", label: "Diamond", paths: ["M12 2L2 12l10 10 10-10-10-10zM12 3.5l8.5 8.5-8.5 8.5-8.5-8.5 8.5-8.5z"] },
  { id: "sparkles", label: "Sparkles", paths: ["M5 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5zM19 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5zM12 17l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z"] },
  { id: "check", label: "Check", paths: ["M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"] },
  { id: "star-outline", label: "Star outline", paths: ["M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2zM12 4.5l-2.89 5.86L2.5 8.5l6.37.91-2.89 5.86L12 15l6.02 3.17-2.89-5.86L21.5 8.5l-6.37-.91 2.89-5.86L12 4.5z"] },
];

/** Default object properties */
export const DEFAULT_OBJECT_PROPS = {
  [OBJECT_TYPES.SHAPE]: {
    shapeType: "rect",
    fill: "none",
    stroke: "#e9e2d0",
    strokeWidth: 2,
    strokeDash: "solid", // solid, dash, dot
    opacity: 1,
    wrap: "front", // inline, square, behind, front
    visible: true,
    locked: false,
    groupId: null,
  },
  [OBJECT_TYPES.STICKER]: {
    stickerId: "star-1",
    color: "#e9e2d0",
    opacity: 1,
    wrap: "front",
    visible: true,
    locked: false,
    groupId: null,
  },
  [OBJECT_TYPES.TEXTBOX]: {
    text: "",
    fontSize: 16,
    fontFamily: "inherit",
    color: "#e9e2d0",
    align: "left",
    background: "transparent",
    padding: 8,
    opacity: 1,
    wrap: "front",
    visible: true,
    locked: false,
    groupId: null,
  },
  [OBJECT_TYPES.STICKY]: {
    text: "",
    fontSize: 14,
    fontFamily: "inherit",
    color: "#111827",
    background: "#fef08a",
    opacity: 1,
    wrap: "front",
    visible: true,
    locked: false,
    groupId: null,
  },
};

/** Create a new object with defaults */
export function createObject(type, x, y, width, height, overrides = {}) {
  const defaults = DEFAULT_OBJECT_PROPS[type] || {};
  const now = Date.now();
  return {
    id: `obj-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    x: Number(x.toFixed(1)),
    y: Number(y.toFixed(1)),
    width: Number(width.toFixed(1)),
    height: Number(height.toFixed(1)),
    rotation: 0,
    zOrder: now, // use timestamp for initial z-order
    ...defaults,
    ...overrides,
  };
}

/** Get default size for object type */
export function getDefaultSize(type, shapeType) {
  switch (type) {
    case OBJECT_TYPES.SHAPE:
      if (shapeType === "line" || shapeType === "arrow") return { width: 200, height: 2 };
      if (shapeType === "triangle") return { width: 100, height: 100 };
      if (shapeType === "star") return { width: 100, height: 100 };
      return { width: 120, height: 80 };
    case OBJECT_TYPES.STICKER:
      return { width: 64, height: 64 };
    case OBJECT_TYPES.TEXTBOX:
      return { width: 200, height: 100 };
    case OBJECT_TYPES.STICKY:
      return { width: 180, height: 180 };
    default:
      return { width: 100, height: 100 };
  }
}

/** Hit test: check if point is inside object bounds (with rotation) */
export function hitTestObject(object, x, y) {
  // Transform point to object's local coordinates
  const cx = object.x + object.width / 2;
  const cy = object.y + object.height / 2;
  const cos = Math.cos(-object.rotation);
  const sin = Math.sin(-object.rotation);
  const dx = x - cx;
  const dy = y - cy;
  const localX = dx * cos - dy * sin + cx;
  const localY = dx * sin + dy * cos + cy;
  
  return localX >= object.x &&
         localX <= object.x + object.width &&
         localY >= object.y &&
         localY <= object.y + object.height;
}

/** Get handle at position (for resize/rotate) */
export function getHandleAt(object, x, y, handleSize = 10) {
  const cx = object.x + object.width / 2;
  const cy = object.y + object.height / 2;
  const cos = Math.cos(object.rotation);
  const sin = Math.sin(object.rotation);
  
  // Corner handles
  const corners = [
    { x: object.x, y: object.y, id: "tl" },
    { x: object.x + object.width, y: object.y, id: "tr" },
    { x: object.x + object.width, y: object.y + object.height, id: "br" },
    { x: object.x, y: object.y + object.height, id: "bl" },
  ];
  
  for (const corner of corners) {
    const dx = corner.x - cx;
    const dy = corner.y - cy;
    const rx = cx + dx * cos - dy * sin;
    const ry = cy + dx * sin + dy * cos;
    const dist = Math.hypot(x - rx, y - ry);
    if (dist <= handleSize / Math.max(1, Math.sqrt(cos * cos + sin * sin))) {
      return { type: "corner", id: corner.id };
    }
  }
  
  // Rotation handle (above top-center)
  const rotX = cx;
  const rotY = object.y - 30;
  const dx = rotX - cx;
  const dy = rotY - cy;
  const rotRx = cx + dx * cos - dy * sin;
  const rotRy = cy + dx * sin + dy * cos;
  const rotDist = Math.hypot(x - rotRx, y - rotRy);
  if (rotDist <= handleSize) {
    return { type: "rotate" };
  }
  
  return null;
}

/** Apply transform to object (move, resize, rotate) */
export function transformObject(object, transform) {
  const { type, id, startX, startY, currentX, currentY, startBounds, startRotation } = transform;
  
  if (type === "move") {
    const dx = currentX - startX;
    const dy = currentY - startY;
    return {
      ...object,
      x: Number((startBounds.x + dx).toFixed(1)),
      y: Number((startBounds.y + dy).toFixed(1)),
    };
  }
  
  if (type === "resize") {
    const cx = startBounds.x + startBounds.width / 2;
    const cy = startBounds.y + startBounds.height / 2;
    const cos = Math.cos(startRotation);
    const sin = Math.sin(startRotation);
    
    // Transform current point to object's local space at start rotation
    const dx = currentX - cx;
    const dy = currentY - cy;
    const localX = dx * cos + dy * sin;
    const localY = -dx * sin + dy * cos;
    
    let newX = startBounds.x;
    let newY = startBounds.y;
    let newWidth = startBounds.width;
    let newHeight = startBounds.height;
    
    switch (id) {
      case "tl":
        newWidth = startBounds.width - localX * 2;
        newHeight = startBounds.height - localY * 2;
        newX = startBounds.x + localX * 2;
        newY = startBounds.y + localY * 2;
        break;
      case "tr":
        newWidth = startBounds.width + localX * 2;
        newHeight = startBounds.height - localY * 2;
        newY = startBounds.y + localY * 2;
        break;
      case "br":
        newWidth = startBounds.width + localX * 2;
        newHeight = startBounds.height + localY * 2;
        break;
      case "bl":
        newWidth = startBounds.width - localX * 2;
        newHeight = startBounds.height + localY * 2;
        newX = startBounds.x + localX * 2;
        break;
    }
    
    // Minimum size
    newWidth = Math.max(10, newWidth);
    newHeight = Math.max(10, newHeight);
    
    return {
      ...object,
      x: Number(newX.toFixed(1)),
      y: Number(newY.toFixed(1)),
      width: Number(newWidth.toFixed(1)),
      height: Number(newHeight.toFixed(1)),
    };
  }
  
  if (type === "rotate") {
    const cx = startBounds.x + startBounds.width / 2;
    const cy = startBounds.y + startBounds.height / 2;
    const startAngle = Math.atan2(startY - cy, startX - cx);
    const currentAngle = Math.atan2(currentY - cy, currentX - cx);
    let rotation = startRotation + (currentAngle - startAngle);
    
    // Snap to 15° increments when shift is held (handled by caller)
    // rotation = Math.round(rotation / (Math.PI / 12)) * (Math.PI / 12);
    
    return {
      ...object,
      rotation: Number(rotation.toFixed(4)),
    };
  }
  
  return object;
}

/** Render a shape to canvas context */
export function renderShape(ctx, object, scale = 1) {
  const { shapeType, fill, stroke, strokeWidth, strokeDash, opacity } = object;
  const x = object.x;
  const y = object.y;
  const w = object.width;
  const h = object.height;
  const rotation = object.rotation || 0;
  
  ctx.save();
  ctx.globalAlpha = opacity || 1;
  
  // Apply rotation
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.translate(-cx, -cy);
  
  ctx.lineWidth = (strokeWidth || 2) / scale;
  
  if (strokeDash === "dash") {
    ctx.setLineDash([6 / scale, 4 / scale]);
  } else if (strokeDash === "dot") {
    ctx.setLineDash([2 / scale, 4 / scale]);
  } else {
    ctx.setLineDash([]);
  }
  
  ctx.beginPath();
  
  switch (shapeType) {
    case "rect":
      ctx.rect(x, y, w, h);
      break;
    case "rounded-rect":
      const r = Math.min(16, w / 2, h / 2);
      ctx.roundRect(x, y, w, h, r);
      break;
    case "ellipse":
      ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;
    case "line":
      ctx.moveTo(x, cy);
      ctx.lineTo(x + w, cy);
      break;
    case "arrow":
      ctx.moveTo(x, cy);
      ctx.lineTo(x + w, cy);
      // Arrowhead
      const headLen = Math.min(16, w / 4);
      ctx.moveTo(x + w, cy);
      ctx.lineTo(x + w - headLen, cy - headLen / 2);
      ctx.moveTo(x + w, cy);
      ctx.lineTo(x + w - headLen, cy + headLen / 2);
      break;
    case "triangle":
      ctx.moveTo(cx, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      break;
    case "star":
      const spikes = 5;
      const outerRadius = Math.min(w, h) / 2;
      const innerRadius = outerRadius / 2;
      for (let i = 0; i < spikes * 2; i++) {
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const px = cx + Math.cos(angle) * radius;
        const py = cy + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
  }
  
  if (fill && fill !== "none" && fill !== "transparent") {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  
  if (stroke && stroke !== "none" && stroke !== "transparent") {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
  
  ctx.restore();
}

/** Render a sticker to canvas context */
export function renderSticker(ctx, object, scale = 1) {
  const sticker = STICKERS.find(s => s.id === object.stickerId) || STICKERS[0];
  const { color, opacity } = object;
  const x = object.x;
  const y = object.y;
  const w = object.width;
  const h = object.height;
  const rotation = object.rotation || 0;
  
  ctx.save();
  ctx.globalAlpha = opacity || 1;
  
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.translate(-cx, -cy);
  
  // Scale sticker to fit object bounds
  const stickerSize = Math.min(w, h);
  const stickerScale = stickerSize / 24; // SVGs are 24x24 viewBox
  
  ctx.translate(cx, cy);
  ctx.scale(stickerScale, stickerScale);
  ctx.translate(-cx, -cy);
  
  ctx.fillStyle = color || "#e9e2d0";
  ctx.lineWidth = 1.5 / stickerScale;
  
  for (const path of sticker.paths) {
    const p = new Path2D(path);
    ctx.fill(p);
    ctx.stroke(p);
  }
  
  ctx.restore();
}

/** Render a text box to canvas context */
export function renderTextBox(ctx, object, scale = 1, isEditing = false) {
  const { text, fontSize, fontFamily, color, align, background, padding, opacity } = object;
  const x = object.x;
  const y = object.y;
  const w = object.width;
  const h = object.height;
  const rotation = object.rotation || 0;
  
  ctx.save();
  ctx.globalAlpha = opacity || 1;
  
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.translate(-cx, -cy);
  
  // Background
  if (background && background !== "transparent") {
    ctx.fillStyle = background;
    ctx.fillRect(x, y, w, h);
  }
  
  // Border when editing
  if (isEditing) {
    ctx.strokeStyle = "#e5b567"; // primary color
    ctx.lineWidth = 1.5 / scale;
    ctx.setLineDash([4 / scale, 3 / scale]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
  }
  
  // Text
  ctx.fillStyle = color || "#e9e2d0";
  ctx.font = `${fontSize || 16}px ${fontFamily || "inherit"}`;
  ctx.textBaseline = "top";
  ctx.textAlign = align || "left";
  
  const lines = text ? text.split("\n") : [""];
  const lineHeight = (fontSize || 16) * 1.4;
  const startX = x + (padding || 8);
  const startY = y + (padding || 8);
  const maxWidth = w - (padding || 8) * 2;
  
  lines.forEach((line, i) => {
    ctx.fillText(line, startX, startY + i * lineHeight, maxWidth);
  });
  
  // Cursor when editing (simple blinking handled by caller)
  if (isEditing) {
    // Caller will render cursor
  }
  
  ctx.restore();
}

/** Render a sticky note to canvas context */
export function renderSticky(ctx, object, scale = 1, isEditing = false) {
  const { text, fontSize, fontFamily, color, background, opacity } = object;
  const x = object.x;
  const y = object.y;
  const w = object.width;
  const h = object.height;
  const rotation = object.rotation || 0;
  
  ctx.save();
  ctx.globalAlpha = opacity || 1;
  
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.translate(-cx, -cy);
  
  // Sticky note background with slight shadow
  ctx.fillStyle = background || "#fef08a";
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();
  
  // Top stripe (classic sticky note look)
  const stripeHeight = 24;
  const gradient = ctx.createLinearGradient(x, y, x, y + stripeHeight);
  gradient.addColorStop(0, "rgba(0,0,0,0.05)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(x, y, w, stripeHeight, 4);
  ctx.fill();
  
  // Border when editing
  if (isEditing) {
    ctx.strokeStyle = "#e5b567";
    ctx.lineWidth = 1.5 / scale;
    ctx.setLineDash([4 / scale, 3 / scale]);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  
  // Text
  ctx.fillStyle = color || "#111827";
  ctx.font = `${fontSize || 14}px ${fontFamily || "inherit"}`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  
  const lines = text ? text.split("\n") : [""];
  const lineHeight = (fontSize || 14) * 1.5;
  const padding = 12;
  const startX = x + padding;
  const startY = y + stripeHeight + 4;
  const maxWidth = w - padding * 2;
  
  lines.forEach((line, i) => {
    ctx.fillText(line, startX, startY + i * lineHeight, maxWidth);
  });
  
  ctx.restore();
}