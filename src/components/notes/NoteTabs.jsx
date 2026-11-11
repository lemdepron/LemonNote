import { useRef, useState, useEffect } from "react";
import { Plus, X, ChevronLeft, ChevronRight, Columns } from "lucide-react";
import { db } from "@/api/localDb";
import { cn } from "@/lib/utils";

/**
 * Tab strip component for note tabs.
 * Supports: click to activate, close button, middle-click to close, drag to reorder,
 * Ctrl+W to close, Ctrl+Tab to switch, Ctrl+Shift+Tab to switch backward.
 * Shows real note titles fetched from localDb.
 */
export default function NoteTabs({
  tabs,
  activeTabIndex,
  onActivateTab,
  onCloseTab,
  onReorderTabs,
  onNewTab,
  onSplit,
  splitEnabled,
}) {
  const tabRefs = useRef([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [tabTitles, setTabTitles] = useState({});

  // Fetch note titles for tabs
  useEffect(() => {
    const fetchTitles = async () => {
      const titles = {};
      for (const tab of tabs) {
        if (tab.noteId === "new") {
          titles[tab.noteId] = "New note";
        } else {
          try {
            const note = await db.entities.Note.get(tab.noteId);
            titles[tab.noteId] = note?.title?.trim() || "Untitled";
          } catch {
            titles[tab.noteId] = "Untitled";
          }
        }
      }
      setTabTitles(titles);
    };
    fetchTitles();
  }, [tabs]);

  const getTabTitle = (tab) => {
    return tabTitles[tab.noteId] || (tab.noteId === "new" ? "New note" : "Untitled");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+W or Ctrl+F4: close active tab
      if ((event.ctrlKey || event.metaKey) && (event.key === "w" || event.key === "F4")) {
        event.preventDefault();
        if (tabs.length > 0) {
          onCloseTab(activeTabIndex);
        }
        return;
      }
      // Ctrl+Tab: next tab
      if ((event.ctrlKey || event.metaKey) && event.key === "Tab" && !event.shiftKey) {
        event.preventDefault();
        if (tabs.length > 1) {
          const next = (activeTabIndex + 1) % tabs.length;
          onActivateTab(next);
        }
        return;
      }
      // Ctrl+Shift+Tab: previous tab
      if ((event.ctrlKey || event.metaKey) && event.key === "Tab" && event.shiftKey) {
        event.preventDefault();
        if (tabs.length > 1) {
          const prev = (activeTabIndex - 1 + tabs.length) % tabs.length;
          onActivateTab(prev);
        }
        return;
      }
      // Ctrl+1-9: switch to tab by number
      if ((event.ctrlKey || event.metaKey) && event.key >= "1" && event.key <= "9") {
        const index = parseInt(event.key, 10) - 1;
        if (index < tabs.length) {
          event.preventDefault();
          onActivateTab(index);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tabs, activeTabIndex, onActivateTab, onCloseTab]);

  const handleTabClick = (index, event) => {
    // Middle click (button 1) closes tab
    if (event.button === 1) {
      event.preventDefault();
      onCloseTab(index);
      return;
    }
    // Left click activates
    if (event.button === 0) {
      onActivateTab(index);
    }
  };

  const handleCloseClick = (index, event) => {
    event.stopPropagation();
    onCloseTab(index);
  };

  // Drag and drop for reordering
  const handleDragStart = (index, event) => {
    setDraggedIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", index.toString());
    // Add dragging class for visual feedback
    setTimeout(() => {
      const ref = tabRefs.current[index];
      if (ref) ref.classList.add("dragging");
    }, 0);
  };

  const handleDragEnd = (index, event) => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    const ref = tabRefs.current[index];
    if (ref) ref.classList.remove("dragging");
    // Clean up all dragging classes
    tabRefs.current.forEach((ref) => {
      if (ref) ref.classList.remove("dragging", "drag-over");
    });
  };

  const handleDragOver = (index, event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (index !== draggedIndex) {
      setDragOverIndex(index);
      // Visual feedback
      tabRefs.current.forEach((ref, i) => {
        if (ref) {
          ref.classList.toggle("drag-over", i === index);
        }
      });
    }
  };

  const handleDrop = (index, event) => {
    event.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorderTabs(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    tabRefs.current.forEach((ref) => {
      if (ref) ref.classList.remove("dragging", "drag-over");
    });
  };

  const handleDragLeave = (index, event) => {
    // Only remove drag-over if leaving the tab strip entirely
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
      tabRefs.current.forEach((ref) => {
        if (ref) ref.classList.remove("drag-over");
      });
      setDragOverIndex(null);
    }
  };

  return (
    <div className="flex items-center gap-1 border-b border-border/60 px-2 pb-1" role="tablist" aria-label="Note tabs">
      {/* Tab list */}
      <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto" style={{ scrollbarWidth: "thin" }}>
        {tabs.map((tab, index) => {
          const isActive = index === activeTabIndex;
          const isDragging = index === draggedIndex;
          const isDragOver = index === dragOverIndex;

          return (
            <button
              key={tab.noteId}
              ref={(el) => { tabRefs.current[index] = el; }}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={getTabTitle(tab)}
              onClick={(e) => handleTabClick(index, e)}
              onMouseDown={(e) => e.button === 1 && e.preventDefault()} // Prevent text selection on middle click
              onDragStart={(e) => handleDragStart(index, e)}
              onDragEnd={(e) => handleDragEnd(index, e)}
              onDragOver={(e) => handleDragOver(index, e)}
              onDrop={(e) => handleDrop(index, e)}
              onDragLeave={(e) => handleDragLeave(index, e)}
              draggable
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] rounded-t-[6px] transition",
                "whitespace-nowrap min-w-[120px] max-w-[200px]",
                isActive
                  ? "bg-accent text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                isDragging && "opacity-50",
                isDragOver && "bg-primary/10 border-t-2 border-primary",
                tab.isReadOnly && "opacity-70"
              )}
              style={{ zIndex: isDragging ? 10 : isDragOver ? 5 : 0 }}
            >
              {/* Read-only indicator */}
              {tab.isReadOnly && (
                <span className="flex items-center text-[9px] text-muted-foreground" title="Read-only (open in another pane)">
                  🔒
                </span>
              )}
              {/* Tab title */}
              <span className="truncate flex-1" title={getTabTitle(tab)}>
                {getTabTitle(tab)}
              </span>
              {/* Unsaved indicator - would need to track per-tab unsaved state */}
              {/* Close button */}
              <button
                type="button"
                onClick={(e) => handleCloseClick(index, e)}
                className={cn(
                  "flex shrink-0 items-center justify-center w-5 h-5 rounded transition",
                  "opacity-0 group-hover:opacity-100",
                  isActive ? "opacity-100" : ""
                )}
                aria-label={`Close ${getTabTitle(tab)}`}
                tabIndex={-1}
              >
                <X className="h-3 w-3" />
              </button>
            </button>
          );
        })}
      </div>

      {/* New tab button */}
      <button
        type="button"
        onClick={onNewTab}
        className={cn(
          "flex shrink-0 items-center justify-center w-8 h-8 rounded transition",
          "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
        aria-label="New tab (Ctrl+T)"
        title="New tab (Ctrl+T)"
      >
        <Plus className="h-4 w-4" />
      </button>

      {/* Split button */}
      <button
        type="button"
        onClick={onSplit}
        className={cn(
          "flex shrink-0 items-center justify-center w-8 h-8 rounded transition ml-1",
          splitEnabled
            ? "text-primary bg-primary/10 hover:bg-primary/20"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
        aria-label={splitEnabled ? "Unsplit" : "Split view"}
        aria-pressed={splitEnabled}
        title={splitEnabled ? "Unsplit" : "Split view"}
      >
        <Columns className="h-4 w-4" />
      </button>

      {/* Scroll buttons for overflow */}
      <div className="flex items-center gap-0.5 ml-auto shrink-0">
        <button
          type="button"
          className="p-1 rounded hover:bg-accent transition"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="p-1 rounded hover:bg-accent transition"
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}