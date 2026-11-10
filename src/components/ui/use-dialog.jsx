import { useState, useCallback, useRef, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent as AlertDialogContentExport,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  AlertDialog as AlertDialogPrimitive,
} from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import * as React from "react";

/**
 * A reusable in-app dialog system that replaces window.confirm, window.prompt, and window.alert.
 * Uses the existing alert-dialog components and follows the theme.
 * 
 * Usage:
 *   const { confirm, prompt } = useDialog();
 *   const ok = await confirm("Delete this?", { danger: true });
 *   const name = await prompt("Enter name:", "default");
 */

// Internal prompt dialog with input field
function PromptDialogContent({ open, onOpenChange, title, description, defaultValue, onConfirm, onCancel }) {
  const [value, setValue] = useState(defaultValue || "");
  const inputRef = useRef(null);
  const initialFocusRef = useRef(true);

  useEffect(() => {
    if (open && inputRef.current && initialFocusRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      initialFocusRef.current = false;
    } else if (!open) {
      initialFocusRef.current = true;
    }
  }, [open]);

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onConfirm(value);
      onOpenChange(false);
    } else if (event.key === "Escape") {
      onCancel();
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <AlertDialogPrimitive.Content
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          "sm:rounded-lg"
        )}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">{title}</AlertDialogTitle>
          {description && <AlertDialogDescription className="text-sm text-muted-foreground">{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <div className="grid gap-2">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="h-9 w-full rounded-md border border-border/70 bg-card/60 px-3 text-sm text-foreground outline-none focus:border-primary/40"
            placeholder={defaultValue}
          />
        </div>
        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <AlertDialogCancel
            onClick={() => {
              onCancel();
              onOpenChange(false);
            }}
            className={cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0")}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm(value);
              onOpenChange(false);
            }}
            className={cn(buttonVariants())}
          >
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}

