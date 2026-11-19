/**
 * PDF and PNG export utilities for Canvas
 * Uses jspdf (already installed) and html2canvas
 */

import { jsPDF } from "jspdf";
import { FRAME_TYPES, OBJECT_TYPES, renderTextFrame, renderShape, renderSticker, renderSticky, renderConnector, hitTestObject } from "@/lib/canvas/objects";
import { parseMarkdown } from "@/lib/canvas/ink/objects";
import { getFile, createFileObjectUrl } from "@/api/localDb";

/**
 * Get frame dimensions in mm from frame type
 * @param {Object} frame - The frame object
 * @returns {Object} { width: number, height: number } in mm
 */
export function getFrameDimensionsMm(frame) {
  const frameType = FRAME_TYPES.find(ft => ft.id === frame.frameType) || FRAME_TYPES[0];
  // Convert pixels at 96 DPI to mm (1 inch = 25.4mm, 96px = 1 inch)
  const pxToMm = 25.4 / 96;
  return {
    width: Math.round(frameType.width * pxToMm),
    height: Math.round(frameType.height * pxToMm),
  };
}

/**
 * Get frame dimensions in pixels from frame type
 * @param {Object} frame - The frame object
 * @returns {Object} { width: number, height: number } in pixels
 */
export function getFrameDimensionsPx(frame) {
  const frameType = FRAME_TYPES.find(ft => ft.id === frame.frameType) || FRAME_TYPES[0];
  return {
    width: frameType.width,
    height: frameType.height,
  };
}

/**
 * Render a single object to a canvas context for PDF/PNG export
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} object - The object to render
 * @param {number} scale - Scale factor
 */
export function renderObjectForExport(ctx, object, scale = 1, allObjects = []) {
  const { x, y, width, height, rotation = 0, opacity = 1 } = object;
  
  ctx.save();
  ctx.globalAlpha = opacity;
  
  // Apply rotation
  const cx = x + width / 2;
  const cy = y + height / 2;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.translate(-cx, -cy);
  
  switch (object.type) {
    case OBJECT_TYPES.SHAPE:
      renderShape(ctx, object, scale);
      break;
    case OBJECT_TYPES.STICKER:
      renderSticker(ctx, object, scale);
      break;
    case OBJECT_TYPES.TEXTBOX:
      // Use text box rendering
      renderTextBoxForExport(ctx, object, scale);
      break;
    case OBJECT_TYPES.STICKY:
      renderSticky(ctx, object, scale);
      break;
    case OBJECT_TYPES.TEXT_FRAME:
      renderTextFrame(ctx, object, scale);
      break;
    case OBJECT_TYPES.FRAME:
      // Don't render frame itself - it's the page boundary
      break;
    case OBJECT_TYPES.IMAGE:
      renderImageForExport(ctx, object, scale);
      break;
    case OBJECT_TYPES.CONNECTOR:
      renderConnectorForExport(ctx, object, scale, allObjects);
      break;
    case OBJECT_TYPES.PDF_PAGE:
      // PDF pages are rendered as images
      break;
  }
  
  ctx.restore();
}

/**
 * Render text box for export (simplified version)
 */
function renderTextBoxForExport(ctx, object, scale) {
  const { text, fontSize, fontFamily, color, align, background, padding, opacity } = object;
  const x = object.x;
  const y = object.y;
  const w = object.width;
  const h = object.height;
  
  // Background
  if (background && background !== "transparent") {
    ctx.fillStyle = background;
    ctx.globalAlpha = opacity || 1;
    ctx.fillRect(x, y, w, h);
  }
  
  // Text
  ctx.fillStyle = color || "#000000";
  ctx.globalAlpha = opacity || 1;
  ctx.font = `${fontSize || 16}px ${fontFamily || "sans-serif"}`;
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
}

/**
 * Render image for export - loads from local: ref if needed
 */
