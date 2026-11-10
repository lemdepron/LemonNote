import { useEffect, useRef } from "react";
import InkBoard from "@/components/ink/InkBoard";
import { cn } from "@/lib/utils";

/**
 * Transparent ink overlay that sits on top of the rendered note content in Read mode.
 * The canvas is viewport-sized. The parent (NotePage) drives the camera so strokes
 * scroll with the text. Strokes use page coordinates: x in pixels from the left of
 * the fixed content column, y in pixels from the top of the content.
 */
export default function NoteInkOverlay({
  noteInk,
  contentRef,
  scrollTop,
  contentWidth,
  contentHeight,
  scale = 1,
}) {
  const engineRef = useRef(null);
  const overlayRef = useRef(null);

  // Sync engine reference
  useEffect(() => {
    if (noteInk.board?.onEngine) {
      noteInk.board.onEngine((engine) => {
        engineRef.current = engine;
      });
    }
  }, [noteInk.board]);

  // Update camera on scroll/resize/scale
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    // Camera: x=0 (fixed left), y=-scrollTop (follows scroll), scale=current zoom
    engine.setCamera({ x: 0, y: -scrollTop, scale });
  }, [scrollTop, scale]);

  // Resize engine when content dimensions change
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !contentWidth || !contentHeight) return;
    engine.resize(contentWidth, contentHeight, Math.min(window.devicePixelRatio || 1, 2));
  }, [contentWidth, contentHeight]);

  // Sync objects to engine
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setObjects?.(noteInk.board?.objects || []);
  }, [noteInk.board?.objects]);

  if (!noteInk.hasPage || (noteInk.markCount === 0 && (noteInk.board?.objects?.length || 0) === 0)) {
    return null;
  }

  // Only show overlay when contentRef is available
  if (!contentRef) return null;

  const ink = noteInk.ink;
  const board = noteInk.board;

  return (
    <div
      ref={overlayRef}
      className={cn(
        "absolute top-0 left-0 pointer-events-none z-10",
        "overflow-hidden"
      )}
      style={{
        width: contentWidth,
        height: contentHeight,
      }}
    >
      <InkBoard
        {...board}
        transparent
        autoFit={false}
        className="absolute inset-0"
        height={contentHeight}
        // Object callbacks from ink
        onSelectObject={ink?.onSelectObject ?? (() => {})}
        onUpdateObject={ink?.updateObject}
        onDeleteObject={ink?.deleteObject}
        onBringToFront={ink?.bringToFront}
        onSendToBack={ink?.sendToBack}
        editingObjectId={ink?.editingObjectId}
        setEditingObjectId={ink?.setEditingObjectId}
        selectedObjectIds={ink?.selectedObjectIds || []}
      />
    </div>
  );
}