import { createContext, useContext, useState, useCallback, useMemo } from "react";

const PaneFocusContext = createContext(null);

/**
 * Provider for tracking which note pane has focus.
 * The ribbon consumes this to know which editor to target.
 */
export function PaneFocusProvider({ children }) {
  const [panes, setPanes] = useState(new Map());
  const [focusedPaneId, setFocusedPaneId] = useState(null);

  const registerPane = useCallback((paneId, { editorRef, noteId, isReadOnly }) => {
    setPanes((prev) => {
      const next = new Map(prev);
      next.set(paneId, { editorRef, noteId, isReadOnly });
      return next;
    });
  }, []);

  const unregisterPane = useCallback((paneId) => {
    setPanes((prev) => {
      const next = new Map(prev);
      next.delete(paneId);
      return next;
    });
    setFocusedPaneId((current) => (current === paneId ? null : current));
  }, []);

  const focusPane = useCallback((paneId) => {
    setFocusedPaneId(paneId);
  }, []);

  const focusedPane = useMemo(() => panes.get(focusedPaneId) || null, [panes, focusedPaneId]);

  const value = useMemo(
    () => ({
      panes,
      focusedPaneId,
      focusedPane,
      registerPane,
      unregisterPane,
      focusPane,
    }),
    [panes, focusedPaneId, focusedPane, registerPane, unregisterPane, focusPane]
  );

  return <PaneFocusContext.Provider value={value}>{children}</PaneFocusContext.Provider>;
}

/**
 * Hook to access pane focus context.
 * Returns focused pane info and registration functions.
 */
export function usePaneFocus() {
  const context = useContext(PaneFocusContext);
  if (!context) {
    throw new Error("usePaneFocus must be used within a PaneFocusProvider");
  }
  return context;
}