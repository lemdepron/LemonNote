import { useRef, useState, useCallback } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Draggable vertical divider for horizontal split pane.
 * Allows resizing the left/right pane ratio.
 */
export default function SplitDivider({ ratio, onRatioChange, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startRatio = useRef(0);
  const containerRef = useRef(null);

  const handleMouseDown = useCallback((event) => {
    if (disabled) return;
    event.preventDefault();
    setIsDragging(true);
    startX.current = event.clientX;
    startRatio.current = ratio;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [ratio, disabled]);

  const handleMouseMove = useCallback((event) => {
    if (!isDragging) return;
    event.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const deltaX = event.clientX - startX.current;
    const containerWidth = rect.width;
    const deltaRatio = deltaX / containerWidth;
    const newRatio = Math.max(0.2, Math.min(0.8, startRatio.current + deltaRatio));
    onRatioChange(newRatio);
  }, [isDragging, onRatioChange]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [isDragging]);

  const handleDoubleClick = useCallback(() => {
    if (disabled) return;
    onRatioChange(0.5);
  }, [disabled, onRatioChange]);

  const handleKeyDown = useCallback((event) => {
    if (disabled) return;
    const step = 0.05;
    let newRatio = ratio;
    if (event.key === "ArrowLeft") {
      newRatio = Math.max(0.2, ratio - step);
    } else if (event.key === "ArrowRight") {
      newRatio = Math.min(0.8, ratio + step);
    } else {
      return;
    }
    event.preventDefault();
    onRatioChange(newRatio);
  }, [ratio, disabled, onRatioChange]);

  // Global mouse listeners for drag
  useState(() => {
    const moveHandler = (event) => handleMouseMove(event);
    const upHandler = () => handleMouseUp();
    document.addEventListener("mousemove", moveHandler);
    document.addEventListener("mouseup", upHandler);
    return () => {
      document.removeEventListener("mousemove", moveHandler);
      document.removeEventListener("mouseup", upHandler);
    };
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center justify-center",
        "w-px bg-border/50 hover:bg-primary/40 hover:w-1 transition-all duration-150",
        "select-none",
        disabled && "opacity-50 cursor-not-allowed",
        isDragging && "bg-primary w-1"
      )}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panes"
      aria-valuemin={20}
      aria-valuemax={80}
      aria-valuenow={Math.round(ratio * 100)}
      style={{ height: "100%", minHeight: "100%" }}
    >
      <div className={cn(
        "flex items-center justify-center w-6 h-6 rounded transition-opacity",
        "opacity-0 hover:opacity-100 group-hover:opacity-100",
        isDragging && "opacity-100"
      )}>
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}