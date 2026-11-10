/**
 * Mirror hook - manages the mirror to folder feature.
 * Handles debounced auto-mirror on note save and manual mirror.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { isTauri } from "@/lib/utils";
import {
  getMirrorFolder,
  saveMirrorFolder,
  getMirrorEnabled,
  saveMirrorEnabled,
  getAutoMirror,
  saveAutoMirror,
  pickMirrorFolder,
  mirrorAllNotes,
} from "@/lib/mirror";
import { subscribePrefs } from "@/lib/preferences";
import { toast } from "@/lib/toast";

let mirrorDebounceTimer = null;
const MIRROR_DEBOUNCE_MS = 5000; // 5 seconds debounce

export function useMirror() {
  const [mirrorFolder, setMirrorFolderState] = useState(() => getMirrorFolder());
  const [mirrorEnabled, setMirrorEnabledState] = useState(() => getMirrorEnabled());
  const [autoMirror, setAutoMirrorState] = useState(() => getAutoMirror());
  const [isMirroring, setIsMirroring] = useState(false);
  const [mirrorProgress, setMirrorProgress] = useState(null);
  const [lastMirrorTime, setLastMirrorTime] = useState(null);
  const [mirrorError, setMirrorError] = useState(null);
  
  const progressRef = useRef({ current: 0, total: 0 });
  
  // Subscribe to preference changes
  useEffect(() => {
    const unsub = subscribePrefs(() => {
      setMirrorFolderState(getMirrorFolder());
      setMirrorEnabledState(getMirrorEnabled());
      setAutoMirrorState(getAutoMirror());
    });
    return unsub;
  }, []);
  
  // Listen for note:saved events to trigger auto-mirror
  useEffect(() => {
    const handleNoteSaved = () => {
      if (!mirrorEnabled || !autoMirror || !mirrorFolder) return;
      if (typeof window.__TAURI__ === "undefined") return; // Only in Tauri
      
      // Debounce the mirror
      if (mirrorDebounceTimer) {
        clearTimeout(mirrorDebounceTimer);
      }
      mirrorDebounceTimer = setTimeout(() => {
        triggerAutoMirror();
      }, MIRROR_DEBOUNCE_MS);
    };
    
    // Listen for the note:saved event
    window.addEventListener("note:saved", handleNoteSaved);
    
    return () => {
      window.removeEventListener("note:saved", handleNoteSaved);
      if (mirrorDebounceTimer) {
        clearTimeout(mirrorDebounceTimer);
      }
    };
  }, [mirrorEnabled, autoMirror, mirrorFolder]);
  
  const setMirrorFolder = useCallback((path) => {
    setMirrorFolderState(path);
    saveMirrorFolder(path);
  }, []);
  
  const setMirrorEnabled = useCallback((enabled) => {
    setMirrorEnabledState(enabled);
    saveMirrorEnabled(enabled);
  }, []);
  
  const setAutoMirror = useCallback((enabled) => {
    setAutoMirrorState(enabled);
    saveAutoMirror(enabled);
  }, []);
  
  const handlePickFolder = useCallback(async () => {
    if (typeof window.__TAURI__ === "undefined") {
      toast.error("Folder picker only works in the installed app");
      return;
    }
    
    const folder = await pickMirrorFolder();
    if (folder) {
      setMirrorFolder(folder);
      toast.success("Mirror folder set");
    }
  }, [setMirrorFolder]);
  
  const triggerAutoMirror = useCallback(async () => {
    if (!mirrorEnabled || !mirrorFolder) return;
    if (isMirroring) return;
    
    await doMirror({ silent: true });
  }, [mirrorEnabled, mirrorFolder, isMirroring]);
  
  const doMirror = useCallback(async (options = {}) => {
    const { silent = false, onComplete } = options;
    
    if (!mirrorFolder) {
      if (!silent) toast.error("No mirror folder selected");
      return { success: false, error: "No mirror folder" };
    }
    
    if (typeof window.__TAURI__ === "undefined") {
      if (!silent) toast.error("Mirror only works in the installed app");
      return { success: false, error: "Not in Tauri" };
    }
    
    if (isMirroring) {
      if (!silent) toast.info("Mirror already in progress");
      return { success: false, error: "Already mirroring" };
    }
    
    setIsMirroring(true);
    setMirrorError(null);
    setMirrorProgress({ current: 0, total: 0, phase: "starting" });
    progressRef.current = { current: 0, total: 0 };
    
    try {
      const results = await mirrorAllNotes(mirrorFolder, {
        onProgress: (update) => {
          if (update.type === "progress") {
            progressRef.current = { current: update.current, total: update.total };
            setMirrorProgress({
              current: update.current,
              total: update.total,
              phase: "notes",
              currentNote: update.note,
            });
          }
        },
      });
      
      setLastMirrorTime(new Date().toISOString());
      setMirrorProgress({ 
        current: results.notes.length, 
        total: results.notes.length, 
        phase: "complete" 
      });
      
      if (!silent) {
        const errorCount = results.errors.length;
        if (errorCount > 0) {
          toast.success(`Mirrored ${results.notes.length} notes, ${errorCount} errors`);
        } else {
          toast.success(`Mirrored ${results.notes.length} notes`);
        }
      }
      
      onComplete?.(results);
      return { success: true, results };
      
    } catch (err) {
      setMirrorError(err.message);
      if (!silent) toast.error(`Mirror failed: ${err.message}`);
      onComplete?.({ success: false, error: err.message });
      return { success: false, error: err.message };
      
    } finally {
      setIsMirroring(false);
      // Clear progress after a delay
      setTimeout(() => setMirrorProgress(null), 3000);
    }
  }, [mirrorFolder, isMirroring]);
  
  const handleMirrorNow = useCallback(() => {
    doMirror({ silent: false });
  }, [doMirror]);
  
  const clearMirrorFolder = useCallback(() => {
    setMirrorFolder("");
    toast.success("Mirror folder cleared");
  }, [setMirrorFolder]);
  
  // Format last mirror time for display
  const formattedLastMirror = lastMirrorTime 
    ? new Date(lastMirrorTime).toLocaleString() 
    : null;
  
  return {
    // State
    mirrorFolder,
    mirrorEnabled,
    autoMirror,
    isMirroring,
    mirrorProgress,
    lastMirrorTime: formattedLastMirror,
    mirrorError,
    isTauri: isTauri(),
    
    // Actions
    setMirrorFolder,
    setMirrorEnabled,
    setAutoMirror,
    handlePickFolder,
    handleMirrorNow,
    clearMirrorFolder,
    
    // Computed
    canMirror: mirrorEnabled && mirrorFolder && isTauri(),
    progressPercent: mirrorProgress && mirrorProgress.total > 0
      ? Math.round((mirrorProgress.current / mirrorProgress.total) * 100)
      : 0,
  };
}