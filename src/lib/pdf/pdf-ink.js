/**
 * PDF Ink Annotation Library
 * 
 * Adds handwritten ink strokes to PDF page content streams using pdf-lib.
 * Stores stroke metadata in a hidden marked-content sequence for re-editing.
 * 
 * Approach: Vector paths drawn directly into page content (Method B/D from spike test).
 * This renders reliably in Edge, Adobe Reader, and other PDF viewers.
 */

import { PDFDocument, rgb, PDFStream, PDFName, PDFString } from 'pdf-lib';
import {
  pushGraphicsState,
  popGraphicsState,
  moveTo,
  lineTo,
  stroke,
  setStrokingRgbColor,
  setLineWidth,
  setLineCap,
  setLineJoin,
  beginMarkedContent,
  endMarkedContent,
  LineCapStyle,
  LineJoinStyle
} from 'pdf-lib';

/**
 * Marker key used in content stream comments to identify LemonNote ink strokes
 * Format: % LemonNoteInkStrokes: {json}
 */
export const INK_MARKER_KEY = 'LemonNoteInkStrokes';

/**
 * Add ink strokes to a specific page of a PDF document.
 * 
 * @param {Uint8Array} pdfBytes - Original PDF bytes
 * @param {Array} strokes - Array of stroke objects: { points: [[x,y],...], color: [r,g,b], width: number, tool: string, id: string }
 * @param {number} pageIndex - Zero-based page index to annotate
 * @returns {Promise<Uint8Array>} - Modified PDF bytes with ink added
 */
export async function addInkToPDF(pdfBytes, strokes, pageIndex = 0) {
  if (!strokes || strokes.length === 0) {
    return pdfBytes;
  }

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new Error(`Page index ${pageIndex} out of range (0-${pages.length - 1})`);
  }

  const page = pages[pageIndex];

  // Draw each stroke using pushOperators
  for (const strokeData of strokes) {
    const { points, color, width, tool = 'pen' } = strokeData;
    
    if (!points || points.length < 2) continue;

    // Convert color to 0-1 range if needed
    const [r, g, b] = color.map(c => c > 1 ? c / 255 : c);

    page.pushOperators(
      pushGraphicsState(),
      setStrokingRgbColor(r, g, b),
      setLineWidth(width || 2),
      setLineCap(LineCapStyle.Round),
      setLineJoin(LineJoinStyle.Round),
      moveTo(points[0][0], points[0][1]),
      ...points.slice(1).map(([x, y]) => lineTo(x, y)),
      stroke(),
      popGraphicsState()
    );
  }

  // Add hidden marker with stroke metadata for re-editing
  // We'll inject this as a comment in the content stream after saving
  const markerData = {
    version: 1,
    pageIndex,
    strokes: strokes.map(s => ({
      id: s.id || crypto.randomUUID?.() || `stroke-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      points: s.points,
      color: s.color,
      width: s.width,
      tool: s.tool || 'pen',
      timestamp: s.timestamp || Date.now()
    }))
  };

  // Encode as JSON string
  const markerJson = JSON.stringify(markerData);
  
  // Store the marker in the page dictionary for easy retrieval
  // This avoids content stream decoding issues
  // Use PDFString to store the JSON (not PDFName which URL-encodes it)
  page.node.set(
    PDFName.of('LemonNoteInkStrokes'),
    PDFString.of(markerJson)
  );
  
  return await pdfDoc.save();
}

/**
 * Extract ink strokes from a PDF page's hidden marker.
 * 
 * @param {Uint8Array} pdfBytes - PDF bytes to read
 * @param {number} pageIndex - Zero-based page index
 * @returns {Promise<Array|null>} - Array of stroke objects or null if no marker found
 */
export async function extractInkFromPDF(pdfBytes, pageIndex = 0) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  if (pageIndex < 0 || pageIndex >= pages.length) {
    return null;
  }

  const page = pages[pageIndex];
  const pageNode = page.node;

  // Primary method: read from the page dictionary
  try {
    const markerKey = PDFName.of('LemonNoteInkStrokes');
    // pageNode.dict is a Map with PDFName keys
    const markerObj = pageNode.dict.get(markerKey);
    if (markerObj) {
      // The marker is stored as a PDFString
      let jsonStr;
      if (markerObj.asString) {
        jsonStr = markerObj.asString();
      } else if (markerObj.getContents) {
        // PDFString or PDFHexString
        jsonStr = new TextDecoder('latin1').decode(markerObj.getContents());
      } else {
        jsonStr = String(markerObj);
      }
      
      if (jsonStr) {
        const markerData = JSON.parse(jsonStr);
        return markerData.strokes || [];
      }
    }
  } catch (err) {
    console.warn('Failed to extract ink from page dictionary:', err);
  }

  return null;
}

/**
 * Export PDF with ink annotations.
 * 
 * @param {Uint8Array} pdfBytes - PDF bytes with ink
 * @param {'annotated'|'flattened'} mode - Export mode
 * @param {number} pageIndex - Page index (for flattened, removes marker from this page)
 * @returns {Promise<Uint8Array>} - Exported PDF bytes
 */
export async function exportPDF(pdfBytes, mode = 'annotated', pageIndex = 0) {
  if (mode === 'annotated') {
    // Keep as-is (with marker for re-editing)
    return pdfBytes;
  }

  // Flattened: remove the hidden marker so strokes are permanent
  // For now, we return the original since the marker is invisible in viewers.
  // A full implementation would parse and remove the BDC/EMC marked-content pair.
  // The marker doesn't affect rendering - it's only for our re-editing.
  return pdfBytes;
}

/**
 * Create a new PDF with ink strokes on a blank page (for new ink-only PDFs).
 * 
 * @param {Array} strokes - Array of stroke objects
 * @param {Object} options - Page options: { width, height, margin }
 * @returns {Promise<Uint8Array>} - New PDF bytes
 */
export async function createInkPDF(strokes, options = {}) {
  const { width = 612, height = 792, margin = 36 } = options; // US Letter default
  
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([width, height]);

  // Draw strokes
  for (const strokeData of strokes) {
    const { points, color, width: strokeWidth, tool = 'pen' } = strokeData;
    
    if (!points || points.length < 2) continue;

    const [r, g, b] = color.map(c => c > 1 ? c / 255 : c);

    page.pushOperators(
      pushGraphicsState(),
      setStrokingRgbColor(r, g, b),
      setLineWidth(strokeWidth || 2),
      setLineCap(LineCapStyle.Round),
      setLineJoin(LineJoinStyle.Round),
      moveTo(points[0][0], points[0][1]),
      ...points.slice(1).map(([x, y]) => lineTo(x, y)),
      stroke(),
      popGraphicsState()
    );
  }

  // Add marker
  const markerData = {
    version: 1,
    pageIndex: 0,
    strokes: strokes.map(s => ({
      id: s.id || crypto.randomUUID?.() || `stroke-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      points: s.points,
      color: s.color,
      width: s.width,
      tool: s.tool || 'pen',
      timestamp: s.timestamp || Date.now()
    }))
  };

  const markerJson = JSON.stringify(markerData);
  page.pushOperators(
    beginMarkedContent('Span', pdfDoc.context.register(
      pdfDoc.context.obj({ LemonNoteInkStrokes: markerJson })
    )),
    endMarkedContent()
  );

  return await pdfDoc.save();
}