async function renderImageForExport(ctx, object, scale) {
  const { src, x, y, width, height } = object;
  if (!src) return;
  
  // If it's a local: ref, load the blob and create object URL
  let imageUrl = src;
  if (src.startsWith("local:")) {
    try {
      const fileId = src.replace(/^local:/, "");
      const fileRow = await getFile(fileId);
      if (fileRow && fileRow.blob) {
        imageUrl = URL.createObjectURL(fileRow.blob);
      }
    } catch (err) {
      console.warn("Failed to load image for export:", err);
    }
  }
  
  // Load image
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Draw image with fit mode (default to cover)
      const { fit = "cover" } = object;
      
      let drawX = x;
      let drawY = y;
      let drawW = width;
      let drawH = height;
      
      if (fit === "contain") {
        // Fit entire image within bounds
        const imgAspect = img.width / img.height;
        const boxAspect = width / height;
        if (imgAspect > boxAspect) {
          drawH = width / imgAspect;
          drawY = y + (height - drawH) / 2;
        } else {
          drawW = height * imgAspect;
          drawX = x + (width - drawW) / 2;
        }
      } else if (fit === "cover") {
        // Cover entire bounds (default)
        const imgAspect = img.width / img.height;
        const boxAspect = width / height;
        if (imgAspect < boxAspect) {
          drawH = width / imgAspect;
          drawY = y + (height - drawH) / 2;
        } else {
          drawW = height * imgAspect;
          drawX = x + (width - drawW) / 2;
        }
      }
      // fit === "fill" or "none" uses the full width/height
      
      // Clip to object bounds
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.clip();
      
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
      
      // Revoke object URL if we created one
      if (imageUrl !== src && imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl);
      }
      
      resolve();
    };
    img.onerror = () => {
      // Fallback placeholder
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = "#9ca3af";
      ctx.strokeRect(x, y, width, height);
      
      ctx.fillStyle = "#6b7280";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const displaySrc = src.length > 30 ? "..." + src.slice(-27) : src;
      ctx.fillText(displaySrc, x + width / 2, y + height / 2);
      
      if (imageUrl !== src && imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl);
      }
      resolve();
    };
    img.src = imageUrl;
  });
}

/**
 * Render connector for export
 */
function renderConnectorForExport(ctx, object, scale, allObjects) {
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
  ctx.lineWidth = strokeWidth;
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
    if (startArrow) drawArrowHead(ctx, fromX, fromY, cpX, cpY, strokeWidth, 1, true);
    if (endArrow) drawArrowHead(ctx, toX, toY, cpX, cpY, strokeWidth, 1, false);
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
    drawArrowHead(ctx, pathPoints[0].x, pathPoints[0].y, pathPoints[1].x, pathPoints[1].y, strokeWidth, 1, true);
  }
  if (endArrow && pathPoints.length >= 2) {
    const last = pathPoints.length - 1;
    drawArrowHead(ctx, pathPoints[last].x, pathPoints[last].y, pathPoints[last - 1].x, pathPoints[last - 1].y, strokeWidth, 1, false);
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

/**
 * Export canvas to PDF
 * @param {Object} canvasDoc - The canvas document
 * @param {Object} options - Export options
 * @param {boolean} options.wholeCanvas - If true, export all frames as separate pages
 * @param {string} options.selectedFrameId - If set, export only this frame
 * @param {string} options.filename - Output filename
 */
export async function exportCanvasToPdf(canvasDoc, options = {}) {
  const { wholeCanvas = false, selectedFrameId = null, filename = "canvas-export.pdf" } = options;
  
  const frames = canvasDoc.objects?.filter(o => o.type === OBJECT_TYPES.FRAME) || [];
  // Include connectors in objects for rendering
  const objects = canvasDoc.objects?.filter(o => o.type !== OBJECT_TYPES.FRAME) || [];
  const strokes = canvasDoc.strokes || [];
  
  if (frames.length === 0 && !wholeCanvas) {
    throw new Error("No frames found to export");
  }
  
  const pdf = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
  });
  
  let pageCount = 0;
  
  if (wholeCanvas) {
    // Export all frames as separate pages
    for (const frame of frames) {
      if (pageCount > 0) {
        pdf.addPage();
      }
      await renderFrameToPdf(pdf, frame, objects, strokes, canvasDoc.paper);
      pageCount++;
    }
    
    // If no frames, create one page with all content
    if (frames.length === 0) {
      await renderInfiniteCanvasToPdf(pdf, objects, strokes, canvasDoc.paper);
      pageCount = 1;
    }
  } else if (selectedFrameId) {
    // Export single selected frame
    const frame = frames.find(f => f.id === selectedFrameId);
    if (!frame) {
      throw new Error("Selected frame not found");
    }
    await renderFrameToPdf(pdf, frame, objects, strokes, canvasDoc.paper);
    pageCount = 1;
  } else {
    // Default: export first frame
    const frame = frames[0];
    if (frame) {
      await renderFrameToPdf(pdf, frame, objects, strokes, canvasDoc.paper);
      pageCount = 1;
    } else {
      await renderInfiniteCanvasToPdf(pdf, objects, strokes, canvasDoc.paper);
      pageCount = 1;
    }
  }
  
  pdf.save(filename);
  return { pageCount };
}