// Internal confirm dialog
function ConfirmDialogContent({ open, onOpenChange, title, description, danger, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <AlertDialogPrimitive.Content
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          "sm:rounded-lg"
        )}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">{title}</AlertDialogTitle>
          {description && <AlertDialogDescription className="text-sm text-muted-foreground">{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <AlertDialogCancel
            onClick={() => {
              onCancel();
              onOpenChange(false);
            }}
            className={cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0")}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={cn(
              buttonVariants(),
              danger && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {danger ? "Delete" : "OK"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}

// Simple alert dialog (for future use)
function SimpleAlertDialogContent({ open, onOpenChange, title, description, onConfirm }) {
  if (!open) return null;

  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <AlertDialogPrimitive.Content
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          "sm:rounded-lg"
        )}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">{title}</AlertDialogTitle>
          {description && <AlertDialogDescription className="text-sm text-muted-foreground">{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={cn(buttonVariants(), "mt-2 sm:mt-0 w-full sm:w-auto")}
          >
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}

// Provider component that holds the dialog state
function DialogProvider({ children }) {
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    description: "",
    danger: false,
    resolve: null,
  });

  const [promptState, setPromptState] = useState({
    open: false,
    title: "",
    description: "",
    defaultValue: "",
    resolve: null,
  });

  const [alertState, setAlertState] = useState({
    open: false,
    title: "",
    description: "",
    resolve: null,
  });

  const confirm = useCallback((text, options = {}) => {
    return new Promise((resolve) => {
      setConfirmState({
        open: true,
        title: options.title || "Confirm",
        description: text,
        danger: options.danger === true,
        resolve,
      });
    });
  }, []);

  const prompt = useCallback((text, defaultValue = "") => {
    return new Promise((resolve) => {
      setPromptState({
        open: true,
        title: "Input",
        description: text,
        defaultValue,
        resolve,
      });
    });
  }, []);

  const alert = useCallback((text, options = {}) => {
    return new Promise((resolve) => {
      setAlertState({
        open: true,
        title: options.title || "Alert",
        description: text,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback((result) => {
    if (confirmState.resolve) {
      confirmState.resolve(result);
    }
    setConfirmState((prev) => ({ ...prev, open: false, resolve: null }));
  }, [confirmState.resolve]);

  const handlePrompt = useCallback((value) => {
    if (promptState.resolve) {
      promptState.resolve(value);
    }
    setPromptState((prev) => ({ ...prev, open: false, resolve: null }));
  }, [promptState.resolve]);

  const handlePromptCancel = useCallback(() => {
    if (promptState.resolve) {
      promptState.resolve(null);
    }
    setPromptState((prev) => ({ ...prev, open: false, resolve: null }));
  }, [promptState.resolve]);

  const handleAlert = useCallback(() => {
    if (alertState.resolve) {
      alertState.resolve(true);
    }
    setAlertState((prev) => ({ ...prev, open: false, resolve: null }));
  }, [alertState.resolve]);

  return (
    <>
      {children}
      <ConfirmDialogContent
        open={confirmState.open}
        onOpenChange={(open) => {
          if (!open && confirmState.resolve) {
            confirmState.resolve(false);
            setConfirmState((prev) => ({ ...prev, open: false, resolve: null }));
          }
        }}
        title={confirmState.title}
        description={confirmState.description}
        danger={confirmState.danger}
        onConfirm={() => handleConfirm(true)}
        onCancel={() => handleConfirm(false)}
      />
      <PromptDialogContent
        open={promptState.open}
        onOpenChange={(open) => {
          if (!open && promptState.resolve) {
            promptState.resolve(null);
            setPromptState((prev) => ({ ...prev, open: false, resolve: null }));
          }
        }}
        title={promptState.title}
        description={promptState.description}
        defaultValue={promptState.defaultValue}
        onConfirm={handlePrompt}
        onCancel={handlePromptCancel}
      />
      <SimpleAlertDialogContent
        open={alertState.open}
        onOpenChange={(open) => {
          if (!open && alertState.resolve) {
            alertState.resolve(true);
            setAlertState((prev) => ({ ...prev, open: false, resolve: null }));
          }
        }}
        title={alertState.title}
        description={alertState.description}
        onConfirm={handleAlert}
      />
    </>
  );
}

// Context for accessing dialog functions anywhere in the tree
const DialogContext = React.createContext(null);

export function DialogProviderWrapper({ children }) {
  return (
    <DialogProvider>
      <DialogContext.Provider value={null}>
        {children}
      </DialogContext.Provider>
    </DialogProvider>
  );
}

/**
 * Hook to access the dialog functions. Must be used within a DialogProviderWrapper.
 * For components that can't be wrapped, use the standalone functions below.
 */
export function useDialog() {
  const context = React.useContext(DialogContext);
  if (context) return context;

  // Fallback: create local state (for components not wrapped in provider)
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    description: "",
    danger: false,
    resolve: null,
  });

  const [promptState, setPromptState] = useState({
    open: false,
    title: "",
    description: "",
    defaultValue: "",
    resolve: null,
  });

  const confirm = useCallback((text, options = {}) => {
    return new Promise((resolve) => {
      setConfirmState({
        open: true,
        title: options.title || "Confirm",
        description: text,
        danger: options.danger === true,
        resolve,
      });
    });
  }, []);

  const prompt = useCallback((text, defaultValue = "") => {
    return new Promise((resolve) => {
      setPromptState({
        open: true,
        title: "Input",
        description: text,
        defaultValue,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback((result) => {
    if (confirmState.resolve) {
      confirmState.resolve(result);
    }
    setConfirmState((prev) => ({ ...prev, open: false, resolve: null }));
  }, [confirmState.resolve]);

  const handlePrompt = useCallback((value) => {
    if (promptState.resolve) {
      promptState.resolve(value);
    }
    setPromptState((prev) => ({ ...prev, open: false, resolve: null }));
  }, [promptState.resolve]);

  const handlePromptCancel = useCallback(() => {
    if (promptState.resolve) {
      promptState.resolve(null);
    }
    setPromptState((prev) => ({ ...prev, open: false, resolve: null }));
  }, [promptState.resolve]);

  // Render the dialogs inline
  React.useEffect(() => {
    // Dialogs are rendered below
  }, []);

  return {
    confirm,
    prompt,
    // Internal render functions for the component to use
    _confirmDialog: (
      <ConfirmDialogContent
        open={confirmState.open}
        onOpenChange={(open) => {
          if (!open && confirmState.resolve) {
            confirmState.resolve(false);
            setConfirmState((prev) => ({ ...prev, open: false, resolve: null }));
          }
        }}
        title={confirmState.title}
        description={confirmState.description}
        danger={confirmState.danger}
        onConfirm={() => handleConfirm(true)}
        onCancel={() => handleConfirm(false)}
      />
    ),
    _promptDialog: (
      <PromptDialogContent
        open={promptState.open}
        onOpenChange={(open) => {
          if (!open && promptState.resolve) {
            promptState.resolve(null);
            setPromptState((prev) => ({ ...prev, open: false, resolve: null }));
          }
        }}
        title={promptState.title}
        description={promptState.description}
        defaultValue={promptState.defaultValue}
        onConfirm={handlePrompt}
        onCancel={handlePromptCancel}
      />
    ),
  };
}

/**
 * Standalone dialog functions that create their own portal-mounted dialogs.
 * These can be used anywhere without a provider wrapper.
 * Note: These create a new React root each time, so they're heavier than the hook version.
 */
let confirmRoot = null;
let promptRoot = null;
let alertRoot = null;
let confirmContainer = null;
let promptContainer = null;
let alertContainer = null;

function createContainer() {
  if (typeof document === "undefined") return null;
  const container = document.createElement("div");
  document.body.appendChild(container);
  return container;
}

function getConfirmContainer() {
  if (!confirmContainer) confirmContainer = createContainer();
  return confirmContainer;
}

function getPromptContainer() {
  if (!promptContainer) promptContainer = createContainer();
  return promptContainer;
}

function getAlertContainer() {
  if (!alertContainer) alertContainer = createContainer();
  return alertContainer;
}

// Import createRoot dynamically to avoid SSR issues
async function getCreateRoot() {
  if (typeof window === "undefined") return null;
  const { createRoot } = await import("react-dom/client");
  return createRoot;
}

/**
 * Standalone confirm dialog - can be used anywhere without provider
 * Returns Promise<boolean>
 */
export async function confirm(text, options = {}) {
  if (typeof window === "undefined") return false;
  
  const { createRoot } = await getCreateRoot();
  if (!createRoot) return window.confirm(text); // fallback
  
  const container = getConfirmContainer();
  if (!container) return window.confirm(text);

  return new Promise((resolve) => {
    let resolved = false;
    
    const cleanup = () => {
      if (confirmRoot) {
        confirmRoot.unmount();
        confirmRoot = null;
      }
    };

    const ConfirmDialog = () => (
      <ConfirmDialogContent
        open={true}
        onOpenChange={(open) => {
          if (!open && !resolved) {
            resolved = true;
            resolve(false);
            cleanup();
          }
        }}
        title={options.title || "Confirm"}
        description={text}
        danger={options.danger === true}
        onConfirm={() => {
          if (!resolved) {
            resolved = true;
            resolve(true);
            cleanup();
          }
        }}
        onCancel={() => {
          if (!resolved) {
            resolved = true;
            resolve(false);
            cleanup();
          }
        }}
      />
    );

    confirmRoot = createRoot(container);
    confirmRoot.render(<ConfirmDialog />);
  });
}

/**
 * Standalone prompt dialog - can be used anywhere without provider
 * Returns Promise<string | null> (null if cancelled)
 */
export async function prompt(text, defaultValue = "") {
  if (typeof window === "undefined") return null;
  
  const { createRoot } = await getCreateRoot();
  if (!createRoot) return window.prompt(text, defaultValue); // fallback
  
  const container = getPromptContainer();
  if (!container) return window.prompt(text, defaultValue);

  return new Promise((resolve) => {
    let resolved = false;
    
    const cleanup = () => {
      if (promptRoot) {
        promptRoot.unmount();
        promptRoot = null;
      }
    };

    const PromptDialog = () => (
      <PromptDialogContent
        open={true}
        onOpenChange={(open) => {
          if (!open && !resolved) {
            resolved = true;
            resolve(null);
            cleanup();
          }
        }}
        title="Input"
        description={text}
        defaultValue={defaultValue}
        onConfirm={(value) => {
          if (!resolved) {
            resolved = true;
            resolve(value);
            cleanup();
          }
        }}
        onCancel={() => {
          if (!resolved) {
            resolved = true;
            resolve(null);
            cleanup();
          }
        }}
      />
    );

    promptRoot = createRoot(container);
    promptRoot.render(<PromptDialog />);
  });
}

/**
 * Standalone alert dialog - can be used anywhere without provider
 * Returns Promise<void>
 */
export async function alert(text, options = {}) {
  if (typeof window === "undefined") return;
  
  const { createRoot } = await getCreateRoot();
  if (!createRoot) return window.alert(text); // fallback
  
  const container = getAlertContainer();
  if (!container) return window.alert(text);

  return new Promise((resolve) => {
    let resolved = false;
    
    const cleanup = () => {
      if (alertRoot) {
        alertRoot.unmount();
        alertRoot = null;
      }
    };

    const AlertDialog = () => (
      <SimpleAlertDialogContent
        open={true}
        onOpenChange={(open) => {
          if (!open && !resolved) {
            resolved = true;
            resolve();
            cleanup();
          }
        }}
        title={options.title || "Alert"}
        description={text}
        onConfirm={() => {
          if (!resolved) {
            resolved = true;
            resolve();
            cleanup();
          }
        }}
      />
    );

    alertRoot = createRoot(container);
    alertRoot.render(<AlertDialog />);
  });
}