/**
 * Merge ink strokes from overlay into existing PDF page.
 * This is the main entry point for "Save to PDF" from the annotate UI.
 * 
 * @param {Object} params
 * @param {Uint8Array} params.pdfBytes - Original PDF bytes
 * @param {Array} params.strokes - Ink strokes from overlay
 * @param {number} params.pageIndex - Page being annotated
 * @param {Object} params.viewport - PDF.js viewport: { width, height, scale, rotation }
 * @param {Object} params.canvasRect - Canvas rect in page coordinates: { x, y, width, height }
 * @returns {Promise<Uint8Array>} - Modified PDF bytes
 */
export async function saveInkToPDFPage({ pdfBytes, strokes, pageIndex, viewport, canvasRect }) {
  if (!strokes || strokes.length === 0) {
    return pdfBytes;
  }

  // Transform strokes from canvas coordinates to PDF page coordinates
  // Canvas coordinates: origin at top-left of canvas, Y down
  // PDF coordinates: origin at bottom-left of page, Y up
  
  const transformedStrokes = strokes.map(stroke => {
    const points = stroke.points.map(([x, y]) => {
      // Canvas x is relative to canvas left, convert to page x
      // Canvas y is relative to canvas top, convert to page y (flip)
      const pageX = (canvasRect ? canvasRect.x : 0) + x / (viewport?.scale || 1);
      const pageY = (viewport?.height || 792) - ((canvasRect ? canvasRect.y : 0) + y / (viewport?.scale || 1));
      return [pageX, pageY];
    });

    return {
      ...stroke,
      points
    };
  });

  return await addInkToPDF(pdfBytes, transformedStrokes, pageIndex);
}

/**
 * Check if a PDF page has LemonNote ink annotations (hidden marker).
 * 
 * @param {Uint8Array} pdfBytes - PDF bytes to check
 * @param {number} pageIndex - Page index
 * @returns {Promise<boolean>} - True if ink marker found
 */
export async function hasInkAnnotations(pdfBytes, pageIndex = 0) {
  const strokes = await extractInkFromPDF(pdfBytes, pageIndex);
  return strokes !== null && strokes.length > 0;
}

export default {
  addInkToPDF,
  extractInkFromPDF,
  exportPDF,
  createInkPDF,
  saveInkToPDFPage,
  hasInkAnnotations,
  INK_MARKER_KEY
};