/**
 * Render a single frame to PDF
 */
async function renderFrameToPdf(pdf, frame, objects, strokes, paper) {
  const dims = getFrameDimensionsMm(frame);
  const dimsPx = getFrameDimensionsPx(frame);
  
  // Set page size to match frame
  pdf.setPageSize({ width: dims.width, height: dims.height });
  
  // Create offscreen canvas for rendering
  const canvas = document.createElement("canvas");
  const scale = 2; // High DPI for quality
  canvas.width = dimsPx.width * scale;
  canvas.height = dimsPx.height * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  
  // Draw paper background
  drawPaperBackground(ctx, dimsPx.width, dimsPx.height, paper);
  
  // Draw frame background (white/cream)
  ctx.fillStyle = paper?.tone === "light" ? "#ffffff" : "#fafafa";
  ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
  
  // Draw frame border
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
  
  // Get objects inside this frame
  const frameObjects = objects.filter(obj => 
    obj.x >= frame.x && 
    obj.y >= frame.y && 
    obj.x + obj.width <= frame.x + frame.width && 
    obj.y + obj.height <= frame.y + frame.height
  );
  
  // Sort by zOrder
  frameObjects.sort((a, b) => (a.zOrder || 0) - (b.zOrder || 0));
  
  // Render objects
  for (const obj of frameObjects) {
    await renderObjectForExport(ctx, obj, 1, frameObjects);
  }
  
  // Render strokes that fall within frame
  renderStrokesInFrame(ctx, strokes, frame);
  
  // Add canvas as image to PDF
  const imgData = canvas.toDataURL("image/png");
  pdf.addImage(imgData, "PNG", 0, 0, dims.width, dims.height);
}

/**
 * Render infinite canvas (no frames) to PDF
 */
async function renderInfiniteCanvasToPdf(pdf, objects, strokes, paper) {
  // Calculate bounds of all content
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  objects.forEach(obj => {
    minX = Math.min(minX, obj.x);
    minY = Math.min(minY, obj.y);
    maxX = Math.max(maxX, obj.x + obj.width);
    maxY = Math.max(maxY, obj.y + obj.height);
  });
  
  strokes.forEach(stroke => {
    if (stroke.points && stroke.points.length > 0) {
      stroke.points.forEach(p => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });
    }
  });
  
  // Add some padding
  const padding = 20;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  // Limit to reasonable size (A4 at 96 DPI = 794x1123)
  const maxWidth = 794;
  const maxHeight = 1123;
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  
  const canvas = document.createElement("canvas");
  const renderScale = 2;
  canvas.width = Math.ceil(width * scale * renderScale);
  canvas.height = Math.ceil(height * scale * renderScale);
  const ctx = canvas.getContext("2d");
  ctx.scale(renderScale, renderScale);
  ctx.translate(-minX * scale, -minY * scale);
  ctx.scale(scale, scale);
  
  // Draw paper background
  drawPaperBackground(ctx, width, height, paper);
  
  // Sort and render objects
  objects.sort((a, b) => (a.zOrder || 0) - (b.zOrder || 0));
  for (const obj of objects) {
    await renderObjectForExport(ctx, obj, 1, objects);
  }
  
  // Render strokes
  renderStrokes(ctx, strokes);
  
  // Add to PDF
  const dimsMm = { width: width * scale * 25.4 / 96, height: height * scale * 25.4 / 96 };
  pdf.setPageSize({ width: dimsMm.width, height: dimsMm.height });
  const imgData = canvas.toDataURL("image/png");
  pdf.addImage(imgData, "PNG", 0, 0, dimsMm.width, dimsMm.height);
}

