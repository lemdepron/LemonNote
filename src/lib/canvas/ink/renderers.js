/**
 * Additional renderers for canvas-specific object types.
 * These supplement the core renderers in objects.js (shape, sticker, textbox, sticky, text-frame).
 */

import { OBJECT_TYPES, FRAME_TYPES } from "@/lib/canvas/objects";
import { toneOf } from "@/lib/canvas/ink/paper";

/** Render a frame (page) to canvas context */
export function renderFrame(ctx, object, scale = 1) {
  const { frameType, paper = {}, opacity = 1 } = object;
  const x = object.x;
  const y = object.y;
  const w = object.width;
  const h = object.height;
  const rotation = object.rotation || 0;

  ctx.save();
  ctx.globalAlpha = opacity;

  // Apply rotation
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.translate(-cx, -cy);

  // Get frame type definition for defaults
  const frameDef = FRAME_TYPES.find(ft => ft.id === frameType) || FRAME_TYPES[0];
  const frameWidth = object.width || frameDef.width;
  const frameHeight = object.height || frameDef.height;

  // Paper colors from the frame's paper settings using toneOf (handles "auto" tone)
  const template = paper.template || "grid";
  const toneColors = toneOf(paper);
  
  const pageColor = toneColors.page;
  const borderColor = toneColors.border;
  const templateColor = toneColors.line;

  // Draw frame background (page color) with rounded corners
  ctx.fillStyle = pageColor;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, frameWidth, frameHeight, 8);
  } else {
    ctx.rect(x, y, frameWidth, frameHeight);
  }
  ctx.fill();

  // Draw frame border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1 / Math.max(0.15, scale);
  ctx.stroke();

  // Draw paper template inside frame (simplified - just grid/dots/ruled)
  const padding = 24;
  const innerX = x + padding;
  const innerY = y + padding;
  const innerW = frameWidth - padding * 2;
  const innerH = frameHeight - padding * 2;

  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(innerX, innerY, innerW, innerH, 4);
  } else {
    ctx.rect(innerX, innerY, innerW, innerH);
  }
  ctx.clip();

  ctx.strokeStyle = templateColor;
  ctx.lineWidth = 0.5 / Math.max(0.15, scale);

  if (template === "grid") {
    const spacing = 24;
    for (let gx = innerX; gx <= innerX + innerW; gx += spacing) {
      ctx.beginPath();
      ctx.moveTo(gx, innerY);
      ctx.lineTo(gx, innerY + innerH);
      ctx.stroke();
    }
    for (let gy = innerY; gy <= innerY + innerH; gy += spacing) {
      ctx.beginPath();
      ctx.moveTo(innerX, gy);
      ctx.lineTo(innerX + innerW, gy);
      ctx.stroke();
    }
  } else if (template === "dots") {
    const spacing = 24;
    const dotRadius = 1 / Math.max(0.15, scale);
    for (let gx = innerX; gx <= innerX + innerW; gx += spacing) {
      for (let gy = innerY; gy <= innerY + innerH; gy += spacing) {
        ctx.beginPath();
        ctx.arc(gx, gy, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (template === "ruled") {
    const spacing = 32;
    for (let gy = innerY + spacing; gy < innerY + innerH; gy += spacing) {
      ctx.beginPath();
      ctx.moveTo(innerX, gy);
      ctx.lineTo(innerX + innerW, gy);
      ctx.stroke();
    }
  } else if (template === "stave") {
    const spacing = 40;
    for (let gy = innerY + spacing; gy < innerY + innerH; gy += spacing) {
      for (let line = 0; line < 5; line++) {
        ctx.beginPath();
        ctx.moveTo(innerX, gy + line * 8);
        ctx.lineTo(innerX + innerW, gy + line * 8);
        ctx.stroke();
      }
    }
  } else if (template === "iso") {
    const spacing = 24;
    for (let gx = innerX - innerH; gx <= innerX + innerW; gx += spacing) {
      ctx.beginPath();
      ctx.moveTo(gx, innerY);
      ctx.lineTo(gx + innerH, innerY + innerH);
      ctx.stroke();
    }
  }
  // "blank" draws nothing extra

  ctx.restore();

  // Draw frame name above the frame
  if (object.name) {
    ctx.fillStyle = isLight ? "#333333" : "#dddddd";
    ctx.font = `bold ${12 / Math.max(0.15, scale)}px "Inter", ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    const nameY = y - 6 / scale;
    ctx.fillText(object.name, cx, nameY);
  }

  ctx.restore();
}

/** Render a card to canvas context */
export function renderCard(ctx, object, scale = 1) {
  const { title = "New card", body = "", opacity = 1 } = object;
  const x = object.x;
  const y = object.y;
  const w = object.width;
  const h = object.height;
  const rotation = object.rotation || 0;

  ctx.save();
  ctx.globalAlpha = opacity;

  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.translate(-cx, -cy);

  // Card sizes are in world units, so the text scales together with the card when you zoom.
  const edge = 1.5 / Math.max(0.15, scale); // border stays thin on screen
  const radius = 12;
  const titleHeight = 34;
  const pad = 14;
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const palette = isDark
    ? { body: "#2a2722", head: "#3a3426", line: "#6b5a2c", title: "#f3e7b8", text: "#e8e2d2", shadow: "rgba(0,0,0,0.45)" }
    : { body: "#fffdf4", head: "#f7e9ac", line: "#d9b44a", title: "#5a4500", text: "#3a3320", shadow: "rgba(90,69,0,0.22)" };

  // Card background with a soft shadow
  ctx.save();
  ctx.shadowColor = palette.shadow;
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = palette.body;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, radius);
  else ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.restore();

  // Title bar
  ctx.fillStyle = palette.head;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, titleHeight, { upperLeft: radius, upperRight: radius, lowerLeft: 0, lowerRight: 0 });
  else ctx.rect(x, y, w, titleHeight);
  ctx.fill();

  // Outline and divider
  ctx.strokeStyle = palette.line;
  ctx.lineWidth = edge;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, radius);
  else ctx.rect(x, y, w, h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y + titleHeight);
  ctx.lineTo(x + w, y + titleHeight);
  ctx.stroke();

  // Text helper: wrap words to the card width, never squeeze letters
  const wrap = (text, maxWidth) => {
    const out = [];
    String(text).split("\n").forEach((paragraph) => {
      const words = paragraph.split(/\s+/).filter(Boolean);
      if (!words.length) { out.push(""); return; }
      let line = words[0];
      for (let i = 1; i < words.length; i += 1) {
        const test = `${line} ${words[i]}`;
        if (ctx.measureText(test).width <= maxWidth) line = test;
        else { out.push(line); line = words[i]; }
      }
      out.push(line);
    });
    return out;
  };
  const clip = (text, maxWidth) => {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
    return `${t}…`;
  };

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = palette.title;
  ctx.font = `600 15px "Inter", ui-sans-serif, system-ui, sans-serif`;
  ctx.fillText(clip(title || "", w - pad * 2), x + pad, y + titleHeight / 2 + 1);

  ctx.textBaseline = "top";
  ctx.fillStyle = palette.text;
  ctx.font = `13px "Inter", ui-sans-serif, system-ui, sans-serif`;
  const lineHeight = 13 * 1.5;
  const lines = wrap(body || "", w - pad * 2);
  const room = Math.max(1, Math.floor((h - titleHeight - pad * 2 + 4) / lineHeight));
  lines.slice(0, room).forEach((line, i) => {
    const isLast = i === room - 1 && lines.length > room;
    ctx.fillText(isLast ? clip(`${line} …`, w - pad * 2) : line, x + pad, y + titleHeight + pad - 2 + i * lineHeight);
  });

  ctx.restore();
}

/** Render a connector (line with arrow) to canvas context */
export function renderConnector(ctx, object, scale = 1, allObjects = []) {
  const { from, to, style = "straight", stroke = "#e5b567", strokeWidth = 2, startArrow = false, endArrow = true, opacity = 1 } = object;

  if (!from || !to) return;

  const fromObj = allObjects.find(o => o.id === from);
  const toObj = allObjects.find(o => o.id === to);
  if (!fromObj || !toObj) return;

  const fromX = fromObj.x + fromObj.width / 2;
  const fromY = fromObj.y + fromObj.height / 2;
  const toX = toObj.x + toObj.width / 2;
  const toY = toObj.y + toObj.height / 2;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = strokeWidth / Math.max(0.15, scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash([]);

  let pathPoints = [];

  if (style === "straight") {
    pathPoints = [{ x: fromX, y: fromY }, { x: toX, y: toY }];
  } else if (style === "elbow") {
    const midX = (fromX + toX) / 2;
    pathPoints = [
      { x: fromX, y: fromY },
      { x: midX, y: fromY },
      { x: midX, y: toY },
      { x: toX, y: toY }
    ];
  } else if (style === "curved") {
    // Simple quadratic curve
    const cpX = (fromX + toX) / 2;
    const cpY = (fromY + toY) / 2 - 100; // curve upward
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.quadraticCurveTo(cpX, cpY, toX, toY);
    ctx.stroke();
    
    // Draw arrows on curved line
    if (startArrow) drawArrowHead(ctx, fromX, fromY, cpX, cpY, strokeWidth, scale, true);
    if (endArrow) drawArrowHead(ctx, toX, toY, cpX, cpY, strokeWidth, scale, false);
    ctx.restore();
    return;
  }

  // Draw path
  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (let i = 1; i < pathPoints.length; i++) {
    ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
  }
  ctx.stroke();

  // Draw arrowheads
  if (startArrow && pathPoints.length >= 2) {
    drawArrowHead(ctx, pathPoints[0].x, pathPoints[0].y, pathPoints[1].x, pathPoints[1].y, strokeWidth, scale, true);
  }
  if (endArrow && pathPoints.length >= 2) {
    const last = pathPoints.length - 1;
    drawArrowHead(ctx, pathPoints[last].x, pathPoints[last].y, pathPoints[last - 1].x, pathPoints[last - 1].y, strokeWidth, scale, false);
  }

  ctx.restore();
}

function drawArrowHead(ctx, tipX, tipY, backX, backY, strokeWidth, scale, isStart) {
  const angle = Math.atan2(tipY - backY, tipX - backX);
  const headLen = Math.max(8, strokeWidth * 3) / Math.max(0.15, scale);
  
  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(isStart ? angle + Math.PI : angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-headLen, -headLen / 2);
  ctx.lineTo(-headLen, headLen / 2);
  ctx.closePath();
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fill();
  ctx.restore();
}

/** Render an image to canvas context */
export function renderImage(ctx, object, scale = 1) {
  const { src, opacity = 1 } = object;
  const x = object.x;
  const y = object.y;
  const w = object.width;
  const h = object.height;
  const rotation = object.rotation || 0;

  if (!src) {
    // Placeholder for missing image
    ctx.save();
    ctx.globalAlpha = opacity * 0.5;
    ctx.fillStyle = "#888888";
    ctx.strokeStyle = "#aaaaaa";
    ctx.lineWidth = 1 / Math.max(0.15, scale);
    ctx.setLineDash([5 / scale, 5 / scale]);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 4);
    else ctx.rect(x, y, w, h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = `${12 / Math.max(0.15, scale)}px "Inter", ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Image", x + w / 2, y + h / 2);
    ctx.restore();
    return;
  }

  // For local: URLs, we'd need to load the image. For now draw placeholder with src hint
  ctx.save();
  ctx.globalAlpha = opacity;
  
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.translate(-cx, -cy);

  ctx.fillStyle = "#f0f0f0";
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 1 / Math.max(0.15, scale);
  ctx.setLineDash([5 / scale, 5 / scale]);
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 4);
  else ctx.rect(x, y, w, h);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = `${11 / Math.max(0.15, scale)}px "Inter", ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = "#666666";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const displaySrc = src.length > 30 ? "..." + src.slice(-27) : src;
  ctx.fillText(displaySrc, x + w / 2, y + h / 2);

  ctx.restore();
}

/** Render a PDF page to canvas context */
export function renderPdfPage(ctx, object, scale = 1) {
  const { fileId, pageNumber = 1, opacity = 1 } = object;
  const x = object.x;
  const y = object.y;
  const w = object.width;
  const h = object.height;
  const rotation = object.rotation || 0;

  ctx.save();
  ctx.globalAlpha = opacity;

  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.translate(-cx, -cy);

  // PDF page appearance
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 1 / Math.max(0.15, scale);
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 4);
  else ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.stroke();

  // Page shadow
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

  // PDF label
  ctx.fillStyle = "#dc2626";
  ctx.font = `bold ${10 / Math.max(0.15, scale)}px "Inter", ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("PDF", x + 8, y + 8);

  ctx.fillStyle = "#666666";
  ctx.font = `${9 / Math.max(0.15, scale)}px "Inter", ui-sans-serif, system-ui, sans-serif`;
  ctx.fillText(`Page ${pageNumber}`, x + 8, y + 22);

  // File ID hint
  if (fileId) {
    const displayId = fileId.length > 25 ? "..." + fileId.slice(-22) : fileId;
    ctx.fillText(displayId, x + 8, y + 36);
  }

  ctx.restore();
}