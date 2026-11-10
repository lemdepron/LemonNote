import { useEffect, useState, useCallback } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { toast } from "@/lib/toast";
import { isTauri } from "@/lib/utils";

let updateCheckInProgress = false;
let lastCheckTime = 0;
const CHECK_COOLDOWN = 5 * 60 * 1000; // 5 minutes

export function useUpdater() {
  const [update, setUpdate] = useState(null);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const checkForUpdate = useCallback(async (silent = false) => {
    if (!isTauri()) {
      if (!silent) {
        toast.info("Update check only works in the installed app.");
      }
      return null;
    }

    if (updateCheckInProgress) {
      if (!silent) toast.info("Update check already in progress...");
      return null;
    }

    const now = Date.now();
    if (now - lastCheckTime < CHECK_COOLDOWN && silent) {
      return update;
    }

    updateCheckInProgress = true;
    lastCheckTime = now;
    setChecking(true);

    try {
      const availableUpdate = await check();
      if (availableUpdate) {
        setUpdate(availableUpdate);
        if (!silent) {
          const toastId = toast(
            `Update ${availableUpdate.version} available!`,
            {
              type: "info",
              actionLabel: "Install",
              onAction: () => handleInstall(availableUpdate),
              duration: 0, // persistent until dismissed or action taken
            }
          );
          // Store toast ID on update for potential dismissal
          availableUpdate._toastId = toastId;
        }
        return availableUpdate;
      } else {
        setUpdate(null);
        if (!silent) {
          toast.success("You are on the latest version.");
        }
        return null;
      }
    } catch (err) {
      console.error("Update check failed:", err);
      if (!silent) {
        toast.error(`Update check failed: ${err.message}`);
      }
      return null;
    } finally {
      updateCheckInProgress = false;
      setChecking(false);
    }
  }, [update]);

  const handleInstall = useCallback(async (updateToInstall) => {
    if (!updateToInstall) return;

    setDownloading(true);
    setDownloadProgress(0);

    try {
      await updateToInstall.downloadAndInstall((event) => {
        if (event.progress) {
          setDownloadProgress(event.progress);
        }
      });
      // On Windows, downloadAndInstall launches the installer and exits the app
      // On macOS/Linux, we need to relaunch
      if (window.__TAURI__?.process?.relaunch) {
        await window.__TAURI__.process.relaunch();
      }
    } catch (err) {
      console.error("Update install failed:", err);
      toast.error(`Update install failed: ${err.message}`);
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    if (update?._toastId) {
      // We can't easily dismiss a specific toast from the store, but we can clear it
      // The toast will auto-dismiss on action or we just ignore it
    }
    setUpdate(null);
  }, [update]);

  return {
    update,
    checking,
    downloading,
    downloadProgress,
    checkForUpdate,
    handleInstall,
    dismissUpdate,
  };
}

export function useAutoUpdateCheck() {
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Check for updates on app start (after a short delay to let UI load)
    const timer = setTimeout(() => {
      // We don't use the hook here to avoid circular dependency, just call check directly
      if (isTauri()) {
        check().then((availableUpdate) => {
          if (availableUpdate) {
            toast(
              `Update ${availableUpdate.version} available!`,
              {
                type: "info",
                actionLabel: "Install",
                onAction: async () => {
                  setDownloading(true);
                  try {
                    await availableUpdate.downloadAndInstall();
                    if (window.__TAURI__?.process?.relaunch) {
                      await window.__TAURI__.process.relaunch();
                    }
                  } catch (err) {
                    toast.error(`Update install failed: ${err.message}`);
                  } finally {
                    setDownloading(false);
                  }
                },
                duration: 0,
              }
            );
          }
        }).catch((err) => {
          console.error("Auto update check failed:", err);
        });
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);
}