/**
 * Draw paper background pattern
 */
function drawPaperBackground(ctx, width, height, paper) {
  const template = paper?.template || "grid";
  const tone = paper?.tone || "dark";
  
  if (tone === "light") {
    ctx.fillStyle = "#ffffff";
  } else {
    ctx.fillStyle = "#fafafa";
  }
  ctx.fillRect(0, 0, width, height);
  
  if (template === "grid") {
    ctx.strokeStyle = tone === "light" ? "#e5e7eb" : "#374151";
    ctx.lineWidth = 0.5;
    const spacing = 24;
    for (let x = 0; x <= width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } else if (template === "ruled") {
    ctx.strokeStyle = tone === "light" ? "#e5e7eb" : "#374151";
    ctx.lineWidth = 0.5;
    const spacing = 32;
    for (let y = 0; y <= height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } else if (template === "dots") {
    ctx.fillStyle = tone === "light" ? "#9ca3af" : "#4b5563";
    const spacing = 24;
    for (let x = spacing; x <= width; x += spacing) {
      for (let y = spacing; y <= height; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/**
 * Render strokes on canvas
 */
function renderStrokes(ctx, strokes) {
  strokes.forEach(stroke => {
    if (!stroke.points || stroke.points.length < 2) return;
    
    ctx.beginPath();
    ctx.strokeStyle = stroke.color || "#000000";
    ctx.lineWidth = (stroke.width || 2) / 2; // Adjust for scale
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = stroke.alpha || 1;
    
    const points = stroke.points;
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      ctx.lineTo(p.x, p.y);
    }
    
    ctx.stroke();
  });
}

/**
 * Render strokes that fall within a frame
 */
function renderStrokesInFrame(ctx, strokes, frame) {
  strokes.forEach(stroke => {
    if (!stroke.points || stroke.points.length < 2) return;
    
    // Check if any point is in frame
    const inFrame = stroke.points.some(p => 
      p.x >= frame.x && p.x <= frame.x + frame.width &&
      p.y >= frame.y && p.y <= frame.y + frame.height
    );
    
    if (!inFrame) return;
    
    ctx.beginPath();
    ctx.strokeStyle = stroke.color || "#000000";
    ctx.lineWidth = stroke.width || 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = stroke.alpha || 1;
    
    const points = stroke.points;
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      ctx.lineTo(p.x, p.y);
    }
    
    ctx.stroke();
  });
}

/**
 * Export canvas to PNG
 * @param {Object} canvasDoc - The canvas document
 * @param {Object} options - Export options
 * @param {boolean} options.wholeCanvas - If true, export all frames as separate PNG files (zipped)
 * @param {string} options.selectedFrameId - If set, export only this frame
 * @param {string} options.filename - Output filename
 */
export async function exportCanvasToPng(canvasDoc, options = {}) {
  const { wholeCanvas = false, selectedFrameId = null, filename = "canvas-export.png" } = options;
  
  const frames = canvasDoc.objects?.filter(o => o.type === OBJECT_TYPES.FRAME) || [];
  const objects = canvasDoc.objects?.filter(o => o.type !== OBJECT_TYPES.FRAME && o.type !== OBJECT_TYPES.CONNECTOR) || [];
  const strokes = canvasDoc.strokes || [];
  
  if (frames.length === 0 && !wholeCanvas) {
    // Export infinite canvas as single PNG
    return exportInfiniteCanvasToPng(canvasDoc, objects, strokes, filename);
  }
  
  if (wholeCanvas) {
    // Export all frames as separate PNG files (return array of blobs)
    const results = [];
    for (const frame of frames) {
      const blob = await renderFrameToPngBlob(frame, objects, strokes, canvasDoc.paper);
      results.push({ frameId: frame.id, frameName: frame.name || `Frame ${frame.id}`, blob });
    }
    return results;
  } else if (selectedFrameId) {
    const frame = frames.find(f => f.id === selectedFrameId);
    if (!frame) {
      throw new Error("Selected frame not found");
    }
    const blob = await renderFrameToPngBlob(frame, objects, strokes, canvasDoc.paper);
    downloadBlob(blob, filename);
    return [{ frameId: frame.id, blob }];
  } else {
    // Default: export first frame
    const frame = frames[0];
    if (frame) {
      const blob = await renderFrameToPngBlob(frame, objects, strokes, canvasDoc.paper);
      downloadBlob(blob, filename);
      return [{ frameId: frame.id, blob }];
    } else {
      return exportInfiniteCanvasToPng(canvasDoc, objects, strokes, filename);
    }
  }
}

/**
 * Render a frame to PNG blob
 */
async function renderFrameToPngBlob(frame, objects, strokes, paper) {
  const dimsPx = getFrameDimensionsPx(frame);
  
  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = dimsPx.width * scale;
  canvas.height = dimsPx.height * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  
  // Draw paper background
  drawPaperBackground(ctx, dimsPx.width, dimsPx.height, paper);
  
  // Draw frame background
  ctx.fillStyle = paper?.tone === "light" ? "#ffffff" : "#fafafa";
  ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
  
  // Draw frame border
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
  
  // Get objects inside this frame
  const frameObjects = objects.filter(obj => 
    obj.x >= frame.x && 
    obj.y >= frame.y && 
    obj.x + obj.width <= frame.x + frame.width && 
    obj.y + obj.height <= frame.y + frame.height
  );
  
  // Sort by zOrder
  frameObjects.sort((a, b) => (a.zOrder || 0) - (b.zOrder || 0));
  
  // Render objects
  for (const obj of frameObjects) {
    await renderObjectForExport(ctx, obj, 1, frameObjects);
  }
  
  // Render strokes in frame
  renderStrokesInFrame(ctx, strokes, frame);
  
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), "image/png");
  });
}

/**
 * Export infinite canvas to PNG
 */
async function exportInfiniteCanvasToPng(canvasDoc, objects, strokes, filename) {
  // Calculate bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  objects.forEach(obj => {
    minX = Math.min(minX, obj.x);
    minY = Math.min(minY, obj.y);
    maxX = Math.max(maxX, obj.x + obj.width);
    maxY = Math.max(maxY, obj.y + obj.height);
  });
  
  strokes.forEach(stroke => {
    if (stroke.points && stroke.points.length > 0) {
      stroke.points.forEach(p => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });
    }
  });
  
  const padding = 20;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.translate(-minX, -minY);
  
  // Draw paper background
  drawPaperBackground(ctx, width, height, canvasDoc.paper);
  
  // Sort and render objects
  objects.sort((a, b) => (a.zOrder || 0) - (b.zOrder || 0));
  for (const obj of objects) {
    await renderObjectForExport(ctx, obj, 1, objects);
  }
  
  // Render strokes
  renderStrokes(ctx, strokes);
  
  const blob = await new Promise(resolve => canvas.toBlob(blob => resolve(blob), "image/png"));
  downloadBlob(blob, filename);
  
  return [{ blob }];
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}