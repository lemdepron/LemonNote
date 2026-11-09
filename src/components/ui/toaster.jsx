import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const ICON_CLASSES = {
  success: "text-green-500",
  error: "text-destructive",
  info: "text-primary",
};

const BG_CLASSES = {
  success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
  error: "bg-destructive/10 dark:bg-destructive/20 border-destructive/30",
  info: "bg-primary/10 dark:bg-primary/20 border-primary/30",
};

const TEXT_CLASSES = {
  success: "text-green-700 dark:text-green-300",
  error: "text-destructive",
  info: "text-primary",
};

function ToastItem({ toast, onDismiss }) {
  const Icon = ICONS[toast.type] || ICONS.info;
  const iconClass = ICON_CLASSES[toast.type] || ICON_CLASSES.info;
  const bgClass = BG_CLASSES[toast.type] || BG_CLASSES.info;
  const textClass = TEXT_CLASSES[toast.type] || TEXT_CLASSES.info;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative flex items-start gap-3 rounded-lg border p-3.5 shadow-lg",
        "min-w-[280px] max-w-[360px]",
        "animate-in slide-in-from-top-2 duration-300 ease-out",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-right-2",
        bgClass,
        textClass
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", iconClass)} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] leading-relaxed">{toast.text}</p>
        {toast.actionLabel && toast.onAction && (
          <button
            type="button"
            onClick={() => {
              toast.onAction();
              onDismiss(toast.id);
            }}
            className={cn(
              "mt-2 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium",
              "transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
              "hover:bg-black/10 dark:hover:bg-white/10"
            )}
          >
            {toast.actionLabel}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useToast();
  const [mounted, setMounted] = useState(false);
  const portalRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    // Create portal container if it doesn't exist
    if (!document.getElementById("toast-portal")) {
      const div = document.createElement("div");
      div.id = "toast-portal";
      document.body.appendChild(div);
      portalRef.current = div;
    } else {
      portalRef.current = document.getElementById("toast-portal");
    }
    return () => {
      if (portalRef.current && portalRef.current.parentNode) {
        portalRef.current.parentNode.removeChild(portalRef.current);
      }
    };
  }, []);

  if (!mounted) return null;

  if (toasts.length === 0) return null;

  const dismiss = (id) => {
    const { store } = require("@/lib/toast");
    store.remove(id);
  };

  const content = (
    <div
      id="toast-portal"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full">
          <ToastItem toast={toast} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );

  return createPortal(content, portalRef.current);
}