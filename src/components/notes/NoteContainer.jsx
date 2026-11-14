import { useEffect, useCallback, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PaneFocusProvider, usePaneFocus } from "@/context/PaneFocusContext";
import useNoteTabs from "@/hooks/useNoteTabs";
import NotePane from "./NotePane";
import NoteTabs from "./NoteTabs";
import SplitDivider from "./SplitDivider";
import { ScrollProvider, ScrollAwareTopArea } from "@/lib/ScrollContext";

/**
 * Internal component that has access to PaneFocusContext.
 * Renders the tab strip and panes.
 */
function NoteContainerInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tabs, activeTabIndex, splitConfig, openTab, closeTab, reorderTabs, setActiveTab, toggleSplit, setSplitRatio, getActiveTabForPane, isNoteOpenInOtherPane, setTabReadOnly } = useNoteTabs();
  const { focusedPaneId } = usePaneFocus();

  // Track which pane IDs are in use
  const [paneIds] = useState(() => ["pane-0", "pane-1"]);

  // Handle new tab from URL parameter (e.g., /note/abc123?newTab=1)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newTabParam = params.get("newTab");
    const noteIdFromUrl = location.pathname.split("/note/")[1];

    if (newTabParam === "1" && noteIdFromUrl && noteIdFromUrl !== "new") {
      // Open in new tab
      openTab(noteIdFromUrl);
      // Clean up URL
      navigate(location.pathname, { replace: true });
    } else if (noteIdFromUrl && noteIdFromUrl !== "new" && tabs.length === 0) {
      // First load: open the note from URL as first tab
      openTab(noteIdFromUrl);
    }
  }, [location, tabs.length, openTab, navigate]);

  // Update read-only state when tabs change
  useEffect(() => {
    tabs.forEach((tab) => {
      const otherPaneTabs = tabs.filter((t) => t.paneIndex !== tab.paneIndex);
      const isDuplicate = otherPaneTabs.some((t) => t.noteId === tab.noteId);
      if (isDuplicate !== tab.isReadOnly) {
        setTabReadOnly(tab.noteId, isDuplicate);
      }
    });
  }, [tabs, setTabReadOnly]);

  // Get active tab for each pane
  const activeTabPane0 = getActiveTabForPane(0);
  const activeTabPane1 = getActiveTabForPane(1);

  // Determine which pane has focus for keyboard shortcuts
  const focusedPaneIndex = focusedPaneId === paneIds[0] ? 0 : focusedPaneId === paneIds[1] ? 1 : -1;

  const handleTabFocus = useCallback((paneId) => {
    // Focus is handled by PaneFocusContext
  }, []);

  const handleTabClose = useCallback((paneIndex) => {
    const activeTab = paneIndex === 0 ? activeTabPane0 : activeTabPane1;
    if (activeTab) {
      closeTab(tabs.indexOf(activeTab));
    }
  }, [activeTabPane0, activeTabPane1, closeTab, tabs]);

  const handleSplit = useCallback(() => {
    toggleSplit();
    // When enabling split, if only one tab exists, open vault home in second pane
    if (!splitConfig.enabled && tabs.length === 1) {
      // Could open a new note or vault home - for now just toggle
    }
  }, [splitConfig.enabled, tabs.length, toggleSplit]);

  const handleNewTab = useCallback(() => {
    // Open vault home or create new note
    // For now, navigate to vault home which has "Write the first one" link
    navigate("/");
  }, [navigate]);

  // Render single pane (no split)
  const renderSinglePane = () => {
    if (!activeTabPane0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">No note open. Click + to open a note.</p>
        </div>
      );
    }

    return (
      <NotePane
        key={activeTabPane0.noteId}
        noteId={activeTabPane0.noteId}
        paneId={paneIds[0]}
        isReadOnly={activeTabPane0.isReadOnly}
        onFocus={handleTabFocus}
        onClose={() => handleTabClose(0)}
        onSplit={handleSplit}
        isInSplit={false}
      />
    );
  };

  // Render split panes
  const renderSplitPanes = () => {
    const leftRatio = splitConfig.ratio * 100;
    const rightRatio = 100 - leftRatio;

    return (
      <div className="flex-1 flex h-full overflow-hidden">
        {/* Left pane */}
        <div className="flex flex-col h-full" style={{ flex: `0 0 ${leftRatio}%`, minWidth: 0 }}>
          {activeTabPane0 ? (
            <NotePane
              key={activeTabPane0.noteId}
              noteId={activeTabPane0.noteId}
              paneId={paneIds[0]}
              isReadOnly={activeTabPane0.isReadOnly}
              onFocus={handleTabFocus}
              onClose={() => handleTabClose(0)}
              onSplit={handleSplit}
              isInSplit={true}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-card/30 border-r border-border/60">
              <p className="text-muted-foreground">Drop a tab here or click +</p>
            </div>
          )}
        </div>

        {/* Divider */}
        <SplitDivider
          ratio={splitConfig.ratio}
          onRatioChange={setSplitRatio}
          disabled={!activeTabPane0 || !activeTabPane1}
        />

        {/* Right pane */}
        <div className="flex flex-col h-full" style={{ flex: `0 0 ${rightRatio}%`, minWidth: 0 }}>
          {activeTabPane1 ? (
            <NotePane
              key={activeTabPane1.noteId}
              noteId={activeTabPane1.noteId}
              paneId={paneIds[1]}
              isReadOnly={activeTabPane1.isReadOnly}
              onFocus={handleTabFocus}
              onClose={() => handleTabClose(1)}
              onSplit={handleSplit}
              isInSplit={true}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Drop a tab here or click +</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <ScrollProvider>
      <div className="flex flex-col h-full min-h-0">
        {/* Tab strip - scroll aware */}
        <ScrollAwareTopArea className="flex-shrink-0" data-testid="note-tabs-area">
          <NoteTabs
            tabs={tabs}
            activeTabIndex={activeTabIndex}
            onActivateTab={setActiveTab}
            onCloseTab={closeTab}
            onReorderTabs={reorderTabs}
            onNewTab={handleNewTab}
            onSplit={handleSplit}
            splitEnabled={splitConfig.enabled}
          />
        </ScrollAwareTopArea>

        {/* Pane content */}
        {splitConfig.enabled ? renderSplitPanes() : renderSinglePane()}
      </div>
    </ScrollProvider>
  );
}

/**
 * Main NoteContainer component - entry point for /note/* routes.
 * Wraps everything in PaneFocusProvider.
 */
export default function NoteContainer() {
  return (
    <PaneFocusProvider>
      <div className="nb-shell min-h-screen flex flex-col">
        <NoteContainerInner />
      </div>
    </PaneFocusProvider>
  );
}