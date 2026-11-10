import { useState, useEffect, useCallback, useMemo } from "react";
import { readPref, writePref, subscribePrefs } from "@/lib/preferences";

const TABS_KEY = "openNoteTabs";
const ACTIVE_TAB_KEY = "activeNoteTab";
const SPLIT_CONFIG_KEY = "splitConfig";

/**
 * Hook for managing note tabs state (open tabs, active tab, split config).
 * State is persisted in localStorage via preferences system.
 */
export default function useNoteTabs() {
  // Load initial state from preferences
  const [tabs, setTabs] = useState(() => {
    try {
      const saved = readPref(TABS_KEY, []);
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const [activeTabIndex, setActiveTabIndex] = useState(() => {
    try {
      const saved = readPref(ACTIVE_TAB_KEY, 0);
      return typeof saved === "number" ? saved : 0;
    } catch {
      return 0;
    }
  });

  const [splitConfig, setSplitConfig] = useState(() => {
    try {
      const saved = readPref(SPLIT_CONFIG_KEY, { enabled: false, ratio: 0.5 });
      return saved && typeof saved === "object" ? saved : { enabled: false, ratio: 0.5 };
    } catch {
      return { enabled: false, ratio: 0.5 };
    }
  });

  // Persist changes to preferences
  const persistTabs = useCallback((nextTabs) => {
    writePref(TABS_KEY, nextTabs);
  }, []);

  const persistActiveTab = useCallback((index) => {
    writePref(ACTIVE_TAB_KEY, index);
  }, []);

  const persistSplitConfig = useCallback((config) => {
    writePref(SPLIT_CONFIG_KEY, config);
  }, []);

  // Subscribe to external preference changes (e.g., from another window)
  useEffect(() => {
    const unsubscribe = subscribePrefs(() => {
      // Reload from preferences on external change
      setTabs(Array.isArray(readPref(TABS_KEY, [])) ? readPref(TABS_KEY, []) : []);
      setActiveTabIndex(typeof readPref(ACTIVE_TAB_KEY, 0) === "number" ? readPref(ACTIVE_TAB_KEY, 0) : 0);
      const split = readPref(SPLIT_CONFIG_KEY, { enabled: false, ratio: 0.5 });
      setSplitConfig(split && typeof split === "object" ? split : { enabled: false, ratio: 0.5 });
    });
    return unsubscribe;
  }, []);

  // Validate and clamp activeTabIndex
  useEffect(() => {
    setActiveTabIndex((current) => {
      if (tabs.length === 0) return 0;
      return Math.max(0, Math.min(current, tabs.length - 1));
    });
  }, [tabs.length]);

  const openTab = useCallback((noteId, paneIndex = null) => {
    setTabs((current) => {
      // Check if already open
      const existingIndex = current.findIndex((tab) => tab.noteId === noteId);
      if (existingIndex !== -1) {
        // Already open, just activate it
        setActiveTabIndex(existingIndex);
        return current;
      }

      // Determine paneIndex if not provided
      let targetPaneIndex = paneIndex;
      if (targetPaneIndex === null) {
        if (splitConfig.enabled) {
          // Add to the pane with fewer tabs, or pane 0 if equal
          const pane0Count = current.filter((t) => t.paneIndex === 0).length;
          const pane1Count = current.filter((t) => t.paneIndex === 1).length;
          targetPaneIndex = pane0Count <= pane1Count ? 0 : 1;
        } else {
          targetPaneIndex = 0;
        }
      }

      const newTab = { noteId, paneIndex: targetPaneIndex, isReadOnly: false };
      const next = [...current, newTab];
      persistTabs(next);
      setActiveTabIndex(next.length - 1);
      return next;
    });
  }, [splitConfig.enabled, persistTabs]);

  const closeTab = useCallback((tabIndex) => {
    setTabs((current) => {
      if (tabIndex < 0 || tabIndex >= current.length) return current;
      const next = current.filter((_, i) => i !== tabIndex);
      persistTabs(next);

      // Adjust activeTabIndex
      setActiveTabIndex((active) => {
        if (next.length === 0) return 0;
        if (active >= next.length) return next.length - 1;
        if (active > tabIndex) return active - 1;
        return active;
      });
      return next;
    });
  }, [persistTabs]);

  const reorderTabs = useCallback((fromIndex, toIndex) => {
    setTabs((current) => {
      if (fromIndex < 0 || fromIndex >= current.length) return current;
      if (toIndex < 0 || toIndex >= current.length) return current;
      if (fromIndex === toIndex) return current;

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      persistTabs(next);

      // Update activeTabIndex if it was moved
      setActiveTabIndex((active) => {
        if (active === fromIndex) return toIndex;
        if (active > fromIndex && active <= toIndex) return active - 1;
        if (active < fromIndex && active >= toIndex) return active + 1;
        return active;
      });
      return next;
    });
  }, [persistTabs]);

  const setActiveTab = useCallback((index) => {
    setActiveTabIndex((current) => {
      if (index < 0 || index >= tabs.length) return current;
      persistActiveTab(index);
      return index;
    });
  }, [tabs.length, persistActiveTab]);

  const toggleSplit = useCallback(() => {
    setSplitConfig((current) => {
      const next = { ...current, enabled: !current.enabled };
      persistSplitConfig(next);

      // When disabling split, move all tabs to pane 0
      if (!next.enabled) {
        setTabs((currentTabs) =>
          currentTabs.map((tab) => ({ ...tab, paneIndex: 0 }))
        );
      }
      return next;
    });
  }, [persistSplitConfig]);

  const setSplitRatio = useCallback((ratio) => {
    const clamped = Math.max(0.2, Math.min(0.8, ratio));
    setSplitConfig((current) => {
      const next = { ...current, ratio: clamped };
      persistSplitConfig(next);
      return next;
    });
  }, [persistSplitConfig]);

  // Get tabs for a specific pane
  const getTabsForPane = useCallback((paneIndex) => {
    return tabs.filter((tab) => tab.paneIndex === paneIndex);
  }, [tabs]);

  // Get active tab for a specific pane
  const getActiveTabForPane = useCallback((paneIndex) => {
    const paneTabs = getTabsForPane(paneIndex);
    if (paneTabs.length === 0) return null;
    // Find the active tab in this pane, or first tab
    const activeInPane = paneTabs.find((tab) => tabs.indexOf(tab) === activeTabIndex);
    return activeInPane || paneTabs[0];
  }, [tabs, activeTabIndex, getTabsForPane]);

  // Check if a note is open in another pane (for read-only logic)
  const isNoteOpenInOtherPane = useCallback((noteId, currentPaneIndex) => {
    return tabs.some((tab) => tab.noteId === noteId && tab.paneIndex !== currentPaneIndex);
  }, [tabs]);

  // Mark a tab as read-only
  const setTabReadOnly = useCallback((noteId, isReadOnly) => {
    setTabs((current) => {
      const next = current.map((tab) =>
        tab.noteId === noteId ? { ...tab, isReadOnly } : tab
      );
      persistTabs(next);
      return next;
    });
  }, [persistTabs]);

  const value = useMemo(
    () => ({
      tabs,
      activeTabIndex,
      splitConfig,
      openTab,
      closeTab,
      reorderTabs,
      setActiveTab,
      toggleSplit,
      setSplitRatio,
      getTabsForPane,
      getActiveTabForPane,
      isNoteOpenInOtherPane,
      setTabReadOnly,
    }),
    [
      tabs,
      activeTabIndex,
      splitConfig,
      openTab,
      closeTab,
      reorderTabs,
      setActiveTab,
      toggleSplit,
      setSplitRatio,
      getTabsForPane,
      getActiveTabForPane,
      isNoteOpenInOtherPane,
      setTabReadOnly,
    ]
  );

  return value;
}