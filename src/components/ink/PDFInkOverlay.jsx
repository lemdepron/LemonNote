import { useEffect, useRef, useState } from "react";
import InkBoard from "@/components/ink/InkBoard";
import { cn } from "@/lib/utils";

/**
 * Transparent ink overlay that sits on top of a PDF page in PDFView.
 * The canvas is viewport-sized. Camera follows PDF scroll/zoom.
 * Strokes use page coordinates (points from bottom-left of page).
 */
export default function PDFInkOverlay({
  pdfDoc,
  currentPage,
  scale,
  containerRef,
  onStrokesChange,
  initialStrokes = [],
  readOnly = false,
}) {
  const engineRef = useRef(null);
  const overlayRef = useRef(null);
  const [inkPageId, setInkPageId] = useState(null);

  // Sync engine reference
  useEffect(() => {
    if (overlayRef.current?.board?.onEngine) {
      overlayRef.current.board.onEngine((engine) => {
        engineRef.current = engine;
        // Load initial strokes if provided
        if (initialStrokes.length > 0 && engine.loadStrokes) {
          engine.loadStrokes(initialStrokes);
        }
      });
    }
  }, [initialStrokes]);

  // Update camera on scroll/zoom/page change
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !containerRef.current) return;

    const container = containerRef.current;
    const pageWrapper = container.querySelector(`.pdf-page-wrapper:nth-child(${currentPage})`);
    if (!pageWrapper) return;

    const canvas = pageWrapper.querySelector("canvas");
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Camera: x=0 (fixed left), y follows scroll, scale matches PDF zoom
    // PDF coordinates: origin at bottom-left, Y up
    // Canvas coordinates: origin at top-left, Y down
    engine.setCamera({
      x: 0,
      y: -(container.scrollTop - rect.top + containerRect.top),
      scale: scale,
    });
  }, [currentPage, scale, containerRef]);

  // Resize engine when container dimensions change
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !containerRef.current) return;

    const container = containerRef.current;
    const pageWrapper = container.querySelector(`.pdf-page-wrapper:nth-child(${currentPage})`);
    if (!pageWrapper) return;

    const canvas = pageWrapper.querySelector("canvas");
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    engine.resize(rect.width, rect.height, Math.min(window.devicePixelRatio || 1, 2));
  }, [currentPage, scale, containerRef]);

  // Notify parent of stroke changes
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !onStrokesChange) return;

    const handleChange = (strokes) => {
      onStrokesChange(strokes);
    };

    engine.onStrokesChange?.(handleChange);
    return () => engine.onStrokesChange?.(null);
  }, [onStrokesChange]);

  // Get current page dimensions
  const pageWidth = pdfDoc?.getPage(currentPage)?.getViewport({ scale: 1 }).width || 612;
  const pageHeight = pdfDoc?.getPage(currentPage)?.getViewport({ scale: 1 }).height || 792;

  if (!pdfDoc || readOnly) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className={cn(
        "absolute top-0 left-0 pointer-events-none z-10",
        "overflow-hidden"
      )}
      style={{
        width: pageWidth * scale,
        height: pageHeight * scale,
        transformOrigin: "top left",
      }}
    >
      <InkBoard
        transparent
        autoFit={false}
        className="absolute inset-0"
        width={pageWidth * scale}
        height={pageHeight * scale}
        readOnly={readOnly}
      />
    </div>
  );
}