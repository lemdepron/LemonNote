import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { applyTheme, emitEvent, subscribeExtensions } from "@/lib/extensions";
import { spaceForPath } from "@/lib/spaces";
import { subscribeTheme } from "@/lib/theme";

export default function ExtensionRuntime() {
  const { pathname } = useLocation();

  useEffect(() => {
    applyTheme();
    const stopExtensions = subscribeExtensions(applyTheme);
    // Palettes carry a light and a dark set, so re-apply whenever the mode flips.
    const stopTheme = subscribeTheme(applyTheme);
    return () => {
      stopExtensions();
      stopTheme();
    };
  }, []);

  useEffect(() => {
    emitEvent("space:entered", { space: spaceForPath(pathname)?.id || "none", path: pathname });
  }, [pathname]);

  return null;
}