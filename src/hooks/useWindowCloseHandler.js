import { useEffect } from "react";
import { readPref } from "@/lib/preferences";
import { isTauri } from "@/lib/utils";
import { toast } from "@/lib/toast";

export function useWindowCloseHandler() {
  useEffect(() => {
    if (!isTauri()) return;

    const handleClose = async (event) => {
      // Check if minimize to tray is enabled
      const minimizeToTray = readPref("settings:minimizeToTray", false);
      
      if (minimizeToTray) {
        event.preventDefault();
        
        // Flush autosave before hiding
        try {
          const { flushAutosave } = await import("@/lib/notes");
          await flushAutosave();
        } catch (e) {
          console.error("Failed to flush autosave:", e);
        }

        // Hide the window
        try {
          const { getCurrentWindow } = await import("@tauri-apps/api/window");
          const window = getCurrentWindow();
          await window.hide();
        } catch (e) {
          console.error("Failed to hide window:", e);
        }

        // Show one-time toast
        const trayToastShown = readPref("settings:trayToastShown", false);
        if (!trayToastShown) {
          toast({
            text: "LemonNote is still running in the tray",
            type: "info",
            duration: 5000,
          });
          // Mark toast as shown
          const { writePref } = await import("@/lib/preferences");
          writePref("settings:trayToastShown", true);
        }
      }
    };

    // Listen for Tauri close event
    import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
      const window = getCurrentWindow();
      window.onCloseRequested(handleClose);
    });

    return () => {
      if (isTauri()) {
        import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
          const window = getCurrentWindow();
          window.onCloseRequested(() => {}); // Remove listener
        });
      }
    };
  }, []);
}